import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:5173';
const results = [];
async function check(name, path, body, expected, token, raw = false) {
  const response = await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: raw ? body : JSON.stringify(body) });
  assert.equal(response.status, expected, name);
  results.push({ name, status: 'PASS', httpStatus: response.status }); console.log(`PASS ${name}`);
}
await check('Malformed JSON is rejected', '/api/guest-session', '{', 400, undefined, true);
await check('Oversized payload is rejected', '/api/guest-session', 'x'.repeat(17000), 413, undefined, true);
await check('Array payload is rejected', '/api/guest-session', [], 400);
const applicant = { email: 'qa-validation@example.invalid', password: 'not-used', displayName: 'QA validation' };
await check('Invalid teacher email is rejected before account creation', '/api/teacher-registration', { ...applicant, email: 'invalid' }, 400);
await check('Short teacher name is rejected before account creation', '/api/teacher-registration', { ...applicant, displayName: 'A' }, 400);
await check('Weak teacher password is rejected before account creation', '/api/teacher-registration', applicant, 400);
const avatarResponse = await fetch(`${base}/api/guest-session`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: '[QA] Avatar', role: 'admin', avatar: { presetId: '__proto__', hairColor: {}, outfitColor: '<script>', role: 'admin' } }) });
assert.equal(avatarResponse.status, 200);
const avatarSession = await avatarResponse.json();
assert.equal(avatarSession.player.role, 'member'); assert.match(avatarSession.player.avatar.outfitColor, /^#[0-9a-f]{6}$/i);
results.push({ name: 'Guest appearance is normalized without privilege escalation', status: 'PASS' });
console.log('PASS Guest appearance is normalized without privilege escalation');
const sessionResponse = await fetch(`${base}/api/staff/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: process.env.QA_ADMIN_EMAIL, password: process.env.QA_ADMIN_PASSWORD }) });
assert.equal(sessionResponse.status, 200);
const session = await sessionResponse.json();
for (const [status, expected, name] of [['admin', 400, 'Approval cannot grant administrator access'], ['approved', 403, 'Teacher approval cannot modify the admin account']]) {
  const response = await fetch(`${base}/api/admin/teachers/${session.user.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.sessionToken}` }, body: JSON.stringify({ status }) });
  assert.equal(response.status, expected); results.push({ name, status: 'PASS', httpStatus: expected }); console.log(`PASS ${name}`);
}
mkdirSync('test-results', { recursive: true });
writeFileSync('test-results/validation.json', JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
