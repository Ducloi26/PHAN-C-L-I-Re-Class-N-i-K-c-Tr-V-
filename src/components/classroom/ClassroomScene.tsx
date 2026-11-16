import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { CAMERA_PRESETS } from '../../lib/cameraPresets';
import { CameraLens } from './CameraLens';
import type { CameraZoom } from '../../lib/cameraZoom';
import { CameraPreset, CameraViewMode, ProjectorState, PlayerState, SeatInfo, FlowerType, MemoryMark } from '../../types';
import { CameraControls } from './CameraControls';
import { ClassroomFurniture } from './ClassroomFurniture';
import { ProjectorScreen3D } from './ProjectorScreen3D';
import { Avatar3D } from './Avatar3D';
import { SeatMarkers } from './SeatMarkers';
import { LocalPlayerController } from './LocalPlayerController';
import { FlowerBurst3D } from './FlowerBurst3D';
import { MemoryWall3D } from './MemoryWall3D';

interface ClassroomSceneProps {
  cameraZoom?: CameraZoom;
  preset: CameraPreset;
  viewMode: CameraViewMode;
  projector: ProjectorState | null;
  liveMedia?: React.ReactNode;
  localPlayer: PlayerState;
  remotePlayers: PlayerState[];
  nearestSeat: SeatInfo | null;
  mobileMove: { x: number; y: number };
  isInputDisabled?: boolean;
  flowerBurstTime?: number;
  flowerType?: FlowerType;
  isRunning?: boolean;
  cameraSensitivity?: number;
  marks?: MemoryMark[];
  graphicsQuality?: 'low' | 'medium' | 'high';
  onUpdatePlayer: (updater: (prev: PlayerState) => PlayerState) => void;
  onNearestSeatChange: (seat: SeatInfo | null) => void;
  onSit: (seat: SeatInfo) => void;
  onStand: () => void;
  onOpenOverlay: () => void;
  onOpenMemoryWall?: () => void;
  onTriggerSmartAction?: () => void;
  onViewModeChange?: (mode: CameraViewMode) => void;
}

export const ClassroomScene: React.FC<ClassroomSceneProps> = ({
  cameraZoom = 1,
  preset,
  viewMode,
  projector,
  liveMedia,
  localPlayer,
  remotePlayers,
  nearestSeat,
  mobileMove,
  isInputDisabled = false,
  flowerBurstTime = 0,
  flowerType = 'rose',
  isRunning = false,
  cameraSensitivity = 1.0,
  marks = [],
  graphicsQuality = 'medium',
  onUpdatePlayer,
  onNearestSeatChange,
  onSit,
  onStand,
  onOpenOverlay,
  onOpenMemoryWall,
  onTriggerSmartAction,
  onViewModeChange,
}) => {
  const isLowQuality = graphicsQuality === 'low';
  const isHighQuality = graphicsQuality === 'high';
  const dprRange: [number, number] = isLowQuality ? [1, 1] : isHighQuality ? [1, 1.75] : [1, 1.25];

  return (
    <div className="w-full h-full relative isolate select-none bg-[#1C140E]">
      <Canvas
        shadows={!isLowQuality}
        dpr={dprRange}
        camera={{ position: CAMERA_PRESETS.overview.position, fov: 55 }}
        gl={{ 
          antialias: !isLowQuality, 
          alpha: false, 
          preserveDrawingBuffer: true, // Enables high-res canvas screenshot photo booth
          powerPreference: 'high-performance' 
        }}
      >
        <CameraLens zoom={cameraZoom} />
        <color attach="background" args={['#241B16']} />
        
        {/* Soft Ambient Light for warm classroom mood */}
        <ambientLight color="#FFF6E5" intensity={isLowQuality ? 0.85 : 0.7} />

        {/* Sunlight streaming in through the right-side windows */}
        <directionalLight
          position={[9, 7, 2]}
          color="#FEF08A"
          intensity={1.25}
          castShadow={!isLowQuality}
          shadow-mapSize-width={isHighQuality ? 2048 : 1024}
          shadow-mapSize-height={isHighQuality ? 2048 : 1024}
          shadow-camera-far={25}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />

        {/* Fill light from back */}
        <directionalLight position={[-4, 5, 8]} color="#E0E7FF" intensity={0.35} />

        {/* Scene Contents */}
        <Suspense fallback={null}>
          {/* Architecture & Furniture */}
          <ClassroomFurniture />
          
          {/* Common Projector Screen with Retrospective support */}
          <ProjectorScreen3D 
            liveMedia={liveMedia}
            projector={projector} 
            marks={marks}
            onOpenOverlay={onOpenOverlay} 
          />

          {/* Bức Tường Dấu Ấn 3D ("Chúng ta đã từng ở đây") */}
          <MemoryWall3D
            marks={marks}
            onOpenModal={onOpenMemoryWall || (() => {})}
          />

          {/* 3D Flower Petals Celebration Effect */}
          <FlowerBurst3D burstTimestamp={flowerBurstTime} flowerType={flowerType} />

          {/* Seat interaction markers */}
          <SeatMarkers
            localPlayer={localPlayer}
            remotePlayers={remotePlayers}
            nearestSeat={nearestSeat}
            onSit={onSit}
            onStand={onStand}
          />

          {/* Local Avatar */}
          <Avatar3D
            player={localPlayer}
            isLocal
            hideBody={viewMode === 'first-person'}
          />

          {/* Remote Players Avatars */}
          {remotePlayers.map((remotePlayer) => (
            <Avatar3D
              key={remotePlayer.id}
              player={remotePlayer}
              isLocal={false}
            />
          ))}

          {/* Camera Controls (Only active in Orbit / Free Camera view mode) */}
          {viewMode === 'orbit' && (
            <CameraControls
              preset={preset}
            />
          )}

          {/* Player Controller (WASD, Mobile Joystick, Collision & Camera Yaw Tracking) */}
          <LocalPlayerController
            player={localPlayer}
            viewMode={viewMode}
            mobileMove={mobileMove}
            remotePlayers={remotePlayers}
            isInputDisabled={isInputDisabled}
            isRunning={isRunning}
            cameraSensitivity={cameraSensitivity}
            onUpdatePlayer={onUpdatePlayer}
            onNearestSeatChange={onNearestSeatChange}
            onTriggerSmartAction={onTriggerSmartAction}
            onViewModeChange={onViewModeChange}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};
