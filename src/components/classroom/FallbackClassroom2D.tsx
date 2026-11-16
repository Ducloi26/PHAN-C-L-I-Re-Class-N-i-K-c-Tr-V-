import React from 'react';
import { ProjectorState, MemoryMark } from '../../types';
import { AlertCircle, Maximize2, Sparkles } from 'lucide-react';

interface FallbackClassroom2DProps {
  projector: ProjectorState | null;
  liveMedia?: React.ReactNode;
  marks?: MemoryMark[];
  onOpenOverlay: () => void;
  onOpenWishes: () => void;
  onOpenFlowers: () => void;
}

export const FallbackClassroom2D: React.FC<FallbackClassroom2DProps> = ({
  projector,
  liveMedia,
  marks = [],
  onOpenOverlay,
  onOpenWishes,
  onOpenFlowers,
}) => {
  const currentMediaUrl = projector?.media?.payload?.url || '/media/slide1_ngay_tro_ve.svg';
  const mark = projector?.retrospective_mark_id ? marks.find((item) => item.id === projector.retrospective_mark_id) : marks[projector?.retrospective_index || 0];

  return (
    <div className="w-full h-full bg-[#241B16] text-white flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-2xl w-full bg-slate-900/90 border border-amber-500/40 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
        {/* Banner */}
        <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          Chế độ hiển thị 2D dự phòng (Khi không có WebGL)
        </div>

        <h2 className="text-2xl font-bold font-serif text-amber-100 mb-1">
          Lớp học Ký Ức — Đại học Tây Nguyên
        </h2>
        <p className="text-sm text-gray-300 mb-4">
          Chào mừng bạn đã trở lại không gian lớp học. Bạn vẫn có thể xem trọn vẹn màn chiếu thời gian thực, gửi lời chúc và tặng hoa cho thầy cô.
        </p>

        {/* 2D Projector View */}
        <div 
          style={{ minHeight: liveMedia ? 280 : undefined }}
          onClick={onOpenOverlay}
          className="relative aspect-video w-full rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-lg cursor-pointer group bg-black"
        >
          {liveMedia || (projector?.mode === 'retrospective' ? <div className="w-full h-full p-6 flex flex-col justify-center text-center text-amber-950" style={{ backgroundColor: mark?.card_color || '#fef3c7' }}>
            <strong>{mark?.display_name || 'Nhìn lại hành trình'}</strong><p className="mt-3">{mark?.message || 'Chưa có dấu ấn được hiển thị.'}</p>
          </div> : <img
            src={currentMediaUrl}
            alt="Màn chiếu lớp học"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />)}
          <div className={`absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${liveMedia ? 'hidden' : ''}`}>
            <span className="bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg">
              <Maximize2 className="w-4 h-4" /> Phóng to màn chiếu
            </span>
          </div>

          <div className={`${liveMedia ? 'hidden' : ''} absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow`}>
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            MÁY CHIẾU TRỰC TIẾP
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          <button
            onClick={onOpenWishes}
            className="bg-amber-600 hover:bg-amber-500 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <Sparkles className="w-5 h-5 text-amber-200" />
            Viết lời chúc tri ân 20/11
          </button>
          <button
            onClick={onOpenFlowers}
            className="bg-rose-700 hover:bg-rose-600 text-white py-3 px-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
          >
            🌹 Tặng hoa Thầy Cô
          </button>
        </div>
      </div>
    </div>
  );
};
