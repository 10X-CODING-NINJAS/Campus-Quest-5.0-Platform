import { execFileSync } from 'child_process';
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

export type CheckerType = 'default' | 'float' | 'unordered' | 'case-insensitive' | 'custom';

export interface CheckerResult {
  pass: boolean;
  message: string;
}

// ── Token normalisation ─────────────────────────────────────────────────────

function normalizeDefault(s: string): string {
  return s
    .trim()
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n');
}

function tokenize(s: string): string[] {
  return s.trim().split(/\s+/).filter(t => t.length > 0);
}

// ── Checkers ────────────────────────────────────────────────────────────────

function checkDefault(expected: string, actual: string): CheckerResult {
  const e = normalizeDefault(expected);
  const a = normalizeDefault(actual);
  if (e === a) {
    return { pass: true, message: 'Accepted' };
  }
  // Check for presentation error (differs only in whitespace)
  if (tokenize(e).join(' ') === tokenize(a).join(' ')) {
    return { pass: false, message: 'Presentation Error: output differs only in whitespace' };
  }
  return { pass: false, message: 'Wrong Answer' };
}

function checkFloat(expected: string, actual: string, epsilon = 1e-6): CheckerResult {
  const eToks = tokenize(expected);
  const aToks = tokenize(actual);

  if (eToks.length !== aToks.length) {
    return {
      pass: false,
      message: `Wrong Answer: expected ${eToks.length} token(s), got ${aToks.length}`,
    };
  }

  for (let i = 0; i < eToks.length; i++) {
    const ev = parseFloat(eToks[i]!);
    const av = parseFloat(aToks[i]!);

    if (isNaN(ev) || isNaN(av)) {
      if (eToks[i] !== aToks[i]) {
        return { pass: false, message: `Wrong Answer at token ${i + 1}: expected "${eToks[i]}", got "${aToks[i]}"` };
      }
      continue;
    }

    const diff = Math.abs(ev - av);
    const relErr = ev !== 0 ? diff / Math.abs(ev) : diff;
    if (diff > epsilon && relErr > epsilon) {
      return {
        pass: false,
        message: `Wrong Answer at token ${i + 1}: expected ${ev}, got ${av} (diff=${diff.toExponential(3)})`,
      };
    }
  }

  return { pass: true, message: 'Accepted' };
}

function checkUnordered(expected: string, actual: string): CheckerResult {
  const eToks = tokenize(expected).sort();
  const aToks = tokenize(actual).sort();

  if (eToks.join('\0') === aToks.join('\0')) {
    return { pass: true, message: 'Accepted' };
  }
  return { pass: false, message: 'Wrong Answer: tokens differ (order-independent check)' };
}

function checkCaseInsensitive(expected: string, actual: string): CheckerResult {
  const e = normalizeDefault(expected).toLowerCase();
  const a = normalizeDefault(actual).toLowerCase();
  if (e === a) {
    return { pass: true, message: 'Accepted' };
  }
  return { pass: false, message: 'Wrong Answer (case-insensitive check)' };
}

// ── Public API ───────────────────────────────────────────────────────────────

export function check(
  type: CheckerType,
  expected: string | { filePath: string },
  actual: string,
  options?: { epsilon?: number; input?: string | { filePath: string }; problemId?: string },
): CheckerResult {
  // Guard: output limit check — if actual output is unreasonably large, flag OLE
  if (actual.length > 4 * 1024 * 1024) {
    return { pass: false, message: 'Output Limit Exceeded: output exceeded 4 MB' };
  }

  // Resolve expected to string if it's a file path
  let expectedStr = '';
  if (typeof expected === 'string') {
    expectedStr = expected;
  } else {
    try {
      expectedStr = readFileSync(expected.filePath, 'utf-8');
    } catch (e: any) {
      return { pass: false, message: `Internal Error: Failed to read expected output file: ${e.message}` };
    }
  }

  switch (type) {
    case 'default':
      return checkDefault(expectedStr, actual);
    case 'float':
      return checkFloat(expectedStr, actual, options?.epsilon ?? 1e-6);
    case 'unordered':
      return checkUnordered(expectedStr, actual);
    case 'case-insensitive':
      return checkCaseInsensitive(expectedStr, actual);
    case 'custom': {
      if (!options?.problemId) {
        return { pass: false, message: 'Internal Error: problem ID not provided for custom checker' };
      }
      const problemId = options.problemId;
      const PROBLEMS_ROOT = process.env.PROBLEMS_DIR
        ? path.resolve(process.env.PROBLEMS_DIR)
        : path.resolve(process.cwd(), 'problems');
      const checkerPath = path.join(PROBLEMS_ROOT, problemId, 'checker.ts');

      const tempDir = mkdtempSync(path.join(tmpdir(), 'checker-'));
      try {
        const inputPath = options.input && typeof options.input === 'object' && 'filePath' in options.input
          ? options.input.filePath
          : path.join(tempDir, 'input.txt');
        const expectedPath = typeof expected === 'object' && 'filePath' in expected
          ? expected.filePath
          : path.join(tempDir, 'expected.txt');
        const actualPath = path.join(tempDir, 'actual.txt');

        if (inputPath === path.join(tempDir, 'input.txt')) {
          writeFileSync(inputPath, (options.input as string) ?? '', 'utf-8');
        }
        if (expectedPath === path.join(tempDir, 'expected.txt')) {
          writeFileSync(expectedPath, expectedStr, 'utf-8');
        }
        writeFileSync(actualPath, actual, 'utf-8');

        // Execute checker.ts using tsx (since it's a ts file)
        const stdout = execFileSync('npx', [
          'tsx',
          checkerPath,
          inputPath,
          expectedPath,
          actualPath,
        ], {
          timeout: 5000,
          encoding: 'utf-8',
        });

        return { pass: true, message: stdout.trim() || 'Accepted' };
      } catch (err: any) {
        const message = err.stdout?.trim() || err.stderr?.trim() || err.message || 'Wrong Answer';
        return { pass: false, message };
      } finally {
        try {
          rmSync(tempDir, { recursive: true, force: true });
        } catch {}
      }
    }
    default:
      return checkDefault(expectedStr, actual);
  }
}
