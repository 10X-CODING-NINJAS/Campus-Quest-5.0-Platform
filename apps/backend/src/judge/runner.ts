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

export interface BatchResult {
  overallVerdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE';
  compileTimeMs: number;
  results: Array<{
    index: number;
    verdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE';
    runtimeMs: number;
    stdout: string;
    stderr: string;
  }>;
}

export async function runBatchInSandbox(
  language: SupportedLanguage,
  code: string,
  testCases: Array<{ input: string; output: string }>,
  onProgress?: (stage: 'COMPILING' | 'RUNNING', currentTest: number) => void,
): Promise<BatchResult> {
  const workDir = await mkdtemp(path.join(tmpdir(), 'judge-batch-'));
  const timeoutMs = TIMEOUT_LIMITS[language] || 2000;
  let compileTimeMs = 0;

  try {
    // 1. Preparation & Compilation Stage
    onProgress?.('COMPILING', 0);

    if (language === 'python') {
      const filePath = path.join(workDir, 'main.py');
      await writeFile(filePath, code, 'utf8');

      const results = [];
      let overallVerdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' = 'AC';

      for (let i = 0; i < testCases.length; i++) {
        onProgress?.('RUNNING', i + 1);
        const tc = testCases[i];
        const res = await executeCommand('python3', [filePath], tc.input, timeoutMs, tc.output);
        results.push({
          index: i,
          verdict: res.verdict,
          runtimeMs: res.runtimeMs,
          stdout: res.stdout,
          stderr: res.stderr,
        });

        if (res.verdict !== 'AC') {
          overallVerdict = res.verdict;
          break; // Stop on first error
        }
      }

      return { overallVerdict, compileTimeMs, results };
    }

    if (language === 'c' || language === 'cpp') {
      const ext = language === 'c' ? 'c' : 'cpp';
      const compiler = language === 'c' ? 'gcc' : 'g++';
      const srcPath = path.join(workDir, `main.${ext}`);
      const binPath = path.join(workDir, 'out');
      await writeFile(srcPath, code, 'utf8');

      const startCompile = Date.now();
      const compileResult = await runCompiler(compiler, ['-O2', srcPath, '-o', binPath]);
      compileTimeMs = Date.now() - startCompile;

      if (compileResult.exitCode !== 0) {
        return {
          overallVerdict: 'CE',
          compileTimeMs,
          results: [{
            index: 0,
            verdict: 'CE',
            runtimeMs: 0,
            stdout: '',
            stderr: compileResult.stderr || 'Compilation Error',
          }],
        };
      }

      const results = [];
      let overallVerdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' = 'AC';

      for (let i = 0; i < testCases.length; i++) {
        onProgress?.('RUNNING', i + 1);
        const tc = testCases[i];
        const res = await executeCommand(binPath, [], tc.input, timeoutMs, tc.output);
        results.push({
          index: i,
          verdict: res.verdict,
          runtimeMs: res.runtimeMs,
          stdout: res.stdout,
          stderr: res.stderr,
        });

        if (res.verdict !== 'AC') {
          overallVerdict = res.verdict;
          break; // Stop on first error
        }
      }

      return { overallVerdict, compileTimeMs, results };
    }

    if (language === 'java') {
      const srcPath = path.join(workDir, 'Main.java');
      await writeFile(srcPath, code, 'utf8');

      const startCompile = Date.now();
      const compileResult = await runCompiler('javac', [srcPath]);
      compileTimeMs = Date.now() - startCompile;

      if (compileResult.exitCode !== 0) {
        return {
          overallVerdict: 'CE',
          compileTimeMs,
          results: [{
            index: 0,
            verdict: 'CE',
            runtimeMs: 0,
            stdout: '',
            stderr: compileResult.stderr || 'Compilation Error',
          }],
        };
      }

      const results = [];
      let overallVerdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' = 'AC';

      for (let i = 0; i < testCases.length; i++) {
        onProgress?.('RUNNING', i + 1);
        const tc = testCases[i];
        const res = await executeCommand('java', ['-cp', workDir, 'Main'], tc.input, timeoutMs, tc.output);
        results.push({
          index: i,
          verdict: res.verdict,
          runtimeMs: res.runtimeMs,
          stdout: res.stdout,
          stderr: res.stderr,
        });

        if (res.verdict !== 'AC') {
          overallVerdict = res.verdict;
          break; // Stop on first error
        }
      }

      return { overallVerdict, compileTimeMs, results };
    }

    throw new Error(`Unsupported language: ${language}`);
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}

const MAX_OUTPUT_SIZE = 1024 * 1024; // 1MB limit for stdout/stderr to prevent OOM

function runCompiler(cmd: string, args: string[]): Promise<{ exitCode: number; stderr: string }> {
  return new Promise((resolve) => {
    const proc = spawn(cmd, args);
    let stderr = '';
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
      if (stderr.length > MAX_OUTPUT_SIZE) {
        proc.kill('SIGKILL');
      }
    });
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

    proc.stdout.on('data', (d) => {
      stdout += d.toString();
      if (stdout.length > MAX_OUTPUT_SIZE) {
        proc.kill('SIGKILL');
      }
    });
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
      if (stderr.length > MAX_OUTPUT_SIZE) {
        proc.kill('SIGKILL');
      }
    });

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
