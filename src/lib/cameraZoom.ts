export const CAMERA_ZOOM_LEVELS = [0.5, 1, 2] as const;
export type CameraZoom = typeof CAMERA_ZOOM_LEVELS[number];

export function initialCameraZoom(): CameraZoom {
  try {
    const saved = Number(localStorage.getItem('lop_hoc_camera_zoom'));
    if (CAMERA_ZOOM_LEVELS.includes(saved as CameraZoom)) return saved as CameraZoom;
  } catch { /* Storage may be disabled in private browsers. */ }
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches ? 0.5 : 1;
}
