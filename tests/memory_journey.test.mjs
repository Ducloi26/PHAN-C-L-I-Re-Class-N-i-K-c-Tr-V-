import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModule } from './helpers/runtime.mjs';
const { journeyFrame, portalDuration, MEMORY_SCENES, MEMORY_DURATION_MS, journeyDuration, vortexCardPose } = loadModule('src/lib/memoryJourney.ts');

function* nodes(tree) {
  if (Array.isArray(tree)) { for (const child of tree) yield* nodes(child); }
  else if (tree?.props) { yield tree; yield* nodes(tree.props.children); }
}
const text = (tree) => typeof tree === 'string' ? tree : Array.isArray(tree) ? tree.map(text).join(' ') : tree?.props ? text(tree.props.children) : '';

test('The portal leads through every unique photograph then holds on the QR ending', () => {
  assert.equal(journeyFrame(0).phase, 'portal');
  assert.equal(portalDuration(true), 800);
  assert.equal(MEMORY_DURATION_MS, 1000);
  assert.equal(journeyFrame(799).phase, 'portal');
  assert.equal(journeyFrame(1799).index, 0);
  assert.equal(journeyFrame(1800).index, 1);
  assert.equal(journeyDuration(true), 6500);
  for (let i = 0; i < MEMORY_SCENES.length; i++) {
    const frame = journeyFrame(portalDuration(true) + i * MEMORY_DURATION_MS);
    assert.equal(frame.phase, 'memory'); assert.equal(frame.index, i); assert.equal(frame.progress, 0);
  }
  assert.equal(new Set(MEMORY_SCENES.map((scene) => scene.image)).size, 5);
  assert.equal(MEMORY_SCENES.filter((scene) => scene.kind === 'coding').length, 2);
  assert.equal(journeyFrame(journeyDuration(true)).phase, 'end');
  assert.equal(journeyFrame(9999999).phase, 'end');
  assert.equal(journeyFrame(-100).phase, 'portal');
  assert.equal(journeyFrame(500, false).phase, 'memory');
});

function fixture() {
  const slots = []; let cursor = 0, effects = [], time = 1000, id = 0; const intervals = new Map(), listeners = new Map();
  const document = { hidden: false, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) };
  const changed = (a, b) => !a || a.length !== b.length || a.some((value, i) => value !== b[i]);
  const react = {
    useState(initial) { const i = cursor++; slots[i] ??= { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, (next) => { slots[i].value = typeof next === 'function' ? next(slots[i].value) : next; }]; },
    useRef(value) { const i = cursor++; return slots[i] ??= { current: value }; },
    useEffect(effect, deps) { const i = cursor++; if (changed(slots[i]?.deps, deps)) effects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: effect() }; }); },
  };
  const { MemoryJourney } = loadModule('src/components/welcome/MemoryJourney.tsx', { react, './TimePortal': { TimePortal: () => null }, 'lucide-react': new Proxy({}, { get: () => () => null }) }, {
    window: { scrollTo() {} }, document, Date: class extends Date { static now() { return time; } },
    setInterval: (fn) => { intervals.set(++id, fn); return id; }, clearInterval: (key) => intervals.delete(key),
  });
  let tree, motion = true;
  const events = [];
  const render = () => { cursor = 0; effects = []; tree = MemoryJourney({ effects: motion, onEnter: () => events.push('enter'), onComplete() {}, onReadStory() {}, onReplay: () => events.push('replay') }); effects.forEach((effect) => effect()); return tree; };
  const advance = (ms) => { for (let i = 0; i < ms / 100; i++) { time += 100; [...intervals.values()].forEach((fn) => fn()); render(); } };
  const click = (label) => { const button = [...nodes(tree)].find((node) => node.type === 'button' && (node.props['aria-label'] === label || text(node).includes(label))); assert.ok(button, label); button.props.onClick(); render(); };
  render(); return { render, advance, click, tree: () => tree, intervals, events, setMotion: (value) => { motion = value; render(); }, hide(value) { document.hidden = value; listeners.get('visibilitychange')?.(); } };
}

const currentCard = (f) => [...nodes(f.tree())].find((node) => node.type === 'button' && node.props.className?.includes('is-current'));

