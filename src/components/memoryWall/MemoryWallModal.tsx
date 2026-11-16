import React, { useState, useMemo } from 'react';
import { 
  MemoryMark, 
  MemoryMarkSymbol, 
  ModerationStatus 
} from '../../types';
import { 
  Pin, 
  X, 
  Heart, 
  Star, 
  BookOpen, 
  GraduationCap, 
  Flower2, 
  Sparkles, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Trash2, 
  CheckCircle2, 
  Search,
  Filter,
  PlusCircle
} from 'lucide-react';

interface MemoryWallModalProps {
  isOpen: boolean;
  onClose: () => void;
  marks: MemoryMark[];
  loadError?: string | null;
  allMarks: MemoryMark[];
  isStaff: boolean;
  currentUserName: string;
  onSubmitMark: (input: {
    displayName: string;
    symbol: MemoryMarkSymbol;
    cardColor: string;
    message: string;
  }) => Promise<{ success: boolean; mark?: MemoryMark; error?: string }>;
  onModerateMark: (id: string, status: ModerationStatus) => Promise<void>;
}

// 6 Available Symbols
const SYMBOLS: { id: MemoryMarkSymbol; label: string; icon: React.ReactNode; emoji: string }[] = [
  { id: 'heart', label: 'Trái tim', icon: <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />, emoji: '❤️' },
  { id: 'sunflower', label: 'Hướng dương', icon: <Flower2 className="w-4 h-4 text-amber-500 fill-amber-500" />, emoji: '🌻' },
  { id: 'rose', label: 'Hoa hồng', icon: <Flower2 className="w-4 h-4 text-red-500" />, emoji: '🌹' },
  { id: 'star', label: 'Ngôi sao', icon: <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />, emoji: '⭐' },
  { id: 'book', label: 'Quyển sách', icon: <BookOpen className="w-4 h-4 text-blue-500" />, emoji: '📖' },
  { id: 'grad_cap', label: 'Mũ cử nhân', icon: <GraduationCap className="w-4 h-4 text-indigo-500" />, emoji: '🎓' },
];

// 6 Warm Pastel Card Colors
const CARD_COLORS = [
  { id: '#fef3c7', name: 'Vàng kem', border: '#fcd34d' },
  { id: '#e0f2fe', name: 'Xanh trời', border: '#7dd3fc' },
  { id: '#d1fae5', name: 'Xanh ngọc', border: '#6ee7b7' },
  { id: '#ffedd5', name: 'Cam đào', border: '#fdba74' },
  { id: '#fce7f3', name: 'Hồng phấn', border: '#f472b6' },
  { id: '#f3e8ff', name: 'Tím nhạt', border: '#c084fc' },
];

