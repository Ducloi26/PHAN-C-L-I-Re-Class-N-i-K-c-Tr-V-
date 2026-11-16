import { DurableObject } from 'cloudflare:workers';
import { RoomData } from './RoomData';
import { authorizeScreenSignal } from './screenSignal';
import { CLASSROOM_SEATS, SEAT_INTERACTION_DISTANCE, SEAT_DISTANCE_EPSILON } from '../src/lib/seatData';
import { normalizeAvatar } from '../src/lib/avatarPresets';
import { 
  PlayerNetworkState, 
  SeatOccupancyRecord, 
  WSMessage, 
  ClientMessageType 
} from './types';
import { AvatarCustomization, UserRole, ParticipantType, AvatarActivity } from '../src/types';

interface SessionData {
  identity?: { id: string; name: string; role: UserRole; type: ParticipantType };
  sessionId: string;
  displayName: string;
  role: UserRole;
  participantType: ParticipantType;
  avatar: AvatarCustomization;
  x: number;
  y: number;
  z: number;
  rotY: number;
  state: AvatarActivity;
  seatId: string | null;
  lastSeen: number;
  lastMoveTime: number;
}

export class ClassroomRoom extends DurableObject {
  private sessions: Map<WebSocket, SessionData> = new Map();
  private occupiedSeats: Map<string, SeatOccupancyRecord> = new Map();
  private data: RoomData;

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);
    this.data = new RoomData(ctx.storage, (event, payload) => this.broadcast(event, payload));

    // Initialize from persistent storage if available
    this.ctx.blockConcurrencyWhile(async () => {
      await this.data.migrate();
      // Durable Objects can hibernate while sockets remain connected.
      // Restore their players instead of waking up with an empty room.
      for (const ws of this.ctx.getWebSockets()) {
        const session = ws.deserializeAttachment() as SessionData | null;
        if (session?.sessionId) {
          session.role = session.identity?.role || 'member';
          this.sessions.set(ws, session);
        }
      }
      const storedSeats = await this.ctx.storage.get<Record<string, SeatOccupancyRecord>>('occupied_seats');
      if (storedSeats) {
        for (const [seatId, record] of Object.entries(storedSeats)) {
          if ([...this.sessions.values()].some((session) => session.sessionId === record.sessionId && session.seatId === seatId)) {
            this.occupiedSeats.set(seatId, record);
          }
        }
      }
      const projector = await this.data.projector();
      const presenter = projector.media?.payload.presenter_id;
      if (projector.media?.kind === 'screen' && presenter && ![...this.sessions.values()].some((session) => session.sessionId === presenter)) await this.data.stopScreen(presenter);
    });
  }

  /**
   * Handle incoming HTTP / WebSocket upgrade request
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/teachers-changed' && request.method === 'POST') {
      this.broadcast('teachers:updated', {});
      return new Response(JSON.stringify({ ok: true }));
    }

    if (url.pathname === '/revoke-staff' && request.method === 'POST') {
      const { id } = await request.json() as { id: string };
      for (const [ws, session] of this.sessions) {
        if (session.sessionId === id) {
          ws.close(1008, 'Quyền giáo viên đã thay đổi');
          await this.webSocketClose(ws, 1008, 'Access changed', true);
        }
      }
      return new Response(JSON.stringify({ ok: true }));
    }

    if (url.pathname === '/data/projector' && request.method === 'PATCH') {
      const input = await request.clone().json().catch(() => null) as { screen_start?: boolean } | null;
      const identity = JSON.parse(decodeURIComponent(request.headers.get('X-Classroom-Identity') || 'null'));
      if (input?.screen_start && ![...this.sessions.values()].some((session) => session.sessionId === identity?.id)) return new Response(JSON.stringify({ error: 'Vui lòng kết nối vào lớp trước khi chia sẻ màn hình.' }), { status: 409 });
    }
    const dataResponse = await this.data.handle(request);
    if (dataResponse) {
      // A disconnect may interleave with the awaited storage transaction.
      if (dataResponse.ok && url.pathname === '/data/projector' && request.method === 'PATCH') {
        const state = await this.data.projector();
        const owner = state.media?.payload.presenter_id;
        if (state.media?.kind === 'screen' && owner && ![...this.sessions.values()].some((session) => session.sessionId === owner)) await this.data.stopScreen(owner, state.media.payload.screen_session_id);
      }
      return dataResponse;
    }
    if (url.pathname === '/room-snapshot' && request.method === 'GET') {
      const players = [...this.sessions.values()].map((session) => this.sessionToPlayerState(session));
      return new Response(JSON.stringify({ roomId: 'classroom_1', onlineCount: players.length, players, seats: [...this.occupiedSeats.values()], projector: await this.data.projector(), memoryMarks: await this.data.marks() }), { headers: { 'Content-Type': 'application/json' } });
    }

    // WebSocket upgrade
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const identity = JSON.parse(decodeURIComponent(request.headers.get('X-Classroom-Identity') || 'null'));
    if (!identity?.id) return new Response('Unauthorized', { status: 401 });
    const webSocketPair = new WebSocketPair();
    const [clientWs, serverWs] = Object.values(webSocketPair);

    // Accept server-side WebSocket under Hibernation API
    this.ctx.acceptWebSocket(serverWs);
    serverWs.serializeAttachment({ identity });

    return new Response(null, {
      status: 101,
      webSocket: clientWs,
    });
  }

  /**
   * Hibernation API: Handle incoming WebSocket message
   */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      if ((typeof message === 'string' ? message.length : message.byteLength) > 16384) {
        this.sendTo(ws, 'error', { message: 'Gói tin vượt quá dung lượng cho phép.' }); return;
      }
      const rawText = typeof message === 'string' ? message : new TextDecoder().decode(message);
      const msg = JSON.parse(rawText) as WSMessage;
      if (!msg || !msg.type) return;

      const now = Date.now();
      const currentSession = this.sessions.get(ws);

      switch (msg.type as ClientMessageType) {
        case 'player:join': {
          const payload = msg.payload || {};
          const identity = ws.deserializeAttachment()?.identity as SessionData['identity'];
          if (!identity?.id) { ws.close(1008, 'Unauthorized'); return; }
          const sessionId = identity.id;
          const displayName = identity.name;
          const role = identity.role;
          const participantType = identity.type;
          const avatar = normalizeAvatar(payload.avatar);

          if (!sessionId) {
            this.sendTo(ws, 'error', { message: 'Thiếu sessionId' });
            return;
          }

          // Check if session previously connected with another ws (reconnect)
          for (const [existingWs, existingSession] of this.sessions.entries()) {
            if (existingSession.sessionId === sessionId && existingWs !== ws) {
              try { existingWs.close(1000, 'Replaced by new connection'); } catch {}
              this.sessions.delete(existingWs);
            }
          }

          for (const [seatId, lease] of this.occupiedSeats) {
            if (lease.sessionId === sessionId) {
              this.occupiedSeats.delete(seatId);
              this.broadcast('seat:occupancy_update', { seatId, isOccupied: false });
            }
          }
          await this.ctx.storage.put('occupied_seats', Object.fromEntries(this.occupiedSeats));

          // Spawn location: Teacher sits/stands at front, students spawn near entrance
          const isStaff = role === 'teacher' || role === 'admin';
          const spawnX = typeof payload.x === 'number' ? this.clamp(payload.x, -7.0, 7.0) : (isStaff ? -3.0 : -5.0 + Math.random() * 0.6);
          const spawnY = 0;
          const spawnZ = typeof payload.z === 'number' ? this.clamp(payload.z, -7.0, 7.0) : (isStaff ? -2.8 : 3.0 + Math.random() * 0.6);
          const spawnRotY = Number.isFinite(payload.rotY) ? payload.rotY : (isStaff ? 0 : Math.PI);

          const newSession: SessionData = {
            identity,
            sessionId,
            displayName,
            role,
            participantType,
            avatar,
            x: spawnX,
            y: spawnY,
            z: spawnZ,
            rotY: spawnRotY,
            state: 'standing',
            seatId: null,
            lastSeen: now,
            lastMoveTime: now,
          };

          this.sessions.set(ws, newSession);

          // 1. Send snapshot of current room to joining player
          const otherPlayers = Array.from(this.sessions.values())
            .filter(s => s.sessionId !== sessionId)
            .map(s => this.sessionToPlayerState(s));

          this.sendTo(ws, 'room:snapshot', {
            self: this.sessionToPlayerState(newSession),
            players: otherPlayers,
            seats: Array.from(this.occupiedSeats.values()),
            projector: await this.data.projector(),
          });

          // 2. Broadcast new player to all others
          this.broadcastExcept(ws, 'player:joined', this.sessionToPlayerState(newSession));

          // 3. Broadcast updated presence count
          this.broadcastPresence();
          break;
        }

        case 'player:move': {
          if (!currentSession) return;
          if (currentSession.seatId) return;
          const { x, y, z, rotY } = msg.payload || {};

          // Boundary validation (Classroom dimensions ~15m x 15m)
          const validX = this.clamp(Number(x) || 0, -6.65, 6.65);
          const validY = this.clamp(Number(y) || 0, 0, 2.5);
          const validZ = this.clamp(Number(z) || 0, -4.75, 4.75);
          const validRotY = Number.isFinite(Number(rotY)) ? Number(rotY) : 0;

          // Speed sanity check (max 6.5 m/s)
          const dt = Math.max(0.016, (now - currentSession.lastMoveTime) / 1000);
          const dx = validX - currentSession.x;
          const dz = validZ - currentSession.z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          const speed = distance / dt;

          if (speed > 7.0 && distance > 1.5) {
            // Unusually high speed jump - reject warp and reset
            this.sendTo(ws, 'player:moved', {
              id: currentSession.sessionId,
              x: currentSession.x,
              y: currentSession.y,
              z: currentSession.z,
              rotY: currentSession.rotY,
            });
            return;
          }

          currentSession.x = validX;
          currentSession.y = validY;
          currentSession.z = validZ;
          currentSession.rotY = validRotY;
          currentSession.lastSeen = now;
          currentSession.lastMoveTime = now;

          // Broadcast movement to all other clients
          this.broadcastExcept(ws, 'player:moved', {
            id: currentSession.sessionId,
            x: validX,
            y: validY,
            z: validZ,
            rotY: validRotY,
          });
          break;
        }

        case 'player:avatar_changed': {
          if (!currentSession || !msg.payload?.avatar) return;
          currentSession.avatar = normalizeAvatar(msg.payload.avatar);
          this.broadcastExcept(ws, 'player:avatar_updated', {
            id: currentSession.sessionId,
            avatar: currentSession.avatar,
          });
          break;
        }

        case 'player:state_changed': {
          if (!currentSession) return;
          const newState = msg.payload?.state;
          if (newState === 'standing' || newState === 'walking' || newState === 'gifting') {
            if (currentSession.seatId) return;
            currentSession.state = newState;
            this.broadcastExcept(ws, 'player:state_updated', {
              id: currentSession.sessionId,
              state: newState,
              seatId: currentSession.seatId,
            });
          }
          break;
        }

        case 'seat:request': {
          if (!currentSession) return;
          const seatId = String(msg.payload?.seatId || '').trim();
          if (!seatId) {
            this.sendTo(ws, 'seat:rejected', { seatId, reason: 'Mã ghế không hợp lệ' });
            return;
          }

          const seat = CLASSROOM_SEATS.find((item) => item.id === seatId);
          if (!seat || (seat.isTeacherSeat && currentSession.role === 'member') || Math.hypot(currentSession.x - seat.x, currentSession.z - seat.z) > SEAT_INTERACTION_DISTANCE + SEAT_DISTANCE_EPSILON) {
            this.sendTo(ws, 'seat:rejected', { seatId, reason: 'Ghế không hợp lệ, ngoài tầm với hoặc dành cho giáo viên.' });
            return;
          }

          // Atomic check: Is seat occupied?
          const existingOccupancy = this.occupiedSeats.get(seatId);
          if (existingOccupancy && existingOccupancy.sessionId !== currentSession.sessionId && (existingOccupancy.expiresAt > now || [...this.sessions.values()].some((session) => session.sessionId === existingOccupancy.sessionId))) {
            this.sendTo(ws, 'seat:rejected', {
              seatId,
              reason: `Ghế đang được ngồi bởi ${existingOccupancy.playerName}`,
            });
            return;
          }

          // Release any previous seat this player was holding
          if (currentSession.seatId && currentSession.seatId !== seatId) {
            this.occupiedSeats.delete(currentSession.seatId);
            this.broadcast('seat:occupancy_update', {
              seatId: currentSession.seatId,
              isOccupied: false,
            });
          }

          // Lease seat to this session for 30 minutes
          const record: SeatOccupancyRecord = {
            seatId,
            sessionId: currentSession.sessionId,
            playerName: currentSession.displayName,
            leasedAt: now,
            expiresAt: now + 30 * 60 * 1000,
          };

          this.occupiedSeats.set(seatId, record);
          currentSession.seatId = seatId;
          currentSession.state = 'sitting';
          currentSession.x = seat.seatAnchor.x;
          currentSession.z = seat.seatAnchor.z;
          currentSession.rotY = seat.seatAnchor.rotY;

          // Persist occupied seats to storage
          await this.ctx.storage.put('occupied_seats', Object.fromEntries(this.occupiedSeats));

          // Confirm to requester
          this.sendTo(ws, 'seat:confirmed', { seatId, record });

          // Broadcast occupancy to room
          this.broadcast('seat:occupancy_update', {
            seatId,
            record,
            isOccupied: true,
          });

          this.broadcast('player:moved', { id: currentSession.sessionId, x: currentSession.x, y: 0, z: currentSession.z, rotY: currentSession.rotY });
          // Broadcast state update
          this.broadcast('player:state_updated', {
            id: currentSession.sessionId,
            state: 'sitting',
            seatId,
          });
          break;
        }

        case 'seat:release': {
          if (!currentSession || !currentSession.seatId) return;
          const releasedSeatId = currentSession.seatId;
          this.occupiedSeats.delete(releasedSeatId);
          currentSession.seatId = null;
          currentSession.state = 'standing';
          const seat = CLASSROOM_SEATS.find((item) => item.id === releasedSeatId);
          if (seat) { currentSession.x = seat.standAnchor.x; currentSession.z = seat.standAnchor.z; }
          this.broadcast('player:moved', { id: currentSession.sessionId, x: currentSession.x, y: 0, z: currentSession.z, rotY: currentSession.rotY });

          await this.ctx.storage.put('occupied_seats', Object.fromEntries(this.occupiedSeats));

          this.broadcast('seat:occupancy_update', {
            seatId: releasedSeatId,
            isOccupied: false,
          });

          this.broadcast('player:state_updated', {
            id: currentSession.sessionId,
            state: 'standing',
            seatId: null,
          });
          break;
        }

        case 'screen:signal': {
          if (!currentSession) return;
          const input = authorizeScreenSignal(await this.data.projector(), currentSession.sessionId, currentSession.role, msg.payload);
          if (!input) { this.sendTo(ws, 'error', { message: 'Phiên chia sẻ hoặc quyền truyền màn hình không hợp lệ.' }); return; }
          for (const [target, session] of this.sessions) if (session.sessionId === input.toId) this.sendTo(target, 'screen:signal', input);
          break;
        }
        case 'projector:update': {
          if (!currentSession) return;
          const p = msg.payload || {};
          const response = await this.data.handle(new Request('http://internal/data/projector', {
            method: 'PATCH', headers: { 'X-Classroom-Identity': encodeURIComponent(JSON.stringify(currentSession.identity)) },
            body: JSON.stringify({ media_id: p.mediaId, is_playing: p.isPlaying, position_sec: p.positionSec, slide_index: p.slideIndex, mode: p.mode || 'presentation', retrospective_index: p.retrospectiveIndex || 0, retrospective_mark_id: p.retrospectiveMarkId || null }),
          }));
          if (response && !response.ok) this.sendTo(ws, 'error', await response.json());
          break;
        }
        case 'flower:send':
        case 'wish:broadcast': {
          this.sendTo(ws, 'error', { message: 'Chỉ phát thông báo sau khi đã lưu thành công qua API.' });
          break;
        }

        case 'ping': {
          if (currentSession) currentSession.lastSeen = now;
          this.sendTo(ws, 'pong', { timestamp: now });
          break;
        }
      }
    } catch (err: any) {
      console.error('Error handling WebSocket message:', err);
    } finally {
      const session = this.sessions.get(ws);
      if (session) ws.serializeAttachment(session);
    }
  }

  /**
   * Hibernation API: Handle WebSocket disconnection
   */
  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    // Complete the close handshake for both players and read-only observers.
    try { ws.close([1005, 1006, 1015].includes(code) ? 1000 : code, reason); } catch {}
    const session = this.sessions.get(ws);
    if (!session) return;

    // Free any seat held by this session immediately
    if (session.seatId && this.occupiedSeats.has(session.seatId)) {
      const seatId = session.seatId;
      this.occupiedSeats.delete(seatId);
      await this.ctx.storage.put('occupied_seats', Object.fromEntries(this.occupiedSeats));
      this.broadcast('seat:occupancy_update', {
        seatId,
        isOccupied: false,
      });
    }

    this.sessions.delete(ws);
    if (![...this.sessions.values()].some((other) => other.sessionId === session.sessionId)) await this.data.stopScreen(session.sessionId);

    // Broadcast player left event - no phantom avatars!
    this.broadcast('player:left', { id: session.sessionId });

    // Update presence
    this.broadcastPresence();
  }

  /**
   * Hibernation API: Handle WebSocket errors
   */
  async webSocketError(ws: WebSocket, error: unknown): Promise<void> {
    try {
      ws.close(1011, 'Internal WebSocket error');
    } catch {}
    await this.webSocketClose(ws, 1011, 'Error', false);
  }

  // --- Helper Methods ---

  private sessionToPlayerState(session: SessionData): PlayerNetworkState {
    return {
      id: session.sessionId,
      displayName: session.displayName,
      role: session.role,
      participantType: session.participantType,
      x: session.x,
      y: session.y,
      z: session.z,
      rotY: session.rotY,
      state: session.state,
      seatId: session.seatId,
      lastSeen: session.lastSeen,
      avatar: session.avatar,
    };
  }

  private sendTo(ws: WebSocket, type: any, payload: any) {
    try {
      ws.send(JSON.stringify({ type, payload, timestamp: Date.now() }));
    } catch {}
  }

  private broadcast(type: any, payload: any) {
    const data = JSON.stringify({ type, payload, timestamp: Date.now() });
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(data);
      } catch {}
    }
  }

  private broadcastExcept(excludedWs: WebSocket, type: any, payload: any) {
    const data = JSON.stringify({ type, payload, timestamp: Date.now() });
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== excludedWs) {
        try {
          ws.send(data);
        } catch {}
      }
    }
  }

  private broadcastPresence() {
    const players = Array.from(this.sessions.values()).map(s => ({
      id: s.sessionId,
      displayName: s.displayName,
      role: s.role,
      participantType: s.participantType,
      isStaff: s.role === 'teacher' || s.role === 'admin',
    }));

    this.broadcast('room:presence_update', {
      onlineCount: players.length,
      players,
    });
  }

  private clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, val));
  }
}

