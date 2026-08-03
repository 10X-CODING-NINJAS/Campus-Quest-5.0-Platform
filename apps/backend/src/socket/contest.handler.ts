import { db } from '../db';
import { teams, contests, teamPowerups, submissions, helpRequests } from '../db/schema';
import { eq, and, inArray, desc } from 'drizzle-orm';
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
    let teamFrozenUntil: string | null = null;
    let powerupCounts = { SPIDER_SENSE: 0, WEB_FLUID: 0, SUIT_TECH: 0 };
    
    let solvedCount = 0;
    let solvedProblemIds: string[] = [];
    let bypassedProblemIds: string[] = [];
    let currentRank = 1;
    let requestsHistory: any[] = [];
    let pendingHelpRequest: any = null;

    if (teamId) {
      const teamData = await db.select().from(teams).where(eq(teams.id, teamId));
      if (teamData.length > 0) {
        isPaused = teamData[0].isPaused;
        hintStage = teamData[0].hintStage;
        if (teamData[0].teamFrozenUntil) {
          teamFrozenUntil = new Date(teamData[0].teamFrozenUntil).toISOString();
        }
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

      // Fetch team help requests
      const teamRequests = await db.select()
        .from(helpRequests)
        .where(eq(helpRequests.teamId, teamId))
        .orderBy(desc(helpRequests.createdAt));

      requestsHistory = teamRequests.map(r => ({
        id: r.id,
        problemId: r.problemId,
        status: r.status,
        hint: r.hint,
        answeredBy: r.answeredBy,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
        answeredAt: r.answeredAt ? new Date(r.answeredAt).toISOString() : null,
      }));

      const pendingReq = teamRequests.find(r => r.status === 'PENDING');
      if (pendingReq) {
        pendingHelpRequest = {
          id: pendingReq.id,
          problemId: pendingReq.problemId,
          status: pendingReq.status,
          createdAt: pendingReq.createdAt ? new Date(pendingReq.createdAt).toISOString() : null,
        };
      }

      // H4: Compute rank using the unified leaderboard utility
      const leaderboard = await calculateLeaderboard(db);
      const teamStats = leaderboard.find(t => t.id === teamId);
      currentRank = teamStats?.rank ?? 1;
    }
    
    socket.emit('contest:sync_result', {
      contestStatus: globalContest?.status || 'NOT_STARTED',
      isTeamPaused: isPaused,
      teamFrozenUntil,
      powerupCounts,
      hintStage,
      solvedCount,
      solvedProblemIds,
      bypassedProblemIds,
      currentRank,
      helpRequestsHistory: requestsHistory,
      pendingHelpRequest,
      // Timing data for client-side timer synchronization
      endsAt: globalContest?.endsAt ? new Date(globalContest.endsAt).toISOString() : null,
      serverTime: new Date().toISOString(),
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
