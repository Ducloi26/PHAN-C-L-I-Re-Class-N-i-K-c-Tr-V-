import React, { useState, useEffect } from 'react';
import { Smartphone, X } from 'lucide-react';

export const LandscapePrompt: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Portrait if window height is noticeably larger than width and device is phone-sized
      const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 800;
      setIsPortrait(portrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait || dismissed) return null;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm bg-slate-900/95 border border-amber-400/60 rounded-2xl p-3 shadow-2xl backdrop-blur-md flex items-center justify-between text-white animate-fadeIn">
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl animate-bounce">
          <Smartphone className="w-5 h-5 rotate-90" />
        </div>
        <div className="text-left">
          <p className="text-xs font-bold text-amber-200">Gợi ý trải nghiệm</p>
          <p className="text-[11px] text-gray-300">
            Xoay ngang điện thoại để điều khiển joystick & quan sát lớp học tốt nhất!
          </p>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 text-gray-400 hover:text-white rounded-full hover:bg-white/10 ml-2"
        title="Bỏ qua"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

