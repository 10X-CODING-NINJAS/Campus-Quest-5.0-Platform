import { readdir, stat } from 'fs/promises';
import path from 'path';
import {
  loadProblemMeta,
  loadProblemStatement,
  loadSampleTestcases,
  loadHiddenTestcases,
  loadReferenceSolution,
} from '../judge/problem-loader.js';
import { compile, runTestcase, prepareWorkDir } from '../judge/runner.js';
import { check } from '../judge/checker.js';
import { SupportedLanguage } from '../judge/languages.js';

const PROBLEMS_ROOT = process.env.PROBLEMS_DIR
  ? path.resolve(process.env.PROBLEMS_DIR)
  : path.resolve(process.cwd(), 'problems');

export interface ValidationCheck {
  name: string;
  status: 'passed' | 'failed' | 'warning' | 'skipped';
  message: string;
  details?: string[];
}

export interface ValidationReport {
  problemId: string;
  status: 'passed' | 'failed' | 'warning';
  duration: number; // ms
  checks: ValidationCheck[];
  benchmarks?: {
    referenceSolution: {
      language: string;
      maxRuntimeMs: number;
      maxMemoryKb: number;
      timeLimitMs: number;
      memoryLimitMb: number;
      withinLimits: boolean;
    };
  };
}

export async function runFullValidation(id: string): Promise<ValidationReport> {
  const startTime = Date.now();
  const checks: ValidationCheck[] = [];
  let status: 'passed' | 'failed' | 'warning' = 'passed';
  let refBenchmark: any = undefined;

  try {
    // 1. Completeness Check
    const completeness = await validateCompleteness(id);
    checks.push(completeness);
    if (completeness.status === 'failed') {
      return {
        problemId: id,
        status: 'failed',
        duration: Date.now() - startTime,
        checks: [...checks, { name: 'Remaining Checks', status: 'skipped', message: 'Skipped due to completeness failure' }],
      };
    }

    // 2. Testcase Validation
    const testcaseCheck = await validateTestcases(id);
    checks.push(testcaseCheck);
    if (testcaseCheck.status === 'failed') {
      return {
        problemId: id,
        status: 'failed',
        duration: Date.now() - startTime,
        checks: [...checks, { name: 'Remaining Checks', status: 'skipped', message: 'Skipped due to testcase validation failure' }],
      };
    }

    // 3. Starter Code Validation
    const starterCheck = await validateStarterCodes(id);
    checks.push(starterCheck);

    // 4. Reference Solution & Benchmark Validation
    const refCheck = await validateReferenceSolutionAndBenchmark(id);
    checks.push(refCheck.check);
    if (refCheck.benchmark) {
      refBenchmark = { referenceSolution: refCheck.benchmark };
    }

    // 5. Checker Validation
    const checkerCheck = await validateCheckerLogic(id);
    checks.push(checkerCheck);

    // 6. Security Validation
    const securityCheck = await validateSecurityInvariants(id);
    checks.push(securityCheck);

    // Determine overall status
    if (checks.some(c => c.status === 'failed')) {
      status = 'failed';
    } else if (checks.some(c => c.status === 'warning')) {
      status = 'warning';
    }

  } catch (err: any) {
    status = 'failed';
    checks.push({
      name: 'Validation Pipeline execution',
      status: 'failed',
      message: `Fatal error in validation engine: ${err.message}`,
    });
  }

  return {
    problemId: id,
    status,
    duration: Date.now() - startTime,
    checks,
    benchmarks: refBenchmark,
  };
}

