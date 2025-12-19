import React, { useRef, useState, useMemo, useEffect } from "react";
import * as THREE from "three";
import { XR, useXRHitTest, useXR, createXRStore, useXREvent } from "@react-three/xr";
import { Html } from "@react-three/drei";

const store = createXRStore({
  hitTest: true,
});

type Props = {
  enabled: boolean;
  onPlacedMatrixChange: (m: THREE.Matrix4 | null) => void;
  children: React.ReactNode;
};

export default function ARWrapper({ enabled, onPlacedMatrixChange, children }: Props) {
  // Use a ref for portal to satisfy TS if needed, though document.body often works
  const portalRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (typeof document !== 'undefined') {
      (portalRef as any).current = document.body;
    }
  }, []);

  return (
    <>
      <Html fullscreen portal={portalRef as any} style={{ pointerEvents: "none" }}>
        <div className="ar-toggle" style={{ pointerEvents: "auto" }}>
          <button
            onClick={() => {
              const session = store.getState().session;
              if (session) {
                session.end();
              } else {
                store.enterAR();
              }
            }}
            style={{
              padding: "8px 14px",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.18)",
              background: enabled ? "#22c55e" : "rgba(17,24,39,0.7)",
              color: enabled ? "#04110a" : "#e5e7eb",
              fontWeight: 700,
              cursor: "pointer",
              backdropFilter: "blur(8px)",
            }}
          >
            {enabled ? "Exit AR" : "Enter AR"}
          </button>
          <div className="ar-hint">Tap a surface to place the model.</div>
        </div>
      </Html>

      <XR store={store}>
        <Placement onPlacedMatrixChange={onPlacedMatrixChange} />
        {children}
      </XR>
    </>
  );
}

function Placement({ onPlacedMatrixChange }: { onPlacedMatrixChange: (m: THREE.Matrix4 | null) => void }) {
  const session = useXR((s) => s.session);
  const isPresenting = !!session;
  const lastMatrix = useRef<THREE.Matrix4 | null>(null);
  const [placed, setPlaced] = useState(false);
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);

  if (!isPresenting && (placed || lastMatrix.current)) {
    lastMatrix.current = null;
    setPlaced(false);
  }

  useXRHitTest((results, getWorldMatrix) => {
    if (results.length > 0) {
      getWorldMatrix(tempMatrix, results[0]);
      lastMatrix.current = tempMatrix.clone();
      if (!placed) onPlacedMatrixChange(lastMatrix.current.clone());
    }
  }, "viewer");

  useXREvent("select", () => {
    if (!lastMatrix.current || placed) return;
    onPlacedMatrixChange(lastMatrix.current.clone());
    setPlaced(true);
  });

  return null;
}
