// Placeholder socket until socket.io-client is fully integrated
export const socket = {
  emit: (event: string, payload: any) => {
    console.log(`[Socket emit]: ${event}`, payload);
  },
  on: (event: string, callback: Function) => {
    console.log(`[Socket on]: ${event} registered`);
  },
  off: (event: string, callback: Function) => {
    console.log(`[Socket off]: ${event} deregistered`);
  },
};
