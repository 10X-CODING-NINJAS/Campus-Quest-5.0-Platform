import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { submissions } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { verifyTeamAuth } from '../middleware/auth.js';
import { judgeQueue } from '../judge/queue.js';
import { isSupportedLanguage } from '../judge/languages.js';

export default async function submissionRoutes(fastify: FastifyInstance) {
  // POST /api/submit — create a submission (requires JWT)
  fastify.post<{
    Body: { problemId: string; language: string; code: string };
  }>('/api/submit', async (request, reply) => {
    const team = await verifyTeamAuth(request, reply);
    if (!team) return;

    const { problemId, language, code } = request.body;

    if (!problemId || !language || !code) {
      return reply.code(400).send({ error: 'problemId, language, and code are required' });
    }

    if (!isSupportedLanguage(language)) {
      return reply.code(400).send({ error: `Unsupported language: ${language}` });
    }

    if (code.length > 64 * 1024) {
      return reply.code(400).send({ error: 'Source code too large (max 64 KB)' });
    }

    // Create pending submission record
    const [submission] = await db.insert(submissions).values({
      id: createId(),
      teamId: team.teamId,
      problemId,
      language: language as any,
      sourceCode: code,
      status: 'PENDING',
    }).returning();

    // Dispatch to judge queue
    await judgeQueue.add('submit', {
      type: 'submit',
      submissionId: submission!.id,
      language: language as any,
      code,
      problemId,
      teamId: team.teamId,
    });

    return reply.code(202).send({
      submissionId: submission!.id,
      status: 'PENDING',
      message: 'Submission queued for judging',
    });
  });

  // POST /api/run — run against sample testcases, NOT stored
  fastify.post<{
    Body: { problemId: string; language: string; code: string; customStdin?: string };
  }>('/api/run', async (request, reply) => {
    const team = await verifyTeamAuth(request, reply);
    if (!team) return;

    const { problemId, language, code, customStdin } = request.body;

    if (!problemId || !language || !code) {
      return reply.code(400).send({ error: 'problemId, language, and code are required' });
    }

    if (!isSupportedLanguage(language)) {
      return reply.code(400).send({ error: `Unsupported language: ${language}` });
    }

    // Queue a run job and wait for it synchronously (sample tests are fast)
    const { judgeQueue: queue, judgeQueueEvents } = await import('../judge/queue.js');
    const job = await queue.add('run', {
      type: 'run',
      language: language as any,
      code,
      problemId,
      customStdin,
    });

    try {
      const result = await job.waitUntilFinished(judgeQueueEvents, 30_000);
      return reply.send(result);
    } catch {
      return reply.code(500).send({ error: 'Judge timed out or failed internally' });
    }
  });

  // GET /api/submissions/me — team's own submission history (safe, no judge logs)
  fastify.get('/api/submissions/me', async (request, reply) => {
    const team = await verifyTeamAuth(request, reply);
    if (!team) return;

    const rows = await db.select({
      id: submissions.id,
      problemId: submissions.problemId,
      language: submissions.language,
      status: submissions.status,
      verdict: submissions.verdict,
      runtimeMs: submissions.runtimeMs,
      memoryKb: submissions.memoryKb,
      passedTests: submissions.passedTests,
      totalTests: submissions.totalTests,
      createdAt: submissions.createdAt,
      judgedAt: submissions.judgedAt,
    })
      .from(submissions)
      .where(eq(submissions.teamId, team.teamId))
      .orderBy(desc(submissions.createdAt))
      .limit(100);

    return reply.send(rows);
  });

  // GET /api/submissions/:id — single submission (safe, no judge logs, only own submissions)
  fastify.get<{ Params: { id: string } }>('/api/submissions/:id', async (request, reply) => {
    const team = await verifyTeamAuth(request, reply);
    if (!team) return;

    const [row] = await db.select({
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
      testCaseResults: submissions.testCaseResults,
      createdAt: submissions.createdAt,
      judgedAt: submissions.judgedAt,
      // SECURITY: compileLog only shown to the submitting team; judgeLog never exposed
      compileLog: submissions.compileLog,
    })
      .from(submissions)
      .where(eq(submissions.id, request.params.id));

    if (!row) {
      return reply.code(404).send({ error: 'Submission not found' });
    }

    // Only team can see their own submission
    if (row.teamId !== team.teamId) {
      return reply.code(403).send({ error: 'Access denied' });
    }

    return reply.send(row);
  });
}
