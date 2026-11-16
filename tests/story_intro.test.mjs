import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModule } from './helpers/runtime.mjs';

function* nodes(tree) {
  if (Array.isArray(tree)) { for (const child of tree) yield* nodes(child); }
  else if (tree && typeof tree === 'object' && tree.props) { yield tree; yield* nodes(tree.props.children); }
}
const text = (tree) => typeof tree === 'string' ? tree : Array.isArray(tree) ? tree.map(text).join(' ') : tree?.props ? text(tree.props.children) : '';
function fixture(reduced = false) {
  const values = []; const refs = []; let stateIndex = 0, refIndex = 0;
  const events = []; const effects = []; const listeners = new Map();
  const pending = new Map(), bursts = []; let timerId = 0;
  let firstRender = true;
  const soundManager = { getMuted: () => false, getBgmEnabled: () => true, getBgmStarting: () => false, subscribe: () => () => {}, getIsBgmPlaying: () => false, startBgm: () => events.push('music'), restartBgm: () => events.push('restart-music'), stopBgm: () => events.push('stop'), playBellSound: () => events.push('bell'), setMuted: (v) => events.push(['muted', v]) };
  const { StoryIntro } = loadModule('src/components/welcome/StoryIntro.tsx', {
    react: {
      useState: (initial) => { const i = stateIndex++; if (!(i in values)) values[i] = typeof initial === 'function' ? initial() : initial; return [values[i], (v) => { values[i] = typeof v === 'function' ? v(values[i]) : v; }]; },
      useRef: (initial) => refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }),
      useEffect: (effect, deps) => { if (firstRender && !deps.length) effects.push(effect); },
    },
    'react-router-dom': { Link: 'a' }, 'canvas-confetti': { default: { create: () => { events.push('create-confetti'); const fire = (options) => { events.push('fire'); bursts.push(options); }; fire.reset = () => events.push('reset-confetti'); return fire; } } },
    'lucide-react': new Proxy({}, { get: () => () => null }), '../../lib/audioManager': { soundManager },
    './MemoryJourney': { MemoryJourney: () => null },
  }, {
    window: { innerWidth: 390, innerHeight: 844, matchMedia: () => ({ matches: reduced }) },
    localStorage: { getItem: () => null, setItem() {} },
    document: { hidden: false, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) },
    setTimeout: (fn) => { pending.set(++timerId, fn); return timerId; }, clearTimeout: (id) => pending.delete(id),
  });
  let tree;
  const render = () => { stateIndex = 0; refIndex = 0; tree = StoryIntro({ onFinish: () => events.push('finish') }); firstRender = false; return tree; };
  const click = (label) => { const button = [...nodes(tree)].find((n) => n.type === 'button' && (n.props['aria-label'] === label || text(n).includes(label))); assert.ok(button, label); button.props.onClick(); render(); };
  render(); return { events, bursts, pending, render, click, tree: () => tree, mount: () => { const cleanups = effects.map((effect) => effect()); return () => cleanups.forEach((cleanup) => cleanup?.()); } };
}

test('The story waits for a gesture, introduces real features, and allows immediate skip', () => {
  const f = fixture(); assert.deepEqual(f.events, []);
  f.click('Bỏ qua'); assert.deepEqual(f.events, ['finish']);
  f.click('Trở về lớp học'); assert.equal(f.events.at(-1), 'restart-music');
  const journey = [...nodes(f.tree())].find((node) => node.props.onReadStory);
  assert.ok(journey); journey.props.onReadStory(); f.render();
  assert.match(text(f.tree()), /chưa thể trở về/);
  f.click('Tiếp câu chuyện'); f.click('Tiếp câu chuyện');
  assert.match(text(f.tree()), /tiếng chuông vẫn đợi/);
  f.click('Khám phá lớp học');
  for (const feature of ['Gửi một đóa hoa', 'Viết điều chưa nói', 'Để lại một dấu ấn', 'Cùng xem, cùng nhớ', 'Mang một khoảnh khắc về']) assert.ok(text(f.tree()).includes(feature));
  f.click('Chọn nhân vật & vào lớp'); assert.equal(f.events.at(-1), 'finish');
});

test('Reduced motion defaults to no fireworks; intro unmount does not stop shared music', () => {
  const f = fixture(true); const cleanup = f.mount();
  assert.equal(f.tree().props['data-effects'], 'off');
  f.click('Tắt nhạc mở đầu'); assert.ok(f.events.includes('stop'));
  const musicBefore = f.events.filter((e) => e === 'music').length;
  f.click('Trở về lớp học'); assert.equal(f.events.filter((e) => e === 'music').length, musicBefore);
  assert.ok(!f.events.includes('create-confetti'));
  const stops = f.events.filter((e) => e === 'stop').length;
  cleanup(); assert.equal(f.events.filter((e) => e === 'stop').length, stops);
});

test('Mobile fireworks stay bounded and disabling effects cancels every queued burst', () => {
  const f = fixture();
  const canvas = [...nodes(f.tree())].find((node) => node.type === 'canvas'); canvas.ref.current = {};
  f.click('Bắn pháo hoa');
  assert.equal(f.bursts.length, 2); assert.ok(f.pending.size <= 3);
  assert.ok(f.bursts.every((burst) => burst.particleCount <= 22));
  assert.ok(f.bursts.some((burst) => burst.shapes.includes('star')));
  f.click('Tắt hiệu ứng mở đầu'); assert.equal(f.pending.size, 0); assert.ok(f.events.includes('reset-confetti'));
  const count = f.bursts.length;
  f.tree().props.onClick({ detail: 1, clientX: 100, clientY: 100 });
  assert.equal(f.bursts.length, count);
});
