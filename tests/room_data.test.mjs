import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModule, memoryStorage } from './helpers/runtime.mjs';

const member = { id: 'guest-A', name: 'Khách A', role: 'member', type: 'guest' };
const teacher = { id: 'teacher-A', name: 'Thầy A', role: 'teacher', type: 'guest' };
function fixture(initial) {
  const storage = memoryStorage(initial);
  const events = [];
  const { RoomData } = loadModule('worker/RoomData.ts');
  const data = new RoomData(storage, (type, payload) => events.push({ type, payload }));
  const call = (path, method = 'GET', body, actor = member, target = data) => target.handle(new Request(`http://internal/data/${path}`, {
    method, headers: { 'X-Classroom-Identity': encodeURIComponent(JSON.stringify(actor)) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  }));
  return { storage, events, data, call, RoomData };
}
const gift = { receiverId: 'teacher-A', teacherName: 'Thầy A', flowerType: 'lotus', note: 'Tri ân thầy cô!' };
const mark = { displayName: 'Khách A', message: 'Một kỷ niệm thật.', symbol: 'heart', cardColor: '#fef3c7' };

test('Concurrent gifts commit exactly once and survive a fresh repository instance', async () => {
  const f = fixture();
  const results = await Promise.all([f.call('flowers', 'POST', gift), f.call('flowers', 'POST', gift)]);
  assert.deepEqual(results.map((response) => response.status).sort(), [200, 409]);
  assert.equal(f.events.filter((event) => event.type === 'flower:announced').length, 1);
  const restored = new f.RoomData(f.storage, () => {});
  assert.equal((await (await f.call('flower-counts', 'GET', undefined, member, restored)).json()).counts['teacher-A'], 1);
});

test('Failed flower storage rolls back totals and sends no success announcement', async () => {
  const f = fixture(); f.storage.failWrites = true;
  assert.equal((await f.call('flowers', 'POST', gift)).status, 503);
  assert.equal(f.events.length, 0);
  assert.equal((await (await f.call('flower-counts')).json()).counts['teacher-A'], undefined);
  f.storage.failWrites = false;
  assert.equal((await f.call('flowers', 'POST', gift)).status, 200);
});

test('Invalid gifts, long notes and unauthenticated writes never change totals', async () => {
  const f = fixture();
  assert.equal((await f.call('flowers', 'POST', gift, null)).status, 401);
  assert.equal((await f.call('flowers', 'POST', { ...gift, flowerType: '__proto__' })).status, 400);
  assert.equal((await f.call('flowers', 'POST', { ...gift, note: 'x'.repeat(121) })).status, 400);
  assert.equal(f.storage.snapshot().size, 0);
});

test('Wishes use authenticated names, preserve text safely and enforce persistent throttling', async () => {
  const f = fixture();
  const text = 'Cảm ơn thầy cô <script>text only</script> & các bạn';
  const result = await (await f.call('wishes', 'POST', { content: text, author_name: 'Admin giả' })).json();
  assert.equal(result.wish.author_name, member.name);
  assert.equal(result.wish.content, text);
  const restored = new f.RoomData(f.storage, () => {});
  assert.equal((await f.call('wishes', 'POST', { content: 'Gửi quá nhanh' }, member, restored)).status, 429);
  assert.equal((await (await f.call('wishes')).json()).wishes.length, 1);
});

test('Failed wish storage rolls back the throttle and does not report success', async () => {
  const f = fixture(); f.storage.failWrites = true;
  assert.equal((await f.call('wishes', 'POST', { content: 'Một lời chúc thật.' })).status, 503);
  assert.equal(f.events.length, 0);
  f.storage.failWrites = false;
  assert.equal((await f.call('wishes', 'POST', { content: 'Thử gửi lại thành công.' })).status, 200);
});

test('Hidden wishes and memory cards are visible only in verified staff reads', async () => {
  const f = fixture();
  const wish = (await (await f.call('wishes', 'POST', { content: 'Lời chúc được kiểm duyệt.' })).json()).wish;
  const memory = (await (await f.call('memory-marks', 'POST', mark)).json()).mark;
  assert.equal((await f.call(`wishes/${wish.id}`, 'PATCH', { is_hidden: true })).status, 403);
  await f.call(`wishes/${wish.id}`, 'PATCH', { is_hidden: true }, teacher);
  await f.call(`memory-marks/${memory.id}`, 'PATCH', { moderation_status: 'hidden' }, teacher);
  assert.equal((await (await f.call('wishes')).json()).wishes.length, 0);
  assert.equal((await (await f.call('memory-marks')).json()).marks.length, 0);
  assert.equal((await f.call('wishes?includeAll=true')).status, 403);
  assert.equal((await (await f.call('wishes?includeAll=true', 'GET', undefined, teacher)).json()).wishes.length, 1);
  assert.equal((await (await f.call('memory-marks?includeAll=true', 'GET', undefined, teacher)).json()).marks.length, 1);
});

test('Migration preserves existing real memories and projector state without duplicating cards', async () => {
  const legacy = { id: 'old-memory', display_name: 'Người dùng thật', message: 'Kỷ niệm đã lưu', moderation_status: 'approved', created_at: '2026-11-14T00:00:00Z' };
  const f = fixture(new Map([['memory_marks', [legacy]], ['projector_state', { mediaId: 'media-slide-3', isPlaying: false, positionSec: 5, slideIndex: 0 }]]));
  await f.data.migrate(); await f.data.migrate();
  assert.equal((await f.data.marks()).length, 1);
  assert.equal((await f.data.marks())[0].message, legacy.message);
  assert.equal((await f.data.projector()).media_id, 'media-slide-3');
  assert.equal((await f.data.projector()).is_playing, false);
});

test('Projector validates role, media, indices and retrospective availability', async () => {
  const f = fixture();
  assert.equal((await f.call('projector', 'PATCH', { media_id: 'media-slide-2' })).status, 403);
  for (const input of [{ media_id: 'bad' }, { slide_index: -1 }, { slide_index: 100 }, { position_sec: -1 }, { mode: 'retrospective' }]) assert.equal((await f.call('projector', 'PATCH', input, teacher)).status, 400);
  const memory = (await (await f.call('memory-marks', 'POST', mark)).json()).mark;
  const result = await (await f.call('projector', 'PATCH', { mode: 'retrospective', retrospective_index: 0 }, teacher)).json();
  assert.equal(result.projector.retrospective_mark_id, memory.id);
  assert.equal(result.projector.revision, 1);
  const responses = await Promise.all(['media-slide-2', 'media-slide-3'].map((media_id) => f.call('projector', 'PATCH', { mode: 'presentation', media_id }, teacher)));
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
  assert.equal((await f.data.projector()).revision, 2);
  // The losing controller can retry against the newly committed state.
  assert.equal((await f.call('projector', 'PATCH', { mode: 'presentation', media_id: 'media-slide-3', expected_revision: 2 }, teacher)).status, 200);
  assert.equal((await f.data.projector()).revision, 3);
});

test('A failed projector write cannot broadcast a state that was not saved', async () => {
  const f = fixture(); f.storage.failWrites = true;
  assert.equal((await f.call('projector', 'PATCH', { media_id: 'media-slide-3' }, teacher)).status, 503);
  assert.equal(f.events.length, 0);
  assert.equal((await f.data.projector()).media_id, 'media-slide-1');
});

test('Staff statistics count saved gifts independently of teacher directory status', async () => {
  const f = fixture();
  await f.call('flowers', 'POST', gift);
  assert.equal((await f.call('stats')).status, 403);
  assert.equal((await (await f.call('stats', 'GET', undefined, teacher)).json()).flowers, 1);
});

test('Untrusted avatar objects are normalized without adding role fields', () => {
  const { normalizeAvatar } = loadModule('src/lib/avatarPresets.ts');
  const avatar = normalizeAvatar({ presetId: '__proto__', gender: {}, hairStyle: {}, hairColor: { bad: true }, outfitColor: '<script>', accessory: 'admin', role: 'admin' });
  assert.match(avatar.hairColor, /^#[0-9a-f]{6}$/i);
  assert.match(avatar.outfitColor, /^#[0-9a-f]{6}$/i);
  assert.equal(avatar.role, undefined);
  assert.equal(typeof avatar.hairStyle, 'string');
});

test('Teacher names remain safe text and user metadata cannot grant staff access', async () => {
  const { teacherAccount, getStaffRole } = loadModule('worker/staff.ts');
  const user = { id: 'A', email: 'teacher@example.invalid', app_metadata: { staff_role: 'member' }, user_metadata: { display_name: { role: 'admin' }, department: [], role: 'admin' } };
  assert.equal(typeof teacherAccount(user).display_name, 'string');
  assert.equal(typeof teacherAccount(user).title, 'string');
  assert.equal(await getStaffRole(user, {}), 'member');
});

test('An active seated player keeps the seat after lease expiry and room hibernation', async () => {
  const session = { sessionId: 'A', displayName: 'Guest A', role: 'member', participantType: 'guest', identity: { id: 'A', name: 'Guest A', role: 'member', type: 'guest' }, state: 'sitting', seatId: 'seat-1', x: -4.35, y: 0, z: 0.03, rotY: 0, lastSeen: Date.now() };
  const ws = { deserializeAttachment: () => session };
  const storage = memoryStorage(new Map([['occupied_seats', { 'seat-1': { seatId: 'seat-1', sessionId: 'A', playerName: 'Guest A', leasedAt: 0, expiresAt: 1 } }]]));
  let initialized;
  const ctx = { getWebSockets: () => [ws], storage, blockConcurrencyWhile: (callback) => { initialized = callback(); } };
  const { ClassroomRoom } = loadModule('worker/ClassroomRoom.ts', { 'cloudflare:workers': { DurableObject: class { constructor(ctx) { this.ctx = ctx; } } } });
  const room = new ClassroomRoom(ctx, {}); await initialized;
  const state = await (await room.fetch(new Request('http://internal/room-snapshot'))).json();
  assert.equal(state.seats.length, 1); assert.equal(state.seats[0].sessionId, 'A');
});
