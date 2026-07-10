import { io, Socket } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

let _socket: Socket | null = null;
const connectionListeners = new Set<(online: boolean) => void>();

export function onConnectionChange(cb: (online: boolean) => void) {
  connectionListeners.add(cb);
  if (_socket) {
    cb(_socket.connected);
  }
  return () => connectionListeners.delete(cb);
}

function notifyListeners(online: boolean) {
  connectionListeners.forEach(cb => cb(online));
}

export function getSocket(): Socket {
  if (!_socket) {
    const token = localStorage.getItem('auth_token');
    const socketOptions = {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      ...(token ? { auth: { token } } : {}),
    };

    _socket = io(BACKEND_URL, socketOptions);

    _socket.on('connect', () => {
      console.log('[Socket] Connected:', _socket?.id);
      notifyListeners(true);
    });

    _socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      notifyListeners(false);
    });

    _socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      notifyListeners(false);
    });
  }
  return _socket;
}

/**
 * Re-initialize the socket with a new auth token (after login).
 * Call this after the user logs in.
 */
export function reconnectSocket(token: string): Socket {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
  localStorage.setItem('auth_token', token);
  return getSocket();
}

// Backwards-compatible singleton export
export const socket = new Proxy({} as Socket, {
  get(_target, prop) {
    return (getSocket() as any)[prop];
  },
});
