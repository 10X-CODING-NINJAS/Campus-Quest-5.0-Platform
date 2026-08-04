import { db } from '../db';
import { teams, contests, teamPowerups, submissions } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { calculateLeaderboard } from '../utils/leaderboard';
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
    
    let solvedCount = 0;
    let solvedProblemIds: string[] = [];
    let bypassedProblemIds: string[] = [];
    let currentRank = 1;

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

      // Get solved and bypassed count
      const allTeamSubmissions = await db.select({
        problemId: submissions.problemId,
        verdict: submissions.verdict,
      })
      .from(submissions)
      .where(and(
        eq(submissions.teamId, teamId),
        inArray(submissions.verdict, ['AC', 'BYPASSED'])
      ));
      
      const solvedList = allTeamSubmissions.filter(s => s.verdict === 'AC').map(s => s.problemId);
      const bypassedList = allTeamSubmissions.filter(s => s.verdict === 'BYPASSED').map(s => s.problemId);

      solvedProblemIds = Array.from(new Set(solvedList));
      bypassedProblemIds = Array.from(new Set(bypassedList));
      solvedCount = solvedProblemIds.length;

      // H4: Compute rank using the unified leaderboard utility
      const leaderboard = await calculateLeaderboard(db);
      const teamStats = leaderboard.find(t => t.id === teamId);
      currentRank = teamStats?.rank ?? 1;
    }
    
    socket.emit('contest:sync_result', {
      contestStatus: globalContest?.status || 'NOT_STARTED',
      isTeamPaused: isPaused,
      powerupCounts,
      hintStage,
      solvedCount,
      solvedProblemIds,
      bypassedProblemIds,
      currentRank,
      // Timing data for client-side timer synchronization
      endsAt: globalContest?.endsAt ? new Date(globalContest.endsAt).toISOString() : null,
      serverTime: new Date().toISOString(),
    });
  });

  // NOTE: violation:trigger handler disabled — no proctoring for testing
  // socket.on('violation:trigger', ...) removed
}
