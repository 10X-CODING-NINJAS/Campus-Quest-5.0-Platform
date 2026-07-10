import { Server } from 'socket.io';
import { db } from '../db/index.js';
import { contests } from '../db/schema.js';
import { discoverProblems, loadSampleTestcases, loadHiddenTestcases } from '../judge/problem-loader.js';
import { judgeQueue } from '../judge/queue.js';
import { connection } from '../config/redis.js';
import Dockerode from 'dockerode';
import path from 'path';
import { readFile } from 'fs/promises';

const docker = new Dockerode({
  socketPath: process.env.DOCKER_SOCKET ?? '/var/run/docker.sock',
});

const PROBLEMS_ROOT = process.env.PROBLEMS_DIR
  ? path.resolve(process.env.PROBLEMS_DIR)
  : path.resolve(process.cwd(), 'problems');

export interface HealthCheckItem {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
}

export interface HealthCheckReport {
  status: 'READY TO START' | 'FAILED';
  timestamp: string;
  checks: HealthCheckItem[];
}

export async function runContestHealthCheck(io: Server | undefined): Promise<HealthCheckReport> {
  const checks: HealthCheckItem[] = [];

  // 1. Docker Available
  try {
    await docker.ping();
    checks.push({ name: 'Docker daemon connectivity', status: 'passed', message: 'Docker is running and reachable' });
  } catch (err: any) {
    checks.push({ name: 'Docker daemon connectivity', status: 'failed', message: `Docker unreachable: ${err.message}` });
  }

  // 2. Redis Connected
  try {
    const pingRes = await connection.ping();
    if (pingRes === 'PONG') {
      checks.push({ name: 'Redis Connection', status: 'passed', message: 'Redis is connected' });
    } else {
      checks.push({ name: 'Redis Connection', status: 'failed', message: 'Redis returned invalid ping response' });
    }
  } catch (err: any) {
    checks.push({ name: 'Redis Connection', status: 'failed', message: `Redis unreachable: ${err.message}` });
  }

  // 3. Database Connected
  try {
    const contestRow = await db.select().from(contests).limit(1);
    checks.push({ name: 'Database Connectivity', status: 'passed', message: `Postgres connected. Found ${contestRow.length} active contest configuration(s).` });
  } catch (err: any) {
    checks.push({ name: 'Database Connectivity', status: 'failed', message: `Database query failed: ${err.message}` });
  }

  // 4. Judge Workers Running
  try {
    const workers = await judgeQueue.getWorkers();
    if (workers.length > 0) {
      checks.push({ name: 'Judge Workers status', status: 'passed', message: `Found ${workers.length} running judge worker(s)` });
    } else {
      checks.push({
        name: 'Judge Workers status',
        status: 'warning',
        message: 'No judge workers detected running in BullMQ. Queue processing might be delayed.',
      });
    }
  } catch (err: any) {
    checks.push({ name: 'Judge Workers status', status: 'failed', message: `Queue query failed: ${err.message}` });
  }

  // 5. Socket.IO Connected
  if (io) {
    try {
      const clientCount = io.engine.clientsCount;
      checks.push({ name: 'Socket.IO Server', status: 'passed', message: `Socket.IO server active. ${clientCount} clients connected.` });
    } catch (err: any) {
      checks.push({ name: 'Socket.IO Server', status: 'failed', message: `Socket.IO server state check failed: ${err.message}` });
    }
  } else {
    checks.push({ name: 'Socket.IO Server', status: 'warning', message: 'Socket.IO instance was not passed to health checker' });
  }

  // 6. Problems Load Validation
  try {
    const problems = await discoverProblems();
    if (problems.length >= 10) {
      checks.push({ name: 'Contest Problems Count', status: 'passed', message: `10 Problems loaded correctly (Found: ${problems.length})` });
    } else {
      checks.push({ name: 'Contest Problems Count', status: 'failed', message: `Contest requires at least 10 problems. Only found ${problems.length}.` });
    }

    // Validate details of loaded problems
    let missingStatement = false;
    let missingTestcases = false;
    let notPublishedCount = 0;
    let hasOrderDuplicates = false;
    const orders = new Set<number>();

    for (const p of problems) {
      // Check Statement
      try {
        const mdPath = path.join(PROBLEMS_ROOT, p.id, 'statement.md');
        const stat = await readFile(mdPath, 'utf-8');
        if (!stat || stat.trim().length === 0) missingStatement = true;
      } catch {
        missingStatement = true;
      }

      // Check Testcases presence
      const samples = await loadSampleTestcases(p.id);
      const hidden = await loadHiddenTestcases(p.id);
      if (samples.length === 0 || hidden.length === 0) {
        missingTestcases = true;
      }

      // Check Ready / Published Status
      if (p.readyStatus !== 'published') {
        notPublishedCount++;
      }

      // Check Duplicate Display Orders
      if (p.order !== undefined) {
        if (orders.has(p.order)) {
          hasOrderDuplicates = true;
        }
        orders.add(p.order);
      }
    }

    if (missingStatement) {
      checks.push({ name: 'Problem Statements validation', status: 'failed', message: 'One or more problems are missing statement.md content' });
    } else {
      checks.push({ name: 'Problem Statements validation', status: 'passed', message: 'All problem statement markdown files exist' });
    }

    if (missingTestcases) {
      checks.push({ name: 'Problem Testcases presence', status: 'failed', message: 'One or more problems do not have any sample/hidden testcases' });
    } else {
      checks.push({ name: 'Problem Testcases presence', status: 'passed', message: 'All problems contain sample and hidden testcases' });
    }

    if (notPublishedCount > 0) {
      checks.push({ name: 'Published Problems Status', status: 'failed', message: `All contest problems must be Published. Found ${notPublishedCount} draft/ready problem(s).` });
    } else {
      checks.push({ name: 'Published Problems Status', status: 'passed', message: 'All active problems are set to Published status' });
    }

    if (hasOrderDuplicates) {
      checks.push({ name: 'Problem Display Orders', status: 'failed', message: 'Duplicate problem order indices found' });
    } else {
      checks.push({ name: 'Problem Display Orders', status: 'passed', message: 'No duplicate display orders found' });
    }

  } catch (err: any) {
    checks.push({ name: 'Problems Setup Verification', status: 'failed', message: `Problem discovery failed: ${err.message}` });
  }

  // Determine overall status
  const overallStatus = checks.some(c => c.status === 'failed') ? 'FAILED' : 'READY TO START';

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
  };
}
