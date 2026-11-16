import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';

// Production uses the same domain for the SPA, /api and secure /ws. Do not let
// an old local development URL get embedded into the public JavaScript bundle.
const env = { ...process.env, VITE_API_BASE_URL: '', VITE_MULTIPLAYER_SERVER_URL: '' };
for (const args of [
  ['node_modules/typescript/bin/tsc', '-b'],
  ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.worker.json'],
  ['node_modules/vite/bin/vite.js', 'build'],
]) {
  const result = spawnSync(process.execPath, args, { env, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

// The former Pages catch-all conflicts with Workers' built-in SPA routing.
// Keep the source file for Pages users, but omit it from this Worker bundle.
rmSync(new URL('../dist/_redirects', import.meta.url), { force: true });
