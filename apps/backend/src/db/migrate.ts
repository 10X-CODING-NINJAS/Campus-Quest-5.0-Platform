import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './index';
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
    await migrate(db, { migrationsFolder });
    console.log(`[Database] ✅ Migrations successfully applied from: ${migrationsFolder}`);
  } catch (err: any) {
    console.error('[Database] ❌ Migration error:', err.message);
  }
}
