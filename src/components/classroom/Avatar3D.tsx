import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PlayerState } from '../../types';
import { AvatarModel } from '../avatar/AvatarModel';

interface Avatar3DProps {
  player: PlayerState;
  isLocal?: boolean;
  hideBody?: boolean;
}

export const Avatar3D: React.FC<Avatar3DProps> = ({
  player,
  isLocal = false,
  hideBody = false,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftThighRef = useRef<THREE.Group>(null);
  const rightThighRef = useRef<THREE.Group>(null);
  const leftShinRef = useRef<THREE.Group>(null);
  const rightShinRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  // Target positions for smooth remote interpolation
  const targetPos = useRef(new THREE.Vector3(player.x, 0, player.z));
  const targetRotY = useRef(player.rotY);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Standardize ground position: characters always stand/sit on floor y = 0
    if (!isLocal) {
      targetPos.current.set(player.x, 0, player.z);
      targetRotY.current = player.rotY;
      groupRef.current.position.lerp(targetPos.current, 0.25);
      
      let currentRot = groupRef.current.rotation.y;
      let diff = targetRotY.current - currentRot;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      groupRef.current.rotation.y += diff * 0.25;
    } else {
      groupRef.current.position.set(player.x, 0, player.z);
      groupRef.current.rotation.y = player.rotY;
    }

    const time = state.clock.getElapsedTime() * 9;
    const isWalking = player.state === 'walking';
    const isSitting = player.state === 'sitting';
    const isGifting = player.state === 'gifting';

    // ---------------------------------------------------------------
    // LEGS & KNEES POSTURE (Standing vs Walking vs Sitting)
    // ---------------------------------------------------------------
    if (leftThighRef.current && rightThighRef.current && leftShinRef.current && rightShinRef.current) {
      if (isSitting) {
        // Thighs rotated ~85° forward under the desk (local +Z)
        leftThighRef.current.rotation.x = -1.48;
        rightThighRef.current.rotation.x = -1.48;

        // Knees bent 85° DOWNWARDS: net world angle = -1.48 + 1.48 = 0 (pointing straight down to floor)
        leftShinRef.current.rotation.x = 1.48;
        rightShinRef.current.rotation.x = 1.48;
      } else if (isWalking) {
        const swing = Math.sin(time) * 0.45;
        leftThighRef.current.rotation.x = swing;
        rightThighRef.current.rotation.x = -swing;

        // Natural knee flexing on walk
        leftShinRef.current.rotation.x = Math.max(0, -swing * 0.4);
        rightShinRef.current.rotation.x = Math.max(0, swing * 0.4);
      } else {
        leftThighRef.current.rotation.x = 0;
        rightThighRef.current.rotation.x = 0;
        leftShinRef.current.rotation.x = 0;
        rightShinRef.current.rotation.x = 0;
      }
    }

    // ---------------------------------------------------------------
    // ARMS POSTURE (Resting on desk when sitting, swinging when walking)
    // ---------------------------------------------------------------
    if (leftArmRef.current && rightArmRef.current) {
      if (isSitting) {
        // Arms resting forward on the student desk top (0.75m)
        leftArmRef.current.rotation.x = -0.7;
        rightArmRef.current.rotation.x = -0.7;
        leftArmRef.current.rotation.z = 0.12;
        rightArmRef.current.rotation.z = -0.12;
      } else if (isGifting) {
        // Respectful arm raise presenting flower bouquet forward
        leftArmRef.current.rotation.x = -1.15;
        rightArmRef.current.rotation.x = -1.15;
        leftArmRef.current.rotation.z = 0.28;
        rightArmRef.current.rotation.z = -0.28;
      } else if (isWalking) {
        leftArmRef.current.rotation.x = -Math.sin(time) * 0.4;
        rightArmRef.current.rotation.x = Math.sin(time) * 0.4;
        leftArmRef.current.rotation.z = 0;
        rightArmRef.current.rotation.z = 0;
      } else {
        leftArmRef.current.rotation.x = 0;
        rightArmRef.current.rotation.x = 0;
        leftArmRef.current.rotation.z = 0;
        rightArmRef.current.rotation.z = 0;
      }
    }
  });

  // Role color palette
  const roleColors = {
    admin: {
      badge: '👑 Admin',
      badgeBg: 'bg-purple-900/90 text-amber-300 border-amber-400',
    },
    teacher: {
      badge: '🎓 Giáo viên',
      badgeBg: 'bg-emerald-900/90 text-emerald-200 border-emerald-400',
    },
    member: {
      badge: player.participantType === 'student' ? '🎒 Sinh viên' : '👋 Khách',
      badgeBg: 'bg-slate-900/90 text-amber-200 border-white/20',
    },
  }[player.role] || {
    badge: '🎒 Sinh viên',
    badgeBg: 'bg-slate-900/90 text-amber-200 border-white/20',
  };

  const isSitting = player.state === 'sitting';
  const isGifting = player.state === 'gifting';

  return (
    <group ref={groupRef} position={[player.x, 0, player.z]}>
      {/* ------------------------------------------------------------- */}
      {/* 1. SLEEK, COMPACT FLOATING NAMEPLATE                          */}
      {/* ------------------------------------------------------------- */}
      {(!isLocal || !hideBody) && (
        <Html
          position={[0, isSitting ? 1.05 : 1.32, 0]}
          center
          className="select-none pointer-events-none"
        >
          <div className="flex flex-col items-center justify-center whitespace-nowrap">
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-950/75 backdrop-blur-xs border border-white/20 shadow-sm text-white">
              <span className={`text-[9px] font-semibold px-1 py-0.2 rounded border ${roleColors.badgeBg}`}>
                {roleColors.badge}
              </span>
              <span className="text-[10px] font-medium text-amber-100">
                {player.displayName} {isLocal && '(Bạn)'}
              </span>
              {isSitting && (
                <span className="text-[9px] text-amber-300">🪑</span>
              )}
            </div>
          </div>
        </Html>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. COMPACT & PROPORTIONAL HUMANOID MESH (Height ~1.24m)        */}
      {/* ------------------------------------------------------------- */}
      {!hideBody && (
        <AvatarModel
          role={player.role}
          participantType={player.participantType}
          avatar={player.avatar}
          isSitting={isSitting}
          isGifting={isGifting}
          leftThighRef={leftThighRef}
          rightThighRef={rightThighRef}
          leftShinRef={leftShinRef}
          rightShinRef={rightShinRef}
          leftArmRef={leftArmRef}
          rightArmRef={rightArmRef}
          castShadow
        />
      )}
    </group>
  );
};
