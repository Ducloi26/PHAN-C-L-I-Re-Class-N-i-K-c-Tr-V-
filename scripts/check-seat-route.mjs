import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { mkdirSync, writeFileSync } from 'node:fs';
import { loadModule } from '../tests/helpers/runtime.mjs';
import { seatApproachPath } from '../tests/helpers/seat-paths.mjs';
const { CLASSROOM_SEATS } = loadModule('src/lib/seatData.ts');
const { getSafeStandPosition } = loadModule('src/lib/collision.ts');
const base = process.env.QA_BASE_URL || 'https://trianttn.ducloiphan.cyou';
const roomId = process.env.QA_SEAT_ROOM_ID || `qa-seat-route-${Date.now()}`;
if (!roomId.startsWith('qa-')) throw new Error('This check must use a separate qa- room.');
const clients = [], results = []; let movementSteps = 0;
const api = async (path, method = 'GET', input, token) => {
  const response = await fetch(`${base}/api/${path}?roomId=${roomId}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(input ? { body: JSON.stringify(input) } : {}) });
  assert.equal(response.status, 200, `${path}: HTTP ${response.status}`); return response.json();
};
async function until(predicate) {
  const deadline = Date.now() + 7000;
  while (Date.now() < deadline) { const value = await predicate(); if (value) return value; await delay(20); }
  throw new Error('Timed out waiting for seat acknowledgement');
}
async function join(token, point) {
  const url = new URL('/ws', base.replace(/^http/, 'ws')); url.searchParams.set('roomId', roomId); url.searchParams.set('token', token);
  const ws = new WebSocket(url); const client = { ws, events: [], position: point, state: 'standing', id: '', send: (type, payload = {}) => ws.send(JSON.stringify({ type, payload })) };
  clients.push(client);
  ws.addEventListener('message', ({ data }) => {
    const event = JSON.parse(data); client.events.push(event);
    if (event.type === 'room:snapshot') { client.id = event.payload.self.id; client.position = event.payload.self; }
    if (event.type === 'player:moved' && event.payload.id === client.id) client.position = event.payload;
    if (event.type === 'player:state_updated' && event.payload.id === client.id) client.state = event.payload.state;
  });
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
  client.send('player:join', { x: point.x, z: point.z }); await until(() => client.id); return client;
}
function walk(client, seat) {
  const path = seatApproachPath(client.position, seat);
  for (const point of path) { client.send('player:move', { ...point, y: 0, rotY: 0 }); movementSteps++; }
  client.position = path.at(-1);
}
async function request(client, seatId, expected = 'seat:confirmed') {
  const index = client.events.length; client.send('seat:request', { seatId });
  const event = await until(() => client.events.slice(index).find((e) => ['seat:confirmed', 'seat:rejected'].includes(e.type) && e.payload.seatId === seatId));
  assert.equal(event.type, expected, `${seatId}: ${event.payload.reason || event.type}`);
  if (expected === 'seat:confirmed') await until(() => client.state === 'sitting');
}
async function stand(client) { client.send('seat:release'); await until(() => client.state === 'standing'); }
try {
  const admin = await api('staff/login', 'POST', { email: process.env.QA_ADMIN_EMAIL, password: process.env.QA_ADMIN_PASSWORD });
  const actor = await join(admin.sessionToken, getSafeStandPosition(CLASSROOM_SEATS[0]));
  for (const seat of CLASSROOM_SEATS) {
    walk(actor, seat); await request(actor, seat.id); await stand(actor);
    const state = await api('room-state'); assert.equal(state.seats.length, 0);
    results.push({ seatId: seat.id, name: seat.name, status: 'PASS' });
  }
  console.log('PASS Walked from the teacher area and sat/stood at all 25 seats sequentially');
  const guest = await api('guest-session', 'POST', { displayName: '[QA] Ghế bên cạnh', participantType: 'student' });
  const peer = await join(guest.sessionToken, CLASSROOM_SEATS[1].standAnchor);
  await request(peer, 'seat-1'); walk(actor, CLASSROOM_SEATS[1]); await request(actor, 'seat-1', 'seat:rejected');
  walk(actor, CLASSROOM_SEATS[2]); await request(actor, 'seat-2');
  assert.equal((await api('room-state')).seats.length, 2); await stand(actor); await stand(peer);
  console.log('PASS An occupied seat rejects a second player while the neighbouring seat remains usable');
  walk(peer, CLASSROOM_SEATS[0]); await request(peer, 'seat-teacher', 'seat:rejected');
  console.log('PASS Students cannot occupy the teacher chair');
  // Leave a video in this isolated room for the browser entry/overlay check.
  const before = (await api('projector')).projector;
  await api('projector', 'PATCH', { youtube_url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE', expected_revision: before.revision }, admin.sessionToken);
  clients.forEach((client) => client.ws.close(1000, 'Seat QA complete'));
  await until(async () => (await api('room-state')).onlineCount === 0);
  assert.equal((await api('room-state')).seats.length, 0);
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/seat-route.json', JSON.stringify({ checkedAt: new Date().toISOString(), base, roomId, status: 'PASS', movementSteps, seats: results, occupiedNeighbour: 'PASS', teacherPermission: 'PASS', projectorSeededForEntryCheck: true, remainingPlayers: 0, remainingSeats: 0 }, null, 2));
  console.log(`PASS Cleanup left zero players/seats; video test room: ${roomId}`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { clients.forEach((client) => { try { client.ws.close(1000, 'QA cleanup'); } catch {} }); }
