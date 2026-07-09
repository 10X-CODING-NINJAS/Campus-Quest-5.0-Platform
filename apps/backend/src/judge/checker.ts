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
  expected: string,
  actual: string,
  options?: { epsilon?: number },
): CheckerResult {
  // Guard: output limit check — if actual output is unreasonably large, flag OLE
  if (actual.length > 4 * 1024 * 1024) {
    return { pass: false, message: 'Output Limit Exceeded: output exceeded 4 MB' };
  }

  switch (type) {
    case 'default':
      return checkDefault(expected, actual);
    case 'float':
      return checkFloat(expected, actual, options?.epsilon ?? 1e-6);
    case 'unordered':
      return checkUnordered(expected, actual);
    case 'case-insensitive':
      return checkCaseInsensitive(expected, actual);
    case 'custom':
      // Custom checker support: for now, fall back to default.
      // Full custom checker execution (via tsx) can be added per-problem.
      return checkDefault(expected, actual);
    default:
      return checkDefault(expected, actual);
  }
}
