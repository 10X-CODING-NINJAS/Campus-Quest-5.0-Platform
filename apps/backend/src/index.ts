import './config/env';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { Server as SocketIOServer } from 'socket.io';

import adminRoutes from './routes/admin';
import { seedTestTeams } from './routes/admin';
import workspaceRoutes from './routes/workspace';
import demoRoutes from './routes/demo'; // DEMO: remove before production if desired
import { registerJudgeHandlers } from './socket/judge.handler';
import { registerContestHandlers } from './socket/contest.handler';
import { registerPowerupHandlers } from './socket/powerup.handler';
import { syncProblemsToDatabase } from './services/problems';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, ADMIN_SECRET } from './routes/admin';
import { startJudgeWorker } from './workers/judge.worker';
import { runMigrations } from './db/migrate';
import { db } from './db';
import { connection as redisConnection } from './config/redis';
import { contests } from './db/schema';
import { eq, sql } from 'drizzle-orm';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const HOST = process.env.HOST ?? '0.0.0.0';
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174,http://localhost:3000').split(',');

async function bootstrap() {
  // Validate required environment variables
  const REQUIRED_ENV = ['DATABASE_URL'];
  const missing = REQUIRED_ENV.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`[Startup] ❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('[Startup] Please check your .env file and restart.');
    process.exit(1);
  }

  // Automatically apply database migrations / create missing tables
  await runMigrations();

  // Sync local problems to database and print startup summary
  const syncResult = await syncProblemsToDatabase();
  const totalTestcases = syncResult.totalTestcases;
  const totalProblems = syncResult.totalProblems;
  console.log(`\n📚 ${totalProblems} problems loaded, ${totalTestcases} testcases discovered`);
  // Seed test / dev teams (idempotent)
  await seedTestTeams();
  
  // Start the background code execution worker (unless explicitly disabled)
  let worker: any = null;
  let workerRunning = false;
  if (process.env.DISABLE_JUDGE_WORKER !== 'true') {
    worker = startJudgeWorker();
    workerRunning = true;
  }

  const fastify = Fastify({ logger: true });

  await fastify.register(cors, {
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return cb(null, true);
      // Allow any Vercel preview/production URL
      if (origin.endsWith('.vercel.app')) return cb(null, true);
      // Allow localhost for development
      if (origin.startsWith('http://localhost')) return cb(null, true);
      // Allow explicitly configured origins
      if (CORS_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
  });

  await fastify.register(helmet, { contentSecurityPolicy: false });

  await fastify.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Detailed health check — for Railway health monitoring and manual verification.
  // Does NOT expose credentials or secrets.
  fastify.get('/health/detailed', async (_req, reply) => {
    const checks: Record<string, string> = {};

    // Database check
    try {
      await db.execute(sql`SELECT 1`);
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    // Redis check
    try {
      await redisConnection.ping();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'error';
    }

    checks.judgeWorker = workerRunning ? 'ok' : 'disabled';
    checks.problems = `${totalProblems} loaded (${totalTestcases} testcases)`;
    checks.demoMode = process.env.DEMO_MODE === 'true' ? 'enabled' : 'disabled';

    const allOk = Object.values(checks).every(v => v === 'ok' || v.startsWith('disabled') || v.includes('loaded'));
    return reply.code(allOk ? 200 : 503).send({
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    });
  });

  // Register admin API routes
  await fastify.register(adminRoutes);
  await fastify.register(workspaceRoutes);
  await fastify.register(demoRoutes); // DEMO: remove before production if desired

  // Socket.IO
  const io = new SocketIOServer(fastify.server, {
    cors: {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (origin.endsWith('.vercel.app')) return cb(null, true);
        if (origin.startsWith('http://localhost')) return cb(null, true);
        if (CORS_ORIGINS.includes(origin)) return cb(null, true);
        cb(new Error('Not allowed by CORS'), false);
      },
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  (fastify as any).io = io;

  // Socket.IO Auth Middleware
  io.use((socket, next) => {
    // Admin connections authenticate using ADMIN_SECRET
    const incomingSecret = socket.handshake.auth?.adminSecret;
    if (incomingSecret) {
      if (incomingSecret !== ADMIN_SECRET) {
        return next(new Error('Invalid admin secret'));
      }
      socket.data = { isAdmin: true };
      return next();
    }

    // Normal clients must authenticate using JWT
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication token missing'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { teamId: string; teamName: string };
      socket.data = { teamId: decoded.teamId, teamName: decoded.teamName };
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    fastify.log.info(`[Socket] Client connected: ${socket.id}`);

    // Join a default room or extract teamId from decoded token
    const teamId = socket.data?.teamId;
    if (teamId) {
      socket.join(teamId);
      socket.join(`team:${teamId}`);
      fastify.log.info(`[Socket] Client ${socket.id} associated with team: ${teamId}`);
    }

    registerJudgeHandlers(socket);
    registerContestHandlers(socket, io);
    registerPowerupHandlers(socket, io);

    // Admin dashboard joins the admin-room to receive broadcast events
    socket.on('join:admin', () => {
      if (socket.data?.isAdmin) {
        socket.join('admin-room');
        fastify.log.info(`[Socket] Admin ${socket.id} joined admin-room`);
      } else {
        fastify.log.warn(`[Socket] Unauthorized join:admin attempt by ${socket.id}`);
      }
    });

    socket.on('disconnect', () => {
      fastify.log.info(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  await fastify.listen({ port: PORT, host: HOST });
  console.log(`\n🚀 Campus Quest Backend running at http://${HOST}:${PORT}`);
  console.log(`📡 Socket.IO attached`);
  console.log(`🔒 JWT auth: ENABLED | Admin auth: ENABLED`);
  console.log(`🌐 CORS origins: ${CORS_ORIGINS.join(', ')}`);
  console.log(`⚡ Rate limit: 200 req/min`);

  // Server-authoritative lobby timer check tick
  setInterval(async () => {
    try {
      const allContests = await db.select().from(contests);
      if (allContests.length > 0) {
        const contest = allContests[0];
        if (contest.status === 'LOBBY' && contest.startedAt) {
          const now = new Date();
          if (now.getTime() >= new Date(contest.startedAt).getTime()) {
            await db.update(contests)
              .set({ status: 'RUNNING' })
              .where(eq(contests.id, contest.id));

            if (io) {
              io.emit('contest:started', {
                endsAt: contest.endsAt ? new Date(contest.endsAt).toISOString() : null,
                serverTime: now.toISOString()
              });
            }
            console.log('[Contest Engine] Lobby expired. Contest is now RUNNING.');
          }
        }
      }
    } catch (err: any) {
      console.error('[Contest Engine] Error in lobby check interval:', err.message);
    }
  }, 1000);

  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(`\n[Shutdown] ${signal} received, shutting down gracefully…`);
      if (worker) {
        await worker.close();
      }
      io.close();
      await fastify.close();
      console.log('[Shutdown] Server closed. Goodbye.');
      process.exit(0);
    });
  }
}

bootstrap().catch(err => {
  console.error('[Fatal] Failed to start server:', err);
  process.exit(1);
});
