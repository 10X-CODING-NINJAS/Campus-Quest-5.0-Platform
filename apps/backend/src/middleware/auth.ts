import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET ?? 'campus-quest-dev-secret';

export interface TeamTokenPayload {
  teamId: string;
  teamName: string;
}

export interface AdminTokenPayload {
  role: 'admin';
}

// ── Team authentication ───────────────────────────────────────────────────────

export function signTeamToken(payload: TeamTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

export async function verifyTeamAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<TeamTokenPayload | null> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing or invalid Authorization header' });
    return null;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TeamTokenPayload;
    return decoded;
  } catch {
    reply.code(401).send({ error: 'Invalid or expired token' });
    return null;
  }
}

// ── Admin authentication ─────────────────────────────────────────────────────

export async function verifyAdminAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<boolean> {
  const token = request.headers['x-admin-token'] as string | undefined;
  const expectedToken = process.env.ADMIN_TOKEN ?? process.env.ADMIN_PASSWORD ?? 'admin';

  if (!token || token !== expectedToken) {
    reply.code(403).send({ error: 'Admin access denied' });
    return false;
  }
  return true;
}
