import { db } from '../db';
import { teams, contests, teamPowerups } from '../db/schema';
import { eq } from 'drizzle-orm';
import { reportViolation } from '../services/violations';

export function registerContestHandlers(socket: any, io: any) {
  
  // When a user connects, they can request their initial state
  socket.on('contest:sync', async () => {
    // Get global contest status
    const allContests = await db.select().from(contests);
    const globalContest = allContests[0]; // Assuming singleton contest for now
    
    // Get team status
    const teamId = socket.data?.teamId;
    let isPaused = false;
    let hintStage = 0;
    let powerupCounts = { SPIDER_SENSE: 0, WEB_FLUID: 0, SUIT_TECH: 0 };
    
    if (teamId) {
      const teamData = await db.select().from(teams).where(eq(teams.id, teamId));
      if (teamData.length > 0) {
        isPaused = teamData[0].isPaused;
        hintStage = teamData[0].hintStage;
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
      powerupCounts,
      hintStage
    });
  });

  // Automatically triggered when frontend detects security violation
  socket.on('violation:trigger', async ({ type }: { type: string }) => {
    const teamId = socket.data?.teamId;
    if (!teamId) return;

    try {
      // 1. Persist the violation, increment count, check for disqualification
      const team = await reportViolation(teamId, type, io);

      if (!team) return;

      // 2. Set team to paused in DB if not disqualified
      if (team.violationCount < 5) {
        await db.update(teams).set({ isPaused: true }).where(eq(teams.id, teamId));
        // Notify this specific client to show the lockout screen
        socket.emit('team:paused');
      }

      // 3. Broadcast to admin dashboard
      io.to('admin-room').emit('admin:violation_alert', { teamId, type, violationCount: team.violationCount });
    } catch (err: any) {
      console.error('[Violation Trigger Error]:', err.message);
    }
  });
}
