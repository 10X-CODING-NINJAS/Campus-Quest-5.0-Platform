import { db } from '../db';
import { problems, submissions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { SupportedLanguage } from '../judge/languages';
import { judgeQueue, judgeQueueEvents } from '../judge/queue';

export function registerJudgeHandlers(socket: any) {
  socket.on('run:code', async ({ code, language, stdin }: { code: string; language: SupportedLanguage; stdin: string }) => {
    // Dispatch job to the queue
    const job = await judgeQueue.add('run', {
      type: 'run',
      language,
      code,
      stdin
    });

    try {
      // Wait for the worker to finish the job
      const result = await job.waitUntilFinished(judgeQueueEvents);
      socket.emit('run:result', result);
    } catch (err) {
      console.error('Job failed:', err);
      socket.emit('run:result', { verdict: 'CE', stdout: '', stderr: 'Internal Server Error during execution', runtimeMs: 0 });
    }
  });

  socket.on('submit:code', async ({ problemId, code, language }: { problemId: string; code: string; language: SupportedLanguage }) => {
    const [problem] = await db.select().from(problems).where(eq(problems.id, problemId));
    const testCases: any[] = (problem?.testCases as any[]) || [];

    // Dispatch job to the queue
    const job = await judgeQueue.add('submit', {
      type: 'submit',
      language,
      code,
      testCases
    });

    try {
      const { overallVerdict, maxRuntime, results } = await job.waitUntilFinished(judgeQueueEvents);

      const [submission] = await db.insert(submissions).values({
        teamId: socket.data?.teamId || 'unknown-team', // Fallback if socket.data.teamId isn't set during testing
        problemId, 
        language: language.toUpperCase() as any, // Cast to any to handle type strictness if necessary, or let Drizzle infer ENUM
        sourceCode: code,
        status: 'DONE', 
        verdict: overallVerdict,
        runtimeMs: maxRuntime, 
        testCaseResults: results,
      }).returning();

      socket.emit('submit:result', submission);
    } catch (err) {
      console.error('Job failed:', err);
      socket.emit('submit:result', { status: 'FAILED', message: 'Internal Server Error during execution' });
    }
  });
}
