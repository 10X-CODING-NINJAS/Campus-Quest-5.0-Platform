import { db } from '../db';
import { teamPowerups, teams, contests, submissions, helpRequests, problems } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { broadcastLeaderboard } from '../utils/leaderboard';

const POWERUP_LIMITS = {
  SPIDER_SENSE: 1,
  WEB_FLUID: 2,
  SUIT_TECH: 2
};

export function registerPowerupHandlers(socket: any, io: any) {
  
  // Handle a team using a powerup
  socket.on('powerup:use', async ({ type, problemId }: { type: 'SPIDER_SENSE' | 'WEB_FLUID' | 'SUIT_TECH', problemId?: string }) => {
    const teamId = socket.data?.teamId;
    if (!teamId) return;

    try {
      // 1. Validate team state and inventory
      const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
      if (!team) {
        socket.emit('powerup:error', { message: 'Team not found' });
        return;
      }

      if (team.isPaused || team.isDisqualified) {
        socket.emit('powerup:error', { message: 'Action disabled: Team is paused or disqualified.' });
        return;
      }

      // Check contest state
      const [contest] = await db.select().from(contests);
      if (!contest || contest.status !== 'RUNNING') {
        socket.emit('powerup:error', { message: 'Contest is not running.' });
        return;
      }

      // Check usage limits
      const usages = await db.select()
        .from(teamPowerups)
        .where(and(
          eq(teamPowerups.teamId, teamId),
          eq(teamPowerups.type, type)
        ));
        
      const limit = POWERUP_LIMITS[type] || 0;
      
      if (usages.length >= limit) {
        socket.emit('powerup:error', { message: `Maximum limit of ${limit} reached for ${type}` });
        return;
      }

      if (type === 'SPIDER_SENSE') {
        if (team.spiderSenseCharges <= 0) {
          socket.emit('powerup:error', { message: 'No Spider-Sense charges remaining in inventory' });
          return;
        }

        if (!problemId) {
          socket.emit('powerup:error', { message: 'Mission ID required to activate Spider-Sense.' });
          return;
        }

        if (problemId === '10-final-mission') {
          socket.emit('powerup:error', { message: 'Spider-Sense cannot be used on the Final Mission.' });
          return;
        }

        // Check if problem is already solved or bypassed
        const existingSubmissions = await db.select().from(submissions).where(and(
          eq(submissions.teamId, teamId),
          eq(submissions.problemId, problemId),
          inArray(submissions.verdict, ['AC', 'BYPASSED'])
        ));

        if (existingSubmissions.length > 0) {
          socket.emit('powerup:error', { message: 'Mission is already completed or bypassed.' });
          return;
        }

        await db.transaction(async (tx) => {
          await tx.update(teams)
            .set({ spiderSenseCharges: team.spiderSenseCharges - 1 })
            .where(eq(teams.id, teamId));

          await tx.insert(submissions).values({
            teamId,
            problemId: problemId!,
            language: 'PYTHON',
            sourceCode: 'SPIDER_SENSE_BYPASS',
            verdict: 'BYPASSED',
            runtimeMs: -1,
            memoryKb: -1,
            createdAt: new Date(),
            testCaseResults: [{ index: 0, verdict: 'BYPASSED', runtimeMs: 0, memoryKb: 0 }]
          });
          
          await tx.insert(teamPowerups).values({
            teamId,
            type,
            usedAt: new Date(),
          });
        });
        
        socket.emit('powerup:updated', { type, remaining: team.spiderSenseCharges - 1 });
        socket.emit('submit:result', { 
          status: 'DONE', 
          verdict: 'BYPASSED',
          problemId 
        });

        const allTeamSubs = await db.select({ problemId: submissions.problemId, verdict: submissions.verdict })
          .from(submissions)
          .where(and(
            eq(submissions.teamId, teamId),
            inArray(submissions.verdict, ['AC', 'BYPASSED'])
          ));
        const solvedIds = Array.from(new Set(allTeamSubs.filter(s => s.verdict === 'AC').map(s => s.problemId)));
        const bypassedIds = Array.from(new Set(allTeamSubs.filter(s => s.verdict === 'BYPASSED').map(s => s.problemId)));
        
        socket.emit('team:progress_updated', {
          hintStage: team.hintStage,
          solvedCount: solvedIds.length,
          solvedProblemIds: solvedIds,
          bypassedProblemIds: bypassedIds,
        });
        socket.to(`team:${teamId}`).emit('team:progress_updated', {
          hintStage: team.hintStage,
          solvedCount: solvedIds.length,
          solvedProblemIds: solvedIds,
          bypassedProblemIds: bypassedIds,
        });

        const ioServer = (socket as any).server || socket.conn?.server;
        await broadcastLeaderboard(ioServer, db);
      } else if (type === 'WEB_FLUID') {
        // Time Freeze Mechanic (60 seconds)
        const now = new Date();
        if (team.teamFrozenUntil && new Date(team.teamFrozenUntil) > now) {
          socket.emit('powerup:error', { message: 'Web-Fluid Time Freeze is already active for your team.' });
          return;
        }

        const frozenUntil = new Date(now.getTime() + 60000);

        await db.transaction(async (tx) => {
          await tx.update(teams)
            .set({ teamFrozenUntil: frozenUntil })
            .where(eq(teams.id, teamId));

          await tx.insert(teamPowerups).values({
            teamId,
            type,
            usedAt: now,
          });
        });

        // Broadcast timer freeze to contestant(s)
        const timerPayload = {
          frozenUntil: frozenUntil.toISOString(),
          durationMs: 60000,
        };

        socket.emit('team:timer_frozen', timerPayload);
        socket.to(`team:${teamId}`).emit('team:timer_frozen', timerPayload);

        // Schedule unfreeze notification
        setTimeout(() => {
          socket.emit('team:timer_resumed', { teamId });
          socket.to(`team:${teamId}`).emit('team:timer_resumed', { teamId });
        }, 60000);

      } else if (type === 'SUIT_TECH') {
        // Spider-Comms Tactical Assistance Request
        if (!problemId) {
          socket.emit('powerup:error', { message: 'Mission ID required to request Tactical Assistance.' });
          return;
        }

        // Check if a pending request already exists for this team
        const pending = await db.select()
          .from(helpRequests)
          .where(and(
            eq(helpRequests.teamId, teamId),
            eq(helpRequests.status, 'PENDING')
          ));

        if (pending.length > 0) {
          socket.emit('powerup:error', { message: 'A Tactical Assistance request is already pending for your team.' });
          return;
        }

        let newReqId = '';
        await db.transaction(async (tx) => {
          const [inserted] = await tx.insert(helpRequests).values({
            teamId,
            problemId: problemId!,
            status: 'PENDING',
            createdAt: new Date(),
          }).returning();

          newReqId = inserted.id;

          await tx.insert(teamPowerups).values({
            teamId,
            type,
            usedAt: new Date(),
          });
        });

        // Fetch problem info for admin broadcast
        const [problem] = await db.select().from(problems).where(eq(problems.id, problemId));

        // Emit admin notification
        io.to('admin-room').emit('admin:hint_request', {
          id: newReqId,
          teamId,
          teamName: team.name,
          problemId,
          problemTitle: problem?.title || problemId,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          remainingSuitTech: 2 - (usages.length + 1),
        });

        socket.emit('suit_tech:request_created', {
          id: newReqId,
          problemId,
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        });
      }

      // Fetch updated powerup counts
      const allUsages = await db.select()
        .from(teamPowerups)
        .where(eq(teamPowerups.teamId, teamId));
        
      const counts = {
        SPIDER_SENSE: allUsages.filter(p => p.type === 'SPIDER_SENSE').length,
        WEB_FLUID: allUsages.filter(p => p.type === 'WEB_FLUID').length,
        SUIT_TECH: allUsages.filter(p => p.type === 'SUIT_TECH').length
      };

      // Broadcast updates to team and admin log
      socket.emit('powerup:updated', counts);
      socket.to(`team:${teamId}`).emit('powerup:updated', counts);

      io.to('admin-room').emit('admin:powerup_used', {
        teamId,
        teamName: team.name,
        type,
        counts,
        timestamp: new Date().toISOString(),
        freezeDurationMs: type === 'WEB_FLUID' ? 60000 : undefined,
      });

    } catch (err: any) {
      console.error('[Powerup Error]:', err.message);
      socket.emit('powerup:error', { message: 'Failed to process powerup usage' });
    }
  });

  // Admin sending a hint response for Suit Tech request
  socket.on('admin:send_hint', async ({ requestId, hint, adminName }: { requestId: string; hint: string; adminName?: string }) => {
    try {
      const [req] = await db.select().from(helpRequests).where(eq(helpRequests.id, requestId));
      if (!req || req.status !== 'PENDING') {
        socket.emit('admin:error', { message: 'Request not found or already answered.' });
        return;
      }

      const now = new Date();
      const answeredBy = adminName || 'Spider-Vision Admin';

      await db.update(helpRequests)
        .set({
          status: 'ANSWERED',
          hint,
          answeredBy,
          answeredAt: now,
        })
        .where(eq(helpRequests.id, requestId));

      const payload = {
        requestId,
        teamId: req.teamId,
        problemId: req.problemId,
        hint,
        answeredBy,
        answeredAt: now.toISOString(),
      };

      // Emit to contestant socket & team room
      io.to(`team:${req.teamId}`).emit('team:hint_response', payload);
      io.emit('team:hint_response', payload); // global dispatch check

      // Broadcast to admin room
      io.to('admin-room').emit('admin:hint_answered', payload);
    } catch (err: any) {
      console.error('[Admin Hint Response Error]:', err.message);
      socket.emit('admin:error', { message: 'Failed to send hint.' });
    }
  });
}
