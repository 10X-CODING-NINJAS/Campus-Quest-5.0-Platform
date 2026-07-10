import './config/env.js';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

import problemRoutes from './routes/problems.js';
import submissionRoutes from './routes/submissions.js';
import workspaceRoutes from './routes/workspaces.js';
import leaderboardRoutes from './routes/leaderboard.js';
import adminRoutes from './routes/admin.js';
import problemAdminRoutes from './routes/admin/problem-admin.js';
import authRoutes from './routes/auth.js';
import { registerJudgeHandlers } from './socket/judge.handler.js';
import { registerContestHandlers } from './socket/contest.handler.js';
import { registerWorkspaceHandlers } from './socket/workspace.handler.js';
import { registerPowerupHandlers } from './socket/powerup.handler.js';
import { startJudgeWorker } from './workers/judge.worker.js';
import { connection } from './config/redis.js';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const HOST = process.env.HOST ?? '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET ?? 'campus-quest-dev-secret';
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',');

async function bootstrap() {
  // ── Fastify ────────────────────────────────────────────────────────────────
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, {
    origin: CORS_ORIGINS,
    credentials: true,
  });

  await fastify.register(helmet, { contentSecurityPolicy: false });

  await fastify.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Register all API routes
  await fastify.register(problemRoutes);
  await fastify.register(submissionRoutes);
  await fastify.register(workspaceRoutes);
  await fastify.register(leaderboardRoutes);
  await fastify.register(adminRoutes);
  await fastify.register(problemAdminRoutes);
  await fastify.register(authRoutes);

  // ── Socket.IO ──────────────────────────────────────────────────────────────
  const io = new SocketIOServer(fastify.server, {
    cors: {
      origin: CORS_ORIGINS,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Store io on fastify for route access
  (fastify as any).io = io;

  // JWT middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      // Allow unauthenticated connections for contest status updates, but no judge ops
      socket.data.teamId = null;
      return next();
    }
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { teamId: string; teamName: string };
      socket.data.teamId = payload.teamId;
      socket.data.teamName = payload.teamName;
      // Join a room keyed by teamId so workers can push events directly
      socket.join(payload.teamId);
      next();
    } catch {
      // Invalid token: allow connection but no team features
      socket.data.teamId = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    const teamId = socket.data?.teamId;
    fastify.log.info(`[Socket] Client connected: ${socket.id}${teamId ? ` (team: ${teamId})` : ''}`);

    registerJudgeHandlers(socket, io);
    registerContestHandlers(socket);
    registerWorkspaceHandlers(socket);
    registerPowerupHandlers(socket);

    socket.on('disconnect', () => {
      fastify.log.info(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  // ── Judge Worker ───────────────────────────────────────────────────────────
  startJudgeWorker(io);

  // ── Start listening ────────────────────────────────────────────────────────
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`\n🚀 Campus Quest Backend running at http://${HOST}:${PORT}`);
  console.log(`📡 Socket.IO attached`);
  console.log(`⚖️  Judge Worker started`);

  // ── Graceful shutdown ──────────────────────────────────────────────────────
  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(`\n[Shutdown] ${signal} received, shutting down…`);
      await fastify.close();
      await connection.quit();
      process.exit(0);
    });
  }
}

bootstrap().catch(err => {
  console.error('[Fatal] Failed to start server:', err);
  process.exit(1);
});
