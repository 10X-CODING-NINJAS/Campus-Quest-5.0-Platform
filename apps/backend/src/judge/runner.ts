import Dockerode from 'dockerode';
import { mkdtemp, writeFile, rm, chmod } from 'fs/promises';
import { createReadStream } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { LANGUAGE_CONFIG, SupportedLanguage } from './languages.js';

const OUTPUT_LIMIT_BYTES = 4 * 1024 * 1024; // 4 MB
const COMPILE_TIMEOUT_MS = 30_000; // 30s compile timeout

const docker = new Dockerode({
  socketPath: process.env.DOCKER_SOCKET ?? '/var/run/docker.sock',
});

// ── Public types ─────────────────────────────────────────────────────────────

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

// ── Compile ──────────────────────────────────────────────────────────────────

export async function compile(
  language: SupportedLanguage,
  code: string,
  workDir: string,
): Promise<CompileResult> {
  const config = LANGUAGE_CONFIG[language];

  // Write source file
  await writeFile(path.join(workDir, config.filename), code, 'utf-8');

  if (!config.compileCmd) {
    // Python: no compilation step
    return { success: true, stderr: '' };
  }

  const result = await runContainer({
    image: config.image,
    workDir,
    cmd: config.compileCmd,
    stdin: '',
    timeoutMs: COMPILE_TIMEOUT_MS,
    memoryMb: config.memoryMb,
    isCompile: true,
  });

  if (!result.success || result.exitCode !== 0) {
    return { success: false, stderr: result.stderr };
  }

  // Make binary executable (defensive)
  if (language === 'c' || language === 'cpp') {
    try {
      await chmod(path.join(workDir, 'main'), 0o755);
    } catch {
      // ignore if file not yet present
    }
  }

  return { success: true, stderr: result.stderr };
}

// ── Execute single testcase ───────────────────────────────────────────────────

export async function runTestcase(
  language: SupportedLanguage,
  workDir: string,
  stdin: string | { filePath: string },
  timeoutMs: number,
  memoryMb: number,
): Promise<TestcaseResult> {
  const config = LANGUAGE_CONFIG[language];

  let result;
  try {
    result = await runContainer({
      image: config.image,
      workDir,
      cmd: config.runCmd,
      stdin,
      timeoutMs,
      memoryMb,
      isCompile: false,
    });
  } catch (err) {
    return {
      verdict: 'IJE',
      stdout: '',
      stderr: String(err),
      runtimeMs: 0,
      memoryKb: 0,
    };
  }

  if (result.timedOut) {
    return { verdict: 'TLE', stdout: result.stdout, stderr: '', runtimeMs: timeoutMs, memoryKb: result.memoryKb };
  }
  if (result.oomKilled) {
    return { verdict: 'MLE', stdout: result.stdout, stderr: '', runtimeMs: result.runtimeMs, memoryKb: memoryMb * 1024 };
  }
  if (result.stdout.length >= OUTPUT_LIMIT_BYTES) {
    return { verdict: 'OLE', stdout: result.stdout.slice(0, 512), stderr: '', runtimeMs: result.runtimeMs, memoryKb: result.memoryKb };
  }
  if (result.exitCode !== 0) {
    return { verdict: 'RE', stdout: result.stdout, stderr: result.stderr, runtimeMs: result.runtimeMs, memoryKb: result.memoryKb };
  }

  return {
    verdict: 'AC', // Caller will check against expected output
    stdout: result.stdout,
    stderr: result.stderr,
    runtimeMs: result.runtimeMs,
    memoryKb: result.memoryKb,
  };
}

// ── High-level helper: setup workdir, compile, return cleanup fn ──────────────

export async function prepareWorkDir(
  language: SupportedLanguage,
  code: string,
): Promise<{ workDir: string; cleanup: () => Promise<void> }> {
  const workDir = await mkdtemp(path.join(tmpdir(), 'judge-'));
  const cleanup = async () => {
    await rm(workDir, { recursive: true, force: true });
  };
  const config = LANGUAGE_CONFIG[language];
  await writeFile(path.join(workDir, config.filename), code, 'utf-8');
  return { workDir, cleanup };
}

// ── Low-level container runner ────────────────────────────────────────────────

