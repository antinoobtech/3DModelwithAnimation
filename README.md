# React 19 GLB Steps + AR

## Setup
1) Put your GLB at: `public/model.glb`
2) Install:
   npm install
3) Run:
   npm run dev

## Edit steps
Open `src/animationSegments.ts`:
- `start/end` (seconds) to split one long clip
- camera XYZ in `cam.position` and `cam.target`
- `description` text per step

## AR notes
- Requires HTTPS + compatible mobile device/browser
- Toggle AR via "AR: ON" then press "Enter AR"
- Tap a surface to place the model
