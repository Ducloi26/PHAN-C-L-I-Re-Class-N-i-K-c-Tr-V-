import React from 'react';
import { X, Download, Camera, Sparkles, Check } from 'lucide-react';

interface PhotoBoothModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string | null;
  authorName: string;
}

export const PhotoBoothModal: React.FC<PhotoBoothModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  authorName,
}) => {
  if (!isOpen || !photoUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `Lop_Hoc_Ky_Uc_20_11_${authorName.replace(/\s+/g, '_')}_${Date.now()}.png`;
    link.href = photoUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn select-none">
      <div className="bg-stone-900 border-2 border-amber-500/60 rounded-2xl max-w-2xl w-full p-4 sm:p-6 text-white shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/30 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-400/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-amber-100">
                Ảnh Kỷ Niệm Lớp Học 20/11
              </h3>
              <p className="text-xs text-amber-300/80">
                Đại học Tây Nguyên &bull; Chúng ta đã từng ở đây
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Photo Preview */}
        <div className="flex-1 flex items-center justify-center overflow-hidden my-2 bg-black/40 rounded-xl p-2 border border-white/5">
          <img
            src={photoUrl}
            alt="Ảnh kỷ niệm lớp học"
            className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-2xl border border-amber-400/40"
          />
        </div>

        {/* Action Controls */}
        <div className="pt-3 border-t border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400 text-center sm:text-left">
            Ảnh đã được đóng khung kỷ niệm và xử lý an toàn ngay trên thiết bị của bạn.
          </p>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 hover:text-white rounded-xl text-xs font-semibold transition-all"
            >
              Đóng
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
            >
              <Download className="w-4 h-4" />
              Tải Ảnh Về Máy (.PNG)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

