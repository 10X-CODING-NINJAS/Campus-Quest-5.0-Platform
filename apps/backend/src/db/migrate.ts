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
    // Check if the schema is stale (missing columns from updated migration).
    // If so, drop everything and re-apply from scratch.
    // This is safe because we are in initial deployment — no user data yet.
    try {
      await db.execute(sql`SELECT "is_paused" FROM "teams" LIMIT 0`);
    } catch {
      console.log('[Database] Schema is stale or missing. Dropping all tables to re-apply migrations...');
      await db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`);
      await db.execute(sql`DROP SCHEMA public CASCADE`);
      await db.execute(sql`CREATE SCHEMA public`);
      await db.execute(sql`GRANT ALL ON SCHEMA public TO PUBLIC`);
      console.log('[Database] Schema reset complete.');
    }

    await migrate(db, { migrationsFolder });
    console.log(`[Database] ✅ Migrations successfully applied from: ${migrationsFolder}`);
  } catch (err: any) {
    console.error('[Database] ❌ Migration error:', err.message);
  }
}
