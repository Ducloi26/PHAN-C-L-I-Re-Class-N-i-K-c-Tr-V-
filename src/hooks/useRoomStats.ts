import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchRoomStats } from '../services/api';
import { multiplayerSocket } from '../lib/multiplayerSocket';

export function useRoomStats() {
  const [stats, setStats] = useState<{ flowers: number; wishes: number; memories: number } | null>(null);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);
  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    try { const stats = await fetchRoomStats(); if (version === requestVersion.current) { setStats(stats); setError(''); } }
    catch (err) { if (version === requestVersion.current) setError(err instanceof Error ? err.message : 'Không tải được thống kê.'); }
  }, []);
  useEffect(() => {
    refresh();
    const events = ['wish:announced', 'wish:updated', 'flower:announced', 'memory_mark:added', 'memory_mark:updated'];
    const cleanup = events.map((event) => multiplayerSocket.on(event, refresh));
    const unbindStatus = multiplayerSocket.onStatusChange((status) => { if (status === 'connected') refresh(); });
    window.addEventListener('focus', refresh);
    return () => { requestVersion.current++; cleanup.forEach((unbind) => unbind()); unbindStatus(); window.removeEventListener('focus', refresh); };
  }, [refresh]);
  return { stats, error };
}
