import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { MemoryMark } from '../../types';
import { Sparkles, Pin } from 'lucide-react';

interface MemoryWall3DProps {
  marks: MemoryMark[];
  onOpenModal: () => void;
}

const SYMBOLS: Record<MemoryMark['symbol'], string> = {
  heart: '❤️', sunflower: '🌻', rose: '🌹', star: '⭐', book: '📖', grad_cap: '🎓',
};

export const MemoryWall3D: React.FC<MemoryWall3DProps> = ({ marks, onOpenModal }) => {
  const [hovered, setHovered] = useState(false);
  const approvedMarks = marks.filter((mark) => mark.moderation_status === 'approved');
  const visibleMarks = approvedMarks.slice(0, 12);

  return (
    <group
      position={[0, 2.2, 4.93]}
      rotation={[0, Math.PI, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onOpenModal();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* 1. Outer Oak Wooden Frame */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[4.8, 2.4, 0.08]} />
        <meshStandardMaterial
          color={hovered ? '#8C5A37' : '#6F4E37'}
          roughness={0.7}
        />
      </mesh>

      {/* 2. Corkboard Surface */}
      <mesh position={[0, -0.08, 0.042]} receiveShadow>
        <planeGeometry args={[4.6, 2.05]} />
        <meshStandardMaterial
          color="#D2B48C"
          roughness={0.9}
          metalness={0.05}
        />
      </mesh>

      {/* 3. Top Wooden Header Plaque */}
      <mesh position={[0, 0.96, 0.045]}>
        <boxGeometry args={[3.8, 0.32, 0.02]} />
        <meshStandardMaterial color="#3E2723" roughness={0.6} />
      </mesh>

      {/* 3D Header Text via HTML */}
      <Html
        position={[0, 0.96, 0.06]}
        transform
        distanceFactor={6}
        center
        pointerEvents="none"
      >
        <div className="text-center select-none w-[520px]">
          <h2 className="text-sm font-black tracking-widest text-amber-200 uppercase drop-shadow">
            CHÚNG TA ĐÃ TỪNG Ở ĐÂY
          </h2>
          <p className="text-[10px] italic text-amber-100 font-medium tracking-wide">
            "Dù mai này đi muôn nơi, chúng ta vẫn có một lớp học để trở về."
          </p>
        </div>
      </Html>

      {/* 4. Warm Overhead Fairy Light / Spotlight */}
      <pointLight position={[0, 1.2, 0.6]} color="#FFF4D0" intensity={0.9} distance={4} decay={2} />

      {approvedMarks.length === 0 && (
        <Html position={[0, -0.05, 0.06]} transform distanceFactor={6} center pointerEvents="none">
          <div className="w-[260px] text-center text-amber-950">
            <p className="font-bold text-sm">Chưa có dấu ấn nào</p>
            <p className="text-xs mt-1">Hãy để lại kỷ niệm đầu tiên của lớp mình.</p>
          </div>
        </Html>
      )}

      {/* Display the latest approved memories from the shared room. */}
      {visibleMarks.map((card, idx) => (
        <group
          key={card.id}
          position={[-1.75 + (idx % 6) * 0.7, idx < 6 ? 0.35 : -0.45, 0.055]}
          rotation={[0, 0, idx % 2 === 0 ? 0.04 : -0.04]}
        >
          {/* Pastel Paper Card Mesh */}
          <mesh castShadow>
            <boxGeometry args={[0.55, 0.42, 0.006]} />
            <meshStandardMaterial
              color={card.card_color}
              roughness={0.8}
            />
          </mesh>

          {/* Red/Golden Push Pin */}
          <mesh position={[0, 0.17, 0.012]}>
            <sphereGeometry args={[0.022, 12, 12]} />
            <meshStandardMaterial
              color={idx % 2 === 0 ? '#DC2626' : '#D97706'}
              metalness={0.4}
              roughness={0.3}
            />
          </mesh>

          {/* Minimal 3D Card Label */}
          <Html
            position={[0, 0.02, 0.01]}
            transform
            distanceFactor={5.5}
            center
            pointerEvents="none"
          >
            <div className="w-[85px] text-center select-none leading-none">
              <span className="text-sm block mb-0.5">{SYMBOLS[card.symbol]}</span>
              <span className="text-[9px] font-bold text-slate-800 truncate block">
                {card.display_name}
              </span>
              <span className="text-[8px] text-slate-700 truncate block mt-1">{card.message}</span>
            </div>
          </Html>
        </group>
      ))}

      {/* 6. Interactive Proximity Floating Prompt */}
      <Html
        position={[0, -1.25, 0.2]}
        transform
        distanceFactor={6}
        center
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal();
          }}
          className={`px-3 py-1.5 rounded-full border shadow-xl flex items-center gap-1.5 text-xs font-bold transition-all active:scale-95 ${
            hovered
              ? 'bg-amber-500 text-slate-950 border-white scale-105'
              : 'bg-slate-900/90 text-amber-200 border-amber-500/50 backdrop-blur'
          }`}
        >
          <Pin className="w-3.5 h-3.5 text-amber-400" />
          <span>Bức tường dấu ấn ({approvedMarks.length} kỷ niệm)</span>
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
        </button>
      </Html>
    </group>
  );
};

