import { SupportedLanguage, isSupportedLanguage } from '../judge/languages.js';
import { judgeQueue, judgeQueueEvents } from '../judge/queue.js';
import { db } from '../db/index.js';
import { submissions, teams } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export function registerJudgeHandlers(socket: any, _io: any) {
  const teamId: string | undefined = socket.data?.teamId;

  // ── run:code — execute against sample testcases only, NOT stored ────────────
  socket.on('run:code', async (payload: {
    problemId: string;
    code: string;
    language: string;
    customStdin?: string;
  }) => {
    const { problemId, code, language, customStdin } = payload;

    if (!problemId || !code || !language) {
      socket.emit('run:result', { error: 'Missing required fields' });
      return;
    }

    if (!isSupportedLanguage(language)) {
      socket.emit('run:result', { error: `Unsupported language: ${language}` });
      return;
    }

    if (code.length > 64 * 1024) {
      socket.emit('run:result', { error: 'Code too large (max 64 KB)' });
      return;
    }

    try {
      const job = await judgeQueue.add('run', {
        type: 'run',
        language: language as SupportedLanguage,
        code,
        problemId,
        customStdin,
      });

      const result = await job.waitUntilFinished(judgeQueueEvents, 35_000);
      socket.emit('run:result', result);
    } catch (err) {
      console.error('[Socket] run:code job failed:', err);
      socket.emit('run:result', {
        type: 'run',
        compiled: false,
        compileError: 'Internal judge error',
        testcaseResults: [],
      });
    }
  });

  // ── submit:code — execute against ALL testcases, stored in DB ───────────────
  socket.on('submit:code', async (payload: {
    problemId: string;
    code: string;
    language: string;
  }) => {
    const { problemId, code, language } = payload;

    if (!teamId) {
      socket.emit('submit:result', { error: 'Not authenticated. Please log in.' });
      return;
    }

    if (!problemId || !code || !language) {
      socket.emit('submit:result', { error: 'Missing required fields' });
      return;
    }

    if (!isSupportedLanguage(language)) {
      socket.emit('submit:result', { error: `Unsupported language: ${language}` });
      return;
    }

    if (code.length > 64 * 1024) {
      socket.emit('submit:result', { error: 'Code too large (max 64 KB)' });
      return;
    }

    // Check if team is paused or disqualified
    const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
    if (!team) {
      socket.emit('submit:result', { error: 'Team not found' });
      return;
    }
    if (team.isPaused || team.isDisqualified) {
      socket.emit('submit:result', { error: 'Your team is currently paused or disqualified' });
      return;
    }

    // Create the submission record immediately
    const submissionId = createId();
    await db.insert(submissions).values({
      id: submissionId,
      teamId,
      problemId,
      language: language as any,
      sourceCode: code,
      status: 'PENDING',
    });

    // Notify the client immediately with submissionId so they can poll/track
    socket.emit('submit:queued', { submissionId });

    // Dispatch to judge worker (result will be pushed to the team's socket room)
    try {
      await judgeQueue.add('submit', {
        type: 'submit',
        submissionId,
        language: language as SupportedLanguage,
        code,
        problemId,
        teamId,
      });
    } catch (err) {
      console.error('[Socket] Failed to queue submit job:', err);
      socket.emit('submit:result', { error: 'Failed to queue submission' });
    }
  });
}
