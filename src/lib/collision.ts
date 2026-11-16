import * as THREE from 'three';
import { SeatInfo } from '../types';

export interface ColliderAABB {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY?: number;
  maxY?: number;
}

// Classroom boundaries (room inner walkable area)
export const ROOM_BOUNDS = {
  minX: -6.65,
  maxX: 6.65,
  minZ: -4.75,
  maxZ: 4.75,
};

// Desk & bench grid setup
const DESK_ROWS = [-0.5, 1.5, 3.5];
const DESK_COLS = [-4.0, -1.4, 1.4, 4.0];

export const CLASSROOM_COLLIDERS: ColliderAABB[] = [
  // 1. Teacher Table & Desk area
  {
    id: 'teacher-table',
    minX: -4.45,
    maxX: -2.55,
    minZ: -4.10,
    maxZ: -3.10,
    minY: 0,
    maxY: 0.85,
  },
  {
    id: 'teacher-chair',
    minX: -3.80,
    maxX: -3.20,
    minZ: -4.45,
    maxZ: -3.95,
    minY: 0,
    maxY: 0.85,
  },
];

// 2. Student Desks and Benches
DESK_ROWS.forEach((rowZ, rIdx) => {
  DESK_COLS.forEach((colX, cIdx) => {
    // Desk Top (width 1.5m, depth 0.60m)
    CLASSROOM_COLLIDERS.push({
      id: `desk-${rIdx}-${cIdx}`,
      minX: colX - 0.75,
      maxX: colX + 0.75,
      minZ: rowZ - 0.30,
      maxZ: rowZ + 0.30,
      minY: 0,
      maxY: 0.78,
    });

    // Bench / Chair (width 1.4m, depth 0.32m, offset +0.52m from desk center)
    CLASSROOM_COLLIDERS.push({
      id: `bench-${rIdx}-${cIdx}`,
      minX: colX - 0.70,
      maxX: colX + 0.70,
      minZ: rowZ + 0.38,
      maxZ: rowZ + 0.68,
      minY: 0,
      maxY: 0.75,
    });
  });
});

/**
 * Circle vs AABB collision detection & resolution
 * Character radius: ~0.20m (human body width 0.40m)
 */
export function resolveKinematicCollision(
  currentPos: { x: number; z: number },
  displacement: { x: number; z: number },
  radius = 0.20
): { x: number; z: number; collided: boolean } {
  const totalDist = Math.hypot(displacement.x, displacement.z);
  if (totalDist === 0) return { x: currentPos.x, z: currentPos.z, collided: false };

  // Sub-stepping to prevent tunnelling even at low FPS
  const maxStepSize = 0.04; // 4cm per sub-step
  const steps = Math.ceil(totalDist / maxStepSize);
  const stepDx = displacement.x / steps;
  const stepDz = displacement.z / steps;

  let posX = currentPos.x;
  let posZ = currentPos.z;
  let didCollide = false;

  for (let s = 0; s < steps; s++) {
    // 1. Move along X
    const testX = posX + stepDx;
    let blockedX = false;

    // Room boundaries check X
    if (testX - radius < ROOM_BOUNDS.minX) {
      posX = ROOM_BOUNDS.minX + radius;
      blockedX = true;
      didCollide = true;
    } else if (testX + radius > ROOM_BOUNDS.maxX) {
      posX = ROOM_BOUNDS.maxX - radius;
      blockedX = true;
      didCollide = true;
    } else {
      // Check obstacles
      for (const box of CLASSROOM_COLLIDERS) {
        if (circleIntersectsAABB(testX, posZ, radius, box)) {
          // Slide along Y-axis of collision: stop X movement, snap outside
          if (stepDx > 0) {
            posX = box.minX - radius;
          } else if (stepDx < 0) {
            posX = box.maxX + radius;
          }
          blockedX = true;
          didCollide = true;
          break;
        }
      }
      if (!blockedX) {
        posX = testX;
      }
    }

    // 2. Move along Z
    const testZ = posZ + stepDz;
    let blockedZ = false;

    // Room boundaries check Z
    if (testZ - radius < ROOM_BOUNDS.minZ) {
      posZ = ROOM_BOUNDS.minZ + radius;
      blockedZ = true;
      didCollide = true;
    } else if (testZ + radius > ROOM_BOUNDS.maxZ) {
      posZ = ROOM_BOUNDS.maxZ - radius;
      blockedZ = true;
      didCollide = true;
    } else {
      // Check obstacles
      for (const box of CLASSROOM_COLLIDERS) {
        if (circleIntersectsAABB(posX, testZ, radius, box)) {
          // Slide along X-axis of collision: stop Z movement, snap outside
          if (stepDz > 0) {
            posZ = box.minZ - radius;
          } else if (stepDz < 0) {
            posZ = box.maxZ + radius;
          }
          blockedZ = true;
          didCollide = true;
          break;
        }
      }
      if (!blockedZ) {
        posZ = testZ;
      }
    }
  }

  return { x: posX, z: posZ, collided: didCollide };
}

