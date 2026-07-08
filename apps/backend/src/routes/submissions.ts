import { db } from '../db';
import { submissions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { judgeQueue } from '../queues/judge.queue';

export async function createSubmission(teamId: string, problemId: string, language: string, sourceCode: string) {
  const [submission] = await db.insert(submissions).values({
    teamId, problemId, language: language as any, sourceCode,
  }).returning();

  await judgeQueue.add('judge', { submissionId: submission.id });
  return submission;
}

export async function updateSubmissionResult(
  submissionId: string,
  verdict: string,
  runtimeMs: number,
  memoryKb: number,
  testCaseResults: any[],
) {
  await db.update(submissions)
    .set({
      status: 'DONE',
      verdict: verdict as any,
      runtimeMs,
      memoryKb,
      testCaseResults,
      judgedAt: new Date(),
    })
    .where(eq(submissions.id, submissionId));
}
