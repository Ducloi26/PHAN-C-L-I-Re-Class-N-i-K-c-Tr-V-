import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
const mode = process.argv[2];
const live = JSON.parse(readFileSync('test-results/live-integration.json', 'utf8'));
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:5173';
const before = mode === 'verify' ? JSON.parse(readFileSync('test-results/before-restart.json', 'utf8')) : null;
const roomId = before?.roomId || live.isolatedRoom;
const login = await fetch(`${base}/api/staff/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: process.env.QA_ADMIN_EMAIL, password: process.env.QA_ADMIN_PASSWORD }) });
assert.equal(login.status, 200, 'Admin login failed');
const session = await login.json();
async function read(path) {
  const response = await fetch(`${base}/api/${path}?roomId=${roomId}`, { headers: { Authorization: `Bearer ${session.sessionToken}` } });
  assert.equal(response.status, 200, `Could not read ${path}`);
  return response.json();
}
const [stats, wishes, memories, state] = await Promise.all(['stats', 'wishes', 'memory-marks', 'projector'].map(read));
const { media, server_time, ...projector } = state.projector;
const snapshot = { roomId, stats, wishes: wishes.wishes, memories: memories.marks, projector };
if (mode === 'capture') {
  writeFileSync('test-results/before-restart.json', JSON.stringify(snapshot, null, 2));
  console.log(`Captured durable state in ${roomId}: ${stats.flowers} gifts, ${stats.wishes} wishes, ${stats.memories} memories, projector revision ${projector.revision}`);
} else if (mode === 'verify') {
  assert.deepEqual(snapshot, before, 'Durable state changed after backend restart');
  writeFileSync('test-results/persistence.json', JSON.stringify({ status: 'PASS', checkedAt: new Date().toISOString(), roomId, stats, projectorRevision: projector.revision }, null, 2));
  console.log('PASS Backend restart preserved gifts, counts, wishes, memory cards and projector state exactly.');
} else throw new Error('Use capture or verify');
