import type { UserRole } from '../src/types';

export interface StaffEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}
export class StaffError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export interface AuthUser {
  id: string;
  email?: string;
  is_anonymous?: boolean;
  created_at?: string;
  app_metadata?: Record<string, any>;
  user_metadata?: Record<string, any>;
}

export async function authRequest<T = Record<string, any>>(env: StaffEnv, path: string, init?: RequestInit): Promise<T> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Chưa kết nối hệ thống tài khoản.');
  const response = await fetch(`${env.SUPABASE_URL.replace(/\/+$/, '')}/auth/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const data = (response.status === 204 ? {} : await response.json()) as Record<string, any>;
  if (!response.ok) throw new StaffError(data.msg || data.message || data.error_description || 'Không thể cập nhật tài khoản.', response.status >= 500 ? 503 : response.status);
  return data as T;
}

export async function staffSession(env: StaffEnv, input: Record<string, unknown>, refresh = false) {
  const session = await authRequest(env, `token?grant_type=${refresh ? 'refresh_token' : 'password'}`, {
    method: 'POST',
    body: JSON.stringify(refresh ? { refresh_token: input.refreshToken } : { email: String(input.email || '').trim(), password: input.password }),
  });
  const role = await getStaffRole(session.user, env);
  if (role !== 'admin' && role !== 'teacher') throw new Error('Tài khoản chưa được duyệt hoặc quyền giáo viên đã bị thu hồi.');
  return {
    user: { id: session.user.id, displayName: teacherAccount(session.user).display_name, email: session.user.email, role, participantType: 'guest', isAnonymous: false },
    sessionToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: Date.now() + session.expires_in * 1000,
  };
}

export async function getStaffRole(user: AuthUser, env: StaffEnv): Promise<UserRole> {
  // app_metadata is writable only by the trusted Auth admin API, never users.
  const role = user.app_metadata?.staff_role;
  if (role === 'admin' || role === 'teacher' || role === 'member') return role;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return 'member';
  for (const table of ['staff_profiles', 'user_roles']) {
    const response = await fetch(`${env.SUPABASE_URL.replace(/\/+$/, '')}/rest/v1/${table}?user_id=eq.${encodeURIComponent(user.id)}&select=role&limit=1`, {
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` },
    });
    if (!response.ok) continue;
    const rows = await response.json() as { role: UserRole }[];
    if (rows[0]) return ['teacher', 'admin'].includes(rows[0].role) ? rows[0].role : 'member';
  }
  return 'member';
}

export async function getStaffIdentity(token: string, env: StaffEnv) {
  if (!token) return null;
  try {
    const user = await authRequest(env, 'user', { headers: { Authorization: `Bearer ${token}` } }) as AuthUser;
    const role = await getStaffRole(user, env);
    return { user, role };
  } catch { return null; }
}

export async function listAuthUsers(env: StaffEnv): Promise<AuthUser[]> {
  const users: AuthUser[] = [];
  for (let page = 1; ; page++) {
    const data = await authRequest(env, `admin/users?page=${page}&per_page=1000`);
    if (!Array.isArray(data.users)) throw new Error('Dữ liệu tài khoản không hợp lệ.');
    users.push(...data.users);
    if (data.users.length < 1000) return users;
  }
}

export function teacherAccount(user: AuthUser) {
  const name = user.user_metadata?.display_name;
  const department = user.user_metadata?.department;
  return {
    id: user.id,
    email: user.email,
    display_name: typeof name === 'string' && name.trim() ? name.trim().slice(0, 50) : user.email?.split('@')[0] || 'Giáo viên',
    title: typeof department === 'string' && department.trim() ? department.trim().slice(0, 100) : 'Giáo viên',
    status: user.app_metadata?.teacher_status || 'unassigned',
    created_at: user.created_at,
  };
}

export async function registerTeacher(env: StaffEnv, body: Record<string, unknown>) {
  const email = String(body.email || '').trim().toLowerCase();
  const name = String(body.displayName || '').trim();
  const department = String(body.department || '').trim();
  const password = String(body.password || '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new StaffError('Email không hợp lệ.');
  if (name.length < 2 || name.length > 50) throw new StaffError('Họ tên phải từ 2 đến 50 ký tự.');
  if (department.length > 100) throw new StaffError('Khoa / đơn vị tối đa 100 ký tự.');
  if (password.length < 10 || password.length > 128) throw new StaffError('Mật khẩu phải từ 10 đến 128 ký tự.');
  await authRequest(env, 'admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email, password, email_confirm: false,
      app_metadata: { staff_role: 'member', teacher_status: 'pending' },
      user_metadata: { display_name: name, department },
    }),
  });
}

export async function reviewTeacher(env: StaffEnv, id: string, status: string) {
  if (!['approved', 'rejected', 'revoked'].includes(status)) throw new StaffError('Trạng thái duyệt không hợp lệ.');
  const target = await authRequest(env, `admin/users/${encodeURIComponent(id)}`) as AuthUser;
  if (await getStaffRole(target, env) === 'admin') throw new StaffError('Không thể thay đổi tài khoản quản trị ở đây.', 403);
  if (!target.app_metadata?.teacher_status) throw new StaffError('Tài khoản này chưa đăng ký giáo viên.');
  const updated = await authRequest(env, `admin/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...(status === 'approved' ? { email_confirm: true } : {}),
      app_metadata: { ...target.app_metadata, staff_role: status === 'approved' ? 'teacher' : 'member', teacher_status: status },
    }),
  }) as AuthUser;
  return teacherAccount(updated);
}
