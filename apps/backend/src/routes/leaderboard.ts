import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { submissions, teams } from '../db/schema.js';
import { sql, eq, and } from 'drizzle-orm';

interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  solved: number;
  penalty: number;
  bestRuntime: number;
  rank: number;
}

export default async function leaderboardRoutes(fastify: FastifyInstance) {
  fastify.get('/api/leaderboard', async (_request, reply) => {
    try {
      // Compute leaderboard via SQL aggregation.
      // Score = problems solved (each AC counts once per problem, first AC only).
      // Penalty = for each solved problem: submission_time_minutes + 20 * wrong_attempts_before_AC
      // Tiebreak: lower penalty wins, then lower total AC runtime.

      const contestStart = await db.select({ startedAt: submissions.createdAt })
        .from(submissions)
        .limit(1);

      // Get all accepted submissions (first AC per team+problem)
      const firstAcPerProblem = await db
        .selectDistinctOn([submissions.teamId, submissions.problemId], {
          teamId: submissions.teamId,
          problemId: submissions.problemId,
          runtimeMs: submissions.runtimeMs,
          createdAt: submissions.createdAt,
        })
        .from(submissions)
        .where(eq(submissions.verdict, 'AC'))
        .orderBy(submissions.teamId, submissions.problemId, submissions.createdAt);

      // Count wrong attempts before each AC per team+problem
      const rows: Record<string, {
        teamId: string;
        solved: number;
        penalty: number;
        bestRuntime: number;
      }> = {};

      for (const ac of firstAcPerProblem) {
        if (!rows[ac.teamId]) {
          rows[ac.teamId] = { teamId: ac.teamId, solved: 0, penalty: 0, bestRuntime: 0 };
        }

        // Count wrong attempts before this AC
        const [wrongCount] = await db
          .select({ count: sql<number>`count(*)` })
          .from(submissions)
          .where(
            and(
              eq(submissions.teamId, ac.teamId),
              eq(submissions.problemId, ac.problemId),
              sql`${submissions.verdict} != 'AC'`,
              sql`${submissions.createdAt} < ${ac.createdAt}`,
            ),
          );

        const penaltyMinutes = 20 * Number(wrongCount?.count ?? 0);
        rows[ac.teamId]!.solved += 1;
        rows[ac.teamId]!.penalty += penaltyMinutes;
        rows[ac.teamId]!.bestRuntime += ac.runtimeMs ?? 0;
      }

      // Fetch team names
      const allTeams = await db.select({ id: teams.id, name: teams.name }).from(teams);
      const teamNameMap = new Map(allTeams.map(t => [t.id, t.name]));

      // Build ranked list
      const entries: LeaderboardEntry[] = Object.values(rows).map((row, _i) => ({
        teamId: row.teamId,
        teamName: teamNameMap.get(row.teamId) ?? 'Unknown Team',
        solved: row.solved,
        penalty: row.penalty,
        bestRuntime: row.bestRuntime,
        rank: 0,
      }));

      // Also add teams with zero solves
      for (const team of allTeams) {
        if (!rows[team.id]) {
          entries.push({
            teamId: team.id,
            teamName: team.name,
            solved: 0,
            penalty: 0,
            bestRuntime: 0,
            rank: 0,
          });
        }
      }

      // Sort: most solved → least penalty → least runtime
      entries.sort((a, b) => {
        if (b.solved !== a.solved) return b.solved - a.solved;
        if (a.penalty !== b.penalty) return a.penalty - b.penalty;
        return a.bestRuntime - b.bestRuntime;
      });

      // Assign ranks (handle ties: same rank if same solved+penalty+runtime)
      let rank = 1;
      for (let i = 0; i < entries.length; i++) {
        if (i > 0) {
          const prev = entries[i - 1]!;
          const curr = entries[i]!;
          if (curr.solved !== prev.solved || curr.penalty !== prev.penalty || curr.bestRuntime !== prev.bestRuntime) {
            rank = i + 1;
          }
        }
        entries[i]!.rank = rank;
      }

      return reply.send(entries);
    } catch (err) {
      fastify.log.error(err, 'Leaderboard query failed');
      return reply.code(500).send({ error: 'Failed to compute leaderboard' });
    }
  });
}
