import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FlowerType, FLOWER_TYPES } from '../../types';

interface FlowerBurst3DProps {
  burstTimestamp: number; // Unix timestamp of last flower sent/received
  flowerType?: FlowerType;
}

const PETAL_COUNT = 36;

interface PetalData {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  rot: THREE.Euler;
  rotSpeed: THREE.Vector3;
  color: string;
  scale: number;
}

export const FlowerBurst3D: React.FC<FlowerBurst3DProps> = ({ 
  burstTimestamp, 
  flowerType = 'rose' 
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const bouquetRef = useRef<THREE.Group>(null);
  const startTimeRef = useRef<number>(0);
  const isActiveRef = useRef<boolean>(false);

  const petalColors = useMemo(() => {
    return FLOWER_TYPES[flowerType]?.petalColors || FLOWER_TYPES.rose.petalColors;
  }, [flowerType]);

  // Initialize randomized petal data
  const petals = useMemo<PetalData[]>(() => {
    const list: PetalData[] = [];
    for (let i = 0; i < PETAL_COUNT; i++) {
      const angle = (i / PETAL_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const speed = 0.5 + Math.random() * 0.7;
      list.push({
        pos: new THREE.Vector3(
          -3.5 + (Math.random() - 0.5) * 0.8, // Around teacher's desk
          0.90 + Math.random() * 0.4,
          -3.6 + (Math.random() - 0.5) * 0.8
        ),
        vel: new THREE.Vector3(
          Math.cos(angle) * speed * 0.7,
          0.65 + Math.random() * 0.85, // Gentle upward float
          Math.sin(angle) * speed * 0.7
        ),
        rot: new THREE.Euler(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2
        ),
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 3
        ),
        color: petalColors[i % petalColors.length],
        scale: 0.035 + Math.random() * 0.025,
      });
    }
    return list;
  }, [burstTimestamp, petalColors]);

  useEffect(() => {
    if (burstTimestamp > 0) {
      startTimeRef.current = performance.now();
      isActiveRef.current = true;
    }
  }, [burstTimestamp]);

  useFrame(() => {
    if (!isActiveRef.current || !groupRef.current) return;

    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const duration = 4.0; // 4 seconds total animation

    if (elapsed > duration) {
      isActiveRef.current = false;
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    // Calculate fade out opacity in the last 1.2s
    let opacity = 1.0;
    if (elapsed > 2.6) {
      opacity = Math.max(0, 1.0 - (elapsed - 2.6) / 1.4);
    }

    // Animate bouquet hover / gentle pulse
    if (bouquetRef.current) {
      bouquetRef.current.position.y = 0.88 + Math.sin(elapsed * 4) * 0.05;
      bouquetRef.current.rotation.y = elapsed * 0.5;
    }

    const children = groupRef.current.children;
    // Index 0 is the bouquet group, rest are petals
    for (let i = 1; i < children.length; i++) {
      const mesh = children[i] as THREE.Mesh;
      const p = petals[i - 1];
      if (!p || !mesh) continue;

      // Update position with gentle fluttering drag
      mesh.position.x = p.pos.x + p.vel.x * elapsed * 0.85 + Math.sin(elapsed * 3 + i) * 0.08;
      mesh.position.y = p.pos.y + p.vel.y * elapsed - 0.08 * elapsed * elapsed; // Gentle buoyant arc
      mesh.position.z = p.pos.z + p.vel.z * elapsed * 0.85 + Math.cos(elapsed * 3 + i) * 0.08;

      // Tumbling rotation
      mesh.rotation.x = p.rot.x + p.rotSpeed.x * elapsed;
      mesh.rotation.y = p.rot.y + p.rotSpeed.y * elapsed;
      mesh.rotation.z = p.rot.z + p.rotSpeed.z * elapsed;

      // Material opacity
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.opacity = opacity;
        mat.transparent = true;
      }
    }
  });

  if (burstTimestamp === 0) return null;

  const primaryColor = FLOWER_TYPES[flowerType]?.color || '#E11D48';

  return (
    <group ref={groupRef}>
      {/* 💐 3D Gift Bouquet appearing on Teacher's Table */}
      <group ref={bouquetRef} position={[-3.5, 0.88, -3.6]}>
        {/* Bouquet ribbon wrap */}
        <mesh position={[0, 0.05, 0]}>
          <coneGeometry args={[0.10, 0.22, 10]} />
          <meshStandardMaterial color="#FDE047" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Floral head blossoms */}
        <mesh position={[0, 0.18, 0]}>
          <sphereGeometry args={[0.13, 10, 10]} />
          <meshStandardMaterial color={primaryColor} roughness={0.6} />
        </mesh>
        <mesh position={[0.06, 0.22, 0.04]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color={petalColors[1] || primaryColor} roughness={0.5} />
        </mesh>
        <mesh position={[-0.06, 0.20, -0.04]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color={petalColors[2] || primaryColor} roughness={0.5} />
        </mesh>
        {/* Warm celebration glow point light */}
        <pointLight color="#FEF08A" intensity={1.5} distance={2.5} decay={2} />
      </group>

      {/* 🌸 Floating Petals */}
      {petals.map((p, idx) => (
        <mesh key={idx} position={p.pos} scale={[p.scale, p.scale * 1.4, p.scale]}>
          <sphereGeometry args={[1, 7, 7]} />
          <meshStandardMaterial
            color={p.color}
            roughness={0.4}
            metalness={0.1}
            side={THREE.DoubleSide}
            transparent
            opacity={0.9}
          />
        </mesh>
      ))}
    </group>
  );
};
