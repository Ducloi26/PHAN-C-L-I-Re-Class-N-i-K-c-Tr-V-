import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModule } from './helpers/runtime.mjs';

const worker = loadModule('worker/index.ts', { './ClassroomRoom': { ClassroomRoom: class {} } }).default;
test('SPA routes fetch the versioned shell; missing resources never receive HTML', async () => {
  const calls = [];
  const env = { ASSETS: { fetch: async (request) => {
    calls.push([new URL(request.url).pathname, request.method]);
    return new Response(request.method === 'HEAD' ? null : '<html><div id="root"></div></html>', { headers: { 'Content-Type': 'text/html', 'Cache-Control': 'public, max-age=31536000, immutable' } });
  } } };
  for (const path of ['/', '/login', '/classroom', '/admin']) {
    for (const method of ['GET', 'HEAD']) {
      const response = await worker.fetch(new Request(`https://app.example${path}`, { method }), env);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /text\/html/);
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
  }
  assert.equal(calls.length, 8); assert.ok(calls.every(([path]) => path === '/'));
  for (const path of ['/assets/missing.css', '/assets/missing.js', '/media/missing.png', '/api/missing', '/other']) {
    const response = await worker.fetch(new Request(`https://app.example${path}`), env);
    assert.equal(response.status, 404); assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.match(response.headers.get('content-type'), /application\/json/);
  }
  assert.equal(calls.length, 8);
});
