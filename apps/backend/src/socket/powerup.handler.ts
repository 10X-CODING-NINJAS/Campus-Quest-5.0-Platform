import { db } from '../db';
import { teamPowerups } from '../db/schema';
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

    // Check usage limits
    const usages = await db.select()
      .from(teamPowerups)
      .where(and(
        eq(teamPowerups.teamId, teamId),
        eq(teamPowerups.type, type)
      ));
      
    const limit = POWERUP_LIMITS[type] || 0;
    
    if (usages.length < limit) {
      // Allow usage, record in DB
      await db.insert(teamPowerups).values({
        teamId,
        type,
        usedAt: new Date()
      });
      
      // Fetch updated counts for all powerups
      const allUsages = await db.select()
        .from(teamPowerups)
        .where(eq(teamPowerups.teamId, teamId));
        
      const counts = {
        SPIDER_SENSE: allUsages.filter(p => p.type === 'SPIDER_SENSE').length,
        WEB_FLUID: allUsages.filter(p => p.type === 'WEB_FLUID').length,
        SUIT_TECH: allUsages.filter(p => p.type === 'SUIT_TECH').length
      };

      // Broadcast back to the team
      socket.emit('powerup:updated', counts);
      
      // Optionally notify admin
      io.to('admin-room').emit('admin:powerup_used', { teamId, type, counts });
    } else {
      socket.emit('powerup:error', { message: 'Maximum limit reached for this powerup' });
    }
  });
}
