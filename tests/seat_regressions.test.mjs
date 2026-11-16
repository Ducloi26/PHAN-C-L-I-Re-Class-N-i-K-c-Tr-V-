import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModule } from './helpers/runtime.mjs';
import { seatApproachPath } from './helpers/seat-paths.mjs';
const { CLASSROOM_SEATS, SEAT_INTERACTION_DISTANCE } = loadModule('src/lib/seatData.ts');
const { getSafeStandPosition, isPositionColliding } = loadModule('src/lib/collision.ts');
const { getSmartAction } = loadModule('src/lib/interactionTargets.ts');

test('A nearby occupied seat does not hide the free neighbouring seat', () => {
  const seat = CLASSROOM_SEATS.find((s) => s.id === 'seat-1');
  const player = { id: 'me', role: 'member', state: 'standing', x: seat.standAnchor.x, z: seat.standAnchor.z };
  const action = getSmartAction(player, [{ id: 'peer', state: 'sitting', seatId: seat.id }]);
  assert.equal(action.type, 'sit'); assert.equal(action.seatInfo.id, 'seat-2');
});

test('Teacher-only seating and the server reach limit also apply to seat prompts', () => {
  assert.notEqual(getSmartAction({ role: 'member', state: 'standing', x: -3, z: -4.55 }, [])?.type, 'sit');
  assert.equal(getSmartAction({ role: 'teacher', state: 'standing', x: -3, z: -4.55 }, [])?.seatInfo.id, 'seat-teacher');
  assert.notEqual(getSmartAction({ role: 'member', state: 'standing', x: -4.35, z: -1.17 }, [], 'sit')?.type, 'sit');
});

test('All 25 seats have collision-free approaches after leaving the teacher chair', () => {
  let from = getSafeStandPosition(CLASSROOM_SEATS[0]);
  for (const seat of CLASSROOM_SEATS) {
    const path = seatApproachPath(from, seat), end = path.at(-1);
    assert.ok(Math.hypot(end.x - seat.x, end.z - seat.z) < SEAT_INTERACTION_DISTANCE);
    assert.ok(!isPositionColliding(end.x, end.z));
    from = getSafeStandPosition(seat); assert.ok(!isPositionColliding(from.x, from.z));
  }
});

function multiplayerFixture() {
  let cursor = 0, effects = []; const slots = [], handlers = new Map(), timers = new Map(), sent = [], alerts = []; let timerId = 0;
  const changed = (a, b) => !a || a.length !== b.length || a.some((v, i) => v !== b[i]);
  const react = {
    useState(initial) { const i = cursor++; slots[i] ??= { value: typeof initial === 'function' ? initial() : initial }; return [slots[i].value, (next) => { slots[i].value = typeof next === 'function' ? next(slots[i].value) : next; }]; },
    useRef(value) { const i = cursor++; return slots[i] ??= { current: value }; },
    useCallback(fn, deps) { const i = cursor++; if (changed(slots[i]?.deps, deps)) slots[i] = { value: fn, deps }; return slots[i].value; },
    useEffect(fn, deps) { const i = cursor++; if (changed(slots[i]?.deps, deps)) effects.push(() => { slots[i]?.cleanup?.(); slots[i] = { deps, cleanup: fn() }; }); },
  };
  const socket = { getStatus: () => 'connected', send: (type, payload) => sent.push({ type, payload }), on: (type, fn) => { handlers.set(type, fn); return () => handlers.delete(type); }, onStatusChange: (fn) => { fn('connected'); return () => {}; }, connect() {}, disconnect() {} };
  const { useMultiplayer } = loadModule('src/hooks/useMultiplayer.ts', { react, '../services/api': { getSessionToken: () => 'qa-token' }, '../lib/avatarPresets': { getDefaultAvatar: () => ({}) }, '../lib/multiplayerSocket': { multiplayerSocket: socket } }, {
    setInterval: () => 0, clearInterval() {}, setTimeout: (fn) => { timers.set(++timerId, fn); return timerId; }, clearTimeout: (id) => timers.delete(id), alert: (message) => alerts.push(message),
  });
  const user = { id: 'me', role: 'teacher', displayName: 'Teacher', participantType: 'guest' };
  const render = () => { cursor = 0; effects = []; const result = useMultiplayer(user); effects.forEach((effect) => effect()); return result; };
  return { render, sent, timers, alerts, emit: (type, data) => handlers.get(type)?.(data) };
}

test('Seat requests flush the latest movement and allow only one pending confirmation', async () => {
  const f = multiplayerFixture(); let state = f.render(); const seat = CLASSROOM_SEATS[1];
  state.updateLocalPlayer((p) => ({ ...p, x: seat.standAnchor.x, z: seat.standAnchor.z })); state = f.render();
  const promise = state.requestSeat(seat);
  assert.equal(f.render().seatRequestPending, true);
  assert.equal(f.sent.at(-2).type, 'player:move'); assert.equal(f.sent.at(-2).payload.x, seat.standAnchor.x);
  assert.equal(f.sent.at(-1).type, 'seat:request');
  assert.equal(await state.requestSeat(CLASSROOM_SEATS[2]), false);
  f.emit('seat:confirmed', { seatId: seat.id }); assert.equal(await promise, true);
  assert.equal(f.render().seatRequestPending, false); assert.equal(f.timers.size, 0);
});

test('Late authoritative seating and standing reconcile the local player after a request timeout', async () => {
  const f = multiplayerFixture(); const seat = CLASSROOM_SEATS[1]; const promise = f.render().requestSeat(seat);
  [...f.timers.values()][0](); assert.equal(await promise, false);
  f.emit('player:moved', { id: 'me', x: seat.x, y: 0, z: seat.z, rotY: seat.rotY });
  f.emit('player:state_updated', { id: 'me', state: 'sitting', seatId: seat.id });
  assert.equal(f.render().localPlayer.seatId, seat.id); assert.equal(f.render().localPlayer.state, 'sitting');
  f.emit('player:state_updated', { id: 'me', state: 'standing', seatId: null });
  assert.equal(f.render().localPlayer.seatId, null); assert.equal(f.render().localPlayer.state, 'standing');
});

test('Holding E does not immediately stand the player up after the seat is confirmed', () => {
  const effects = [], handlers = new Map(); let actions = 0;
  const { LocalPlayerController } = loadModule('src/components/classroom/LocalPlayerController.tsx', {
    react: { useRef: (value) => ({ current: value }), useEffect: (effect) => effects.push(effect) },
    '@react-three/fiber': { useThree: () => ({ camera: {}, gl: { domElement: { addEventListener() {}, removeEventListener() {} } } }), useFrame() {} },
  }, { window: { addEventListener: (name, fn) => handlers.set(name, fn), removeEventListener() {} }, document: { activeElement: null } });
  LocalPlayerController({ player: { x: 0, z: 0, rotY: Math.PI, role: 'member', state: 'standing' }, viewMode: 'third-person', mobileMove: { x: 0, y: 0 }, remotePlayers: [], onNearestSeatChange() {}, onUpdatePlayer() {}, onTriggerSmartAction: () => actions++ });
  const cleanups = effects.map((effect) => effect());
  handlers.get('keydown')({ code: 'KeyE', repeat: false });
  for (let i = 0; i < 10; i++) handlers.get('keydown')({ code: 'KeyE', repeat: true });
  assert.equal(actions, 1);
  handlers.get('keyup')({ code: 'KeyE' }); handlers.get('keydown')({ code: 'KeyE', repeat: false });
  assert.equal(actions, 2); cleanups.forEach((cleanup) => cleanup?.());
});
