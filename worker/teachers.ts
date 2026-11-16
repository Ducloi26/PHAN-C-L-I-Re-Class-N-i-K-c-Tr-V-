import type { TeacherInfo } from '../src/types';
import { listAuthUsers, teacherAccount } from './staff';

interface TeacherDatabase {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}

export class TeacherDirectoryError extends Error {}

// Registered teacher profiles and explicit teacher roles are the only sources.
// Optional tables support both existing schema versions; other DB errors fail
// visibly rather than falling back to demo names or fabricated flower counts.
export async function listTeachers(env: TeacherDatabase): Promise<TeacherInfo[]> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new TeacherDirectoryError('Chưa kết nối CSDL danh sách giáo viên.');
  }
  const base = env.SUPABASE_URL.replace(/\/+$/, '');
  const headers = {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
  };
  async function read(table: string, query: string) {
    const rows: Record<string, any>[] = [];
    for (let offset = 0; ; offset += 1000) {
      const response = await fetch(`${base}/rest/v1/${table}?${query}&limit=1000&offset=${offset}`, { headers });
      const data = await response.json();
      if (!response.ok) {
        const error = data as { code?: string };
        if (error.code === 'PGRST205' || error.code === '42P01') return { exists: false, rows: [] };
        throw new TeacherDirectoryError('Không tải được danh sách giáo viên từ CSDL. Vui lòng thử lại.');
      }
      if (!Array.isArray(data)) throw new TeacherDirectoryError('Dữ liệu giáo viên không hợp lệ.');
      rows.push(...data);
      if (data.length < 1000) return { exists: true, rows };
    }
  }

  const [registered, staff, roles] = await Promise.all([
    read('teacher_profiles', 'select=*'),
    read('staff_profiles', 'select=user_id,display_name,role'),
    read('user_roles', 'select=user_id,role&role=eq.teacher'),
  ]);
  const teachers = new Map<string, TeacherInfo>();
  const disabledIds = new Set(registered.rows.filter((row) => row.is_active === false).map((row) => row.user_id || row.id));
  for (const row of registered.rows) {
    if (row.is_active === false || (row.role && row.role !== 'teacher')) continue;
    const id = row.user_id || row.id;
    if (!id || !row.display_name?.trim()) continue;
    teachers.set(id, {
      id, display_name: row.display_name.trim(), title: row.title || 'Giáo viên',
      avatar_url: row.avatar_url, flower_count: 0,
    });
  }
  const staffById = new Map(staff.rows.map((row) => [row.user_id, row]));
  for (const row of staff.rows) {
    if (disabledIds.has(row.user_id) || row.role !== 'teacher' || !row.display_name?.trim()) continue;
    teachers.set(row.user_id, {
      ...teachers.get(row.user_id), id: row.user_id,
      display_name: row.display_name.trim(),
      title: teachers.get(row.user_id)?.title || 'Giáo viên', flower_count: 0,
    });
  }

  // Legacy grants live in user_roles; resolve their real profile names.
  const legacyIds = roles.rows
    .filter((row) => row.role === 'teacher' && !disabledIds.has(row.user_id) && !staffById.has(row.user_id) && !teachers.has(row.user_id))
    .map((row) => row.user_id);
  if (legacyIds.length) {
    const ids = legacyIds.map((id) => `"${String(id).replace(/["\\]/g, '')}"`).join(',');
    const profiles = await read('profiles', `select=id,display_name&id=in.${encodeURIComponent(`(${ids})`)}`);
    for (const row of profiles.rows) {
      if (row.display_name?.trim()) teachers.set(row.id, {
        id: row.id, display_name: row.display_name.trim(), title: 'Giáo viên', flower_count: 0,
      });
    }
  }

  // Approved applications are real Supabase Auth records. Their access is held
  // in server-controlled app_metadata, so this also works before SQL setup.
  for (const user of await listAuthUsers(env)) {
    const role = user.app_metadata?.staff_role;
    if (role === 'teacher' && user.app_metadata?.teacher_status === 'approved' && !disabledIds.has(user.id)) {
      const account = teacherAccount(user);
      teachers.set(user.id, { id: user.id, display_name: account.display_name, title: account.title, flower_count: 0 });
    } else if (role === 'member' || role === 'admin') {
      teachers.delete(user.id);
    }
  }

  if (teachers.size) {
    const gifts = await read('flower_gifts', 'select=receiver_id');
    for (const gift of gifts.rows) {
      const teacher = teachers.get(gift.receiver_id);
      if (teacher) teacher.flower_count = (teacher.flower_count || 0) + 1;
    }
  }
  return [...teachers.values()].sort((a, b) => a.display_name.localeCompare(b.display_name, 'vi'));
}
