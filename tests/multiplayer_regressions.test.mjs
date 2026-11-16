import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModule, memoryStorage } from './helpers/runtime.mjs';

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

function api(fetch, localStorage = storage(), sessionStorage = storage()) {
  return loadModule('src/services/api.ts', {
    '../lib/supabaseClient': { isSupabaseConfigured: false, supabase: null },
    '../lib/avatarPresets': { getDefaultAvatar: () => ({ presetId: 'student-male-1' }) },
    '../lib/mockData': { INITIAL_MEMORY_MARKS: [{ id: 'fake-seed' }], INITIAL_TEACHERS: [{ id: 'teacher-all', flower_count: 128 }] },
  }, { fetch, localStorage, sessionStorage });
}

test('An empty shared wall stays empty even if stale local/sample cards exist', async () => {
  const local = storage();
  local.setItem('lop_hoc_ky_uc_demo_memory_marks', JSON.stringify([{ id: 'stale-card' }]));
  const client = api(async () => ({ ok: true, json: async () => ({ marks: [] }) }), local);
  assert.equal((await client.fetchMemoryMarks()).length, 0);
});

test('A rejected memory write reports failure instead of creating a local-only card', async () => {
  const local = storage();
  const client = api(async () => ({ ok: false, json: async () => ({ error: 'Session expired' }) }), local);
  await assert.rejects(client.createMemoryMark({
    displayName: 'Guest A', message: 'A real memory', symbol: 'heart', cardColor: '#fef3c7',
  }), /Session expired/);
  assert.equal(local.getItem('lop_hoc_ky_uc_demo_memory_marks'), null);
});

test('Two guest tabs retain separate identities and tokens, including after refresh', async () => {
  const local = storage();
  const tabA = storage();
  const tabB = storage();
  let counter = 0;
  const fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    const id = `guest-${++counter}`;
    return { ok: true, json: async () => ({
      ok: true, guestSessionId: id, sessionToken: `token-${id}`,
      player: { ...body, role: 'member' },
    }) };
  };
  const a = api(fetch, local, tabA);
  const b = api(fetch, local, tabB);
  const userA = await a.loginAnonymous('Guest A', 'guest');
  const userB = await b.loginAnonymous('Guest B', 'guest');
  assert.notEqual(userA.id, userB.id);
  assert.equal(a.getSessionToken(), 'token-guest-1');
  assert.equal(b.getSessionToken(), 'token-guest-2');
  assert.equal((await api(fetch, local, tabA).getSavedSession()).displayName, 'Guest A');
  assert.equal((await api(fetch, local, tabB).getSavedSession()).displayName, 'Guest B');
  await b.logout();
  assert.equal((await a.getSavedSession()).displayName, 'Guest A');
});

test('An old socket close cannot disconnect a new socket after StrictMode cleanup', () => {
  const sockets = [];
  class Socket {
    static OPEN = 1;
    static CONNECTING = 0;
    readyState = 0;
    constructor() { sockets.push(this); }
    close() { this.readyState = 3; }
  }
  const { multiplayerSocket: client } = loadModule('src/lib/multiplayerSocket.ts', {}, {
    WebSocket: Socket, window: { location: { protocol: 'http:', host: 'localhost:5173' } },
  });
  client.connect();
  const oldSocket = sockets[0];
  client.send('player:join', { sessionId: 'old' });
  client.disconnect();
  client.connect();
  assert.equal(oldSocket.onclose, null);
  assert.equal(oldSocket.onopen, null);
  assert.equal(client.getStatus(), 'connecting');
  client.disconnect();
});

