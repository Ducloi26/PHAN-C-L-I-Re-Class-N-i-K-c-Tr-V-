import React, { useState, useEffect } from 'react';
import { TeacherInfo, FlowerType, FLOWER_TYPES } from '../../types';
import { CurrentUser } from '../../services/api';
import { soundManager } from '../../lib/audioManager';
import { X, Sparkles, AlertCircle, CheckCircle, Heart } from 'lucide-react';

interface FlowerModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: TeacherInfo[];
  loadingTeachers?: boolean;
  teachersError?: string | null;
  onRetryTeachers?: () => void;
  currentUser: CurrentUser | null;
  submitting: boolean;
  onSendFlower: (
    senderId: string, 
    receiverId: string, 
    note?: string,
    flowerType?: FlowerType,
    flowerName?: string
  ) => Promise<{ success: boolean; message: string }>;
}

export const FlowerModal: React.FC<FlowerModalProps> = ({
  isOpen,
  onClose,
  teachers,
  loadingTeachers = false,
  teachersError = null,
  onRetryTeachers,
  currentUser,
  submitting,
  onSendFlower,
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedFlowerType, setSelectedFlowerType] = useState<FlowerType>('rose');
  const [note, setNote] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    setSelectedTeacherId((previous) => teachers.some((teacher) => teacher.id === previous)
      ? previous : teachers[0]?.id || '');
  }, [teachers]);

  useEffect(() => {
    if (isOpen) setStatusMessage(null);
  }, [isOpen]);

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

  const currentFlowerInfo = FLOWER_TYPES[selectedFlowerType];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (loadingTeachers || teachersError || !teachers.some((teacher) => teacher.id === selectedTeacherId)) {
      setStatusMessage({ text: 'Vui lòng chọn giáo viên trong danh sách nhận hoa.', isError: true });
      return;
    }
    setStatusMessage(null);

    try {
      const res = await onSendFlower(
        currentUser.id, 
        selectedTeacherId, 
        note, 
        selectedFlowerType, 
        currentFlowerInfo.name
      );
      setStatusMessage({ text: res.message, isError: !res.success });
      if (res.success) {
        soundManager.playFlowerSound();
        setNote('');
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (err) {
      setStatusMessage({
        text: err instanceof Error ? err.message : 'Không thể gửi hoa lúc này',
        isError: true,
      });
    }
  };

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FFFDF9] border border-rose-300 w-full max-w-lg rounded-2xl shadow-2xl text-gray-800 overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-800 to-rose-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="text-2xl p-1 bg-white/20 rounded-xl">💐</div>
            <div>
              <h3 className="font-bold text-lg font-serif text-rose-100">
                Tặng Hoa Tri Ân 20/11
              </h3>
              <p className="text-xs text-rose-200">
                Gửi một đóa hoa biểu tượng gửi gắm lòng biết ơn sâu sắc
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* 1. Chọn loại hoa */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              1. Chọn Đóa Hoa Dâng Tặng:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(FLOWER_TYPES) as FlowerType[]).map((fKey) => {
                const fInfo = FLOWER_TYPES[fKey];
                const isSelected = fKey === selectedFlowerType;
                return (
                  <button
                    key={fKey}
                    type="button"
                    onClick={() => setSelectedFlowerType(fKey)}
                    className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/90 ring-2 ring-rose-400 text-rose-950 shadow-sm'
                        : 'border-gray-200 hover:border-rose-200 bg-white text-gray-700'
                    }`}
                  >
                    <span className="text-2xl flex-shrink-0">{fInfo.emoji}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate">{fInfo.name}</div>
                      <div className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{fInfo.meaning}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Chọn Thầy / Cô nhận hoa */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              2. Chọn Thầy / Cô bạn muốn gửi tặng hoa:
            </label>
            {loadingTeachers ? (
              <p role="status" className="text-sm text-gray-500 py-3">Đang tải danh sách giáo viên...</p>
            ) : teachersError ? (
              <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p>{teachersError}</p>
                {onRetryTeachers && <button type="button" onClick={onRetryTeachers} className="mt-2 font-semibold underline">Thử lại</button>}
              </div>
            ) : teachers.length === 0 ? (
              <p className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">Chưa có giáo viên trong danh sách nhận hoa.</p>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
              {!loadingTeachers && !teachersError && teachers.map(t => {
                const isSelected = t.id === selectedTeacherId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedTeacherId(t.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer text-left transition-all ${
                      isSelected
                        ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-400 text-rose-950 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs truncate">{t.display_name}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-800 flex items-center gap-0.5">
                        🌹 {t.flower_count || 0}
                      </span>
                    </div>
                    <span className="text-[11px] text-gray-500 block truncate mt-0.5">{t.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Lời nhắn kèm theo */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              3. Lời nhắn ngắn kèm theo đóa hoa:
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ví dụ: Kính chúc Thầy/Cô ngày 20/11 tràn đầy niềm vui và sức khỏe!"
              maxLength={120}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Preview Badge */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
            <span className="text-3xl">{currentFlowerInfo.emoji}</span>
            <div className="text-xs">
              <span className="font-bold text-amber-950 block">
                {currentFlowerInfo.name} &bull; {selectedTeacher ? `Dâng tặng: ${selectedTeacher.display_name}` : 'Chọn Thầy / Cô nhận hoa'}
              </span>
              <span className="text-amber-800 italic text-[11px]">"{currentFlowerInfo.meaning}"</span>
            </div>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.isError
                ? 'bg-rose-50 border border-rose-200 text-rose-800'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold'
            }`}>
              {statusMessage.isError ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              )}
              {statusMessage.text}
            </div>
          )}

          <div className="pt-2 border-t border-gray-100">
            <button
              type="submit"
              disabled={submitting || loadingTeachers || Boolean(teachersError) || !selectedTeacher}
              className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Sparkles className="w-4 h-4" />
              {submitting ? 'Đang gửi đóa hoa...' : `Dâng Tặng ${currentFlowerInfo.name}`}
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-2">
              Mỗi sinh viên gửi tặng 01 đóa hoa biểu tượng tới mỗi Thầy/Cô.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};
