import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowLeft, Shield, AlertCircle } from 'lucide-react';
import { registerTeacherAccount } from '../services/api';

interface LoginPageProps {
  onLoginStaff: (email: string, pass: string) => Promise<any>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginStaff }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [registering, setRegistering] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [department, setDepartment] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      if (registering) {
        const result = await registerTeacherAccount({ email: email.trim(), password, displayName, department });
        setSuccessMsg(result.message);
        setPassword('');
        setRegistering(false);
      } else {
        const user = await onLoginStaff(email.trim(), password);
        navigate(user.role === 'admin' ? '/admin' : '/classroom');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Đăng nhập không thành công');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF8F2] flex items-center justify-center p-4 text-gray-900 selection:bg-amber-200">
      <div className="max-w-md w-full bg-white border border-amber-300 rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-950 to-emerald-900 text-white p-6 text-center relative">
          <button
            onClick={() => navigate('/')}
            className="absolute left-4 top-5 p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
            title="Quay lại trang chủ"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="w-12 h-12 bg-amber-400 text-emerald-950 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold font-serif text-amber-200">
            {registering ? 'Đăng Ký Tài Khoản Giáo Viên' : 'Cổng Đăng Nhập Giáo Viên / Admin'}
          </h2>
          <p className="text-xs text-emerald-200 mt-1">
            Điều khiển máy chiếu và quản lý sổ lưu bút lớp học
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {registering && <>
              <label className="block text-xs font-bold text-gray-700">Họ và tên
                <input aria-label="Họ và tên" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required minLength={2} maxLength={50} className="mt-1 w-full px-4 py-3 border rounded-xl text-sm" />
              </label>
              <label className="block text-xs font-bold text-gray-700">Khoa / đơn vị
                <input aria-label="Khoa / đơn vị" value={department} onChange={(e) => setDepartment(e.target.value)} maxLength={100} className="mt-1 w-full px-4 py-3 border rounded-xl text-sm" />
              </label>
            </>}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Email công vụ / tài khoản:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ten@tnu.edu.vn"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Mật khẩu:
              </label>
              <input
                type="password"
                minLength={registering ? 10 : undefined}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all"
              />
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}
            {successMsg && <p role="status" className="text-sm p-3 rounded-xl bg-emerald-50 text-emerald-800">{successMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-900 hover:bg-emerald-800 disabled:opacity-50 text-amber-200 font-bold py-3.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Shield className="w-4 h-4" />
              <span>{loading ? 'Đang xử lý...' : registering ? 'Gửi đăng ký để quản trị viên duyệt' : 'Đăng nhập vào hệ thống'}</span>
            </button>
          </form>
          <button type="button" onClick={() => { setRegistering(!registering); setErrorMsg(''); setSuccessMsg(''); }} className="w-full text-sm text-emerald-800 font-semibold underline">
            {registering ? 'Đã có tài khoản? Đăng nhập' : 'Đăng ký tài khoản giáo viên'}
          </button>


        </div>
      </div>
    </div>
  );
};
