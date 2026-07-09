import { db } from '../../db/index.js';
import { contests } from '../../db/schema.js';
import { eq, sql } from 'drizzle-orm';

export async function startContest(contestId: string) {
  const [contest] = await db.update(contests)
    .set({ status: 'RUNNING', startedAt: new Date() })
    .where(eq(contests.id, contestId))
    .returning();
  return contest;
}

export async function pauseContest(contestId: string) {
  const [contest] = await db.update(contests)
    .set({ status: 'PAUSED', pausedAt: new Date() })
    .where(eq(contests.id, contestId))
    .returning();
  return contest;
}

export async function resumeContest(contestId: string) {
  const [existing] = await db.select().from(contests).where(eq(contests.id, contestId));
  if (!existing.pausedAt) throw new Error('Contest is not paused');

  const pausedDurationMs = Date.now() - existing.pausedAt.getTime();

  const [contest] = await db.update(contests)
    .set({
      status: 'RUNNING',
      pausedAt: null,
      totalPausedMs: sql`${contests.totalPausedMs} + ${pausedDurationMs}`,
    })
    .where(eq(contests.id, contestId))
    .returning();
  return contest;
}

export async function stopContest(contestId: string) {
  const [contest] = await db.update(contests)
    .set({ status: 'ENDED' })
    .where(eq(contests.id, contestId))
    .returning();
  return contest;
}
