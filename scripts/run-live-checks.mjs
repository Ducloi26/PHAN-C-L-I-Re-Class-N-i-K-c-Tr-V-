import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:5173';
const roomId = `qa-${Date.now()}-${randomBytes(3).toString('hex')}`;
const email = `qa-${Date.now()}-${randomBytes(3).toString('hex')}@lophockyuc.local`;
const password = randomBytes(20).toString('base64url');
const results = [];
const sockets = [];
let teacherId;
const started = new Date().toISOString();
if (!process.env.QA_ADMIN_EMAIL || !process.env.QA_ADMIN_PASSWORD) throw new Error('Set QA_ADMIN_EMAIL and QA_ADMIN_PASSWORD before running live tests.');

async function api(path, { token, method = 'GET', body, status = 200 } = {}) {
  const response = await fetch(`${base}${path}${path.includes('?') ? '&' : '?'}roomId=${roomId}`, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(25000),
  });
  const data = await response.json();
  assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(data)}`);
  return data;
}
async function step(name, action) {
  const start = Date.now();
  try { await action(); results.push({ name, status: 'PASS', durationMs: Date.now() - start }); console.log(`PASS ${name}`); }
  catch (error) { results.push({ name, status: 'FAIL', error: error.message }); throw error; }
}
async function connect(user, extra = {}) {
  const url = new URL('/ws', base.replace(/^http/, 'ws'));
  url.searchParams.set('roomId', roomId); url.searchParams.set('token', user.sessionToken);
  const ws = new WebSocket(url);
  sockets.push(ws);
  const events = [];
  ws.addEventListener('message', (event) => events.push(JSON.parse(event.data)));
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', () => reject(new Error('WebSocket failed')), { once: true }); });
  const send = (type, payload = {}) => ws.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
  const wait = async (type, predicate = () => true, after = 0) => {
    const end = Date.now() + 10000;
    while (Date.now() < end) {
      const event = events.slice(after).find((entry) => entry.type === type && predicate(entry.payload));
      if (event) return event.payload;
      await delay(30);
    }
    throw new Error(`WebSocket event timed out: ${type}`);
  };
  if (!extra.observeOnly) send('player:join', { sessionId: 'forged-root', role: 'admin', displayName: 'Forged admin', x: -4.35, z: 0.03, ...extra });
  const snapshot = extra.observeOnly ? null : await wait('room:snapshot');
  return { ws, send, wait, events, snapshot };
}

async function cleanupAccount() {
  if (!teacherId) return;
  const config = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8') + (existsSync(new URL('../.dev.vars', import.meta.url)) ? readFileSync(new URL('../.dev.vars', import.meta.url), 'utf8') : '');
  const value = (key) => [...config.matchAll(new RegExp(`^${key}\\s*=\\s*"([^"\\r\\n]+)"`, 'gm'))].at(-1)?.[1];
  const supabase = value('SUPABASE_URL'); const key = value('SUPABASE_SERVICE_ROLE_KEY');
  assert.ok(supabase && key, 'Missing cleanup configuration');
  const url = `${supabase}/auth/v1/admin/users/${encodeURIComponent(teacherId)}`;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const user = await (await fetch(url, { headers })).json();
  assert.equal(user.email, email, 'Refusing to delete an account not created by this test');
  assert.ok(user.email.startsWith('qa-'));
  const response = await fetch(url, { method: 'DELETE', headers });
  assert.ok(response.ok, 'Could not clean up the QA account');
}

