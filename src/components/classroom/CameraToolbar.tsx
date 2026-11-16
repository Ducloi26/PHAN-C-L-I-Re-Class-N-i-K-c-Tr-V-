import { useEffect, useState } from 'react';
import { RotateCw, Minimize2, X } from 'lucide-react';
import { CAMERA_ZOOM_LEVELS, CameraZoom } from '../../lib/cameraZoom';
import { enterLandscape, unlockOrientation } from '../../lib/landscape';

export function CameraToolbar({ zoom, onZoom, is3D }: { zoom: CameraZoom; onZoom: (zoom: CameraZoom) => void; is3D: boolean }) {
  const [fullscreen, setFullscreen] = useState(Boolean(document.fullscreenElement));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    const changed = () => {
      setFullscreen(Boolean(document.fullscreenElement));
      if (!document.fullscreenElement) { unlockOrientation(); setMessage(''); }
    };
    document.addEventListener('fullscreenchange', changed);
    return () => { document.removeEventListener('fullscreenchange', changed); unlockOrientation(); };
  }, []);
  const rotate = async () => {
    setBusy(true);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else setMessage(await enterLandscape());
    } catch { setMessage('Hãy bật tự xoay màn hình rồi xoay ngang điện thoại.'); }
    finally { setBusy(false); }
  };
  return (
    <div className="classroom-camera-toolbar relative shrink-0 z-30 bg-slate-950 border-b border-amber-500/20 text-white px-3 py-1 flex items-center justify-between gap-2">
      <div role="group" aria-label="Độ phóng đại camera" className="flex items-center gap-1">
        <span className="hidden sm:inline text-xs text-slate-300 mr-2">Góc nhìn</span>
        {is3D && CAMERA_ZOOM_LEVELS.map((level) => (
          <button key={level} type="button" disabled={!is3D} aria-pressed={zoom === level} aria-label={`Camera ${level}×`}
            title={level === 0.5 ? 'Góc rộng' : level === 1 ? 'Bình thường' : 'Phóng gần'}
            onClick={() => onZoom(level)}
            className={`min-w-11 h-9 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 ${zoom === level ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-100 hover:bg-slate-700'}`}>
            {level}×
          </button>
        ))}
        {!is3D && <span className="text-[10px] text-slate-400">Chế độ 2D</span>}
      </div>
      <button type="button" onClick={rotate} disabled={busy} aria-label={fullscreen ? 'Thoát toàn màn hình' : 'Xoay ngang điện thoại'}
        className="shrink-0 flex items-center gap-1.5 min-h-9 px-2.5 rounded-lg bg-sky-900 border border-sky-500/40 text-sky-100 text-xs font-semibold disabled:opacity-60">
        {fullscreen ? <Minimize2 className="w-4 h-4" /> : <RotateCw className="w-4 h-4" />}
        {fullscreen ? 'Thu nhỏ' : 'Xoay ngang'}
      </button>
      {message && <div role="status" className="absolute top-full right-2 mt-2 max-w-[min(24rem,calc(100vw-1rem))] rounded-xl border border-sky-500/50 bg-slate-900 p-3 shadow-xl text-xs leading-relaxed flex items-start gap-2">
        <span>{message}</span>
        <button type="button" aria-label="Đóng hướng dẫn xoay màn hình" onClick={() => setMessage('')} className="p-1 shrink-0"><X className="w-4 h-4" /></button>
      </div>}
    </div>
  );
}