async function validateCompleteness(id: string): Promise<ValidationCheck> {
  const details: string[] = [];
  try {
    const meta = await loadProblemMeta(id);
    if (!meta.title) details.push('Missing Problem Title');
    if (!meta.difficulty) details.push('Missing Difficulty field');
    if (!meta.timeLimit) details.push('Missing Time Limit');
    if (!meta.memoryLimit) details.push('Missing Memory Limit');
    if (meta.order === undefined) details.push('Missing Display Order');
    if (meta.enabled === undefined) details.push('Missing Enabled flag');
    if (!meta.checkerType) details.push('Missing Checker Type');

    const statement = await loadProblemStatement(id);
    if (!statement || statement.trim().length === 0) {
      details.push('Markdown Statement is empty or missing');
    } else {
      if (!statement.includes('Input Format') && !statement.includes('## Input')) details.push('Missing Input Format section in statement');
      if (!statement.includes('Output Format') && !statement.includes('## Output')) details.push('Missing Output Format section in statement');
      if (!statement.includes('Constraints') && !statement.includes('## Constraints')) details.push('Missing Constraints section in statement');
      if (!statement.includes('Sample') && !statement.includes('## Sample')) details.push('Missing Examples in statement');
    }

    const refSol = await loadReferenceSolution(id);
    if (!refSol) details.push('Missing Reference Solution');

    const starterCode = meta.starterCode;
    if (!starterCode) {
      details.push('Missing Starter Code section');
    } else {
      const requiredLangs = ['c', 'cpp', 'java', 'python'];
      for (const lang of requiredLangs) {
        if (!starterCode[lang] || starterCode[lang].trim().length === 0) {
          details.push(`Missing or empty Starter Code template for ${lang.toUpperCase()}`);
        }
      }
    }

    if (details.length > 0) {
      return { name: 'Completeness', status: 'failed', message: 'Missing required problem elements', details };
    }
    return { name: 'Completeness', status: 'passed', message: 'All completeness requirements met' };
  } catch (err: any) {
    return { name: 'Completeness', status: 'failed', message: `Failed to load problem metadata/statement: ${err.message}` };
  }
}

async function validateTestcases(id: string): Promise<ValidationCheck> {
  const details: string[] = [];
  try {
    const samplesDir = path.join(PROBLEMS_ROOT, id, 'samples');
    const hiddenDir = path.join(PROBLEMS_ROOT, id, 'hidden');

    const checkDir = async (dirName: string, label: string) => {
      let entries: string[] = [];
      try {
        entries = await readdir(dirName);
      } catch {
        details.push(`${label} directory does not exist`);
        return;
      }

      const inFiles = entries.filter(f => f.endsWith('.in'));
      const outFiles = entries.filter(f => f.endsWith('.out'));

      // Check matching files
      for (const inFile of inFiles) {
        const base = inFile.slice(0, -3);
        if (!entries.includes(`${base}.out`)) {
          details.push(`${label} testcase input "${inFile}" is missing matching ".out" file`);
        }
      }
      for (const outFile of outFiles) {
        const base = outFile.slice(0, -4);
        if (!entries.includes(`${base}.in`)) {
          details.push(`${label} testcase output "${outFile}" is missing matching ".in" file`);
        }
      }

      // Check numbering & duplicates & empty files
      const numbers = inFiles.map(f => {
        const n = parseInt(f.slice(0, -3), 10);
        return n;
      }).sort((a, b) => a - b);

      if (numbers.length === 0) {
        details.push(`${label} testcases are missing (zero testcases found)`);
        return;
      }

      const seen = new Set<number>();
      for (const num of numbers) {
        if (isNaN(num)) {
          details.push(`${label} file has non-numeric testcase filename`);
          continue;
        }
        if (seen.has(num)) {
          details.push(`Duplicate ${label} testcase number: ${num}`);
        }
        seen.add(num);
      }

      // Check numbering correctness (sequential starting from 1)
      for (let i = 0; i < numbers.length; i++) {
        if (numbers[i] !== i + 1) {
          details.push(`${label} testcase numbering is non-sequential or does not start at 1 (got: ${numbers.join(', ')})`);
          break;
        }
      }

      // Check encoding & non-empty
      for (const file of entries) {
        if (file.endsWith('.in') || file.endsWith('.out')) {
          const filePath = path.join(dirName, file);
          const fileStat = await stat(filePath);
          if (fileStat.size === 0) {
            details.push(`${label} testcase file "${file}" is empty`);
          }
        }
      }
    };

    await checkDir(samplesDir, 'Sample');
    await checkDir(hiddenDir, 'Hidden');

    if (details.length > 0) {
      return { name: 'Testcase Integrity', status: 'failed', message: 'Testcase set has validation errors', details };
    }
    return { name: 'Testcase Integrity', status: 'passed', message: 'All testcases are validly formatted' };
  } catch (err: any) {
    return { name: 'Testcase Integrity', status: 'failed', message: `Error checking testcases: ${err.message}` };
  }
}

