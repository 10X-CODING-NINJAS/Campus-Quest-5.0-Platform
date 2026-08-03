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
import { JWT_SECRET } from './routes/admin';
import { startJudgeWorker } from './workers/judge.worker';
import { runMigrations } from './db/migrate';

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

  // Sync local problems to database
  await syncProblemsToDatabase();
  // Seed test / dev teams (idempotent)
  await seedTestTeams();
  
  // Start the background code execution worker
  const worker = startJudgeWorker();

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
    // Admin connections can authenticate using adminSecret
    if (socket.handshake.auth?.adminSecret) {
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

  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(`\n[Shutdown] ${signal} received, shutting down gracefully…`);
      await worker.close();
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
