import { PlayerState, SeatInfo, UserRole } from '../types';
import { findNearestSeat, SEAT_INTERACTION_DISTANCE, SEAT_PROMPT_DISTANCE } from './seatData';

export type SmartActionType = 'sit' | 'stand' | 'projector' | 'teacher' | 'memory_wall' | 'none';

export interface SmartAction {
  type: SmartActionType;
  id: string;
  label: string;
  subLabel?: string;
  iconName: 'seat' | 'stand' | 'projector' | 'teacher' | 'memory_wall';
  colorTheme: 'emerald' | 'amber' | 'sky' | 'rose';
  seatInfo?: SeatInfo;
}

/**
 * Evaluates the player's immediate spatial context and identifies
 * the most relevant single interactive object nearby with hysteresis to prevent flickering.
 */
export function getSmartAction(
  player: PlayerState,
  remotePlayers: PlayerState[],
  previousActionType: SmartActionType = 'none'
): SmartAction | null {
  // 1. If currently seated, the only valid immediate action is standing up
  if (player.state === 'sitting') {
    return {
      type: 'stand',
      id: player.seatId || 'seated',
      label: 'Đứng dậy',
      subLabel: 'Rời ghế ngồi',
      iconName: 'stand',
      colorTheme: 'amber',
    };
  }

  // Filter unavailable seats BEFORE choosing the nearest, so a seated
  // neighbour cannot hide the free half of the same bench.
  const maxSeatDist = previousActionType === 'sit' ? SEAT_INTERACTION_DISTANCE : SEAT_PROMPT_DISTANCE;
  const occupied = new Set(remotePlayers.filter((p) => p.state === 'sitting').map((p) => p.seatId));
  const staff = player.role === 'teacher' || player.role === 'admin';
  const nearestSeat = findNearestSeat(player.x, player.z, maxSeatDist, (seat) => (!seat.isTeacherSeat || staff) && !occupied.has(seat.id));

  if (nearestSeat) {
    const isOccupied = remotePlayers.some(
      (p) => p.seatId === nearestSeat.id && p.state === 'sitting'
    );
    if (!isOccupied) {
      return {
        type: 'sit',
        id: nearestSeat.id,
        label: nearestSeat.isTeacherSeat ? 'Ngồi bàn Giáo viên' : 'Ngồi xuống',
        subLabel: nearestSeat.name,
        iconName: 'seat',
        colorTheme: 'emerald',
        seatInfo: nearestSeat,
      };
    }
  }

  // 3. Priority B: Teacher desk & podium area (x: [-4.6, -2.4], z: [-4.6, -2.5])
  const nearTeacherDesk =
    player.x >= -4.75 &&
    player.x <= -2.25 &&
    player.z >= -4.75 &&
    player.z <= -2.45;

  if (nearTeacherDesk) {
    return {
      type: 'teacher',
      id: 'teacher-desk',
      label: 'Tương tác Thầy Cô',
      subLabel: 'Tặng hoa & Lời chúc',
      iconName: 'teacher',
      colorTheme: 'rose',
    };
  }

  // 4. Priority C: Blackboard & Projector Screen area (front of classroom z <= -2.6m, |x| <= 3.2m)
  const nearProjector =
    player.z <= -2.55 &&
    Math.abs(player.x) <= 3.30;

  if (nearProjector) {
    return {
      type: 'projector',
      id: 'projector-screen',
      label: 'Xem máy chiếu',
      subLabel: 'Phóng to nội dung 2D',
      iconName: 'projector',
      colorTheme: 'sky',
    };
  }

  // 5. Priority D: Memory Wall ("Chúng ta đã từng ở đây" at back wall z >= 3.45m, |x| <= 2.8m)
  const nearMemoryWall = player.z >= 3.45 && Math.abs(player.x) <= 2.8;

  if (nearMemoryWall) {
    return {
      type: 'memory_wall',
      id: 'memory-wall-back',
      label: 'Bức tường dấu ấn',
      subLabel: 'Chúng ta đã từng ở đây',
      iconName: 'memory_wall',
      colorTheme: 'amber',
    };
  }

  return null;
}

