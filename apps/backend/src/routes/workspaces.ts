import { FastifyInstance } from 'fastify';
import { verifyTeamAuth } from '../middleware/auth.js';
import { listWorkspaces, upsertWorkspace } from '../services/workspace.js';

export default async function workspaceRoutes(fastify: FastifyInstance) {
  fastify.get('/api/workspaces/me', async (request, reply) => {
    const team = await verifyTeamAuth(request, reply);
    if (!team) return;
    return reply.send(await listWorkspaces(team.teamId));
  });

  fastify.put('/api/workspaces/me', async (request, reply) => {
    const team = await verifyTeamAuth(request, reply);
    if (!team) return;
    const payload = request.body as any;
    if (!payload?.problemId) return reply.code(400).send({ error: 'problemId required' });
    return reply.send(await upsertWorkspace(team.teamId, payload));
  });
}
