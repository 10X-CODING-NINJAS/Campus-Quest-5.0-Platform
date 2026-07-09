import { useState, useEffect } from 'react';
import LeftSidebar from './LeftSidebar';
import ComicModal from './ComicModal';
import EditorPanel from './EditorPanel';
import SpideySenseModal from './SpideySenseModal';
import { Challenge, SubmissionResult } from '../types';
import { useJudge } from '../hooks/useJudge';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

const C_TEMPLATE = `#include <stdio.h>\n\nint main() {\n    // Write your C17 code here\n    return 0;\n}\n`;

const CXX_TEMPLATE = `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n    \n    // Write your C++17 code here\n    \n    return 0;\n}\n`;

const PY_TEMPLATE = `import sys\n\ndef main():\n    # Write your Python 3 code here\n    pass\n\nif __name__ == '__main__':\n    main()\n`;

const JAVA_TEMPLATE = `import java.util.Scanner;\n\nclass Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        \n        // Write your Java 21 code here\n        \n    }\n}\n`;

interface RightPanelProps {
  questionNum: number;
  selectedLang: string;
  setSelectedLang: (lang: string) => void;
  isSaved: boolean;
  setIsSaved: React.Dispatch<React.SetStateAction<boolean>>;
  powerupCounts: { SPIDER_SENSE: number; WEB_FLUID: number; SUIT_TECH: number };
  onUsePowerup: (type: 'SPIDER_SENSE' | 'WEB_FLUID' | 'SUIT_TECH') => void;
  onUseSpideySenseSuccess?: () => void;
  problem: any;
  loading: boolean;
  solvedCount: number;
  onSolveSuccess: () => void;
}

export default function RightPanel({
  selectedLang,
  setSelectedLang,
  setIsSaved,
  powerupCounts,
  onUsePowerup,
  onUseSpideySenseSuccess,
  problem,
  loading: _loading,
  solvedCount,
  onSolveSuccess
}: RightPanelProps) {
  // Monaco language code buffer state
  const [codes, setCodes] = useState<Record<string, string>>({});

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

  const mappedLang = selectedLang === 'c' ? 'c' : selectedLang === 'python' ? 'python' : selectedLang === 'java' ? 'java' : 'cpp';

  // Instantiate the judge integration hook
  const { runCode, submitCode, isRunning, isSubmitting } = useJudge({
    problemId: problem?.id ?? '',
  });

  // Load code from LocalStorage or starterCode when problem or language switches
  useEffect(() => {
    if (!problem) return;

    const storedCode = localStorage.getItem(`code:${problem.id}:${mappedLang}`);
    if (storedCode) {
      setCodes(prev => ({ ...prev, [mappedLang]: storedCode }));
    } else {
      // Fallback to dynamic problem starter codes, then default static templates
      const backendLangKey = mappedLang === 'cpp' ? 'cpp' : mappedLang === 'python' ? 'python' : mappedLang === 'java' ? 'java' : 'c';
      const starter = problem.starterCode?.[backendLangKey];
      if (starter) {
        setCodes(prev => ({ ...prev, [mappedLang]: starter }));
      } else {
        const defaultTemplate = 
          mappedLang === 'c' ? C_TEMPLATE :
          mappedLang === 'cpp' ? CXX_TEMPLATE :
          mappedLang === 'python' ? PY_TEMPLATE :
          JAVA_TEMPLATE;
        setCodes(prev => ({ ...prev, [mappedLang]: defaultTemplate }));
      }
    }
    
    setConsoleLogs([`⚙ Terminal ready. Waiting for code compilation...`]);
    setModalStatus('IDLE');
  }, [problem, mappedLang]);

  // Handle Monaco changes with immediate state saving (Autosave!)
  const handleEditorChange = (value: string) => {
    setCodes(prev => ({
      ...prev,
      [mappedLang]: value,
    }));
    setIsSaved(false);

    if (problem) {
      localStorage.setItem(`code:${problem.id}:${mappedLang}`, value);
    }
    setTimeout(() => setIsSaved(true), 400);
  };

  const currentCode = codes[mappedLang] || '';

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
        setLanguage={(lang) => setSelectedLang(lang)}
        code={currentCode}
        onChangeCode={handleEditorChange}
        onRunCode={handleRunCode}
        onSubmitCode={handleSubmitCode}
        onUseSpideySense={() => setIsSpideyModalOpen(true)}
        submissionResult={submissionResult}
        consoleLogs={consoleLogs}
      />

      {/* Team Stats Panel Card */}
      <LeftSidebar 
        onSpiderSenseClick={() => setIsSpideyModalOpen(true)} 
        powerupCounts={powerupCounts}
        onUsePowerup={onUsePowerup}
        solvedCount={solvedCount}
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
        solvedCount={solvedCount}
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
