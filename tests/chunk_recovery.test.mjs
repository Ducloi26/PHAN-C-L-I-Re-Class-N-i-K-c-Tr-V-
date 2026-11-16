import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModule } from './helpers/runtime.mjs';

test('A stale deployment reloads once, while offline failures and repeated errors do not loop', () => {
  const listeners = new Map(), values = new Map(); let reloads = 0, prevented = 0, now = 100000;
  const navigator = { onLine: true };
  const { installChunkRecovery } = loadModule('src/lib/chunkRecovery.ts', {}, {
    navigator, Date: class extends Date { static now() { return now; } },
    sessionStorage: { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) },
    window: { location: { reload: () => reloads++ }, addEventListener: (key, fn) => listeners.set(key, fn), removeEventListener: (key) => listeners.delete(key) },
  });
  const cleanup = installChunkRecovery(), error = () => listeners.get('vite:preloadError')({ preventDefault: () => prevented++ });
  error(); assert.equal(reloads, 1); assert.equal(prevented, 1);
  error(); assert.equal(reloads, 1);
  now += 31000; navigator.onLine = false; error(); assert.equal(reloads, 1);
  navigator.onLine = true; error(); assert.equal(reloads, 2);
  cleanup(); assert.equal(listeners.size, 0);
});
