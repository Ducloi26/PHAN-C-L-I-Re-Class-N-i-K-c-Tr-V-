import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { PerspectiveCamera } from 'three';
import type { CameraZoom } from '../../lib/cameraZoom';

// Optical zoom widens the view without moving the camera through walls/desks.
export function CameraLens({ zoom }: { zoom: CameraZoom }) {
  const { camera } = useThree();
  useEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
  }, [camera, zoom]);
  return null;
}
