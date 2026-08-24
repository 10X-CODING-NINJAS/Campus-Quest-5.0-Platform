import { Worker, Job } from 'bullmq';
import { makeRedisConnection } from '../judge/queue';
import { runInSandbox, runBatchInSandbox } from '../judge/runner';
import { JUDGE_QUEUE_NAME } from '../judge/queue';
import { SupportedLanguage } from '../judge/languages';

interface RunJobData {
  type: 'run';
  language: SupportedLanguage;
  code: string;
  stdin: string;
  expectedOutput?: string;
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
        const result = await runInSandbox(data.language, data.code, data.stdin, data.expectedOutput);
        return result;
      }

      if (data.type === 'submit') {
        const testCases = data.testCases;

        const batchResult = await runBatchInSandbox(
          data.language,
          data.code,
          testCases,
          (stage, currentTest) => {
            job.updateProgress({ stage, currentTest, totalTests: testCases.length }).catch(() => {});
          }
        );

        const results = batchResult.results.map(r => ({
          index: r.index,
          verdict: r.verdict,
          runtimeMs: r.runtimeMs,
          memoryKb: 0
        }));

        const maxRuntime = results.reduce((max, r) => Math.max(max, r.runtimeMs), 0);

        return {
          overallVerdict: batchResult.overallVerdict,
          maxRuntime,
          results
        };
      }

      throw new Error(`Unknown job type`);
    },
    { connection: makeRedisConnection() as any, concurrency: parseInt(process.env.JUDGE_CONCURRENCY || '4', 10) }
  );

  worker.on('ready', () => {
    console.log(`[Judge Worker] Started and listening on queue: ${JUDGE_QUEUE_NAME}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Judge Worker] Job ${job?.id} failed with error:`, err.message);
  });

  return worker;
}
