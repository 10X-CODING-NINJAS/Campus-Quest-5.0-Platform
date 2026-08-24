import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index';
import { sql } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

export async function runMigrations() {
  console.log('[Database] Checking & applying database migrations...');
  const candidates = [
    path.resolve(__dirname, '../../drizzle'),
    path.resolve(__dirname, '../drizzle'),
    path.resolve(process.cwd(), 'apps/backend/drizzle'),
    path.resolve(process.cwd(), 'drizzle'),
  ];

  const migrationsFolder = candidates.find((p) => fs.existsSync(p));
  if (!migrationsFolder) {
    console.warn('[Database] ⚠️ Migrations folder not found. Candidate paths checked:', candidates);
    return;
  }

  try {
    // ── Safe schema evolution ──────────────────────────────────────────────────
    // Instead of DROP SCHEMA (which destroys all contest data), we add missing
    // columns individually using IF NOT EXISTS. This is safe to run mid-contest.
    //
    // Add columns introduced in the lobby phase if they don't exist yet.
    // This runs before the Drizzle migrator so the migrator sees a consistent schema.
    await db.execute(sql`
      ALTER TABLE contests
        ADD COLUMN IF NOT EXISTS lobby_started_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS lobby_duration_ms INTEGER DEFAULT 900000
    `);

    // Run the Drizzle migration files (idempotent — already-applied migrations are skipped).
    await migrate(db, { migrationsFolder });
    console.log(`[Database] ✅ Migrations successfully applied from: ${migrationsFolder}`);
  } catch (err: any) {
    console.error('[Database] ❌ Migration error:', err.message);
    // Do NOT exit — let the server start and serve what it can.
    // A broken migration should not take down a running contest.
  }
}
