import { db } from '../db';
import { teamPowerups, teams, contests, submissions } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { broadcastLeaderboard } from '../utils/leaderboard';

const POWERUP_LIMITS = {
  SPIDER_SENSE: 1,
  WEB_FLUID: 2,
  SUIT_TECH: 2
};

export function registerPowerupHandlers(socket: any, io: any) {
  
  // Handle a team using a powerup
  socket.on('powerup:use', async ({ type, problemId }: { type: 'SPIDER_SENSE' | 'WEB_FLUID' | 'SUIT_TECH', problemId?: string }) => {
    const teamId = socket.data?.teamId;
    if (!teamId) return;

    try {
      // 1. Validate team state and inventory
      const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
      if (!team) {
        socket.emit('powerup:error', { message: 'Team not found' });
        return;
      }

      if (team.isPaused || team.isDisqualified) {
        socket.emit('powerup:error', { message: 'Action disabled: Team is paused or disqualified.' });
        return;
      }

      // Check contest state
      const [contest] = await db.select().from(contests);
      if (!contest || contest.status !== 'RUNNING') {
        socket.emit('powerup:error', { message: 'Contest is not running.' });
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

      if (type === 'SPIDER_SENSE') {
        if (team.spiderSenseCharges <= 0) {
          socket.emit('powerup:error', { message: 'No Spider-Sense charges remaining in inventory' });
          return;
        }

        if (!problemId) {
          socket.emit('powerup:error', { message: 'Mission ID required to activate Spider-Sense.' });
          return;
        }

        if (problemId === '10-final-mission') {
          socket.emit('powerup:error', { message: 'Spider-Sense cannot be used on the Final Mission.' });
          return;
        }

        // Check if problem is already solved or bypassed
        const existingSubmissions = await db.select().from(submissions).where(and(
          eq(submissions.teamId, teamId),
          eq(submissions.problemId, problemId),
          inArray(submissions.verdict, ['AC', 'BYPASSED'])
        ));

        if (existingSubmissions.length > 0) {
          socket.emit('powerup:error', { message: 'Mission is already completed or bypassed.' });
          return;
        }
      }

      // 2. Deduct inventory / persist usage
      if (type === 'SPIDER_SENSE') {
        await db.transaction(async (tx) => {
          await tx.update(teams)
            .set({ spiderSenseCharges: team.spiderSenseCharges - 1 })
            .where(eq(teams.id, teamId));

          // Insert pseudo-submission to indicate bypass and unlock next question
          await tx.insert(submissions).values({
            teamId,
            problemId: problemId!,
            language: 'PYTHON', // Must match schema enum
            sourceCode: 'SPIDER_SENSE_BYPASS',
            verdict: 'BYPASSED',
            runtimeMs: -1,
            memoryKb: -1,
            createdAt: new Date(),
            testCaseResults: [{ index: 0, verdict: 'BYPASSED', runtimeMs: 0, memoryKb: 0 }]
          });
          
          await tx.insert(teamPowerups).values({
            teamId,
            type,
            usedAt: new Date(),
          });
        });
        
        socket.emit('powerup:updated', { type, remaining: team.spiderSenseCharges - 1 });
        socket.emit('submit:result', { 
          status: 'DONE', 
          verdict: 'BYPASSED',
          problemId 
        });

        const allTeamSubs = await db.select({ problemId: submissions.problemId, verdict: submissions.verdict })
          .from(submissions)
          .where(and(
            eq(submissions.teamId, teamId),
            inArray(submissions.verdict, ['AC', 'BYPASSED'])
          ));
        const solvedIds = Array.from(new Set(allTeamSubs.filter(s => s.verdict === 'AC').map(s => s.problemId)));
        const bypassedIds = Array.from(new Set(allTeamSubs.filter(s => s.verdict === 'BYPASSED').map(s => s.problemId)));
        
        socket.emit('team:progress_updated', {
          hintStage: team.hintStage,
          solvedCount: solvedIds.length,
          solvedProblemIds: solvedIds,
          bypassedProblemIds: bypassedIds,
        });
        socket.to(`team:${teamId}`).emit('team:progress_updated', {
          hintStage: team.hintStage,
          solvedCount: solvedIds.length,
          solvedProblemIds: solvedIds,
          bypassedProblemIds: bypassedIds,
        });

        const ioServer = (socket as any).server || socket.conn?.server;
        await broadcastLeaderboard(ioServer, db);
      } else {
        await db.insert(teamPowerups).values({
          teamId,
          type,
          usedAt: new Date()
        });
      }
      
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
