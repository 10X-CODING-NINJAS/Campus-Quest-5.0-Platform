import { db } from '../db/index.js';
import { teamPowerups, contests } from '../db/schema.js';
import { eq, and, isNull } from 'drizzle-orm';

export async function usePowerup(teamId: string, powerupId: string, contestId: string) {
  const [contest] = await db.select().from(contests).where(eq(contests.id, contestId));
  if (contest.status !== 'LIVE') throw new Error('Contest is not running');

  const [powerup] = await db.select().from(teamPowerups)
    .where(and(
      eq(teamPowerups.id, powerupId),
      eq(teamPowerups.teamId, teamId),
      isNull(teamPowerups.usedAt),
    ));

  if (!powerup) throw new Error('Powerup not found or already used');

  await db.update(teamPowerups)
    .set({ usedAt: new Date() })
    .where(eq(teamPowerups.id, powerupId));

  return powerup;
}
