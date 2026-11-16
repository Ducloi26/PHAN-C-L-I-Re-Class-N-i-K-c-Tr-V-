/**
 * Local background track with synthesized classroom sound effects.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private isBgmPlaying: boolean = false;
  private bgmStarting = false;
  private bgmEnabled = true;
  private listeners = new Set<() => void>();
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmFadeId: ReturnType<typeof setInterval> | null = null;
  private bgmRequest = 0;
  private projectorActive = false;

  constructor() {
    try {
      const savedMute = localStorage.getItem('lop_hoc_audio_muted');
      if (savedMute !== null) {
        this.isMuted = savedMute === 'true';
      }
      this.bgmEnabled = localStorage.getItem('lop_hoc_bgm_enabled') !== 'false';
    } catch {
      // ignore
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }
  private notify() { this.listeners.forEach((listener) => listener()); }
  public getBgmEnabled() { return this.bgmEnabled; }
  public getBgmStarting() { return this.bgmStarting; }
  private saveBgmEnabled(enabled: boolean) {
    this.bgmEnabled = enabled;
    try { localStorage.setItem('lop_hoc_bgm_enabled', String(enabled)); } catch { /* Optional preference. */ }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.isMuted ? 0 : 0.8;
        this.masterGain.connect(this.ctx.destination);

      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('lop_hoc_audio_muted', muted ? 'true' : 'false');
    } catch {
      // ignore
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }
    if (this.bgmAudio) this.bgmAudio.muted = muted;
    this.notify();
    if (!muted && this.bgmEnabled) this.startBgm();
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * 🔔 Traditional Vietnamese Classroom Bell ("Bính... Boong...")
   */
  public playBellSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    
    // 1st Strike: High chime ("Bính" - 587.33Hz D5 + 880Hz A5)
    this.createBellChime(587.33, t, 1.2, 0.5);
    this.createBellChime(1174.66, t, 0.6, 0.15);

    // 2nd Strike: Deeper chime ("Boong" - 440Hz A4 + harmonics at +0.7s)
    this.createBellChime(440.0, t + 0.65, 2.0, 0.65);
    this.createBellChime(880.0, t + 0.65, 1.0, 0.2);
  }

  private createBellChime(freq: number, startTime: number, duration: number, volume: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  /**
   * 🌸 Flower Gifting Sparkle Sound (Harp / Chime arpeggio)
   */
  public playFlowerSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6

    notes.forEach((freq, idx) => {
      const noteTime = t + idx * 0.08;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.35, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(noteTime);
      osc.stop(noteTime + 0.6);
    });
  }

  /**
   * 📌 Memory Pin Sound (Wooden tap + confirmation ting)
   */
  public playPinSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    const t = this.ctx.currentTime;

    // Wood tap
    const oscWood = this.ctx.createOscillator();
    const gainWood = this.ctx.createGain();
    oscWood.type = 'sine';
    oscWood.frequency.setValueAtTime(180, t);
    oscWood.frequency.exponentialRampToValueAtTime(60, t + 0.08);
    gainWood.gain.setValueAtTime(0.4, t);
    gainWood.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    oscWood.connect(gainWood);
    gainWood.connect(this.masterGain);
    oscWood.start(t);
    oscWood.stop(t + 0.08);

    // Warm ting
    const oscTing = this.ctx.createOscillator();
    const gainTing = this.ctx.createGain();
    oscTing.type = 'sine';
    oscTing.frequency.setValueAtTime(987.77, t + 0.06); // B5
    gainTing.gain.setValueAtTime(0.25, t + 0.06);
    gainTing.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);

    oscTing.connect(gainTing);
    gainTing.connect(this.masterGain);
    oscTing.start(t + 0.06);
    oscTing.stop(t + 0.8);
  }

  private fadeMusicVolume(target: number, duration = 800, finished?: () => void) {
    if (this.bgmFadeId !== null) clearInterval(this.bgmFadeId);
    this.bgmFadeId = null;
    const audio = this.bgmAudio;
    if (!audio) return;
    const from = audio.volume;
    const started = Date.now();
    this.bgmFadeId = setInterval(() => {
      const progress = Math.min(1, (Date.now() - started) / duration);
      audio.volume = Math.max(0, Math.min(1, from + (target - from) * progress));
      if (progress === 1) {
        if (this.bgmFadeId !== null) clearInterval(this.bgmFadeId);
        this.bgmFadeId = null;
        finished?.();
      }
    }, 25);
  }

  /** User-selected track; no network/player request before a user gesture. */
  public startBgm() {
    if (this.projectorActive || (typeof document !== 'undefined' && document.hidden)) return;
    if (this.bgmStarting || (this.isBgmPlaying && this.bgmAudio && !this.bgmAudio.paused)) return;
    if (typeof Audio === 'undefined') return;
    if (!this.bgmAudio) {
      this.bgmAudio = new Audio('/media/tri-an-background-v1.mp3');
      this.bgmAudio.preload = 'none';
      this.bgmAudio.loop = true;
      this.bgmAudio.hidden = true;
      this.bgmAudio.setAttribute('data-classroom-bgm', 'true');
      this.bgmAudio.setAttribute('aria-hidden', 'true');
      this.bgmAudio.addEventListener('error', () => this.pauseBgm(true));
      if (typeof document !== 'undefined') document.body.appendChild(this.bgmAudio);
    }
    if (this.bgmFadeId !== null) clearInterval(this.bgmFadeId);
    this.bgmFadeId = null;
    // Request audible playback inside the original gesture. Starting at zero
    // can be classified as inaudible autoplay before the later volume ramp.
    this.bgmAudio.volume = 0.03;
    this.bgmAudio.muted = this.isMuted;
    this.saveBgmEnabled(true);
    this.bgmStarting = true;
    this.notify();
    const request = ++this.bgmRequest;
    this.bgmAudio.play().then(() => {
      if (request !== this.bgmRequest) return;
      this.bgmStarting = false;
      this.isBgmPlaying = true;
      this.fadeMusicVolume(0.12, 700);
      this.notify();
    }).catch(() => {
      if (request === this.bgmRequest) this.pauseBgm(true);
    });
  }

  public stopBgm(immediate = false) {
    this.saveBgmEnabled(false);
    this.pauseBgm(immediate);
  }

  /** Temporary pause preserves the user's preference and playback position. */
  public pauseBgm(immediate = true) {
    this.isBgmPlaying = false;
    this.bgmStarting = false;
    ++this.bgmRequest;
    if (this.bgmFadeId !== null) clearInterval(this.bgmFadeId);
    this.bgmFadeId = null;
    this.notify();
    if (!this.bgmAudio) return;
    if (immediate) {
      this.bgmAudio.volume = 0;
      this.bgmAudio.pause();
    } else {
      this.fadeMusicVolume(0, 250, () => this.bgmAudio?.pause());
    }
  }

  public resumeBgm(existingOnly = false) {
    if (this.bgmEnabled && !this.isMuted && (!existingOnly || this.bgmAudio)) this.startBgm();
  }

  public restartBgm() {
    this.pauseBgm(true);
    if (this.bgmAudio) { try { this.bgmAudio.currentTime = 0; } catch { /* Metadata can still be loading. */ } }
    this.startBgm();
  }

  public toggleBgm(): boolean {
    if (this.projectorActive) return false;
    if (this.isBgmPlaying || this.bgmStarting) {
      this.stopBgm();
      return false;
    } else {
      this.setMuted(false);
      this.startBgm();
      return this.isBgmPlaying;
    }
  }

  public getIsBgmPlaying(): boolean {
    return this.isBgmPlaying;
  }

  /** Projection owns the sound while preserving the user's music preference. */
  public setProjectorActive(active: boolean) {
    if (this.projectorActive === active) return;
    this.projectorActive = active;
    if (active) this.pauseBgm(true);
    else this.resumeBgm(true);
  }
}

export const soundManager = new SoundManager();

