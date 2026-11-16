import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { loadModule } from './helpers/runtime.mjs';

test('The actual overview camera transition stays inside the room and faces the projector', () => {
  const camera = new THREE.PerspectiveCamera(); camera.position.set(-5, 2, 3);
  const effects = []; let tick;
  const { CameraControls } = loadModule('src/components/classroom/CameraControls.tsx', {
    react: { useRef: (value) => ({ current: value }), useEffect: (effect) => effects.push(effect) },
    '@react-three/fiber': { useThree: () => ({ camera }), useFrame: (callback) => { tick = callback; } },
    '@react-three/drei': { OrbitControls: () => null },
  });
  const element = CameraControls({ preset: 'overview' });
  const target = new THREE.Vector3(0, 1.6, -1);
  element.ref.current = { target, update: () => camera.lookAt(target) };
  effects.forEach((effect) => effect());
  for (let i = 0; i < 240; i++) tick();
  // The back wall is at z=5 and the memory board is at z=4.93. The former
  // overview at z=7.8 showed that board from behind after the lerp completed.
  assert.ok(camera.position.z < 4.7 && camera.position.z > 3);
  assert.ok(camera.position.y > 2 && camera.position.y < 5);
  assert.ok(camera.getWorldDirection(new THREE.Vector3()).z < 0);
  assert.ok(target.z < 0);
});

function* nodes(tree) {
  if (Array.isArray(tree)) { for (const child of tree) yield* nodes(child); }
  else if (tree && typeof tree === 'object' && tree.props) { yield tree; yield* nodes(tree.props.children); }
}
const text = (tree) => typeof tree === 'string' ? tree : Array.isArray(tree) ? tree.map(text).join(' ') : tree?.props ? text(tree.props.children) : '';

test('Optical zoom changes the actual camera projection without moving through obstacles', () => {
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(1, 2, 3);
  const position = camera.position.clone();
  const { CameraLens } = loadModule('src/components/classroom/CameraLens.tsx', {
    three: THREE, react: { useEffect: (effect) => effect() }, '@react-three/fiber': { useThree: () => ({ camera }) },
  });
  const fovs = [];
  for (const zoom of [0.5, 1, 2]) {
    CameraLens({ zoom }); fovs.push(camera.getEffectiveFOV());
    const point = new THREE.Vector3(1, 0, -5).project(camera);
    assert.ok(Number.isFinite(point.x)); assert.ok(camera.position.equals(position));
  }
  assert.ok(fovs[0] > 90 && fovs[0] < 95); assert.ok(Math.abs(fovs[1] - 55) < 0.00001); assert.ok(fovs[2] < 30);
});

test('Landscape enters fullscreen before locking orientation and gives usable fallback guidance', async () => {
  const events = [];
  const document = { fullscreenElement: null, documentElement: { requestFullscreen: async () => events.push('fullscreen') } };
  const screen = { orientation: { lock: async (mode) => events.push(mode), unlock: () => events.push('unlock') } };
  const landscape = loadModule('src/lib/landscape.ts', {}, { document, screen });
  assert.match(await landscape.enterLandscape(), /Đã bật/);
  assert.deepEqual(events, ['fullscreen', 'landscape']);
  landscape.unlockOrientation(); assert.equal(events.at(-1), 'unlock');
  screen.orientation.lock = async () => { throw new Error('Unsupported'); };
  assert.match(await landscape.enterLandscape(), /Hãy bật tự xoay/);
  document.documentElement.requestFullscreen = async () => { throw new Error('Denied'); };
  delete screen.orientation;
  assert.match(await landscape.enterLandscape(), /khóa xoay/);
});

test('Camera zoom starts wide on phones and remembers only supported settings', () => {
  let saved = null;
  const { initialCameraZoom } = loadModule('src/lib/cameraZoom.ts', {}, {
    localStorage: { getItem: () => saved }, window: { matchMedia: () => ({ matches: true }) },
  });
  assert.equal(initialCameraZoom(), 0.5);
  saved = '2'; assert.equal(initialCameraZoom(), 2);
  saved = '0'; assert.equal(initialCameraZoom(), 0.5);
});

test('Joystick drag has the same movement strength at small and full control sizes', () => {
  for (const scale of [0.7, 0.819, 1]) {
    const moves = [];
    const { OnScreenMovementController } = loadModule('src/components/classroom/OnScreenMovementController.tsx', {
      react: { useState: (v) => [v, () => {}], useRef: (v) => ({ current: v }), useCallback: (fn) => fn, useEffect() {} },
      'lucide-react': new Proxy({}, { get: () => () => null }),
    });
    const tree = OnScreenMovementController({ onMove: (move) => moves.push(move) });
    const base = [...nodes(tree)].find((node) => node.props.onPointerMove);
    base.ref.current = { getBoundingClientRect: () => ({ left: 20, top: 30, width: 136 * scale, height: 136 * scale }) };
    base.props.onPointerDown({ pointerId: 1, clientX: 20 + (68 + 24) * scale, clientY: 30 + 68 * scale, stopPropagation() {}, currentTarget: { setPointerCapture() {} } });
    assert.equal(moves.at(-1).x, 0.5);
    assert.equal(moves.at(-1).y, 0);
    base.props.onPointerUp({ pointerId: 1, stopPropagation() {}, currentTarget: { releasePointerCapture() {} } });
    assert.equal(moves.at(-1).x, 0); assert.equal(moves.at(-1).y, 0);
  }
});

test('Mobile staff can open projector controls while ordinary viewers cannot', () => {
  const events = [];
  const { MobileMenuModal } = loadModule('src/components/classroom/MobileMenuModal.tsx', {
    react: { useState: (value) => [value, () => {}], useEffect() {} },
    'lucide-react': new Proxy({}, { get: () => () => null }),
    '../../lib/audioManager': { soundManager: { getMuted: () => false, getIsBgmPlaying: () => false } },
  });
  const props = { isOpen: true, isStaff: true, onlineCount: 2, sensitivity: 1, graphicsQuality: 'medium', onClose: () => events.push('close'), onOpenProjectorControls: () => events.push('control') };
  const findControl = (tree) => [...nodes(tree)].find((node) => node.type === 'button' && text(node).includes('Điều khiển máy chiếu'));
  const control = findControl(MobileMenuModal(props)); assert.ok(control);
  control.props.onClick(); assert.deepEqual(events, ['close', 'control']);
  assert.equal(findControl(MobileMenuModal({ ...props, isStaff: false })), undefined);
});
