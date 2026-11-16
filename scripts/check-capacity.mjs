import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { mkdirSync, writeFileSync } from 'node:fs';
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:5173';
const roomId = `qa-capacity-${Date.now()}`;
const clients = [];
const started = Date.now();
let movementPackets = 0;
const api = async (path, body) => {
  const response = await fetch(`${base}/api/${path}?roomId=${roomId}`, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  assert.equal(response.status, 200, `${path} failed`);
  return response.json();
};
const snapshot = () => api('room-state');
async function waitFor(predicate) {
  const end = Date.now() + 12000;
  while (Date.now() < end) { if (await predicate()) return; await delay(40); }
  throw new Error('Timed out waiting for room state');
}
async function join(token, seat) {
  const url = new URL('/ws', base.replace(/^http/, 'ws')); url.searchParams.set('roomId', roomId); url.searchParams.set('token', token);
  const ws = new WebSocket(url); const events = [];
  ws.addEventListener('message', (event) => events.push(JSON.parse(event.data)));
  const client = { ws, seat, events, send: (type, payload = {}) => ws.send(JSON.stringify({ type, payload })) };
  clients.push(client);
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', () => reject(new Error('WebSocket connection failed')), { once: true }); });
  client.send('player:join', { sessionId: 'ignored', role: 'admin', x: seat.x, z: seat.z });
  await waitFor(() => events.some((event) => event.type === 'room:snapshot'));
  return client;
}
try {
  const seats = [];
  let id = 1;
  for (const row of [-0.5, 1.5, 3.5]) for (const col of [-4, -1.4, 1.4, 4]) for (const side of [-0.35, 0.35]) seats.push({ id: `seat-${id++}`, x: Number((col + side).toFixed(2)), z: Number((row + 0.53).toFixed(2)) });
  const guests = await Promise.all(seats.map((seat, index) => api('guest-session', { displayName: `[QA] Người ${index + 1}`, participantType: 'student' })));
  await Promise.all(guests.map((guest, index) => join(guest.sessionToken, seats[index])));
  const admin = await api('staff/login', { email: process.env.QA_ADMIN_EMAIL, password: process.env.QA_ADMIN_PASSWORD });
  await join(admin.sessionToken, { id: 'seat-teacher', x: -3.5, z: -4.2 });
  assert.equal((await snapshot()).onlineCount, 25);
  console.log('PASS 25 authenticated players are present in one isolated room');
  clients.forEach((client) => client.send('seat:request', { seatId: client.seat.id }));
  await waitFor(() => clients.every((client) => client.events.some((event) => event.type === 'seat:confirmed')));
  assert.equal((await snapshot()).seats.length, 25);
  console.log('PASS All 25 distinct seats are claimed concurrently without collisions');
  clients.forEach((client) => client.send('seat:release'));
  await waitFor(async () => (await snapshot()).seats.length === 0);
  const end = Date.now() + 5000;
  let frame = 0;
  while (Date.now() < end) {
    for (const client of clients) {
      client.send('player:move', { x: client.seat.x + Math.sin(frame / 5) * 0.1, y: 0, z: client.seat.z + 0.39, rotY: frame / 30 });
      movementPackets++;
    }
    frame++; await delay(120);
  }
  const state = await snapshot(); assert.equal(state.onlineCount, 25);
  assert.equal(state.players.every((player) => Number.isFinite(player.x) && Number.isFinite(player.z)), true);
  console.log(`PASS ${movementPackets} movement packets over 5 seconds preserve all 25 players`);
  clients.forEach((client) => client.ws.close(1000, 'Capacity check complete'));
  await waitFor(async () => (await snapshot()).onlineCount === 0);
  assert.equal((await snapshot()).seats.length, 0);
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/capacity.json', JSON.stringify({ status: 'PASS', checkedAt: new Date().toISOString(), isolatedRoom: roomId, clients: 25, atomicSeatClaims: 25, movementPackets, movementDurationSeconds: 5, remainingPlayers: 0, durationMs: Date.now() - started }, null, 2));
  console.log('PASS Closing all clients releases all presence and seat leases');
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { for (const client of clients) try { client.ws.close(1000, 'QA cleanup'); } catch {} }
