import { io } from 'socket.io-client';
// M1: Configurable API base — falls back to localhost for dev
export const API_BASE = window.__CQ_API_URL__ || 'http://localhost:3001';
/**
 * Single socket instance for the entire app lifetime.
 * Starts disconnected — connectSocket() is called after login with a valid JWT.
 */
export const socket = io(API_BASE, {
    transports: ['websocket'],
    autoConnect: false, // C4: Don't connect until we have a token
});
// Stores the JWT after login so workspace API calls can attach it
let _authToken = null;
export function getAuthToken() {
    return _authToken;
}
/**
 * Called after successful login.
 * Stores the JWT and connects/reconnects the socket with it.
 */
export function connectSocket(token) {
    _authToken = token;
    socket.auth = { token };
    if (socket.connected) {
        socket.disconnect();
    }
    socket.connect();
}
//# sourceMappingURL=socket.js.map