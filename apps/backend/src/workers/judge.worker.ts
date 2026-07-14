import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import { connection } from '../config/redis.js';
import { compile, runTestcase, prepareWorkDir, Verdict } from '../judge/runner.js';
import { JUDGE_QUEUE_NAME } from '../judge/queue.js';
import { SupportedLanguage, LANGUAGE_CONFIG } from '../judge/languages.js';
import {
  loadSampleTestcases,
  loadAllTestcases,
  loadProblemMeta,
} from '../judge/problem-loader.js';
import { check } from '../judge/checker.js';
import { db } from '../db/index.js';
import { submissions } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { emitHintProgress, getHintUnlockMessage, syncHintProgressForTeam } from '../services/hint-progress.js';
import { updateWorkspaceResult } from '../services/workspace.js';



// ── Job types ─────────────────────────────────────────────────────────────────

export interface RunJobData {
  type: 'run';
  language: SupportedLanguage;
  code: string;
  problemId: string;
  customStdin?: string; // optional custom stdin for the Run button
}

export interface SubmitJobData {
  type: 'submit';
  submissionId: string;
  language: SupportedLanguage;
  code: string;
  problemId: string;
  teamId: string;
}

export type JudgeJobData = RunJobData | SubmitJobData;

export interface PerTestcaseResult {
  index: number;
  verdict: Verdict;
  runtimeMs: number;
  memoryKb: number;
}

export interface RunJobResult {
  type: 'run';
  compiled: boolean;
  compileError?: string;
  testcaseResults: Array<{
    index: number;
    verdict: Verdict;
    stdout: string;
    stderr: string;
    runtimeMs: number;
    memoryKb: number;
    input?: string;
    expectedOutput?: string;
  }>;
}

export interface SubmitJobResult {
  type: 'submit';
  submissionId: string;
  verdict: Verdict;
  runtimeMs: number;
  memoryKb: number;
  passedTests: number;
  totalTests: number;
  testcaseResults: PerTestcaseResult[];
}

// ── Verdict priority (worst verdict wins) ─────────────────────────────────────

const VERDICT_PRIORITY: Record<Verdict, number> = {
  AC: 0,
  PE: 1,
  WA: 2,
  TLE: 3,
  MLE: 4,
  OLE: 5,
  RE: 6,
  CE: 7,
  IJE: 8,
};

function worstVerdict(a: Verdict, b: Verdict): Verdict {
  return VERDICT_PRIORITY[a] >= VERDICT_PRIORITY[b] ? a : b;
}

// ── Worker factory ────────────────────────────────────────────────────────────

type WorkerIo = {
  to: (room: string) => { emit: (ev: string, data: unknown) => void };
  emit: (ev: string, data: unknown) => void;
};

