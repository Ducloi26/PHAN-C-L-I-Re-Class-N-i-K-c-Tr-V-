import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { TeacherInfo, FlowerType } from '../types';
import { fetchTeachers, giftFlower } from '../services/api';
import { multiplayerSocket } from '../lib/multiplayerSocket';

export function useFlowers() {
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isMounted = useRef(true);
  const requestVersion = useRef(0);

  const loadTeachers = useCallback(async () => {
    const version = ++requestVersion.current;
    if (isMounted.current && version === requestVersion.current) setLoading(true);
    try {
      const list = await fetchTeachers();
      if (isMounted.current && version === requestVersion.current) {
        setTeachers(list);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current && version === requestVersion.current) {
        setTeachers([]);
        setError(err instanceof Error ? err.message : 'Không tải được danh sách giáo viên');
      }
    } finally {
      if (isMounted.current && version === requestVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    loadTeachers();

    const unbindFlower = multiplayerSocket.on('flower:announced', loadTeachers);
    const unbindTeachers = multiplayerSocket.on('teachers:updated', loadTeachers);
    window.addEventListener('focus', loadTeachers);
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') loadTeachers();
    }, 30000);

    return () => {
      isMounted.current = false;
      clearInterval(refreshInterval);
      window.removeEventListener('focus', loadTeachers);
      unbindFlower();
      unbindTeachers();
    };
  }, [loadTeachers]);

  const sendFlower = useCallback(async (
    senderId: string, 
    receiverId: string, 
    note?: string,
    flowerType: FlowerType = 'rose',
    flowerName = 'Hoa Hồng Đỏ'
  ) => {
    setSubmitting(true);
    try {
      const result = await giftFlower(senderId, receiverId, note, flowerType, flowerName);
      if (result.success) {
        // Fire festive flower confetti!
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#D4AF37', '#F59E0B', '#E11D48', '#EC4899', '#10B981'],
        });
        await loadTeachers();
      }
      return result;
    } finally {
      setSubmitting(false);
    }
  }, [loadTeachers]);

  return {
    teachers,
    loading,
    error,
    submitting,
    sendFlower,
    refetch: loadTeachers,
  };
}
