import React, { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import GlbSegmentViewer from "./GlbSegmentViewer";
import ARWrapper from "./ar/ARWrapper";
import { ANIMATION_SEGMENTS } from "./animationSegments";

const App: React.FC = () => {
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [arEnabled, setArEnabled] = useState(false);
  const [placedMatrix, setPlacedMatrix] = useState<THREE.Matrix4 | null>(null);

  const segCount = ANIMATION_SEGMENTS.length;

  const currentSegment = useMemo(
    () => (segCount > 0 ? ANIMATION_SEGMENTS[Math.min(segmentIndex, segCount - 1)] : null),
    [segmentIndex, segCount]
  );

  const handleNext = () => segCount && setSegmentIndex((p) => (p + 1) % segCount);
  const handlePrev = () => segCount && setSegmentIndex((p) => (p - 1 + segCount) % segCount);

  const descriptionKey = `${segmentIndex}-${currentSegment?.label ?? ""}`;

  return (
    <div className="app-root">
      <header className="app-header">
        <div>
          <h1 className="app-title">GLB Step Viewer</h1>
          <div className="app-subtitle">
            Step: {segCount ? `${segmentIndex + 1} / ${segCount}` : "—"}
            {currentSegment ? ` • ${currentSegment.label}` : ""}
            {currentSegment ? ` • ${currentSegment.start}s→${currentSegment.end}s` : ""}
          </div>
        </div>

        <button
          className={arEnabled ? "ar-chip ar-chip-on" : "ar-chip"}
          onClick={() => {
            setArEnabled((v) => !v);
            setPlacedMatrix(null);
          }}
        >
          {arEnabled ? "AR: ON" : "AR: OFF"}
        </button>
      </header>

      <div className="app-main">
        <div className="canvas-wrapper">
          <Canvas camera={{ position: [1, 10, 8], fov: 50 }}>
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 10, 5]} intensity={1} />
            <Environment preset="studio" />

            {arEnabled ? (
              <ARWrapper enabled={arEnabled} onPlacedMatrixChange={setPlacedMatrix}>
                <GlbSegmentViewer
                  url="/camer_model.glb"
                  segmentIndex={segmentIndex}
                  segments={ANIMATION_SEGMENTS}
                  arEnabled={true}
                  placedTransform={placedMatrix}
                />
              </ARWrapper>
            ) : (
              <>
                <GlbSegmentViewer
                  url="/camer_model.glb"
                  segmentIndex={segmentIndex}
                  segments={ANIMATION_SEGMENTS}
                  arEnabled={false}
                />
                <OrbitControls enableDamping makeDefault />
              </>
            )}
          </Canvas>

          <div className="nav-buttons">
            <button className="btn-secondary" onClick={handlePrev}>◀ Previous</button>
            <button className="btn-primary" onClick={handleNext}>Next ▶</button>
          </div>

          <div key={descriptionKey} className="step-card step-card-enter">
            <div className="step-pill">{currentSegment?.label ?? "Step"}</div>
            <div className="step-text">{currentSegment?.description ?? ""}</div>
          </div>
        </div>

        <aside className="side-panel">
          <h2>Update steps</h2>
          <p>
            Edit timestamps + camera XYZ + text in:
            <br />
            <code>src/animationSegments.ts</code>
          </p>

          <div className="panel-box">
            <div><strong>Current:</strong> {currentSegment?.label ?? "-"}</div>
            <div><strong>Start:</strong> {currentSegment?.start ?? "-"}s</div>
            <div><strong>End:</strong> {currentSegment?.end ?? "-"}s</div>
          </div>

          <div className="panel-box">
            <div><strong>Cam Pos:</strong> {currentSegment ? currentSegment.cam.position.join(", ") : "-"}</div>
            <div><strong>Cam Target:</strong> {currentSegment ? currentSegment.cam.target.join(", ") : "-"}</div>
            <div><strong>FOV:</strong> {currentSegment?.cam.fov ?? "-"}</div>
            <div><strong>Move:</strong> {currentSegment?.cam.moveSeconds ?? 0.6}s</div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default App;
