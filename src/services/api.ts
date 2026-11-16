import { 
  UserRole, 
  Wish, 
  TeacherInfo, 
  FlowerType,
  MediaItem, 
  ProjectorState, 
  ProjectorMode,
  ParticipantType,
  AvatarCustomization,
  MemoryMark,
  MemoryMarkSymbol,
  ModerationStatus
} from '../types';
import { getDefaultAvatar } from '../lib/avatarPresets';
import { withRoom } from '../lib/room';
// Preserve existing storage keys while keeping guest sessions separate per tab.
const DEMO_USER_KEY = 'lop_hoc_ky_uc_demo_user';
const DEMO_AVATAR_KEY = 'lop_hoc_ky_uc_custom_avatar';
export const SESSION_TOKEN_KEY = 'lop_hoc_session_token';
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export interface CurrentUser {
  id: string;
  displayName: string;
  participantType: ParticipantType;
  role: UserRole;
  email?: string;
  isAnonymous: boolean;
  avatar?: AvatarCustomization;
}

export function getSessionToken(): string {
  return (typeof sessionStorage === 'undefined' ? '' : sessionStorage.getItem(SESSION_TOKEN_KEY)) || (typeof localStorage === 'undefined' ? '' : localStorage.getItem(SESSION_TOKEN_KEY)) || '';
}

// -------------------------------------------------------------
// AUTHENTICATION
// -------------------------------------------------------------

export async function loginAnonymous(displayName: string, participantType: ParticipantType, avatar?: AvatarCustomization): Promise<CurrentUser> {
  const selectedAvatar = avatar || getDefaultAvatar();
  const data = await accountRequest('/api/guest-session', { method: 'POST', body: JSON.stringify({ displayName: displayName.trim(), participantType, avatar: selectedAvatar }) });
  if (!data.ok || !data.player || !data.sessionToken) throw new Error('Không nhận được phiên khách hợp lệ.');
  const user: CurrentUser = { id: data.guestSessionId, displayName: data.player.displayName, participantType: data.player.participantType, role: 'member', isAnonymous: true, avatar: data.player.avatar };
  sessionStorage.setItem(SESSION_TOKEN_KEY, data.sessionToken);
  sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
  localStorage.setItem(DEMO_AVATAR_KEY, JSON.stringify(selectedAvatar));
  return user;
}

export function saveUserAvatar(user: CurrentUser, avatar: AvatarCustomization): CurrentUser {
  const updated: CurrentUser = { ...user, avatar };
  localStorage.setItem(DEMO_AVATAR_KEY, JSON.stringify(avatar));
  if (user.isAnonymous) {
    sessionStorage.setItem(DEMO_USER_KEY, JSON.stringify(updated));
    return updated;
  }
  const raw = localStorage.getItem(DEMO_USER_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      parsed.avatar = avatar;
      localStorage.setItem(DEMO_USER_KEY, JSON.stringify(parsed));
    } catch {
      // ignore
    }
  }
  return updated;
}

