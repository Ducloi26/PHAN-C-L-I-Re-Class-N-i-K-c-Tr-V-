import React from 'react';
import { X, Navigation, School } from 'lucide-react';

interface CampusMapModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CampusMapModal: React.FC<CampusMapModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-[#FFFDF9] border border-amber-400 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-gray-800">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 to-emerald-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-emerald-950 rounded-xl shadow">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg font-serif text-amber-200">
                Sơ Đồ Trường Đại Học Tây Nguyên
              </h3>
              <p className="text-xs text-emerald-200">
                567 Lê Duẩn, Phường Ea Kao, TP. Buôn Ma Thuột, Tỉnh Đắk Lắk
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

        {/* Scrollable Map & Key Landmarks */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Map Image Viewer */}
          <div className="relative rounded-xl overflow-hidden border-2 border-emerald-900/30 shadow-lg bg-slate-900">
            <img
              src="/media/so-do-dai-hoc-tay-nguyen.jpg"
              alt="Sơ đồ Đại học Tây Nguyên"
              className="w-full h-auto object-contain max-h-[60vh] mx-auto"
            />
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] px-2.5 py-1 rounded-md backdrop-blur-sm">
              Sơ đồ chỉ dẫn chính thức khuôn viên trường
            </div>
          </div>

          {/* Highlights & Locations */}
          <div>
            <h4 className="font-bold text-sm text-emerald-950 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Navigation className="w-4 h-4 text-emerald-700" />
              Các khu vực trọng điểm theo sơ đồ:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                <strong className="text-emerald-950 block">Cổng chính</strong>
                <span className="text-gray-600">567 Lê Duẩn - Quốc lộ 14</span>
              </div>
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                <strong className="text-emerald-950 block">Nhà Điều hành trung tâm</strong>
                <span className="text-gray-600">Khu vực hành chính và Ban Giám hiệu</span>
              </div>
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                <strong className="text-emerald-950 block">Khoa Sư phạm &amp; KHTN - CN</strong>
                <span className="text-gray-600">Nhà học số 8 &amp; Nhà học số 9</span>
              </div>
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg">
                <strong className="text-amber-950 block">Giảng đường 400 &amp; 200 chỗ</strong>
                <span className="text-gray-600">Nơi diễn ra các sự kiện, hội thảo lớn</span>
              </div>
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg">
                <strong className="text-amber-950 block">Thư viện &amp; Viện CNSH</strong>
                <span className="text-gray-600">Trung tâm nghiên cứu học tập</span>
              </div>
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg">
                <strong className="text-amber-950 block">Căn tin - Đảo Sinh Viên</strong>
                <span className="text-gray-600">Không gian sinh hoạt gắn liền kỷ niệm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-3 text-center text-xs text-gray-500">
          Lớp học Ký Ức 20/11 đưa bạn trở lại không gian thân thương của mái trường Tây Nguyên.
        </div>
      </div>
    </div>
  );
};
