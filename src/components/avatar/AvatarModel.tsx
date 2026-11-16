import React from 'react';
import * as THREE from 'three';
import { UserRole, ParticipantType, AvatarCustomization } from '../../types';
import { getDefaultAvatar } from '../../lib/avatarPresets';

interface AvatarModelProps {
  role?: UserRole;
  participantType?: ParticipantType;
  avatar?: AvatarCustomization;
  isSitting?: boolean;
  isGifting?: boolean;
  leftThighRef?: React.Ref<any>;
  rightThighRef?: React.Ref<any>;
  leftShinRef?: React.Ref<any>;
  rightShinRef?: React.Ref<any>;
  leftArmRef?: React.Ref<any>;
  rightArmRef?: React.Ref<any>;
  castShadow?: boolean;
}

export const AvatarModel: React.FC<AvatarModelProps> = ({
  role = 'member',
  participantType = 'student',
  avatar,
  isSitting = false,
  isGifting = false,
  leftThighRef,
  rightThighRef,
  leftShinRef,
  rightShinRef,
  leftArmRef,
  rightArmRef,
  castShadow = true,
}) => {
  const currentAvatar = avatar || getDefaultAvatar();

  // Role Palette Fallback
  const roleColors = {
    admin: {
      jacket: '#4C1D95',
      tie: '#F59E0B',
      cap: '#5B21B6',
    },
    teacher: {
      jacket: '#1B4332',
      tie: '#991B1B',
      cap: '#2D6A4F',
    },
    member: {
      jacket: participantType === 'student' ? '#1E3A8A' : '#78350F',
      tie: '#DC2626',
      cap: '#1E293B',
    },
  }[role] || {
    jacket: '#1E3A8A',
    tie: '#DC2626',
    cap: '#1E293B',
  };

  // Jacket Color: admin/teacher use their official uniform colors, students use their custom color
  const jacketColor = role === 'member' ? (currentAvatar.outfitColor || roleColors.jacket) : roleColors.jacket;
  const hairColor = currentAvatar.hairColor || '#1E1B18';
  const hairStyle = currentAvatar.hairStyle || (currentAvatar.gender === 'female' ? 'long' : 'short');
  const accessory = currentAvatar.accessory || (currentAvatar.gender === 'female' ? 'none' : 'tie');

  // Sitting offset: pelvis drops from 0.74m to 0.47m (drop = -0.27m)
  const bodyOffsetY = isSitting ? -0.27 : 0;

  return (
    <group position={[0, bodyOffsetY, 0]}>
      {/* ------------------------------------------------------------- */}
      {/* 1. HEAD & FACE & CUSTOM HAIRSTYLES                             */}
      {/* ------------------------------------------------------------- */}
      <group position={[0, 1.135, 0]}>
        {/* Face Sphere (Radius 0.075m, center y = 1.135m) */}
        <mesh castShadow={castShadow}>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshStandardMaterial color="#FFDFC4" roughness={0.6} />
        </mesh>

        {/* Eyes (Neat stylized dark eyes) */}
        <mesh position={[-0.026, 0.008, 0.068]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial color="#111827" />
        </mesh>
        <mesh position={[0.026, 0.008, 0.068]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial color="#111827" />
        </mesh>

        {/* Eye Shine Highlights */}
        <mesh position={[-0.023, 0.012, 0.077]}>
          <sphereGeometry args={[0.0035, 6, 6]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0.029, 0.012, 0.077]}>
          <sphereGeometry args={[0.0035, 6, 6]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>

        {/* Glasses Accessory */}
        {accessory === 'glasses' && (
          <group position={[0, 0.008, 0.070]}>
            {/* Left Frame */}
            <mesh position={[-0.026, 0, 0]}>
              <ringGeometry args={[0.015, 0.018, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Right Frame */}
            <mesh position={[0.026, 0, 0]}>
              <ringGeometry args={[0.015, 0.018, 16]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Bridge */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.016, 0.003, 0.004]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        )}

        {/* HAIRSTYLE 1: Short Hair (Nam Năng Động) */}
        {hairStyle === 'short' && (
          <group position={[0, 0.015, -0.005]}>
            {/* Main Crown */}
            <mesh castShadow={castShadow}>
              <sphereGeometry args={[0.079, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
              <meshStandardMaterial color={hairColor} roughness={0.7} />
            </mesh>
            {/* Front Spiky Fringe */}
            <mesh position={[0, 0.065, 0.055]} rotation={[0.4, 0, 0]}>
              <boxGeometry args={[0.08, 0.025, 0.03]} />
              <meshStandardMaterial color={hairColor} roughness={0.7} />
            </mesh>
            {/* Sideburns */}
            <mesh position={[-0.074, -0.01, 0.02]}>
              <boxGeometry args={[0.012, 0.04, 0.025]} />
              <meshStandardMaterial color={hairColor} roughness={0.7} />
            </mesh>
            <mesh position={[0.074, -0.01, 0.02]}>
              <boxGeometry args={[0.012, 0.04, 0.025]} />
              <meshStandardMaterial color={hairColor} roughness={0.7} />
            </mesh>
          </group>
        )}

        {/* HAIRSTYLE 2: Side-Part (Nam Thanh Lịch) */}
        {hairStyle === 'side-part' && (
          <group position={[0, 0.018, -0.005]}>
            {/* Crown */}
            <mesh castShadow={castShadow}>
              <sphereGeometry args={[0.080, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
              <meshStandardMaterial color={hairColor} roughness={0.65} />
            </mesh>
            {/* Side Part Swoop across forehead */}
            <mesh position={[-0.015, 0.068, 0.055]} rotation={[0.3, 0.2, -0.15]}>
              <boxGeometry args={[0.095, 0.028, 0.035]} />
              <meshStandardMaterial color={hairColor} roughness={0.65} />
            </mesh>
            {/* Left & Right Taper */}
            <mesh position={[-0.075, -0.005, 0.01]}>
              <boxGeometry args={[0.012, 0.035, 0.03]} />
              <meshStandardMaterial color={hairColor} roughness={0.65} />
            </mesh>
            <mesh position={[0.075, -0.005, 0.01]}>
              <boxGeometry args={[0.012, 0.035, 0.03]} />
              <meshStandardMaterial color={hairColor} roughness={0.65} />
            </mesh>
          </group>
        )}

        {/* HAIRSTYLE 3: Long Hair (Nữ Duyên Dáng) */}
        {hairStyle === 'long' && (
          <group position={[0, 0.015, -0.005]}>
            {/* Crown */}
            <mesh castShadow={castShadow}>
              <sphereGeometry args={[0.081, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.60]} />
              <meshStandardMaterial color={hairColor} roughness={0.6} />
            </mesh>
            {/* Front Bangs */}
            <mesh position={[0, 0.062, 0.055]} rotation={[0.25, 0, 0]}>
              <boxGeometry args={[0.085, 0.022, 0.028]} />
              <meshStandardMaterial color={hairColor} roughness={0.6} />
            </mesh>
            {/* Left Flowing Lock */}
            <mesh position={[-0.074, -0.07, 0.02]} rotation={[0, 0, 0.05]} castShadow={castShadow}>
              <cylinderGeometry args={[0.016, 0.012, 0.16, 8]} />
              <meshStandardMaterial color={hairColor} roughness={0.6} />
            </mesh>
            {/* Right Flowing Lock */}
            <mesh position={[0.074, -0.07, 0.02]} rotation={[0, 0, -0.05]} castShadow={castShadow}>
              <cylinderGeometry args={[0.016, 0.012, 0.16, 8]} />
              <meshStandardMaterial color={hairColor} roughness={0.6} />
            </mesh>
            {/* Back Hair Flowing Down */}
            <mesh position={[0, -0.07, -0.065]} rotation={[-0.1, 0, 0]} castShadow={castShadow}>
              <boxGeometry args={[0.13, 0.16, 0.03]} />
              <meshStandardMaterial color={hairColor} roughness={0.6} />
            </mesh>
          </group>
        )}

        {/* HAIRSTYLE 4: Ponytail (Nữ Trẻ Trung) */}
        {hairStyle === 'ponytail' && (
          <group position={[0, 0.015, -0.005]}>
            {/* Crown */}
            <mesh castShadow={castShadow}>
              <sphereGeometry args={[0.080, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
              <meshStandardMaterial color={hairColor} roughness={0.65} />
            </mesh>
            {/* Neat Side Hair */}
            <mesh position={[-0.075, -0.01, 0.02]}>
              <boxGeometry args={[0.012, 0.03, 0.025]} />
              <meshStandardMaterial color={hairColor} roughness={0.65} />
            </mesh>
            <mesh position={[0.075, -0.01, 0.02]}>
              <boxGeometry args={[0.012, 0.03, 0.025]} />
              <meshStandardMaterial color={hairColor} roughness={0.65} />
            </mesh>
            {/* Hair Scrunchie / Tie Ring */}
            <mesh position={[0, 0.045, -0.082]} rotation={[0.4, 0, 0]}>
              <torusGeometry args={[0.018, 0.007, 8, 16]} />
              <meshStandardMaterial color="#E11D48" roughness={0.4} />
            </mesh>
            {/* Ponytail Strand Arching Back and Down */}
            <mesh position={[0, 0.015, -0.11]} rotation={[-0.5, 0, 0]} castShadow={castShadow}>
              <cylinderGeometry args={[0.018, 0.010, 0.12, 8]} />
              <meshStandardMaterial color={hairColor} roughness={0.65} />
            </mesh>
          </group>
        )}

        {/* HAIRSTYLE 5: Graduation Mortarboard Cap */}
        {(hairStyle === 'grad-cap' || role === 'admin') && (
          <group position={[0, 0.08, 0]}>
            {/* Mortarboard square */}
            <mesh castShadow={castShadow}>
              <boxGeometry args={[0.17, 0.02, 0.17]} />
              <meshStandardMaterial color={role === 'admin' ? roleColors.cap : '#1E293B'} roughness={0.7} />
            </mesh>
            {/* Skull cap */}
            <mesh position={[0, -0.028, 0]}>
              <cylinderGeometry args={[0.065, 0.078, 0.042, 12]} />
              <meshStandardMaterial color={role === 'admin' ? roleColors.cap : '#1E293B'} roughness={0.7} />
            </mesh>
            {/* Tassel */}
            <mesh position={[0.078, -0.03, 0.078]}>
              <sphereGeometry args={[0.011, 8, 8]} />
              <meshStandardMaterial color="#F59E0B" />
            </mesh>
          </group>
        )}
      </group>

      {/* Neck */}
      <mesh position={[0, 1.04, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.045, 8]} />
        <meshStandardMaterial color="#FFDFC4" roughness={0.6} />
      </mesh>

      {/* ------------------------------------------------------------- */}
      {/* 2. TORSO & OUTFIT                                              */}
      {/* ------------------------------------------------------------- */}
      <group position={[0, 0.88, 0]}>
        {/* Jacket / Shirt Body */}
        <mesh castShadow={castShadow}>
          <boxGeometry args={[0.22, 0.28, 0.13]} />
          <meshStandardMaterial color={jacketColor} roughness={0.7} />
        </mesh>

        {/* White Shirt Collar */}
        <mesh position={[0, 0.10, 0.066]}>
          <planeGeometry args={[0.09, 0.075]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
        </mesh>

        {/* Tie Accessory */}
        {accessory === 'tie' && (
          <mesh position={[0, 0.04, 0.068]}>
            <boxGeometry args={[0.024, 0.12, 0.008]} />
            <meshStandardMaterial color={roleColors.tie} roughness={0.5} />
          </mesh>
        )}

        {/* Ribbon Accessory */}
        {accessory === 'ribbon' && (
          <group position={[0, 0.08, 0.068]}>
            <mesh position={[-0.015, 0, 0]} rotation={[0, 0, 0.3]}>
              <boxGeometry args={[0.020, 0.010, 0.006]} />
              <meshStandardMaterial color="#E11D48" roughness={0.5} />
            </mesh>
            <mesh position={[0.015, 0, 0]} rotation={[0, 0, -0.3]}>
              <boxGeometry args={[0.020, 0.010, 0.006]} />
              <meshStandardMaterial color="#E11D48" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0, 0.002]}>
              <sphereGeometry args={[0.006, 6, 6]} />
              <meshStandardMaterial color="#FBBF24" />
            </mesh>
          </group>
        )}
      </group>

      {/* ------------------------------------------------------------- */}
      {/* 3. ARMS                                                        */}
      {/* ------------------------------------------------------------- */}
      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.135, 0.98, 0]}>
        <mesh position={[0, -0.12, 0]} castShadow={castShadow}>
          <cylinderGeometry args={[0.026, 0.024, 0.24, 8]} />
          <meshStandardMaterial color={jacketColor} roughness={0.7} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.26, 0]}>
          <sphereGeometry args={[0.026, 8, 8]} />
          <meshStandardMaterial color="#FFDFC4" roughness={0.6} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.135, 0.98, 0]}>
        <mesh position={[0, -0.12, 0]} castShadow={castShadow}>
          <cylinderGeometry args={[0.026, 0.024, 0.24, 8]} />
          <meshStandardMaterial color={jacketColor} roughness={0.7} />
        </mesh>
        {/* Hand */}
        <mesh position={[0, -0.26, 0]}>
          <sphereGeometry args={[0.026, 8, 8]} />
          <meshStandardMaterial color="#FFDFC4" roughness={0.6} />
        </mesh>
      </group>

      {/* 💐 Handheld Celebration Bouquet (Active during Gifting Action) */}
      {isGifting && (
        <group position={[0, 0.82, 0.24]} rotation={[-0.25, 0, 0]}>
          {/* Paper wrapping cone */}
          <mesh position={[0, -0.05, 0]} rotation={[0.3, 0, 0]}>
            <coneGeometry args={[0.045, 0.14, 8]} />
            <meshStandardMaterial color="#FEF08A" roughness={0.4} metalness={0.1} />
          </mesh>
          {/* Main rose blossom */}
          <mesh position={[0, 0.05, 0]}>
            <sphereGeometry args={[0.055, 8, 8]} />
            <meshStandardMaterial color="#E11D48" roughness={0.6} />
          </mesh>
          {/* Side flower buds */}
          <mesh position={[0.035, 0.06, 0.02]}>
            <sphereGeometry args={[0.038, 6, 6]} />
            <meshStandardMaterial color="#F59E0B" roughness={0.6} />
          </mesh>
          <mesh position={[-0.035, 0.06, -0.02]}>
            <sphereGeometry args={[0.038, 6, 6]} />
            <meshStandardMaterial color="#EC4899" roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. LEGS WITH KNEE JOINTS                                       */}
      {/* ------------------------------------------------------------- */}
      {/* Left Leg */}
      <group position={[-0.062, 0.74, 0]}>
        <group ref={leftThighRef}>
          {/* Thigh (length 0.32m, center at -0.16m) */}
          <mesh position={[0, -0.16, 0]} castShadow={castShadow}>
            <cylinderGeometry args={[0.032, 0.029, 0.32, 8]} />
            <meshStandardMaterial color="#1E293B" roughness={0.8} />
          </mesh>

          {/* Knee Joint & Shin (Knee is at -0.32m from hip) */}
          <group ref={leftShinRef} position={[0, -0.32, 0]}>
            {/* Shin (length 0.38m, center at -0.19m) */}
            <mesh position={[0, -0.19, 0]} castShadow={castShadow}>
              <cylinderGeometry args={[0.028, 0.025, 0.38, 8]} />
              <meshStandardMaterial color="#1E293B" roughness={0.8} />
            </mesh>

            {/* Shoe (Height 0.04m, bottom at -0.38 - 0.04 = -0.42m from knee) */}
            <mesh position={[0, -0.40, 0.02]}>
              <boxGeometry args={[0.06, 0.04, 0.11]} />
              <meshStandardMaterial color="#0F172A" roughness={0.5} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Right Leg */}
      <group position={[0.062, 0.74, 0]}>
        <group ref={rightThighRef}>
          {/* Thigh */}
          <mesh position={[0, -0.16, 0]} castShadow={castShadow}>
            <cylinderGeometry args={[0.032, 0.029, 0.32, 8]} />
            <meshStandardMaterial color="#1E293B" roughness={0.8} />
          </mesh>

          {/* Knee Joint & Shin */}
          <group ref={rightShinRef} position={[0, -0.32, 0]}>
            {/* Shin */}
            <mesh position={[0, -0.19, 0]} castShadow={castShadow}>
              <cylinderGeometry args={[0.028, 0.025, 0.38, 8]} />
              <meshStandardMaterial color="#1E293B" roughness={0.8} />
            </mesh>

            {/* Shoe */}
            <mesh position={[0, -0.40, 0.02]}>
              <boxGeometry args={[0.06, 0.04, 0.11]} />
              <meshStandardMaterial color="#0F172A" roughness={0.5} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
};
