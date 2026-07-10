import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { teams, submissions, violations } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { verifyAdminAuth } from '../middleware/auth.js';
import {
  broadcastContestState,
  CONTEST_STATES,
  type ContestState,
  getContestStateSnapshot,
  setContestState,
} from '../services/contest-state.js';

export default async function adminRoutes(fastify: FastifyInstance) {
  // ── Contest lifecycle ────────────────────────────────────────────────────────

  fastify.get('/admin/contest/state', async (_request, reply) => {
    const snapshot = await getContestStateSnapshot();
    return reply.send(snapshot);
  });

  fastify.post<{ Body: { state: ContestState } }>('/admin/contest/state', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const { state } = request.body ?? {};
    if (!CONTEST_STATES.includes(state)) {
      return reply.code(400).send({ error: `state must be one of: ${CONTEST_STATES.join(', ')}` });
    }

    const snapshot = await setContestState(state);
    broadcastContestState((fastify as any).io, snapshot);

    return reply.send({ success: true, message: `Contest state changed to ${state}`, contestState: snapshot });
  });

  // POST /admin/contest/start
  fastify.post('/admin/contest/start', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const snapshot = await setContestState('LIVE');
    broadcastContestState((fastify as any).io, snapshot);

    return reply.send({ success: true, message: 'Contest started' });
  });

  // POST /admin/contest/pause
  fastify.post('/admin/contest/pause', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const snapshot = await setContestState('PAUSED');
    broadcastContestState((fastify as any).io, snapshot);

    return reply.send({ success: true, message: 'Contest paused' });
  });

  // POST /admin/contest/end
  fastify.post('/admin/contest/end', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const snapshot = await setContestState('ENDED');
    broadcastContestState((fastify as any).io, snapshot);

    return reply.send({ success: true, message: 'Contest ended' });
  });

  // ── Team management ──────────────────────────────────────────────────────────

  // GET /admin/teams
  fastify.get('/admin/teams', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const allTeams = await db.select().from(teams);
    // Never expose password hashes
    return reply.send(allTeams.map(t => ({
      id: t.id,
      name: t.name,
      email: t.email,
      violationCount: t.violationCount,
      isPaused: t.isPaused,
      isDisqualified: t.isDisqualified,
      spiderSenseCharges: t.spiderSenseCharges,
      questionsSolved: t.questionsSolved,
      hintProgress: t.hintProgress,
      missionCompleted: t.missionCompleted,
      createdAt: t.createdAt,
    })));
  });

  // POST /admin/team/pause
  fastify.post<{ Body: { teamId: string } }>('/admin/team/pause', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const { teamId } = request.body;
    if (!teamId) return reply.code(400).send({ error: 'teamId required' });

    await db.update(teams)
      .set({ isPaused: true })
      .where(eq(teams.id, teamId));

    const io = (fastify as any).io;
    io?.to(teamId).emit('team:paused', { teamId });

    return reply.send({ success: true });
  });

  // POST /admin/team/resume
  fastify.post<{ Body: { teamId: string } }>('/admin/team/resume', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const { teamId } = request.body;
    if (!teamId) return reply.code(400).send({ error: 'teamId required' });

    await db.update(teams)
      .set({ isPaused: false, violationCount: 0 })
      .where(eq(teams.id, teamId));

    const io = (fastify as any).io;
    io?.to(teamId).emit('team:resumed', { teamId });

    return reply.send({ success: true });
  });

  // POST /admin/team/disqualify
  fastify.post<{ Body: { teamId: string } }>('/admin/team/disqualify', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const { teamId } = request.body;
    if (!teamId) return reply.code(400).send({ error: 'teamId required' });

    await db.update(teams)
      .set({ isDisqualified: true, isPaused: true })
      .where(eq(teams.id, teamId));

    const io = (fastify as any).io;
    io?.to(teamId).emit('team:disqualified', { teamId });

    return reply.send({ success: true });
  });

  // ── Submission monitoring ────────────────────────────────────────────────────

  // GET /admin/submissions
  fastify.get('/admin/submissions', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const rows = await db.select({
      id: submissions.id,
      teamId: submissions.teamId,
      problemId: submissions.problemId,
      language: submissions.language,
      status: submissions.status,
      verdict: submissions.verdict,
      runtimeMs: submissions.runtimeMs,
      memoryKb: submissions.memoryKb,
      passedTests: submissions.passedTests,
      totalTests: submissions.totalTests,
      compileLog: submissions.compileLog,
      judgeLog: submissions.judgeLog,
      createdAt: submissions.createdAt,
      judgedAt: submissions.judgedAt,
    })
      .from(submissions)
      .orderBy(desc(submissions.createdAt))
      .limit(500);

    return reply.send(rows);
  });

  // GET /admin/violations
  fastify.get('/admin/violations', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const rows = await db.select().from(violations).orderBy(desc(violations.createdAt)).limit(500);
    return reply.send(rows);
  });
}
