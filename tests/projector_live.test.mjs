import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModule, memoryStorage } from './helpers/runtime.mjs';

const teacher = { id: 'teacher-A', role: 'teacher', name: 'Thầy A', type: 'guest' };
const guest = { id: 'guest-A', role: 'member', name: 'Khách A', type: 'guest' };
const youtube = 'https://www.youtube.com/watch?v=M7lc1UVf-VE&t=1m20s';
function room() {
  const storage = memoryStorage(); const events = [];
  const { RoomData } = loadModule('worker/RoomData.ts');
  const data = new RoomData(storage, (type, payload) => events.push({ type, payload }));
  const patch = (body, actor = teacher) => data.handle(new Request('https://internal/data/projector', { method: 'PATCH', headers: { 'X-Classroom-Identity': encodeURIComponent(JSON.stringify(actor)) }, body: JSON.stringify(body) }));
  return { storage, data, events, patch, RoomData };
}

test('YouTube parser accepts official share/watch/embed/Shorts/live URLs and timestamps only', () => {
  const { parseYouTubeLink } = loadModule('src/lib/projectorMedia.ts');
  for (const url of [youtube, 'https://youtu.be/M7lc1UVf-VE?t=80', 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE?start=80', 'https://youtube.com/shorts/M7lc1UVf-VE?t=80', 'https://youtube.com/live/M7lc1UVf-VE?t=80']) {
    const video = parseYouTubeLink(url); assert.equal(video.id, 'M7lc1UVf-VE'); assert.equal(video.start, 80);
  }
  for (const url of ['javascript:alert(1)', 'https://youtube.com.evil.invalid/watch?v=M7lc1UVf-VE', 'https://evil.invalid/?v=M7lc1UVf-VE', 'https://youtube.com/watch?v=<script>', 'https://youtube.com/watch?v=short', 'https://youtu.be/', 'file:///M7lc1UVf-VE']) assert.equal(parseYouTubeLink(url), null);
});

test('Playback clock accounts for paused state, late joiners and different device clocks', () => {
  const { playbackPosition } = loadModule('src/lib/projectorMedia.ts');
  const state = { position_sec: 80, is_playing: true, updated_at: new Date(100000).toISOString() };
  assert.equal(playbackPosition(state, 115000), 95);
  assert.equal(playbackPosition(state, 300000, -185000), 95);
  assert.equal(playbackPosition({ ...state, is_playing: false }, 300000), 80);
  assert.equal(playbackPosition(state, 0), 80);
});

test('Only staff can start YouTube or screen projection; invalid links cannot change shared state', async () => {
  const f = room();
  assert.equal((await f.patch({ youtube_url: youtube }, guest)).status, 403);
  assert.equal((await f.patch({ screen_start: true }, guest)).status, 403);
  assert.equal((await f.patch({ youtube_url: 'https://example.com/video' })).status, 400);
  assert.equal(f.events.length, 0); assert.equal(f.storage.snapshot().size, 0);
});

test('YouTube selection, pause and seek persist and broadcasts use the same revision for late joiners', async () => {
  const f = room();
  const first = await (await f.patch({ youtube_url: youtube })).json();
  assert.equal(first.projector.media.kind, 'youtube'); assert.equal(first.projector.position_sec, 80);
  assert.equal(first.projector.controller_id, teacher.id);
  assert.equal((await f.patch({ is_playing: false, position_sec: 123, expected_revision: 1 })).status, 200);
  const restored = await new f.RoomData(f.storage, () => {}).projector();
  assert.equal(restored.media.payload.youtube_id, 'M7lc1UVf-VE'); assert.equal(restored.position_sec, 123); assert.equal(restored.is_playing, false); assert.equal(restored.revision, 2);
  assert.equal(f.events.at(-1).payload.revision, restored.revision);
  assert.equal(f.storage.snapshot().get('projector_v2').server_time, undefined);
});

test('Concurrent projector controllers cannot silently overwrite a newer selection', async () => {
  const f = room();
  await f.patch({ youtube_url: youtube });
  const results = await Promise.all([f.patch({ is_playing: false, expected_revision: 1 }), f.patch({ screen_start: true, expected_revision: 1 })]);
  assert.deepEqual(results.map((response) => response.status).sort(), [200, 409]);
  assert.equal(f.events.length, 2);
});

test('Screen source has server-owned identity and session; stale stop never ends a replacement', async () => {
  const f = room();
  const one = (await (await f.patch({ screen_start: true, has_audio: true, media: { payload: { presenter_id: guest.id } } })).json()).projector;
  assert.equal(one.media.payload.presenter_id, teacher.id); assert.equal(one.media.payload.has_audio, true);
  const two = (await (await f.patch({ screen_start: true })).json()).projector;
  assert.notEqual(one.media.payload.screen_session_id, two.media.payload.screen_session_id);
  assert.equal((await f.patch({ screen_stop: one.media.payload.screen_session_id })).status, 409);
  await f.data.stopScreen(guest.id); assert.equal((await f.data.projector()).media.kind, 'screen');
  await f.data.stopScreen(teacher.id, one.media.payload.screen_session_id); assert.equal((await f.data.projector()).media.kind, 'screen');
  await f.data.stopScreen(teacher.id, two.media.payload.screen_session_id); assert.equal((await f.data.projector()).media.kind, 'image');
  const revision = (await f.data.projector()).revision;
  await f.data.stopScreen(teacher.id); assert.equal((await f.data.projector()).revision, revision);
});

test('Switching screen to slides or YouTube removes the capture source; failed writes emit nothing', async () => {
  const f = room(); await f.patch({ screen_start: true });
  const { MEDIA_LIBRARY } = loadModule('src/lib/mediaLibrary.ts');
  await f.patch({ media_id: MEDIA_LIBRARY[1].id }); assert.notEqual((await f.data.projector()).media.kind, 'screen');
  await f.patch({ screen_start: true }); await f.patch({ youtube_url: youtube }); assert.equal((await f.data.projector()).media.kind, 'youtube');
  const count = f.events.length; f.storage.failWrites = true;
  assert.equal((await f.patch({ screen_start: true })).status, 503); assert.equal(f.events.length, count);
});

test('Signaling rejects other sessions, forged offerers, viewer-to-viewer traffic and malformed SDP', async () => {
  const f = room(); await f.patch({ screen_start: true }); const state = await f.data.projector();
  const { authorizeScreenSignal: allow } = loadModule('worker/screenSignal.ts');
  const input = { sessionId: state.media.payload.screen_session_id, toId: teacher.id, kind: 'ready', fromId: 'forged' };
  assert.equal(allow(state, guest.id, 'member', input).fromId, guest.id);
  for (const patch of [{ sessionId: 'old' }, { toId: 'other-viewer' }, { kind: 'offer', description: { type: 'offer', sdp: 'v=0' } }]) assert.equal(allow(state, guest.id, 'member', { ...input, ...patch }), null);
  assert.equal(allow(state, teacher.id, 'member', { ...input, toId: guest.id, kind: 'offer' }), null);
  assert.equal(allow(state, teacher.id, 'teacher', { ...input, toId: guest.id, kind: 'offer', description: { type: 'answer', sdp: 'v=0' } }), null);
  assert.equal(allow(state, teacher.id, 'teacher', { ...input, toId: guest.id, kind: 'offer', description: { type: 'offer', sdp: 'v=0' } }).fromId, teacher.id);
  assert.equal(allow({ ...state, mode: 'retrospective' }, guest.id, 'member', input), null);
});

function transportFixture() {
  const pcs = []; const timers = new Set(); const sent = []; const received = []; const statuses = [];
  class Stream { tracks = []; addTrack(track) { this.tracks.push(track); } getTracks() { return this.tracks; } }
  class Peer {
    connectionState = 'new'; signalingState = 'stable'; remoteDescription = null; localDescription = null; tracks = []; ice = [];
    constructor(config) { this.config = config; pcs.push(this); }
    close() { this.signalingState = 'closed'; this.connectionState = 'closed'; }
    addTrack(track, stream) { this.tracks.push({ track, stream }); }
    async createOffer() { return { type: 'offer', sdp: 'real-offer' }; }
    async createAnswer() { return { type: 'answer', sdp: 'real-answer' }; }
    async setLocalDescription(value) { this.localDescription = { ...value, toJSON: () => value }; }
    async setRemoteDescription(value) { this.remoteDescription = value; }
    async addIceCandidate(value) { assert.ok(this.remoteDescription); this.ice.push(value); }
  }
  const { ScreenTransport } = loadModule('src/lib/screenTransport.ts', {}, { RTCPeerConnection: Peer, MediaStream: Stream, setInterval: (fn) => { timers.add(fn); return fn; }, clearInterval: (fn) => timers.delete(fn) });
  const create = (id, stream = null) => new ScreenTransport('share-1', id, 'host', stream, { iceServers: [] }, (signal) => sent.push(signal), (stream) => received.push(stream), (status) => statuses.push(status));
  return { pcs, timers, sent, received, statuses, Stream, create };
}

test('Actual screen transport offers both selected video and audio tracks and targets only that viewer', async () => {
  const f = transportFixture(); const stream = new f.Stream(); stream.addTrack({ kind: 'video' }); stream.addTrack({ kind: 'audio' });
  const host = f.create('host', stream);
  await host.handle({ kind: 'ready', sessionId: 'share-1', toId: 'host', fromId: 'viewer' });
  assert.deepEqual(f.pcs[0].tracks.map(({ track }) => track.kind), ['video', 'audio']);
  assert.equal(f.sent[0].kind, 'offer'); assert.equal(f.sent[0].toId, 'viewer');
  await host.handle({ kind: 'answer', sessionId: 'share-1', toId: 'host', fromId: 'viewer', description: { type: 'answer', sdp: 'answer' } });
  assert.equal(f.pcs[0].remoteDescription.type, 'answer');
  await host.handle({ kind: 'ready', sessionId: 'share-1', toId: 'host', fromId: 'viewer' }); assert.equal(f.pcs.length, 1);
  host.close(); assert.equal(f.pcs[0].connectionState, 'closed'); assert.equal(stream.getTracks().length, 2);
});

test('Viewer buffers ICE before SDP, answers only current presenter and receives its media stream', async () => {
  const f = transportFixture(); const viewer = f.create('viewer');
  assert.equal(f.sent[0].kind, 'ready');
  await viewer.handle({ kind: 'offer', sessionId: 'old', toId: 'viewer', fromId: 'host' });
  await viewer.handle({ kind: 'offer', sessionId: 'share-1', toId: 'viewer', fromId: 'attacker' }); assert.equal(f.pcs.length, 0);
  await viewer.handle({ kind: 'ice', sessionId: 'share-1', toId: 'viewer', fromId: 'host', candidate: { candidate: 'ice-candidate' } });
  assert.equal(f.pcs[0].ice.length, 0);
  await viewer.handle({ kind: 'offer', sessionId: 'share-1', toId: 'viewer', fromId: 'host', description: { type: 'offer', sdp: 'offer' } });
  assert.equal(f.pcs[0].ice.length, 1); assert.equal(f.sent.at(-1).kind, 'answer');
  const stream = new f.Stream(); f.pcs[0].ontrack({ track: {}, streams: [stream] }); assert.equal(f.received.at(-1), stream);
  viewer.close(); assert.equal(f.timers.size, 0); assert.equal(f.pcs[0].signalingState, 'closed');
});

test('A failed viewer retries negotiation and leaving releases peer resources without stopping capture', async () => {
  const f = transportFixture(); const viewer = f.create('viewer');
  await viewer.handle({ kind: 'offer', sessionId: 'share-1', toId: 'viewer', fromId: 'host', description: { type: 'offer', sdp: 'offer' } });
  const peer = f.pcs[0]; peer.connectionState = 'failed'; peer.onconnectionstatechange();
  assert.equal(f.received.at(-1), null); assert.equal(peer.connectionState, 'closed');
  for (const tick of f.timers) tick(); assert.equal(f.sent.at(-1).kind, 'ready');
  viewer.participantLeft('host'); viewer.close(); assert.equal(f.timers.size, 0);
});

test('Presenter disconnect stops the screen in the actual room while viewer disconnect keeps it running', async () => {
  const f = room(); await f.patch({ screen_start: true });
  const sockets = [teacher, guest].map((identity) => ({ attachment: { identity, sessionId: identity.id, displayName: identity.name, role: identity.role, x: 0, z: 0, state: 'standing', seatId: null }, deserializeAttachment() { return this.attachment; }, serializeAttachment(value) { this.attachment = value; }, send() {}, close() {} }));
  let initialized;
  const ctx = { storage: f.storage, getWebSockets: () => sockets, blockConcurrencyWhile: (fn) => { initialized = fn(); } };
  const { ClassroomRoom } = loadModule('worker/ClassroomRoom.ts', { 'cloudflare:workers': { DurableObject: class { constructor(ctx) { this.ctx = ctx; } } } });
  const instance = new ClassroomRoom(ctx, {}); await initialized;
  await instance.webSocketClose(sockets[1], 1000, '', true); assert.equal((await f.data.projector()).media.kind, 'screen');
  await instance.webSocketClose(sockets[0], 1000, '', true); assert.notEqual((await f.data.projector()).media.kind, 'screen');
});

test('Room startup clears an orphaned screen source after all presenter sockets are gone', async () => {
  const f = room(); await f.patch({ screen_start: true }); let initialized;
  const ctx = { storage: f.storage, getWebSockets: () => [], blockConcurrencyWhile: (fn) => { initialized = fn(); } };
  const { ClassroomRoom } = loadModule('worker/ClassroomRoom.ts', { 'cloudflare:workers': { DurableObject: class { constructor(ctx) { this.ctx = ctx; } } } });
  new ClassroomRoom(ctx, {}); await initialized;
  assert.notEqual((await f.data.projector()).media.kind, 'screen');
});
