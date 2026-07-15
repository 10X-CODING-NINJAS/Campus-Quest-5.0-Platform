import { useState, useEffect, useRef } from 'react';
import { socket } from '../lib/socket';
import LeftSidebar from './LeftSidebar';
import ComicModal from './ComicModal';
import EditorPanel from './EditorPanel';
import SpideySenseModal from './SpideySenseModal';
import { Challenge, SubmissionResult } from '../types';

const CXX_TEMPLATE = `#include <iostream>
using namespace std;

int main() {
    // Write your C++ code here
    return 0;
}
`;

const PY_TEMPLATE = `def main():
    # Write your Python 3 code here
    pass

if __name__ == '__main__':
    main()
`;

const JS_TEMPLATE = `// Write your TypeScript/JavaScript code here
function main() {
    console.log("Spider algorithm ready.");
}
main();
`;

const JAVA_TEMPLATE = `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Write your Java 21 code here
        scanner.close();
    }
}
`;

interface RightPanelProps {
  questionNum: number;
  selectedLang: string;
  setSelectedLang: (lang: string) => void;
  isSaved: boolean;
  setIsSaved: React.Dispatch<React.SetStateAction<boolean>>;
  powerupCounts: { SPIDER_SENSE: number; WEB_FLUID: number; SUIT_TECH: number };
  onUsePowerup: (type: 'SPIDER_SENSE' | 'WEB_FLUID' | 'SUIT_TECH') => void;
  onUseSpideySenseSuccess?: () => void;
  currentProblem: any;
  teamName: string;
}