export const MemoryWallModal: React.FC<MemoryWallModalProps> = ({
  isOpen,
  onClose,
  marks,
  loadError,
  allMarks,
  isStaff,
  currentUserName,
  onSubmitMark,
  onModerateMark,
}) => {
  const [activeTab, setActiveTab] = useState<'wall' | 'create' | 'moderate'>('wall');
  const [selectedFilterSymbol, setSelectedFilterSymbol] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [focusedCard, setFocusedCard] = useState<MemoryMark | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState(currentUserName || 'Cựu sinh viên');
  const [selectedSymbol, setSelectedSymbol] = useState<MemoryMarkSymbol>('heart');
  const [selectedColor, setSelectedColor] = useState<string>('#fef3c7');
  const [message, setMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Filtered public marks
  const filteredMarks = useMemo(() => {
    return marks.filter((m) => {
      const matchSymbol = selectedFilterSymbol === 'all' || m.symbol === selectedFilterSymbol;
      const matchSearch =
        !searchQuery ||
        m.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.message.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSymbol && matchSearch;
    });
  }, [marks, selectedFilterSymbol, searchQuery]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      setErrorMessage('Vui lòng nhập tên hiển thị');
      return;
    }
    if (message.trim().length < 5) {
      setErrorMessage('Lời nhắn kỷ niệm phải có ít nhất 5 ký tự');
      return;
    }
    if (message.trim().length > 300) {
      setErrorMessage('Lời nhắn không được vượt quá 300 ký tự');
      return;
    }

    setErrorMessage('');
    setSubmitting(true);
    const res = await onSubmitMark({
      displayName: displayName.trim(),
      symbol: selectedSymbol,
      cardColor: selectedColor,
      message: message.trim(),
    });

    setSubmitting(false);
    if (res.success) {
      setSubmitSuccess(true);
      setMessage('');
      setTimeout(() => {
        setSubmitSuccess(false);
        setActiveTab('wall');
      }, 1500);
    } else {
      setErrorMessage(res.error || 'Có lỗi xảy ra khi lưu dấu ấn');
    }
  };

  const getSymbolInfo = (sym: string) => {
    return SYMBOLS.find((s) => s.id === sym) || SYMBOLS[0];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/80 via-slate-950 to-emerald-950/70 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow">
              <Pin className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-wide text-amber-200 uppercase">
                  CHÚNG TA ĐÃ TỪNG Ở ĐÂY
                </h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                  {marks.length} dấu ấn
                </span>
              </div>
              <p className="text-[11px] sm:text-xs italic text-amber-100/80 font-medium">
                "Dù mai này đi muôn nơi, chúng ta vẫn có một lớp học để trở về."
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loadError && <p role="alert" className="mx-4 my-2 p-2 text-sm text-rose-200 bg-rose-950 rounded-lg">{loadError}</p>}
        {errorMessage && activeTab === 'moderate' && <p role="alert" className="mx-4 p-2 text-sm text-rose-200">{errorMessage}</p>}
        {/* Tab Switcher */}
        <div className="px-4 py-2.5 bg-slate-950/70 border-b border-white/10 flex items-center justify-between gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('wall')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'wall'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
              <span>Bức tường ({marks.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === 'create'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Để lại dấu ấn</span>
            </button>
            {isStaff && (
              <button
                onClick={() => setActiveTab('moderate')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'moderate'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-purple-300 hover:text-white hover:bg-purple-900/30'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Kiểm duyệt ({allMarks.length})</span>
              </button>
            )}
          </div>

          {activeTab === 'wall' && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm tên hoặc lời nhắn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs bg-slate-800/80 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-amber-400 w-36 sm:w-48"
                />
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#17110C] relative">
          {/* TAB 1: BỨC TƯỜNG DẤU ẤN (GRID OF PASTEL CARDS) */}
          {activeTab === 'wall' && (
            <div className="space-y-4">
              {/* Symbol Filter Badges */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setSelectedFilterSymbol('all')}
                  className={`px-2.5 py-1 rounded-full font-semibold border transition-all ${
                    selectedFilterSymbol === 'all'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-800/80 text-gray-300 border-white/10 hover:bg-slate-700'
                  }`}
                >
                  Tất cả ({marks.length})
                </button>
                {SYMBOLS.map((s) => {
                  const count = marks.filter((m) => m.symbol === s.id).length;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedFilterSymbol(s.id)}
                      className={`px-2.5 py-1 rounded-full font-semibold border flex items-center gap-1 transition-all ${
                        selectedFilterSymbol === s.id
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-slate-800/80 text-gray-300 border-white/10 hover:bg-slate-700'
                      }`}
                    >
                      <span>{s.emoji}</span>
                      <span>{s.label} ({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Cards Grid */}
              {filteredMarks.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Pin className="w-10 h-10 mx-auto mb-2 text-gray-500 opacity-50" />
                  <p className="text-sm font-semibold">Chưa có dấu ấn nào trong mục này</p>
                  <p className="text-xs text-gray-500 mt-1">Hãy là người đầu tiên để lại dấu ấn kỷ niệm!</p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow hover:bg-amber-400 transition-all"
                  >
                    + Để lại dấu ấn ngay
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredMarks.map((mark, i) => {
                    const sym = getSymbolInfo(mark.symbol);
                    return (
                      <div
                        key={mark.id}
                        onClick={() => setFocusedCard(mark)}
                        style={{ backgroundColor: mark.card_color }}
                        className="rounded-xl p-3.5 shadow-md border border-black/10 text-slate-900 cursor-pointer transform hover:-translate-y-1 hover:shadow-xl transition-all relative overflow-hidden group select-none"
                      >
                        {/* Realistic Push Pin */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-red-600 border border-white/70 shadow-sm flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-white/80" />
                        </div>

                        {/* Top Meta */}
                        <div className="pt-2 flex items-center justify-between border-b border-black/10 pb-1.5 mb-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{sym.emoji}</span>
                            <span className="font-bold text-xs truncate max-w-[150px]">
                              {mark.display_name}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-600 font-medium">
                            {new Date(mark.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        {/* Message Preview */}
                        <p className="text-xs font-medium text-slate-800 leading-relaxed line-clamp-4">
                          "{mark.message}"
                        </p>

                        <div className="mt-2.5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-[10px] font-bold text-amber-800 underline">
                            Xem chi tiết &rarr;
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ĐỂ LẠI DẤU CỦA BẠN (CREATE FORM & PREVIEW) */}
          {activeTab === 'create' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Form Input */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="bg-slate-950/80 p-4 rounded-xl border border-white/10 space-y-3.5">
                  <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Tạo tấm thiệp kỷ niệm</span>
                  </h3>

                  {/* 1. Display Name */}
                  <div>
                    <label className="text-xs text-gray-300 font-semibold block mb-1">
                      Tên hiển thị của bạn
                    </label>
                    <input
                      type="text"
                      maxLength={50}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Nhập tên hoặc bút danh..."
                      className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  {/* 2. Choose Symbol */}
                  <div>
                    <label className="text-xs text-gray-300 font-semibold block mb-1.5">
                      Chọn biểu tượng kỷ niệm
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {SYMBOLS.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedSymbol(s.id)}
                          className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all ${
                            selectedSymbol === s.id
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                              : 'bg-slate-800 border-white/5 text-gray-300 hover:bg-slate-700'
                          }`}
                        >
                          <span className="text-sm">{s.emoji}</span>
                          <span className="truncate">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Choose Card Pastel Color */}
                  <div>
                    <label className="text-xs text-gray-300 font-semibold block mb-1.5">
                      Màu sắc tấm thiệp
                    </label>
                    <div className="flex items-center gap-2">
                      {CARD_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedColor(c.id)}
                          style={{ backgroundColor: c.id }}
                          title={c.name}
                          className={`w-7 h-7 rounded-full border-2 transition-all ${
                            selectedColor === c.id ? 'border-amber-500 scale-110 shadow-lg' : 'border-black/20 hover:scale-105'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* 4. Message Content */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-gray-300 font-semibold">
                        Lời nhắn gửi tới mai sau (5–300 ký tự)
                      </label>
                      <span className={`text-[11px] font-mono ${message.length > 300 ? 'text-red-400' : 'text-gray-400'}`}>
                        {message.length}/300
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      maxLength={300}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Viết cảm nghĩ, kỷ niệm, lời chúc cho Thầy Cô và các thế hệ sinh viên Tây Nguyên..."
                      className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-amber-400 resize-none"
                      required
                    />
                  </div>

                  {errorMessage && (
                    <div className="p-2.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                      {errorMessage}
                    </div>
                  )}

                  {submitSuccess && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Đã lưu dấu ấn lên Bức tường thành công!</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('wall')}
                      className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:bg-white/10 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || message.trim().length < 5}
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5"
                    >
                      <Pin className="w-3.5 h-3.5" />
                      <span>{submitting ? 'Đang lưu...' : 'Lưu dấu ấn'}</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Live Preview Card */}
              <div className="flex flex-col items-center justify-center p-4">
                <span className="text-xs font-bold text-amber-200 uppercase tracking-wider mb-3">
                  Bản xem trước tấm thiệp
                </span>
                <div
                  style={{ backgroundColor: selectedColor }}
                  className="w-full max-w-[280px] min-h-[220px] rounded-2xl p-4 shadow-2xl border border-black/10 text-slate-900 relative rotate-1 flex flex-col justify-between"
                >
                  {/* Push pin */}
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 border border-white/80 shadow flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/90" />
                  </div>

                  <div>
                    <div className="pt-3 flex items-center justify-between border-b border-black/10 pb-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getSymbolInfo(selectedSymbol).emoji}</span>
                        <span className="font-extrabold text-sm truncate max-w-[140px]">
                          {displayName.trim() || 'Tên hiển thị'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-600 font-semibold">Hôm nay</span>
                    </div>

                    <p className="text-xs font-medium text-slate-800 leading-relaxed italic">
                      "{message.trim() || 'Nội dung lời nhắn kỷ niệm sẽ hiển thị tại đây trên tấm thiệp của bạn...'}"
                    </p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-black/10 text-right text-[10px] text-slate-600 font-bold">
                    Đại học Tây Nguyên — 20/11
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: KIỂM DUYỆT (ADMIN & TEACHER ONLY) */}
          {activeTab === 'moderate' && isStaff && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-purple-950/40 p-3 rounded-xl border border-purple-500/30 text-xs">
                <div className="flex items-center gap-2 text-purple-200">
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                  <span>Chế độ kiểm duyệt Ban Quản Trị & Giáo Viên</span>
                </div>
                <span className="text-gray-400">Tổng cộng: {allMarks.length} bản ghi</span>
              </div>

              <div className="space-y-2">
                {allMarks.map((m) => {
                  const sym = getSymbolInfo(m.symbol);
                  return (
                    <div
                      key={m.id}
                      className="p-3 rounded-xl bg-slate-900 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span>{sym.emoji}</span>
                          <span className="font-bold text-amber-300">{m.display_name}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              m.moderation_status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {m.moderation_status === 'approved' ? 'Đã duyệt' : 'Đã ẩn'}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {new Date(m.created_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p className="text-gray-300 italic">"{m.message}"</p>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        {m.moderation_status === 'approved' ? (
                          <button
                            onClick={() => onModerateMark(m.id, 'hidden').catch((err) => setErrorMessage(err.message))}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 font-semibold flex items-center gap-1"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Ẩn</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => onModerateMark(m.id, 'approved').catch((err) => setErrorMessage(err.message))}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 font-semibold flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Duyệt</span>
                          </button>
                        )}
                        <button
                          onClick={() => onModerateMark(m.id, 'rejected').catch((err) => setErrorMessage(err.message))}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/40 font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Focused Card Zoom Modal Overlay */}
        {focusedCard && (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div
              style={{ backgroundColor: focusedCard.card_color }}
              className="w-full max-w-md rounded-2xl p-6 shadow-2xl border border-black/10 text-slate-900 relative animate-scaleUp"
            >
              <button
                onClick={() => setFocusedCard(null)}
                className="absolute top-3 right-3 p-1 rounded-full bg-black/10 hover:bg-black/20 text-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Pin */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 border border-white/80 shadow flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white/90" />
              </div>

              <div className="pt-3">
                <div className="flex items-center gap-2 border-b border-black/10 pb-2 mb-4">
                  <span className="text-2xl">{getSymbolInfo(focusedCard.symbol).emoji}</span>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">
                      {focusedCard.display_name}
                    </h3>
                    <p className="text-[11px] text-slate-600">
                      Lưu ngày {new Date(focusedCard.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>

                <p className="text-sm font-medium text-slate-800 leading-relaxed italic whitespace-pre-wrap">
                  "{focusedCard.message}"
                </p>

                <div className="mt-6 pt-3 border-t border-black/10 flex items-center justify-between text-xs text-slate-600 font-bold">
                  <span>Trường Đại học Tây Nguyên</span>
                  <span>20/11 Ký Ức</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