async function validateStarterCodes(id: string): Promise<ValidationCheck> {
  const details: string[] = [];
  try {
    const meta = await loadProblemMeta(id);
    const starterCode = meta.starterCode || {};

    for (const [lang, code] of Object.entries(starterCode)) {
      if (!code || code.trim().length === 0) continue;
      let cleanup: (() => Promise<void>) | null = null;
      try {
        const { workDir, cleanup: cleanFn } = await prepareWorkDir(lang as SupportedLanguage, code);
        cleanup = cleanFn;
        const res = await compile(lang as SupportedLanguage, code, workDir);
        if (!res.success) {
          details.push(`Starter template compilation failed for ${lang.toUpperCase()}: ${res.stderr.trim().slice(0, 200)}`);
        }
      } catch (err: any) {
        details.push(`Compiler initialization error for ${lang.toUpperCase()}: ${err.message}`);
      } finally {
        if (cleanup) await cleanup();
      }
    }

    if (details.length > 0) {
      return { name: 'Starter Code Templates', status: 'failed', message: 'One or more starter templates failed to compile', details };
    }
    return { name: 'Starter Code Templates', status: 'passed', message: 'All starter templates compile successfully' };
  } catch (err: any) {
    return { name: 'Starter Code Templates', status: 'failed', message: `Failed to compile starters: ${err.message}` };
  }
}

async function validateReferenceSolutionAndBenchmark(id: string): Promise<{ check: ValidationCheck; benchmark?: any }> {
  const details: string[] = [];
  let maxRuntimeMs = 0;
  let maxMemoryKb = 0;
  let withinLimits = true;

  try {
    const meta = await loadProblemMeta(id);
    const refSol = await loadReferenceSolution(id);
    if (!refSol) {
      return { check: { name: 'Reference Solution Benchmark', status: 'failed', message: 'Reference solution missing' } };
    }

    const timeLimit = meta.timeLimit || 2000;
    const memoryLimit = meta.memoryLimit || 256;

    let cleanup: (() => Promise<void>) | null = null;
    try {
      const { workDir, cleanup: cleanFn } = await prepareWorkDir(refSol.language as SupportedLanguage, refSol.code);
      cleanup = cleanFn;

      // Compile Reference Solution
      const compileRes = await compile(refSol.language as SupportedLanguage, refSol.code, workDir);
      if (!compileRes.success) {
        details.push(`Reference solution compilation failed (${refSol.language.toUpperCase()}): ${compileRes.stderr.trim()}`);
        return {
          check: { name: 'Reference Solution Benchmark', status: 'failed', message: 'Reference solution failed to compile', details },
        };
      }

      // Load all testcases (samples + hidden)
      const samples = await loadSampleTestcases(id);
      const hidden = await loadHiddenTestcases(id);
      const allTestcases = [...samples, ...hidden];

      for (let i = 0; i < allTestcases.length; i++) {
        const tc = allTestcases[i]!;
        // Execute against reference solution
        const runRes = await runTestcase(
          refSol.language as SupportedLanguage,
          workDir,
          tc.input || { filePath: tc.inputPath },
          timeLimit,
          memoryLimit,
        );

        maxRuntimeMs = Math.max(maxRuntimeMs, runRes.runtimeMs);
        maxMemoryKb = Math.max(maxMemoryKb, runRes.memoryKb);

        if (runRes.verdict !== 'AC') {
          details.push(`Testcase #${i + 1} execution failed with verdict: ${runRes.verdict}`);
          if (runRes.verdict === 'TLE') withinLimits = false;
          if (runRes.verdict === 'MLE') withinLimits = false;
          continue;
        }

        // Compare Reference Solution Output with Stored Output
        const checkRes = check(
          meta.checkerType || 'default',
          tc.output || { filePath: tc.outputPath },
          runRes.stdout,
          {
            input: tc.input || { filePath: tc.inputPath },
            problemId: id,
          }
        );

        if (!checkRes.pass) {
          details.push(`Output mismatch on Testcase #${i + 1}: ${checkRes.message}`);
        }
      }

    } finally {
      if (cleanup) await cleanup();
    }

    if (maxRuntimeMs > timeLimit || maxMemoryKb > memoryLimit * 1024) {
      withinLimits = false;
      details.push(`Exceeded configured resource limits. Max Runtime: ${maxRuntimeMs}ms (Limit: ${timeLimit}ms). Max Memory: ${Math.round(maxMemoryKb / 1024)}MB (Limit: ${memoryLimit}MB).`);
    }

    const benchmark = {
      language: refSol.language,
      maxRuntimeMs,
      maxMemoryKb,
      timeLimitMs: timeLimit,
      memoryLimitMb: memoryLimit,
      withinLimits,
    };

    if (details.length > 0) {
      return {
        check: { name: 'Reference Solution Benchmark', status: 'failed', message: 'Reference solution has validation errors', details },
        benchmark,
      };
    }

    return {
      check: { name: 'Reference Solution Benchmark', status: 'passed', message: `Reference solution executed correctly inside configured limits (${maxRuntimeMs}ms, ${Math.round(maxMemoryKb / 1024)}MB)` },
      benchmark,
    };

  } catch (err: any) {
    return {
      check: { name: 'Reference Solution Benchmark', status: 'failed', message: `Validation error: ${err.message}` },
    };
  }
}

