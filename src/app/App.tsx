import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { StoryIntro } from '../components/welcome/StoryIntro';
import { BackgroundSoundtrack } from '../components/BackgroundSoundtrack';
import { SceneBoundary } from '../components/SceneBoundary';

const WelcomePage = lazy(() => import('../pages/WelcomePage').then((page) => ({ default: page.WelcomePage })));
const loadClassroom = () => import('../pages/ClassroomPage');
const ClassroomPage = lazy(() => loadClassroom().then((page) => ({ default: page.ClassroomPage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then((page) => ({ default: page.LoginPage })));
const AdminPage = lazy(() => import('../pages/AdminPage').then((page) => ({ default: page.AdminPage })));

export const App: React.FC = () => {
  const [introViewed, setIntroViewed] = useState(false);
  const { user, loading, loginAnonymous, loginStaff, logout, updateAvatar } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF8F2] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-800 border-t-amber-400 rounded-full animate-spin mb-4" />
        <h2 className="text-lg font-bold font-serif text-emerald-950">
          Đang khởi tạo Lớp Học Ký Ức...
        </h2>
        <p className="text-xs text-gray-500 mt-1">Đại học Tây Nguyên 20/11</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <BackgroundSoundtrack />
      <SceneBoundary fallback={<div role="alert" className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-[#FBF8F2] p-6 text-center text-emerald-950"><p>Chưa tải được màn hình. Hãy kiểm tra kết nối và thử lại.</p><button type="button" className="rounded-xl bg-emerald-900 px-5 py-3 text-white" onClick={() => window.location.reload()}>Tải lại trang</button></div>}>
      <Suspense fallback={<div className="min-h-dvh grid place-items-center bg-[#FBF8F2] text-emerald-950" role="status">Đang mở lớp học…</div>}>
      <Routes>
        {/* Welcome / Landing */}
        <Route
          path="/"
          element={
            !introViewed ? <StoryIntro onFinish={() => { window.scrollTo(0, 0); setIntroViewed(true); }} returning={Boolean(user)} /> : user ? (
              <Navigate to="/classroom" replace />
            ) : (
              <WelcomePage quickEntry onEnter={(...args) => {
                // Fetch the room code while the real guest session is created.
                void loadClassroom().catch(() => {});
                return loginAnonymous(...args);
              }} onReplayIntro={() => setIntroViewed(false)} />
            )
          }
        />

        {/* 3D Classroom */}
        <Route
          path="/classroom"
          element={
            user ? (
              <ClassroomPage 
                currentUser={user} 
                onLogout={logout} 
                onUpdateAvatar={updateAvatar}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Staff & Admin Login */}
        <Route
          path="/login"
          element={<LoginPage onLoginStaff={loginStaff} />}
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={<AdminPage currentUser={user} />}
        />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
      </SceneBoundary>
    </BrowserRouter>
  );
};

export default App;