test('Pause and hidden tabs freeze the actual journey; turning effects off does not skip an image', () => {
  const f = fixture(); f.advance(1200); assert.ok(text(currentCard(f)).includes('Ngày chúng ta gặp nhau.'));
  f.click('Giữ ảnh kỷ niệm: Ngày chúng ta gặp nhau.');
  const pose = currentCard(f).props.style.transform;
  f.advance(10000); assert.equal(currentCard(f).props.style.transform, pose);
  f.click('Tiếp tục hành trình'); f.hide(true); f.advance(10000); f.hide(false);
  assert.ok(text(currentCard(f)).includes('Ngày chúng ta gặp nhau.'));
  f.setMotion(false); assert.ok(text(currentCard(f)).includes('Ngày chúng ta gặp nhau.'));
  f.advance(1000); assert.ok(text(currentCard(f)).includes('Từng dòng code. Từng bài học.'));
  f.click('Đến QR'); assert.equal(f.intervals.size, 0);
  const qr = [...nodes(f.tree())].find((node) => node.type === 'img' && node.props.src.endsWith('connect-qr.png'));
  assert.ok(qr); f.advance(20000); assert.ok(text(f.tree()).includes('Lớp mình vẫn ở đây nhé.'));
});

test('All photographs pass through the vortex automatically; entry and QR need no next/swipe action', () => {
  const f = fixture(), seen = new Set();
  assert.ok(!text(f.tree()).includes('Kỷ niệm tiếp theo'));
  f.click('Vào lớp ngay'); assert.deepEqual(f.events, ['enter']);
  for (let i = 0; i < 65; i++) {
    f.advance(100); const card = currentCard(f);
    if (card) seen.add(card.props['aria-label']);
  }
  assert.equal(seen.size, 5); assert.equal(f.intervals.size, 0);
  assert.ok(text(f.tree()).includes('Lớp mình vẫn ở đây nhé.'));
  f.click('Vào lớp ngay'); assert.deepEqual(f.events, ['enter', 'enter']);
  f.click('Xem lại vòng xoáy'); assert.equal(f.events.at(-1), 'replay'); assert.equal(f.intervals.size, 1);
});

test('Spiral positions remain finite, bounded in opacity and finish safely during the last photo tail', () => {
  for (let time = 0; time <= journeyDuration(true); time += 50) {
    for (let index = 0; index < MEMORY_SCENES.length; index++) {
      const pose = vortexCardPose(time, index);
      for (const key of ['x', 'y', 'scale', 'rotation', 'opacity']) assert.ok(Number.isFinite(pose[key]));
      assert.ok(pose.opacity >= 0 && pose.opacity <= 1);
    }
    assert.ok(journeyFrame(time).index < MEMORY_SCENES.length);
  }
  assert.equal(vortexCardPose(NaN, 0).visible, false);
  assert.equal(vortexCardPose(0, 0).visible, false);
});

test('The portal cancels rendering in hidden tabs and disconnects its observer on unmount', () => {
  const raf = new Map(), listeners = new Map(); let id = 0, cleanup, disconnected = false;
  const context = new Proxy({}, { get: (_target, key) => key === 'createRadialGradient' ? () => ({ addColorStop() {} }) : () => {} });
  const canvas = { getContext: () => context, getBoundingClientRect: () => ({ width: 390, height: 600 }) };
  const document = { hidden: false, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: (name) => listeners.delete(name) };
  const { TimePortal } = loadModule('src/components/welcome/TimePortal.tsx', { react: { useRef: (value) => ({ current: value === null ? canvas : value }), useEffect: (fn) => { cleanup = fn(); } } }, {
    window: { innerWidth: 390, innerHeight: 844, devicePixelRatio: 2 }, document,
    ResizeObserver: class { observe() {} disconnect() { disconnected = true; } },
    requestAnimationFrame: (fn) => { raf.set(++id, fn); return id; }, cancelAnimationFrame: (key) => raf.delete(key),
  });
  TimePortal({ effects: true, paused: false, travelling: true }); assert.equal(raf.size, 1);
  document.hidden = true; listeners.get('visibilitychange')(); assert.equal(raf.size, 0);
  document.hidden = false; listeners.get('visibilitychange')(); assert.equal(raf.size, 1);
  cleanup(); assert.equal(raf.size, 0); assert.equal(disconnected, true);
});
