import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { teams, contests } from '../db/schema';
import { eq } from 'drizzle-orm';

export default async function adminRoutes(fastify: FastifyInstance) {
  // 1. Start Global Contest
  fastify.post('/admin/start-contest', async (request, reply) => {
    // Assuming a single contest row for simplicity. In production, pass contestId.
    const allContests = await db.select().from(contests);
    if (allContests.length === 0) {
      await db.insert(contests).values({ status: 'RUNNING' });
    } else {
      await db.update(contests).set({ status: 'RUNNING' }).where(eq(contests.id, allContests[0].id));
    }
    
    // Broadcast to all connected clients that contest started
    // Note: requires access to socket io instance on fastify
    const io = (fastify as any).io;
    if (io) {
      io.emit('contest:started');
    }
    
    return { success: true, message: 'Contest started globally' };
  });

  // 2. Resume a Paused Team
  fastify.post('/admin/resume-team', async (request, reply) => {
    const { teamId } = request.body as { teamId: string };
    if (!teamId) {
      return reply.code(400).send({ error: 'teamId is required' });
    }

    await db.update(teams).set({ isPaused: false, violationCount: 0 }).where(eq(teams.id, teamId));
    
    // Broadcast to that specific team (assuming they joined a room with their teamId, or broadcast globally and let client filter)
    const io = (fastify as any).io;
    if (io) {
      // In a real app, users should join a socket room matching their teamId
      // io.to(teamId).emit('team:resumed');
      io.emit('team:resumed', { teamId }); 
    }
    
    return { success: true, message: `Team ${teamId} resumed` };
  });
}
