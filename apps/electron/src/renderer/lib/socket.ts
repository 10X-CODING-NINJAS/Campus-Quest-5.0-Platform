import { io } from 'socket.io-client';

// M1: Configurable API base — falls back to localhost for dev
export const API_BASE = (window as any).__CQ_API_URL__ || import.meta.env.VITE_API_URL || 'https://campus-quest-backend-mspi.onrender.com';

/**
 * Single socket instance for the entire app lifetime.
 * Starts disconnected — connectSocket() is called after login with a valid JWT.
 */
export const socket = io(API_BASE, {
  transports: ['websocket'],
  autoConnect: false, // C4: Don't connect until we have a token
});

// Stores the JWT after login so workspace API calls can attach it
let _authToken: string | null = null;

export function getAuthToken(): string | null {
  return _authToken;
}

/**
 * Called after successful login.
 * Stores the JWT and connects/reconnects the socket with it.
 */
export function connectSocket(token: string): void {
  _authToken = token;
  (socket as any).auth = { token };
  if (socket.connected) {
    socket.disconnect();
  }
  socket.connect();
}