test('Multiplayer survives inline callback rerenders, idle peers, and reconnects', () => {
  const slots = [];
  let cursor = 0;
  let effects = [];
  const depsChanged = (a, b) => !a || a.length !== b.length || a.some((value, i) => value !== b[i]);
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!slots[index]) slots[index] = { value: typeof initial === 'function' ? initial() : initial };
      return [slots[index].value, (value) => {
        slots[index].value = typeof value === 'function' ? value(slots[index].value) : value;
      }];
    },
    useRef(value) {
      const index = cursor++;
      return slots[index] ??= { current: value };
    },
    useCallback(callback, deps) {
      const index = cursor++;
      if (depsChanged(slots[index]?.deps, deps)) slots[index] = { value: callback, deps };
      return slots[index].value;
    },
    useEffect(callback, deps) {
      const index = cursor++;
      if (depsChanged(slots[index]?.deps, deps)) effects.push(() => {
        slots[index]?.cleanup?.();
        slots[index] = { deps, cleanup: callback() };
      });
    },
  };
  const handlers = new Map();
  const sent = [];
  let connectCount = 0;
  let statusListener;
  let tick;
  let now = 1000;
  const socket = {
    status: 'connecting',
    on: (name, callback) => { handlers.set(name, callback); return () => handlers.delete(name); },
    onStatusChange: (callback) => { statusListener = callback; callback(socket.status); return () => {}; },
    connect: () => { connectCount++; socket.status = 'connected'; statusListener('connected'); },
    disconnect: () => { socket.status = 'disconnected'; },
    getStatus: () => socket.status,
    send: (type, payload) => sent.push({ type, payload }),
  };
  const { useMultiplayer } = loadModule('src/hooks/useMultiplayer.ts', {
    react,
    '../services/api': { getSessionToken: () => 'token-A' },
    '../lib/avatarPresets': { getDefaultAvatar: () => ({}) },
    '../lib/multiplayerSocket': { multiplayerSocket: socket },
  }, {
    Date: class extends Date { static now() { return now; } },
    setInterval: (callback) => { tick = callback; return 1; }, clearInterval: () => {},
  });
  const user = { id: 'A', displayName: 'Guest A', role: 'member', participantType: 'guest' };
  let called = '';
  function render(label) {
    cursor = 0;
    effects = [];
    const state = useMultiplayer(user, () => { called = label; }, () => {});
    effects.forEach((effect) => effect());
    return state;
  }
  render('old');
  handlers.get('room:snapshot')({ players: [{ id: 'B', displayName: 'Guest B', x: 1, z: 3 }], seats: [] });
  render('latest');
  assert.equal(connectCount, 1);
  handlers.get('flower:announced')({ senderName: 'Guest B' });
  assert.equal(called, 'latest');
  now += 20000;
  tick();
  assert.equal(render('latest').remotePlayers.length, 1);
  statusListener('connected');
  assert.equal(sent.filter((message) => message.type === 'player:join').length, 2);
});

test('The actual room restores stationary guests after Durable Object hibernation', async () => {
  const sockets = ['A', 'B'].map((id) => ({
    attachment: {
      sessionId: id, displayName: `Guest ${id}`, role: 'member', participantType: 'guest',
      x: 0, y: 0, z: 3, rotY: 0, state: 'standing', seatId: null, lastSeen: 0,
    },
    deserializeAttachment() { return this.attachment; },
    serializeAttachment(value) { this.attachment = value; },
    send() {},
  }));
  let initialized;
  const ctx = {
    getWebSockets: () => sockets,
    blockConcurrencyWhile: (callback) => { initialized = callback(); },
    storage: memoryStorage(),
  };
  const { ClassroomRoom } = loadModule('worker/ClassroomRoom.ts', {
    'cloudflare:workers': { DurableObject: class { constructor(ctx) { this.ctx = ctx; } } },
  }, { Request, Response });
  const room = new ClassroomRoom(ctx, {});
  await initialized;
  const snapshot = await (await room.fetch(new Request('http://internal/room-snapshot'))).json();
  assert.equal(snapshot.onlineCount, 2);
  assert.deepEqual(snapshot.players.map((player) => player.id).sort(), ['A', 'B']);
  await room.webSocketMessage(sockets[0], JSON.stringify({ type: 'ping' }));
  assert.ok(sockets[0].attachment.lastSeen > 0);
});

