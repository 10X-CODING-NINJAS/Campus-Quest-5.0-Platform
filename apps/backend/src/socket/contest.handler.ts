import { db } from '../db/index.js';
import { teams, contests, teamPowerups } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export function registerContestHandlers(socket: any) {
  
  // When a user connects, they can request their initial state
  socket.on('contest:sync', async () => {
    // Get global contest status
    const allContests = await db.select().from(contests);
    const globalContest = allContests[0]; // Assuming singleton contest for now
    
    // Get team status
    const teamId = socket.data?.teamId;
    let isPaused = false;
    let powerupCounts = { SPIDER_SENSE: 0, WEB_FLUID: 0, SUIT_TECH: 0 };
    
    if (teamId) {
      const teamData = await db.select().from(teams).where(eq(teams.id, teamId));
      if (teamData.length > 0) {
        isPaused = teamData[0].isPaused;
      }
      
      const allUsages = await db.select()
        .from(teamPowerups)
        .where(eq(teamPowerups.teamId, teamId));
        
      powerupCounts = {
        SPIDER_SENSE: allUsages.filter(p => p.type === 'SPIDER_SENSE').length,
        WEB_FLUID: allUsages.filter(p => p.type === 'WEB_FLUID').length,
        SUIT_TECH: allUsages.filter(p => p.type === 'SUIT_TECH').length
      };
    }
    
    socket.emit('contest:sync_result', {
      contestStatus: globalContest?.status || 'NOT_STARTED',
      isTeamPaused: isPaused,
      powerupCounts
    });
  });

  // Automatically triggered when frontend detects security violation
  socket.on('violation:trigger', async ({ type: _type }: { type: string }) => {
    const teamId = socket.data?.teamId;
    if (!teamId) return;

    // Set team to paused in DB
    await db.update(teams).set({ isPaused: true }).where(eq(teams.id, teamId));
    
    // Notify this specific client to show the lockout screen
    socket.emit('team:paused');
    
    // Admin notification is handled by the main io in index.ts if needed
  });
}
