import type { FlowerGift, MemoryMark, ModerationStatus, ProjectorState, UserRole, Wish } from '../src/types';
import { FLOWER_TYPES } from '../src/types';
import { MEDIA_LIBRARY } from '../src/lib/mediaLibrary';
import { parseYouTubeLink } from '../src/lib/projectorMedia';

export interface RoomActor { id: string; name: string; role: UserRole; type: 'student' | 'guest' }
export class RoomError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const staff = (actor: RoomActor | null) => actor?.role === 'teacher' || actor?.role === 'admin';
const requireActor = (actor: RoomActor | null) => { if (!actor) throw new RoomError('Phiên đăng nhập không hợp lệ.', 401); return actor; };
const requireStaff = (actor: RoomActor | null) => { requireActor(actor); if (!staff(actor)) throw new RoomError('Chỉ giáo viên và quản trị viên có quyền thực hiện.', 403); };
const identifier = () => `${Date.now()}-${crypto.randomUUID()}`;

export class RoomData {
  constructor(private storage: DurableObjectStorage, private broadcast: (event: string, data: unknown) => void) {}

  async migrate() {
    if (await this.storage.get('room_data_v2')) return;
    const marks = await this.storage.get<MemoryMark[]>('memory_marks') || [];
    for (const mark of marks) if (!await this.storage.get(`memory:${mark.id}`)) await this.storage.put(`memory:${mark.id}`, mark);
    // Keep the existing room's projector selection when upgrading storage.
    const old = await this.storage.get<any>('projector_state');
    if (old && !await this.storage.get('projector_v2')) await this.storage.put('projector_v2', {
      id: 1, media_id: old.media_id ?? old.mediaId ?? MEDIA_LIBRARY[0].id,
      is_playing: old.is_playing ?? old.isPlaying ?? true, position_sec: old.position_sec ?? old.positionSec ?? 0,
      slide_index: old.slide_index ?? old.slideIndex ?? 0, mode: old.mode || 'presentation',
      retrospective_index: old.retrospective_index ?? old.retrospectiveIndex ?? 0,
      retrospective_mark_id: old.retrospective_mark_id ?? old.retrospectiveMarkId ?? null,
      updated_at: old.updated_at || old.updatedAt || new Date().toISOString(),
    });
    await this.storage.put('room_data_v2', true);
  }

  async projector(): Promise<ProjectorState> {
    const stored = await this.storage.get<ProjectorState>('projector_v2');
    const state: ProjectorState = stored || { id: 1, media_id: MEDIA_LIBRARY[0].id, is_playing: true, position_sec: 0, slide_index: 0, mode: 'presentation', retrospective_index: 0, updated_at: new Date(0).toISOString() };
    return { ...state, server_time: Date.now(), media: state.media?.id === state.media_id && ['youtube', 'screen'].includes(state.media.kind) ? state.media : MEDIA_LIBRARY.find((media) => media.id === state.media_id) || null };
  }

  async stopScreen(presenterId: string, sessionId?: string) {
    let changed = false;
    await this.storage.transaction(async (txn) => {
      const state = await txn.get<ProjectorState>('projector_v2');
      if (state?.media?.kind !== 'screen' || state.media.payload.presenter_id !== presenterId || (sessionId && state.media.payload.screen_session_id !== sessionId)) return;
      const fallback = state.media.payload.return_media_id || MEDIA_LIBRARY[0].id;
      await txn.put('projector_v2', { id: 1, media_id: fallback, is_playing: true, position_sec: 0, slide_index: 0, mode: 'presentation', revision: (state.revision || 0) + 1, updated_at: new Date().toISOString() });
      changed = true;
    });
    if (changed) this.broadcast('projector:state_updated', await this.projector());
  }

