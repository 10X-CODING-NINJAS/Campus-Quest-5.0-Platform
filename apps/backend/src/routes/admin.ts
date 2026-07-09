import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { teams, contests, submissions, violations } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { verifyAdminAuth } from '../middleware/auth.js';

export default async function adminRoutes(fastify: FastifyInstance) {
  // ── Contest lifecycle ────────────────────────────────────────────────────────

  // POST /admin/contest/start
  fastify.post('/admin/contest/start', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const allContests = await db.select().from(contests);
    const now = new Date();

    if (allContests.length === 0) {
      await db.insert(contests).values({
        status: 'RUNNING',
        startedAt: now,
      });
    } else {
      await db.update(contests)
        .set({ status: 'RUNNING', startedAt: now })
        .where(eq(contests.id, allContests[0]!.id));
    }

    const io = (fastify as any).io;
    io?.emit('contest:started');

    return reply.send({ success: true, message: 'Contest started' });
  });

  // POST /admin/contest/pause
  fastify.post('/admin/contest/pause', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const [contest] = await db.select().from(contests);
    if (!contest) return reply.code(404).send({ error: 'No contest found' });

    await db.update(contests)
      .set({ status: 'PAUSED', pausedAt: new Date() })
      .where(eq(contests.id, contest.id));

    const io = (fastify as any).io;
    io?.emit('contest:paused');

    return reply.send({ success: true, message: 'Contest paused' });
  });

  // POST /admin/contest/end
  fastify.post('/admin/contest/end', async (request, reply) => {
    if (!await verifyAdminAuth(request, reply)) return;

    const [contest] = await db.select().from(contests);
    if (!contest) return reply.code(404).send({ error: 'No contest found' });

    await db.update(contests)
      .set({ status: 'ENDED' })
      .where(eq(contests.id, contest.id));

    const io = (fastify as any).io;
    io?.emit('contest:ended');

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
