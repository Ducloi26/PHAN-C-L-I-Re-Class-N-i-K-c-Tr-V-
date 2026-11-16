import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModule } from './helpers/runtime.mjs';

test('The shared soundtrack survives route transitions and does not double-toggle audio buttons', () => {
  const calls = [], listeners = new Map(); let pathname = '/'; let cleanup;
  const document = { hidden: false, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) };
  const { BackgroundSoundtrack } = loadModule('src/components/BackgroundSoundtrack.tsx', {
    react: { useEffect: (effect) => { cleanup = effect(); } },
    'react-router-dom': { useLocation: () => ({ pathname }) },
    '../lib/audioManager': { soundManager: { resumeBgm: (existing) => calls.push(['resume', existing]), pauseBgm: () => calls.push(['pause']) } },
  }, { document });
  BackgroundSoundtrack(); assert.deepEqual(calls, [['resume', true]]);
  listeners.get('click')({ target: { closest: () => null } }); assert.deepEqual(calls.at(-1), ['resume', undefined]);
  const count = calls.length;
  listeners.get('click')({ target: { closest: () => ({}) } }); assert.equal(calls.length, count);
  cleanup(); pathname = '/classroom'; BackgroundSoundtrack(); assert.ok(!calls.some(([name]) => name === 'pause'));
  document.hidden = true; listeners.get('visibilitychange')(); assert.deepEqual(calls.at(-1), ['pause']);
  document.hidden = false; listeners.get('visibilitychange')(); assert.deepEqual(calls.at(-1), ['resume', true]);
  cleanup(); pathname = '/login'; BackgroundSoundtrack(); assert.deepEqual(calls.at(-1), ['pause']); assert.equal(listeners.size, 0);
});
