import { spawn } from 'child_process';
import { mkdtemp, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';
import { SupportedLanguage } from './languages';

interface RunResult {
  verdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE';
  stdout: string;
  stderr: string;
  runtimeMs: number;
}

const TIMEOUT_LIMITS: Record<SupportedLanguage, number> = {
  c: 2000,
  cpp: 2000,
  python: 5000,
  java: 4000,
};

export async function runInSandbox(
  language: SupportedLanguage,
  code: string,
  stdin: string,
  expectedOutput?: string, // omit for "Run", provide for "Submit"
): Promise<RunResult> {
  const workDir = await mkdtemp(path.join(tmpdir(), 'judge-local-'));
  const timeoutMs = TIMEOUT_LIMITS[language] || 2000;

  try {
    if (language === 'python') {
      const filePath = path.join(workDir, 'main.py');
      await writeFile(filePath, code, 'utf8');

      return await executeCommand('python3', [filePath], stdin, timeoutMs, expectedOutput);
    } 

    if (language === 'c' || language === 'cpp') {
      const ext = language === 'c' ? 'c' : 'cpp';
      const compiler = language === 'c' ? 'gcc' : 'g++';
      
      const srcPath = path.join(workDir, `main.${ext}`);
      const binPath = path.join(workDir, 'out');
      await writeFile(srcPath, code, 'utf8');

      // Compile
      const compileResult = await runCompiler(compiler, ['-O2', srcPath, '-o', binPath]);
      if (compileResult.exitCode !== 0) {
        return {
          verdict: 'CE',
          stdout: '',
          stderr: compileResult.stderr || 'Compilation Error',
          runtimeMs: 0,
        };
      }

      // Execute binary
      return await executeCommand(binPath, [], stdin, timeoutMs, expectedOutput);
    }

    if (language === 'java') {
      const srcPath = path.join(workDir, 'Main.java');
      await writeFile(srcPath, code, 'utf8');

      // Compile
      const compileResult = await runCompiler('javac', [srcPath]);
      if (compileResult.exitCode !== 0) {
        return {
          verdict: 'CE',
          stdout: '',
          stderr: compileResult.stderr || 'Compilation Error',
          runtimeMs: 0,
        };
      }

      // Execute java Main
      return await executeCommand('java', ['-cp', workDir, 'Main'], stdin, timeoutMs, expectedOutput);
    }

    throw new Error(`Unsupported language: ${language}`);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

function runCompiler(cmd: string, args: string[]): Promise<{ exitCode: number; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args);
    let stderr = '';
    proc.stderr.on('data', (d) => (stderr += d.toString()));
    proc.on('close', (code) => {
      resolve({ exitCode: code ?? -1, stderr });
    });
  });
}

function executeCommand(
  cmd: string,
  args: string[],
  stdin: string,
  timeoutMs: number,
  expectedOutput?: string
): Promise<RunResult> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args);
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const start = Date.now();

    const timer = setTimeout(() => {
      timedOut = true;
      proc.kill('SIGKILL');
    }, timeoutMs);

    if (stdin) {
      proc.stdin.write(stdin);
    }
    proc.stdin.end();

    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    proc.on('close', (code) => {
      clearTimeout(timer);
      const runtimeMs = Date.now() - start;

      if (timedOut) {
        return resolve({
          verdict: 'TLE',
          stdout,
          stderr: 'Time Limit Exceeded',
          runtimeMs,
        });
      }

      if (code !== 0) {
        return resolve({
          verdict: 'RE',
          stdout,
          stderr: stderr || `Exit code ${code}`,
          runtimeMs,
        });
      }

      // Check output match if expected output is provided
      if (expectedOutput !== undefined) {
        const verdict = normalize(stdout) === normalize(expectedOutput) ? 'AC' : 'WA';
        return resolve({
          verdict,
          stdout,
          stderr,
          runtimeMs,
        });
      }

      resolve({
        verdict: 'AC',
        stdout,
        stderr,
        runtimeMs,
      });
    });
  });
}

function normalize(s: string): string {
  return s.trim().replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '');
}