test('A real memory is persisted and moderation uses the same room data', async () => {
  const data = memoryStorage();
  const { RoomData } = loadModule('worker/RoomData.ts');
  const room = new RoomData(data, () => {});
  await room.migrate();
  const actor = { id: 'A', name: 'Guest A', role: 'member' };
  const call = async (target, path, method = 'GET', input, identity = actor) => target.handle(new Request(`http://internal/data/${path}`, { method, headers: { 'X-Classroom-Identity': encodeURIComponent(JSON.stringify(identity)) }, ...(input ? { body: JSON.stringify(input) } : {}) }));
  assert.equal((await (await call(room, 'memory-marks')).json()).marks.length, 0);
  const created = await (await call(room, 'memory-marks', 'POST', { displayName: 'Guest A', message: 'My memory', symbol: 'heart', cardColor: '#fef3c7' })).json();
  assert.equal(created.ok, true);
  const restored = new RoomData(data, () => {});
  const rows = await (await call(restored, 'memory-marks')).json();
  assert.equal(rows.marks[0].message, 'My memory');
  const staff = { id: 'root', name: 'Admin', role: 'admin' };
  await call(restored, `memory-marks/${created.mark.id}`, 'PATCH', { moderation_status: 'hidden' }, staff);
  assert.equal((await (await call(restored, 'memory-marks')).json()).marks.length, 0);
  assert.equal((await (await call(restored, 'memory-marks?includeAll=true', 'GET', undefined, staff)).json()).marks[0].moderation_status, 'hidden');
});

test('Memory staff access requires verified identity and a stored staff role', async () => {
  let authenticated = false;
  const { verifyStaffRole } = loadModule('worker/auth.ts', {}, {
    fetch: async (url) => {
      if (url.endsWith('/auth/v1/user')) return { ok: authenticated, json: async () => ({ id: 'staff-id' }) };
      return { ok: true, json: async () => [{ role: 'teacher' }] };
    },
  });
  assert.equal(await verifyStaffRole('forged-token', 'https://example.invalid', 'service-key'), null);
  authenticated = true;
  assert.equal(await verifyStaffRole('verified-token', 'https://example.invalid', 'service-key'), 'teacher');
});

const teacherEnv = { SUPABASE_URL: 'https://database.invalid', SUPABASE_SERVICE_ROLE_KEY: 'test-only-key' };
function teacherDirectory(tables, failures = {}) {
  return loadModule('worker/teachers.ts', {}, {
    fetch: async (input) => {
      const url = new URL(input);
      if (url.pathname === '/auth/v1/admin/users') return { ok: true, json: async () => ({ users: tables.auth_users || [] }) };
      const table = url.pathname.split('/').pop();
      if (failures[table]) return { ok: false, json: async () => failures[table] };
      if (!(table in tables)) return { ok: false, json: async () => ({ code: 'PGRST205' }) };
      const offset = Number(url.searchParams.get('offset'));
      return { ok: true, json: async () => tables[table].slice(offset, offset + 1000) };
    },
  });
}

test('Teacher directory uses registered teachers and real roles, with actual flower counts', async () => {
  const { listTeachers } = teacherDirectory({
    teacher_profiles: [{ id: 'registered', display_name: 'Cô đăng ký', flower_count: 999, title: 'Khoa thực tế' }],
    staff_profiles: [
      { user_id: 'teacher', display_name: 'Thầy được cấp quyền', role: 'teacher' },
      { user_id: 'admin', display_name: 'Admin', role: 'admin' },
    ],
    user_roles: [{ user_id: 'legacy', role: 'teacher' }, { user_id: 'member', role: 'member' }],
    profiles: [{ id: 'legacy', display_name: 'Giáo viên từ phân quyền' }],
    flower_gifts: [{ receiver_id: 'registered' }, { receiver_id: 'registered' }, { receiver_id: 'teacher' }],
  });
  const teachers = await listTeachers(teacherEnv);
  assert.deepEqual(Array.from(teachers, (teacher) => teacher.id).sort(), ['legacy', 'registered', 'teacher']);
  assert.equal(teachers.find((teacher) => teacher.id === 'registered').flower_count, 2);
  assert.equal(teachers.find((teacher) => teacher.id === 'teacher').flower_count, 1);
  assert.equal(teachers.find((teacher) => teacher.id === 'legacy').flower_count, 0);
});

