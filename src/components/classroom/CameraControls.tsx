import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CameraPreset } from '../../types';
import { CAMERA_PRESETS } from '../../lib/cameraPresets';

interface CameraControlsProps { preset: CameraPreset }

export const CameraControls: React.FC<CameraControlsProps> = ({ preset }) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  
  const targetPos = useRef(new THREE.Vector3(...CAMERA_PRESETS.overview.position));
  const targetLook = useRef(new THREE.Vector3(...CAMERA_PRESETS.overview.target));
  const isTransitioning = useRef(true);

  useEffect(() => {
    const config = CAMERA_PRESETS[preset] || CAMERA_PRESETS.overview;
    targetPos.current.set(...config.position);
    targetLook.current.set(...config.target);
    isTransitioning.current = true;
  }, [preset]);

  useFrame(() => {
    if (!controlsRef.current) return;

    if (isTransitioning.current) {
      // Smooth lerp camera position
      camera.position.lerp(targetPos.current, 0.06);

      // Smooth lerp controls target
      controlsRef.current.target.lerp(targetLook.current, 0.06);
      controlsRef.current.update();

      // Stop lerping when close enough
      if (
        camera.position.distanceTo(targetPos.current) < 0.05 &&
        controlsRef.current.target.distanceTo(targetLook.current) < 0.05
      ) {
        isTransitioning.current = false;
      }
    }
  });

  return (
    <DreiOrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      maxPolarAngle={Math.PI / 2 - 0.02} // Do not clip below floor
      minDistance={1.0}
      maxDistance={12.0}
      dampingFactor={0.08}
      makeDefault
    />
  );
};

