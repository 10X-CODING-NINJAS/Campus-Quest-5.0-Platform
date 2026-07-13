import { useState, useEffect, useRef } from 'react';
import LeftSidebar from './LeftSidebar';
import ComicModal from './ComicModal';
import EditorPanel from './EditorPanel';
import SpideySenseModal from './SpideySenseModal';
import { Challenge, SubmissionResult } from '../types';
import { useJudge } from '../hooks/useJudge';
import { getSocket } from '../lib/socket';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

const CXX_TEMPLATE = `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    \n    // Write your C++17 code here\n    \n    return 0;\n}\n`;

interface RightPanelProps {
  questionNum: number;
  powerupCounts: { SPIDER_SENSE: number; WEB_FLUID: number; SUIT_TECH: number };
  onUsePowerup: (type: 'SPIDER_SENSE' | 'WEB_FLUID' | 'SUIT_TECH') => void;
  onUseSpideySenseSuccess?: () => void;
  problem: any;
  loading: boolean;
  questionsSolved: number;
  onSolveSuccess: () => void;
}

export default function RightPanel({
  powerupCounts,
  onUsePowerup,
  onUseSpideySenseSuccess,
  problem,
  loading: _loading,
  questionsSolved,
  onSolveSuccess
}: RightPanelProps) {
  const [workspaceCode, setWorkspaceCode] = useState('');
  const [workspaceLanguage, setWorkspaceLanguage] = useState<'cpp' | 'python' | 'c' | 'java'>('cpp');
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [scrollTop, setScrollTop] = useState(0);
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  const [workspaceMeta, setWorkspaceMeta] = useState<{ latestVerdict?: string | null; latestRuntimeMs?: number | null; latestMemoryKb?: number | null; lastSavedAt?: string | null }>({});
  const saveTimerRef = useRef<number | null>(null);

  // Judge states
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [modalStatus, setModalStatus] = useState<'ACCEPTED' | 'FAILED' | 'COMPILE_ERROR' | 'IDLE'>('IDLE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [passedCount, setPassedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [runtimeMs, setRuntimeMs] = useState(0);
  const [memoryMb, setMemoryMb] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const [isSpideyModalOpen, setIsSpideyModalOpen] = useState(false);

  const mappedLang = workspaceLanguage;

  // Instantiate the judge integration hook
  const { runCode, submitCode, isRunning, isSubmitting } = useJudge({
    problemId: problem?.id ?? '',
  });

  useEffect(() => {
    setWorkspaceLoaded(false);
    if (!problem?.id) return;
    const socket = getSocket();
    socket.emit('workspace:sync');
    const onSnapshot = (payload: { workspaces: any[] }) => {
      const found = payload.workspaces.find((item) => item.problemId === problem.id);
      if (found) {
        const lang = found.selectedLanguage ?? 'cpp';
        setWorkspaceCode(found.sourceCode || problem.starterCode?.[lang] || CXX_TEMPLATE);
        setWorkspaceLanguage(lang);
        setCursorPosition({ line: found.cursorLine ?? 1, column: found.cursorColumn ?? 1 });
        setScrollTop(found.scrollTop ?? 0);
        setWorkspaceMeta({
          latestVerdict: found.latestVerdict,
          latestRuntimeMs: found.latestRuntimeMs,
          latestMemoryKb: found.latestMemoryKb,
          lastSavedAt: found.lastSavedAt,
        });
      } else {
        const lang = 'cpp';
        const starter = problem.starterCode?.[lang];
        setWorkspaceCode(starter || CXX_TEMPLATE);
        setWorkspaceLanguage(lang);
        setCursorPosition({ line: 1, column: 1 });
        setScrollTop(0);
        setWorkspaceMeta({});
      }
      setWorkspaceLoaded(true);
    };
    const onSaved = (saved: any) => {
      if (saved.problemId !== problem.id) return;
      setWorkspaceMeta({
        latestVerdict: saved.latestVerdict,
        latestRuntimeMs: saved.latestRuntimeMs,
        latestMemoryKb: saved.latestMemoryKb,
        lastSavedAt: saved.lastSavedAt,
      });
    };
    socket.on('workspace:snapshot', onSnapshot);
    socket.on('workspace:saved', onSaved);
    return () => {
      socket.off('workspace:snapshot', onSnapshot);
      socket.off('workspace:saved', onSaved);
    };
  }, [problem?.id]);

  const handleLanguageChange = (lang: 'cpp' | 'python' | 'c' | 'java') => {
    setWorkspaceLanguage(lang);
    const currentCodeTrimmed = workspaceCode.trim();
    const isDefaultOrEmpty =
      !currentCodeTrimmed ||
      currentCodeTrimmed === CXX_TEMPLATE.trim() ||
      Object.values(problem?.starterCode || {}).some(code => typeof code === 'string' && currentCodeTrimmed === code.trim());

    if (isDefaultOrEmpty && problem?.starterCode?.[lang]) {
      setWorkspaceCode(problem.starterCode[lang]);
    }
  };

  useEffect(() => {
    if (!workspaceLoaded || !problem?.id) return;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      getSocket().emit('workspace:update', {
        problemId: problem.id,
        sourceCode: workspaceCode,
        selectedLanguage: workspaceLanguage,
        cursorLine: cursorPosition.line,
        cursorColumn: cursorPosition.column,
        scrollTop,
        latestVerdict: workspaceMeta.latestVerdict ?? null,
        latestRuntimeMs: workspaceMeta.latestRuntimeMs ?? null,
        latestMemoryKb: workspaceMeta.latestMemoryKb ?? null,
      });
    }, 2000);
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [workspaceCode, workspaceLanguage, cursorPosition, scrollTop, problem?.id, workspaceLoaded]);

  // Load code from LocalStorage or starterCode when problem or language switches
  useEffect(() => {
    setConsoleLogs([`⚙ Terminal ready. Waiting for code compilation...`]);
    setModalStatus('IDLE');
  }, [problem]);

  // Handle Monaco changes with immediate state saving (Autosave!)
  const handleEditorChange = (value: string) => {
    setWorkspaceCode(value);
  };

  const currentCode = workspaceCode || '';

  // ── Run Code (compile & run against sample test cases only) ──────────────────
  const handleRunCode = async () => {
    if (!problem || isRunning || isSubmitting) return;

    setConsoleLogs([
      `⚙ Compiling solution for ${problem.title}...`,
      `⚙ Dispatching to isolated container sandbox...`,
    ]);

    try {
      const res = await runCode(currentCode, mappedLang);

      if (!res.compiled) {
        setConsoleLogs(prev => [
          ...prev,
          `✗ COMPILATION ERROR`,
          res.compileError || 'Unknown compiler error.',
        ]);
        setModalStatus('COMPILE_ERROR');
        setErrorMessage(res.compileError);
        setPassedCount(0);
        setTotalCount(0);
        setRuntimeMs(0);
        setMemoryMb(0);
        setIsModalOpen(true);
        return;
      }

      const logs: string[] = [`✓ Compilation Succeeded.`, `⚙ Running sample testcases...`];
      let allAc = true;
      let maxTime = 0;
      let maxMem = 0;

      res.testcaseResults.forEach((tc, idx) => {
        maxTime = Math.max(maxTime, tc.runtimeMs);
        maxMem = Math.max(maxMem, tc.memoryKb);
        const verdictLabel = tc.verdict === 'AC' ? 'Passed' : tc.verdict;
        logs.push(
          `${tc.verdict === 'AC' ? '✓' : '✗'} Sample Case ${idx + 1}: ${verdictLabel} (${tc.runtimeMs}ms)`
        );

        if (tc.verdict !== 'AC') {
          allAc = false;
          if (tc.expectedOutput) {
            logs.push(`   Expected: "${tc.expectedOutput.trim()}"`);
          }
          logs.push(`   Actual:   "${tc.stdout.trim()}"`);
          if (tc.stderr) {
            logs.push(`   Stderr:   "${tc.stderr.trim()}"`);
          }
        }
      });

      if (allAc) {
        logs.push(`✓ RUN SUCCESSFUL: All samples match expected output!`);
        setModalStatus('ACCEPTED');
      } else {
        logs.push(`✗ RUN FAILED: Output differences detected.`);
        setModalStatus('FAILED');
      }

      setConsoleLogs(prev => [...prev, ...logs]);
      setPassedCount(res.testcaseResults.filter(tc => tc.verdict === 'AC').length);
      setTotalCount(res.testcaseResults.length);
      setRuntimeMs(maxTime);
      setMemoryMb(Math.round((maxMem / 1024) * 10) / 10);
      setErrorMessage(allAc ? undefined : "Output mismatch on sample test cases.");
      setIsModalOpen(true);
    } catch (err) {
      setConsoleLogs(prev => [...prev, `✗ Error running code: internal exception.`]);
    }
  };

  // ── Submit Code (compile & run against ALL hidden test cases) ─────────────────
  const handleSubmitCode = async () => {
    if (!problem || isRunning || isSubmitting) return;

    setConsoleLogs([
      `⚙ Compiling solution...`,
      `⚙ Queueing submission job...`,
      `⚙ Running all hidden testcases (results are secured)...`,
    ]);

    try {
      const res = await submitCode(currentCode, mappedLang);

      if (res.verdict === 'CE') {
        setConsoleLogs(prev => [
          ...prev,
          `✗ COMPILATION ERROR`,
        ]);
        setModalStatus('COMPILE_ERROR');

        // Fetch details of compilation output
        let compLog = 'Check compiler output.';
        try {
          const token = localStorage.getItem('auth_token');
          const subRes = await fetch(`${BACKEND_URL}/api/submissions/${res.submissionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (subRes.ok) {
            const subData = await subRes.json();
            compLog = subData.compileLog || compLog;
          }
        } catch {}

        setErrorMessage(compLog);
        setPassedCount(0);
        setTotalCount(res.totalTests || 1);
        setIsModalOpen(true);
        return;
      }

      const isAc = res.verdict === 'AC';
      const logs = [
        isAc ? `✓ Submission Accepted!` : `✗ Submission Failed: ${res.verdict}`,
        `✓ Passed ${res.passedTests} / ${res.totalTests} cases`,
      ];
      setConsoleLogs(prev => [...prev, ...logs]);
      setPassedCount(res.passedTests);
      setTotalCount(res.totalTests);
      setRuntimeMs(res.runtimeMs);
      setMemoryMb(Math.round((res.memoryKb / 1024) * 10) / 10);
      setErrorMessage(isAc ? undefined : `Submission failed with verdict: ${res.verdict}`);
      setModalStatus(isAc ? 'ACCEPTED' : 'FAILED');
      setIsModalOpen(true);

      if (isAc) {
        onSolveSuccess(); // trigger refetching submissions list to update solvedCount
      }
      if (problem?.id) {
        getSocket().emit('workspace:update', {
          problemId: problem.id,
          sourceCode: currentCode,
          selectedLanguage: workspaceLanguage,
          cursorLine: cursorPosition.line,
          cursorColumn: cursorPosition.column,
          scrollTop,
          latestVerdict: res.verdict,
          latestRuntimeMs: res.runtimeMs,
          latestMemoryKb: res.memoryKb,
        });
      }
    } catch (err) {
      setConsoleLogs(prev => [...prev, `✗ Submission failed: connection timeout.`]);
    }
  };

  const activeChallenge: Challenge = {
    id: problem?.id ?? 'connections',
    title: problem?.title ?? 'Web of Connections',
    description: problem?.title ?? ''
  };

  const submissionResult: SubmissionResult = {
    status: isRunning || isSubmitting ? 'PENDING' : modalStatus,
    passedCount,
    totalCount,
    runtimeMs,
    memoryMb,
    message: errorMessage
  };

  return (
    <div className="flex flex-col gap-4 w-[820px] h-fit">
      {/* Editor Panel Card */}
      <EditorPanel
        activeChallenge={activeChallenge}
        language={mappedLang}
        setLanguage={handleLanguageChange}
        code={currentCode}
        onChangeCode={handleEditorChange}
        onCursorChange={(line, column) => setCursorPosition({ line, column })}
        onScrollChange={(top) => setScrollTop(top)}
        onRunCode={handleRunCode}
        onSubmitCode={handleSubmitCode}
        onUseSpideySense={() => setIsSpideyModalOpen(true)}
        submissionResult={submissionResult}
        consoleLogs={consoleLogs}
        cursorLine={cursorPosition.line}
        cursorColumn={cursorPosition.column}
        scrollTop={scrollTop}
      />

      {/* Team Stats Panel Card */}
      <LeftSidebar 
        onSpiderSenseClick={() => setIsSpideyModalOpen(true)} 
        powerupCounts={powerupCounts}
        onUsePowerup={onUsePowerup}
        questionsSolved={questionsSolved}
        hintProgress={Math.min(Math.floor(questionsSolved / 3), 3) as 0 | 1 | 2 | 3}
        missionCompleted={questionsSolved >= 10}
      />

      {/* Comic Book Alert Modal */}
      <ComicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        status={modalStatus}
        passedCount={submissionResult.passedCount || 0}
        totalCount={submissionResult.totalCount || 0}
        runtimeMs={submissionResult.runtimeMs || 0}
        memoryMb={submissionResult.memoryMb || 0}
        message={submissionResult.message}
        solvedCount={questionsSolved}
      />

      {/* Spidey Sense usage modal */}
      <SpideySenseModal
        isOpen={isSpideyModalOpen}
        onClose={() => setIsSpideyModalOpen(false)}
        onUse={onUseSpideySenseSuccess}
      />
    </div>
  );
}