test('An empty teacher database stays empty without sample teachers', async () => {
  const { listTeachers } = teacherDirectory({ staff_profiles: [], user_roles: [] });
  assert.equal((await listTeachers(teacherEnv)).length, 0);
  const client = api(async () => ({ ok: true, json: async () => ({ teachers: [] }) }));
  assert.equal((await client.fetchTeachers()).length, 0);
  const result = await client.giftFlower('guest-A', 'teacher-all');
  assert.equal(result.success, false);
});

test('Missing teacher schema uses real Auth accounts; failed DB permissions never use samples', async () => {
  const missing = teacherDirectory({});
  assert.equal((await missing.listTeachers(teacherEnv)).length, 0);
  const forbidden = teacherDirectory({ teacher_profiles: [{ id: 'A', display_name: 'Teacher' }] }, {
    staff_profiles: { code: '42501' },
  });
  await assert.rejects(forbidden.listTeachers(teacherEnv), /Không tải được/);
  const client = api(async () => ({ ok: false, json: async () => ({ error: 'Database unavailable' }) }));
  await assert.rejects(client.fetchTeachers(), /Database unavailable/);
});

test('Inactive teachers and revoked roles disappear on the next fetch', async () => {
  const tables = {
    teacher_profiles: [{ user_id: 'disabled', id: 'profile-disabled', display_name: 'Disabled', is_active: false }],
    staff_profiles: [{ user_id: 'disabled', display_name: 'Disabled', role: 'teacher' }],
    user_roles: [{ user_id: 'legacy', role: 'teacher' }],
    profiles: [{ id: 'legacy', display_name: 'Previously a teacher' }],
    flower_gifts: [],
  };
  const { listTeachers } = teacherDirectory(tables);
  assert.equal((await listTeachers(teacherEnv)).length, 1);
  tables.user_roles = [];
  assert.equal((await listTeachers(teacherEnv)).length, 0);
});

test('Flower counts include DB pages beyond the default 1000-row limit', async () => {
  const { listTeachers } = teacherDirectory({
    teacher_profiles: [{ id: 'A', display_name: 'Teacher' }],
    flower_gifts: Array.from({ length: 1001 }, () => ({ receiver_id: 'A' })),
  });
  assert.equal((await listTeachers(teacherEnv))[0].flower_count, 1001);
});

function staffFixture() {
  const users = new Map([
    ['root', { id: 'root', email: 'owner@example.invalid', app_metadata: { staff_role: 'admin' }, user_metadata: {} }],
    ['applicant', { id: 'applicant', email: 'teacher@example.invalid', app_metadata: { staff_role: 'member', teacher_status: 'pending' }, user_metadata: { display_name: 'Giáo viên đăng ký' } }],
  ]);
  let created;
  const fetch = async (input, init = {}) => {
    const url = new URL(input);
    const ok = (data) => ({ ok: true, json: async () => structuredClone(data) });
    if (url.pathname === '/auth/v1/user') {
      const id = (init.headers.Authorization || '').replace('Bearer ', '');
      return users.has(id) ? ok(users.get(id)) : { ok: false, json: async () => ({ message: 'Invalid token' }) };
    }
    if (url.pathname === '/auth/v1/admin/users' && init.method === 'POST') {
      created = JSON.parse(init.body);
      return ok({ id: 'created', ...created });
    }
    if (url.pathname === '/auth/v1/admin/users') return ok({ users: [...users.values()] });
    const target = /^\/auth\/v1\/admin\/users\/([^/]+)$/.exec(url.pathname);
    if (target) {
      const user = users.get(target[1]);
      if (init.method === 'PUT') Object.assign(user, JSON.parse(init.body));
      return ok(user);
    }
    return { ok: false, json: async () => ({ code: 'PGRST205' }) };
  };
  return { users, fetch, getCreated: () => created };
}

test('Teacher registration cannot grant itself privileges or confirm its email', async () => {
  const fixture = staffFixture();
  const staff = loadModule('worker/staff.ts', {}, { fetch: fixture.fetch });
  await staff.registerTeacher(teacherEnv, {
    email: 'teacher@example.invalid', password: 'SomeStrongPassword42!', displayName: 'Giáo viên mới', department: 'Khoa mới', role: 'admin', app_metadata: { staff_role: 'admin' },
  });
  assert.equal(fixture.getCreated().app_metadata.staff_role, 'member');
  assert.equal(fixture.getCreated().app_metadata.teacher_status, 'pending');
  assert.equal(fixture.getCreated().email_confirm, false);
});

