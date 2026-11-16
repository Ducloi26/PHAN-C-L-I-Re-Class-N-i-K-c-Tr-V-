import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Move, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';

interface OnScreenMovementControllerProps {
  onMove: (vec: { x: number; y: number }) => void;
  disabled?: boolean;
}

export const OnScreenMovementController: React.FC<OnScreenMovementControllerProps> = ({
  onMove,
  disabled = false,
}) => {
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const [activeDirection, setActiveDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);

  const activePointerId = useRef<number | null>(null);
  const baseRef = useRef<HTMLDivElement>(null);

  // Enlarged dimensions for comfortable desktop clicking & mobile touch
  const BASE_RADIUS = 68; // 136px diameter base
  const MAX_TRAVEL = 48;  // Maximum knob displacement from center
  const DEAD_ZONE = 0.08; // 8% deadzone

  const resetJoystick = useCallback(() => {
    activePointerId.current = null;
    setActive(false);
    setActiveDirection(null);
    setKnobPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0 });
  }, [onMove]);

  // Handle window blur or tab switch
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

  // Reset if disabled (e.g. seated)
  useEffect(() => {
    if (disabled && (active || activeDirection)) {
      resetJoystick();
    }
  }, [disabled, active, activeDirection, resetJoystick]);

  // Pointer update for free joystick drag
  const updateKnobPosition = (clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Pointer coordinates are physical pixels; travel is in unscaled control
    // units. Keep the same sensitivity when CSS shrinks the whole joystick.
    const scale = rect.width / (BASE_RADIUS * 2);
    if (scale <= 0) return;
    const dx = (clientX - centerX) / scale;
    const dy = (clientY - centerY) / scale;
    const dist = Math.hypot(dx, dy);

    if (dist < MAX_TRAVEL * DEAD_ZONE) {
      setKnobPos({ x: 0, y: 0 });
      onMove({ x: 0, y: 0 });
      return;
    }

    if (dist <= MAX_TRAVEL) {
      setKnobPos({ x: dx, y: dy });
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
    } catch {}

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
      } catch {}
      resetJoystick();
    }
  };

  // Directional button click/hold handlers
  const handleDirectionDown = (dir: 'up' | 'down' | 'left' | 'right') => {
    if (disabled) return;
    setActiveDirection(dir);
    switch (dir) {
      case 'up':
        setKnobPos({ x: 0, y: -MAX_TRAVEL });
        onMove({ x: 0, y: -1 });
        break;
      case 'down':
        setKnobPos({ x: 0, y: MAX_TRAVEL });
        onMove({ x: 0, y: 1 });
        break;
      case 'left':
        setKnobPos({ x: -MAX_TRAVEL, y: 0 });
        onMove({ x: -1, y: 0 });
        break;
      case 'right':
        setKnobPos({ x: MAX_TRAVEL, y: 0 });
        onMove({ x: 1, y: 0 });
        break;
    }
  };

  const handleDirectionUp = () => {
    resetJoystick();
  };

  return (
    <div className="classroom-joystick relative flex items-center justify-center select-none touch-none animate-fadeIn p-2">
      {/* ------------------------------------------------------------- */}
      {/* 4 PROMINENT DIRECTIONAL BUTTONS (UP, DOWN, LEFT, RIGHT)       */}
      {/* ------------------------------------------------------------- */}
      
      {/* North Directional Button (Tiến lên) */}
      <button
        onPointerDown={() => handleDirectionDown('up')}
        onPointerUp={handleDirectionUp}
        onPointerCancel={handleDirectionUp}
        onPointerLeave={handleDirectionUp}
        disabled={disabled}
        className={`absolute -top-3.5 z-20 w-14 h-10 rounded-t-2xl border-2 flex items-center justify-center transition-all shadow-xl active:scale-95 cursor-pointer ${
          activeDirection === 'up'
            ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400 shadow-amber-500/40'
            : 'bg-slate-900/95 hover:bg-slate-800 text-amber-300 border-amber-500/40 hover:border-amber-400'
        }`}
        title="Tiến lên (W / Mũi tên lên)"
      >
        <ChevronUp className="w-7 h-7 stroke-[3]" />
      </button>

      {/* South Directional Button (Lùi lại) */}
      <button
        onPointerDown={() => handleDirectionDown('down')}
        onPointerUp={handleDirectionUp}
        onPointerCancel={handleDirectionUp}
        onPointerLeave={handleDirectionUp}
        disabled={disabled}
        className={`absolute -bottom-3.5 z-20 w-14 h-10 rounded-b-2xl border-2 flex items-center justify-center transition-all shadow-xl active:scale-95 cursor-pointer ${
          activeDirection === 'down'
            ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400 shadow-amber-500/40'
            : 'bg-slate-900/95 hover:bg-slate-800 text-amber-300 border-amber-500/40 hover:border-amber-400'
        }`}
        title="Lùi lại (S / Mũi tên xuống)"
      >
        <ChevronDown className="w-7 h-7 stroke-[3]" />
      </button>

      {/* West Directional Button (Sang trái) */}
      <button
        onPointerDown={() => handleDirectionDown('left')}
        onPointerUp={handleDirectionUp}
        onPointerCancel={handleDirectionUp}
        onPointerLeave={handleDirectionUp}
        disabled={disabled}
        className={`absolute -left-3.5 z-20 w-10 h-14 rounded-l-2xl border-2 flex items-center justify-center transition-all shadow-xl active:scale-95 cursor-pointer ${
          activeDirection === 'left'
            ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400 shadow-amber-500/40'
            : 'bg-slate-900/95 hover:bg-slate-800 text-amber-300 border-amber-500/40 hover:border-amber-400'
        }`}
        title="Sang trái (A / Mũi tên trái)"
      >
        <ChevronLeft className="w-7 h-7 stroke-[3]" />
      </button>

      {/* East Directional Button (Sang phải) */}
      <button
        onPointerDown={() => handleDirectionDown('right')}
        onPointerUp={handleDirectionUp}
        onPointerCancel={handleDirectionUp}
        onPointerLeave={handleDirectionUp}
        disabled={disabled}
        className={`absolute -right-3.5 z-20 w-10 h-14 rounded-r-2xl border-2 flex items-center justify-center transition-all shadow-xl active:scale-95 cursor-pointer ${
          activeDirection === 'right'
            ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-400 shadow-amber-500/40'
            : 'bg-slate-900/95 hover:bg-slate-800 text-amber-300 border-amber-500/40 hover:border-amber-400'
        }`}
        title="Sang phải (D / Mũi tên phải)"
      >
        <ChevronRight className="w-7 h-7 stroke-[3]" />
      </button>

      {/* ------------------------------------------------------------- */}
      {/* VIRTUAL JOYSTICK BASE (360-degree analog drag area)           */}
      {/* ------------------------------------------------------------- */}
      <div
        ref={baseRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={resetJoystick}
        style={{ width: `calc(${BASE_RADIUS * 2} * var(--control-unit, 1px))`, height: `calc(${BASE_RADIUS * 2} * var(--control-unit, 1px))` }}
        className={`relative rounded-full border-2 flex items-center justify-center transition-all shadow-2xl backdrop-blur-md cursor-pointer ${
          disabled
            ? 'opacity-40 border-gray-600 bg-slate-900/60 cursor-not-allowed'
            : active
            ? 'border-emerald-400 bg-emerald-950/85 ring-4 ring-emerald-500/30 shadow-emerald-500/40'
            : 'border-emerald-500/50 bg-[#0F231E]/85 hover:border-emerald-400/80 hover:bg-[#132c25]/90'
        }`}
      >
        {/* Subtle crosshair guide lines */}
        <div className="absolute w-full h-[1px] bg-white/10 pointer-events-none" />
        <div className="absolute h-full w-[1px] bg-white/10 pointer-events-none" />
        <div className="absolute w-24 h-24 rounded-full border border-white/5 pointer-events-none" />

        {/* Large Draggable Knob */}
        <div
          style={{
            transform: `translate3d(calc(${knobPos.x} * var(--control-unit, 1px)), calc(${knobPos.y} * var(--control-unit, 1px)), 0)`,
          }}
          className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center pointer-events-none transition-transform duration-75 border ${
            disabled
              ? 'bg-gray-500 text-gray-800 border-gray-400'
              : active
              ? 'bg-gradient-to-br from-white to-amber-100 text-slate-950 scale-110 ring-4 ring-emerald-400 border-white'
              : 'bg-gradient-to-br from-white to-gray-200 text-slate-800 border-white/80 shadow-lg'
          }`}
        >
          <Move className="w-7 h-7 stroke-[2.5]" />
        </div>
      </div>
    </div>
  );
};