export default function RightPanel({
  selectedLang,
  setSelectedLang,
  setIsSaved,
  powerupCounts,
  onUsePowerup,
  onUseSpideySenseSuccess,
  currentProblem,
  teamName
}: RightPanelProps) {
  const [codes, setCodes] = useState<Record<string, string>>({
    cpp: CXX_TEMPLATE,
    python: PY_TEMPLATE,
    javascript: JS_TEMPLATE,
    java: JAVA_TEMPLATE,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSpideyModalOpen, setIsSpideyModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<'ACCEPTED' | 'FAILED' | 'COMPILE_ERROR' | 'IDLE'>('IDLE');
  
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    "⚙ Terminal active. Waiting for code compilation..."
  ]);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult>({
    status: 'IDLE',
    passedCount: 0,
    totalCount: 0,
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Load workspace state from backend on problem switch
  useEffect(() => {
    if (!currentProblem) return;

    const loadWorkspace = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/workspace/${currentProblem.id}`, {
          headers: {
            'x-team-id': teamName,
          },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.found && data.workspace) {
            const savedLang = data.workspace.language.toLowerCase();
            setSelectedLang(savedLang);
            setCodes(prev => ({
              ...prev,
              [savedLang]: data.workspace.sourceCode,
            }));
            setIsSaved(true);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to fetch workspace from backend:', err);
      }

      // Fallback to default starters if no workspace was found
      if (currentProblem.starters) {
        setCodes({
          cpp: currentProblem.starters.cpp || CXX_TEMPLATE,
          python: currentProblem.starters.python || PY_TEMPLATE,
          javascript: currentProblem.starters.javascript || JS_TEMPLATE,
          java: currentProblem.starters.java || JAVA_TEMPLATE,
        });
        setIsSaved(true);
      }
    };

    loadWorkspace();
  }, [currentProblem, teamName]);

  // 2. Handle editor changes and trigger autosave
  const handleEditorChange = (value: string) => {
    const mappedLang = selectedLang === 'javascript' ? 'javascript' : selectedLang === 'python' ? 'python' : selectedLang === 'java' ? 'java' : 'cpp';
    setCodes(prev => ({
      ...prev,
      [mappedLang]: value,
    }));
    
    setIsSaved(false);

    // Debounce save request
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      triggerAutosave(value, selectedLang);
    }, 1000);
  };

  const triggerAutosave = async (codeToSave: string, langToSave: string) => {
    if (!currentProblem) return;
    try {
      const res = await fetch('http://localhost:3001/api/workspace/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-team-id': teamName,
        },
        body: JSON.stringify({
          problemId: currentProblem.id,
          language: langToSave.toUpperCase(),
          sourceCode: codeToSave,
          cursorLine: 1,
          cursorColumn: 1,
          scrollPosition: 0,
        }),
      });
      if (res.ok) {
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Autosave failed:', err);
    }
  };

  useEffect(() => {
    const onRunResult = (result: any) => {
      if (result.verdict === 'CE') {
        setConsoleLogs([
          "⚙ Compiling code...",
          "✗ Compilation Error:",
          result.stderr,
        ]);
        setSubmissionResult({
          status: 'COMPILE_ERROR',
          message: result.stderr,
          passedCount: 0,
          totalCount: 1,
        });
        setModalStatus('COMPILE_ERROR');
      } else {
        setConsoleLogs([
          "⚙ Compiling code...",
          "⚙ Running test case...",
          result.verdict === 'AC' ? "✓ Test Case Passed!" : `✗ Test Case FAILED (${result.verdict})`,
          result.stdout ? `Stdout:\n${result.stdout}` : '',
          result.stderr ? `Stderr:\n${result.stderr}` : '',
        ].filter(Boolean));
        setSubmissionResult({
          status: result.verdict === 'AC' ? 'ACCEPTED' : 'FAILED',
          runtimeMs: result.runtimeMs,
          message: result.verdict === 'AC' ? undefined : `Verdict: ${result.verdict}`,
          passedCount: result.verdict === 'AC' ? 1 : 0,
          totalCount: 1,
        });
        setModalStatus(result.verdict === 'AC' ? 'ACCEPTED' : 'FAILED');
      }
      setIsModalOpen(true);
    };

    const onSubmitResult = (result: any) => {
      const verdict = result.verdict;
      const results = result.testCaseResults || [];
      const passed = results.filter((r: any) => r.verdict === 'AC').length;
      
      setConsoleLogs([
        "⚙ Compiling code...",
        `⚙ Running ${results.length} test cases...`,
        ...results.map((r: any, idx: number) => 
          r.verdict === 'AC' 
            ? `✓ Test Case ${idx + 1} Passed (${r.runtimeMs}ms)` 
            : `✗ Test Case ${idx + 1} FAILED (${r.verdict})`
        ),
        verdict === 'AC' ? "✓ ACCEPTED: Synchronized successfully!" : `✗ FAILED: ${verdict}`,
      ]);

      setSubmissionResult({
        status: verdict === 'AC' ? 'ACCEPTED' : 'FAILED',
        passedCount: passed,
        totalCount: results.length,
        runtimeMs: result.runtimeMs,
      });
      setModalStatus(verdict === 'AC' ? 'ACCEPTED' : 'FAILED');
      setIsModalOpen(true);
    };

    socket.on('run:result', onRunResult);
    socket.on('submit:result', onSubmitResult);

    return () => {
      socket.off('run:result', onRunResult);
      socket.off('submit:result', onSubmitResult);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const mappedLang = selectedLang === 'javascript' ? 'javascript' : selectedLang === 'python' ? 'python' : selectedLang === 'java' ? 'java' : 'cpp';
  const currentCode = codes[mappedLang] || '';

  // 3. Save workspace immediately on language change
  const handleLanguageChange = (lang: string) => {
    setSelectedLang(lang);
    const targetLang = lang === 'javascript' ? 'javascript' : lang === 'python' ? 'python' : lang === 'java' ? 'java' : 'cpp';
    triggerAutosave(codes[targetLang] || '', lang);
  };

  const handleRunCode = () => {
    if (!currentProblem) return;
    setConsoleLogs(["⚙ Dispatching code run request...", "⚙ Terminal active. Waiting for code compilation..."]);
    const sampleInput = currentProblem.testCases?.find((tc: any) => !tc.hidden)?.input || '';
    socket.emit('run:code', {
      problemId: currentProblem.id,
      code: currentCode,
      language: selectedLang,
      stdin: sampleInput,
    });
  };

  const handleSubmitCode = () => {
    if (!currentProblem) return;
    setConsoleLogs(["⚙ Dispatching submission request...", "⚙ Terminal active. Waiting for code compilation..."]);
    socket.emit('submit:code', {
      problemId: currentProblem.id,
      code: currentCode,
      language: selectedLang,
    });
  };

  const activeChallenge: Challenge = {
    id: currentProblem?.id || "connections",
    title: currentProblem?.title || "Web of Connections",
    description: currentProblem?.statement || "The network of the Spider-Verse is connections."
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
