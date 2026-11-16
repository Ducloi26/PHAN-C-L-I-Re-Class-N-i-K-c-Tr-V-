import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ParticipantType, AvatarCustomization } from '../types';
import { validateDisplayName } from '../lib/validation';
import { AVATAR_PRESETS, getDefaultAvatar } from '../lib/avatarPresets';
import { CampusMapModal } from '../components/map/CampusMapModal';
import { AvatarPreview3D } from '../components/avatar/AvatarPreview3D';
import { AvatarCustomizerModal } from '../components/avatar/AvatarCustomizerModal';
import { 
  GraduationCap, 
  Users, 
  MapPin, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  BookOpen,
  SlidersHorizontal,
  Check
} from 'lucide-react';

interface WelcomePageProps {
  onReplayIntro?: () => void;
  onEnter: (name: string, type: ParticipantType, avatar?: AvatarCustomization) => Promise<any>;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ onEnter, onReplayIntro }) => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [participantType, setParticipantType] = useState<ParticipantType>('student');
  const [avatar, setAvatar] = useState<AvatarCustomization>(() => getDefaultAvatar());
  const [showCustomizerModal, setShowCustomizerModal] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  const handleSelectPreset = (presetId: string) => {
    const preset = AVATAR_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setAvatar({ ...preset.defaultConfig });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const validation = validateDisplayName(displayName);
    if (!validation.valid) {
      setErrorMsg(validation.error || 'Vui lòng nhập tên');
      return;
    }

    setLoading(true);
    try {
      await onEnter(displayName, participantType, avatar);
      navigate('/classroom');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Không thể kết nối vào lớp học');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF8F2] flex flex-col justify-between text-gray-900 relative selection:bg-amber-200">
      {/* Decorative Warm Background accents */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-[#1B4332]/10 via-[#1B4332]/5 to-transparent pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 max-w-6xl mx-auto w-full px-4 pt-6 sm:pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#1B4332] to-[#2D6A4F] flex items-center justify-center text-amber-300 shadow-lg border border-amber-300/40">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              TRƯỜNG ĐẠI HỌC TÂY NGUYÊN
            </div>
            <h1 className="text-sm sm:text-base font-bold font-serif text-gray-900 leading-tight">
              Lớp Học Ký Ức 20/11
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMapModal(true)}
            className="px-3 py-1.5 rounded-xl border border-emerald-800/20 bg-white/80 hover:bg-emerald-50 text-emerald-900 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Sơ đồ trường</span>
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-3 py-1.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-amber-200 text-xs font-semibold flex items-center gap-1.5 shadow transition-all"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Giáo viên / Admin</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto w-full px-4 py-8 sm:py-12 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        {/* Left Side: Emotional Pitch & Story */}
        <div className="flex-1 text-center lg:text-left space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Cuộc thi Code The Thanks 2026 • Tri ân bằng công nghệ
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-emerald-950 leading-tight">
            Trở về lớp cũ, <br />
            <span className="text-amber-700">gửi lời tri ân</span>
          </h2>

          <p className="text-sm sm:text-base text-gray-700 leading-relaxed max-w-xl">
            Dù khoảng cách địa lý xa xôi, bạn vẫn có thể trở lại không gian lớp học 3D thân thuộc của Đại học Tây Nguyên. Cùng ngắm nhìn màn chiếu kỷ niệm, viết dòng lưu bút và gửi những đóa hoa tri ân tươi thắm nhất tới thầy cô.
          </p>

          {/* Highlights */}
          {onReplayIntro && <button type="button" onClick={onReplayIntro} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 underline underline-offset-4"><Sparkles size={16} /> Xem lại câu chuyện & hướng dẫn</button>}
          <div className="grid grid-cols-3 gap-3 pt-2 text-left">
            <div className="p-3 bg-white/90 border border-amber-200 rounded-xl shadow-sm">
              <span className="text-xl block mb-1">🏛️</span>
              <div className="font-bold text-xs text-gray-800">Lớp học 3D</div>
              <div className="text-[11px] text-gray-500">Tương tác thời gian thực</div>
            </div>
            <div className="p-3 bg-white/90 border border-amber-200 rounded-xl shadow-sm">
              <span className="text-xl block mb-1">🧑‍🎓</span>
              <div className="font-bold text-xs text-gray-800">Avatar Cá Nhân</div>
              <div className="text-[11px] text-gray-500">Tự do tùy biến ngoại hình</div>
            </div>
            <div className="p-3 bg-white/90 border border-amber-200 rounded-xl shadow-sm">
              <span className="text-xl block mb-1">💐</span>
              <div className="font-bold text-xs text-gray-800">Hoa &amp; Lưu bút</div>
              <div className="text-[11px] text-gray-500">Tri ân thầy cô Tây Nguyên</div>
            </div>
          </div>
        </div>

        {/* Right Side: Entrance & Avatar Customization Card */}
        <div className="w-full max-w-lg bg-white border border-amber-300/80 rounded-3xl shadow-2xl p-6 sm:p-7">
          <div className="text-center mb-5">
            <h3 className="text-xl font-bold font-serif text-emerald-950">
              Chọn Nhân Vật &amp; Vào Lớp
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Tùy biến avatar 3D và xuất hiện ngay trong phòng học
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Tên hiển thị của bạn:
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ví dụ: Phan Đức Lợi (K21) hoặc Bạn Mai"
                maxLength={32}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
              />
            </div>

            {/* Role / Participant Type Selector */}
            <div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setParticipantType('student')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    participantType === 'student'
                      ? 'bg-emerald-900 border-emerald-950 text-amber-200 shadow'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  Sinh viên TNU
                </button>
                <button
                  type="button"
                  onClick={() => setParticipantType('guest')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    participantType === 'guest'
                      ? 'bg-emerald-900 border-emerald-950 text-amber-200 shadow'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Khách tham quan
                </button>
              </div>
            </div>

            {/* 3D AVATAR PREVIEW & PRESET SELECTION */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Avatar của bạn (Xoay 360°):
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomizerModal(true)}
                  className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-600" />
                  <span>Đổi tóc &amp; Màu áo</span>
                </button>
              </div>

              {/* 3D Interactive Canvas */}
              <AvatarPreview3D avatar={avatar} height="h-52 sm:h-56" />

              {/* 4 Avatar Presets Quick Picker */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                {AVATAR_PRESETS.map((preset) => {
                  const isSelected = avatar.presetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`py-1.5 px-2 rounded-xl border text-center transition-all flex flex-col items-center gap-0.5 ${
                        isSelected
                          ? 'bg-amber-100/80 border-amber-500 text-amber-950 ring-1 ring-amber-500 font-bold shadow-sm'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 text-[11px]'
                      }`}
                    >
                      <span className="text-sm">{preset.gender === 'male' ? '👦' : '👧'}</span>
                      <span className="text-[10px] truncate max-w-full">{preset.name.split(' (')[0]}</span>
                      {isSelected && (
                        <span className="text-[9px] text-amber-700 font-semibold flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Chọn
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              <span>{loading ? 'Đang chuẩn bị vào lớp...' : 'Bước vào lớp học ngay'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Privacy Note */}
          <div className="mt-4 pt-3 border-t border-gray-100 text-center">
            <p className="text-[11px] text-gray-400">
              🔒 Tự do cá nhân hóa ngoại hình • Không yêu cầu mật khẩu
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full px-4 py-6 border-t border-gray-200/60 text-center sm:flex sm:justify-between sm:items-center text-xs text-gray-500">
        <div>
          Trường Đại học Tây Nguyên — 567 Lê Duẩn, Phường Ea Kao, TP. Buôn Ma Thuột
        </div>
        <div className="mt-2 sm:mt-0 font-medium text-emerald-900">
          Hưởng ứng Ngày Nhà giáo Việt Nam 20/11
        </div>
      </footer>

      {/* Campus Map Modal */}
      <CampusMapModal isOpen={showMapModal} onClose={() => setShowMapModal(false)} />

      {/* In-depth Avatar Customizer Modal */}
      <AvatarCustomizerModal
        isOpen={showCustomizerModal}
        onClose={() => setShowCustomizerModal(false)}
        currentAvatar={avatar}
        onSave={(updated) => setAvatar(updated)}
      />
    </div>
  );
};
