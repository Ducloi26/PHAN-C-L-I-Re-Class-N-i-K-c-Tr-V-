import { useState, useEffect, useRef, useCallback } from 'react';
import { PlayerState, UserRole, ParticipantType, AvatarActivity, SeatInfo, FlowerType } from '../types';
import { CurrentUser, getSessionToken } from '../services/api';
import { getDefaultAvatar } from '../lib/avatarPresets';
import { ROOM_ID } from '../lib/room';
import { multiplayerSocket, ConnectionStatus } from '../lib/multiplayerSocket';
import { SeatOccupancyRecord } from '../../worker/types';

export interface FlowerGiftAnnouncement {
  senderName: string;
  teacherName: string;
  flowerType?: FlowerType;
  flowerName?: string;
  note?: string;
}

export interface WishAnnouncement {
  authorName: string;
  teacherName?: string;
  content: string;
}

export function useMultiplayer(
  currentUser: CurrentUser | null,
  onFlowerGiftReceived?: (info: FlowerGiftAnnouncement) => void,
  onWishReceived?: (info: WishAnnouncement) => void
) {
  // Initialize local player state
  const [localPlayer, setLocalPlayer] = useState<PlayerState>(() => {
    const isTeacher = currentUser?.role === 'teacher' || currentUser?.role === 'admin';
    const spawnX = isTeacher ? -3.0 : -5.2 + Math.random() * 0.8;
    const spawnZ = isTeacher ? -2.8 : 3.0 + Math.random() * 0.8;
    const spawnRotY = isTeacher ? 0 : Math.PI;

    return {
      id: currentUser?.id || 'gst_' + Math.random().toString(36).substring(2, 8),
      displayName: currentUser?.displayName || 'Khách tham quan',
      role: (currentUser?.role as UserRole) || 'member',
      participantType: (currentUser?.participantType as ParticipantType) || 'guest',
      x: spawnX,
      y: 0,
      z: spawnZ,
      rotY: spawnRotY,
      state: 'standing' as AvatarActivity,
      seatId: null,
      lastSeen: Date.now(),
      avatar: currentUser?.avatar || getDefaultAvatar(),
    };
  });

  const [remotePlayers, setRemotePlayers] = useState<PlayerState[]>([]);
  const [occupiedSeats, setOccupiedSeats] = useState<Map<string, SeatOccupancyRecord>>(new Map());
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting');

  const localPlayerRef = useRef(localPlayer);
  localPlayerRef.current = localPlayer;
  const seatRequestBusy = useRef(false);
  const cancelSeatRequest = useRef<(() => void) | null>(null);
  const [seatRequestPending, setSeatRequestPending] = useState(false);

  const lastSentPos = useRef({ x: localPlayer.x, z: localPlayer.z, rotY: localPlayer.rotY, state: localPlayer.state });
  const remotePlayersMap = useRef<Map<string, PlayerState>>(new Map());
  const isMounted = useRef(true);
  const localChannelRef = useRef<BroadcastChannel | null>(null);
  const callbacksRef = useRef({ onFlowerGiftReceived, onWishReceived });
  callbacksRef.current = { onFlowerGiftReceived, onWishReceived };

  // Sync state updater for LocalPlayerController
  const updateLocalPlayer = useCallback((updater: (prev: PlayerState) => PlayerState) => {
    setLocalPlayer((prev) => {
      const updated = updater(prev);
      updated.lastSeen = Date.now();
      localPlayerRef.current = updated;
      return updated;
    });
  }, []);

  // Update local avatar when currentUser avatar changes
  useEffect(() => {
    if (currentUser?.avatar) {
      updateLocalPlayer((prev) => ({
        ...prev,
        avatar: currentUser.avatar,
      }));
      // Immediately notify server of avatar change
      multiplayerSocket.send('player:avatar_changed', { avatar: currentUser.avatar });
    }
  }, [currentUser?.avatar, updateLocalPlayer]);

  // Broadcast flower gift celebration across all multiplayer clients
  const broadcastFlowerGift = useCallback((
    senderName: string, 
    teacherName: string,
    flowerType: FlowerType = 'rose',
    flowerName = 'Hoa Hồng Đỏ',
    note = ''
  ) => {
    // 1. Send via Real Multiplayer WebSocket
    multiplayerSocket.send('flower:send' as any, { 
      senderName, 
      teacherName,
      flowerType,
      flowerName,
      note,
    });

    // 2. Local tab fallback
    if (multiplayerSocket.getStatus() !== 'connected' && localChannelRef.current) {
      localChannelRef.current.postMessage({
        type: 'flower_gift',
        senderName,
        teacherName,
        flowerType,
        flowerName,
        note,
      });
    }
  }, []);

  // Broadcast wish announcement across all multiplayer clients
  const broadcastWish = useCallback((authorName: string, teacherName: string, content: string) => {
    multiplayerSocket.send('wish:broadcast' as any, { authorName, teacherName, content });

    if (multiplayerSocket.getStatus() !== 'connected' && localChannelRef.current) {
      localChannelRef.current.postMessage({
        type: 'wish_new',
        authorName,
        teacherName,
        content,
      });
    }
  }, []);

  // Request to sit on a chair (Atomic server check)
  const requestSeat = useCallback((seat: SeatInfo): Promise<boolean> => {
    return new Promise((resolve) => {
      if (seatRequestBusy.current) { resolve(false); return; }
      if (multiplayerSocket.getStatus() !== 'connected') {
        // A seat is occupied only after the server confirms it.
        alert('Chưa kết nối với lớp học. Vui lòng đợi kết nối lại rồi chọn ghế.');
        resolve(false);
        return;
      }
      seatRequestBusy.current = true;
      setSeatRequestPending(true);

      const timeout = setTimeout(() => {
        cleanup();
        alert('Chưa nhận được xác nhận ghế. Vui lòng kiểm tra kết nối trước khi thử lại.');
        resolve(false);
      }, 5000);

      const unbindConfirm = multiplayerSocket.on('seat:confirmed', (payload) => {
        if (payload?.seatId === seat.id) {
          cleanup();
          resolve(true);
        }
      });

      const unbindReject = multiplayerSocket.on('seat:rejected', (payload) => {
        if (payload?.seatId === seat.id) {
          cleanup();
          alert(payload.reason || 'Ghế đã có người ngồi!');
          resolve(false);
        }
      });

      function cleanup() {
        clearTimeout(timeout);
        unbindConfirm();
        unbindReject();
        seatRequestBusy.current = false;
        cancelSeatRequest.current = null;
        if (isMounted.current) setSeatRequestPending(false);
      }
      cancelSeatRequest.current = () => { cleanup(); resolve(false); };

      // WebSocket preserves message order. Flush the latest position before
      // asking for a seat instead of waiting for the 120ms movement timer.
      const player = localPlayerRef.current;
      multiplayerSocket.send('player:move', { x: player.x, y: player.y, z: player.z, rotY: player.rotY });
      multiplayerSocket.send('seat:request', { seatId: seat.id });
    });
  }, []);

  // Release currently occupied seat
  const releaseSeat = useCallback(() => {
    multiplayerSocket.send('seat:release');
  }, []);

  useEffect(() => {
    isMounted.current = true;
    const playerId = localPlayerRef.current.id;
    const token = getSessionToken();

    // Rejoin after every successful connection, including network reconnects.
    const joinRoom = () => {
      const player = localPlayerRef.current;
      multiplayerSocket.send('player:join', {
        sessionId: player.id,
        displayName: player.displayName,
        role: player.role,
        participantType: player.participantType,
        avatar: player.avatar,
        x: player.x, y: player.y, z: player.z, rotY: player.rotY,
      });
    };

    // Helper to add/update remote player
    const handleRemotePlayerUpdate = (player: PlayerState) => {
      if (!isMounted.current || player.id === playerId) return;
      remotePlayersMap.current.set(player.id, {
        ...player,
        lastSeen: Date.now(),
      });
      setRemotePlayers(Array.from(remotePlayersMap.current.values()));
    };

    const handleRemotePlayerLeft = (leftPlayerId: string) => {
      if (!isMounted.current) return;
      remotePlayersMap.current.delete(leftPlayerId);
      setRemotePlayers(Array.from(remotePlayersMap.current.values()));
    };

    // 1. REAL WEBSOCKET MULTIPLAYER LISTENERS
    const unbindSnapshot = multiplayerSocket.on('room:snapshot', (payload) => {
      if (!isMounted.current || !payload) return;
      if (Array.isArray(payload.players)) {
        remotePlayersMap.current.clear();
        for (const p of payload.players) {
          if (p.id !== playerId) {
            remotePlayersMap.current.set(p.id, { ...p, lastSeen: Date.now() });
          }
        }
        setRemotePlayers(Array.from(remotePlayersMap.current.values()));
      }
      if (Array.isArray(payload.seats)) {
        const seatMap = new Map<string, SeatOccupancyRecord>();
        for (const s of payload.seats) {
          seatMap.set(s.seatId, s);
        }
        setOccupiedSeats(seatMap);
      }
    });

    const unbindPlayerJoined = multiplayerSocket.on('player:joined', (player: PlayerState) => {
      if (player && player.id !== playerId) {
        handleRemotePlayerUpdate(player);
      }
    });

    const unbindPlayerMoved = multiplayerSocket.on('player:moved', (data: { id: string; x: number; y: number; z: number; rotY: number }) => {
      if (!data) return;
      if (data.id === playerId) {
        updateLocalPlayer((prev) => ({ ...prev, x: data.x, y: data.y, z: data.z, rotY: data.rotY }));
        return;
      }
      const existing = remotePlayersMap.current.get(data.id);
      if (existing) {
        existing.x = data.x;
        existing.y = data.y;
        existing.z = data.z;
        existing.rotY = data.rotY;
        existing.lastSeen = Date.now();
        // Trigger re-render with updated coords for Avatar3D lerp
        setRemotePlayers(Array.from(remotePlayersMap.current.values()));
      }
    });

    const unbindAvatarUpdated = multiplayerSocket.on('player:avatar_updated', (data: { id: string; avatar: any }) => {
      if (!data || data.id === playerId) return;
      const existing = remotePlayersMap.current.get(data.id);
      if (existing && data.avatar) {
        existing.avatar = data.avatar;
        setRemotePlayers(Array.from(remotePlayersMap.current.values()));
      }
    });

    const unbindStateUpdated = multiplayerSocket.on('player:state_updated', (data: { id: string; state: AvatarActivity; seatId?: string | null }) => {
      if (!data) return;
      if (data.id === playerId) {
        updateLocalPlayer((prev) => ({ ...prev, state: data.state, ...(data.seatId !== undefined ? { seatId: data.seatId } : {}) }));
        return;
      }
      const existing = remotePlayersMap.current.get(data.id);
      if (existing) {
        existing.state = data.state;
        if (data.seatId !== undefined) existing.seatId = data.seatId;
        setRemotePlayers(Array.from(remotePlayersMap.current.values()));
      }
    });

    const unbindPlayerLeft = multiplayerSocket.on('player:left', (data: { id: string }) => {
      if (data?.id) handleRemotePlayerLeft(data.id);
    });

    const unbindSeatOccupancy = multiplayerSocket.on('seat:occupancy_update', (data: { seatId: string; record?: SeatOccupancyRecord; isOccupied: boolean }) => {
      if (!data?.seatId) return;
      setOccupiedSeats((prev) => {
        const next = new Map(prev);
        if (data.isOccupied && data.record) {
          next.set(data.seatId, data.record);
        } else {
          next.delete(data.seatId);
        }
        return next;
      });
    });

    const unbindFlowerAnnounced = multiplayerSocket.on('flower:announced', (payload: any) => {
      if (payload?.senderId === playerId) return;
      if (payload && callbacksRef.current.onFlowerGiftReceived) {
        callbacksRef.current.onFlowerGiftReceived({
          senderName: payload.senderName, 
          teacherName: payload.teacherName,
          flowerType: payload.flowerType,
          flowerName: payload.flowerName,
          note: payload.note,
        });
      }
    });

    const unbindWishAnnounced = multiplayerSocket.on('wish:announced', (payload: any) => {
      if (payload?.authorId === playerId) return;
      if (payload && callbacksRef.current.onWishReceived) {
        callbacksRef.current.onWishReceived({
          authorName: payload.authorName,
          teacherName: payload.teacherName,
          content: payload.content,
        });
      }
    });

    // 2. BROWSER BROADCAST CHANNEL (Fallback for multi-tab testing)
    let localChannel: BroadcastChannel | null = null;
    try {
      localChannel = new BroadcastChannel('classroom_multiplayer_channel');
      localChannelRef.current = localChannel;
      localChannel.onmessage = (event) => {
        if (multiplayerSocket.getStatus() === 'connected') return;
        const { type, player, playerId: leftId, senderName, teacherName, flowerType, flowerName, note, authorName, content } = event.data || {};
        if (type === 'player_hello') {
          localChannel?.postMessage({ type: 'player_update', player: localPlayerRef.current });
        } else if (type === 'player_update' && player) {
          handleRemotePlayerUpdate(player);
        } else if (type === 'player_leave' && leftId) {
          handleRemotePlayerLeft(leftId);
        } else if (type === 'flower_gift' && callbacksRef.current.onFlowerGiftReceived) {
          callbacksRef.current.onFlowerGiftReceived({ senderName, teacherName, flowerType, flowerName, note });
        } else if (type === 'wish_new' && callbacksRef.current.onWishReceived) {
          callbacksRef.current.onWishReceived({ authorName, teacherName, content });
        }
      };
      localChannel.postMessage({ type: 'player_hello' });
      localChannel.postMessage({ type: 'player_update', player: localPlayerRef.current });
    } catch {
      // BroadcastChannel unavailable
    }

    // Install listeners before opening the connection so the snapshot is never lost.
    const unbindStatus = multiplayerSocket.onStatusChange((status) => {
      if (!isMounted.current) return;
      setConnectionStatus(status);
      if (status === 'connected') joinRoom();
      else {
        remotePlayersMap.current.clear();
        setRemotePlayers([]);
      }
    });
    multiplayerSocket.connect(ROOM_ID, token);

    // 3. OPTIMIZED REALTIME SEND LOOP (~8 Hz / 120ms with delta filtering)
    let lastLocalHeartbeat = 0;
    const broadcastInterval = setInterval(() => {
      const now = Date.now();
      const p = localPlayerRef.current;
      p.lastSeen = now;

      // Calculate movement delta to prevent redundant packet floods
      const dx = Math.abs(p.x - lastSentPos.current.x);
      const dz = Math.abs(p.z - lastSentPos.current.z);
      const dRot = Math.abs(p.rotY - lastSentPos.current.rotY);
      const stateChanged = p.state !== lastSentPos.current.state;

      const hasMeaningfulMove = dx > 0.03 || dz > 0.03 || dRot > 0.04 || stateChanged;

      if (hasMeaningfulMove && multiplayerSocket.getStatus() === 'connected') {
        lastSentPos.current = { x: p.x, z: p.z, rotY: p.rotY, state: p.state };

        // Send movement to real WebSocket server
        multiplayerSocket.send('player:move', {
          x: p.x,
          y: p.y,
          z: p.z,
          rotY: p.rotY,
        });

        if (stateChanged) {
          multiplayerSocket.send('player:state_changed', {
            state: p.state,
          });
        }

      }

      // Local fallback needs heartbeats even when both visitors stand still.
      // WebSocket players leave only when the server announces disconnection.
      if (multiplayerSocket.getStatus() === 'connected') return;
      if (localChannel && (hasMeaningfulMove || now - lastLocalHeartbeat >= 3000)) {
        localChannel.postMessage({ type: 'player_update', player: p });
        lastLocalHeartbeat = now;
        lastSentPos.current = { x: p.x, z: p.z, rotY: p.rotY, state: p.state };
      }

      // Prune only inactive local fallback peers.
      let hasPruned = false;
      for (const [id, r] of remotePlayersMap.current.entries()) {
        if (now - r.lastSeen > 12000) {
          remotePlayersMap.current.delete(id);
          hasPruned = true;
        }
      }
      if (hasPruned && isMounted.current) {
        setRemotePlayers(Array.from(remotePlayersMap.current.values()));
      }
    }, 120);

    return () => {
      isMounted.current = false;
      cancelSeatRequest.current?.();
      clearInterval(broadcastInterval);
      unbindStatus();
      unbindSnapshot();
      unbindPlayerJoined();
      unbindPlayerMoved();
      unbindAvatarUpdated();
      unbindStateUpdated();
      unbindPlayerLeft();
      unbindSeatOccupancy();
      unbindFlowerAnnounced();
      unbindWishAnnounced();
      if (localChannel) {
        localChannel.postMessage({ type: 'player_leave', playerId });
        localChannel.close();
      }
      multiplayerSocket.disconnect();
      remotePlayersMap.current.clear();
      localChannelRef.current = null;
    };
  }, [currentUser?.id]);

  return {
    localPlayer,
    remotePlayers,
    occupiedSeats,
    connectionStatus,
    seatRequestPending,
    updateLocalPlayer,
    broadcastFlowerGift,
    broadcastWish,
    requestSeat,
    releaseSeat,
  };
}
