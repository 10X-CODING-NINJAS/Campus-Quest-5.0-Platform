import { db } from '../db/index.js';
import { teams, violations } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';

const MAX_VIOLATIONS = 5;

export async function reportViolation(teamId: string, type: string, io?: any) {
  await db.insert(violations).values({ teamId, type: type as any });

  const [team] = await db.update(teams)
    .set({ violationCount: sql`${teams.violationCount} + 1` })
    .where(eq(teams.id, teamId))
    .returning();

  if (!team) return;

  if (io) {
    io.to(teamId).emit('violation:updated', {
      count: team.violationCount,
      max: MAX_VIOLATIONS,
    });
  }

  if (team.violationCount >= MAX_VIOLATIONS && !team.isDisqualified) {
    await db.update(teams).set({ isDisqualified: true }).where(eq(teams.id, teamId));
    if (io) {
      io.to(teamId).emit('team:disqualified');
      io.to('admin').emit('team:disqualified', { teamId });
    }
  }

  return team;
}
