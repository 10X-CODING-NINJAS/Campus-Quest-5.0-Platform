import { db } from '../db';
import { teams, submissions, contests } from '../db/schema';

export interface LeaderboardTeam {
  id: string;
  name: string;
  violationCount: number;
  isPaused: boolean;
  isDisqualified: boolean;
  spiderSenseCharges: number;
  hintStage: number;
  solvedCount: number;
  legitimateSolvedCount: number;
  bypassedCount: number;
  latestVerdict: string;
  currentProblemId: string;
  submissionCount: number;
  penalty: number;
  rank?: number;
}

/**
 * Calculates the leaderboard matching ICPC standards:
 * - solvedCount: Count of unique problems with AC.
 * - penalty: (time elapsed from contest start to FIRST AC in minutes) + (20 * failed attempts before FIRST AC)
 * By standard rules, bypassed problems do not grant points and have 0 penalty.
 */
export async function calculateLeaderboard(database: typeof db): Promise<LeaderboardTeam[]> {
  const allTeams = await database.select().from(teams);
  const allContests = await database.select().from(contests);
  const contest = allContests[0];
  const contestStart = contest?.startedAt ? new Date(contest.startedAt).getTime() : Date.now();

  const allSubmissions = await database.select().from(submissions).orderBy(submissions.createdAt);

  const teamMap = new Map<string, LeaderboardTeam>();
  
  for (const t of allTeams) {
    teamMap.set(t.id, {
      id: t.id,
      name: t.name,
      violationCount: t.violationCount,
      isPaused: t.isPaused,
      isDisqualified: t.isDisqualified,
      spiderSenseCharges: t.spiderSenseCharges,
      hintStage: t.hintStage,
      solvedCount: 0,
      legitimateSolvedCount: 0,
      bypassedCount: 0,
      latestVerdict: 'PENDING',
      currentProblemId: '',
      submissionCount: 0,
      penalty: 0,
      rank: 1,
    });
  }

  // To compute penalty properly: track first AC time and failed attempts per problem per team
  const teamProblemStats = new Map<string, Map<string, { firstAcMs: number | null, failedAttempts: number }>>();

  for (const sub of allSubmissions) {
    const t = teamMap.get(sub.teamId);
    if (!t) continue;
    
    t.submissionCount++;
    if (sub.verdict) {
      t.latestVerdict = sub.verdict;
    }
    t.currentProblemId = sub.problemId;

    if (!teamProblemStats.has(sub.teamId)) {
      teamProblemStats.set(sub.teamId, new Map());
    }
    const problemMap = teamProblemStats.get(sub.teamId)!;
    
    if (!problemMap.has(sub.problemId)) {
      problemMap.set(sub.problemId, { firstAcMs: null, failedAttempts: 0 });
    }
    const pStats = problemMap.get(sub.problemId)!;

    if (sub.verdict === 'BYPASSED') {
      // By standard rules, bypassed problems do not grant points and have 0 penalty.
      // But we track them so they don't count as legitimate solve.
      if (pStats.firstAcMs === null) {
        pStats.firstAcMs = -1; // -1 means bypassed
      }
    } else if (sub.verdict === 'AC') {
      if (pStats.firstAcMs === null) {
        pStats.firstAcMs = new Date(sub.createdAt).getTime();
      }
    } else if (sub.verdict && sub.verdict !== ('PENDING' as any) && sub.verdict !== ('JUDGING' as any)) {
      // Failed attempt (WA, TLE, RE, CE, etc)
      // Only count if it's before the first AC
      if (pStats.firstAcMs === null) {
        pStats.failedAttempts++;
      }
    }
  }

  // Compute final solved count and penalty
  for (const [teamId, pMap] of teamProblemStats.entries()) {
    const t = teamMap.get(teamId)!;
    
    let legSolves = 0;
    let bypassed = 0;
    let pen = 0;

    for (const pStats of pMap.values()) {
      if (pStats.firstAcMs === -1) {
        bypassed++;
      } else if (pStats.firstAcMs !== null) {
        legSolves++;
        const timeToSolveMs = pStats.firstAcMs - contestStart;
        const timeToSolveMinutes = Math.floor(Math.max(0, timeToSolveMs) / 60000);
        pen += timeToSolveMinutes + (20 * pStats.failedAttempts);
      }
    }

    t.legitimateSolvedCount = legSolves;
    t.bypassedCount = bypassed;
    // According to previous platform logic, solvedCount displayed includes bypassed for progression purposes
    t.solvedCount = legSolves + bypassed; 
    t.penalty = pen;
  }

  const teamList = Array.from(teamMap.values());

  // Sort: highest legitimate solved count first, then lowest penalty
  teamList.sort((a, b) => {
    if (b.legitimateSolvedCount !== a.legitimateSolvedCount) {
      return b.legitimateSolvedCount - a.legitimateSolvedCount;
    }
    return a.penalty - b.penalty;
  });

  // Assign ranks
  for (let i = 0; i < teamList.length; i++) {
    if (i > 0) {
      const prev = teamList[i - 1];
      const curr = teamList[i];
      if (prev.legitimateSolvedCount === curr.legitimateSolvedCount && prev.penalty === curr.penalty) {
        curr.rank = prev.rank || 1;
      } else {
        curr.rank = i + 1;
      }
    } else {
      teamList[i].rank = 1;
    }
  }

  return teamList;
}

export async function broadcastLeaderboard(io: any, database: typeof db) {
  if (!io) return;
  const leaderboard = await calculateLeaderboard(database);
  
  // 1. Emit to admin
  io.to('admin-room').emit('leaderboard:update', { leaderboard });

  // 2. Emit to each team their specific rank
  for (const team of leaderboard) {
    io.to(`team:${team.id}`).emit('leaderboard:update', { 
      currentRank: team.rank,
      solvedCount: team.solvedCount, // total including bypassed
      legitimateSolvedCount: team.legitimateSolvedCount,
      bypassedCount: team.bypassedCount,
      penalty: team.penalty
    });
  }
}
