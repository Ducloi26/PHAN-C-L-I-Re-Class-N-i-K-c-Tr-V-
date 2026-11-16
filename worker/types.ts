import { AvatarCustomization, ParticipantType, UserRole, AvatarActivity } from '../src/types';

export interface GuestTokenPayload {
  sub: string;            // sessionId e.g. "guest_a7x9f2"
  name: string;           // display name
  type: ParticipantType;  // 'student' | 'guest'
  role: UserRole;         // 'member' (never admin/teacher)
  avatar: AvatarCustomization;
  iat: number;            // issued at timestamp (ms)
  exp: number;            // expires at timestamp (ms)
}

export interface PlayerNetworkState {
  id: string;
  displayName: string;
  role: UserRole;
  participantType: ParticipantType;
  x: number;
  y: number;
  z: number;
  rotY: number;
  state: AvatarActivity;
  seatId?: string | null;
  lastSeen: number;
  avatar?: AvatarCustomization;
}

export interface SeatOccupancyRecord {
  seatId: string;
  sessionId: string;
  playerName: string;
  leasedAt: number;
  expiresAt: number;
}

export interface ProjectorSyncState {
  mediaId: string | null;
  isPlaying: boolean;
  positionSec: number;
  slideIndex: number;
  mode?: 'presentation' | 'retrospective';
  retrospectiveIndex?: number;
  retrospectiveMarkId?: string | null;
  updatedAt: string;
  updatedBy?: string;
}

// WebSocket Message Types
export type ClientMessageType =
  | 'player:join'
  | 'player:move'
  | 'player:avatar_changed'
  | 'player:state_changed'
  | 'seat:request'
  | 'seat:release'
  | 'projector:update'
  | 'screen:signal'
  | 'flower:send'
  | 'wish:broadcast'
  | 'ping';

export type ServerMessageType =
  | 'room:snapshot'
  | 'room:presence_update'
  | 'player:joined'
  | 'player:left'
  | 'player:moved'
  | 'player:avatar_updated'
  | 'player:state_updated'
  | 'seat:confirmed'
  | 'seat:rejected'
  | 'seat:occupancy_update'
  | 'projector:state_updated'
  | 'screen:signal'
  | 'flower:announced'
  | 'wish:announced'
  | 'wish:updated'
  | 'teachers:updated'
  | 'memory_mark:added'
  | 'memory_mark:updated'
  | 'error'
  | 'pong';

export interface WSMessage<T = any> {
  type: ClientMessageType | ServerMessageType;
  payload?: T;
  timestamp?: number;
}

