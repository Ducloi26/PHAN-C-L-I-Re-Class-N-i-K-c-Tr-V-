import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CurrentUser, getSessionToken } from '../services/api';
import { multiplayerSocket } from '../lib/multiplayerSocket';
import { ROOM_ID } from '../lib/room';
import { useRoomStats } from '../hooks/useRoomStats';
import { useWishes } from '../hooks/useWishes';
import { useFlowers } from '../hooks/useFlowers';
import { useProjector } from '../hooks/useProjector';
import { formatVietnameseTime } from '../lib/date';
import { TeacherApprovals } from '../components/TeacherApprovals';
import { 
  Shield, 
  ArrowLeft, 
  Heart, 
  EyeOff, 
  Eye, 
  Users, 
  AlertTriangle 
} from 'lucide-react';

interface AdminPageProps {
  currentUser: CurrentUser | null;
}

export const AdminPage: React.FC<AdminPageProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'admin';
  const { stats, error: statsError } = useRoomStats();
  useEffect(() => {
    if (!isAdmin) return;
    // Observe public room events without adding an avatar or occupying a seat.
    multiplayerSocket.connect(ROOM_ID, getSessionToken());
    return () => multiplayerSocket.disconnect();
  }, [isAdmin, currentUser?.id]);

  // Fetch data including hidden items
  const { wishes, error: wishesError, toggleHide } = useWishes(true);
  const { teachers, loading: teachersLoading, error: teachersError } = useFlowers();
  const { projector } = useProjector();

  const totalFlowers = stats?.flowers;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FBF8F2] flex items-center justify-center p-4">
        <div className="bg-white border border-rose-300 p-8 rounded-2xl max-w-md text-center shadow-xl">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Truy cập bị từ chối</h2>
          <p className="text-sm text-gray-600 mb-5">
            Trang này chỉ dành riêng cho Ban Quản trị hệ thống. Tài khoản của bạn không có quyền truy cập.
          </p>
          <button
            onClick={() => navigate('/classroom')}
            className="px-4 py-2 bg-emerald-900 text-amber-200 rounded-xl text-sm font-semibold hover:bg-emerald-800 transition-all"
          >
            Quay lại Lớp học
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF8F2] text-gray-900 selection:bg-amber-200 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="bg-white border border-amber-300/80 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/classroom')}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              title="Vào lớp học"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-xs font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Bảng Quản Trị Hệ Thống
              </div>
              <h1 className="text-xl font-bold font-serif text-gray-900">
                Lớp Học Ký Ức — Đại học Tây Nguyên
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-semibold">
              Quản trị viên: {currentUser.displayName}
            </span>
          </div>
        </div>

        <TeacherApprovals />
        {statsError && <p role="alert" className="text-sm text-rose-800">{statsError}</p>}

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl">
              📝
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Tổng lời chúc đã gửi</div>
              <div className="text-2xl font-bold text-emerald-950">{stats?.wishes ?? '…'}</div>
            </div>
          </div>

          <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center text-xl">
              💐
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Đóa hoa tri ân</div>
              <div className="text-2xl font-bold text-rose-950">{totalFlowers ?? '…'}</div>
            </div>
          </div>

          <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-xl">
              📽️
            </div>
            <div>
              <div className="text-xs text-gray-500 font-medium">Slide đang chiếu</div>
              <div className="text-sm font-bold text-amber-950 truncate max-w-[180px]">
                {projector?.media?.title || 'Slide mặc định'}
              </div>
            </div>
          </div>
        </div>

        {/* Wish Moderation Section */}
        <div className="bg-white border border-amber-300/80 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold font-serif text-gray-900 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600" />
                Kiểm duyệt Lời Chúc ({wishes.length})
              </h2>
              <p className="text-xs text-gray-500">
                Ẩn các lời chúc có nội dung không phù hợp hoặc vi phạm thể lệ
              </p>
            </div>
          </div>

          {wishesError && <p role="alert" className="mb-3 text-sm text-rose-800">{wishesError}</p>}
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {wishes.map((w) => (
              <div
                key={w.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  w.is_hidden
                    ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                    : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="font-bold text-emerald-950">{w.author_name}</span>
                    {w.teacher_name && (
                      <span className="text-gray-500">→ gửi {w.teacher_name}</span>
                    )}
                    <span className="text-gray-400">• {formatVietnameseTime(w.created_at)}</span>
                    {w.is_hidden && (
                      <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-800 font-bold text-[10px]">
                        Đang bị ẩn
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{w.content}</p>
                </div>

                <button
                  onClick={() => toggleHide(w.id, w.is_hidden).catch(() => {})}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all flex-shrink-0 ${
                    w.is_hidden
                      ? 'bg-emerald-700 hover:bg-emerald-600 text-white'
                      : 'bg-rose-700 hover:bg-rose-600 text-white'
                  }`}
                >
                  {w.is_hidden ? (
                    <>
                      <Eye className="w-4 h-4" /> Bỏ ẩn lời chúc
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-4 h-4" /> Ẩn lời chúc này
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Teachers List */}
        <div className="bg-white border border-amber-300/80 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold font-serif text-gray-900 mb-2 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-800" />
            Danh sách Giáo viên &amp; Hoa nhận được
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {teachersLoading ? <p className="text-sm text-gray-500">Đang tải giáo viên...</p>
              : teachersError ? <p role="alert" className="col-span-full text-sm text-amber-800">{teachersError}</p>
              : teachers.length === 0 ? <p className="col-span-full text-sm text-gray-500">Chưa có giáo viên trong danh sách nhận hoa.</p> : null}
            {teachers.map((t) => (
              <div key={t.id} className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                <div className="font-bold text-sm text-emerald-950">{t.display_name}</div>
                <div className="text-xs text-gray-500 mb-2">{t.title}</div>
                <div className="text-xs font-semibold text-rose-700 flex items-center gap-1">
                  🌹 {t.flower_count || 0} đóa hoa tri ân
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