export function startJudgeWorker(io?: WorkerIo) {
  const concurrency = parseInt(process.env.JUDGE_CONCURRENCY ?? '2', 10);

  const worker = new Worker<JudgeJobData, RunJobResult | SubmitJobResult>(
    JUDGE_QUEUE_NAME,
    async (job: Job<JudgeJobData>) => {
      const data = job.data;

      if (data.type === 'run') {
        return handleRunJob(data);
      }

      if (data.type === 'submit') {
        const result = await handleSubmitJob(data);
        // Notify the team's socket room
        if (io) {
          io.to(data.teamId).emit('submit:result', {
            submissionId: result.submissionId,
            verdict: result.verdict,
            runtimeMs: result.runtimeMs,
            memoryKb: result.memoryKb,
            passedTests: result.passedTests,
            totalTests: result.totalTests,
          });
          // Broadcast leaderboard update to all
          io.emit('leaderboard:update', {});
        }
        if (result.verdict === 'AC') {
          const snapshot = await syncHintProgressForTeam(data.teamId);
          emitHintProgress(io, snapshot);
          const unlockMessage = getHintUnlockMessage(snapshot.hintProgress);
          if (unlockMessage) {
            io?.to(data.teamId).emit('hint:toast', { message: unlockMessage });
          }
        }
        await updateWorkspaceResult(data.teamId, data.problemId, {
          latestVerdict: result.verdict,
          latestRuntimeMs: result.runtimeMs,
          latestMemoryKb: result.memoryKb,
        });
        return result;
      }

      throw new Error('Unknown job type');
    },
    { connection: connection as any, concurrency },
  );

  worker.on('ready', () => {
    console.log(`[Judge Worker] Ready. Concurrency: ${concurrency}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Judge Worker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

// ── Run handler (sample testcases only, results NOT stored) ───────────────────

async function handleRunJob(data: RunJobData): Promise<RunJobResult> {
  let cleanup: (() => Promise<void>) | null = null;

  try {
    const { workDir, cleanup: cleanFn } = await prepareWorkDir(data.language, data.code);
    cleanup = cleanFn;

    const problem = await loadProblemMeta(data.problemId);

    // Compile
    const compileResult = await compile(data.language, data.code, workDir);
    if (!compileResult.success) {
      return {
        type: 'run',
        compiled: false,
        compileError: compileResult.stderr,
        testcaseResults: [],
      };
    }

    const config = LANGUAGE_CONFIG[data.language];
    const testcases = data.customStdin !== undefined
      ? [{ input: data.customStdin, output: '', inputPath: '', outputPath: '' }]
      : await loadSampleTestcases(data.problemId);

    const testcaseResults: RunJobResult['testcaseResults'] = [];

    for (let i = 0; i < testcases.length; i++) {
      const tc = testcases[i]!;
      const result = await runTestcase(
        data.language,
        data.code,
        tc.input || { filePath: tc.inputPath },
        config.timeoutMs,
        config.memoryMb,
      );

      let tcVerdict = result.verdict;
      
      if (tcVerdict === 'CE') {
        return {
          type: 'run',
          compiled: false,
          compileError: result.stderr,
          testcaseResults: [],
        };
      }

      if (result.verdict === 'AC' && data.customStdin === undefined) {
        const checkerResult = check(
          problem.checkerType ?? 'default',
          tc.output || { filePath: tc.outputPath },
          result.stdout,
          {
            input: tc.input || { filePath: tc.inputPath },
            problemId: data.problemId,
          }
        );
        if (checkerResult.pass) {
          tcVerdict = 'AC';
        } else if (checkerResult.message.startsWith('Presentation Error')) {
          tcVerdict = 'PE';
        } else {
          tcVerdict = 'WA';
        }
      }

      testcaseResults.push({
        index: i,
        verdict: tcVerdict,
        stdout: result.stdout,
        stderr: result.stderr,
        runtimeMs: result.runtimeMs,
        memoryKb: result.memoryKb,
        input: tc.input,
        expectedOutput: tc.output,
      });
    }

    return { type: 'run', compiled: true, testcaseResults };
  } finally {
    if (cleanup) await cleanup();
  }
}

// ── Submit handler (all hidden testcases, results stored to DB) ────────────────

async function handleSubmitJob(data: SubmitJobData): Promise<SubmitJobResult> {
  let cleanup: (() => Promise<void>) | null = null;

  try {
    // Mark submission as JUDGING
    await db.update(submissions)
      .set({ status: 'JUDGING' })
      .where(eq(submissions.id, data.submissionId));

    const { workDir, cleanup: cleanFn } = await prepareWorkDir(data.language, data.code);
    cleanup = cleanFn;

    // Load problem metadata for checker type + limits
    const problem = await loadProblemMeta(data.problemId);
    const config = LANGUAGE_CONFIG[data.language];
    const timeLimit = problem.timeLimit ?? config.timeoutMs;
    const memoryLimit = problem.memoryLimit ?? config.memoryMb;

    // Compile
    const compileResult = await compile(data.language, data.code, workDir);
    if (!compileResult.success) {
      await db.update(submissions)
        .set({
          status: 'DONE',
          verdict: 'CE',
          passedTests: 0,
          totalTests: 0,
          compileLog: compileResult.stderr,
          judgedAt: new Date(),
        })
        .where(eq(submissions.id, data.submissionId));

      return {
        type: 'submit',
        submissionId: data.submissionId,
        verdict: 'CE',
        runtimeMs: 0,
        memoryKb: 0,
        passedTests: 0,
        totalTests: 0,
        testcaseResults: [],
      };
    }

    // Run ALL testcases (samples + hidden)
    const allTestcases = await loadAllTestcases(data.problemId);
    const totalTests = allTestcases.length;

    const testcaseResults: PerTestcaseResult[] = [];
    let overallVerdict: Verdict = 'AC';
    let maxRuntimeMs = 0;
    let maxMemoryKb = 0;
    let passedTests = 0;
    const judgeLog: string[] = [];

    for (let i = 0; i < allTestcases.length; i++) {
      const tc = allTestcases[i]!;

      const result = await runTestcase(
        data.language,
        data.code,
        tc.input || { filePath: tc.inputPath },
        timeLimit,
        memoryLimit,
      );

      maxRuntimeMs = Math.max(maxRuntimeMs, result.runtimeMs);
      maxMemoryKb = Math.max(maxMemoryKb, result.memoryKb);

      let tcVerdict: Verdict = result.verdict;
      
      if (tcVerdict === 'CE') {
        overallVerdict = 'CE';
        judgeLog.push(`Compile Error:\n${result.stderr}`);
        break; // Stop recompiling code that doesn't build
      }

      if (result.verdict === 'AC') {
        const checkerResult = check(
          problem.checkerType ?? 'default',
          tc.output || { filePath: tc.outputPath },
          result.stdout,
          {
            input: tc.input || { filePath: tc.inputPath },
            problemId: data.problemId,
          }
        );

        if (checkerResult.pass) {
          tcVerdict = 'AC';
          passedTests++;
        } else if (checkerResult.message.startsWith('Presentation Error')) {
          tcVerdict = 'PE';
        } else {
          tcVerdict = 'WA';
        }

        judgeLog.push(`TC${i + 1}: ${tcVerdict} (${result.runtimeMs}ms) — ${checkerResult.message}`);
      } else {
        judgeLog.push(`TC${i + 1}: ${tcVerdict} (${result.runtimeMs}ms)`);
      }

      testcaseResults.push({
        index: i,
        verdict: tcVerdict,
        runtimeMs: result.runtimeMs,
        memoryKb: result.memoryKb,
      });

      overallVerdict = worstVerdict(overallVerdict, tcVerdict);
    }

    // Persist full results
    await db.update(submissions)
      .set({
        status: 'DONE',
        verdict: overallVerdict,
        runtimeMs: maxRuntimeMs,
        memoryKb: maxMemoryKb,
        passedTests,
        totalTests,
        testCaseResults: testcaseResults,
        judgeLog: judgeLog.join('\n'),
        judgedAt: new Date(),
      })
      .where(eq(submissions.id, data.submissionId));

    return {
      type: 'submit',
      submissionId: data.submissionId,
      verdict: overallVerdict,
      runtimeMs: maxRuntimeMs,
      memoryKb: maxMemoryKb,
      passedTests,
      totalTests,
      testcaseResults,
    };
  } catch (err) {
    // Internal judge error — update DB so submission doesn't hang
    try {
      await db.update(submissions)
        .set({
          status: 'DONE',
          verdict: 'IJE',
          judgedAt: new Date(),
          judgeLog: String(err),
        })
        .where(eq(submissions.id, data.submissionId));
    } catch {
      // ignore nested DB error
    }

    throw err; // BullMQ will mark the job as failed
  } finally {
    if (cleanup) await cleanup();
  }
}
