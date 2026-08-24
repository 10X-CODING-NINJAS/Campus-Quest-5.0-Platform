import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

export const JUDGE_QUEUE_NAME = 'judge-queue';

// ── Redis connection factory ─────────────────────────────────────────────────
// BullMQ requires each Queue, Worker, and QueueEvents to have its own
// independent ioredis connection. Sharing a single connection causes
// "maxRetriesPerRequest must be null" errors under concurrent load.
export function makeRedisConnection(): Redis {
  const url = process.env.REDIS_URL;
  return url
    ? new Redis(url, { maxRetriesPerRequest: null, enableReadyCheck: false })
    : new Redis({
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });
}

// Separate connections for Queue and QueueEvents (as required by BullMQ)
const queueConnection = makeRedisConnection();
const queueEventsConnection = makeRedisConnection();

// The Queue instance is used to add jobs
export const judgeQueue = new Queue(JUDGE_QUEUE_NAME, { connection: queueConnection as any });

// The QueueEvents instance is used to listen to global queue events (e.g., job completion)
export const judgeQueueEvents = new QueueEvents(JUDGE_QUEUE_NAME, { connection: queueEventsConnection as any });

// Default job options applied to every submission/run job
export const DEFAULT_JOB_OPTIONS = {
  // Submissions must not be retried — a duplicate AC would corrupt the leaderboard.
  // A contestant must resubmit explicitly if the job fails.
  attempts: 1,
  // BullMQ-level job timeout: 60s. This is a safety net beyond the per-language
  // TIMEOUT_LIMITS in runner.ts (2-5s). It prevents runaway system calls from
  // holding a worker slot forever.
  timeout: 60000,
  // Keep the last 100 completed jobs for debugging; remove old ones automatically.
  removeOnComplete: { count: 100 },
  // Keep the last 50 failed jobs for post-contest review.
  removeOnFail: { count: 50 },
};
