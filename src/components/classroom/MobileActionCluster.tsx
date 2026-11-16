import React from 'react';
import { CameraViewMode } from '../../types';
import { SmartAction } from '../../lib/interactionTargets';
import { 
  Eye, 
  Footprints, 
  Zap, 
  Armchair, 
  UserCheck, 
  Maximize2, 
  Heart, 
  Sparkles,
  Pin
} from 'lucide-react';

interface MobileActionClusterProps {
  viewMode: CameraViewMode;
  isRunning: boolean;
  isSeated: boolean;
  smartAction: SmartAction | null;
  onToggleViewMode: () => void;
  onToggleRunning: () => void;
  onTriggerSmartAction: (action: SmartAction) => void;
}

export const MobileActionCluster: React.FC<MobileActionClusterProps> = ({
  viewMode,
  isRunning,
  isSeated,
  smartAction,
  onToggleViewMode,
  onToggleRunning,
  onTriggerSmartAction,
}) => {
  // Determine smart button icon
  const renderSmartIcon = (iconName: string) => {
    switch (iconName) {
      case 'seat':
        return <Armchair className="w-6 h-6 stroke-[2.2]" />;
      case 'stand':
        return <UserCheck className="w-6 h-6 stroke-[2.2]" />;
      case 'projector':
        return <Maximize2 className="w-6 h-6 stroke-[2.2]" />;
      case 'teacher':
        return <Heart className="w-6 h-6 stroke-[2.2] fill-current" />;
      case 'memory_wall':
        return <Pin className="w-6 h-6 stroke-[2.2]" />;
      default:
        return <Sparkles className="w-6 h-6 stroke-[2.2]" />;
    }
  };

  // Determine smart button theme
  const getThemeClasses = (theme?: string) => {
    switch (theme) {
      case 'amber':
        return 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white border-amber-300/40 shadow-amber-500/30';
      case 'sky':
        return 'bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white border-sky-300/40 shadow-sky-500/30';
      case 'rose':
        return 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white border-rose-300/40 shadow-rose-500/30';
      case 'emerald':
      default:
        return 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border-emerald-300/40 shadow-emerald-500/30';
    }
  };

  return (
    <div className="flex flex-col gap-2.5 items-end select-none">
      {/* ------------------------------------------------------------- */}
      {/* TOP ROW: VIEW MODE + RUN/WALK TOGGLE                          */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center gap-2">
        {/* 1. Camera View Toggle Button */}
        <button
          onClick={onToggleViewMode}
          className={`w-20 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 border backdrop-blur-md shadow-lg transition-transform active:scale-95 ${
            viewMode === 'first-person'
              ? 'bg-amber-500/85 text-slate-950 border-amber-300 shadow-amber-500/20'
              : 'bg-slate-900/80 hover:bg-slate-800 text-gray-200 border-white/20'
          }`}
          title="Đổi góc nhìn (Thứ nhất / Thứ ba)"
        >
          <Eye className="w-5 h-5" />
          <span className="text-[11px] font-bold leading-tight">
            {viewMode === 'first-person' ? 'Góc nhìn 1' : 'Góc nhìn 3'}
          </span>
        </button>

        {/* 2. Run / Walk Toggle Button */}
        <button
          onClick={onToggleRunning}
          disabled={isSeated}
          className={`w-20 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 border backdrop-blur-md shadow-lg transition-transform active:scale-95 ${
            isSeated
              ? 'opacity-40 bg-slate-900/50 text-gray-400 border-white/10 cursor-not-allowed'
              : isRunning
              ? 'bg-amber-600 text-white border-amber-300 shadow-amber-500/30 animate-pulse'
              : 'bg-slate-900/80 hover:bg-slate-800 text-gray-200 border-white/20'
          }`}
          title={isSeated ? 'Không thể chạy khi đang ngồi' : 'Bật/tắt chế độ chạy nhanh'}
        >
          {isRunning ? <Zap className="w-5 h-5 text-amber-200 fill-amber-200" /> : <Footprints className="w-5 h-5" />}
          <span className="text-[11px] font-bold leading-tight">
            {isRunning ? 'Chạy' : 'Đi bộ'}
          </span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM ROW: PROMINENT SMART CONTEXT ACTION BUTTON             */}
      {/* ------------------------------------------------------------- */}
      {smartAction ? (
        <button
          onClick={() => onTriggerSmartAction(smartAction)}
          className={`w-42 sm:w-48 h-16 rounded-2xl border-2 flex items-center justify-center gap-2.5 px-3 py-2 shadow-2xl backdrop-blur-md transition-all active:scale-95 ${getThemeClasses(
            smartAction.colorTheme
          )}`}
        >
          {renderSmartIcon(smartAction.iconName)}
          <div className="flex flex-col text-left">
            <span className="text-sm font-extrabold leading-tight tracking-wide">
              {smartAction.label}
            </span>
            {smartAction.subLabel && (
              <span className="text-[10px] font-medium opacity-85 leading-none mt-0.5 truncate max-w-[120px]">
                {smartAction.subLabel}
              </span>
            )}
          </div>
        </button>
      ) : (
        /* Subtle empty placeholder so layout remains stable without covering screen */
        <div className="w-42 sm:w-48 h-16 rounded-2xl border border-dashed border-white/10 bg-black/20 backdrop-blur-xs flex items-center justify-center text-gray-400/60 pointer-events-none">
          <span className="text-[11px] font-medium">Đến gần vật thể để tương tác</span>
        </div>
      )}
    </div>
  );
};

