import { ClassroomRoom } from './ClassroomRoom';
import { listTeachers } from './teachers';
import { authRequest, getStaffIdentity, listAuthUsers, registerTeacher, reviewTeacher, staffSession, teacherAccount, StaffError } from './staff';
import { createGuestToken, generateGuestSessionId, verifyGuestToken } from './auth';
import type { RoomActor } from './RoomData';
import { MEDIA_LIBRARY } from '../src/lib/mediaLibrary';
import { normalizeAvatar } from '../src/lib/avatarPresets';
export { ClassroomRoom };
export interface Env {
  ASSETS?: Fetcher;
  CLASSROOM_ROOM: DurableObjectNamespace<ClassroomRoom>;
  JWT_SECRET?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  ALLOWED_ORIGINS?: string;
  RTC_ICE_SERVERS?: string;
}
class ApiError extends Error { constructor(message: string, public status = 400) { super(message); } }
const rates = new Map<string, { count: number; reset: number }>();
function rateLimit(key: string, max: number) {
  const now = Date.now();
  if (rates.size > 10000) for (const [id, item] of rates) if (item.reset < now) rates.delete(id);
  const item = rates.get(key);
  if (!item || item.reset < now) { rates.set(key, { count: 1, reset: now + 60000 }); return; }
  if (++item.count > max) throw new ApiError('Thao tác quá nhanh, vui lòng thử lại sau một phút.', 429);
}
async function body(request: Request): Promise<Record<string, any>> {
  const text = await request.text();
  if (new TextEncoder().encode(text).length > 16384) throw new ApiError('Dữ liệu gửi lên quá lớn.', 413);
  try { const value = JSON.parse(text); if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(); return value; }
  catch { throw new ApiError('Dữ liệu gửi lên không hợp lệ.'); }
}
async function actor(request: Request, env: Env): Promise<RoomActor | null> {
  const token = (request.headers.get('Authorization') || request.headers.get('X-Session-Token') || '').replace(/^Bearer\s+/i, '');
  const guest = token && env.JWT_SECRET && await verifyGuestToken(token, env.JWT_SECRET);
  if (guest) return { id: guest.sub, name: guest.name, role: 'member', type: guest.type };
  const identity = token ? await getStaffIdentity(token, env) : null;
  return identity ? { id: identity.user.id, name: teacherAccount(identity.user).display_name, role: identity.role, type: 'guest' } : null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowed = env.ALLOWED_ORIGINS?.split(',').map((value) => value.trim());
    const originAllowed = !origin || !allowed || allowed.includes('*') || allowed.includes(origin);
    const cors = {
      'Access-Control-Allow-Origin': originAllowed ? origin || '*' : allowed?.[0] || '',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Token', Vary: 'Origin',
    };
    const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    try {
      if (!originAllowed) throw new ApiError('Nguồn truy cập không được phép.', 403);
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
      const roomId = url.searchParams.get('roomId') || 'classroom_1';
      if (!/^[\w-]{1,80}$/.test(roomId)) throw new ApiError('Phòng học không hợp lệ.');
      const room = () => env.CLASSROOM_ROOM.get(env.CLASSROOM_ROOM.idFromName(roomId));
      const ip = request.headers.get('CF-Connecting-IP') || 'local';
      const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
      const forward = async (path: string, identity: RoomActor | null = null, input?: unknown) => {
        const response = await room().fetch(new Request(`http://internal/data/${path}`, {
          method: request.method, headers: { 'X-Classroom-Identity': encodeURIComponent(JSON.stringify(identity)) },
          ...(input !== undefined ? { body: JSON.stringify(input) } : {}),
        }));
        return json(await response.json(), response.status);
      };
      if (url.pathname === '/api/health' && request.method === 'GET') return json({ ok: true, storage: 'durable-object', authConfigured: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) });
      if (['/api/staff/login', '/api/staff/refresh'].includes(url.pathname) && request.method === 'POST') {
        rateLimit(`login:${ip}`, 20);
        try { return json(await staffSession(env, await body(request), url.pathname.endsWith('/refresh'))); }
        catch (error: any) { throw new ApiError(error.message === 'Email not confirmed' ? 'Tài khoản giáo viên đang chờ quản trị viên duyệt.' : error.message, 401); }
      }
      if (url.pathname === '/api/staff/logout' && request.method === 'POST') {
        if (!await actor(request, env)) throw new ApiError('Phiên đăng nhập không hợp lệ.', 401);
        try { await authRequest(env, 'logout?scope=local', { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); } catch {}
        return json({ ok: true });
      }
      if (url.pathname === '/api/teacher-registration' && request.method === 'POST') {
        rateLimit(`registration:${ip}`, 5);
        await registerTeacher(env, await body(request));
        await room().fetch(new Request('http://internal/teachers-changed', { method: 'POST' })).catch(() => {});
        return json({ ok: true, message: 'Đã gửi đăng ký. Vui lòng chờ quản trị viên duyệt trước khi đăng nhập.' });
      }
      if (url.pathname === '/api/staff/me' || url.pathname.startsWith('/api/admin/teachers')) {
        const identity = await getStaffIdentity(token, env);
        if (!identity) {
          if (await verifyGuestToken(token, env.JWT_SECRET)) throw new ApiError('Chỉ quản trị viên được duyệt tài khoản giáo viên.', 403);
          throw new ApiError('Phiên đăng nhập không hợp lệ.', 401);
        }
        if (url.pathname === '/api/staff/me' && request.method === 'GET') return json({ id: identity.user.id, role: identity.role, displayName: teacherAccount(identity.user).display_name, teacherStatus: identity.user.app_metadata?.teacher_status });
        if (identity.role !== 'admin') throw new ApiError('Chỉ quản trị viên được duyệt tài khoản giáo viên.', 403);
        if (url.pathname === '/api/admin/teachers' && request.method === 'GET') return json({ accounts: (await listAuthUsers(env)).filter((user) => user.app_metadata?.teacher_status).map(teacherAccount) });
        const target = /^\/api\/admin\/teachers\/([^/]+)$/.exec(url.pathname);
        if (target && request.method === 'PATCH') {
          const input = await body(request);
          const account = await reviewTeacher(env, decodeURIComponent(target[1]), input.status || '');
          await room().fetch(new Request('http://internal/teachers-changed', { method: 'POST' }));
          if (input.status !== 'approved') await room().fetch(new Request('http://internal/revoke-staff', { method: 'POST', body: JSON.stringify({ id: account.id }) }));
          return json({ ok: true, account });
        }
      }
      if (url.pathname === '/api/guest-session' && request.method === 'POST') {
        rateLimit(`guest:${ip}`, 40);
        if (!env.JWT_SECRET) throw new ApiError('Chưa cấu hình phiên khách ở backend.', 503);
        const input = await body(request);
        const name = String(input.displayName || '').trim();
        if (name.length < 2 || name.length > 32) throw new ApiError('Tên hiển thị phải từ 2 đến 32 ký tự.');
        const id = generateGuestSessionId();
        const type = input.participantType === 'student' ? 'student' : 'guest';
        const avatar = normalizeAvatar(input.avatar);
        return json({ ok: true, guestSessionId: id, sessionToken: await createGuestToken(id, name, type, avatar, env.JWT_SECRET), player: { id, displayName: name, participantType: type, role: 'member', avatar } });
      }
      if (url.pathname === '/ws') {
        if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') throw new ApiError('Cần kết nối WebSocket.', 426);
        const wsToken = url.searchParams.get('token') || '';
        const authHeaders = new Headers(request.headers); authHeaders.set('Authorization', `Bearer ${wsToken}`);
        const identity = await actor(new Request(request, { headers: authHeaders }), env);
        if (!identity) throw new ApiError('Phiên đăng nhập không hợp lệ.', 401);
        const headers = new Headers(request.headers);
        headers.set('X-Classroom-Identity', encodeURIComponent(JSON.stringify(identity)));
        return room().fetch(new Request(request, { headers }));
      }
      if (url.pathname === '/api/room-state' && request.method === 'GET') {
        const response = await room().fetch(new Request('http://internal/room-snapshot'));
        return json(await response.json(), response.status);
      }
      if (url.pathname === '/api/media' && request.method === 'GET') return json({ media: MEDIA_LIBRARY });
      if (url.pathname === '/api/rtc-config' && request.method === 'GET') {
        if (!await actor(request, env)) throw new ApiError('Vui lòng đăng nhập để xem màn hình chia sẻ.', 401);
        let iceServers: unknown = [{ urls: 'stun:stun.l.google.com:19302' }];
        if (env.RTC_ICE_SERVERS) {
          try { iceServers = JSON.parse(env.RTC_ICE_SERVERS); } catch { throw new ApiError('Cấu hình máy chủ truyền màn hình không hợp lệ.', 503); }
        }
        if (!Array.isArray(iceServers) || iceServers.length > 10 || !iceServers.every((server) => server && (typeof server.urls === 'string' || Array.isArray(server.urls)) && [server.urls].flat().every((url: unknown) => typeof url === 'string' && /^(stun|stuns|turn|turns):/.test(url)))) throw new ApiError('Cấu hình ICE không hợp lệ.', 503);
        return json({ iceServers });
      }
      if (url.pathname === '/api/stats' && request.method === 'GET') return forward('stats', await actor(request, env));
      if (url.pathname === '/api/teachers' && request.method === 'GET') {
        const teachers = await listTeachers(env);
        const response = await room().fetch(new Request('http://internal/data/flower-counts'));
        if (!response.ok) throw new ApiError('Không tải được số hoa.', 503);
        const { counts } = await response.json() as { counts: Record<string, number> };
        return json({ teachers: teachers.map((teacher) => ({ ...teacher, flower_count: (teacher.flower_count || 0) + (typeof counts[teacher.id] === 'number' ? counts[teacher.id] : 0) })) });
      }
      const match = /^\/api\/(flowers|wishes|projector|memory-marks)(\/[^/]+)?$/.exec(url.pathname);
      if (match) {
        const resource = match[1]; const suffix = match[2] || '';
        const includeAll = url.searchParams.get('includeAll') === 'true';
        if (request.method === 'GET' && !suffix && resource !== 'flowers') return forward(`${resource}${includeAll ? '?includeAll=true' : ''}`, includeAll ? await actor(request, env) : null);
        if (request.method === 'POST' || request.method === 'PATCH') {
          const identity = await actor(request, env);
          if (!identity) throw new ApiError('Phiên không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.', 401);
          rateLimit(`${resource}:${identity.id}`, resource === 'projector' ? 180 : 30);
          const input = await body(request);
          if ((resource === 'flowers' && request.method === 'POST') || (resource === 'wishes' && request.method === 'POST' && input.teacherId)) {
            const id = resource === 'flowers' ? input.receiverId : input.teacherId;
            const teacher = (await listTeachers(env)).find((item) => item.id === id);
            if (!teacher) throw new ApiError('Giáo viên không còn trong danh sách nhận hoa và lời chúc.');
            input.teacherName = teacher.display_name;
          }
          return forward(`${resource}${suffix}`, identity, input);
        }
      }
      // Only actual application routes receive the shell. Missing CSS/JS/media
      // must never become cacheable HTML under their immutable asset URL.
      if (env.ASSETS && ['GET', 'HEAD'].includes(request.method) && ['/', '/login', '/classroom', '/admin'].includes(url.pathname)) {
        const response = await env.ASSETS.fetch(new Request(new URL('/', url), { method: request.method }));
        const headers = new Headers(response.headers);
        headers.set('Cache-Control', 'no-store');
        return new Response(response.body, { status: response.status, headers });
      }
      throw new ApiError('Không tìm thấy chức năng.', 404);
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'Không thể xử lý yêu cầu.' }, error instanceof ApiError || error instanceof StaffError ? error.status : 503);
    }
  },
};
