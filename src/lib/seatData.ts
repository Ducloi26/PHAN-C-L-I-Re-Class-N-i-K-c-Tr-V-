import { SeatInfo } from '../types';

export const SEAT_PROMPT_DISTANCE = 1.05;
export const SEAT_INTERACTION_DISTANCE = 1.15;
export const SEAT_DISTANCE_EPSILON = 0.000001;

export const CLASSROOM_SEATS: SeatInfo[] = [
  // Teacher Chair
  {
    id: 'seat-teacher',
    name: 'Bàn Giáo Viên',
    x: -3.5,
    y: 0,
    z: -4.2,
    rotY: 0, // Faces students towards +Z
    isTeacherSeat: true,
    seatAnchor: {
      x: -3.5,
      y: 0,
      z: -4.2,
      rotY: 0,
    },
    standAnchor: {
      x: -2.3,
      y: 0,
      z: -3.6,
    },
  },
];

// 24 student seats (3 rows x 4 cols x 2 seats per bench)
const rows = [-0.5, 1.5, 3.5];
const cols = [-4.0, -1.4, 1.4, 4.0];

let seatIndex = 1;
for (let r = 0; r < rows.length; r++) {
  for (let c = 0; c < cols.length; c++) {
    const deskX = cols[c];
    const deskZ = rows[r];
    const benchZ = deskZ + 0.53;

    // Left seat (A)
    const seatAX = Number((deskX - 0.35).toFixed(2));
    const seatAZ = Number(benchZ.toFixed(2));
    const standAZ = Number((benchZ + 0.39).toFixed(2));

    CLASSROOM_SEATS.push({
      id: `seat-${seatIndex++}`,
      name: `Dãy ${c + 1} - Hàng ${r + 1} (A)`,
      x: seatAX,
      y: 0,
      z: seatAZ,
      rotY: Math.PI, // Faces front towards -Z
      isTeacherSeat: false,
      seatAnchor: {
        x: seatAX,
        y: 0,
        z: seatAZ,
        rotY: Math.PI,
      },
      standAnchor: {
        x: seatAX,
        y: 0,
        z: standAZ,
      },
    });

    // Right seat (B)
    const seatBX = Number((deskX + 0.35).toFixed(2));
    const seatBZ = Number(benchZ.toFixed(2));
    const standBZ = Number((benchZ + 0.39).toFixed(2));

    CLASSROOM_SEATS.push({
      id: `seat-${seatIndex++}`,
      name: `Dãy ${c + 1} - Hàng ${r + 1} (B)`,
      x: seatBX,
      y: 0,
      z: seatBZ,
      rotY: Math.PI,
      isTeacherSeat: false,
      seatAnchor: {
        x: seatBX,
        y: 0,
        z: seatBZ,
        rotY: Math.PI,
      },
      standAnchor: {
        x: seatBX,
        y: 0,
        z: standBZ,
      },
    });
  }
}

export function findNearestSeat(
  x: number, 
  z: number, 
  maxDistance = SEAT_PROMPT_DISTANCE,
  eligible: (seat: SeatInfo) => boolean = () => true,
): SeatInfo | null {
  let nearest: SeatInfo | null = null;
  let minDist = maxDistance + SEAT_DISTANCE_EPSILON;

  for (const s of CLASSROOM_SEATS) {
    if (!eligible(s)) continue;
    const dist = Math.hypot(x - s.x, z - s.z);
    if (dist < minDist) {
      minDist = dist;
      nearest = s;
    }
  }

  return nearest;
}
