import { Queue, QueueEvents } from 'bullmq';
import { connection } from '../config/redis';

export const JUDGE_QUEUE_NAME = 'judge-queue';

// The Queue instance is used to add jobs
export const judgeQueue = new Queue(JUDGE_QUEUE_NAME, { connection: connection as any });

// The QueueEvents instance is used to listen to global queue events (e.g., job completion)
export const judgeQueueEvents = new QueueEvents(JUDGE_QUEUE_NAME, { connection: connection as any });