function circleIntersectsAABB(
  cx: number,
  cz: number,
  radius: number,
  box: ColliderAABB
): boolean {
  // Find closest point on AABB to circle center
  const closestX = Math.max(box.minX, Math.min(cx, box.maxX));
  const closestZ = Math.max(box.minZ, Math.min(cz, box.maxZ));

  const distX = cx - closestX;
  const distZ = cz - closestZ;
  const distSq = distX * distX + distZ * distZ;

  return distSq < radius * radius;
}

/**
 * Camera collision raycast against room walls and high obstacles
 * Prevents third-person camera from ever clipping through walls
 */
export function resolveCameraCollision(
  pivot: THREE.Vector3,
  desiredCamPos: THREE.Vector3,
  margin = 0.25
): THREE.Vector3 {
  const result = desiredCamPos.clone();
  const dir = new THREE.Vector3().subVectors(desiredCamPos, pivot);
  const maxDistance = dir.length();
  if (maxDistance === 0) return result;
  dir.normalize();

  // Test wall planes
  // Left wall: x = -7.0
  if (result.x < ROOM_BOUNDS.minX + margin) {
    const t = (ROOM_BOUNDS.minX + margin - pivot.x) / dir.x;
    if (t > 0 && t < maxDistance) {
      result.copy(pivot).addScaledVector(dir, t);
    }
  }
  // Right wall: x = 7.0
  if (result.x > ROOM_BOUNDS.maxX - margin) {
    const t = (ROOM_BOUNDS.maxX - margin - pivot.x) / dir.x;
    if (t > 0 && t < maxDistance) {
      result.copy(pivot).addScaledVector(dir, t);
    }
  }
  // Front wall: z = -5.0
  if (result.z < ROOM_BOUNDS.minZ + margin) {
    const t = (ROOM_BOUNDS.minZ + margin - pivot.z) / dir.z;
    if (t > 0 && t < maxDistance) {
      result.copy(pivot).addScaledVector(dir, t);
    }
  }
  // Back wall: z = 5.0
  if (result.z > ROOM_BOUNDS.maxZ - margin) {
    const t = (ROOM_BOUNDS.maxZ - margin - pivot.z) / dir.z;
    if (t > 0 && t < maxDistance) {
      result.copy(pivot).addScaledVector(dir, t);
    }
  }

  // Ensure camera doesn't go below floor or above ceiling
  result.y = Math.max(0.6, Math.min(4.2, result.y));

  return result;
}

/**
 * Checks whether a given position (x, z) with character radius collides
 * with any classroom obstacles (desks, benches, podium, teacher table) or room walls.
 */
export function isPositionColliding(
  x: number,
  z: number,
  radius = 0.20
): boolean {
  // Check room bounds
  if (
    x - radius < ROOM_BOUNDS.minX ||
    x + radius > ROOM_BOUNDS.maxX ||
    z - radius < ROOM_BOUNDS.minZ ||
    z + radius > ROOM_BOUNDS.maxZ
  ) {
    return true;
  }

  // Check classroom obstacle colliders
  for (const box of CLASSROOM_COLLIDERS) {
    if (circleIntersectsAABB(x, z, radius, box)) {
      return true;
    }
  }

  return false;
}

/**
 * Computes a verified collision-free standing spot next to a seat.
 * Guarantees the player will never spawn inside a desk, bench, or wall.
 */
export function getSafeStandPosition(
  seat: SeatInfo,
  radius = 0.20
): { x: number; y: number; z: number } {
  // 1. Try predefined standAnchor first
  if (seat.standAnchor) {
    if (!isPositionColliding(seat.standAnchor.x, seat.standAnchor.z, radius)) {
      return { x: seat.standAnchor.x, y: 0, z: seat.standAnchor.z };
    }
  }

  // 2. Candidate fallbacks: aisle offsets
  const candidateOffsets = [
    { dx: 0, dz: 0.40 },   // Behind bench
    { dx: -0.55, dz: 0 },  // Left aisle
    { dx: 0.55, dz: 0 },   // Right aisle
    { dx: 0, dz: -0.40 },  // In front
  ];

  for (const offset of candidateOffsets) {
    const testX = seat.x + offset.dx;
    const testZ = seat.z + offset.dz;
    if (!isPositionColliding(testX, testZ, radius)) {
      return { x: testX, y: 0, z: testZ };
    }
  }

  // Fallback to room center safe spot if all else fails
  return { x: 0, y: 0, z: 2.0 };
}

