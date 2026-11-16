import React, { useEffect } from 'react';
import { ProjectorState, MediaItem, MemoryMark } from '../../types';
import { X, ChevronLeft, ChevronRight, Sparkles, Heart } from 'lucide-react';

interface ProjectorOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  projector: ProjectorState | null;
  canControl: boolean;
  mediaList: MediaItem[];
  marks?: MemoryMark[];
  onSelectMedia: (mediaId: string) => void;
  onRetrospectiveNavigate?: (index: number) => void;
  liveMedia?: React.ReactNode;
}

const SYMBOL_EMOJIS: Record<string, string> = {
  heart: '❤️',
  sunflower: '🌻',
  rose: '🌹',
  star: '⭐',
  book: '📖',
  grad_cap: '🎓',
};

export const ProjectorOverlay: React.FC<ProjectorOverlayProps> = ({
  isOpen,
  onClose,
  projector,
  canControl,
  mediaList,
  marks = [],
  onSelectMedia,
  onRetrospectiveNavigate,
  liveMedia,
}) => {
  // ESC key listener to exit projector view
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isRetrospective = projector?.mode === 'retrospective';
  const selectedIndex = projector?.retrospective_mark_id ? marks.findIndex((mark) => mark.id === projector.retrospective_mark_id) : -1;
  const currentIndex = selectedIndex >= 0 ? selectedIndex : projector?.retrospective_index || 0;
  const currentMark = projector?.retrospective_mark_id ? marks.find((mark) => mark.id === projector.retrospective_mark_id) || null : marks.length > 0 ? marks[currentIndex % marks.length] : null;

  const currentMedia = projector?.media;
  const currentUrl = currentMedia?.payload?.url || '/media/slide1_ngay_tro_ve.svg';
  const title = isRetrospective 
    ? 'Nhìn Lại Hành Trình — Ký Ức 20/11' 
    : (currentMedia?.title || 'Lớp học Ký Ức — Đại học Tây Nguyên');

  // Slide navigation for standard presentation
  const slideIndex = mediaList.findIndex(m => m.id === projector?.media_id);
  const hasPrevSlide = slideIndex > 0;
  const hasNextSlide = slideIndex < mediaList.length - 1;

  // Retrospective navigation
  const handlePrevRetro = () => {
    if (onRetrospectiveNavigate && marks.length > 0) {
      const prevIdx = (currentIndex - 1 + marks.length) % marks.length;
      onRetrospectiveNavigate(prevIdx);
    }
  };

  const handleNextRetro = () => {
    if (onRetrospectiveNavigate && marks.length > 0) {
      const nextIdx = (currentIndex + 1) % marks.length;
      onRetrospectiveNavigate(nextIdx);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-fadeIn select-none">
      {/* Top Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between text-white pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {isRetrospective ? 'CHẾ ĐỘ KỶ NIỆM' : 'MÁY CHIẾU THỜI GIAN THỰC'}
          </div>
          <span className="text-sm font-medium text-amber-200 hidden sm:inline">
            Đại học Tây Nguyên 20/11
          </span>
        </div>

        <button
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors flex items-center justify-center"
          title="Đóng màn chiếu"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Slide / Retrospective Content Area */}
      <div className="relative w-full max-w-5xl flex-1 flex items-center justify-center my-4">
        <div style={{ minHeight: liveMedia ? 280 : undefined }} className="relative max-h-[75vh] w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-500/40 bg-slate-950 flex items-center justify-center">
          {liveMedia || (isRetrospective ? (
            /* 🌟 Fullscreen Commemorative Retrospective Card */
            <div className="w-full h-full bg-gradient-to-br from-[#2D1206] via-[#1A0C04] to-[#2D1206] text-white p-8 sm:p-12 flex flex-col justify-between relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between border-b border-amber-500/30 pb-3 z-10">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">✨</span>
                  <div>
                    <h2 className="font-serif font-bold text-amber-100 text-lg sm:text-xl">
                      NHÌN LẠI HÀNH TRÌNH TRI THỨC
                    </h2>
                    <p className="text-xs text-amber-300/80">
                      "Chúng ta đã từng ở đây — Lớp học Ký Ức 20/11"
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-300 bg-amber-900/70 border border-amber-500/40 px-3 py-1 rounded-full">
                  Thẻ {currentIndex + 1} / {marks.length || 1}
                </span>
              </div>

              {currentMark ? (
                <div 
                  style={{ backgroundColor: currentMark.card_color || '#FEF3C7' }}
                  className="rounded-2xl p-6 sm:p-8 my-auto text-stone-900 shadow-2xl border-2 border-amber-400 max-w-2xl mx-auto w-full relative animate-fadeIn"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl p-2 bg-white/60 rounded-2xl shadow-sm">
                      {SYMBOL_EMOJIS[currentMark.symbol] || '❤️'}
                    </span>
                    <div>
                      <h3 className="font-bold text-lg sm:text-xl font-serif text-stone-950">
                        {currentMark.display_name}
                      </h3>
                      <p className="text-xs text-stone-600">
                        Đại học Tây Nguyên &bull; {new Date(currentMark.created_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <blockquote className="text-sm sm:text-base text-stone-900 italic font-serif leading-relaxed">
                    "{currentMark.message}"
                  </blockquote>
                </div>
              ) : (
                <div className="text-center my-auto">
                  <p className="text-xl font-serif text-amber-200 font-bold mb-2">
                    "Dù mai này đi muôn nơi..."
                  </p>
                  <p className="text-sm text-amber-300/80">
                    Chúng ta vẫn có một lớp học để trở về.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-amber-300/70 pt-3 border-t border-amber-500/20 z-10">
                <span>Tri ân Thầy Cô ngày Nhà giáo Việt Nam</span>
                <span className="font-semibold text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Đại học Tây Nguyên
                </span>
              </div>

              {/* Navigation Arrows for Retrospective */}
              {canControl && marks.length > 1 && (
                <>
                  <button
                    onClick={handlePrevRetro}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white p-3.5 rounded-full transition-all border border-amber-500/40 shadow-xl"
                    title="Dấu ấn trước"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNextRetro}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white p-3.5 rounded-full transition-all border border-amber-500/40 shadow-xl"
                    title="Dấu ấn tiếp theo"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          ) : (
            /* 🖥️ Standard Slide View */
            <>
              <img
                src={currentUrl}
                alt={title}
                className="w-full h-full object-contain"
              />

              {/* Quick nav buttons for Staff */}
              {canControl && (
                <>
                  {hasPrevSlide && (
                    <button
                      onClick={() => onSelectMedia(mediaList[slideIndex - 1].id)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white p-3 rounded-full transition-all border border-white/20 shadow-xl"
                      title="Slide trước"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  )}
                  {hasNextSlide && (
                    <button
                      onClick={() => onSelectMedia(mediaList[slideIndex + 1].id)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/90 text-white p-3 rounded-full transition-all border border-white/20 shadow-xl"
                      title="Slide tiếp theo"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  )}
                </>
              )}
            </>
          ))}
        </div>
      </div>

      {/* Bottom Bar: Slide Info */}
      <div className="w-full max-w-5xl text-center text-gray-300 text-xs">
        <span className="font-semibold text-amber-300">{title}</span>
        <span className="mx-2 text-gray-600">|</span>
        <span>Đồng bộ máy chiếu trực tiếp tới tất cả thành viên trong lớp</span>
      </div>
    </div>
  );
};
