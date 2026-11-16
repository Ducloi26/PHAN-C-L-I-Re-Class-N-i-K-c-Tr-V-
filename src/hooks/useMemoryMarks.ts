import { useState, useEffect, useCallback, useRef } from 'react';
import { MemoryMark, MemoryMarkSymbol, ModerationStatus } from '../types';
import { fetchMemoryMarks, createMemoryMark, moderateMemoryMark } from '../services/api';
import { multiplayerSocket } from '../lib/multiplayerSocket';

export function useMemoryMarks(isStaff = false) {
  const [marks, setMarks] = useState<MemoryMark[]>([]);
  const [allMarks, setAllMarks] = useState<MemoryMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);
  const isMounted = useRef(true);
  const loadData = useCallback(async () => {
    const version = ++requestVersion.current;
    try {
      setLoading(true);
      const [approved, all] = await Promise.all([fetchMemoryMarks(), isStaff ? fetchMemoryMarks(true) : Promise.resolve([])]);
      if (isMounted.current && version === requestVersion.current) { setMarks(approved); setAllMarks(all); setError(null); }
    } catch (err) {
      if (isMounted.current && version === requestVersion.current) setError(err instanceof Error ? err.message : 'Không tải được dấu ấn.');
    } finally { if (isMounted.current && version === requestVersion.current) setLoading(false); }
  }, [isStaff]);
  useEffect(() => {
    isMounted.current = true;
    loadData();
    const added = multiplayerSocket.on('memory_mark:added', loadData);
    const updated = multiplayerSocket.on('memory_mark:updated', loadData);
    const status = multiplayerSocket.onStatusChange((value) => { if (value === 'connected') loadData(); });
    window.addEventListener('focus', loadData);
    return () => { isMounted.current = false; requestVersion.current++; added(); updated(); status(); window.removeEventListener('focus', loadData); };
  }, [loadData]);
  const submitMark = async (input: { displayName: string; symbol: MemoryMarkSymbol; cardColor: string; message: string; avatarId?: string }): Promise<{ success: boolean; mark?: MemoryMark; error?: string }> => {
    setSubmitting(true);
    try { const mark = await createMemoryMark(input); await loadData(); return { success: true, mark }; }
    catch (err) { return { success: false, error: err instanceof Error ? err.message : 'Không thể lưu dấu ấn.' }; }
    finally { if (isMounted.current) setSubmitting(false); }
  };
  const moderate = async (id: string, status: ModerationStatus) => {
    try { await moderateMemoryMark(id, status); await loadData(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không thể kiểm duyệt dấu ấn.'); throw err; }
  };
  return { marks, allMarks, loading, submitting, error, submitMark, moderate, reload: loadData };
}
