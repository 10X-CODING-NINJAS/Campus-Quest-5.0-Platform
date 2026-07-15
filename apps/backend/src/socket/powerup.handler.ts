import { db } from '../db';
import { teamPowerups, teams } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const POWERUP_LIMITS = {
  SPIDER_SENSE: 3,
  WEB_FLUID: 2,
  SUIT_TECH: 2
};

export function registerPowerupHandlers(socket: any, io: any) {
  
  // Handle a team using a powerup
  socket.on('powerup:use', async ({ type }: { type: 'SPIDER_SENSE' | 'WEB_FLUID' | 'SUIT_TECH' }) => {
    const teamId = socket.data?.teamId;
    if (!teamId) return;

    try {
      // 1. Validate team state and inventory
      const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
      if (!team) {
        socket.emit('powerup:error', { message: 'Team not found' });
        return;
      }

      // Check usage limits
      const usages = await db.select()
        .from(teamPowerups)
        .where(and(
          eq(teamPowerups.teamId, teamId),
          eq(teamPowerups.type, type)
        ));
        
      const limit = POWERUP_LIMITS[type] || 0;
      
      if (usages.length >= limit) {
        socket.emit('powerup:error', { message: `Maximum limit of ${limit} reached for ${type}` });
        return;
      }

      if (type === 'SPIDER_SENSE' && team.spiderSenseCharges <= 0) {
        socket.emit('powerup:error', { message: 'No Spider-Sense charges remaining in inventory' });
        return;
      }

      // 2. Deduct inventory / persist usage
      if (type === 'SPIDER_SENSE') {
        await db.update(teams)
          .set({ spiderSenseCharges: team.spiderSenseCharges - 1 })
          .where(eq(teams.id, teamId));
      }

      await db.insert(teamPowerups).values({
        teamId,
        type,
        usedAt: new Date()
      });
      
      // 3. Fetch updated counts
      const allUsages = await db.select()
        .from(teamPowerups)
        .where(eq(teamPowerups.teamId, teamId));
        
      const counts = {
        SPIDER_SENSE: allUsages.filter(p => p.type === 'SPIDER_SENSE').length,
        WEB_FLUID: allUsages.filter(p => p.type === 'WEB_FLUID').length,
        SUIT_TECH: allUsages.filter(p => p.type === 'SUIT_TECH').length
      };

      // 4. Broadcast updates to team and admin
      socket.emit('powerup:updated', counts);
      io.to('admin-room').emit('admin:powerup_used', { teamId, type, counts });
    } catch (err: any) {
      console.error('[Powerup Error]:', err.message);
      socket.emit('powerup:error', { message: 'Failed to process powerup usage' });
    }
  });
}