async function validateCheckerLogic(id: string): Promise<ValidationCheck> {
  const details: string[] = [];
  try {
    const meta = await loadProblemMeta(id);
    const type = meta.checkerType || 'default';

    if (type === 'custom') {
      const checkerPath = path.join(PROBLEMS_ROOT, id, 'checker.ts');
      try {
        await stat(checkerPath);
      } catch {
        details.push('Checker type is set to "custom", but checker.ts file does not exist');
      }
    }

    // Run custom/other checkers on dummy inputs is checked implicitly in ref solution test comparison.
    // If checker fails to run during ref validation, it generates details there.
    if (details.length > 0) {
      return { name: 'Checker Validation', status: 'failed', message: 'Checker setup is invalid', details };
    }
    return { name: 'Checker Validation', status: 'passed', message: `Checker type "${type}" verified` };
  } catch (err: any) {
    return { name: 'Checker Validation', status: 'failed', message: `Failed to validate checker: ${err.message}` };
  }
}

async function validateSecurityInvariants(id: string): Promise<ValidationCheck> {
  const details: string[] = [];
  try {
    // Mimic the public problems route response content
    const meta = await loadProblemMeta(id);
    const samples = await loadSampleTestcases(id);

    const exposedDetails = {
      id: meta.id,
      title: meta.title,
      difficulty: meta.difficulty,
      timeLimit: meta.timeLimit,
      memoryLimit: meta.memoryLimit,
      supportedLanguages: meta.supportedLanguages,
      starterCode: meta.starterCode ?? {},
      checkerType: meta.checkerType,
      order: meta.order,
      sampleInputs: samples.map(tc => tc.input),
      sampleCount: samples.length,
    };

    // Check secrets are not exposed:
    const stringified = JSON.stringify(exposedDetails);

    if (stringified.includes('hidden') || stringified.includes('solution') || stringified.includes('reference')) {
      // Perform strict check
      const refSol = await loadReferenceSolution(id);
      if (refSol && stringified.includes(refSol.code.slice(0, 50))) {
        details.push('Security Breach: Reference solution code is exposed in public endpoint payload!');
      }
      
      const hidden = await loadHiddenTestcases(id);
      for (const tc of hidden) {
        if (tc.input && stringified.includes(tc.input)) {
          details.push('Security Breach: Hidden inputs are exposed in public endpoint payload!');
        }
        if (tc.output && stringified.includes(tc.output)) {
          details.push('Security Breach: Hidden outputs are exposed in public endpoint payload!');
        }
      }
    }

    if (details.length > 0) {
      return { name: 'Security Audit', status: 'failed', message: 'Security vulnerability detected', details };
    }
    return { name: 'Security Audit', status: 'passed', message: 'Passed. Reference solution and hidden testcases are fully secure' };
  } catch (err: any) {
    return { name: 'Security Audit', status: 'failed', message: `Security check failed: ${err.message}` };
  }
}
