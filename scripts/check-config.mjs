import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
const legacy = `e30.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.qa-signature`;
const results = [];
for (const [name, key] of [['secret API key', 'sb_secret_qa_dummy_value'], ['legacy service-role JWT', legacy]]) {
  const child = spawnSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], {
    encoding: 'utf8', env: { ...process.env, VITE_SUPABASE_PUBLISHABLE_KEY: key },
  });
  assert.notEqual(child.status, 0, `Vite must reject ${name}`);
  assert.match(child.stdout + child.stderr, /VITE_/);
  results.push({ name, status: 'PASS' });
  console.log(`PASS Build rejects ${name} in frontend configuration`);
}
mkdirSync('test-results', { recursive: true });
writeFileSync('test-results/config-safety.json', JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
