import type { Server } from 'socket.io';
import { db } from '../db/index.js';
import { contests } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export type ContestState = 'WAITING' | 'DIAGNOSTICS' | 'LOBBY' | 'LIVE' | 'PAUSED' | 'MISSION_MODE' | 'ENDED';

export interface ContestStateSnapshot {
  state: ContestState;
  previousState: ContestState | null;
  updatedAt: string;
  startedAt: string | null;
  pausedAt: string | null;
  endsAt: string | null;
  durationMs: number;
}

const LEGACY_TO_STATE: Record<string, ContestState> = {
  NOT_STARTED: 'WAITING',
  RUNNING: 'LIVE',
  WAITING: 'WAITING',
  DIAGNOSTICS: 'DIAGNOSTICS',
  LOBBY: 'LOBBY',
  LIVE: 'LIVE',
  PAUSED: 'PAUSED',
  MISSION_MODE: 'MISSION_MODE',
  ENDED: 'ENDED',
};

export const CONTEST_STATES: ContestState[] = [
  'WAITING',
  'DIAGNOSTICS',
  'LOBBY',
  'LIVE',
  'PAUSED',
  'MISSION_MODE',
  'ENDED',
];

export function normalizeContestState(value: unknown): ContestState {
  return LEGACY_TO_STATE[String(value)] ?? 'WAITING';
}

function toSnapshot(contest: typeof contests.$inferSelect): ContestStateSnapshot {
  return {
    state: normalizeContestState(contest.status),
    previousState: contest.previousStatus ? normalizeContestState(contest.previousStatus) : null,
    updatedAt: (contest.stateUpdatedAt ?? new Date()).toISOString(),
    startedAt: contest.startedAt?.toISOString() ?? null,
    pausedAt: contest.pausedAt?.toISOString() ?? null,
    endsAt: contest.endsAt?.toISOString() ?? null,
    durationMs: contest.durationMs,
  };
}

export async function getContestStateSnapshot(): Promise<ContestStateSnapshot> {
  const [contest] = await db.select().from(contests).limit(1);
  if (contest) return toSnapshot(contest);

  const [created] = await db.insert(contests).values({
    status: 'WAITING',
    stateUpdatedAt: new Date(),
  }).returning();

  return toSnapshot(created);
}

export async function setContestState(state: ContestState): Promise<ContestStateSnapshot> {
  const current = await getContestStateSnapshot();
  const [contest] = await db.select().from(contests).limit(1);
  const now = new Date();

  const updates: Partial<typeof contests.$inferInsert> = {
    status: state,
    previousStatus: current.state,
    stateUpdatedAt: now,
  };

  if (state === 'LIVE' && !contest?.startedAt) {
    updates.startedAt = now;
  }
  if (state === 'PAUSED') {
    updates.pausedAt = now;
  } else if (contest?.pausedAt) {
    updates.pausedAt = null;
  }

  const [updated] = await db.update(contests)
    .set(updates)
    .where(eq(contests.id, contest!.id))
    .returning();

  return toSnapshot(updated);
}

export function broadcastContestState(io: Server | undefined, snapshot: ContestStateSnapshot) {
  io?.emit('contest:state', snapshot);
}
