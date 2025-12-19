import React, { useEffect, useMemo, useRef } from "react";
import { ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import type { GLTF } from "three-stdlib";
import type { AnimationSegment } from "./animationSegments";

type ExtendedGLTF = GLTF;

interface GlbSegmentViewerProps {
  url: string;
  segmentIndex: number;
  segments: AnimationSegment[];
  arEnabled: boolean;
  placedTransform?: THREE.Matrix4 | null;
}

/**
 * ✅ FIXED segment playback:
 * Uses action.time (clip-local) instead of mixer.setTime() + reset().
 * This prevents later steps from restarting at 0 unexpectedly.
 */
const GlbSegmentViewer: React.FC<GlbSegmentViewerProps> = ({
  url,
  segmentIndex,
  segments,
  arEnabled,
  placedTransform,
}) => {
  const gltf = useGLTF(url) as ExtendedGLTF;
  const group = useRef<THREE.Group>(null!);

  const { scene, animations } = gltf;
  const { actions, mixer } = useAnimations(animations, group);

  const clip = useMemo(() => animations?.[0], [animations]);
  const action = clip ? actions[clip.name] : undefined;

  const renderCam = useThree((s) => s.camera as THREE.PerspectiveCamera);
  const controls = useThree((s) => (s as any).controls);

  const activeSegment = useMemo(() => {
    if (!segments?.length) return null;
    return segments[Math.min(segmentIndex, segments.length - 1)];
  }, [segments, segmentIndex]);

  // drag to rotate
  const isDragging = useRef(false);
  const lastX = useRef(0);

  // camera tween state (NON-AR)
  const camFromPos = useRef(new THREE.Vector3());
  const camToPos = useRef(new THREE.Vector3());
  const tgtFrom = useRef(new THREE.Vector3());
  const tgtTo = useRef(new THREE.Vector3());
  const fovFrom = useRef(45);
  const fovTo = useRef(45);
  const camT = useRef(1);
  const camDur = useRef(0.6);

  // cached segment bounds
  const segEnd = useRef(0);

  // Init action once
  useEffect(() => {
    if (!action || !clip) return;

    action.enabled = true;
    action.setLoop(THREE.LoopOnce, 1);
    action.clampWhenFinished = true;
    action.timeScale = 1;
    action.play();
    action.paused = true;

    console.log("Loaded clip:", clip.name, "duration:", clip.duration);
  }, [action, clip]);

  // On segment change: jump + play segment + set camera tween (non-AR)
  useEffect(() => {
    if (!action || !activeSegment || !clip) return;

    // Clamp to clip duration
    const start = Math.max(0, Math.min(activeSegment.start, clip.duration));
    const end = Math.max(start, Math.min(activeSegment.end, clip.duration));
    segEnd.current = end;

    // Do NOT reset(). Set clip-local time directly.
    action.paused = true;
    action.play(); // ensure active
    action.time = start;

    // evaluate pose immediately
    mixer.update(0);

    // unpause to play forward
    action.paused = false;

    // camera tween for NON-AR only
    if (!arEnabled) {
      camFromPos.current.copy(renderCam.position);
      if (controls?.target) tgtFrom.current.copy(controls.target);
      else tgtFrom.current.set(0, 0, 0);
      fovFrom.current = renderCam.fov;

      const { position, target, fov, moveSeconds } = activeSegment.cam;
      camToPos.current.set(position[0], position[1], position[2]);
      tgtTo.current.set(target[0], target[1], target[2]);
      fovTo.current = typeof fov === "number" ? fov : renderCam.fov;
      camDur.current = Math.max(0.05, moveSeconds ?? 0.6);
      camT.current = 0;
    }
  }, [segmentIndex, activeSegment, action, mixer, arEnabled, renderCam, controls, clip]);

  // apply AR placement matrix
  useEffect(() => {
    if (!arEnabled || !group.current || !placedTransform) return;
    group.current.matrixAutoUpdate = false;
    group.current.matrix.copy(placedTransform);
    group.current.matrix.decompose(
      group.current.position,
      group.current.quaternion,
      group.current.scale
    );
  }, [arEnabled, placedTransform]);

  useFrame((_, delta) => {
    if (!action || !activeSegment) return;

    // advance animation
    if (!action.paused) {
      mixer.update(delta);

      // action.time is clip-local
      if (action.time >= segEnd.current) {
        action.time = segEnd.current;
        action.paused = true;
        mixer.update(0); // evaluate exact end pose
      }
    }

    // camera tween (NON-AR)
    if (!arEnabled && camT.current < 1) {
      camT.current = Math.min(1, camT.current + delta / camDur.current);
      const t = camT.current;
      const ease = t * t * (3 - 2 * t);

      const pos = camFromPos.current.clone().lerp(camToPos.current, ease);
      const tgt = tgtFrom.current.clone().lerp(tgtTo.current, ease);
      const fov = fovFrom.current + (fovTo.current - fovFrom.current) * ease;

      renderCam.position.copy(pos);
      renderCam.fov = fov;
      renderCam.updateProjectionMatrix();

      renderCam.lookAt(tgt);
      renderCam.updateMatrixWorld();

      if (controls) {
        controls.target.copy(tgt);
        controls.update();
      }
    }
  });

  // center & scale in NON-AR; keep real scale in AR
  useEffect(() => {
    if (!group.current || arEnabled) return;
    const box = new THREE.Box3().setFromObject(group.current);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    group.current.position.sub(center);
    const maxAxis = Math.max(size.x, size.y, size.z);
    const desiredSize = 3;
    if (maxAxis > 0) group.current.scale.setScalar(desiredSize / maxAxis);
  }, [arEnabled]);

  return (
    <primitive
      ref={group}
      object={scene}
      onPointerDown={(e: ThreeEvent<PointerEvent>) => {
        isDragging.current = true;
        lastX.current = e.clientX;
      }}
      onPointerUp={() => (isDragging.current = false)}
      onPointerLeave={() => (isDragging.current = false)}
      onPointerMove={(e: ThreeEvent<PointerEvent>) => {
        if (!isDragging.current) return;
        const dx = e.clientX - lastX.current;
        lastX.current = e.clientX;
        if (group.current) group.current.rotation.y += dx * 0.01;
      }}
    />
  );
};

export default GlbSegmentViewer;

useGLTF.preload("/model.glb");
