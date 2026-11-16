import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';

const base = process.env.QA_PRODUCTION_URL || 'http://127.0.0.1:8788';
const origin = process.env.QA_PRODUCTION_ORIGIN || (new URL(base).protocol === 'https:' ? new URL(base).origin : 'https://trianttn.ducloiphan.cyou');
const roomId = `qa-deploy-${Date.now()}`;
const results = [];
const step = async (name, action) => { await action(); results.push({ name, status: 'PASS' }); console.log(`PASS ${name}`); };
let socket;
try {
  await step('SPA deep links return the built application', async () => {
    for (const path of ['/', '/login', '/classroom', '/admin']) {
      const response = await fetch(`${base}${path}`, { headers: { 'Sec-Fetch-Mode': 'navigate' } });
      assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /text\/html/); assert.match(await response.text(), /id="root"/);
    }
  });
  await step('API routing bypasses SPA even for navigation requests', async () => {
    const response = await fetch(`${base}/api/health`, { headers: { 'Sec-Fetch-Mode': 'navigate' } });
    assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /application\/json/); assert.equal((await response.json()).ok, true);
    const missing = await fetch(`${base}/api/not-a-real-endpoint`, { headers: { 'Sec-Fetch-Mode': 'navigate' } });
    assert.equal(missing.status, 404); assert.ok((await missing.json()).error);
    assert.equal((await fetch(`${base}/ws`)).status, 426);
  });
  await step('Entry CSS and JavaScript have the correct MIME types', async () => {
    const html = await (await fetch(`${base}/`)).text();
    assert.doesNotMatch(html, /modulepreload[^>]+(?:three-vendor|ClassroomPage|AvatarPreview3D)/, 'The landing page must not preload the 3D classroom');
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.(?:css|js))"/g)].map((match) => match[1]);
    assert.ok(assets.some((path) => path.endsWith('.css')));
    assert.ok(assets.some((path) => path.endsWith('.js')));
    for (const path of assets) {
      const response = await fetch(`${base}${path}`);
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), path.endsWith('.css') ? /text\/css/ : /(?:application|text)\/javascript/);
      assert.doesNotMatch((await response.text()).slice(0, 100), /<!doctype html/i);
    }
  });
  await step('Missing assets return 404 without cacheable HTML', async () => {
    for (const path of ['/assets/qa-missing.css', '/assets/qa-missing.js', '/media/qa-missing.png']) {
      const response = await fetch(`${base}${path}`, { headers: { 'Sec-Fetch-Mode': 'cors', 'Sec-Fetch-Dest': path.endsWith('.css') ? 'style' : 'script' } });
      assert.equal(response.status, 404);
      assert.match(response.headers.get('cache-control'), /no-store/);
      assert.match(response.headers.get('content-type'), /application\/json/);
    }
  });
  await step('Static slides and map are served as images', async () => {
    for (const path of ['/media/slide1_ngay_tro_ve.svg', '/media/slide2_hanh_trinh_tri_thuc.svg', '/media/slide3_loi_tri_an.svg', '/media/so-do-dai-hoc-tay-nguyen.jpg']) {
      const response = await fetch(`${base}${path}`); assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /^image\//); assert.ok((await response.arrayBuffer()).byteLength > 100);
    }
  });
  await step('Background music is served as audio instead of SPA HTML', async () => {
    const response = await fetch(`${base}/media/tri-an-background-v1.mp3`, { headers: { Range: 'bytes=0-63' } });
    assert.ok([200, 206].includes(response.status));
    assert.match(response.headers.get('content-type'), /^audio\//);
    const bytes = new Uint8Array(await response.arrayBuffer());
    assert.ok(bytes.length >= 32);
    assert.ok(new TextDecoder().decode(bytes.slice(0, 3)) === 'ID3' || bytes[0] === 0xff);
  });
  await step('Memory photographs, coding illustrations and QR are served as images', async () => {
    for (const name of ['club-gathering.webp', 'classroom-friends.webp', 'together.webp', 'coding-screen.webp', 'coding-laptop.webp', 'connect-qr.png']) {
      const response = await fetch(`${base}/media/memories/${name}`, { headers: { Range: 'bytes=0-127' } });
      assert.ok([200, 206].includes(response.status)); assert.match(response.headers.get('content-type'), /^image\//);
      assert.ok((await response.arrayBuffer()).byteLength > 32);
    }
  });
  await step('Production origin is accepted and unrelated origins are rejected', async () => {
    assert.equal((await fetch(`${base}/api/health`, { headers: { Origin: origin } })).status, 200);
    assert.equal((await fetch(`${base}/api/health`, { headers: { Origin: 'https://unrelated.example' } })).status, 403);
  });
  await step('Authenticated WebSocket joins a separate room through the same server', async () => {
    const response = await fetch(`${base}/api/guest-session?roomId=${roomId}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ displayName: 'Kiểm tra triển khai', participantType: 'guest' }) });
    assert.equal(response.status, 200); const guest = await response.json();
    const url = new URL('/ws', base.replace(/^http/, 'ws')); url.searchParams.set('roomId', roomId); url.searchParams.set('token', guest.sessionToken);
    socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('WebSocket snapshot timed out')), 10000);
      socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('WebSocket failed')); });
      socket.addEventListener('open', () => socket.send(JSON.stringify({ type: 'player:join', payload: {} })));
      socket.addEventListener('message', ({ data }) => {
        const event = JSON.parse(data);
        if (event.type !== 'room:snapshot') return;
        try { assert.equal(event.payload.self.id, guest.guestSessionId); assert.ok(event.payload.projector); clearTimeout(timer); resolve(); }
        catch (error) { clearTimeout(timer); reject(error); }
      });
    });
  });
} catch (error) { results.push({ name: 'Production smoke check', status: 'FAIL', error: error.message }); console.error(error.message); process.exitCode = 1; }
finally {
  socket?.close(1000, 'Deploy smoke check finished');
  mkdirSync('test-results', { recursive: true });
  writeFileSync('test-results/production-preview.json', JSON.stringify({ checkedAt: new Date().toISOString(), base, roomId, results }, null, 2));
}