test('Approval, rejection and revocation persist real access decisions; admin accounts are protected', async () => {
  const fixture = staffFixture();
  const staff = loadModule('worker/staff.ts', {}, { fetch: fixture.fetch });
  await staff.reviewTeacher(teacherEnv, 'applicant', 'approved');
  assert.equal(fixture.users.get('applicant').app_metadata.staff_role, 'teacher');
  assert.equal(fixture.users.get('applicant').email_confirm, true);
  assert.equal((await staff.getStaffIdentity('applicant', teacherEnv)).role, 'teacher');
  await staff.reviewTeacher(teacherEnv, 'applicant', 'revoked');
  assert.equal((await staff.getStaffIdentity('applicant', teacherEnv)).role, 'member');
  await staff.reviewTeacher(teacherEnv, 'applicant', 'rejected');
  assert.equal(fixture.users.get('applicant').app_metadata.teacher_status, 'rejected');
  await assert.rejects(staff.reviewTeacher(teacherEnv, 'root', 'approved'), /quản trị/);
  await assert.rejects(staff.reviewTeacher(teacherEnv, 'applicant', 'admin'), /không hợp lệ/);
});

test('Only a verified admin can read or approve teacher applications', async () => {
  const fixture = staffFixture();
  const staff = loadModule('worker/staff.ts', {}, { fetch: fixture.fetch });
  const worker = loadModule('worker/index.ts', {
    './ClassroomRoom': { ClassroomRoom: class {} },
    './teachers': { listTeachers: async () => [], TeacherDirectoryError: class extends Error {} },
    './auth': { verifyGuestToken: async () => null },
    './staff': staff,
  }, { Request, Response });
  const call = (token, method = 'GET') => worker.default.fetch(new Request('http://local/api/admin/teachers' + (method === 'PATCH' ? '/applicant' : ''), {
    method, headers: { Authorization: `Bearer ${token}` }, ...(method === 'PATCH' ? { body: JSON.stringify({ status: 'approved' }) } : {}),
  }), { ...teacherEnv, CLASSROOM_ROOM: { idFromName: (id) => id, get: () => ({ fetch: async () => new Response('{}') }) } }, {});
  assert.equal((await call('forged')).status, 401);
  assert.equal((await call('applicant')).status, 403);
  assert.equal((await call('applicant', 'PATCH')).status, 403);
  assert.equal(fixture.users.get('applicant').app_metadata.teacher_status, 'pending');
  assert.equal((await call('root')).status, 200);
  assert.equal((await call('root', 'PATCH')).status, 200);
  assert.equal(fixture.users.get('applicant').app_metadata.staff_role, 'teacher');
});

test('Only approved Auth teacher accounts enter the public flower list', async () => {
  const { listTeachers } = teacherDirectory({
    auth_users: [
      { id: 'approved', app_metadata: { staff_role: 'teacher', teacher_status: 'approved' }, user_metadata: { display_name: 'Giáo viên thật', department: 'Khoa thật' } },
      { id: 'pending', app_metadata: { staff_role: 'member', teacher_status: 'pending' }, user_metadata: { display_name: 'Chờ duyệt' } },
      { id: 'root', app_metadata: { staff_role: 'admin' }, user_metadata: { display_name: 'Admin' } },
    ],
  });
  const teachers = await listTeachers(teacherEnv);
  assert.equal(teachers.length, 1);
  assert.equal(teachers[0].id, 'approved');
});

