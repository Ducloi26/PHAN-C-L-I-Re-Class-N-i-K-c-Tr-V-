import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModule } from './helpers/runtime.mjs';

function fixture(capture, sendCommand) {
  let cursor = 0; let effects = [];
  const slots = [];
  const changed = (before, after) => !before || before.length !== after.length || before.some((value, index) => value !== after[index]);
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { state: typeof initial === 'function' ? initial() : initial };
      return [slots[index].state, (next) => { slots[index].state = typeof next === 'function' ? next(slots[index].state) : next; }];
    },
    useRef(value) { const index = cursor++; return slots[index] ??= { current: value }; },
    useCallback(callback, deps) { const index = cursor++; if (changed(slots[index]?.deps, deps)) slots[index] = { value: callback, deps }; return slots[index].value; },
    useEffect(callback, deps) { const index = cursor++; if (changed(slots[index]?.deps, deps)) effects.push(() => { slots[index]?.cleanup?.(); slots[index] = { deps, cleanup: callback() }; }); },
  };
  let statusListener;
  const socket = { status: 'connected', getStatus() { return this.status; }, on() { return () => {}; }, onStatusChange(callback) { statusListener = callback; callback(this.status); return () => {}; }, send() {} };
  const commands = []; const transports = [];
  const command = async (body) => { commands.push(body); return sendCommand ? sendCommand(body) : { revision: 10, mode: 'presentation', media: { kind: 'screen', payload: { presenter_id: 'host', screen_session_id: 'session-1', has_audio: true } } }; };
  const { useScreenShare } = loadModule('src/hooks/useScreenShare.ts', {
    react,
    '../services/api': { fetchRtcConfig: async () => ({ iceServers: [] }) },
    '../lib/multiplayerSocket': { multiplayerSocket: socket },
    '../lib/screenTransport': { ScreenTransport: class { constructor() { transports.push(this); } close() { this.closed = true; } } },
  }, { navigator: { mediaDevices: { getDisplayMedia: capture } }, RTCPeerConnection: class {}, DOMException });
  const render = (state = { revision: 9, mode: 'presentation', media: { kind: 'image', payload: {} } }) => { cursor = 0; effects = []; const result = useScreenShare(state, 'host', command); effects.forEach((effect) => effect()); return result; };
  return { render, commands, transports, disconnect() { socket.status = 'disconnected'; statusListener(socket.status); }, unmount() { for (const slot of slots) slot?.cleanup?.(); } };
}
function stream() {
  const tracks = ['video', 'audio'].map((kind) => ({ kind, readyState: 'live', listeners: new Map(), stop() { this.readyState = 'ended'; }, addEventListener(event, callback) { this.listeners.set(event, callback); } }));
  return { tracks, getTracks: () => tracks, getVideoTracks: () => tracks.filter((track) => track.kind === 'video'), getAudioTracks: () => tracks.filter((track) => track.kind === 'audio') };
}
const screen = (session = 'session-1', owner = 'host') => ({ revision: 10, mode: 'presentation', media: { kind: 'screen', payload: { presenter_id: owner, screen_session_id: session } } });

test('Capture requests selected display audio immediately from click before any network command', async () => {
  let resolve; let options;
  const selected = stream(); const f = fixture((input) => { options = input; return new Promise((done) => { resolve = done; }); });
  const action = f.render().start();
  assert.equal(options.audio, true); assert.equal(f.commands.length, 0);
  resolve(selected); await action;
  assert.equal(f.commands[0].screen_start, true); assert.equal(f.commands[0].has_audio, true); assert.equal(f.commands[0].expected_revision, 9);
  assert.equal(f.render(screen()).stream, selected);
  f.unmount(); assert.equal(selected.tracks.every((track) => track.readyState === 'ended'), true);
});

test('Cancelling a replacement picker preserves an existing screen and never posts a new source', async () => {
  const selected = stream(); let calls = 0;
  const f = fixture(async () => { if (++calls === 1) return selected; throw new DOMException('Cancelled', 'NotAllowedError'); });
  await f.render().start(); const current = f.render(screen());
  await assert.rejects(current.start(), /Chưa chọn nguồn/);
  assert.equal(f.commands.length, 1); assert.equal(selected.tracks.every((track) => track.readyState === 'live'), true);
  assert.equal(f.render(screen()).stream, selected); f.unmount();
});

test('Rejected server selection stops all newly acquired tracks and reports failure', async () => {
  const selected = stream(); const f = fixture(async () => selected, async () => { throw new Error('Máy chiếu đã thay đổi'); });
  await assert.rejects(f.render().start(), /đã thay đổi/);
  assert.equal(selected.tracks.every((track) => track.readyState === 'ended'), true);
  assert.equal(f.render().stream, null); f.unmount();
});

test('A picker resolved after leaving the classroom releases tracks without publishing', async () => {
  let resolve; const selected = stream(); const f = fixture(() => new Promise((done) => { resolve = done; }));
  const pending = f.render().start(); f.unmount(); resolve(selected);
  await assert.rejects(pending, /Kết nối lớp đã thay đổi/);
  assert.equal(f.commands.length, 0); assert.equal(selected.tracks.every((track) => track.readyState === 'ended'), true);
});

test('Losing classroom connection immediately stops the selected capture', async () => {
  const selected = stream(); const f = fixture(async () => selected);
  await f.render().start(); f.render(screen()); f.disconnect();
  assert.equal(selected.tracks.every((track) => track.readyState === 'ended'), true); f.unmount();
});

test('Ending an old captured track targets its original session instead of the current source', async () => {
  const selected = stream(); const f = fixture(async () => selected);
  await f.render().start(); f.render(screen('replacement', 'other-teacher'));
  selected.tracks[0].listeners.get('ended')(); await Promise.resolve();
  assert.equal(f.commands.at(-1).screen_stop, 'session-1'); f.unmount();
});
