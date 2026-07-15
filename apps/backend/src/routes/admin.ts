import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { teams, contests, problems } from '../db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

export default async function adminRoutes(fastify: FastifyInstance) {
  // 1. Start Global Contest
  fastify.post('/admin/start-contest', async (_request, _reply) => {
    // Assuming a single contest row for simplicity. In production, pass contestId.
    const allContests = await db.select().from(contests);
    if (allContests.length === 0) {
      await db.insert(contests).values({ status: 'RUNNING', durationMs: 7200000 });
    } else {
      await db.update(contests).set({ status: 'RUNNING' }).where(eq(contests.id, allContests[0].id));
    }
    
    // Broadcast to all connected clients that contest started
    const io = (fastify as any).io;
    if (io) {
      io.emit('contest:started');
    }
    
    return { success: true, message: 'Contest started globally' };
  });

  // 1b. Pause Global Contest
  fastify.post('/admin/pause-contest', async (_request, _reply) => {
    const allContests = await db.select().from(contests);
    if (allContests.length > 0) {
      await db.update(contests).set({ status: 'PAUSED' }).where(eq(contests.id, allContests[0].id));
    }
    const io = (fastify as any).io;
    if (io) {
      io.emit('contest:paused');
    }
    return { success: true, message: 'Contest paused globally' };
  });

  // 1c. End Global Contest
  fastify.post('/admin/end-contest', async (_request, _reply) => {
    const allContests = await db.select().from(contests);
    if (allContests.length > 0) {
      await db.update(contests).set({ status: 'ENDED' }).where(eq(contests.id, allContests[0].id));
    }
    const io = (fastify as any).io;
    if (io) {
      io.emit('contest:ended');
    }
    return { success: true, message: 'Contest ended globally' };
  });

  // 1d. Resume Global Contest
  fastify.post('/admin/resume-contest', async (_request, _reply) => {
    const allContests = await db.select().from(contests);
    if (allContests.length > 0) {
      await db.update(contests).set({ status: 'RUNNING' }).where(eq(contests.id, allContests[0].id));
    }
    const io = (fastify as any).io;
    if (io) {
      io.emit('contest:started');
    }
    return { success: true, message: 'Contest resumed globally' };
  });

  // 1e. Emergency Stop Global Contest (disqualifies all teams, stops contest)
  fastify.post('/admin/emergency-stop', async (_request, _reply) => {
    const allContests = await db.select().from(contests);
    if (allContests.length > 0) {
      await db.update(contests).set({ status: 'ENDED' }).where(eq(contests.id, allContests[0].id));
    }
    
    // Disqualify and pause all teams
    await db.update(teams).set({ isPaused: true, isDisqualified: true });

    const io = (fastify as any).io;
    if (io) {
      io.emit('contest:ended');
      io.emit('team:disqualified_all');
    }
    return { success: true, message: 'Emergency stop activated. All teams disqualified.' };
  });

  // 2. Resume a Paused Team
  fastify.post('/admin/resume-team', async (request, reply) => {
    const { teamId } = request.body as { teamId: string };
    if (!teamId) {
      return reply.code(400).send({ error: 'teamId is required' });
    }

    await db.update(teams).set({ isPaused: false, violationCount: 0 }).where(eq(teams.id, teamId));
    
    const io = (fastify as any).io;
    if (io) {
      io.emit('team:resumed', { teamId }); 
    }
    
    return { success: true, message: `Team ${teamId} resumed` };
  });

  // 3. Get all problems
  fastify.get('/api/problems', async (_request, _reply) => {
    const allProblems = await db.select({
      id: problems.id,
      title: problems.title,
      statement: problems.statement,
      order: problems.order,
      timeLimitMs: problems.timeLimitMs,
      memoryLimitMb: problems.memoryLimitMb,
      testCases: problems.testCases,
    }).from(problems).orderBy(problems.order);

    const problemsWithStarters = await Promise.all(allProblems.map(async (p) => {
      const starterDir = path.resolve(process.cwd(), `../../problems/${p.id}/starter`);
      const starters: Record<string, string> = {};
      try {
        starters.c = await fs.readFile(path.join(starterDir, 'c.c'), 'utf8').catch(() => '');
        starters.cpp = await fs.readFile(path.join(starterDir, 'cpp.cpp'), 'utf8').catch(() => '');
        starters.java = await fs.readFile(path.join(starterDir, 'java.java'), 'utf8').catch(() => '');
        starters.python = await fs.readFile(path.join(starterDir, 'python.py'), 'utf8').catch(() => '');
      } catch (err) {}
      return {
        ...p,
        starters,
      };
    }));

    return problemsWithStarters;
  });
}
