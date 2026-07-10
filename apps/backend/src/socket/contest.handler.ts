import { db } from '../db/index.js';
import { teams, teamPowerups } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { getContestStateSnapshot } from '../services/contest-state.js';
import { getHintProgressSnapshot } from '../services/hint-progress.js';

export function registerContestHandlers(socket: any) {
  void getContestStateSnapshot()
    .then((snapshot) => socket.emit('contest:state', snapshot))
    .catch((error) => socket.emit('contest:error', { message: error.message }));
  
  // When a user connects, they can request their initial state
  socket.on('contest:sync', async () => {
    const contestState = await getContestStateSnapshot();
    
    // Get team status
    const teamId = socket.data?.teamId;
    let isPaused = false;
    let powerupCounts = { SPIDER_SENSE: 0, WEB_FLUID: 0, SUIT_TECH: 0 };
    let hintProgress = { teamId: teamId ?? '', questionsSolved: 0, hintProgress: 0 as 0 | 1 | 2 | 3, missionCompleted: false };
    
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

      hintProgress = await getHintProgressSnapshot(teamId);
    }
    
    socket.emit('contest:sync_result', {
      contestStatus: contestState.state,
      contestState,
      isTeamPaused: isPaused,
      powerupCounts,
      hintProgress,
    });
    socket.emit('contest:state', contestState);
    socket.emit('hint:update', hintProgress);
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
