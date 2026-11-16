import React from 'react';
import { Heart, Sparkles, X, BookOpen } from 'lucide-react';
import { WishAnnouncement } from '../../hooks/useMultiplayer';

interface WishToastNotificationProps {
  wish: WishAnnouncement | null;
  onClose: () => void;
  onOpenWishModal: () => void;
}

export const WishToastNotification: React.FC<WishToastNotificationProps> = ({
  wish,
  onClose,
  onOpenWishModal,
}) => {
  if (!wish) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-3 pointer-events-none animate-slideDown">
      <div className="bg-stone-900/95 border-2 border-rose-400/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-white pointer-events-auto flex items-start gap-3">
        {/* Heart Icon */}
        <div className="p-2 bg-gradient-to-br from-rose-500 to-amber-500 rounded-xl text-white shadow-md flex-shrink-0 animate-pulse">
          <Heart className="w-5 h-5 fill-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-serif font-bold text-xs text-rose-200 truncate">
              {wish.authorName} &bull; Gửi tới {wish.teacherName || 'Quý Thầy Cô'}
            </h4>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-0.5 rounded-full transition-colors ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-stone-200 italic line-clamp-2 mt-1 leading-relaxed">
            "{wish.content}"
          </p>

          <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-white/10">
            <span className="text-[10px] text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Sổ Lưu Bút 20/11
            </span>
            <button
              onClick={() => {
                onClose();
                onOpenWishModal();
              }}
              className="px-2.5 py-0.5 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all"
            >
              <BookOpen className="w-3 h-3" /> Xem sổ lưu bút
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

