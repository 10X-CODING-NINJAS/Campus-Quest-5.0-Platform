import { spawn } from 'child_process';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { LANGUAGE_CONFIG, SupportedLanguage } from './languages';

interface RunResult {
  verdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE';
  stdout: string;
  stderr: string;
  runtimeMs: number;
}

export async function runInSandbox(
  language: SupportedLanguage,
  code: string,
  stdin: string,
  expectedOutput?: string, // omit for "Run", provide for "Submit"
): Promise<RunResult> {
  const config = LANGUAGE_CONFIG[language];
  const workDir = await mkdtemp(path.join(tmpdir(), 'judge-'));

  try {
    await writeFile(path.join(workDir, config.filename), code);
    await writeFile(path.join(workDir, 'input.txt'), stdin);

    // Compile step (skip for Python)
    if (config.compileCmd) {
      const compileResult = await runDockerCommand(
        config.image, workDir, config.compileCmd, '', 10000, config.memoryMb,
      );
      if (compileResult.exitCode !== 0) {
        return { verdict: 'CE', stdout: '', stderr: compileResult.stderr, runtimeMs: 0 };
      }
    }

    // Execute step
    const start = Date.now();
    const runResult = await runDockerCommand(
      config.image, workDir, config.runCmd, stdin, config.timeoutMs, config.memoryMb,
    );
    const runtimeMs = Date.now() - start;

    if (runResult.timedOut) {
      return { verdict: 'TLE', stdout: runResult.stdout, stderr: '', runtimeMs };
    }
    if (runResult.oomKilled) {
      return { verdict: 'MLE', stdout: runResult.stdout, stderr: '', runtimeMs };
    }
    if (runResult.exitCode !== 0) {
      return { verdict: 'RE', stdout: runResult.stdout, stderr: runResult.stderr, runtimeMs };
    }

    if (expectedOutput !== undefined) {
      const verdict = normalize(runResult.stdout) === normalize(expectedOutput) ? 'AC' : 'WA';
      return { verdict, stdout: runResult.stdout, stderr: '', runtimeMs };
    }

    return { verdict: 'AC', stdout: runResult.stdout, stderr: '', runtimeMs };
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

function normalize(s: string): string {
  return s.trim().replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '');
}

function runDockerCommand(
  image: string,
  workDir: string,
  cmd: string[],
  stdin: string,
  timeoutMs: number,
  memoryMb: number,
): Promise<{ exitCode: number; stdout: string; stderr: string; timedOut: boolean; oomKilled: boolean }> {
  return new Promise((resolve) => {
    const args = [
      'run', '--rm', '-i',
      '--network', 'none',
      `--memory=${memoryMb}m`,
      `--memory-swap=${memoryMb}m`,
      '--cpus=1',
      '--pids-limit=64',
      '-v', `${workDir}:/box`,
      '--workdir', '/box',
      image,
      ...cmd,
    ];

    const proc = spawn('docker', args);
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGKILL');
    }, timeoutMs);

    proc.stdin.write(stdin);
    proc.stdin.end();

    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    proc.on('close', (code) => {
      clearTimeout(timer);
      const oomKilled = code === 137 && !timedOut; // SIGKILL from OOM killer, not our timeout
      resolve({ exitCode: code ?? -1, stdout, stderr, timedOut, oomKilled });
    });
  });
}
