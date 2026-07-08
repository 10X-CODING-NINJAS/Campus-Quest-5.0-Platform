import { Worker, Job } from 'bullmq';
import { connection } from '../config/redis';
import { runInSandbox } from '../judge/runner';
import { JUDGE_QUEUE_NAME } from '../judge/queue';
import { SupportedLanguage } from '../judge/languages';

interface RunJobData {
  type: 'run';
  language: SupportedLanguage;
  code: string;
  stdin: string;
}

interface SubmitJobData {
  type: 'submit';
  language: SupportedLanguage;
  code: string;
  testCases: Array<{ input: string; output: string }>;
}

type JudgeJobData = RunJobData | SubmitJobData;

export function startJudgeWorker() {
  const worker = new Worker<JudgeJobData>(
    JUDGE_QUEUE_NAME,
    async (job: Job<JudgeJobData>) => {
      const data = job.data;

      if (data.type === 'run') {
        const result = await runInSandbox(data.language, data.code, data.stdin);
        return result;
      }

      if (data.type === 'submit') {
        const testCases = data.testCases;
        const results = [];
        let overallVerdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' = 'AC';
        let maxRuntime = 0;

        for (const [i, tc] of testCases.entries()) {
          const result = await runInSandbox(data.language, data.code, tc.input, tc.output);
          results.push({ index: i, verdict: result.verdict, runtimeMs: result.runtimeMs, memoryKb: 0 });
          maxRuntime = Math.max(maxRuntime, result.runtimeMs);

          if (result.verdict !== 'AC') {
            overallVerdict = result.verdict;
            break; // stop at first failing test
          }
        }

        return { overallVerdict, maxRuntime, results };
      }

      throw new Error(`Unknown job type`);
    },
    { connection, concurrency: 4 } // Allow up to 4 concurrent Docker runs
  );

  worker.on('ready', () => {
    console.log(`[Judge Worker] Started and listening on queue: ${JUDGE_QUEUE_NAME}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Judge Worker] Job ${job?.id} failed with error:`, err.message);
  });

  return worker;
}
