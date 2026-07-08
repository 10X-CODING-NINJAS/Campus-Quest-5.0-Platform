import Redis from 'ioredis';

// Shared Redis connection options
const redisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null, // Required by BullMQ
};

// Create a single shared connection for the application
export const connection = new Redis(redisOptions);
