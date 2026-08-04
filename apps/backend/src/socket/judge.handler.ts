import { db } from '../db';
import { problems, submissions, teams, contests } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { SupportedLanguage } from '../judge/languages';
import { runInSandbox } from '../judge/runner';
import { broadcastLeaderboard } from '../utils/leaderboard';

// H1: Per-team submission cooldown (5 seconds) to prevent spam
const lastSubmitTime = new Map<string, number>();
const SUBMIT_COOLDOWN_MS = 5000;

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
      // HIGH-4: Validate contest is RUNNING before accepting any submission
      const [globalContest] = await db.select().from(contests);
      if (!globalContest || globalContest.status !== 'RUNNING') {
        socket.emit('submit:result', { status: 'REJECTED', message: 'Contest is not currently running.' });
        return;
      }

      // HIGH-4: Validate the team exists and is not paused
      const teamId = socket.data?.teamId;
      if (!teamId) {
        socket.emit('submit:result', { status: 'REJECTED', message: 'Not authenticated. Please reconnect.' });
        return;
      }

      // H1: Rate-limit check
      const now = Date.now();
      const lastSubmit = lastSubmitTime.get(teamId) || 0;
      if (now - lastSubmit < SUBMIT_COOLDOWN_MS) {
        const remaining = Math.ceil((SUBMIT_COOLDOWN_MS - (now - lastSubmit)) / 1000);
        socket.emit('submit:result', { status: 'REJECTED', message: `Please wait ${remaining}s before submitting again.` });
        return;
      }
      lastSubmitTime.set(teamId, now);

      const [existingTeam] = await db.select().from(teams).where(eq(teams.id, teamId));
      if (!existingTeam) {
        socket.emit('submit:result', { status: 'REJECTED', message: 'Team not found.' });
        return;
      }
      if (existingTeam.isPaused || existingTeam.isDisqualified) {
        socket.emit('submit:result', { status: 'REJECTED', message: 'Your team is currently paused or disqualified.' });
        return;
      }

      console.log(`[Judge] Submitting code for problem: ${problemId}, language: ${language}`);
      const [problem] = await db.select().from(problems).where(eq(problems.id, problemId));
      if (!problem) {
        throw new Error('Problem not found');
      }

      const testCases: any[] = (problem.testCases as any[]) || [];
      const results: any[] = [];
      let overallVerdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' = 'AC';
      let maxRuntime = 0;

      socket.emit('submit:progress', { stage: 'COMPILING', currentTest: 0, totalTests: testCases.length });

      for (const [i, tc] of testCases.entries()) {
        socket.emit('submit:progress', { stage: 'RUNNING', currentTest: i + 1, totalTests: testCases.length });
        
        const result = await runInSandbox(language, code, tc.input, tc.output);
        results.push({ index: i, verdict: result.verdict, runtimeMs: result.runtimeMs, memoryKb: 0 });
        maxRuntime = Math.max(maxRuntime, result.runtimeMs);

        if (result.verdict !== 'AC') {
          overallVerdict = result.verdict;
          break; // stop at first failing test
        }
      }

      const [submission] = await db.transaction(async (tx) => {
        const [sub] = await tx.insert(submissions).values({
          teamId,
          problemId, 
          language: language.toUpperCase() as any,
          sourceCode: code,
          status: 'DONE', 
          verdict: overallVerdict,
          runtimeMs: maxRuntime, 
          testCaseResults: results,
        }).returning();

        // Recalculate progress for this team
        if (overallVerdict === 'AC') {
          const teamSubmissions = await tx.select({
            problemId: submissions.problemId,
          })
          .from(submissions)
          .where(and(
            eq(submissions.teamId, teamId),
            eq(submissions.verdict, 'AC')
          ));

          const distinctSolved = new Set(teamSubmissions.map(s => s.problemId)).size;
          
          let newHintStage = 0;
          if (distinctSolved >= 10) newHintStage = 3;
          else if (distinctSolved >= 6) newHintStage = 2;
          else if (distinctSolved >= 3) newHintStage = 1;

          const currentStage = existingTeam?.hintStage ?? 0;
          if (newHintStage > currentStage) {
            await tx.update(teams).set({ hintStage: newHintStage }).where(eq(teams.id, teamId));
          }
          // Always emit progress update so client can update solved count display
          socket.to(`team:${teamId}`).emit('team:progress_updated', { hintStage: newHintStage, solvedCount: distinctSolved });
          socket.emit('team:progress_updated', { hintStage: newHintStage, solvedCount: distinctSolved });
        }
        
        return [sub];
      });

      socket.emit('submit:result', { 
        status: 'DONE', 
        verdict: submission.verdict,
        testCases: results,
        testCaseResults: results, // alias — frontend reads this field
        problemId
      });

      // Broadcast global leaderboard if the state changed
      if (overallVerdict === 'AC') {
        const io = (socket as any).server || socket.conn?.server;
        await broadcastLeaderboard(io, db);
      }
    } catch (err) {
      console.error('[Judge Error]:', err);
      socket.emit('submit:result', { status: 'FAILED', message: 'Internal Server Error during execution' });
    }
  });

}
