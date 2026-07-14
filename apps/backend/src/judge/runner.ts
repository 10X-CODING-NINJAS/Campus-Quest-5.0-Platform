import { readFile } from 'fs/promises';
import { LANGUAGE_CONFIG, SupportedLanguage } from './languages.js';

export type Verdict = 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' | 'OLE' | 'IJE' | 'PE';

export interface CompileResult {
  success: boolean;
  stderr: string;
}

export interface TestcaseResult {
  verdict: Verdict;
  stdout: string;
  stderr: string;
  runtimeMs: number;
  memoryKb: number;
}

export async function prepareWorkDir(
  language: SupportedLanguage,
  code: string,
): Promise<{ workDir: string; cleanup: () => Promise<void> }> {
  // Piston API executes remotely, so we don't need a local workspace.
  return { workDir: '', cleanup: async () => {} };
}

// Global Token Bucket Rate Limiter for Piston (approx 4 req/sec)
class RateLimiter {
  private tokens = 4;
  private lastRefill = Date.now();
  private queue: (() => void)[] = [];

  constructor(private maxTokens = 4, private refillRatePerSec = 4) {}

  async acquire(): Promise<void> {
    this.refill();
    if (this.tokens > 0) {
      this.tokens--;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this.queue.push(resolve);
      this.scheduleRefill();
    });
  }

  private refill() {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = Math.floor(elapsed * (this.refillRatePerSec / 1000));
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
      while (this.queue.length > 0 && this.tokens > 0) {
        this.tokens--;
        const resolve = this.queue.shift();
        if (resolve) resolve();
      }
    }
  }

  private scheduleRefill() {
    setTimeout(() => this.refill(), 1000 / this.refillRatePerSec);
  }
}

const limiter = new RateLimiter();

// Fetch and cache runtimes
let cachedRuntimes: Record<string, string> = {};
let runtimesFetched = false;

async function getPistonVersion(language: string): Promise<string> {
  if (!runtimesFetched) {
    try {
      const res = await fetch('https://emkc.org/api/v2/piston/runtimes');
      const data = await res.json() as any[];
      for (const rt of data) {
        cachedRuntimes[rt.language] = rt.version;
      }
      runtimesFetched = true;
    } catch (err) {
      console.error('[Piston] Failed to fetch runtimes', err);
    }
  }
  return cachedRuntimes[language] || '*';
}

async function executePiston(payload: any, retries = 3): Promise<any> {
  await limiter.acquire();
  const res = await fetch('https://emkc.org/api/v2/piston/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (res.status === 429 && retries > 0) {
    console.warn(`[Piston] 429 Too Many Requests, retrying in 1s... (${retries} left)`);
    await new Promise(r => setTimeout(r, 1000));
    return executePiston(payload, retries - 1);
  }
  
  if (!res.ok) {
    throw new Error(`Piston API Error: ${res.statusText}`);
  }
  
  return res.json();
}

export async function compile(
  language: SupportedLanguage,
  code: string,
  workDir: string,
): Promise<CompileResult> {
  // Piston combines compile and execute in a single request. 
  // We skip pre-flight compile checks to save API calls, and will handle CE during the first test case.
  return { success: true, stderr: '' };
}

export async function runTestcase(
  language: SupportedLanguage,
  code: string,
  stdinInput: string | { filePath: string },
  timeoutMs: number,
  memoryMb: number,
): Promise<TestcaseResult> {
  const config = LANGUAGE_CONFIG[language];
  
  let stdin = '';
  if (typeof stdinInput === 'string') {
    stdin = stdinInput;
  } else {
    stdin = await readFile(stdinInput.filePath, 'utf-8');
  }

  let pistonLanguage = language as string;
  if (language === 'cpp') pistonLanguage = 'c++';
  const version = await getPistonVersion(pistonLanguage);

  try {
    const data = await executePiston({
      language: pistonLanguage,
      version: version,
      files: [{ name: config.filename, content: code }],
      stdin,
      compile_timeout: 10000,
      run_timeout: timeoutMs,
    });

    if (data.compile && data.compile.code !== 0) {
      return { verdict: 'CE', stdout: '', stderr: data.compile.stderr || data.compile.output, runtimeMs: 0, memoryKb: 0 };
    }

    if (!data.run) {
      return { verdict: 'IJE', stdout: '', stderr: 'No run object returned from Piston', runtimeMs: 0, memoryKb: 0 };
    }

    const run = data.run;
    const stdout = run.stdout || '';
    const stderr = run.stderr || '';
    const exitCode = run.code;
    const signal = run.signal;

    const runtimeMs = 1; // Piston API doesn't expose strict runtime metrics currently, so we use a dummy > 0
    const memoryKb = 0;

    if (signal === 'SIGKILL' || signal === 'SIGTERM') {
      return { verdict: 'TLE', stdout, stderr, runtimeMs: timeoutMs, memoryKb: 0 };
    }
    
    // Check for OLE
    if (stdout.length > 4 * 1024 * 1024) {
      return { verdict: 'OLE', stdout: stdout.slice(0, 512), stderr, runtimeMs, memoryKb };
    }

    if (exitCode !== 0) {
      return { verdict: 'RE', stdout, stderr, runtimeMs, memoryKb };
    }

    return { verdict: 'AC', stdout, stderr, runtimeMs, memoryKb };
  } catch (err) {
    return { verdict: 'IJE', stdout: '', stderr: String(err), runtimeMs: 0, memoryKb: 0 };
  }
}
