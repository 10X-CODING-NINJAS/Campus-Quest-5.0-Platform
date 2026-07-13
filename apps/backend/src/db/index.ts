import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });

export async function verifyDatabaseSchema(): Promise<void> {
  const requiredTables = ['contests', 'teams', 'submissions', 'team_workspaces', 'team_powerups', 'violations'];
  try {
    // Check tables in information_schema
    const res = await db.execute<{ table_name: string }>(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    const existingTables = new Set(res.map(row => row.table_name));
    const missing = requiredTables.filter(t => !existingTables.has(t));

    if (missing.length > 0) {
      throw new Error(`Required database tables are missing: ${missing.join(', ')}. Please run Drizzle migrations or 'npm run db:push' to initialize the schema.`);
    }
  } catch (err: any) {
    console.error('DATABASE SCHEMA VALIDATION FAILED:', err.message || err);
    throw err;
  }
}

