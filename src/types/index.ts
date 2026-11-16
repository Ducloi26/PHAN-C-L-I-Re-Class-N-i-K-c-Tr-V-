export type ParticipantType = 'student' | 'guest';

export type UserRole = 'member' | 'teacher' | 'admin';

export interface Profile {
  id: string;
  display_name: string;
  participant_type: ParticipantType;
  created_at: string;
  updated_at?: string;
}

export interface UserRoleRecord {
  user_id: string;
  role: UserRole;
  updated_at: string;
}

export interface TeacherInfo {
  id: string;
  display_name: string;
  title: string; // e.g. "Thầy Nguyễn Văn A - Khoa Sư phạm"
  flower_count?: number;
  avatar_url?: string;
}

export interface Wish {
  id: string;
  author_id: string;
  author_name: string;
  teacher_id: string | null;
  teacher_name?: string | null;
  content: string;
  is_hidden: boolean;
  created_at: string;
}

export type MediaKind = 'image' | 'youtube' | 'slide' | 'screen';

export interface MediaPayload {
  url?: string;
  youtube_id?: string;
  slides?: string[];
  description?: string;
  screen_session_id?: string;
  presenter_id?: string;
  has_audio?: boolean;
  return_media_id?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  kind: MediaKind;
  payload: MediaPayload;
  created_by?: string;
  created_at: string;
}

export type ProjectorMode = 'presentation' | 'retrospective';

export interface ProjectorState {
  revision?: number;
  server_time?: number;
  controller_id?: string;
  id: number;
  media_id: string | null;
  is_playing: boolean;
  position_sec: number;
  slide_index: number;
  mode?: ProjectorMode;
  retrospective_index?: number;
  retrospective_mark_id?: string | null;
  updated_at: string;
  media?: MediaItem | null;
}

// -------------------------------------------------------------
// P5: FLOWER GIFTING TYPES & DETAILS
// -------------------------------------------------------------

export type FlowerType = 'rose' | 'sunflower' | 'lotus' | 'carnation';

export interface FlowerTypeInfo {
  id: FlowerType;
  name: string;
  emoji: string;
  color: string;
  petalColors: string[];
  meaning: string;
}

export const FLOWER_TYPES: Record<FlowerType, FlowerTypeInfo> = {
  rose: {
    id: 'rose',
    name: 'Hoa Hồng Đỏ',
    emoji: '🌹',
    color: '#E11D48',
    petalColors: ['#E11D48', '#BE123C', '#F43F5E', '#FDA4AF'],
    meaning: 'Tình cảm tri ân chân thành và sâu sắc nhất',
  },
  sunflower: {
    id: 'sunflower',
    name: 'Hoa Hướng Dương',
    emoji: '🌻',
    color: '#F59E0B',
    petalColors: ['#F59E0B', '#FBBF24', '#D97706', '#FEF08A'],
    meaning: 'Kính dâng người thầy dẫn lối tương lai rạng ngời',
  },
  lotus: {
    id: 'lotus',
    name: 'Hoa Sen Thanh Khiết',
    emoji: '🌸',
    color: '#EC4899',
    petalColors: ['#F472B6', '#EC4899', '#DB2777', '#FCE7F3'],
    meaning: 'Tôn sư trọng đạo, phẩm hạnh ngời sáng',
  },
  carnation: {
    id: 'carnation',
    name: 'Bó Hoa Cẩm Tú',
    emoji: '💐',
    color: '#8B5CF6',
    petalColors: ['#A78BFA', '#8B5CF6', '#F43F5E', '#FBBF24'],
    meaning: 'Kính chúc Quý Thầy Cô sức khỏe và hạnh phúc',
  },
};

export interface FlowerGift {
  id: string;
  sender_id: string;
  receiver_id: string;
  flower_type?: FlowerType;
  flower_name?: string;
  note?: string | null;
  created_at: string;
}

export type CameraPreset = 'overview' | 'board' | 'podium' | 'students';

// Multiplayer & Avatar extensions
export type CameraViewMode = 'first-person' | 'third-person' | 'orbit';

export type AvatarActivity = 'standing' | 'walking' | 'sitting' | 'gifting';

export type HairStyleId = 'short' | 'side-part' | 'long' | 'ponytail' | 'grad-cap';
export type GenderType = 'male' | 'female';

export interface AvatarCustomization {
  presetId: string;       // e.g. 'student-male-1', 'student-male-2', 'student-female-1', 'student-female-2'
  gender: GenderType;
  hairStyle: HairStyleId;
  hairColor: string;      // hex color code
  outfitColor: string;    // hex color code
  accessory?: 'none' | 'glasses' | 'tie' | 'ribbon';
}

export interface AvatarPreset {
  id: string;
  name: string;
  description: string;
  gender: GenderType;
  defaultConfig: AvatarCustomization;
}

export interface PlayerState {
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

export interface SeatAnchor {
  x: number;
  y: number;
  z: number;
  rotY: number;
}

export interface StandAnchor {
  x: number;
  y: number;
  z: number;
}

export interface SeatInfo {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  rotY: number; // Direction character faces when seated
  isTeacherSeat?: boolean;
  seatAnchor: SeatAnchor;
  standAnchor: StandAnchor;
}

// -------------------------------------------------------------
// P4: MEMORY WALL MARKS ("Chúng ta đã từng ở đây")
// -------------------------------------------------------------

export type MemoryMarkSymbol = 'heart' | 'sunflower' | 'rose' | 'star' | 'book' | 'grad_cap';

export type ModerationStatus = 'pending' | 'approved' | 'hidden' | 'rejected';

export interface MemoryMark {
  id: string;
  room_id: string;
  session_id: string;
  display_name: string;
  avatar_id?: string;
  symbol: MemoryMarkSymbol;
  card_color: string;
  message: string;
  moderation_status: ModerationStatus;
  pin_x?: number;
  pin_y?: number;
  created_at: string;
  approved_at?: string;
}

