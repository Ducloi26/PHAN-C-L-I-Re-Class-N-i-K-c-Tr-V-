import { loadModule } from './runtime.mjs';
const { isPositionColliding, resolveKinematicCollision } = loadModule('src/lib/collision.ts');
const step = 0.1;
const key = (x, z) => `${Math.round(x * 10)},${Math.round(z * 10)}`;

// Walkable grid, using the real classroom collision code rather than teleporting
// directly onto a seat. Return points a player can traverse before sitting.
export function seatApproachPath(from, seat) {
  const start = { x: Math.round(from.x * 10) / 10, z: Math.round(from.z * 10) / 10 };
  const queue = [start], parents = new Map([[key(start.x, start.z), null]]);
  let goal;
  for (let i = 0; i < queue.length; i++) {
    const point = queue[i];
    if (Math.hypot(point.x - seat.x, point.z - seat.z) <= 0.9) { goal = point; break; }
    for (const [dx, dz] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
      const next = { x: Math.round((point.x + dx) * 10) / 10, z: Math.round((point.z + dz) * 10) / 10 };
      const id = key(next.x, next.z);
      if (parents.has(id) || isPositionColliding(next.x, next.z)) continue;
      parents.set(id, point); queue.push(next);
    }
  }
  if (!goal) throw new Error(`No walkable approach to ${seat.id}`);
  const path = [];
  for (let point = goal; point; point = parents.get(key(point.x, point.z))) path.push(point);
  path.reverse();
  let previous = from;
  for (const point of path) {
    const moved = resolveKinematicCollision(previous, { x: point.x - previous.x, z: point.z - previous.z });
    if (Math.hypot(moved.x - point.x, moved.z - point.z) > 0.01) throw new Error(`Blocked route to ${seat.id}`);
    previous = point;
  }
  return path;
}
