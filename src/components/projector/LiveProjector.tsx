import React, { useEffect, useRef, useState } from 'react';
import type { ProjectorState } from '../../types';
import { playbackPosition } from '../../lib/projectorMedia';
import { loadYouTubePlayer, YouTubePlayer } from '../../lib/youtubePlayer';
import type { ProjectorCommand } from '../../services/api';

interface Props {
  projector: ProjectorState; clockOffset: React.MutableRefObject<number>;
  canControl: boolean; command: (input: ProjectorCommand) => Promise<ProjectorState>;
  stream: MediaStream | null; isPresenting: boolean; status: string; error: string;
  audible: boolean; onSound: (enabled: boolean) => void; onStop: () => Promise<unknown>;
}
export function LiveProjector(props: Props) {
  const { projector, stream, isPresenting, audible, onSound, command, canControl } = props;
  const holder = useRef<HTMLDivElement>(null);
  const player = useRef<YouTubePlayer | null>(null);
  const dragging = useRef(false);
  const video = useRef<HTMLVideoElement>(null);
  const latest = useRef(props); latest.current = props;
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const youtubeId = projector.media?.payload.youtube_id;
  const isYouTube = projector.media?.kind === 'youtube';
  const sync = () => {
    const current = player.current;
    if (!current) return;
    const props = latest.current;
    const target = playbackPosition(props.projector, Date.now(), props.clockOffset.current);
    const end = current.getDuration();
    const position = end > 0 ? Math.min(target, Math.max(0, end - 0.1)) : target;
    if (Math.abs(current.getCurrentTime() - position) > 2) current.seekTo(position, true);
    if (props.projector.is_playing) {
      if (![1, 3].includes(current.getPlayerState()) && (current.getPlayerState() !== 0 || end <= 0 || target < end - 1)) current.playVideo();
    } else if (current.getPlayerState() !== 2) current.pauseVideo();
    if (!dragging.current) setTime(current.getCurrentTime() || position);
    setDuration(end);
  };
  useEffect(() => {
    setError(''); setBlocked(false); setDuration(0);
    if (!isYouTube || !youtubeId || !holder.current) return;
    let active = true;
    let instance: YouTubePlayer | undefined;
    const target = document.createElement('div'); holder.current.appendChild(target);
    loadYouTubePlayer().then((api) => {
      if (!active) return;
      instance = new api.Player(target, {
        videoId: youtubeId, width: '100%', height: '100%',
        playerVars: { autoplay: 1, controls: 0, disablekb: 1, playsinline: 1, rel: 0, origin: window.location.origin },
        events: {
          onReady: ({ target: ready }) => {
            if (!active) return;
            player.current = ready; ready.mute(); sync();
            if (latest.current.audible) { ready.setVolume(100); ready.unMute(); }
          },
          onAutoplayBlocked: () => { if (active) setBlocked(true); },
          onError: ({ data }) => { if (active) setError(data === 101 || data === 150 ? 'Chủ video không cho phát nhúng. Giáo viên hãy chọn video khác hoặc chia sẻ tab đang phát video kèm âm thanh.' : data === 100 ? 'Video đã bị xóa hoặc không công khai.' : `Không phát được video YouTube (mã ${data}). Hãy thử video khác.`); },
        },
      });
    }).catch((err) => { if (active) setError(err.message); });
    const interval = setInterval(sync, 2000);
    return () => { active = false; clearInterval(interval); player.current = null; instance?.destroy(); target.remove(); };
  }, [youtubeId, isYouTube, retry]);
  useEffect(sync, [projector.revision, projector.is_playing]);
  useEffect(() => {
    const current = player.current;
    if (current) { if (audible) { current.setVolume(100); current.unMute(); } else current.mute(); }
    if (video.current) video.current.muted = !audible || isPresenting;
  }, [audible, isPresenting]);
  useEffect(() => {
    const current = video.current;
    if (!current || isYouTube) return;
    current.srcObject = stream; setBlocked(false);
    if (stream) void current.play().catch(() => setBlocked(true));
    return () => { current.pause(); current.srcObject = null; };
  }, [stream, isYouTube]);
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true); setError('');
    try { await action(); } catch (err) { setError(err instanceof Error ? err.message : 'Không cập nhật được máy chiếu.'); }
    finally { setBusy(false); }
  };
  const activate = () => {
    const enabled = !audible;
    onSound(enabled); setBlocked(false);
    if (player.current) {
      if (enabled) { player.current.setVolume(100); player.current.unMute(); } else player.current.mute();
      if (projector.is_playing) player.current.playVideo();
    }
    if (video.current) { video.current.muted = !enabled || isPresenting; void video.current.play().catch(() => setBlocked(true)); }
    sync();
  };
  const update = (playing: boolean, position: number) => command({ is_playing: playing, position_sec: position, expected_revision: projector.revision || 0 });
  return <div className="relative w-full h-full flex flex-col bg-black text-white" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
    <div className="relative flex-1 min-h-0">
      {isYouTube ? <div ref={holder} className="absolute inset-0 pointer-events-none" /> : <video ref={video} className="w-full h-full object-contain" autoPlay playsInline muted={!audible || isPresenting} />}
      {!isYouTube && !stream && <div className="absolute inset-0 grid place-items-center p-4 text-center text-sm">{props.error || props.status}</div>}
      {isPresenting && <span className="absolute top-2 left-2 bg-red-700/90 px-2 py-1 rounded text-xs">Đang chia sẻ • Bản xem trước tắt tiếng</span>}
      {error && <div role="alert" className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center p-4 text-center text-sm gap-3"><p>{error}</p><button className="px-3 py-2 rounded bg-slate-700" onClick={() => setRetry((n) => n + 1)}>Thử lại</button></div>}
    </div>
    <div className="shrink-0 bg-slate-900 px-3 py-2 text-xs flex flex-wrap items-center gap-3">
      {!isPresenting && <button className="px-3 py-2 rounded bg-amber-500 text-slate-950 font-bold" onClick={activate}>{blocked ? 'Bấm để xem / bật tiếng' : audible ? 'Tắt tiếng' : 'Bật tiếng'}</button>}
      {!isYouTube && <span className="flex-1">{props.error || props.status}{projector.media?.payload.has_audio ? '' : ' • Nguồn chia sẻ không có âm thanh'}</span>}
      {isYouTube && canControl && <>
        <button disabled={busy} className="px-3 py-2 bg-slate-700 rounded disabled:opacity-40" onClick={() => void run(() => update(!projector.is_playing, player.current?.getCurrentTime() ?? playbackPosition(projector, Date.now(), props.clockOffset.current)))}>{projector.is_playing ? 'Tạm dừng cả phòng' : 'Phát cả phòng'}</button>
        <button disabled={busy} onClick={() => void run(() => update(true, 0))}>Phát lại</button>
        <label className="flex-1 flex gap-2 items-center min-w-28">Tua <input aria-label="Tua video cho cả phòng" type="range" min={0} max={duration || 86400} step={1} disabled={busy || duration <= 0} value={Math.min(time, duration || 86400)} onChange={(e) => setTime(Number(e.target.value))} onPointerDown={() => { dragging.current = true; }} onPointerCancel={() => { dragging.current = false; }} onPointerUp={(e) => { dragging.current = false; void run(() => update(projector.is_playing, Number(e.currentTarget.value))); }} onKeyUp={(e) => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) void run(() => update(projector.is_playing, Number(e.currentTarget.value))); }} /></label>
      </>}
      {isYouTube && !canControl && <span>Giáo viên điều khiển phát, dừng và tua cho cả phòng.</span>}
      {!isYouTube && canControl && <button disabled={busy} className="px-3 py-2 rounded bg-red-700" onClick={() => void run(props.onStop)}>Dừng chia sẻ</button>}
    </div>
  </div>;
}
