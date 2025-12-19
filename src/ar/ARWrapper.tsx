import React, { useRef, useState } from "react";
import * as THREE from "three";
import { XR, ARButton, XRHitTest, useXR } from "@react-three/xr";

type Props = {
  enabled: boolean;
  onPlacedMatrixChange: (m: THREE.Matrix4 | null) => void;
  children: React.ReactNode;
};

export default function ARWrapper({ enabled, onPlacedMatrixChange, children }: Props) {
  return (
    <>
      <div className="ar-toggle">
        <ARButton
          sessionInit={{
            requiredFeatures: ["hit-test"],
            optionalFeatures: ["dom-overlay"],
            domOverlay: { root: document.body },
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
        </ARButton>
        <div className="ar-hint">Tap a surface to place the model.</div>
      </div>

      <XR>
        <Placement onPlacedMatrixChange={onPlacedMatrixChange} />
        {children}
      </XR>
    </>
  );
}

function Placement({ onPlacedMatrixChange }: { onPlacedMatrixChange: (m: THREE.Matrix4 | null) => void }) {
  const { isPresenting } = useXR();
  const lastMatrix = useRef<THREE.Matrix4 | null>(null);
  const [placed, setPlaced] = useState(false);

  if (!isPresenting && (placed || lastMatrix.current)) {
    lastMatrix.current = null;
    setPlaced(false);
  }

  return (
    <XRHitTest
      onHit={(matrix) => {
        lastMatrix.current = matrix.clone();
        if (!placed) onPlacedMatrixChange(matrix.clone());
      }}
      onSelect={() => {
        if (!lastMatrix.current) return;
        onPlacedMatrixChange(lastMatrix.current.clone());
        setPlaced(true);
      }}
    />
  );
}
