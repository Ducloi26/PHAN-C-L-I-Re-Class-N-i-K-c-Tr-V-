import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PlayerState, CameraViewMode, SeatInfo } from '../../types';
import { findNearestSeat, CLASSROOM_SEATS } from '../../lib/seatData';
import { resolveKinematicCollision, resolveCameraCollision, getSafeStandPosition } from '../../lib/collision';

interface LocalPlayerControllerProps {
  player: PlayerState;
  viewMode: CameraViewMode;
  mobileMove: { x: number; y: number };
  remotePlayers: PlayerState[];
  isInputDisabled?: boolean;
  isRunning?: boolean;
  cameraSensitivity?: number;
  onUpdatePlayer: (updater: (prev: PlayerState) => PlayerState) => void;
  onNearestSeatChange: (seat: SeatInfo | null) => void;
  onTriggerSmartAction?: () => void;
  onViewModeChange?: (mode: CameraViewMode) => void;
}

export const LocalPlayerController: React.FC<LocalPlayerControllerProps> = ({
  player,
  viewMode,
  mobileMove,
  remotePlayers,
  isInputDisabled = false,
  isRunning = false,
  cameraSensitivity = 1.0,
  onUpdatePlayer,
  onNearestSeatChange,
  onTriggerSmartAction,
  onViewModeChange,
}) => {
  const { camera, gl } = useThree();

  // Input state
  const keys = useRef<Record<string, boolean>>({});
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });

  // Camera angles (yaw around Y axis, pitch around X axis)
  // cameraYaw = 0 points towards blackboard (-Z)
  const cameraYaw = useRef(player.rotY === Math.PI ? 0 : (player.rotY === 0 ? Math.PI : player.rotY));
  const cameraPitch = useRef(-0.1);
  useEffect(() => {
    if (player.state === 'sitting') {
      cameraYaw.current = player.rotY === 0 ? Math.PI : 0;
      cameraPitch.current = -0.1;
    }
  }, [player.seatId, player.state]);

  const nearestAvailableSeat = () => findNearestSeat(player.x, player.z, undefined, (seat) =>
    (!seat.isTeacherSeat || player.role === 'teacher' || player.role === 'admin') &&
    !remotePlayers.some((p) => p.state === 'sitting' && p.seatId === seat.id));

  // Clear keys when input is disabled (e.g. modals open)
  useEffect(() => {
    if (isInputDisabled) {
      keys.current = {};
    }
  }, [isInputDisabled]);

  useEffect(() => {
    const isTextInputActive = () => {
      const tag = document.activeElement?.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA';
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInputDisabled || isTextInputActive()) {
        keys.current = {};
        return;
      }
      keys.current[e.code] = true;

      // Handle 'E' key for smart action (sit, stand, projector, teacher)
      if (e.code === 'KeyE' && !e.repeat) {
        if (onTriggerSmartAction) {
          onTriggerSmartAction();
        } else if (player.state === 'sitting') {
          // Stand up fallback
          const currentSeat = CLASSROOM_SEATS.find((s) => s.id === player.seatId);
          const safePos = currentSeat
            ? getSafeStandPosition(currentSeat)
            : { x: player.x, y: 0, z: player.z + 0.40 };

          onUpdatePlayer((prev) => ({
            ...prev,
            state: 'standing',
            seatId: null,
            x: safePos.x,
            y: 0,
            z: safePos.z,
          }));
        } else {
          // Sit if near an unoccupied seat (within 1.05m arm's reach)
          const seat = nearestAvailableSeat();
          if (seat) {
            const isOccupied = remotePlayers.some((p) => p.seatId === seat.id && p.state === 'sitting');
            if (!isOccupied) {
              cameraYaw.current = seat.seatAnchor.rotY === 0 ? Math.PI : 0;
              onUpdatePlayer((prev) => ({
                ...prev,
                x: seat.seatAnchor.x,
                y: seat.seatAnchor.y,
                z: seat.seatAnchor.z,
                rotY: seat.seatAnchor.rotY,
                state: 'sitting',
                seatId: seat.id,
              }));
            }
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    const domElement = gl.domElement;

    // Mouse drag to look around (Desktop)
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDragging.current = true;
        previousMouse.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - previousMouse.current.x;
      const deltaY = e.clientY - previousMouse.current.y;
      previousMouse.current = { x: e.clientX, y: e.clientY };

      const sensitivity = 0.0035 * cameraSensitivity;
      cameraYaw.current -= deltaX * sensitivity;
      cameraPitch.current = Math.max(-0.65, Math.min(0.65, cameraPitch.current - deltaY * sensitivity));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    // Dedicated right-side camera touch tracking (Supports multi-touch while left thumb holds joystick!)
    const cameraTouchId = { current: null as number | null };
    const prevTouchPos = { current: { x: 0, y: 0 } };

    const handleTouchStart = (e: TouchEvent) => {
      if (isInputDisabled) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        // Claim touches on right area of screen (>= 30% width) not on UI buttons
        if (touch.clientX > window.innerWidth * 0.30 && cameraTouchId.current === null) {
          const target = document.elementFromPoint(touch.clientX, touch.clientY);
          if (
            target?.closest('button') ||
            target?.closest('[role="button"]') ||
            target?.closest('input') ||
            target?.closest('textarea')
          ) {
            continue;
          }
          cameraTouchId.current = touch.identifier;
          prevTouchPos.current = { x: touch.clientX, y: touch.clientY };
          break;
        }
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (cameraTouchId.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === cameraTouchId.current) {
          const deltaX = touch.clientX - prevTouchPos.current.x;
          const deltaY = touch.clientY - prevTouchPos.current.y;
          prevTouchPos.current = { x: touch.clientX, y: touch.clientY };

          const baseSens = 0.0040 * cameraSensitivity;
          cameraYaw.current -= deltaX * baseSens;
          cameraPitch.current = Math.max(-0.65, Math.min(0.65, cameraPitch.current - deltaY * baseSens));
          break;
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (cameraTouchId.current === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === cameraTouchId.current) {
          cameraTouchId.current = null;
          break;
        }
      }
    };

    const handleWindowBlur = () => {
      cameraTouchId.current = null;
      isDragging.current = false;
      keys.current = {};
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    domElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      domElement.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [
    gl,
    player.state,
    player.x,
    player.z,
    player.seatId,
    remotePlayers,
    isInputDisabled,
    cameraSensitivity,
    onTriggerSmartAction,
    onUpdatePlayer,
  ]);

  useFrame((_, delta) => {
    // If input is disabled (modal open), clear inputs
    if (isInputDisabled) {
      keys.current = {};
    }

    // ---------------------------------------------------------------
    // 1. SITTING STATE BEHAVIOR (WASD is locked to prevent sliding)
    // ---------------------------------------------------------------
    if (player.state === 'sitting') {
      onNearestSeatChange(null);

      // WASD is completely LOCKED when seated as per P2 requirements!
      // Only pressing 'KeyE' or clicking the UI button can stand up.

      // Camera view while sitting (compact student avatar)
      if (viewMode === 'first-person') {
        const eyeY = 0.88; // Seated eye level
        camera.position.set(player.x, eyeY, player.z);
        camera.rotation.set(cameraPitch.current, cameraYaw.current, 0, 'YXZ');
      } else if (viewMode === 'third-person') {
        const pivot = new THREE.Vector3(player.x, 0.72, player.z);
        const dist = 1.70;
        const desiredCam = new THREE.Vector3(
          player.x + Math.sin(cameraYaw.current) * Math.cos(cameraPitch.current) * dist,
          0.72 - Math.sin(cameraPitch.current) * dist + 0.30,
          player.z + Math.cos(cameraYaw.current) * Math.cos(cameraPitch.current) * dist
        );
        const safeCam = resolveCameraCollision(pivot, desiredCam, 0.20);
        camera.position.copy(safeCam);
        camera.lookAt(player.x, 0.68, player.z);
      }
      return;
    }

    // ---------------------------------------------------------------
    // 2. STANDING / WALKING MOVEMENT & CAMERA ORIENTATION
    // ---------------------------------------------------------------
    const nearest = nearestAvailableSeat();
    onNearestSeatChange(nearest);

    // Calculate camera horizontal forward and right vectors
    // When cameraYaw = 0, camera looks at front/blackboard (-Z)
    const camForward = new THREE.Vector3(
      -Math.sin(cameraYaw.current),
      0,
      -Math.cos(cameraYaw.current)
    ).normalize();

    // Screen-right vector = camForward × Up(0, 1, 0) = (-camForward.z, 0, camForward.x)
    const camRight = new THREE.Vector3(
      -camForward.z,
      0,
      camForward.x
    ).normalize();

    let inputForward = 0;
    let inputRight = 0;

    // Keyboard inputs
    if (keys.current['KeyW'] || keys.current['ArrowUp']) inputForward += 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown']) inputForward -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) inputRight += 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) inputRight -= 1;

    // Mobile Joystick inputs
    if (mobileMove.y !== 0) inputForward -= mobileMove.y;
    if (mobileMove.x !== 0) inputRight += mobileMove.x;

    const isMoving = inputForward !== 0 || inputRight !== 0;

    if (isMoving) {
      // Automatically switch back to 3rd person follow camera if moving
      if (viewMode === 'orbit' && onViewModeChange) {
        onViewModeChange('third-person');
      }

      // Build movement direction in world space
      // W / Up (+1) moves forward along camForward
      // S / Down (-1) moves backward along -camForward
      // D / Right (+1) moves right along camRight
      // A / Left (-1) moves left along -camRight
      const moveDir = new THREE.Vector3()
        .addScaledVector(camForward, inputForward)
        .addScaledVector(camRight, inputRight);

      // Normalize diagonal movement so speed does not increase
      if (moveDir.lengthSq() > 0) {
        moveDir.normalize();
      }

      // Speed: 3.0 m/s walking, 5.2 m/s running (controlled by shift or run toggle)
      const isShiftPressed = Boolean(keys.current['ShiftLeft'] || keys.current['ShiftRight']);
      const effectiveRunning = isRunning || isShiftPressed;
      const speed = effectiveRunning ? 5.2 : 3.0;
      const dt = Math.min(delta, 0.08); // Clamp max delta to avoid frame spikes
      const dx = moveDir.x * speed * dt;
      const dz = moveDir.z * speed * dt;

      // Kinematic collision resolution against classroom walls, desks, benches
      const resolved = resolveKinematicCollision(
        { x: player.x, z: player.z },
        { x: dx, z: dz },
        0.20 // 0.20m radius (0.40m human width)
      );

      // Character facing rotation
      let newRotY = player.rotY;
      if (viewMode === 'first-person') {
        newRotY = cameraYaw.current + Math.PI;
        while (newRotY > Math.PI) newRotY -= Math.PI * 2;
        while (newRotY < -Math.PI) newRotY += Math.PI * 2;
      } else {
        // Third person: smoothly turn character to face movement direction
        const targetAngle = Math.atan2(moveDir.x, moveDir.z);
        let diff = targetAngle - player.rotY;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        newRotY = player.rotY + diff * 0.20;
      }

      onUpdatePlayer((prev) => ({
        ...prev,
        x: resolved.x,
        z: resolved.z,
        rotY: newRotY,
        state: 'walking',
      }));
    } else {
      // Idle / standing
      let newRotY = player.rotY;
      if (viewMode === 'first-person') {
        newRotY = cameraYaw.current + Math.PI;
        while (newRotY > Math.PI) newRotY -= Math.PI * 2;
        while (newRotY < -Math.PI) newRotY += Math.PI * 2;
      }

      if (player.state === 'walking' || player.rotY !== newRotY) {
        onUpdatePlayer((prev) => ({
          ...prev,
          rotY: newRotY,
          state: prev.state === 'gifting' ? 'gifting' : 'standing',
        }));
      }
    }

    // ---------------------------------------------------------------
    // 3. CAMERA UPDATE (FIRST-PERSON vs THIRD-PERSON WHEN STANDING/WALKING)
    // ---------------------------------------------------------------
    if (viewMode === 'first-person') {
      // First person: camera at player's eye level (1.08m standing)
      const eyeY = 1.08;
      camera.position.set(player.x, eyeY, player.z);
      camera.rotation.set(cameraPitch.current, cameraYaw.current, 0, 'YXZ');
    } else if (viewMode === 'third-person') {
      // Third person: camera framed behind character with safe collision raycast
      const pivotY = 0.85;
      const lookAtY = 0.80;
      const camDist = 1.95;
      const pivot = new THREE.Vector3(player.x, pivotY, player.z);
      const desiredCam = new THREE.Vector3(
        player.x + Math.sin(cameraYaw.current) * Math.cos(cameraPitch.current) * camDist,
        pivotY - Math.sin(cameraPitch.current) * camDist + 0.32,
        player.z + Math.cos(cameraYaw.current) * Math.cos(cameraPitch.current) * camDist
      );

      // Prevent camera from clipping through room walls
      const safeCam = resolveCameraCollision(pivot, desiredCam, 0.20);
      camera.position.copy(safeCam);
      camera.lookAt(player.x, lookAtY, player.z);
    }
  });

  return null;
};
