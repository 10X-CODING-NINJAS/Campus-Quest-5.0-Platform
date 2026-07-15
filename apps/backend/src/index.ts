import './config/env';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { Server as SocketIOServer } from 'socket.io';

import adminRoutes from './routes/admin';
import workspaceRoutes from './routes/workspace';
import { registerJudgeHandlers } from './socket/judge.handler';
import { registerContestHandlers } from './socket/contest.handler';
import { registerPowerupHandlers } from './socket/powerup.handler';
import { syncProblemsToDatabase } from './services/problems';

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const HOST = process.env.HOST ?? '0.0.0.0';
const CORS_ORIGINS = (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:5174,http://localhost:3000').split(',');

async function bootstrap() {
  // Sync local problems to database
  await syncProblemsToDatabase();

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

  // Register admin API routes
  await fastify.register(adminRoutes);
  await fastify.register(workspaceRoutes);

  // Socket.IO
  const io = new SocketIOServer(fastify.server, {
    cors: {
      origin: CORS_ORIGINS,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  (fastify as any).io = io;

  io.on('connection', (socket) => {
    fastify.log.info(`[Socket] Client connected: ${socket.id}`);

    // Join a default room or extract teamId if passed in handshake auth
    const teamId = socket.handshake.auth?.teamId;
    if (teamId) {
      socket.data = socket.data || {};
      socket.data.teamId = teamId;
      socket.join(teamId);
      socket.join(`team:${teamId}`);
      fastify.log.info(`[Socket] Client ${socket.id} associated with team: ${teamId}`);
    }

    registerJudgeHandlers(socket);
    registerContestHandlers(socket, io);
    registerPowerupHandlers(socket, io);

    socket.on('disconnect', () => {
      fastify.log.info(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  await fastify.listen({ port: PORT, host: HOST });
  console.log(`\n🚀 Campus Quest Backend running at http://${HOST}:${PORT}`);
  console.log(`📡 Socket.IO attached`);

  const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT'];
  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(`\n[Shutdown] ${signal} received, shutting down…`);
      await fastify.close();
      process.exit(0);
    });
  }
}

bootstrap().catch(err => {
  console.error('[Fatal] Failed to start server:', err);
  process.exit(1);
});