interface ContainerRunOptions {
  image: string;
  workDir: string;
  cmd: string[];
  stdin: string | { filePath: string };
  timeoutMs: number;
  memoryMb: number;
  isCompile: boolean;
}

interface ContainerRunResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  runtimeMs: number;
  memoryKb: number;
  timedOut: boolean;
  oomKilled: boolean;
  success: boolean;
}

async function runContainer(opts: ContainerRunOptions): Promise<ContainerRunResult> {
  const { image, workDir, cmd, stdin, timeoutMs, memoryMb, isCompile } = opts;

  const memoryBytes = memoryMb * 1024 * 1024;

  // Compile step: allow writes (to produce binary). Run step: read-only root + /tmp tmpfs.
  const hostConfig: Dockerode.HostConfig = {
    Memory: memoryBytes,
    MemorySwap: memoryBytes, // disable swap
    CpuPeriod: 100_000,
    CpuQuota: isCompile ? 100_000 : 50_000, // 100% for compile, 50% for run
    PidsLimit: isCompile ? 128 : 64,
    NetworkMode: 'none',
    Binds: [`${workDir}:/box`],
    ReadonlyRootfs: !isCompile,
  };

  if (!isCompile) {
    hostConfig.Tmpfs = { '/tmp': 'rw,noexec,nosuid,size=64m' };
  }

  const container = await docker.createContainer({
    Image: image,
    Cmd: cmd,
    WorkingDir: '/box',
    AttachStdin: true,
    AttachStdout: true,
    AttachStderr: true,
    OpenStdin: true,
    StdinOnce: true,
    HostConfig: hostConfig,
  });

  let stdout = '';
  let stderr = '';
  let timedOut = false;
  let oomKilled = false;
  let memoryKb = 0;
  const startMs = Date.now();

  let timer: NodeJS.Timeout | null = null;
  let statInterval: NodeJS.Timeout | null = null;

  try {
    // Attach streams BEFORE starting
    const stream = await container.attach({
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true,
    });

    // Docker multiplexes stdout/stderr on same stream; demux them
    const stdoutBuf: Buffer[] = [];
    const stderrBuf: Buffer[] = [];

    container.modem.demuxStream(stream, {
      write(chunk: Buffer) {
        stdoutBuf.push(chunk);
      },
    }, {
      write(chunk: Buffer) {
        stderrBuf.push(chunk);
      },
    });

    await container.start();

    // Write stdin then close
    if (stdin) {
      if (typeof stdin === 'string') {
        stream.write(stdin);
        stream.end();
      } else {
        const readStream = createReadStream(stdin.filePath);
        readStream.pipe(stream);
      }
    } else {
      stream.end();
    }

    // Timeout killer
    timer = setTimeout(async () => {
      timedOut = true;
      try {
        await container.kill({ Signal: 'SIGKILL' });
      } catch {
        // already dead
      }
    }, timeoutMs);

    // Collect memory peak via periodic stat polling
    if (!isCompile) {
      statInterval = setInterval(async () => {
        try {
          const stats = await container.stats({ stream: false }) as any;
          const usage = stats?.memory_stats?.usage ?? 0;
          const kb = Math.ceil(usage / 1024);
          if (kb > memoryKb) memoryKb = kb;
        } catch {
          // container may have already exited
        }
      }, 50);
    }

    // Wait for container to exit
    const exitData = await container.wait();
    const runtimeMs = Date.now() - startMs;

    if (timer) clearTimeout(timer);
    if (statInterval) clearInterval(statInterval);

    stdout = Buffer.concat(stdoutBuf).toString('utf-8');
    stderr = Buffer.concat(stderrBuf).toString('utf-8');

    const exitCode: number = exitData.StatusCode ?? -1;

    // OOM: Docker sends SIGKILL (code 137) but not from our timer
    if (exitCode === 137 && !timedOut) {
      oomKilled = true;
    }

    return {
      exitCode,
      stdout,
      stderr,
      runtimeMs,
      memoryKb,
      timedOut,
      oomKilled,
      success: exitCode === 0,
    };
  } finally {
    if (timer) clearTimeout(timer);
    if (statInterval) clearInterval(statInterval);
    // Remove container (--rm equivalent)
    try {
      await container.remove({ force: true });
    } catch {
      // ignore
    }
  }
}
