import { useState, useEffect, useCallback } from 'react';
import { CurrentUser, getSavedSession, loginAnonymous, loginStaff, logout, saveUserAvatar } from '../services/api';
import { ParticipantType, AvatarCustomization } from '../types';
import { multiplayerSocket } from '../lib/multiplayerSocket';

export function useAuth() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSavedSession()
      .then(saved => setUser(saved))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    return multiplayerSocket.on('room:snapshot', (room) => {
      if (user && !user.isAnonymous && room?.self?.id === user.id && room.self.role !== user.role) {
        logout().finally(() => setUser(null));
      }
    });
  }, [user?.id, user?.role]);

  const handleLoginAnonymous = useCallback(async (
    displayName: string, 
    participantType: ParticipantType, 
    avatar?: AvatarCustomization
  ) => {
    const u = await loginAnonymous(displayName, participantType, avatar);
    setUser(u);
    return u;
  }, []);

  const handleUpdateAvatar = useCallback((newAvatar: AvatarCustomization) => {
    if (!user) return;
    const updated = saveUserAvatar(user, newAvatar);
    setUser(updated);
  }, [user]);

  const handleLoginStaff = useCallback(async (email: string, pass: string) => {
    const u = await loginStaff(email, pass);
    setUser(u);
    return u;
  }, []);

  const handleLogout = useCallback(async () => {
    setLoading(true);
    try {
      await logout();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';
  const isAdmin = user?.role === 'admin';
  const canControlProjector = isTeacher || isAdmin;

  return {
    user,
    loading,
    isTeacher,
    isAdmin,
    canControlProjector,
    loginAnonymous: handleLoginAnonymous,
    updateAvatar: handleUpdateAvatar,
    loginStaff: handleLoginStaff,
    logout: handleLogout,
  };
}