  async marks(includeAll = false): Promise<MemoryMark[]> {
    const rows = [...(await this.storage.list<MemoryMark>({ prefix: 'memory:', limit: 500, reverse: true })).values()];
    return rows.filter((mark) => includeAll || mark.moderation_status === 'approved').sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async handle(request: Request): Promise<Response | null> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/data/')) return null;
    try {
      const actor = JSON.parse(decodeURIComponent(request.headers.get('X-Classroom-Identity') || 'null')) as RoomActor | null;
      const path = url.pathname.slice(6);
      const includeAll = url.searchParams.get('includeAll') === 'true';
      if (includeAll) requireStaff(actor);
      if (path === 'stats' && request.method === 'GET') {
        requireStaff(actor);
        const counts = await this.storage.list<number>({ prefix: 'flower-count:' });
        const wishes = await this.storage.list<Wish>({ prefix: 'wish:', limit: 500 });
        return reply({ flowers: [...counts.values()].reduce((sum, count) => sum + count, 0), wishes: wishes.size, visibleWishes: [...wishes.values()].filter((wish) => !wish.is_hidden).length, memories: (await this.marks(true)).length });
      }
      if (path === 'flower-counts' && request.method === 'GET') {
        const counts = Object.fromEntries([...(await this.storage.list<number>({ prefix: 'flower-count:' })).entries()].map(([key, value]) => [key.slice(13), value]));
        return reply({ counts });
      }
      if (path === 'flowers' && request.method === 'POST') {
        const sender = requireActor(actor);
        const input = await request.json() as Record<string, any>;
        if (!input.receiverId || !input.teacherName) throw new RoomError('Giáo viên nhận hoa không hợp lệ.');
        const flower = typeof input.flowerType === 'string' && Object.hasOwn(FLOWER_TYPES, input.flowerType)
          ? FLOWER_TYPES[input.flowerType as keyof typeof FLOWER_TYPES] : null;
        if (!flower) throw new RoomError('Loại hoa không hợp lệ.');
        const note = String(input.note || '').trim();
        if (note.length > 120) throw new RoomError('Lời nhắn tặng hoa tối đa 120 ký tự.');
        const key = `gift:${sender.id}:${input.receiverId}`;
        const gift: FlowerGift = { id: identifier(), sender_id: sender.id, receiver_id: input.receiverId, flower_type: flower.id, flower_name: flower.name, note, created_at: new Date().toISOString() };
        await this.storage.transaction(async (txn) => {
          if (await txn.get(key)) throw new RoomError('Bạn đã tặng hoa cho Thầy/Cô này rồi. Mỗi người chỉ gửi một đóa hoa.', 409);
          const countKey = `flower-count:${input.receiverId}`;
          const count = await txn.get<number>(countKey) || 0;
          await txn.put({ [key]: gift, [countKey]: count + 1 });
        });
        this.broadcast('flower:announced', { id: gift.id, senderId: sender.id, senderName: sender.name, receiverId: gift.receiver_id, teacherName: input.teacherName, flowerType: flower.id, flowerName: flower.name, note });
        return reply({ ok: true, gift });
      }
      if (path === 'wishes' && request.method === 'GET') {
        const wishes = [...(await this.storage.list<Wish>({ prefix: 'wish:', reverse: true, limit: 500 })).values()].filter((wish) => includeAll || !wish.is_hidden).sort((a, b) => b.created_at.localeCompare(a.created_at));
        return reply({ wishes });
      }
      if (path === 'wishes' && request.method === 'POST') {
        const author = requireActor(actor);
        const input = await request.json() as Record<string, any>;
        const content = String(input.content || '').trim();
        if (content.length < 5 || content.length > 500) throw new RoomError('Lời chúc phải từ 5 đến 500 ký tự.');
        const wish: Wish = { id: identifier(), author_id: author.id, author_name: author.name, teacher_id: input.teacherId || null, teacher_name: input.teacherName || null, content, is_hidden: false, created_at: new Date().toISOString() };
        await this.storage.transaction(async (txn) => {
          const last = await txn.get<number>(`wish-last:${author.id}`) || 0;
          if (Date.now() - last < 8000) throw new RoomError('Vui lòng chờ 8 giây trước khi gửi lời chúc tiếp theo.', 429);
          await txn.put({ [`wish:${wish.id}`]: wish, [`wish-last:${author.id}`]: Date.now() });
        });
        this.broadcast('wish:announced', { id: wish.id, authorId: author.id, authorName: author.name, teacherName: wish.teacher_name, content });
        return reply({ ok: true, wish });
      }
      if (path.startsWith('wishes/') && request.method === 'PATCH') {
        requireStaff(actor);
        const key = `wish:${decodeURIComponent(path.slice(7))}`;
        const input = await request.json() as { is_hidden: boolean };
        if (typeof input.is_hidden !== 'boolean') throw new RoomError('Trạng thái lưu bút không hợp lệ.');
        const wish = await this.storage.get<Wish>(key);
        if (!wish) throw new RoomError('Không tìm thấy lời chúc.', 404);
        wish.is_hidden = input.is_hidden;
        await this.storage.put(key, wish);
        this.broadcast('wish:updated', { id: wish.id, is_hidden: wish.is_hidden });
        return reply({ ok: true, wish });
      }
      if (path === 'projector' && request.method === 'GET') return reply({ projector: await this.projector() });
      if (path === 'projector' && request.method === 'PATCH') {
        requireStaff(actor);
        const input = await request.json() as Partial<ProjectorState> & { youtube_url?: string; title?: string; screen_start?: boolean; has_audio?: boolean; screen_stop?: string; expected_revision?: number };
        const current = await this.projector();
        const allowed = ['media_id', 'is_playing', 'position_sec', 'slide_index', 'mode', 'retrospective_index', 'retrospective_mark_id'] as const;
        const state = { ...current, id: 1, updated_at: new Date().toISOString(), controller_id: actor!.id } as ProjectorState;
        for (const key of allowed) if (input[key] !== undefined) (state as any)[key] = input[key];
        if (input.youtube_url !== undefined) {
          if (typeof input.youtube_url !== 'string') throw new RoomError('Link YouTube không hợp lệ.');
          const video = parseYouTubeLink(input.youtube_url);
          if (!video) throw new RoomError('Hãy dán link YouTube hợp lệ (watch, youtu.be, Shorts hoặc live).');
          state.media_id = `youtube:${video.id}`;
          state.media = { id: state.media_id, kind: 'youtube', title: String(input.title || 'Video YouTube').trim().slice(0, 120), payload: { youtube_id: video.id }, created_at: state.updated_at };
          state.mode = 'presentation'; state.position_sec = video.start; state.is_playing = true; state.slide_index = 0;
        } else if (input.screen_start === true) {
          const session = crypto.randomUUID();
          state.media_id = `screen:${session}`;
          state.media = { id: state.media_id, kind: 'screen', title: `Màn hình của ${actor!.name}`, payload: { screen_session_id: session, presenter_id: actor!.id, has_audio: input.has_audio === true, return_media_id: MEDIA_LIBRARY.some((item) => item.id === current.media_id) ? current.media_id! : MEDIA_LIBRARY[0].id }, created_at: state.updated_at };
          state.mode = 'presentation'; state.position_sec = 0; state.is_playing = true; state.slide_index = 0;
        } else if (input.screen_stop !== undefined) {
          if (current.media?.kind !== 'screen' || current.media.payload.screen_session_id !== input.screen_stop) throw new RoomError('Phiên chia sẻ đã thay đổi.', 409);
          state.media_id = current.media.payload.return_media_id || MEDIA_LIBRARY[0].id;
          state.media = null; state.position_sec = 0; state.is_playing = true; state.slide_index = 0;
        } else if (state.media_id !== current.media_id) state.media = null;
        if (state.mode === 'retrospective' && ['youtube', 'screen'].includes(state.media?.kind || '')) {
          state.media_id = MEDIA_LIBRARY[0].id; state.media = null; state.position_sec = 0; state.slide_index = 0;
        }
        const media = state.media?.id === state.media_id ? state.media : MEDIA_LIBRARY.find((item) => item.id === state.media_id);
        if (!media) throw new RoomError('Tài liệu máy chiếu không hợp lệ.');
        if (typeof state.is_playing !== 'boolean' || !Number.isFinite(state.position_sec) || state.position_sec < 0 || state.position_sec > 86400 || !Number.isInteger(state.slide_index) || state.slide_index < 0) throw new RoomError('Trạng thái máy chiếu không hợp lệ.');
        const slideCount = media.kind === 'slide' ? media.payload.slides?.length || 1 : 1;
        if (state.slide_index >= slideCount) throw new RoomError('Số slide không hợp lệ.');
        if (!['presentation', 'retrospective'].includes(state.mode || '')) throw new RoomError('Chế độ máy chiếu không hợp lệ.');
        if (state.mode === 'retrospective') {
          const marks = await this.marks();
          if (!marks.length) throw new RoomError('Chưa có dấu ấn để trình chiếu.');
          if (!Number.isInteger(state.retrospective_index) || (state.retrospective_index || 0) < 0) throw new RoomError('Vị trí dấu ấn không hợp lệ.');
          state.retrospective_index = (state.retrospective_index || 0) % marks.length;
          const mark = state.retrospective_mark_id ? marks.find((item) => item.id === state.retrospective_mark_id) : marks[state.retrospective_index];
          if (!mark) throw new RoomError('Dấu ấn này không còn được hiển thị.');
          state.retrospective_mark_id = mark.id;
        } else state.retrospective_mark_id = null;
        if (media.kind !== 'youtube' && media.kind !== 'screen') delete state.media;
        delete state.server_time;
        await this.storage.transaction(async (txn) => {
          const previous = await txn.get<ProjectorState>('projector_v2');
          if ((previous?.revision || 0) !== (input.expected_revision ?? current.revision ?? 0)) throw new RoomError('Máy chiếu đã thay đổi. Vui lòng thao tác lại.', 409);
          state.revision = (previous?.revision || 0) + 1;
          await txn.put('projector_v2', state);
        });
        const projector = await this.projector();
        this.broadcast('projector:state_updated', projector);
        return reply({ ok: true, projector });
      }
      if (path === 'memory-marks' && request.method === 'GET') return reply({ marks: await this.marks(includeAll) });
      if (path === 'memory-marks' && request.method === 'POST') {
        const author = requireActor(actor);
        const input = await request.json() as Record<string, any>;
        const name = String(input.displayName || author.name).trim();
        const message = String(input.message || '').trim();
        if (name.length < 2 || name.length > 50 || message.length < 5 || message.length > 300) throw new RoomError('Tên phải từ 2–50 ký tự, lời nhắn từ 5–300 ký tự.');
        if (!['heart', 'sunflower', 'rose', 'star', 'book', 'grad_cap'].includes(input.symbol) || !/^#[0-9a-f]{6}$/i.test(input.cardColor || '')) throw new RoomError('Biểu tượng hoặc màu thẻ không hợp lệ.');
        const mark: MemoryMark = { id: identifier(), room_id: 'classroom_1', session_id: author.id, display_name: name, symbol: input.symbol, card_color: input.cardColor, message, moderation_status: 'approved', created_at: new Date().toISOString(), approved_at: new Date().toISOString() };
        await this.storage.put(`memory:${mark.id}`, mark);
        this.broadcast('memory_mark:added', mark);
        return reply({ ok: true, mark });
      }
      if (path.startsWith('memory-marks/') && request.method === 'PATCH') {
        requireStaff(actor);
        const id = decodeURIComponent(path.slice(13));
        const input = await request.json() as { moderation_status: ModerationStatus };
        if (!['pending', 'approved', 'hidden', 'rejected'].includes(input.moderation_status)) throw new RoomError('Trạng thái dấu ấn không hợp lệ.');
        const mark = await this.storage.get<MemoryMark>(`memory:${id}`);
        if (!mark) throw new RoomError('Không tìm thấy dấu ấn.', 404);
        mark.moderation_status = input.moderation_status;
        await this.storage.put(`memory:${id}`, mark);
        this.broadcast('memory_mark:updated', { id, status: mark.moderation_status });
        return reply({ ok: true, mark });
      }
      return reply({ error: 'Không tìm thấy chức năng.' }, 404);
    } catch (error) {
      return reply({ error: error instanceof RoomError ? error.message : 'Không thể lưu dữ liệu lúc này. Vui lòng thử lại.' }, error instanceof RoomError ? error.status : 503);
    }
  }
}