export async function loginStaff(email: string, password: string): Promise<CurrentUser> {
  const data = await accountRequest('/api/staff/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(DEMO_USER_KEY);
  saveStaffSession(data);
  return data.user;
}

export async function logout(): Promise<void> {
  if (sessionStorage.getItem(DEMO_USER_KEY)) {
    sessionStorage.removeItem(DEMO_USER_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    return;
  }
  try { await accountRequest('/api/staff/logout', { method: 'POST' }); } catch {}
  localStorage.removeItem(STAFF_REFRESH_KEY);
  localStorage.removeItem(STAFF_EXPIRY_KEY);
  localStorage.removeItem(DEMO_USER_KEY);
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

export async function getSavedSession(): Promise<CurrentUser | null> {
  const getAvatar = () => {
    try {
      const saved = localStorage.getItem(DEMO_AVATAR_KEY);
      return saved ? JSON.parse(saved) : getDefaultAvatar();
    } catch {
      return getDefaultAvatar();
    }
  };

  // A visitor belongs to this tab, independently of other guest/staff logins.
  const tabUser = sessionStorage.getItem(DEMO_USER_KEY);
  if (tabUser) {
    try {
      const user = JSON.parse(tabUser);
      if (!getSessionToken().startsWith('local_demo_')) return { ...user, role: 'member', isAnonymous: true };
    } catch {}
    sessionStorage.removeItem(DEMO_USER_KEY); sessionStorage.removeItem(SESSION_TOKEN_KEY);
    return null;
  }
  const saved = localStorage.getItem(DEMO_USER_KEY);
  if (!saved) return null;
  const parsed = JSON.parse(saved);
  if (parsed.isAnonymous) return null;
  const profile = await accountRequest('/api/staff/me');
  if (profile.role !== 'teacher' && profile.role !== 'admin') return null;
  return { ...parsed, id: profile.id || parsed.id, role: profile.role, displayName: profile.displayName, avatar: parsed.avatar || getAvatar() };
}

// -------------------------------------------------------------
// WISHES & MEMORY BOOK
// -------------------------------------------------------------

export async function fetchWishes(includeHidden = false): Promise<Wish[]> {
  return (await accountRequest(`/api/wishes${includeHidden ? '?includeAll=true' : ''}`)).wishes;
}

export async function createWish(_authorId: string, _authorName: string, content: string, teacherId?: string, _teacherName?: string): Promise<Wish> {
  const data = await accountRequest('/api/wishes', { method: 'POST', body: JSON.stringify({ content: content.trim(), teacherId }) });
  return data.wish;
}

export async function setWishHidden(wishId: string, isHidden: boolean): Promise<void> {
  await accountRequest(`/api/wishes/${encodeURIComponent(wishId)}`, { method: 'PATCH', body: JSON.stringify({ is_hidden: isHidden }) });
}

export async function fetchTeachers(): Promise<TeacherInfo[]> {
  const data = await accountRequest('/api/teachers');
  if (!Array.isArray(data.teachers)) throw new Error('Danh sách giáo viên không hợp lệ');
  return data.teachers;
}

export async function giftFlower(_senderId: string, receiverId: string, note?: string, flowerType: FlowerType = 'rose', _flowerName?: string): Promise<{ success: boolean; message: string }> {
  const data = await accountRequest('/api/flowers', { method: 'POST', body: JSON.stringify({ receiverId, note, flowerType }) });
  return { success: data.ok === true, message: data.ok ? 'Đã gửi hoa tri ân thành công!' : 'Không thể gửi hoa. Vui lòng thử lại.' };
}

export async function fetchMediaItems(): Promise<MediaItem[]> {
  return (await accountRequest('/api/media')).media;
}

export async function fetchProjectorState(): Promise<ProjectorState> {
  return (await accountRequest('/api/projector')).projector;
}

export type ProjectorCommand = Partial<Pick<ProjectorState, 'media_id' | 'is_playing' | 'position_sec' | 'mode' | 'slide_index' | 'retrospective_index' | 'retrospective_mark_id'>> & {
  youtube_url?: string; screen_start?: boolean; has_audio?: boolean; screen_stop?: string; expected_revision?: number;
};
export async function patchProjector(command: ProjectorCommand): Promise<ProjectorState> {
  return (await accountRequest('/api/projector', { method: 'PATCH', body: JSON.stringify(command) })).projector;
}
export async function fetchRtcConfig(): Promise<RTCConfiguration> {
  return accountRequest('/api/rtc-config');
}

export async function updateProjectorState(mediaId: string | null, isPlaying = true, positionSec = 0, slideIndex = 0, mode: ProjectorMode = 'presentation', retrospectiveIndex = 0, retrospectiveMarkId: string | null = null): Promise<ProjectorState> {
  const data = await accountRequest('/api/projector', { method: 'PATCH', body: JSON.stringify({ media_id: mediaId, is_playing: isPlaying, position_sec: positionSec, slide_index: slideIndex, mode, retrospective_index: retrospectiveIndex, retrospective_mark_id: retrospectiveMarkId }) });
  return data.projector;
}

// -------------------------------------------------------------
// P4: MEMORY WALL MARKS ("Chúng ta đã từng ở đây")
// -------------------------------------------------------------

// Memory marks use the Worker room as their single durable source of truth.
// Never replace an empty response or a failed write with sample/local-only data.
async function memoryMarksRequest(path: string, init?: RequestInit) {
  return accountRequest(path, init);
}

export async function fetchMemoryMarks(includeAll = false): Promise<MemoryMark[]> {
  const data = await memoryMarksRequest(`/api/memory-marks${includeAll ? '?includeAll=true' : ''}`);
  if (!Array.isArray(data.marks)) throw new Error('Dữ liệu dấu ấn không hợp lệ');
  return includeAll ? data.marks : data.marks.filter((mark: MemoryMark) => mark.moderation_status === 'approved');
}

export async function createMemoryMark(input: {
  displayName: string;
  symbol: MemoryMarkSymbol;
  cardColor: string;
  message: string;
  avatarId?: string;
}): Promise<MemoryMark> {
  const data = await memoryMarksRequest('/api/memory-marks', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      displayName: input.displayName.trim(),
      message: input.message.trim(),
    }),
  });
  if (!data.ok || !data.mark) throw new Error('Không thể lưu dấu ấn');
  return data.mark;
}

