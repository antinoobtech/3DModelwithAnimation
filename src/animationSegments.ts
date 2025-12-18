// src/animationSegments.ts
export type AnimationSegment = {
  label: string;
  description: string;
  start: number; // seconds
  end: number;   // seconds
  cam: {
    position: [number, number, number];
    target: [number, number, number];
    fov?: number;
    moveSeconds?: number;
  };
};

export const ANIMATION_SEGMENTS: AnimationSegment[] = [
  {
    label: "Step 0",
    description: "Introduce the product and set the scene.",
    start: 0.0,
    end: 0.0,
    // cam: { position: [0, -22.25, 9.3842], target: [0, 1, 0], fov: 90, moveSeconds: 0.6 },
    cam: {
      position: [1, 10, 8],
      target: [0, 0, 0], // look straight down
      fov: 50,
      moveSeconds: 0.6,
    }
  },
  {
    label: "Step 1",
    description: "Introduce the product and set the scene.",
    start: 0.0,
    end: 6.0,
    // cam: { position: [0, -22.25, 9.3842], target: [0, 1, 0], fov: 90, moveSeconds: 0.6 },
    cam: {
      position: [10, 15, 10],
      target: [0, 0, 0], // look straight down
      fov: 12,
      moveSeconds: 0.6,
    }
  },
  {
    label: "Step 2",
    description: "Highlight the main feature with a closer angle.",
    start: 5.0,
    end: 7.0,
    cam: {
      position: [15, 30, 10],
      target: [0, 0, 0], // look straight down
      fov: 10,
      moveSeconds: 0.6
      // position: [2, 2, 4], target: [0, 1, 0], fov: 40, moveSeconds: 0.6 
    },
  },
];
