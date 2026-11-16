import type { CameraPreset } from '../types';

export const CAMERA_PRESETS: Record<CameraPreset, { position: [number, number, number]; target: [number, number, number] }> = {
  // Stay inside the back wall (z = 5); outside it the memory wall blocks the
  // classroom and its HTML labels appear mirrored in front of the camera.
  overview: { position: [0, 4, 4.35], target: [0, 1.3, -1.5] },
  board: { position: [0, 2.2, 1.2], target: [0, 2.2, -4.75] },
  podium: { position: [-2.6, 1.6, -1.8], target: [-3.5, 1, -3.6] },
  students: { position: [3.8, 2.5, 4.5], target: [0, 1.2, 0] },
};