export async function moderateMemoryMark(id: string, status: ModerationStatus): Promise<void> {
  await memoryMarksRequest(`/api/memory-marks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ moderation_status: status }),
  });
}


export interface TeacherApplication {
  id: string;
  email: string;
  display_name: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  created_at: string;
}

const STAFF_REFRESH_KEY = 'lop_hoc_staff_refresh_token';
const STAFF_EXPIRY_KEY = 'lop_hoc_staff_expires_at';
let refreshInFlight: Promise<void> | null = null;

function saveStaffSession(data: { sessionToken: string; refreshToken: string; expiresAt: number; user: CurrentUser }) {
  localStorage.setItem(SESSION_TOKEN_KEY, data.sessionToken);
  localStorage.setItem(STAFF_REFRESH_KEY, data.refreshToken);
  localStorage.setItem(STAFF_EXPIRY_KEY, String(data.expiresAt));
  const previous = localStorage.getItem(DEMO_USER_KEY);
  let avatar = data.user.avatar;
  try { const saved = previous && JSON.parse(previous); if (saved?.id === data.user.id) avatar = avatar || saved.avatar; } catch {}
  localStorage.setItem(DEMO_USER_KEY, JSON.stringify({ ...data.user, ...(avatar ? { avatar } : {}) }));
}

async function accountRequest(path: string, init?: RequestInit, accessToken?: string) {
  const refreshToken = localStorage.getItem(STAFF_REFRESH_KEY);
  if (!accessToken && !sessionStorage.getItem(DEMO_USER_KEY) && refreshToken && path !== '/api/staff/login' && Number(localStorage.getItem(STAFF_EXPIRY_KEY)) < Date.now() + 60000) {
    if (!refreshInFlight) refreshInFlight = (async () => {
      const response = await fetch(`${API_BASE}${withRoom('/api/staff/refresh')}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Phiên đăng nhập đã hết hạn.');
      saveStaffSession(data);
    })().finally(() => { refreshInFlight = null; });
    await refreshInFlight;
  }
  const token = accessToken || getSessionToken();
  const response = await fetch(`${API_BASE}${withRoom(path)}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init?.headers },
  });
  const data = await response.json().catch(() => ({ error: 'Backend chưa sẵn sàng. Vui lòng thử lại.' }));
  if (!response.ok) throw new Error(data.error || 'Không thể kết nối hệ thống.');
  return data;
}

export async function registerTeacherAccount(input: { email: string; password: string; displayName: string; department: string }) {
  return accountRequest('/api/teacher-registration', { method: 'POST', body: JSON.stringify(input) });
}

export async function fetchTeacherApplications(): Promise<TeacherApplication[]> {
  const data = await accountRequest('/api/admin/teachers');
  return data.accounts;
}

export async function fetchRoomStats(): Promise<{ flowers: number; wishes: number; memories: number }> {
  return accountRequest('/api/stats');
}

export async function reviewTeacherApplication(id: string, status: 'approved' | 'rejected' | 'revoked'): Promise<void> {
  await accountRequest(`/api/admin/teachers/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) });
}
