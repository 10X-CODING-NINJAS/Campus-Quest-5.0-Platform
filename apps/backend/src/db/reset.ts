import 'dotenv/config';
import { db } from './index.js';
import { sql } from 'drizzle-orm';

async function main() {
  console.log('Resetting Drizzle Database Schema...');
  
  // Clean public schema to drop everything (views, tables, etc.)
  await db.execute(sql`DROP SCHEMA public CASCADE`);
  await db.execute(sql`CREATE SCHEMA public`);
  await db.execute(sql`GRANT ALL ON SCHEMA public TO public`);
  
  console.log('Database reset complete. Please run "npm run db:push" to recreate tables.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
