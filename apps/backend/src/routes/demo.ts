/**
 * ============================================================
 *  DEMO MODE ROUTES  —  ISOLATED DEMO-ONLY CODE
 * ============================================================
 *  These routes exist ONLY for board presentations and internal
 *  demonstrations.  They are completely inert when DEMO_MODE is
 *  not set to "true" in the environment.
 *
 *  TO DISABLE FOR PRODUCTION:
 *   1.  Remove / set DEMO_MODE=false in .env
 *   2.  (Optional) delete this file and its registration in index.ts
 * ============================================================
 */

import { FastifyInstance } from 'fastify';
import { db } from '../db';
import {
  teams, submissions, problems, violations, teamPowerups, contests,
} from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// ── Guard helper ──────────────────────────────────────────────────────────────
function isDemoMode(): boolean {
  return process.env.DEMO_MODE === 'true';
}

// ── Demo team seed data ───────────────────────────────────────────────────────
const DEMO_TEAMS = [
  { name: 'Alpha Coders',     email: 'alpha@demo.cq',     id: 'demo-alpha-coders' },
  { name: 'Binary Bandits',   email: 'binary@demo.cq',    id: 'demo-binary-bandits' },
  { name: 'Null Pointers',    email: 'null@demo.cq',      id: 'demo-null-pointers' },
  { name: 'Stack Smashers',   email: 'stack@demo.cq',     id: 'demo-stack-smashers' },
  { name: 'Runtime Rebels',   email: 'runtime@demo.cq',   id: 'demo-runtime-rebels' },
  { name: 'Byte Knights',     email: 'byte@demo.cq',      id: 'demo-byte-knights' },
  { name: 'Quantum Coders',   email: 'quantum@demo.cq',   id: 'demo-quantum-coders' },
  { name: 'Recursive Ninjas', email: 'recursive@demo.cq', id: 'demo-recursive-ninjas' },
];

// Solved counts per demo team (index = team index above)
const DEMO_SOLVE_COUNTS = [7, 6, 5, 4, 3, 3, 2, 1];
// Extra WA submissions per team
const DEMO_WA_COUNTS    = [2, 3, 5, 2, 4, 1, 6, 3];

// ── Helper: upsert a team (idempotent) ───────────────────────────────────────
async function upsertTeam(teamDef: { id: string; name: string; email: string }) {
  const existing = await db.select().from(teams).where(eq(teams.id, teamDef.id));
  if (existing.length === 0) {
    await db.insert(teams).values({
      id: teamDef.id,
      name: teamDef.name,
      email: teamDef.email,
      passwordHash: 'demo-placeholder-hash',
      violationCount: 0,
      isDisqualified: false,
      isPaused: false,
      spiderSenseCharges: 3,
      hintStage: 0,
    });
  }
  return teamDef.id;
}

// ── Helper: get ordered problem list ─────────────────────────────────────────
async function getOrderedProblems() {
  return db.select().from(problems).orderBy(problems.order);
}

// ── Helper: get AC-solved problem IDs for a team ─────────────────────────────
async function getSolvedProblemIds(teamId: string): Promise<Set<string>> {
  const acSubs = await db.select({ problemId: submissions.problemId })
    .from(submissions)
    .where(and(eq(submissions.teamId, teamId), eq(submissions.verdict, 'AC')));
  return new Set(acSubs.map(s => s.problemId));
}

// ── Helper: insert a submission and update hint progression ──────────────────
async function insertSubmission(
  teamId: string,
  problemId: string,
  verdict: 'AC' | 'WA' | 'CE' | 'RE',
  io?: any,
) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) throw new Error(`Team not found: ${teamId}`);

  const [sub] = await db.insert(submissions).values({
    teamId,
    problemId,
    language: 'PYTHON',
    sourceCode: `# Demo submission — verdict forced to ${verdict}`,
    status: 'DONE',
    verdict,
    runtimeMs: Math.floor(Math.random() * 450) + 50,
    testCaseResults: [],
  }).returning();

  // If AC, recalculate hint stage
  if (verdict === 'AC') {
    const solved = await getSolvedProblemIds(teamId);
    let newHintStage = 0;
    if (solved.size >= 10) newHintStage = 3;
    else if (solved.size >= 6) newHintStage = 2;
    else if (solved.size >= 3) newHintStage = 1;

    if (newHintStage > team.hintStage) {
      await db.update(teams).set({ hintStage: newHintStage }).where(eq(teams.id, teamId));
      if (io) {
        io.to(`team:${teamId}`).emit('team:progress_updated', {
          hintStage: newHintStage,
          solvedCount: solved.size,
        });
      }
    }
  }

  if (io) {
    io.emit('submit:result', sub);
  }

  return sub;
}

