import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Move } from 'lucide-react';

interface MobileJoystickProps {
  onMove: (vec: { x: number; y: number }) => void;
  disabled?: boolean;
}

export const MobileJoystick: React.FC<MobileJoystickProps> = ({ onMove, disabled = false }) => {
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const activePointerId = useRef<number | null>(null);
  const baseRef = useRef<HTMLDivElement>(null);

  const BASE_RADIUS = 56; // 112px diameter base
  const MAX_TRAVEL = 40;  // Maximum knob displacement from center
  const DEAD_ZONE = 0.08; // 8% deadzone to prevent accidental micro-drifting

  const resetJoystick = useCallback(() => {
    activePointerId.current = null;
    setActive(false);
    setKnobPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  }, [onMove]);

  // Handle window blur, tab switch, or visibility change to avoid stuck joystick
  useEffect(() => {
    const handleBlur = () => resetJoystick();
    const handleVisibilityChange = () => {
      if (document.hidden) resetJoystick();
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [resetJoystick]);

  // Reset if disabled while dragging (e.g. seated)
  useEffect(() => {
    if (disabled && active) {
      resetJoystick();
    }
  }, [disabled, active, resetJoystick]);

  const updateKnobPosition = (clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist < MAX_TRAVEL * DEAD_ZONE) {
      // Inside dead zone: knob stays at center, no movement
      setKnobPos({ x: 0, y: 0 });
      onMove({ x: 0, y: 0 });
      return;
    }

    if (dist <= MAX_TRAVEL) {
      setKnobPos({ x: dx, y: dy });
      // Normalize output between -1 and 1
      onMove({
        x: Number((dx / MAX_TRAVEL).toFixed(3)),
        y: Number((dy / MAX_TRAVEL).toFixed(3)),
      });
    } else {
      const angle = Math.atan2(dy, dx);
      const clampedX = Math.cos(angle) * MAX_TRAVEL;
      const clampedY = Math.sin(angle) * MAX_TRAVEL;
      setKnobPos({ x: clampedX, y: clampedY });
      onMove({
        x: Number(Math.cos(angle).toFixed(3)),
        y: Number(Math.sin(angle).toFixed(3)),
      });
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || activePointerId.current !== null) return;
    e.stopPropagation();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback if setPointerCapture fails
    }

    activePointerId.current = e.pointerId;
    setActive(true);
    updateKnobPosition(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current !== e.pointerId) return;
    e.stopPropagation();
    updateKnobPosition(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current === e.pointerId) {
      e.stopPropagation();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
      resetJoystick();
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerId.current === e.pointerId) {
      resetJoystick();
    }
  };

  return (
    <div className="flex flex-col items-center select-none touch-none">
      {/* Joystick Base Ring */}
      <div
        ref={baseRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{ width: `${BASE_RADIUS * 2}px`, height: `${BASE_RADIUS * 2}px` }}
        className={`relative rounded-full border-2 flex items-center justify-center transition-opacity shadow-2xl backdrop-blur-md cursor-pointer ${
          disabled
            ? 'opacity-40 border-gray-600 bg-slate-900/50 cursor-not-allowed'
            : active
            ? 'border-emerald-400 bg-emerald-950/70 shadow-emerald-500/20'
            : 'border-emerald-500/30 bg-[#162a26]/80 hover:border-emerald-400/60'
        }`}
      >
        {/* Direction Crosslines */}
        <div className="absolute w-full h-[1px] bg-white/10 pointer-events-none" />
        <div className="absolute h-full w-[1px] bg-white/10 pointer-events-none" />

        {/* Outer concentric subtle ring */}
        <div className="absolute w-20 h-20 rounded-full border border-white/5 pointer-events-none" />

        {/* Joystick Center Knob (Styled exactly as in the wireframe: white circle with 4-way arrows) */}
        <div
          style={{
            transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
          }}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center pointer-events-none transition-transform duration-75 ${
            disabled
              ? 'bg-gray-400 text-gray-700'
              : active
              ? 'bg-white text-slate-900 shadow-2xl scale-105 ring-2 ring-emerald-400'
              : 'bg-white/95 text-slate-800 shadow-lg'
          }`}
        >
          <Move className="w-6 h-6 stroke-[2.2]" />
        </div>
      </div>

      {/* Label underneath: "Di chuyển" */}
      <span className="text-[11px] font-semibold tracking-wider text-emerald-200/90 mt-1.5 uppercase drop-shadow">
        {disabled ? 'Khóa (Đang ngồi)' : 'Di chuyển'}
      </span>
    </div>
  );
};
