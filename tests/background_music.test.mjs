import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModule } from './helpers/runtime.mjs';

function fixture(rejectPlay = false) {
  let shouldReject = rejectPlay;
  let now = 0, id = 0; const timers = new Map(), tracks = [];
  const document = { hidden: false, body: { appendChild() {} } };
  class Audio {
    volume = 1; paused = true; handlers = new Map();
    constructor(src) { this.src = src; tracks.push(this); }
    setAttribute() {}
    addEventListener(name, callback) { this.handlers.set(name, callback); }
    play() { this.paused = false; return shouldReject ? Promise.reject(new Error('Playback blocked')) : Promise.resolve(); }
    pause() { this.paused = true; }
  }
  const { soundManager } = loadModule('src/lib/audioManager.ts', {}, {
    Audio, document, Date: class extends Date { static now() { return now; } },
    localStorage: { getItem: () => null, setItem() {} },
    setInterval: (callback) => { timers.set(++id, callback); return id; },
    clearInterval: (key) => timers.delete(key),
  });
  return { soundManager, tracks, timers, document, setReject(value) { shouldReject = value; }, advance(ms) { now += ms; for (const callback of [...timers.values()]) callback(); } };
}

test('The selected track loads only on start, fades to 12%, respects mute and pauses for projection', async () => {
  const f = fixture(); const music = f.soundManager;
  assert.equal(f.tracks.length, 0);
  music.startBgm(); await Promise.resolve();
  const audio = f.tracks[0]; assert.equal(audio.src, '/media/tri-an-background-v1.mp3');
  assert.equal(audio.preload, 'none'); assert.equal(audio.loop, true); assert.equal(audio.volume, 0.03);
  f.advance(1200); assert.equal(audio.volume, 0.12);
  music.setMuted(true); assert.equal(audio.muted, true);
  music.setMuted(false); assert.equal(audio.muted, false);
  audio.currentTime = 42;
  music.setProjectorActive(true); f.advance(400);
  assert.equal(audio.paused, true); assert.equal(audio.volume, 0); assert.equal(music.getBgmEnabled(), true);
  // Pointer/keyboard/visibility handlers, unmute and the music button cannot
  // restart the track while the projector owns the sound.
  music.resumeBgm(); music.resumeBgm(true); music.setMuted(false); music.startBgm(); music.toggleBgm();
  await Promise.resolve(); assert.equal(audio.paused, true); assert.equal(f.timers.size, 0);
  music.setProjectorActive(false); await Promise.resolve(); f.advance(700);
  assert.equal(audio.paused, false); assert.equal(audio.currentTime, 42); assert.equal(audio.volume, 0.12);
  music.stopBgm(true); assert.equal(audio.paused, true); assert.equal(audio.volume, 0); assert.equal(f.timers.size, 0);
});

test('Ending projection respects manual music off and master mute without creating a new track', async () => {
  const f = fixture(); const music = f.soundManager;
  music.setProjectorActive(true); music.startBgm();
  assert.equal(f.tracks.length, 0);
  music.setProjectorActive(false); assert.equal(f.tracks.length, 0);
  music.startBgm(); await Promise.resolve(); music.stopBgm(true);
  music.setProjectorActive(true); music.setProjectorActive(false); await Promise.resolve();
  assert.equal(f.tracks[0].paused, true); assert.equal(music.getBgmEnabled(), false);
  music.startBgm(); await Promise.resolve(); music.setProjectorActive(true); music.setMuted(true);
  music.setProjectorActive(false); await Promise.resolve();
  assert.equal(f.tracks[0].paused, true); assert.equal(f.tracks.length, 1);
});

test('Projection interrupts a pending play and its stale promise cannot restore playing state', async () => {
  const f = fixture(); const music = f.soundManager;
  music.startBgm(); music.setProjectorActive(true); await Promise.resolve(); f.advance(1000);
  assert.equal(music.getIsBgmPlaying(), false); assert.equal(f.tracks[0].paused, true); assert.equal(f.timers.size, 0);
  music.setProjectorActive(false); await Promise.resolve();
  assert.equal(music.getIsBgmPlaying(), true);
});

test('Ending projection in a hidden tab waits until the tab becomes visible to resume music', async () => {
  const f = fixture(); const music = f.soundManager;
  music.startBgm(); await Promise.resolve(); music.setProjectorActive(true);
  f.document.hidden = true; music.setProjectorActive(false); await Promise.resolve();
  assert.equal(f.tracks[0].paused, true);
  f.document.hidden = false; music.resumeBgm(true); await Promise.resolve();
  assert.equal(f.tracks[0].paused, false);
});

test('A pending fade-out cannot pause a restarted track', async () => {
  const f = fixture(); const music = f.soundManager;
  music.startBgm(); await Promise.resolve(); f.advance(1200);
  music.stopBgm(); f.advance(100);
  music.startBgm(); await Promise.resolve(); f.advance(1200);
  assert.equal(f.tracks.length, 1); assert.equal(f.tracks[0].paused, false); assert.equal(f.tracks[0].volume, 0.12);
  music.stopBgm(); f.advance(250); assert.equal(f.tracks[0].paused, true); assert.equal(f.timers.size, 0);
});

test('Rejected playback clears the playing flag without starting replacement audio', async () => {
  const f = fixture(true); f.soundManager.startBgm();
  await Promise.resolve(); await Promise.resolve();
  assert.equal(f.soundManager.getIsBgmPlaying(), false);
  assert.equal(f.tracks.length, 1); assert.equal(f.tracks[0].paused, true); assert.equal(f.timers.size, 0);
});

test('A blocked first play retries from the next gesture without switching music off and on', async () => {
  const f = fixture(true); const music = f.soundManager;
  music.startBgm(); await Promise.resolve(); await Promise.resolve();
  assert.equal(music.getIsBgmPlaying(), false); assert.equal(music.getBgmEnabled(), true);
  f.setReject(false); music.resumeBgm(); await Promise.resolve(); f.advance(700);
  assert.equal(music.getIsBgmPlaying(), true); assert.equal(f.tracks.length, 1); assert.equal(f.tracks[0].volume, 0.12);
});

test('Temporary page pauses preserve playback intent; manual stop stays stopped on later gestures', async () => {
  const f = fixture(); const music = f.soundManager; let updates = 0;
  const unsubscribe = music.subscribe(() => updates++);
  music.resumeBgm(true); assert.equal(f.tracks.length, 0);
  music.startBgm(); await Promise.resolve(); music.pauseBgm(true);
  assert.equal(music.getBgmEnabled(), true); music.resumeBgm(true); await Promise.resolve();
  assert.equal(music.getIsBgmPlaying(), true); assert.ok(updates >= 4);
  music.stopBgm(true); music.resumeBgm(); assert.equal(music.getIsBgmPlaying(), false);
  const count = updates; unsubscribe(); music.setMuted(true); assert.equal(updates, count);
});

test('Opening the time portal restarts the existing track from its beginning', async () => {
  const f = fixture(); f.soundManager.startBgm(); await Promise.resolve();
  f.tracks[0].currentTime = 45;
  f.soundManager.restartBgm(); await Promise.resolve();
  assert.equal(f.tracks.length, 1); assert.equal(f.tracks[0].currentTime, 0);
  assert.equal(f.soundManager.getIsBgmPlaying(), true); f.soundManager.pauseBgm(true);
});
