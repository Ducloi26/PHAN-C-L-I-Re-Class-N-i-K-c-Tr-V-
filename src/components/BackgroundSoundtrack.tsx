import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { soundManager } from '../lib/audioManager';

/** One music owner across intro, avatar selection and classroom routes. */
export function BackgroundSoundtrack() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!['/', '/classroom'].includes(pathname)) { soundManager.pauseBgm(true); return; }
    const click = (event: Event) => {
      // The audio button itself decides whether to play or stop; starting it
      // during capture would turn the very same click into a double toggle.
      if ((event.target as Element | null)?.closest?.('[data-audio-control]')) return;
      soundManager.resumeBgm();
    };
    const key = (event: KeyboardEvent) => { if (event.key === 'Enter' || event.key === ' ') click(event); };
    const visibility = () => {
      if (document.hidden) soundManager.pauseBgm(true);
      else soundManager.resumeBgm(true);
    };
    document.addEventListener('click', click, true);
    document.addEventListener('keydown', key, true);
    document.addEventListener('visibilitychange', visibility);
    soundManager.resumeBgm(true);
    return () => {
      document.removeEventListener('click', click, true);
      document.removeEventListener('keydown', key, true);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [pathname]);
  return null;
}