// =============================================================================
//  Route Registration
// =============================================================================
export default async function demoRoutes(fastify: FastifyInstance) {

  // ── 0. Status ──────────────────────────────────────────────────────────────
  fastify.get('/demo/status', async (_req, _reply) => {
    return { enabled: isDemoMode() };
  });

  // ── Guard: all mutation endpoints below require DEMO_MODE=true ──────────────
  fastify.addHook('preHandler', async (request, reply) => {
    if (request.url === '/demo/status') return;
    if (request.url.startsWith('/demo/') && !isDemoMode()) {
      return reply.code(403).send({
        error: 'DEMO_MODE_DISABLED',
        message: 'Demo mode is not enabled. Set DEMO_MODE=true in backend .env',
      });
    }
  });

  // ── 1. Solve Current Question ──────────────────────────────────────────────
  fastify.post('/demo/solve-current', async (request, reply) => {
    const { teamId } = request.body as { teamId: string };
    if (!teamId) return reply.code(400).send({ error: 'teamId required' });

    await upsertTeam({ id: teamId, name: teamId, email: `${teamId}@demo.cq` });
    const allProblems = await getOrderedProblems();
    const solved = await getSolvedProblemIds(teamId);
    const nextProblem = allProblems.find(p => !solved.has(p.id));
    if (!nextProblem) return { success: true, message: 'All problems already solved' };

    const io = (fastify as any).io;
    const sub = await insertSubmission(teamId, nextProblem.id, 'AC', io);
    return { success: true, submission: sub, problemTitle: nextProblem.title };
  });

  // ── 2. Solve Next Question (alias) ─────────────────────────────────────────
  fastify.post('/demo/solve-next', async (request, reply) => {
    const { teamId } = request.body as { teamId: string };
    if (!teamId) return reply.code(400).send({ error: 'teamId required' });

    await upsertTeam({ id: teamId, name: teamId, email: `${teamId}@demo.cq` });
    const allProblems = await getOrderedProblems();
    const solved = await getSolvedProblemIds(teamId);
    const nextProblem = allProblems.find(p => !solved.has(p.id));
    if (!nextProblem) return { success: true, message: 'All problems already solved' };

    const io = (fastify as any).io;
    const sub = await insertSubmission(teamId, nextProblem.id, 'AC', io);
    return { success: true, submission: sub, problemTitle: nextProblem.title };
  });

  // ── 3. Solve All Questions ─────────────────────────────────────────────────
  fastify.post('/demo/solve-all', async (request, reply) => {
    const { teamId } = request.body as { teamId: string };
    if (!teamId) return reply.code(400).send({ error: 'teamId required' });

    await upsertTeam({ id: teamId, name: teamId, email: `${teamId}@demo.cq` });
    const allProblems = await getOrderedProblems();
    const io = (fastify as any).io;
    const results = [];

    for (const problem of allProblems) {
      const solved = await getSolvedProblemIds(teamId);
      if (!solved.has(problem.id)) {
        const sub = await insertSubmission(teamId, problem.id, 'AC', io);
        results.push({ problemTitle: problem.title, submissionId: sub.id });
      }
    }

    return { success: true, solved: results.length, results };
  });

  // ── 4. Reset Team Progress ─────────────────────────────────────────────────
  fastify.post('/demo/reset-team', async (request, reply) => {
    const { teamId } = request.body as { teamId: string };
    if (!teamId) return reply.code(400).send({ error: 'teamId required' });

    await db.delete(submissions).where(eq(submissions.teamId, teamId));
    await db.update(teams)
      .set({ hintStage: 0, violationCount: 0, isPaused: false })
      .where(eq(teams.id, teamId));

    const io = (fastify as any).io;
    if (io) {
      io.to(`team:${teamId}`).emit('team:progress_updated', { hintStage: 0, solvedCount: 0 });
    }

    return { success: true, message: `Team ${teamId} reset` };
  });

  // ── 5. Set Hint Stage ─────────────────────────────────────────────────────
  fastify.post('/demo/set-hint-stage', async (request, reply) => {
    const { teamId, stage } = request.body as { teamId: string; stage: number };
    if (!teamId || stage === undefined) return reply.code(400).send({ error: 'teamId and stage required' });
    if (![0, 1, 2, 3].includes(stage)) return reply.code(400).send({ error: 'stage must be 0-3' });

    await upsertTeam({ id: teamId, name: teamId, email: `${teamId}@demo.cq` });
    await db.update(teams).set({ hintStage: stage }).where(eq(teams.id, teamId));

    const io = (fastify as any).io;
    if (io) {
      const solvedCount = stage === 3 ? 10 : stage === 2 ? 6 : stage === 1 ? 3 : 0;
      io.to(`team:${teamId}`).emit('team:progress_updated', { hintStage: stage, solvedCount });
    }

    return { success: true, message: `Hint stage set to ${stage} for team ${teamId}` };
  });

  // ── 6. Reset Hint Progress ─────────────────────────────────────────────────
  fastify.post('/demo/reset-hints', async (request, reply) => {
    const { teamId } = request.body as { teamId: string };
    if (!teamId) return reply.code(400).send({ error: 'teamId required' });

    await db.update(teams).set({ hintStage: 0 }).where(eq(teams.id, teamId));
    const io = (fastify as any).io;
    if (io) {
      io.to(`team:${teamId}`).emit('team:progress_updated', { hintStage: 0, solvedCount: 0 });
    }
    return { success: true };
  });

  // ── 7. Trigger Verdict ────────────────────────────────────────────────────
  fastify.post('/demo/trigger-verdict', async (request, reply) => {
    const { teamId, verdict, problemId: explicitProblemId } = request.body as {
      teamId: string;
      verdict: 'AC' | 'WA' | 'CE' | 'RE';
      problemId?: string;
    };
    if (!teamId || !verdict) return reply.code(400).send({ error: 'teamId and verdict required' });

    await upsertTeam({ id: teamId, name: teamId, email: `${teamId}@demo.cq` });

    let problemId = explicitProblemId;
    if (!problemId) {
      const allProblems = await getOrderedProblems();
      const solved = await getSolvedProblemIds(teamId);
      const current = allProblems.find(p => !solved.has(p.id)) ?? allProblems[0];
      if (!current) return reply.code(400).send({ error: 'No problems in database' });
      problemId = current.id;
    }

    const io = (fastify as any).io;
    const sub = await insertSubmission(teamId, problemId, verdict, io);
    return { success: true, submission: sub };
  });

  // ── 8. Simulate Violation ─────────────────────────────────────────────────
  fastify.post('/demo/simulate-violation', async (request, reply) => {
    const { teamId, type = 'TAB_SWITCH' } = request.body as { teamId: string; type?: string };
    if (!teamId) return reply.code(400).send({ error: 'teamId required' });

    await upsertTeam({ id: teamId, name: teamId, email: `${teamId}@demo.cq` });

    const validTypes = ['TAB_SWITCH', 'BLUR', 'FULLSCREEN_EXIT', 'DEVTOOLS_ATTEMPT', 'COPY_PASTE'];
    const safeType = validTypes.includes(type) ? type : 'TAB_SWITCH';

    await db.insert(violations).values({ teamId, type: safeType as any });
    const [updated] = await db.update(teams)
      .set({ violationCount: sql`${teams.violationCount} + 1` })
      .where(eq(teams.id, teamId))
      .returning();

    const io = (fastify as any).io;
    if (io) {
      io.to('admin-room').emit('admin:violation_alert', {
        teamId, type: safeType, violationCount: updated.violationCount,
      });
      io.to(`team:${teamId}`).emit('violation:updated', {
        count: updated.violationCount, max: 5,
      });
    }

    return { success: true, violationCount: updated.violationCount };
  });

  // ── 9. Trigger Powerup ────────────────────────────────────────────────────
  fastify.post('/demo/trigger-powerup', async (request, reply) => {
    const { teamId, type = 'SPIDER_SENSE' } = request.body as {
      teamId: string;
      type?: 'SPIDER_SENSE' | 'WEB_FLUID' | 'SUIT_TECH';
    };
    if (!teamId) return reply.code(400).send({ error: 'teamId required' });

    await upsertTeam({ id: teamId, name: teamId, email: `${teamId}@demo.cq` });

    const validTypes = ['SPIDER_SENSE', 'WEB_FLUID', 'SUIT_TECH'];
    const safeType = (validTypes.includes(type) ? type : 'SPIDER_SENSE') as 'SPIDER_SENSE' | 'WEB_FLUID' | 'SUIT_TECH';

    const [powerup] = await db.insert(teamPowerups).values({
      teamId,
      type: safeType,
      usedAt: new Date(),
    }).returning();

    const io = (fastify as any).io;
    if (io) {
      io.emit('admin:powerup_used', { teamId, type: safeType });
    }

    return { success: true, powerup };
  });

  // ── 10. Populate Leaderboard ──────────────────────────────────────────────
  fastify.post('/demo/populate-leaderboard', async (_request, _reply) => {
    const allProblems = await getOrderedProblems();
    if (allProblems.length === 0) {
      return { success: false, message: 'No problems in DB. Restart backend to sync problems first.' };
    }

    const io = (fastify as any).io;
    const results = [];

    for (let i = 0; i < DEMO_TEAMS.length; i++) {
      const teamDef = DEMO_TEAMS[i];
      await upsertTeam(teamDef);

      // Idempotent: clear existing demo submissions before re-seeding
      await db.delete(submissions).where(eq(submissions.teamId, teamDef.id));
      await db.update(teams).set({ hintStage: 0 }).where(eq(teams.id, teamDef.id));

      const solveCount = Math.min(DEMO_SOLVE_COUNTS[i], allProblems.length);
      const waCount = DEMO_WA_COUNTS[i];

      for (let p = 0; p < solveCount; p++) {
        await insertSubmission(teamDef.id, allProblems[p].id, 'AC', io);
      }
      for (let w = 0; w < waCount; w++) {
        const waIdx = (solveCount + w) % allProblems.length;
        await insertSubmission(teamDef.id, allProblems[waIdx].id, 'WA', io);
      }

      results.push({ team: teamDef.name, solved: solveCount, wa: waCount });
    }

    if (io) {
      io.emit('demo:leaderboard_updated');
    }

    return { success: true, teams: results };
  });

  // ── 11. Generate Activity Feed ────────────────────────────────────────────
  fastify.post('/demo/generate-activity', async (_request, _reply) => {
    const io = (fastify as any).io;
    if (!io) return { success: false, message: 'Socket.IO not available' };

    const allProblems = await getOrderedProblems();
    const verdicts: Array<'AC' | 'WA' | 'CE' | 'RE'> = ['AC', 'WA', 'CE', 'RE', 'WA', 'AC'];

    for (let i = 0; i < Math.min(DEMO_TEAMS.length, 6); i++) {
      const team = DEMO_TEAMS[i];
      const problem = allProblems[i % allProblems.length];
      const verdict = verdicts[i % verdicts.length];

      setTimeout(() => {
        io.emit('submit:result', {
          id: createId(),
          teamId: team.id,
          problemId: problem?.id ?? 'demo-problem',
          language: 'PYTHON',
          verdict,
          runtimeMs: Math.floor(Math.random() * 500) + 50,
          createdAt: new Date().toISOString(),
        });
      }, i * 600);
    }

    return { success: true, message: 'Activity burst scheduled (6 events over 3s)' };
  });

  // ── 12. Reset Contest (Demo) ──────────────────────────────────────────────
  fastify.post('/demo/reset-contest', async (_request, _reply) => {
    const io = (fastify as any).io;
    const demoIds = DEMO_TEAMS.map(t => t.id);

    for (const teamId of demoIds) {
      await db.delete(submissions).where(eq(submissions.teamId, teamId));
      await db.update(teams)
        .set({ hintStage: 0, violationCount: 0, isPaused: false, isDisqualified: false })
        .where(eq(teams.id, teamId));
    }

    const allContests = await db.select().from(contests);
    if (allContests.length > 0) {
      await db.update(contests)
        .set({ status: 'NOT_STARTED' })
        .where(eq(contests.id, allContests[0].id));
    }

    if (io) {
      io.emit('demo:contest_reset');
      io.emit('contest:ended');
    }

    return { success: true, message: 'Demo contest reset. All demo data cleared.' };
  });

  // ── 13. List Demo Teams ───────────────────────────────────────────────────
  fastify.get('/demo/teams', async (_request, _reply) => {
    return DEMO_TEAMS;
  });
}
