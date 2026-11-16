export interface YouTubePlayer {
  playVideo(): void; pauseVideo(): void; seekTo(time: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number; getDuration(): number; getPlayerState(): number;
  mute(): void; unMute(): void; setVolume(volume: number): void; destroy(): void;
}
interface PlayerOptions {
  videoId: string; width: string; height: string;
  playerVars: Record<string, string | number>;
  events: { onReady: (event: { target: YouTubePlayer }) => void; onError: (event: { data: number }) => void; onAutoplayBlocked: () => void };
}
interface YouTubeAPI { Player: new (element: HTMLElement, options: PlayerOptions) => YouTubePlayer }
let pending: Promise<YouTubeAPI> | undefined;
export function loadYouTubePlayer(): Promise<YouTubeAPI> {
  const global = window as typeof window & { YT?: YouTubeAPI; onYouTubeIframeAPIReady?: () => void };
  if (global.YT?.Player) return Promise.resolve(global.YT);
  if (pending) return pending;
  pending = new Promise<YouTubeAPI>((resolve, reject) => {
    const previous = global.onYouTubeIframeAPIReady;
    const timer = setTimeout(() => { pending = undefined; reject(new Error('Không tải được YouTube. Kiểm tra mạng hoặc trình chặn nội dung rồi thử lại.')); }, 20000);
    global.onYouTubeIframeAPIReady = () => { previous?.(); clearTimeout(timer); if (global.YT?.Player) resolve(global.YT); };
    let script = document.querySelector<HTMLScriptElement>('script[src="https://www.youtube.com/iframe_api"]');
    if (!script) { script = document.createElement('script'); script.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(script); }
    script.onerror = () => { clearTimeout(timer); script?.remove(); pending = undefined; reject(new Error('Không kết nối được YouTube.')); };
  });
  return pending;
}
