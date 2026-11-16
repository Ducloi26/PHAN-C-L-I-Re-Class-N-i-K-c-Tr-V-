import React, { useState, useEffect } from 'react';
import { Wish, TeacherInfo } from '../../types';
import { CurrentUser } from '../../services/api';
import { formatVietnameseTime } from '../../lib/date';
import { validateWishContent } from '../../lib/validation';
import { 
  Heart, 
  Send, 
  X, 
  EyeOff, 
  Eye, 
  MessageSquare, 
  UserCheck, 
  AlertCircle 
} from 'lucide-react';

interface WishModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishes: Wish[];
  loadError?: string | null;
  teachers: TeacherInfo[];
  currentUser: CurrentUser | null;
  submitting: boolean;
  onSubmitWish: (content: string, teacherId?: string, teacherName?: string) => Promise<any>;
  onToggleHide?: (wishId: string, currentHidden: boolean) => Promise<void>;
  canModerate?: boolean;
}

export const WishModal: React.FC<WishModalProps> = ({
  isOpen,
  onClose,
  wishes,
  loadError,
  teachers,
  currentUser,
  submitting,
  onSubmitWish,
  onToggleHide,
  canModerate = false,
}) => {
  const [content, setContent] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ESC key listener to close modal and return to 3D game
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const validation = validateWishContent(content);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Nội dung chưa hợp lệ');
      return;
    }

    const teacher = teachers.find(t => t.id === selectedTeacherId);
    try {
      await onSubmitWish(content, teacher?.id, teacher?.display_name);
      setContent('');
      setSuccessMsg('Lời chúc của bạn đã được lưu vào Sổ Lưu Bút Kỷ Niệm!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể gửi lời chúc');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FFFDF9] border border-amber-300 w-full max-w-2xl rounded-2xl shadow-2xl text-gray-800 flex flex-col max-h-[90vh] overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-emerald-950 rounded-xl shadow">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-lg font-serif text-amber-200">
                Sổ Lưu Bút Tri Ân 20/11
              </h3>
              <p className="text-xs text-emerald-200">
                Gửi trọn tấm lòng đến các Thầy Cô Trường Đại học Tây Nguyên
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loadError && <p role="alert" className="p-3 bg-rose-50 text-rose-800 rounded-lg text-sm">{loadError}</p>}
          {/* Write Wish Form */}
          <form onSubmit={handleSubmit} className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                  Người gửi:
                </label>
                <div className="px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-semibold text-emerald-950 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  {currentUser?.displayName || 'Khách tham quan'}
                  <span className="text-xs font-normal text-gray-500">
                    ({currentUser?.participantType === 'student' ? 'Sinh viên' : 'Khách tham quan'})
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                  Gửi tới Thầy Cô:
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                >
                  <option value="">Lời chúc chung cho lớp học</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.display_name} ({t.title})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-2">
              <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                Nội dung lời chúc (5 – 500 ký tự):
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Nhập lời tri ân, kỷ niệm hoặc lời chúc thân thương gửi đến thầy cô..."
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
              <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                <span>Lời chúc sẽ hiển thị công khai cho mọi người cùng đọc</span>
                <span className={content.length > 480 ? 'text-rose-600 font-bold' : ''}>
                  {content.length}/500
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg mb-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded-lg mb-2 font-medium">
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2 shadow transition-all"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Đang gửi...' : 'Gửi lời chúc vào sổ lưu bút'}
            </button>
          </form>

          {/* List of Wishes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-gray-800 font-serif flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-700" />
                Những dòng lưu bút mới nhất ({wishes.length})
              </h4>
              <span className="text-xs text-gray-500">Cập nhật trực tiếp</span>
            </div>

            <div className="space-y-3">
              {wishes.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Chưa có lời chúc nào. Hãy là người đầu tiên ghi vào sổ lưu bút!
                </div>
              ) : (
                wishes.map((w) => (
                  <div
                    key={w.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      w.is_hidden
                        ? 'bg-gray-100 border-gray-300 opacity-60'
                        : 'bg-white border-amber-200 hover:border-amber-400 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-emerald-900">{w.author_name}</span>
                        {w.teacher_name && (
                          <span className="text-gray-500">
                            → gửi tới <strong className="text-amber-800">{w.teacher_name}</strong>
                          </span>
                        )}
                      </div>
                      <span className="text-gray-400">{formatVietnameseTime(w.created_at)}</span>
                    </div>

                    <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {w.content}
                    </p>

                    {/* Staff moderation action */}
                    {canModerate && onToggleHide && (
                      <div className="mt-2 pt-2 border-t border-gray-100 flex justify-end">
                        <button
                          onClick={() => onToggleHide(w.id, w.is_hidden).catch((err) => setErrorMsg(err.message))}
                          className={`text-xs px-2.5 py-1 rounded flex items-center gap-1 font-medium transition-colors ${
                            w.is_hidden
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                          }`}
                        >
                          {w.is_hidden ? (
                            <>
                              <Eye className="w-3.5 h-3.5" /> Hiện lại lời chúc
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3.5 h-3.5" /> Ẩn lời chúc vi phạm
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

