import type { ProjectorState } from '../types';

export function parseYouTubeLink(value: string): { id: string; start: number } | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const host = url.hostname.toLowerCase();
    const parts = url.pathname.split('/').filter(Boolean);
    let id: string | null = null;
    if (host === 'youtu.be') id = parts[0];
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'www.youtube-nocookie.com', 'youtube-nocookie.com'].includes(host)) {
      id = url.pathname === '/watch' ? url.searchParams.get('v') : ['embed', 'shorts', 'live'].includes(parts[0]) ? parts[1] : null;
    }
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
    const raw = url.searchParams.get('t') || url.searchParams.get('start') || '';
    const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(raw);
    const start = /^\d+$/.test(raw) ? Number(raw) : match ? Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0) : 0;
    return { id, start: Math.min(start, 86400) };
  } catch { return null; }
}

export function playbackPosition(state: ProjectorState, now = Date.now(), clockOffset = 0): number {
  if (!state.is_playing) return Math.max(0, state.position_sec);
  const updated = Date.parse(state.updated_at);
  return Math.max(0, state.position_sec + (Number.isFinite(updated) ? Math.max(0, now + clockOffset - updated) / 1000 : 0));
}

export function liveProjection(state: ProjectorState | null | undefined): boolean {
  return state?.mode !== 'retrospective' && ['youtube', 'screen'].includes(state?.media?.kind || '');
}
