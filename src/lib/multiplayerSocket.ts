import { WSMessage, ClientMessageType, ServerMessageType } from '../../worker/types';
import { getSessionToken } from '../services/api';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

type MessageHandler = (payload: any) => void;

class MultiplayerSocket {
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private messageQueue: string[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 15;
  private reconnectTimer: any = null;
  private pingTimer: any = null;
  private currentRoomId = 'classroom_1';
  private currentToken = '';

  constructor() {
    // Singleton
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public on(type: string, handler: MessageHandler): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
    return () => {
      this.listeners.get(type)?.delete(handler);
    };
  }

  public connect(roomId: string = 'classroom_1', token: string = ''): void {
    this.currentRoomId = roomId;
    this.currentToken = token;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.updateStatus(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      let baseUrl = import.meta.env.VITE_MULTIPLAYER_SERVER_URL;
      if (!baseUrl) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        baseUrl = `${protocol}//${window.location.host}/ws`;
      } else {
        baseUrl = baseUrl.replace(/^http/, 'ws');
        if (!baseUrl.endsWith('/ws')) {
          baseUrl = `${baseUrl.replace(/\/+$/, '')}/ws`;
        }
      }

      const query = new URLSearchParams({
        roomId,
        token: token || '',
      });

      const fullUrl = `${baseUrl}?${query.toString()}`;
      this.ws = new WebSocket(fullUrl);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (err) {
      console.warn('[MultiplayerSocket] Lỗi tạo WebSocket:', err);
      this.scheduleReconnect();
    }
  }

  public disconnect(): void {
    this.clearTimers();
    this.reconnectAttempts = 0;
    this.messageQueue = [];
    if (this.ws) {
      // A late close from the previous socket must not stop a new connection.
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      try {
        this.ws.close(1000, 'User disconnect');
      } catch {}
      this.ws = null;
    }
    this.updateStatus('disconnected');
  }

  public send(type: ClientMessageType, payload?: any): void {
    // SDP and ICE describe a specific live connection and must never replay.
    if (type === 'screen:signal' && this.status !== 'connected') return;
    const msg: WSMessage = {
      type,
      payload,
      timestamp: Date.now(),
    };
    const json = JSON.stringify(msg);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(json);
      } catch (err) {
        console.warn('[MultiplayerSocket] Lỗi gửi message:', err);
        this.messageQueue.push(json);
      }
    } else {
      // Queue up to 50 latest messages while offline
      if (this.messageQueue.length > 50) this.messageQueue.shift();
      this.messageQueue.push(json);
    }
  }

  private handleOpen(): void {
    this.reconnectAttempts = 0;
    this.updateStatus('connected');

    // A fresh join (sent by the connected listener) contains the current state.
    // Do not replay movements or actions queued for an obsolete connection.
    this.messageQueue = [];

    // Start ping heartbeat every 10s
    this.startHeartbeat();
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : null;
      if (!data || !data.type) return;

      const handlers = this.listeners.get(data.type);
      if (handlers) {
        handlers.forEach((h) => {
          try {
            h(data.payload);
          } catch (e) {
            console.error(`[MultiplayerSocket] Handler lỗi cho ${data.type}:`, e);
          }
        });
      }
    } catch (err) {
      console.warn('[MultiplayerSocket] Lỗi parse tin nhắn:', err);
    }
  }

  private handleClose(event: CloseEvent): void {
    this.clearTimers();
    if (event.code !== 1000) {
      this.scheduleReconnect();
    } else {
      this.updateStatus('disconnected');
    }
  }

  private handleError(): void {
    // Rely on handleClose for reconnection
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateStatus('disconnected');
      return;
    }

    this.updateStatus('reconnecting');
    const delay = Math.min(10000, 1000 * Math.pow(1.5, this.reconnectAttempts));
    this.reconnectAttempts++;

    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect(this.currentRoomId, getSessionToken() || this.currentToken);
    }, delay);
  }

  private startHeartbeat(): void {
    clearInterval(this.pingTimer);
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send('ping', { timestamp: Date.now() });
      }
    }, 10000);
  }

  private clearTimers(): void {
    clearTimeout(this.reconnectTimer);
    clearInterval(this.pingTimer);
  }

  private updateStatus(newStatus: ConnectionStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((l) => l(newStatus));
    }
  }
}

export const multiplayerSocket = new MultiplayerSocket();