test('A WebSocket join cannot forge admin role or another guest identity', async () => {
  let initialized;
  const messages = [];
  const ws = {
    attachment: { identity: { id: 'real-guest', name: 'Khách thật', role: 'member', type: 'guest' } },
    deserializeAttachment() { return this.attachment; }, serializeAttachment(data) { this.attachment = data; },
    send(data) { messages.push(JSON.parse(data)); }, close() {},
  };
  const ctx = { getWebSockets: () => [], blockConcurrencyWhile: (callback) => { initialized = callback(); }, storage: memoryStorage() };
  const { ClassroomRoom } = loadModule('worker/ClassroomRoom.ts', {
    'cloudflare:workers': { DurableObject: class { constructor(ctx) { this.ctx = ctx; } } },
  }, { Request, Response });
  const room = new ClassroomRoom(ctx, {});
  await initialized;
  await room.webSocketMessage(ws, JSON.stringify({ type: 'player:join', payload: { sessionId: 'root', displayName: 'Admin giả', role: 'admin' } }));
  const self = messages.find((message) => message.type === 'room:snapshot').payload.self;
  assert.equal(self.role, 'member');
  assert.equal(self.id, 'real-guest');
  await room.webSocketMessage(ws, JSON.stringify({ type: 'projector:update', payload: { slideIndex: 99 } }));
  assert.equal(messages.at(-1).type, 'error');
});

test('Real staff login works through backend without any public browser API key', async () => {
  const local = storage();
  const user = { id: 'root', displayName: 'Owner', email: 'owner@example.invalid', role: 'admin', isAnonymous: false, participantType: 'guest' };
  const client = api(async (path) => ({ ok: true, json: async () => path.includes('/api/staff/login')
    ? { user, sessionToken: 'access-1', refreshToken: 'refresh-1', expiresAt: Date.now() + 3600000 }
    : { role: 'admin', displayName: 'Owner' },
  }), local);
  assert.equal((await client.loginStaff(user.email, 'test-password')).role, 'admin');
  assert.equal(client.getSessionToken(), 'access-1');
  assert.equal((await client.getSavedSession()).role, 'admin');
});

test('Failed real login cannot use a demo admin name or password to gain access', async () => {
  const local = storage();
  const client = api(async () => ({ ok: false, json: async () => ({ error: 'Invalid credentials' }) }), local);
  await assert.rejects(client.loginStaff('admin@example.invalid', 'admin123'), /Invalid credentials/);
  assert.equal(local.getItem('lop_hoc_ky_uc_demo_user'), null);
  assert.equal(client.getSessionToken(), '');
});

test('Expired staff access is refreshed before an approval request', async () => {
  const local = storage();
  local.setItem('lop_hoc_session_token', 'expired-access');
  local.setItem('lop_hoc_staff_refresh_token', 'refresh-1');
  local.setItem('lop_hoc_staff_expires_at', '0');
  let refreshed = 0;
  let authorization;
  const client = api(async (path, init) => {
    if (path.includes('/api/staff/refresh')) {
      refreshed++;
      return { ok: true, json: async () => ({ user: { id: 'root', role: 'admin' }, sessionToken: 'access-2', refreshToken: 'refresh-2', expiresAt: Date.now() + 3600000 }) };
    }
    authorization = init.headers.Authorization;
    return { ok: true, json: async () => ({ accounts: [] }) };
  }, local);
  await client.fetchTeacherApplications();
  assert.equal(refreshed, 1);
  assert.equal(authorization, 'Bearer access-2');
  assert.equal(local.getItem('lop_hoc_staff_refresh_token'), 'refresh-2');
});

test('WebSocket reconnect uses the refreshed token instead of the expired original', () => {
  let retry;
  const urls = [];
  class Socket {
    static OPEN = 1; static CONNECTING = 0;
    readyState = 3;
    constructor(url) { urls.push(url); Socket.latest = this; }
    close() {}
  }
  const { multiplayerSocket } = loadModule('src/lib/multiplayerSocket.ts', {
    '../services/api': { getSessionToken: () => 'fresh-token' },
  }, {
    WebSocket: Socket, window: { location: { protocol: 'http:', host: 'localhost:5173' } },
    setTimeout: (callback) => { retry = callback; return 1; }, clearTimeout: () => {},
  });
  multiplayerSocket.connect('classroom_1', 'old-token');
  Socket.latest.onclose({ code: 1006 });
  retry();
  assert.equal(new URL(urls.at(-1)).searchParams.get('token'), 'fresh-token');
  multiplayerSocket.disconnect();
});
