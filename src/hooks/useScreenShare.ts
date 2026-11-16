import { useCallback, useEffect, useRef, useState } from 'react';
import type { ProjectorState } from '../types';
import { fetchRtcConfig, ProjectorCommand } from '../services/api';
import { multiplayerSocket } from '../lib/multiplayerSocket';
import { ScreenTransport } from '../lib/screenTransport';

export function useScreenShare(projector: ProjectorState | null, selfId: string | undefined, command: (input: ProjectorCommand) => Promise<ProjectorState>) {
  const [local, setLocal] = useState<MediaStream | null>(null);
  const capture = useRef<MediaStream | null>(null);
  const pending = useRef(false);
  const mounted = useRef(true);
  const state = useRef(projector); state.current = projector;
  const [remote, setRemote] = useState<MediaStream | null>(null);
  const [status, setStatus] = useState('Đang chờ người trình chiếu…');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [connection, setConnection] = useState(multiplayerSocket.getStatus());
  const session = projector?.mode !== 'retrospective' && projector?.media?.kind === 'screen' ? projector.media.payload.screen_session_id : undefined;
  const owner = session ? projector?.media?.payload.presenter_id : undefined;
  const endCapture = useCallback(() => {
    const previous = capture.current; capture.current = null;
    previous?.getTracks().forEach((track) => track.stop());
    if (mounted.current) setLocal(null);
  }, []);
  const stop = useCallback(async () => {
    const current = state.current?.media;
    endCapture();
    if (current?.kind === 'screen') await command({ screen_stop: current.payload.screen_session_id });
  }, [command, endCapture]);
  const start = useCallback(async () => {
    if (pending.current) return;
    if (multiplayerSocket.getStatus() !== 'connected') throw new Error('Chờ kết nối lớp học trước khi chia sẻ màn hình.');
    if (!navigator.mediaDevices?.getDisplayMedia || typeof RTCPeerConnection === 'undefined') throw new Error('Trình duyệt chưa hỗ trợ chia sẻ màn hình. Hãy mở bằng Chrome/Edge trên HTTPS hoặc localhost.');
    pending.current = true; setBusy(true); setError('');
    const revision = state.current?.revision || 0;
    let stream: MediaStream | null = null;
    try {
      // Must be the first asynchronous operation after the user's click.
      stream = await navigator.mediaDevices.getDisplayMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 15, max: 30 } }, audio: true });
      if (!mounted.current || multiplayerSocket.getStatus() !== 'connected') throw new Error('Kết nối lớp đã thay đổi. Vui lòng chia sẻ lại.');
      endCapture(); capture.current = stream; setLocal(stream);
      const started = await command({ screen_start: true, has_audio: stream.getAudioTracks().length > 0, expected_revision: revision });
      const startedSession = started.media?.payload.screen_session_id;
      const endStarted = async () => {
        if (capture.current === stream) endCapture();
        if (startedSession) await command({ screen_stop: startedSession });
      };
      if (!mounted.current || !stream.getVideoTracks().some((track) => track.readyState === 'live')) { await endStarted(); throw new Error('Nguồn chia sẻ đã dừng.'); }
      stream.getVideoTracks()[0].addEventListener('ended', () => { void endStarted().catch((err) => { if (mounted.current) setError(String(err.message)); }); }, { once: true });
    } catch (err) {
      stream?.getTracks().forEach((track) => track.stop());
      if (stream && capture.current === stream) endCapture();
      if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'AbortError')) throw new Error('Chưa chọn nguồn chia sẻ hoặc quyền chia sẻ đã bị từ chối.');
      throw err;
    } finally { pending.current = false; if (mounted.current) setBusy(false); }
  }, [command, endCapture, stop]);

  useEffect(() => multiplayerSocket.onStatusChange((next) => {
    setConnection(next);
    if (next !== 'connected') endCapture();
  }), [endCapture]);
  useEffect(() => {
    if (capture.current && !pending.current && owner !== selfId) endCapture();
  }, [owner, selfId, endCapture]);
  useEffect(() => {
    setRemote(null);
    setError('');
    if (!session || !owner || !selfId || connection !== 'connected') return;
    let active = true;
    let transport: ScreenTransport | undefined;
    let unbind: (() => void) | undefined;
    let unbindLeft: (() => void) | undefined;
    setStatus(owner === selfId ? 'Đang chia sẻ màn hình với lớp' : 'Đang kết nối màn hình trực tiếp…');
    fetchRtcConfig().then((config) => {
      if (!active) return;
      if (owner === selfId && !local) { void command({ screen_stop: session }).catch(() => {}); return; }
      transport = new ScreenTransport(session, selfId, owner, owner === selfId ? local : null, config,
        (signal) => multiplayerSocket.send('screen:signal', signal),
        (stream) => { if (active) setRemote(stream); }, (text) => { if (active) setStatus(text); });
      unbind = multiplayerSocket.on('screen:signal', (signal) => { void transport?.handle(signal); });
      unbindLeft = multiplayerSocket.on('player:left', ({ id }) => transport?.participantLeft(id));
    }).catch((err) => { if (active) setError(err.message); });
    return () => { active = false; unbind?.(); unbindLeft?.(); transport?.close(); };
  }, [session, owner, selfId, local, connection, command]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; endCapture(); };
  }, [endCapture]);
  return { stream: owner === selfId ? local : remote, isPresenting: !!local && owner === selfId, hasAudio: projector?.media?.payload.has_audio, start, stop, busy, status, error };
}
