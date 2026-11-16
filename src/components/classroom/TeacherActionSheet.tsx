import React from 'react';
import { X, Heart, Sparkles } from 'lucide-react';

interface TeacherActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFlowers: () => void;
  onOpenWishes: () => void;
}

export const TeacherActionSheet: React.FC<TeacherActionSheetProps> = ({
  isOpen,
  onClose,
  onOpenFlowers,
  onOpenWishes,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 animate-fadeIn select-none">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-slate-900 border border-rose-400/50 rounded-3xl p-4 sm:p-5 shadow-2xl text-white space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-2 rounded-2xl bg-rose-500/20">🎓</span>
            <div>
              <h3 className="text-sm font-bold text-rose-200">Bục Giảng Thầy Cô</h3>
              <p className="text-[11px] text-gray-400">Đại học Tây Nguyên 20/11</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-2.5">
          <button
            onClick={() => {
              onClose();
              onOpenFlowers();
            }}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-rose-700 to-rose-600 hover:from-rose-600 hover:to-rose-500 text-white flex items-center justify-between font-bold text-sm shadow-lg active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">💐</span>
              <span>Tặng hoa tri ân Thầy Cô</span>
            </div>
            <Sparkles className="w-4 h-4 text-rose-200" />
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenWishes();
            }}
            className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white flex items-center justify-between font-bold text-sm shadow-lg active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-lg">💌</span>
              <span>Gửi lời chúc vào Sổ lưu bút</span>
            </div>
            <Heart className="w-4 h-4 text-emerald-200" />
          </button>
        </div>

        {/* Cancel button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-semibold"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

