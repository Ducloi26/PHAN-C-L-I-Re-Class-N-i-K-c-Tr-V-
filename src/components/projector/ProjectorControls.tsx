import React, { useState } from 'react';
import { MediaItem, ProjectorState, MemoryMark } from '../../types';
import { 
  Projector, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Check,
  Sparkles,
  BookOpen,
  StopCircle,
  Play
} from 'lucide-react';

interface ProjectorControlsProps {
  isOpen: boolean;
  onClose: () => void;
  projector: ProjectorState | null;
  mediaList: MediaItem[];
  marks?: MemoryMark[];
  isChanging: boolean;
  onChangeSlide: (mediaId: string) => Promise<any>;
  onToggleRetrospective?: (enabled: boolean, index?: number) => Promise<any>;
  onYouTube: (url: string) => Promise<unknown>;
  onStartScreen: () => Promise<unknown>;
  onStopScreen: () => Promise<unknown>;
  sharingBusy?: boolean;
}

export const ProjectorControls: React.FC<ProjectorControlsProps> = ({
  isOpen,
  onClose,
  projector,
  mediaList,
  marks = [],
  isChanging,
  onChangeSlide,
  onToggleRetrospective,
  onYouTube, onStartScreen, onStopScreen, sharingBusy,
}) => {
  const [error, setError] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const run = (action: Promise<unknown>) => { setError(''); action.catch((err) => setError(err instanceof Error ? err.message : 'Không thể cập nhật máy chiếu.')); };
  if (!isOpen) return null;

  const isRetrospective = projector?.mode === 'retrospective';
  const selectedIndex = projector?.retrospective_mark_id ? marks.findIndex((mark) => mark.id === projector.retrospective_mark_id) : -1;
  const retroIndex = selectedIndex >= 0 ? selectedIndex : projector?.retrospective_index || 0;
  const currentSlideIndex = mediaList.findIndex(m => m.id === projector?.media_id);

  const handleNextSlide = () => {
    if (isRetrospective) {
      if (onToggleRetrospective && marks.length > 0) {
        run(onToggleRetrospective(true, (retroIndex + 1) % marks.length));
      }
    } else {
      if (currentSlideIndex < mediaList.length - 1) {
        run(onChangeSlide(mediaList[currentSlideIndex + 1].id));
      }
    }
  };

  const handlePrevSlide = () => {
    if (isRetrospective) {
      if (onToggleRetrospective && marks.length > 0) {
        run(onToggleRetrospective(true, (retroIndex - 1 + marks.length) % marks.length));
      }
    } else {
      if (currentSlideIndex > 0) {
        run(onChangeSlide(mediaList[currentSlideIndex - 1].id));
      }
    }
  };

  const handleToggleRetroMode = () => {
    if (onToggleRetrospective) {
      run(onToggleRetrospective(!isRetrospective, 0));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/50 w-full max-w-lg rounded-2xl p-5 text-white shadow-2xl relative animate-fadeIn max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Projector className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-amber-100">Bảng điều khiển Máy Chiếu</h3>
              <p className="text-xs text-gray-400">Quyền Giáo viên &amp; Ban Quản trị</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng bảng điều khiển máy chiếu"
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto min-h-0">
        {error && <p role="alert" className="p-2 mb-3 text-sm text-rose-200 bg-rose-950 rounded-lg">{error}</p>}
        <form className="mb-4 space-y-2" onSubmit={(event) => { event.preventDefault(); run(onYouTube(youtubeUrl)); }}>
          <label htmlFor="projector-youtube" className="block text-sm font-bold text-amber-200">Chiếu YouTube cho cả phòng</label>
          <div className="flex gap-2"><input id="projector-youtube" type="url" required value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="Dán link https://www.youtube.com/watch?v=..." className="min-w-0 flex-1 p-2 rounded bg-slate-800 border border-slate-600 text-sm" /><button disabled={isChanging || sharingBusy} className="px-3 py-2 rounded bg-red-700 font-bold disabled:opacity-40">Chiếu</button></div>
        </form>
        <div className="mb-5 space-y-2">
          <button disabled={isChanging || sharingBusy} onClick={() => run(onStartScreen())} className="w-full p-3 rounded-xl bg-sky-700 hover:bg-sky-600 font-bold disabled:opacity-40">{sharingBusy ? 'Đang chọn nguồn chia sẻ…' : 'Chia sẻ màn hình / cửa sổ / tab'}</button>
          <p className="text-xs text-slate-300">Muốn truyền cả tiếng: chọn tab đang phát và bật “Chia sẻ âm thanh” trong hộp thoại của trình duyệt. Khả năng chia sẻ tiếng cửa sổ/màn hình phụ thuộc trình duyệt và hệ điều hành.</p>
          {projector?.media?.kind === 'screen' && <button className="w-full p-2 rounded bg-red-900" onClick={() => run(onStopScreen())}>Dừng màn hình đang chiếu</button>}
        </div>
        <div className="mb-4">
          <button
            onClick={handleToggleRetroMode}
            disabled={isChanging || (!isRetrospective && marks.length === 0)}
            className={`w-full p-3.5 rounded-xl border flex items-center justify-between font-bold text-sm transition-all shadow-lg ${
              isRetrospective
                ? 'bg-gradient-to-r from-amber-600 to-rose-600 border-amber-300 text-white shadow-amber-500/20 ring-2 ring-amber-400'
                : 'bg-gradient-to-r from-amber-950/80 to-stone-900 border-amber-500/40 text-amber-200 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-300 animate-spin" />
              <div className="text-left">
                <span className="block">
                  {isRetrospective ? 'Đang Trình Chiếu: Nhìn Lại Hành Trình' : 'Kích hoạt: "Nhìn Lại Hành Trình Của Chúng Ta"'}
                </span>
                <span className="text-[11px] font-normal text-amber-200/80 block">
                  {isRetrospective ? 'Bấm để dừng và trở về bài giảng bình thường' : `Trình chiếu ${marks.length} dấu ấn đã duyệt lên màn chiếu chung`}
                </span>
              </div>
            </div>
            {isRetrospective ? (
              <span className="px-2 py-1 bg-black/40 rounded-lg text-xs font-semibold flex items-center gap-1">
                <StopCircle className="w-4 h-4 text-rose-300" /> Dừng
              </span>
            ) : (
              <span className="px-2 py-1 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1">
                <Play className="w-3.5 h-3.5" /> Bắt đầu
              </span>
            )}
          </button>
        </div>

        {/* Quick Stepper */}
        <div className="bg-slate-800/80 rounded-xl p-3 mb-4 grid grid-cols-2 sm:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2">
          <button
            onClick={handlePrevSlide}
            disabled={isChanging}
            className="order-2 sm:order-1 justify-self-start px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
          >
            <ChevronLeft className="w-4 h-4" /> {isRetrospective ? 'Dấu ấn trước' : 'Slide trước'}
          </button>
          
          <div className="order-1 col-span-2 sm:order-2 sm:col-span-1 min-w-0 text-center">
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">
              {isRetrospective ? 'Thẻ Kỷ Niệm' : 'Đang Trình Chiếu'}
            </span>
            <span className="text-sm font-semibold truncate block">
              {isRetrospective 
                ? `Dấu ấn ${retroIndex + 1} / ${marks.length || 1}`
                : (projector?.media?.title || 'Slide mặc định')}
            </span>
          </div>

          <button
            onClick={handleNextSlide}
            disabled={isChanging}
            className="order-3 justify-self-end px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
          >
            {isRetrospective ? 'Dấu ấn sau' : 'Slide sau'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Slide List */}
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 flex-1">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            {isRetrospective ? 'Danh sách dấu ấn kỷ niệm:' : 'Chọn slide bài giảng chiếu lên lớp:'}
          </label>
          
          {isRetrospective ? (
            marks.map((mark, mIdx) => {
              const isSelected = mIdx === retroIndex;
              return (
                <div
                  key={mark.id}
                  onClick={() => onToggleRetrospective && run(onToggleRetrospective(true, mIdx))}
                  className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-amber-100 shadow-md ring-1 ring-amber-400'
                      : 'bg-slate-800/60 border-white/5 text-gray-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-lg">
                      {mark.symbol === 'heart' ? '❤️' :
                       mark.symbol === 'sunflower' ? '🌻' :
                       mark.symbol === 'rose' ? '🌹' :
                       mark.symbol === 'star' ? '⭐' :
                       mark.symbol === 'book' ? '📖' : '🎓'}
                    </span>
                    <div className="truncate">
                      <div className="font-semibold text-xs truncate">{mark.display_name}</div>
                      <div className="text-[11px] text-gray-400 truncate">"{mark.message}"</div>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-xs text-amber-400 font-bold flex-shrink-0 ml-2">Đang chiếu</span>
                  )}
                </div>
              );
            })
          ) : (
            mediaList.map((m, idx) => {
              const isSelected = m.id === projector?.media_id;
              return (
                <div
                  key={m.id}
                  onClick={() => run(onChangeSlide(m.id))}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-amber-100 shadow-md'
                      : 'bg-slate-800/60 border-white/5 text-gray-300 hover:bg-slate-800 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-gray-300'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold">{m.title}</h4>
                      <p className="text-xs text-gray-400">{m.payload?.description}</p>
                    </div>
                  </div>

                  {isSelected ? (
                    <span className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                      <Check className="w-4 h-4" /> Đang chiếu
                    </span>
                  ) : (
                    <span className="text-xs text-gray-500">Bấm để chiếu</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        </div>
        {/* Footer Note */}
        <div className="mt-3 pt-3 border-t border-white/10 text-center">
          <p className="text-xs text-gray-400">
            Mọi thay đổi sẽ lập tức đồng bộ đến toàn bộ học sinh và khách tham quan trong lớp học.
          </p>
        </div>
      </div>
    </div>
  );
};
