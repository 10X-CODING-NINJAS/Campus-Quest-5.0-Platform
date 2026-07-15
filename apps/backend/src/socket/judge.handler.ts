import { db } from '../db';
import { problems, submissions, teams } from '../db/schema';
import { eq } from 'drizzle-orm';
import { SupportedLanguage } from '../judge/languages';
import { runInSandbox } from '../judge/runner';

export function registerJudgeHandlers(socket: any) {
  socket.on('run:code', async ({ problemId, code, language, stdin }: { problemId?: string; code: string; language: SupportedLanguage; stdin: string }) => {
    try {
      console.log(`[Judge] Running code for problem: ${problemId}, language: ${language}`);
      
      let expectedOutput: string | undefined = undefined;
      if (problemId) {
        const [problem] = await db.select().from(problems).where(eq(problems.id, problemId));
        if (problem) {
          const testCases = (problem.testCases as any[]) || [];
          // Match the input to find the expected output
          const matchedTc = testCases.find(tc => tc.input.trim() === stdin.trim());
          if (matchedTc) {
            expectedOutput = matchedTc.output;
          }
        }
      }

      const result = await runInSandbox(language, code, stdin, expectedOutput);
      socket.emit('run:result', result);
    } catch (err) {
      console.error('[Judge Error]:', err);
      socket.emit('run:result', { verdict: 'CE', stdout: '', stderr: 'Internal Server Error during execution', runtimeMs: 0 });
    }
  });

  socket.on('submit:code', async ({ problemId, code, language }: { problemId: string; code: string; language: SupportedLanguage }) => {
    try {
      console.log(`[Judge] Submitting code for problem: ${problemId}, language: ${language}`);
      const [problem] = await db.select().from(problems).where(eq(problems.id, problemId));
      if (!problem) {
        throw new Error('Problem not found');
      }

      const testCases: any[] = (problem.testCases as any[]) || [];
      const results = [];
      let overallVerdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' = 'AC';
      let maxRuntime = 0;

      for (const [i, tc] of testCases.entries()) {
        const result = await runInSandbox(language, code, tc.input, tc.output);
        results.push({ index: i, verdict: result.verdict, runtimeMs: result.runtimeMs, memoryKb: 0 });
        maxRuntime = Math.max(maxRuntime, result.runtimeMs);

        if (result.verdict !== 'AC') {
          overallVerdict = result.verdict;
          break; // stop at first failing test
        }
      }

      // Ensure the team exists in the database to prevent foreign key constraint failure
      const teamId = socket.data?.teamId || 'unknown-team';
      const [existingTeam] = await db.select().from(teams).where(eq(teams.id, teamId));
      if (!existingTeam) {
        await db.insert(teams).values({
          id: teamId,
          name: teamId,
          email: `${teamId}@campus-quest.com`,
          passwordHash: 'placeholder',
          violationCount: 0,
          isDisqualified: false,
          isPaused: false,
          spiderSenseCharges: 3,
        });
      }

      const [submission] = await db.insert(submissions).values({
        teamId,
        problemId, 
        language: language.toUpperCase() as any,
        sourceCode: code,
        status: 'DONE', 
        verdict: overallVerdict,
        runtimeMs: maxRuntime, 
        testCaseResults: results,
      }).returning();

      socket.emit('submit:result', submission);
    } catch (err) {
      console.error('[Judge Error]:', err);
      socket.emit('submit:result', { status: 'FAILED', message: 'Internal Server Error during execution' });
    }
  });
}
