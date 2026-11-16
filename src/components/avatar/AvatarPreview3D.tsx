import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { AvatarCustomization } from '../../types';
import { AvatarModel } from './AvatarModel';
import { RotateCcw } from 'lucide-react';
import { SceneBoundary } from '../SceneBoundary';

interface AvatarPreview3DProps {
  avatar: AvatarCustomization;
  height?: string;
}

export const AvatarPreview3D: React.FC<AvatarPreview3DProps> = ({
  avatar,
  height = 'h-72 sm:h-80',
}) => {
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  return (
    <div className={`w-full ${height} relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#1C140E] via-[#241B16] to-[#120B07] border border-amber-500/30 shadow-2xl select-none group`}>
      <SceneBoundary><Canvas
        camera={{ position: [0, 0.95, 2.3], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.8} color="#FFF7ED" />
        <directionalLight position={[2, 3, 3]} intensity={1.5} color="#FEF3C7" />
        <directionalLight position={[-2, 2, -1]} intensity={0.5} color="#93C5FD" />

        <Suspense fallback={null}>
          <group position={[0, -0.65, 0]}>
            {/* Wooden Pedestal / Display Stand */}
            <mesh position={[0, -0.04, 0]}>
              <cylinderGeometry args={[0.42, 0.46, 0.08, 32]} />
              <meshStandardMaterial color="#78350F" roughness={0.5} metalness={0.1} />
            </mesh>

            {/* Brass Trim Ring on Pedestal */}
            <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.39, 0.41, 32]} />
              <meshStandardMaterial color="#F59E0B" roughness={0.3} metalness={0.8} />
            </mesh>

            {/* Avatar Model */}
            <AvatarModel avatar={avatar} role="member" participantType="student" castShadow />
          </group>

          {/* 360 Degree Orbit Controls */}
          <OrbitControls
            autoRotate={autoRotate}
            autoRotateSpeed={1.8}
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 2.8}
            maxPolarAngle={Math.PI / 2.05}
            onStart={() => setAutoRotate(false)}
          />
        </Suspense>
      </Canvas></SceneBoundary>

      {/* Interactive Helper Overlay Pill */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/10 text-[10px] text-amber-200/90 flex items-center gap-1.5 pointer-events-none shadow">
        <RotateCcw className="w-3 h-3 text-amber-400" />
        <span>Rê chuột để xoay 360°</span>
      </div>

      {/* Preset Badge */}
      <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-amber-400/30 text-[10px] font-semibold text-amber-300">
        Xem trước 3D
      </div>
    </div>
  );
};

