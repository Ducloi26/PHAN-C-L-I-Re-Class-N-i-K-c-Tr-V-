import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { WelcomePage } from '../pages/WelcomePage';
import { ClassroomPage } from '../pages/ClassroomPage';
import { LoginPage } from '../pages/LoginPage';
import { AdminPage } from '../pages/AdminPage';
import { StoryIntro } from '../components/welcome/StoryIntro';
import { BackgroundSoundtrack } from '../components/BackgroundSoundtrack';

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
      <Routes>
        {/* Welcome / Landing */}
        <Route
          path="/"
          element={
            !introViewed ? <StoryIntro onFinish={() => { window.scrollTo(0, 0); setIntroViewed(true); }} returning={Boolean(user)} /> : user ? (
              <Navigate to="/classroom" replace />
            ) : (
              <WelcomePage onEnter={loginAnonymous} onReplayIntro={() => setIntroViewed(false)} />
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
    </BrowserRouter>
  );
};

export default App;

