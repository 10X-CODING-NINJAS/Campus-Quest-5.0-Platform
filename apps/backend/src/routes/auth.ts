import { FastifyInstance } from 'fastify';
import { db } from '../db/index.js';
import { teams } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { signTeamToken } from '../middleware/auth.js';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export default async function authRoutes(fastify: FastifyInstance) {
  // POST /api/auth/login
  fastify.post<{
    Body: { name: string; password?: string };
  }>('/api/auth/login', async (request, reply) => {
    const { name, password = 'password' } = request.body;

    if (!name || !name.trim()) {
      return reply.code(400).send({ error: 'Team name is required' });
    }

    const normalizedName = name.trim();
    const passwordHash = hashPassword(password);

    try {
      // Find team by name
      const [existingTeam] = await db
        .select()
        .from(teams)
        .where(eq(teams.name, normalizedName))
        .limit(1);

      let team = existingTeam;

      if (!existingTeam) {
        // Auto-register team on first login for smooth UX
        const teamId = createId();
        const email = `${normalizedName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${createId().slice(0, 4)}@campusquest.com`;

        const [newTeam] = await db
          .insert(teams)
          .values({
            id: teamId,
            name: normalizedName,
            email,
            passwordHash,
          })
          .returning();

        team = newTeam;
        fastify.log.info(`[Auth] Registered new team: ${normalizedName} (${teamId})`);
      } else {
        // Verify password
        if (existingTeam.passwordHash !== passwordHash) {
          return reply.code(401).send({ error: 'Invalid password for this team' });
        }
      }

      if (team!.isDisqualified) {
        return reply.code(403).send({ error: 'Your team has been disqualified' });
      }

      // Sign JWT token
      const token = signTeamToken({
        teamId: team!.id,
        teamName: team!.name,
      });

      return reply.send({
        token,
        team: {
          id: team!.id,
          name: team!.name,
          isPaused: team!.isPaused,
          spiderSenseCharges: team!.spiderSenseCharges,
        },
      });
    } catch (err) {
      fastify.log.error(err, 'Failed to login team');
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}
