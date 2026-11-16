import { useState, useEffect, useCallback, useRef } from 'react';
import { ProjectorState, MediaItem } from '../types';
import { 
  fetchProjectorState, 
  updateProjectorState, 
  fetchMediaItems 
} from '../services/api';
import { patchProjector, ProjectorCommand } from '../services/api';
import { multiplayerSocket } from '../lib/multiplayerSocket';

export function useProjector() {
  const [projector, setProjector] = useState<ProjectorState | null>(null);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChanging, setIsChanging] = useState(false);
  const isMounted = useRef(true);
  const [error, setError] = useState<string | null>(null);
  const clockOffset = useRef(0);
  const applyState = useCallback((state: ProjectorState) => {
    if (isMounted.current) setProjector((previous) => {
      if (previous && (state.revision || 0) < (previous.revision || 0)) return previous;
      if (state.server_time) clockOffset.current = state.server_time - Date.now();
      return state;
    });
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [state, media] = await Promise.all([
        fetchProjectorState(),
        fetchMediaItems(),
      ]);
      if (isMounted.current) {
        applyState(state);
        setError(null);
        setMediaList(media);
      }
    } catch (err) {
      if (isMounted.current) setError(err instanceof Error ? err.message : 'Không tải được máy chiếu.');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [applyState]);

  useEffect(() => {
    isMounted.current = true;
    loadData();

    const unbindState = multiplayerSocket.on('projector:state_updated', applyState);
    const unbindSnapshot = multiplayerSocket.on('room:snapshot', (room) => { if (room?.projector) applyState(room.projector); });
    const unbindStatus = multiplayerSocket.onStatusChange((status) => { if (status === 'connected') loadData(); });
    const onVisible = () => { if (document.visibilityState === 'visible') loadData(); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', loadData);
    return () => {
      isMounted.current = false;
      unbindState(); unbindSnapshot(); unbindStatus();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', loadData);
    };
  }, [loadData, applyState]);

  const changeSlide = useCallback(async (mediaId: string, slideIndex = 0) => {
    setIsChanging(true);
    try {
      const updated = await updateProjectorState(mediaId, true, 0, slideIndex, 'presentation');
      applyState(updated);
      return updated;
    } finally {
      setIsChanging(false);
    }
  }, [applyState]);

  const setRetrospectiveMode = useCallback(async (enabled: boolean, index = 0, markId?: string | null) => {
    setIsChanging(true);
    try {
      const mode = enabled ? 'retrospective' : 'presentation';
      const currentMediaId = projector?.media_id || (mediaList[0]?.id || null);
      const updated = await updateProjectorState(
        currentMediaId,
        true,
        0,
        0,
        mode,
        index,
        markId || null
      );
      applyState(updated);
      return updated;
    } finally {
      setIsChanging(false);
    }
  }, [projector?.media_id, mediaList, applyState]);

  const command = useCallback(async (input: ProjectorCommand) => {
    setIsChanging(true);
    try { const updated = await patchProjector(input); applyState(updated); return updated; }
    catch (error) { void loadData(); throw error; }
    finally { if (isMounted.current) setIsChanging(false); }
  }, [applyState, loadData]);

  return {
    projector,
    mediaList,
    loading,
    error,
    isChanging,
    changeSlide,
    setRetrospectiveMode,
    command,
    clockOffset,
    refetch: loadData,
  };
}
