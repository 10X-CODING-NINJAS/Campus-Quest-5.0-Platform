import { readFile, readdir, stat } from 'fs/promises';
import path from 'path';

// Root directory where all problems live.
// In production this is an absolute path outside source; during dev it's relative to CWD.
const PROBLEMS_ROOT = process.env.PROBLEMS_DIR
  ? path.resolve(process.env.PROBLEMS_DIR)
  : path.resolve(process.cwd(), 'problems');

export interface ProblemMeta {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeLimit: number;   // ms
  memoryLimit: number; // MB
  supportedLanguages: string[];
  checkerType: 'default' | 'float' | 'unordered' | 'case-insensitive' | 'custom';
  starterCode?: Record<string, string>;
}

export interface Testcase {
  input: string;
  output: string;
  inputPath: string;
  outputPath: string;
}

// ── Problem metadata ────────────────────────────────────────────────────────

export async function loadProblemMeta(id: string): Promise<ProblemMeta> {
  const jsonPath = path.join(PROBLEMS_ROOT, id, 'problem.json');
  const raw = await readFile(jsonPath, 'utf-8');
  const parsed = JSON.parse(raw) as ProblemMeta;

  const starterCode: Record<string, string> = {};
  const langs = ['c', 'cpp', 'java', 'python'];
  const extMap: Record<string, string> = {
    c: 'c.c',
    cpp: 'cpp.cpp',
    java: 'java.java',
    python: 'python.py',
  };

  const starterDir = path.join(PROBLEMS_ROOT, id, 'starter');
  for (const lang of langs) {
    try {
      const fileContent = await readFile(path.join(starterDir, extMap[lang]), 'utf-8');
      starterCode[lang] = fileContent;
    } catch {
      if (parsed.starterCode?.[lang]) {
        starterCode[lang] = parsed.starterCode[lang];
      }
    }
  }

  parsed.starterCode = starterCode;
  return parsed;
}

export async function loadProblemStatement(id: string): Promise<string> {
  const mdPath = path.join(PROBLEMS_ROOT, id, 'statement.md');
  return readFile(mdPath, 'utf-8');
}

// ── Testcase loading ────────────────────────────────────────────────────────

async function loadTestcasesFromDir(dir: string): Promise<Testcase[]> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return []; // directory doesn't exist → no testcases
  }

  // Collect .in files sorted numerically
  const inFiles = entries
    .filter(f => f.endsWith('.in'))
    .sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      return na - nb;
    });

  const testcases: Testcase[] = [];
  for (const inFile of inFiles) {
    const baseName = inFile.slice(0, -3); // strip ".in"
    const outFile = `${baseName}.out`;
    if (!entries.includes(outFile)) continue; // skip if no matching .out

    const inputPath = path.join(dir, inFile);
    const outputPath = path.join(dir, outFile);

    let input = '';
    let output = '';

    try {
      const inputStat = await stat(inputPath);
      if (inputStat.size < 5 * 1024 * 1024) {
        input = await readFile(inputPath, 'utf-8');
      }
    } catch {}

    try {
      const outputStat = await stat(outputPath);
      if (outputStat.size < 5 * 1024 * 1024) {
        output = await readFile(outputPath, 'utf-8');
      }
    } catch {}

    testcases.push({ input, output, inputPath, outputPath });
  }

  return testcases;
}

export async function loadSampleTestcases(id: string): Promise<Testcase[]> {
  return loadTestcasesFromDir(path.join(PROBLEMS_ROOT, id, 'samples'));
}

/**
 * SECURITY: This function must NEVER be called from any route handler exposed to the frontend.
 * Only the judge worker may call this.
 */
export async function loadHiddenTestcases(id: string): Promise<Testcase[]> {
  return loadTestcasesFromDir(path.join(PROBLEMS_ROOT, id, 'hidden'));
}

/**
 * Loads ALL testcases (samples + hidden) for judge execution.
 * SECURITY: Called only from the judge worker, never from an API route.
 */
export async function loadAllTestcases(id: string): Promise<Testcase[]> {
  const [samples, hidden] = await Promise.all([
    loadSampleTestcases(id),
    loadHiddenTestcases(id),
  ]);
  return [...samples, ...hidden];
}

// ── Problem discovery ───────────────────────────────────────────────────────

export async function discoverProblems(): Promise<ProblemMeta[]> {
  let entries: string[];
  try {
    entries = await readdir(PROBLEMS_ROOT);
  } catch {
    return [];
  }

  const metas: ProblemMeta[] = [];
  for (const entry of entries) {
    try {
      const meta = await loadProblemMeta(entry);
      metas.push(meta);
    } catch {
      // skip malformed problem directories
    }
  }

  return metas;
}
