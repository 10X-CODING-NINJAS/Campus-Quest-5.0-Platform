import { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../lib/socket';

// ── Result types matching the backend worker output ───────────────────────────

export type Verdict = 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' | 'OLE' | 'IJE' | 'PE';

export interface TestcaseRunResult {
  index: number;
  verdict: Verdict;
  stdout: string;
  stderr: string;
  runtimeMs: number;
  memoryKb: number;
  expectedOutput?: string;
}

export interface RunResult {
  type: 'run';
  compiled: boolean;
  compileError?: string;
  testcaseResults: TestcaseRunResult[];
  error?: string;
}

export interface SubmitResult {
  submissionId: string;
  verdict: Verdict;
  runtimeMs: number;
  memoryKb: number;
  passedTests: number;
  totalTests: number;
  error?: string;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UseJudgeOptions {
  problemId: string;
}

export function useJudge({ problemId }: UseJudgeOptions) {
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [pendingSubmissionId, setPendingSubmissionId] = useState<string | null>(null);

  const runResultCallbackRef = useRef<((result: RunResult) => void) | null>(null);
  const submitResultCallbackRef = useRef<((result: SubmitResult) => void) | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const onRunResult = (result: RunResult) => {
      setRunResult(result);
      setIsRunning(false);
      runResultCallbackRef.current?.(result);
    };

    const onSubmitQueued = ({ submissionId }: { submissionId: string }) => {
      setPendingSubmissionId(submissionId);
    };

    const onSubmitResult = (result: SubmitResult) => {
      setSubmitResult(result);
      setIsSubmitting(false);
      setPendingSubmissionId(null);
      submitResultCallbackRef.current?.(result);
    };

    socket.on('run:result', onRunResult);
    socket.on('submit:queued', onSubmitQueued);
    socket.on('submit:result', onSubmitResult);

    return () => {
      socket.off('run:result', onRunResult);
      socket.off('submit:queued', onSubmitQueued);
      socket.off('submit:result', onSubmitResult);
    };
  }, []);

  const runCode = useCallback(
    (code: string, language: string, customStdin?: string): Promise<RunResult> => {
      return new Promise((resolve) => {
        const socket = getSocket();
        setIsRunning(true);
        setRunResult(null);
        runResultCallbackRef.current = resolve;

        socket.emit('run:code', {
          problemId,
          code,
          language,
          customStdin,
        });

        // Safety timeout — if the worker doesn't respond in 40s, resolve with an error
        const fallback = setTimeout(() => {
          const errorResult: RunResult = {
            type: 'run',
            compiled: false,
            compileError: 'Judge timed out. Please try again.',
            testcaseResults: [],
            error: 'timeout',
          };
          setIsRunning(false);
          setRunResult(errorResult);
          resolve(errorResult);
        }, 40_000);

        runResultCallbackRef.current = (result) => {
          clearTimeout(fallback);
          resolve(result);
        };
      });
    },
    [problemId],
  );

  const submitCode = useCallback(
    (code: string, language: string): Promise<SubmitResult> => {
      return new Promise((resolve) => {
        const socket = getSocket();
        setIsSubmitting(true);
        setSubmitResult(null);
        submitResultCallbackRef.current = resolve;

        socket.emit('submit:code', {
          problemId,
          code,
          language,
        });

        // Longer timeout for full submission
        const fallback = setTimeout(() => {
          const errorResult: SubmitResult = {
            submissionId: pendingSubmissionId ?? 'unknown',
            verdict: 'IJE',
            runtimeMs: 0,
            memoryKb: 0,
            passedTests: 0,
            totalTests: 0,
            error: 'Judge timed out. Check your submission history for the final verdict.',
          };
          setIsSubmitting(false);
          setSubmitResult(errorResult);
          resolve(errorResult);
        }, 120_000); // 2 min timeout for large testcase sets

        submitResultCallbackRef.current = (result) => {
          clearTimeout(fallback);
          resolve(result);
        };
      });
    },
    [problemId, pendingSubmissionId],
  );

  return {
    runCode,
    submitCode,
    isRunning,
    isSubmitting,
    runResult,
    submitResult,
    pendingSubmissionId,
  };
}

// ── Verdict helpers ───────────────────────────────────────────────────────────

export const VERDICT_LABELS: Record<Verdict, string> = {
  AC: '✅ Accepted',
  WA: '❌ Wrong Answer',
  TLE: '⏱️ Time Limit Exceeded',
  MLE: '💾 Memory Limit Exceeded',
  RE: '💥 Runtime Error',
  CE: '🔨 Compile Error',
  OLE: '📃 Output Limit Exceeded',
  PE: '⚠️ Presentation Error',
  IJE: '🔧 Internal Judge Error',
};

export const VERDICT_COLORS: Record<Verdict, string> = {
  AC: '#00d68f',
  WA: '#ff3d71',
  TLE: '#ffaa00',
  MLE: '#ff6600',
  RE: '#ff3d71',
  CE: '#c788ff',
  OLE: '#ffaa00',
  PE: '#ffdd00',
  IJE: '#888888',
};