let admin, teacher, guestA, guestB, guestC, a, b, t, c, observer, wish, mark;
try {
  await step('Health and all SPA routes respond', async () => {
    assert.equal((await api('/api/health')).storage, 'durable-object');
    for (const path of ['/', '/login', '/classroom', '/admin']) {
      const response = await fetch(`${base}${path}`); assert.equal(response.status, 200); assert.match(await response.text(), /id="root"/);
    }
    for (const path of ['/favicon.svg', '/media/slide1_ngay_tro_ve.svg', '/media/slide2_hanh_trinh_tri_thuc.svg', '/media/slide3_loi_tri_an.svg', '/media/so-do-dai-hoc-tay-nguyen.jpg']) {
      const response = await fetch(`${base}${path}`); assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /image\//); assert.ok((await response.arrayBuffer()).byteLength > 100);
    }
  });
  await step('Admin login verifies real backend role; bad password is rejected', async () => {
    await api('/api/staff/login', { method: 'POST', body: { email: process.env.QA_ADMIN_EMAIL, password: 'invalid-test-password' }, status: 401 });
    admin = await api('/api/staff/login', { method: 'POST', body: { email: process.env.QA_ADMIN_EMAIL, password: process.env.QA_ADMIN_PASSWORD } });
    assert.equal(admin.user.role, 'admin');
  });
  await step('Guest validation, separate identities, and no client role escalation', async () => {
    await api('/api/guest-session', { method: 'POST', body: { displayName: 'x' }, status: 400 });
    const create = (name) => api('/api/guest-session', { method: 'POST', body: { displayName: name, participantType: 'student', role: 'admin' } });
    guestA = await create('Khách kiểm thử A'); guestB = await create('Khách kiểm thử B'); guestC = await create('Khách vào sau');
    assert.notEqual(guestA.guestSessionId, guestB.guestSessionId); assert.equal(guestA.player.role, 'member');
  });
  await step('Anonymous and forged credentials cannot mutate data or access approval', async () => {
    for (const path of ['/api/flowers', '/api/wishes', '/api/memory-marks']) await api(path, { method: 'POST', body: {}, status: 401 });
    await api('/api/projector', { method: 'PATCH', body: {}, status: 401 });
    const forged = `e30.${Buffer.from(JSON.stringify({ sub: admin.user.id, role: 'admin', exp: 9999999999 })).toString('base64url')}.fake`;
    await api('/api/admin/teachers', { token: forged, status: 401 });
    await api('/api/admin/teachers', { token: guestA.sessionToken, status: 403 });
  });
  await step('Teacher registration is pending and cannot sign in', async () => {
    await api('/api/teacher-registration', { method: 'POST', body: { email, password, displayName: '[QA] Giáo viên kiểm thử', department: 'Kiểm thử tự động', role: 'admin' } });
    const account = (await api('/api/admin/teachers', { token: admin.sessionToken })).accounts.find((item) => item.email === email);
    assert.ok(account); teacherId = account.id; assert.equal(account.status, 'pending');
    await api('/api/staff/login', { method: 'POST', body: { email, password }, status: 401 });
    assert.equal((await api('/api/teachers')).teachers.some((item) => item.id === teacherId), false);
  });
  await step('Admin approval enables teacher login and public recipient entry', async () => {
    await api(`/api/admin/teachers/${teacherId}`, { token: admin.sessionToken, method: 'PATCH', body: { status: 'approved' } });
    teacher = await api('/api/staff/login', { method: 'POST', body: { email, password } }); assert.equal(teacher.user.role, 'teacher');
    const recipient = (await api('/api/teachers')).teachers.find((item) => item.id === teacherId); assert.ok(recipient); assert.equal(recipient.email, undefined);
    await api(`/api/admin/teachers/${teacherId}`, { token: teacher.sessionToken, method: 'PATCH', body: { status: 'approved' }, status: 403 });
  });
  await step('Three players and an admin observer use authenticated WebSockets without phantom counts', async () => {
    observer = await connect(admin, { observeOnly: true });
    a = await connect(guestA); b = await connect(guestB); t = await connect(teacher, { x: -3.5, z: -4.2 });
    assert.equal(a.snapshot.self.id, guestA.guestSessionId); assert.equal(a.snapshot.self.role, 'member');
    assert.equal(t.snapshot.self.role, 'teacher');
    await a.wait('player:joined', (player) => player.id === teacher.user.id);
    assert.equal((await api('/api/room-state')).onlineCount, 3);
  });
  await step('Flower is stored, announced once and reflected in real totals', async () => {
    const data = await api('/api/flowers', { token: guestA.sessionToken, method: 'POST', body: { receiverId: teacherId, flowerType: 'lotus', note: 'Tri ân thầy cô!' } });
    assert.equal(data.gift.flower_type, 'lotus');
    await b.wait('flower:announced', (gift) => gift.id === data.gift.id && gift.senderId === guestA.guestSessionId);
    await observer.wait('flower:announced', (gift) => gift.id === data.gift.id);
    assert.equal((await api('/api/teachers')).teachers.find((item) => item.id === teacherId).flower_count, 1);
    assert.equal(b.events.filter((event) => event.type === 'flower:announced' && event.payload.id === data.gift.id).length, 1);
  });
  await step('Duplicate and concurrent flower gifts enforce one gift per sender/teacher', async () => {
    await api('/api/flowers', { token: guestA.sessionToken, method: 'POST', body: { receiverId: teacherId, flowerType: 'rose' }, status: 409 });
    const url = `${base}/api/flowers?roomId=${roomId}`;
    const responses = await Promise.all(['rose', 'sunflower'].map((flowerType) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${guestB.sessionToken}` }, body: JSON.stringify({ receiverId: teacherId, flowerType }) })));
    assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
    assert.equal((await api('/api/teachers')).teachers.find((item) => item.id === teacherId).flower_count, 2);
  });
  await step('Invalid flowers, long notes and nonexistent recipients do not create gifts', async () => {
    for (const input of [{ receiverId: teacherId, flowerType: 'fake' }, { receiverId: teacherId, flowerType: '__proto__' }, { receiverId: teacherId, flowerType: 'rose', note: 'x'.repeat(121) }, { receiverId: 'teacher-all', flowerType: 'rose' }]) await api('/api/flowers', { token: guestC.sessionToken, method: 'POST', body: input, status: 400 });
    assert.equal((await api('/api/teachers')).teachers.find((item) => item.id === teacherId).flower_count, 2);
  });
  await step('Vietnamese wishes persist, bind author identity and throttle repeated posting', async () => {
    wish = (await api('/api/wishes', { token: guestA.sessionToken, method: 'POST', body: { content: 'Cảm ơn thầy cô! <script>không chạy</script>', author_id: admin.user.id, authorName: 'Admin giả' } })).wish;
    assert.equal(wish.author_id, guestA.guestSessionId); assert.equal(wish.author_name, 'Khách kiểm thử A');
    await b.wait('wish:announced', (event) => event.id === wish.id);
    assert.ok((await api('/api/wishes')).wishes.some((item) => item.id === wish.id));
    await api('/api/wishes', { token: guestA.sessionToken, method: 'POST', body: { content: 'Không được gửi liên tục.' }, status: 429 });
  });
  await step('Wish moderation is staff-only and public/private views stay consistent', async () => {
    await api(`/api/wishes/${wish.id}`, { token: guestA.sessionToken, method: 'PATCH', body: { is_hidden: true }, status: 403 });
    await api(`/api/wishes/${wish.id}`, { token: admin.sessionToken, method: 'PATCH', body: { is_hidden: true } });
    await b.wait('wish:updated', (event) => event.id === wish.id && event.is_hidden);
    assert.equal((await api('/api/wishes')).wishes.some((item) => item.id === wish.id), false);
    assert.equal((await api('/api/wishes?includeAll=true', { token: admin.sessionToken })).wishes.find((item) => item.id === wish.id).is_hidden, true);
    await api('/api/wishes?includeAll=true', { token: guestA.sessionToken, status: 403 });
    await api(`/api/wishes/${wish.id}`, { token: teacher.sessionToken, method: 'PATCH', body: { is_hidden: false } });
    assert.equal((await api('/api/wishes')).wishes.find((item) => item.id === wish.id).is_hidden, false);
  });
  await step('Memory cards persist, validate input and update all viewers', async () => {
    const input = { displayName: 'Kỷ niệm kiểm thử', message: 'Chúng ta đã từng ở đây!', symbol: 'heart', cardColor: '#fef3c7' };
    await api('/api/memory-marks', { token: guestA.sessionToken, method: 'POST', body: { ...input, symbol: 'fake' }, status: 400 });
    mark = (await api('/api/memory-marks', { token: guestA.sessionToken, method: 'POST', body: input })).mark;
    await b.wait('memory_mark:added', (event) => event.id === mark.id);
    assert.ok((await api('/api/memory-marks')).marks.some((item) => item.id === mark.id));
    await api(`/api/memory-marks/${mark.id}`, { token: guestA.sessionToken, method: 'PATCH', body: { moderation_status: 'hidden' }, status: 403 });
    await api(`/api/memory-marks/${mark.id}`, { token: teacher.sessionToken, method: 'PATCH', body: { moderation_status: 'hidden' } });
    assert.equal((await api('/api/memory-marks')).marks.length, 0);
    assert.equal((await api('/api/memory-marks?includeAll=true', { token: teacher.sessionToken })).marks.length, 1);
    await api(`/api/memory-marks/${mark.id}`, { token: teacher.sessionToken, method: 'PATCH', body: { moderation_status: 'approved' } });
  });
  await step('Projector rejects guests and invalid slides; teacher updates reach late joiners', async () => {
    await api('/api/projector', { token: guestA.sessionToken, method: 'PATCH', body: { media_id: 'media-slide-2' }, status: 403 });
    await api('/api/projector', { token: teacher.sessionToken, method: 'PATCH', body: { media_id: 'invalid' }, status: 400 });
    const data = await api('/api/projector', { token: teacher.sessionToken, method: 'PATCH', body: { media_id: 'media-slide-2' } });
    await a.wait('projector:state_updated', (state) => state.media_id === 'media-slide-2');
    c = await connect(guestC); assert.equal(c.snapshot.projector.media_id, 'media-slide-2');
    assert.equal((await api('/api/projector')).projector.revision, data.projector.revision);
    const retro = await api('/api/projector', { token: teacher.sessionToken, method: 'PATCH', body: { mode: 'retrospective', retrospective_index: 0 } });
    assert.equal(retro.projector.retrospective_mark_id, mark.id);
  });
  await step('Raw WebSocket messages cannot fabricate gifts or wish announcements', async () => {
    const before = b.events.length;
    a.send('flower:send', { senderName: 'Forged', teacherName: 'Forged' }); a.send('wish:broadcast', { content: 'Forged' });
    await a.wait('error'); await delay(100);
    assert.equal(b.events.slice(before).some((event) => event.type === 'flower:announced' || event.type === 'wish:announced'), false);
  });
  await step('Shared YouTube URL, pause and seek reach all viewers and enforce revision ordering', async () => {
    await api('/api/projector', { token: guestA.sessionToken, method: 'PATCH', body: { youtube_url: 'https://youtu.be/M7lc1UVf-VE' }, status: 403 });
    await api('/api/projector', { token: teacher.sessionToken, method: 'PATCH', body: { youtube_url: 'https://example.com/evil' }, status: 400 });
    const state = (await api('/api/projector', { token: teacher.sessionToken, method: 'PATCH', body: { youtube_url: 'https://youtu.be/M7lc1UVf-VE?t=45' } })).projector;
    assert.equal(state.media.kind, 'youtube'); assert.equal(state.position_sec, 45);
    for (const socket of [a, b, c, observer]) await socket.wait('projector:state_updated', (item) => item.revision === state.revision && item.media?.payload.youtube_id === 'M7lc1UVf-VE');
    const paused = (await api('/api/projector', { token: teacher.sessionToken, method: 'PATCH', body: { is_playing: false, position_sec: 60, expected_revision: state.revision } })).projector;
    assert.equal(paused.is_playing, false);
    await api('/api/projector', { token: teacher.sessionToken, method: 'PATCH', body: { is_playing: true, expected_revision: state.revision }, status: 409 });
    const late = await connect(guestC); c = late;
    assert.equal(late.snapshot.projector.position_sec, 60); assert.equal(late.snapshot.projector.is_playing, false);
  });
  await step('Screen signaling is authenticated, owner-directed, session-bound and never broadcast to bystanders', async () => {
    await api('/api/rtc-config', { status: 401 });
    const config = await api('/api/rtc-config', { token: guestA.sessionToken }); assert.ok(Array.isArray(config.iceServers));
    await api('/api/projector', { token: guestA.sessionToken, method: 'PATCH', body: { screen_start: true }, status: 403 });
    const state = (await api('/api/projector', { token: teacher.sessionToken, method: 'PATCH', body: { screen_start: true, has_audio: true } })).projector;
    const sessionId = state.media.payload.screen_session_id; assert.equal(state.media.payload.presenter_id, teacherId);
    const beforeHost = t.events.length; const beforeB = b.events.length;
    a.send('screen:signal', { kind: 'ready', sessionId, toId: teacherId, fromId: 'forged' });
    const ready = await t.wait('screen:signal', (item) => item.kind === 'ready', beforeHost); assert.equal(ready.fromId, guestA.guestSessionId);
    t.send('screen:signal', { kind: 'offer', sessionId, toId: guestA.guestSessionId, description: { type: 'offer', sdp: 'v=0\r\n' } });
    const offer = await a.wait('screen:signal', (item) => item.kind === 'offer'); assert.equal(offer.fromId, teacherId);
    a.send('screen:signal', { kind: 'answer', sessionId, toId: teacherId, description: { type: 'answer', sdp: 'v=0\r\n' } });
    await t.wait('screen:signal', (item) => item.kind === 'answer');
    for (const payload of [{ kind: 'offer', sessionId, toId: guestB.guestSessionId, description: { type: 'offer', sdp: 'v=0' } }, { kind: 'ready', sessionId: 'old', toId: teacherId }]) {
      const after = a.events.length; a.send('screen:signal', payload); await a.wait('error', () => true, after);
    }
    await delay(100); assert.equal(b.events.slice(beforeB).some((item) => item.type === 'screen:signal'), false);
    await api('/api/projector', { token: teacher.sessionToken, method: 'PATCH', body: { screen_stop: 'old' }, status: 409 });
    await api('/api/projector', { token: teacher.sessionToken, method: 'PATCH', body: { screen_stop: sessionId } });
    assert.notEqual((await api('/api/projector')).projector.media.kind, 'screen');
    await api('/api/projector', { token: teacher.sessionToken, method: 'PATCH', body: { mode: 'retrospective', retrospective_index: 0 } });
  });
  await step('Seat validation, exclusive occupancy and disconnection release work', async () => {
    a.send('seat:request', { seatId: 'missing' }); await a.wait('seat:rejected', (seat) => seat.seatId === 'missing');
    a.send('seat:request', { seatId: 'seat-teacher' }); await a.wait('seat:rejected', (seat) => seat.seatId === 'seat-teacher');
    a.send('seat:request', { seatId: 'seat-1' }); await a.wait('seat:confirmed', (seat) => seat.seatId === 'seat-1');
    b.send('seat:request', { seatId: 'seat-1' }); await b.wait('seat:rejected', (seat) => seat.seatId === 'seat-1');
    a.send('player:move', { x: 6, z: 4 }); await delay(100);
    assert.equal((await api('/api/room-state')).players.find((player) => player.id === guestA.guestSessionId).x, -4.35);
    a.send('seat:release'); await b.wait('seat:occupancy_update', (seat) => seat.seatId === 'seat-1' && !seat.isOccupied);
    b.send('seat:request', { seatId: 'seat-1' }); await b.wait('seat:confirmed'); b.ws.close(1000, 'QA done');
    await a.wait('player:left', (player) => player.id === guestB.guestSessionId);
    assert.equal((await api('/api/room-state')).seats.length, 0);
    t.send('seat:request', { seatId: 'seat-teacher' }); await t.wait('seat:confirmed', (seat) => seat.seatId === 'seat-teacher'); t.send('seat:release');
  });
  await step('Avatar and activity changes are broadcast; stationary users stay present', async () => {
    a.send('player:avatar_changed', { avatar: { presetId: 'student-female-1', gender: 'female', hairStyle: 'long', hairColor: '#111111', outfitColor: '#22cc22' } });
    await t.wait('player:avatar_updated', (event) => event.id === guestA.guestSessionId && event.avatar.outfitColor === '#22cc22');
    a.send('player:state_changed', { state: 'gifting' }); await t.wait('player:state_updated', (event) => event.id === guestA.guestSessionId && event.state === 'gifting');
    await delay(13000);
    assert.equal((await api('/api/room-state')).onlineCount, 3);
    assert.equal((await api('/api/wishes')).wishes.length, 1);
    assert.equal((await api('/api/teachers')).teachers.find((item) => item.id === teacherId).flower_count, 2);
  });
  await step('Revocation immediately removes teacher access and stale recipients', async () => {
    await api('/api/projector', { token: teacher.sessionToken, method: 'PATCH', body: { screen_start: true, has_audio: true } });
    await api(`/api/admin/teachers/${teacherId}`, { token: admin.sessionToken, method: 'PATCH', body: { status: 'revoked' } });
    assert.notEqual((await api('/api/projector')).projector.media.kind, 'screen');
    await api('/api/projector', { token: admin.sessionToken, method: 'PATCH', body: { mode: 'retrospective', retrospective_index: 0 } });
    await api('/api/projector', { token: teacher.sessionToken, method: 'PATCH', body: { media_id: 'media-slide-3' }, status: 403 });
    assert.equal((await api('/api/teachers')).teachers.some((item) => item.id === teacherId), false);
    await api('/api/flowers', { token: guestC.sessionToken, method: 'POST', body: { receiverId: teacherId, flowerType: 'rose' }, status: 400 });
    await api('/api/staff/login', { method: 'POST', body: { email, password }, status: 401 });
  });
  await step('Admin session refresh and independent room persistence work', async () => {
    const refreshed = await api('/api/staff/refresh', { method: 'POST', body: { refreshToken: admin.refreshToken } }); assert.equal(refreshed.user.role, 'admin');
    await api('/api/admin/teachers', { token: refreshed.sessionToken });
    assert.equal((await api('/api/memory-marks')).marks[0].id, mark.id);
    assert.equal((await api('/api/projector')).projector.mode, 'retrospective');
  });
  await step('Historical gift totals remain accurate after teacher access is revoked', async () => {
    await api('/api/stats', { token: guestA.sessionToken, status: 403 });
    const stats = await api('/api/stats', { token: admin.sessionToken });
    assert.equal(stats.flowers, 2); assert.equal(stats.wishes, 1); assert.equal(stats.memories, 1);
  });
} catch (error) {
  console.error(error.message); process.exitCode = 1;
} finally {
  for (const socket of sockets) try { socket.close(1000, 'QA complete'); } catch {}
  try { await cleanupAccount(); results.push({ name: 'Cleanup only the disposable QA Auth account', status: 'PASS' }); }
  catch (error) { results.push({ name: 'Cleanup QA account', status: 'FAIL', error: error.message }); process.exitCode = 1; }
  const report = { started, finished: new Date().toISOString(), base, isolatedRoom: roomId, results };
  mkdirSync('test-results', { recursive: true }); writeFileSync('test-results/live-integration.json', JSON.stringify(report, null, 2));
  console.log(`${results.filter((item) => item.status === 'PASS').length}/${results.length} live checks passed; report: test-results/live-integration.json`);
}
