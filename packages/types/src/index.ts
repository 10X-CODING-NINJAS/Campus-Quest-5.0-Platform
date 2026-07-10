export const CONTEST_STATES = [
  'WAITING',
  'DIAGNOSTICS',
  'LOBBY',
  'LIVE',
  'PAUSED',
  'MISSION_MODE',
  'ENDED',
] as const;

export type ContestState = (typeof CONTEST_STATES)[number];

export interface ContestStateSnapshot {
  state: ContestState;
  previousState: ContestState | null;
  updatedAt: string;
  startedAt: string | null;
  pausedAt: string | null;
  endsAt: string | null;
  durationMs: number;
}

export function isContestState(value: unknown): value is ContestState {
  return typeof value === 'string' && (CONTEST_STATES as readonly string[]).includes(value);
}
