import { useState } from 'react';
import LeftSidebar from './LeftSidebar';
import ComicModal from './ComicModal';
import EditorPanel from './EditorPanel';
import { Challenge, SubmissionResult } from '../types';

const CXX_TEMPLATE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    int n, m;
    if (!(cin >> n >> m)) return 0;
    vector<int> parent(n+1), sz(n+1, 1);
    iota(parent.begin(), parent.end(), 0);
    
    function<int(int)> find = [&](int x) {
        if (parent[x] == x) return x;
        return parent[x] = find(parent[x]);
    };
    
    // Write your C++ code here
    
    return 0;
}
`;

const PY_TEMPLATE = `import sys

def main():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    m = int(lines[1])
    
    # Write your Python 3 code here

if __name__ == '__main__':
    main()
`;

const JS_TEMPLATE = `// Write your TypeScript/JavaScript code here
function main() {
    console.log("Spider algorithm ready.");
}
main();
`;

interface RightPanelProps {
  questionNum: number;
  selectedLang: string;
  setSelectedLang: (lang: string) => void;
  isSaved: boolean;
  setIsSaved: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function RightPanel({
  selectedLang,
  setSelectedLang,
  setIsSaved
}: RightPanelProps) {
  const [codes, setCodes] = useState<Record<string, string>>({
    cpp: CXX_TEMPLATE,
    python: PY_TEMPLATE,
    javascript: JS_TEMPLATE,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<'ACCEPTED' | 'FAILED' | 'COMPILE_ERROR' | 'IDLE'>('IDLE');

  const handleEditorChange = (value: string) => {
    const currentLang = selectedLang === 'javascript' ? 'javascript' : selectedLang === 'python' ? 'python' : 'cpp';
    setCodes(prev => ({
      ...prev,
      [currentLang]: value,
    }));
    setIsSaved(false);
    setTimeout(() => setIsSaved(true), 800);
  };

  const handleRunCode = () => {
    setModalStatus('FAILED');
    setIsModalOpen(true);
  };

  const handleSubmitCode = () => {
    setModalStatus('ACCEPTED');
    setIsModalOpen(true);
  };

  const mappedLang = selectedLang === 'javascript' ? 'javascript' : selectedLang === 'python' ? 'python' : 'cpp';
  const currentCode = codes[mappedLang] || '';

  const activeChallenge: Challenge = {
    id: "connections",
    title: "Web of Connections",
    description: "The network of the Spider-Verse is connections."
  };

  const submissionResult: SubmissionResult = {
    status: modalStatus,
    passedCount: modalStatus === 'ACCEPTED' ? 18 : 6,
    totalCount: 18,
    runtimeMs: 37,
    memoryMb: 12.4,
    message: modalStatus === 'FAILED' ? "Compilation Error: index 5 out of bounds for length 5" : undefined
  };

  const consoleLogs = modalStatus === 'ACCEPTED' ? [
    "⚙ Compiling main.cpp...",
    "⚙ Running 18 test cases...",
    "✓ Test Case 1 Passed (2ms)",
    "✓ Test Case 2 Passed (1ms)",
    "✓ Test Case 18 Passed (3ms)",
    "✓ ACCEPTED: Synchronized with Multiverse Anchors!"
  ] : modalStatus === 'FAILED' ? [
    "⚙ Compiling main.cpp...",
    "⚙ Running 18 test cases...",
    "✓ Test Case 1 Passed (2ms)",
    "✗ Test Case 2 FAILED (Runtime Error)",
    "✗ ERROR: index 5 out of bounds for length 5"
  ] : [
    "⚙ Terminal active. Waiting for code compilation..."
  ];

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
        submissionResult={submissionResult}
        consoleLogs={consoleLogs}
      />

      {/* Team Stats Panel Card */}
      <LeftSidebar />

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
    </div>
  );
}
