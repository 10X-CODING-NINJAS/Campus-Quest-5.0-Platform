import Docker from 'dockerode';
import { connection } from '../config/redis.js';
import { verifyDatabaseSchema } from '../db/index.js';
import { checkForStaleArtifacts } from './stale-checker.js';

export async function runStartupChecks(): Promise<void> {
  console.log('🔍 Executing startup self-checks...');

  // 1. Check stale build artifacts
  try {
    checkForStaleArtifacts();
  } catch (err) {
    console.warn('⚠️  Could not run build artifact checks:', err);
  }

  // 2. Validate configuration variables
  const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = requiredEnv.filter(k => !process.env[k]);
  if (missing.length > 0) {
    throw new Error(`CRITICAL CONFIGURATION MISSING: ${missing.join(', ')}`);
  }

  // 3. Verify Database connection & schema
  try {
    await verifyDatabaseSchema();
    console.log('✅ Database schema verified.');
  } catch (err: any) {
    throw new Error(`CRITICAL: Database connection or schema validation failed: ${err.message}`);
  }

  // 4. Verify Redis connection
  try {
    await connection.ping();
    console.log('✅ Redis connection verified.');
  } catch (err: any) {
    throw new Error(`CRITICAL: Redis connection failed: ${err.message}`);
  }

  // 5. Verify Docker Host (BullMQ sandbox)
  try {
    const docker = new Docker();
    await docker.ping();
    console.log('✅ Docker Daemon connection verified.');
  } catch (err: any) {
    console.warn('⚠️  Docker Daemon connection failed. submissions requiring Docker sandbox will fail:', err.message);
  }
}
