import React, { useState, useEffect } from 'react';
import { 
  X, 
  Heart, 
  BookOpen, 
  Projector, 
  MapPin, 
  Users, 
  Sparkles, 
  Sliders, 
  LogOut,
  ChevronRight,
  Camera,
  Volume2,
  VolumeX,
  Music,
  Bell,
  Monitor
} from 'lucide-react';
import { soundManager } from '../../lib/audioManager';

interface MobileMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlineCount: number;
  onOpenWishes: () => void;
  onOpenFlowers: () => void;
  onOpenProjector: () => void;
  onOpenProjectorControls?: () => void;
  onOpenMap: () => void;
  onOpenUsers: () => void;
  onOpenAvatar: () => void;
  onOpenMemoryWall?: () => void;
  onTakePhoto?: () => void;
  onLogout: () => void;
  sensitivity: number;
  onSensitivityChange: (val: number) => void;
  graphicsQuality: 'low' | 'medium' | 'high';
  onGraphicsQualityChange: (quality: 'low' | 'medium' | 'high') => void;
  isStaff?: boolean;
  bgmSuspended?: boolean;
  wishesNotificationEnabled?: boolean;
  onToggleWishesNotification?: () => void;
}

export const MobileMenuModal: React.FC<MobileMenuModalProps> = ({
  isOpen,
  onClose,
  onlineCount,
  onOpenWishes,
  onOpenFlowers,
  onOpenProjector,
  onOpenProjectorControls,
  onOpenMap,
  onOpenUsers,
  onOpenAvatar,
  onOpenMemoryWall,
  onTakePhoto,
  onLogout,
  sensitivity,
  onSensitivityChange,
  graphicsQuality,
  onGraphicsQualityChange,
  isStaff = false,
  bgmSuspended = false,
  wishesNotificationEnabled = true,
  onToggleWishesNotification,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [isBgmPlaying, setIsBgmPlaying] = useState<boolean>(soundManager.getIsBgmPlaying());
  useEffect(() => soundManager.subscribe(() => {
    setIsMuted(soundManager.getMuted());
    setIsBgmPlaying(soundManager.getIsBgmPlaying());
  }), []);

  // ESC key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = (action?: () => void) => {
    if (!action) return;
    onClose();
    action();
  };

  const handleToggleMute = () => {
    const nextMute = soundManager.toggleMute();
    setIsMuted(nextMute);
  };

  const handleToggleBgm = () => {
    const playing = soundManager.toggleBgm();
    setIsBgmPlaying(playing);
  };

  const handleRingBell = () => {
    soundManager.playBellSound();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-slate-950/80 px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-900/80 border border-emerald-400/50 flex items-center justify-center text-amber-300 font-bold text-xs">
              20/11
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Menu Chức Năng</h3>
              <p className="text-[11px] text-gray-400">Đại học Tây Nguyên</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng menu chức năng"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {/* Quick Sound Bar */}
          <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-950/60 rounded-2xl border border-white/10 mb-2">
            <button
              onClick={handleToggleMute}
              data-audio-control
              className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                isMuted ? 'bg-red-900/50 text-red-200 border border-red-500/30' : 'bg-slate-800 text-gray-200 hover:bg-slate-700'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span className="text-[10px]">{isMuted ? 'Đã tắt âm' : 'Âm thanh'}</span>
            </button>

            <button
              onClick={handleToggleBgm}
              data-audio-control
              disabled={bgmSuspended}
              title={bgmSuspended ? 'Nhạc nền tạm dừng khi đang trình chiếu' : 'Bật/Tắt nhạc nền tri ân'}
              className={`py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                isBgmPlaying ? 'bg-amber-900/50 text-amber-200 border border-amber-500/40' : 'bg-slate-800 text-gray-200 hover:bg-slate-700'
              }`}
            >
              <Music className={`w-4 h-4 ${isBgmPlaying ? 'text-amber-400 animate-spin' : 'text-gray-400'}`} />
              <span className="text-[10px]">{bgmSuspended ? 'Nhạc: Tạm dừng' : isBgmPlaying ? 'Nhạc nền: Bật' : 'Nhạc nền'}</span>
            </button>

            <button
              onClick={handleRingBell}
              className="py-2 px-1 rounded-xl text-xs font-semibold flex flex-col items-center gap-1 bg-slate-800 text-gray-200 hover:bg-slate-700 transition-all active:scale-95"
            >
              <Bell className="w-4 h-4 text-amber-300" />
              <span className="text-[10px]">Chuông lớp</span>
            </button>
          </div>

          {/* 📸 Chụp ảnh kỷ niệm lớp học */}
          {onTakePhoto && (
            <button
              onClick={() => handleAction(onTakePhoto)}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-amber-900/60 to-rose-900/60 hover:from-amber-800/80 hover:to-rose-800/80 border border-amber-400/40 flex items-center justify-between text-white transition-all active:scale-98 shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl p-2 rounded-xl bg-amber-500/20">📸</span>
                <div className="text-left">
                  <span className="text-sm font-bold block text-amber-200">Chụp Ảnh Kỷ Niệm</span>
                  <span className="text-[10px] text-gray-300">Khung lưu niệm 20/11 &amp; tải về máy</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </button>
          )}

          {/* 1. Tặng hoa tri ân */}
          <button
            onClick={() => handleAction(onOpenFlowers)}
            className="w-full p-3 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 flex items-center justify-between text-white transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl p-2 rounded-xl bg-rose-500/20">💐</span>
              <div className="text-left">
                <span className="text-sm font-bold block text-rose-200">Tặng Hoa Tri Ân</span>
                <span className="text-[10px] text-gray-400">4 loại hoa ý nghĩa dâng Thầy Cô</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400" />
          </button>

          {/* 2. Sổ lưu bút */}
          <button
            onClick={() => handleAction(onOpenWishes)}
            className="w-full p-3 rounded-2xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 flex items-center justify-between text-white transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl p-2 rounded-xl bg-amber-500/20">📖</span>
              <div className="text-left">
                <span className="text-sm font-bold block text-amber-200">Sổ Lưu Bút Tri Ân</span>
                <span className="text-[10px] text-gray-400">Gửi lời chúc mừng 20/11</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </button>

          {/* 3. Bức Tường Dấu Ấn 20/11 */}
          {onOpenMemoryWall && (
            <button
              onClick={() => handleAction(onOpenMemoryWall)}
              className="w-full p-3 rounded-2xl bg-orange-950/40 hover:bg-orange-900/60 border border-orange-500/30 flex items-center justify-between text-white transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl p-2 rounded-xl bg-orange-500/20">📌</span>
                <div className="text-left">
                  <span className="text-sm font-bold block text-orange-200">Bức Tường Dấu Ấn</span>
                  <span className="text-[10px] text-gray-400">"Chúng ta đã từng ở đây"</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-orange-400" />
            </button>
          )}

          {isStaff && onOpenProjectorControls && <button
            onClick={() => handleAction(onOpenProjectorControls)}
            className="w-full p-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-between text-white transition-all active:scale-95"
          >
            <div className="flex items-center gap-3">
              <Projector className="w-10 h-10 p-2 rounded-xl bg-amber-500/20 text-amber-300" />
              <div className="text-left"><span className="text-sm font-bold block text-amber-200">Điều khiển máy chiếu</span><span className="text-[10px] text-gray-300">Chọn slide, chiếu YouTube, chia sẻ màn hình</span></div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </button>}

          {/* 4. Xem màn chiếu */}
          <button
            onClick={() => handleAction(onOpenProjector)}
            className="w-full p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-blue-500/20 flex items-center justify-between text-white transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl p-2 rounded-xl bg-blue-500/20">📽️</span>
              <div className="text-left">
                <span className="text-sm font-bold block text-blue-200">Màn Chiếu Lớp Học</span>
                <span className="text-[10px] text-gray-400">Xem slide &amp; kỷ niệm đồng bộ</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-400" />
          </button>

          {/* 5. Đổi Avatar */}
          <button
            onClick={() => handleAction(onOpenAvatar)}
            className="w-full p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-purple-500/20 flex items-center justify-between text-white transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl p-2 rounded-xl bg-purple-500/20">🎨</span>
              <div className="text-left">
                <span className="text-sm font-bold block text-purple-200">Tùy Chỉnh Avatar</span>
                <span className="text-[10px] text-gray-400">Đổi kiểu tóc, màu áo</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-purple-400" />
          </button>

          {/* 6. Danh sách online */}
          <button
            onClick={() => handleAction(onOpenUsers)}
            className="w-full p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-white/10 flex items-center justify-between text-white transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl p-2 rounded-xl bg-teal-500/20">👥</span>
              <div className="text-left">
                <span className="text-sm font-bold block text-teal-200">
                  Người Trong Lớp ({onlineCount})
                </span>
                <span className="text-[10px] text-gray-400">Xem danh sách sinh viên &amp; Thầy Cô</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-teal-400" />
          </button>

          {/* 7. Tùy chọn chất lượng đồ họa */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/10 space-y-1.5">
            <span className="text-xs text-gray-300 font-semibold flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-blue-400" />
              Chất lượng đồ họa (Tối ưu thiết bị):
            </span>
            <div className="grid grid-cols-3 gap-1">
              {(['low', 'medium', 'high'] as const).map((q) => {
                const isSelected = graphicsQuality === q;
                const label = q === 'low' ? 'Thấp (Mượt)' : q === 'medium' ? 'Trung Bình' : 'Cao (Sắc nét)';
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => onGraphicsQualityChange(q)}
                    className={`py-1.5 px-1 rounded-xl text-[11px] font-semibold transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-800 text-gray-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 8. Cài đặt độ nhạy Camera */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-300 font-semibold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                Độ nhạy xoay Camera:
              </span>
              <span className="font-mono font-bold text-amber-300">
                {sensitivity.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={sensitivity}
              onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Chậm</span>
              <span>Chuẩn (1.0x)</span>
              <span>Nhanh</span>
            </div>
          </div>

          {/* 9. Admin/Teacher: Thông báo lời chúc bật/tắt */}
          {isStaff && onToggleWishesNotification && (
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-amber-500/20 flex items-center justify-between text-xs">
              <span className="text-amber-200 font-semibold">Thông báo lời chúc tự động</span>
              <button
                onClick={onToggleWishesNotification}
                className={`px-3 py-1 rounded-xl font-bold transition-all ${
                  wishesNotificationEnabled
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-700 text-gray-400'
                }`}
              >
                {wishesNotificationEnabled ? 'BẬT' : 'TẮT'}
              </button>
            </div>
          )}
        </div>

        {/* Footer: Rời lớp học */}
        <div className="p-3 bg-slate-950/80 border-t border-white/10">
          <button
            onClick={() => handleAction(onLogout)}
            className="w-full py-2.5 rounded-xl bg-rose-900/60 hover:bg-rose-800/80 text-rose-200 text-xs font-bold flex items-center justify-center gap-2 border border-rose-500/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Rời phòng học</span>
          </button>
        </div>
      </div>
    </div>
  );
};
