import { useState, useEffect, useCallback, useRef } from 'react';
import { Wish } from '../types';
import { fetchWishes, createWish, setWishHidden } from '../services/api';
import { multiplayerSocket } from '../lib/multiplayerSocket';

export function useWishes(isStaff = false) {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastSubmitTime = useRef<number>(0);
  const isMounted = useRef(true);
  const requestVersion = useRef(0);

  const loadWishes = useCallback(async () => {
    const version = ++requestVersion.current;
    try {
      const data = await fetchWishes(isStaff);
      if (isMounted.current && version === requestVersion.current) {
        setWishes(data);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current && version === requestVersion.current) {
        setError(err instanceof Error ? err.message : 'Không thể tải sổ lời chúc');
      }
    } finally {
      if (isMounted.current && version === requestVersion.current) setLoading(false);
    }
  }, [isStaff]);

  useEffect(() => {
    isMounted.current = true;
    loadWishes();

    const unbindNew = multiplayerSocket.on('wish:announced', loadWishes);
    const unbindUpdated = multiplayerSocket.on('wish:updated', loadWishes);
    const unbindConnected = multiplayerSocket.onStatusChange((status) => { if (status === 'connected') loadWishes(); });
    window.addEventListener('focus', loadWishes);
    window.addEventListener('online', loadWishes);
    return () => {
      isMounted.current = false;
      unbindNew(); unbindUpdated(); unbindConnected();
      window.removeEventListener('focus', loadWishes);
      window.removeEventListener('online', loadWishes);
    };
  }, [loadWishes]);

  const submitWish = useCallback(async (
    authorId: string, 
    authorName: string, 
    content: string, 
    teacherId?: string, 
    teacherName?: string
  ) => {
    const now = Date.now();
    if (now - lastSubmitTime.current < 8000) {
      const waitSec = Math.ceil((8000 - (now - lastSubmitTime.current)) / 1000);
      throw new Error(`Vui lòng chờ ${waitSec} giây trước khi gửi lời chúc tiếp theo.`);
    }

    setSubmitting(true);
    try {
      const wish = await createWish(authorId, authorName, content, teacherId, teacherName);
      lastSubmitTime.current = Date.now();
      await loadWishes();
      return wish;
    } finally {
      setSubmitting(false);
    }
  }, [loadWishes]);

  const toggleHide = useCallback(async (wishId: string, currentHidden: boolean) => {
    try {
      await setWishHidden(wishId, !currentHidden);
      await loadWishes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể kiểm duyệt lời chúc.');
      throw err;
    }
  }, [loadWishes]);

  return {
    wishes,
    loading,
    submitting,
    error,
    submitWish,
    toggleHide,
    refetch: loadWishes,
  };
}
