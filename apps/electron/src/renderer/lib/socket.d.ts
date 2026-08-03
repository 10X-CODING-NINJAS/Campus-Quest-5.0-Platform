export declare const API_BASE: any;
/**
 * Single socket instance for the entire app lifetime.
 * Starts disconnected — connectSocket() is called after login with a valid JWT.
 */
export declare const socket: import("socket.io-client").Socket<import("@socket.io/component-emitter").DefaultEventsMap, import("@socket.io/component-emitter").DefaultEventsMap>;
export declare function getAuthToken(): string | null;
/**
 * Called after successful login.
 * Stores the JWT and connects/reconnects the socket with it.
 */
export declare function connectSocket(token: string): void;
//# sourceMappingURL=socket.d.ts.map