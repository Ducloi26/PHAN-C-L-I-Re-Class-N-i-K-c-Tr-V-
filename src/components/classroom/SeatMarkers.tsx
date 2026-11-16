import React from 'react';
import { Html } from '@react-three/drei';
import { SeatInfo, PlayerState } from '../../types';

interface SeatMarkersProps {
  localPlayer: PlayerState;
  remotePlayers: PlayerState[];
  nearestSeat: SeatInfo | null;
  onSit: (seat: SeatInfo) => void;
  onStand: () => void;
}

export const SeatMarkers: React.FC<SeatMarkersProps> = ({
  localPlayer,
  remotePlayers,
  nearestSeat,
  onSit,
  onStand,
}) => {
  const isLocalSitting = localPlayer.state === 'sitting';

  // Check if nearest seat is already occupied by a remote player
  const isNearestOccupied = remotePlayers.some(
    (p) => p.seatId === nearestSeat?.id && p.state === 'sitting'
  );

  if (!nearestSeat && !isLocalSitting) return null;

  return (
    <group>
      {/* 1. Prompt on Nearest Unoccupied Seat when Standing nearby */}
      {nearestSeat && !isNearestOccupied && !isLocalSitting && (
        <group position={[nearestSeat.x, 0.47, nearestSeat.z]}>
          {/* Subtle seat highlight ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.12, 16]} />
            <meshBasicMaterial color="#34D399" transparent opacity={0.6} />
          </mesh>

          {/* Compact, non-intrusive sit prompt */}
          <Html center position={[0, 0.15, 0]} className="pointer-events-auto select-none">
            <button
              onClick={() => onSit(nearestSeat)}
              className="px-2 py-0.5 rounded-full bg-emerald-700/90 hover:bg-emerald-600 text-white text-[11px] font-medium shadow-md flex items-center gap-1 border border-emerald-400/40 cursor-pointer backdrop-blur-xs whitespace-nowrap"
            >
              <kbd className="bg-black/50 px-1 py-0.2 rounded text-[9px] font-mono font-bold text-emerald-200">E</kbd>
              <span>Ngồi</span>
            </button>
          </Html>
        </group>
      )}

      {/* 2. Stand up prompt when Local Player is Seated */}
      {isLocalSitting && localPlayer.seatId && (
        <group position={[localPlayer.x, 0.47, localPlayer.z]}>
          <Html center position={[0, 0.15, 0]} className="pointer-events-auto select-none">
            <button
              onClick={onStand}
              className="px-2 py-0.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-amber-200 text-[11px] font-medium shadow-md flex items-center gap-1 border border-amber-400/40 cursor-pointer backdrop-blur-xs whitespace-nowrap"
            >
              <kbd className="bg-amber-500/25 text-amber-300 px-1 py-0.2 rounded text-[9px] font-mono font-bold border border-amber-400/30">E</kbd>
              <span>Đứng dậy</span>
            </button>
          </Html>
        </group>
      )}
    </group>
  );
};
