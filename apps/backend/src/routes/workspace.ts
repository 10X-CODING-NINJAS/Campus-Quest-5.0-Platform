import { FastifyInstance } from 'fastify';
import { db } from '../db';
import { teamWorkspaces, teams, submissions } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './admin';

/** Extract and verify teamId from JWT Authorization header. Returns null if invalid. */
function extractTeamId(request: any): string | null {
  const auth = request.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET) as { teamId: string };
    return decoded.teamId;
  } catch {
    return null;
  }
}

export default async function workspaceRoutes(fastify: FastifyInstance) {
  // 1. Get saved workspace for a problem
  fastify.get('/api/workspace/:problemId', async (request, reply) => {
    const { problemId } = request.params as { problemId: string };
    const teamId = extractTeamId(request);
    if (!teamId) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Valid JWT required to access workspace.' });
    }

    try {
      const [workspace] = await db.select()
        .from(teamWorkspaces)
        .where(and(
          eq(teamWorkspaces.teamId, teamId),
          eq(teamWorkspaces.problemId, problemId)
        ));

      if (!workspace) {
        return reply.code(200).send({
          found: false,
          workspace: null,
        });
      }

      return {
        found: true,
        workspace,
      };
    } catch (err: any) {
      fastify.log.error('Failed to get workspace:', err.message);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // 2. Save workspace autosave state
  fastify.post('/api/workspace/save', async (request, reply) => {
    const teamId = extractTeamId(request);
    if (!teamId) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Valid JWT required to save workspace.' });
    }
    const {
      problemId,
      language,
      sourceCode,
      cursorLine,
      cursorColumn,
      scrollPosition,
      clientTimestamp,
    } = request.body as {
      problemId: string;
      language: 'C' | 'CPP' | 'PYTHON' | 'JAVA';
      sourceCode: string;
      cursorLine?: number;
      cursorColumn?: number;
      scrollPosition?: number;
      clientTimestamp?: number;
    };

    if (!problemId || !language || sourceCode === undefined) {
      return reply.code(400).send({ error: 'problemId, language, and sourceCode are required' });
    }

    try {
      // Ensure team exists (self-healing db during local testing)
      const [existingTeam] = await db.select().from(teams).where(eq(teams.id, teamId));
      if (!existingTeam) {
        await db.insert(teams).values({
          id: teamId,
          name: teamId,
          email: `${teamId}@campus-quest.com`,
          passwordHash: 'placeholder',
        });
      }

      // Check if workspace state already exists
      const [existingWorkspace] = await db.select()
        .from(teamWorkspaces)
        .where(and(
          eq(teamWorkspaces.teamId, teamId),
          eq(teamWorkspaces.problemId, problemId)
        ));

      if (existingWorkspace) {
        // Update
        // Check if the incoming payload is older than the last save
        const incomingTime = clientTimestamp ?? 0;
        const lastSavedTime = existingWorkspace.lastClientUpdate || 0;
        
        if (incomingTime > 0 && incomingTime <= lastSavedTime) {
          // Reject stale payload silently
          return reply.code(200).send({ success: true, message: 'Ignored stale autosave payload.' });
        }

        await db.update(teamWorkspaces)
          .set({
            language,
            sourceCode,
            cursorLine: cursorLine ?? existingWorkspace.cursorLine,
            cursorColumn: cursorColumn ?? existingWorkspace.cursorColumn,
            scrollPosition: scrollPosition ?? existingWorkspace.scrollPosition,
            lastClientUpdate: incomingTime,
            updatedAt: new Date(),
          })
          .where(eq(teamWorkspaces.id, existingWorkspace.id));
      } else {
        // Insert
        await db.insert(teamWorkspaces)
          .values({
            teamId,
            problemId,
            language,
            sourceCode,
            cursorLine: cursorLine ?? 1,
            cursorColumn: cursorColumn ?? 1,
            scrollPosition: scrollPosition ?? 0,
            lastClientUpdate: clientTimestamp ?? 0,
          });
      }

      return { success: true };
    } catch (err: any) {
      fastify.log.error('Failed to save workspace:', err.message);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });

  // 3. Get submission history for a problem
  fastify.get('/api/workspace/:problemId/submissions', async (request, reply) => {
    const { problemId } = request.params as { problemId: string };
    const teamId = extractTeamId(request);
    if (!teamId) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Valid JWT required.' });
    }

    try {
      const history = await db.select()
        .from(submissions)
        .where(and(
          eq(submissions.teamId, teamId),
          eq(submissions.problemId, problemId)
        ))
        .orderBy(desc(submissions.createdAt));

      return history;
    } catch (err: any) {
      fastify.log.error('Failed to get submission history:', err.message);
      return reply.code(500).send({ error: 'Internal Server Error' });
    }
  });
}
