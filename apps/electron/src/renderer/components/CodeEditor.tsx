import { useState, useRef, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import {
  useJudge,
  Verdict,
  RunResult,
  SubmitResult,
  VERDICT_LABELS,
  VERDICT_COLORS,
} from '../hooks/useJudge';

type Language = 'c' | 'cpp' | 'python' | 'java';

const MONACO_LANG_MAP: Record<Language, string> = {
  c: 'c',
  cpp: 'cpp',
  python: 'python',
  java: 'java',
};

const BOILERPLATE: Record<Language, string> = {
  c: `#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}\n`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n`,
  python: `import sys\ninput = sys.stdin.readline\n\ndef solve():\n    pass\n\nsolve()\n`,
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        \n    }\n}\n`,
};

interface CodeEditorProps {
  problemId: string;
  starterCode?: Record<string, string>;
}

// ── Verdict badge ─────────────────────────────────────────────────────────────

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span
      style={{
        color: VERDICT_COLORS[verdict],
        fontWeight: 700,
        fontSize: '0.9rem',
        letterSpacing: '0.02em',
      }}
    >
      {VERDICT_LABELS[verdict]}
    </span>
  );
}

// ── Results panel ─────────────────────────────────────────────────────────────

function RunResultPanel({ result }: { result: RunResult }) {
  if (!result.compiled && result.compileError) {
    return (
      <div className="p-3 space-y-2">
        <div style={{ color: VERDICT_COLORS.CE, fontWeight: 700 }}>🔨 Compile Error</div>
        <pre
          style={{
            backgroundColor: '#1a0a2e',
            border: '1px solid #c788ff40',
            color: '#c788ff',
            borderRadius: 6,
            padding: '0.75rem',
            fontSize: '0.78rem',
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {result.compileError}
        </pre>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {result.testcaseResults.map((tc, i) => (
        <div
          key={i}
          style={{
            border: `1px solid ${VERDICT_COLORS[tc.verdict]}40`,
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              backgroundColor: `${VERDICT_COLORS[tc.verdict]}18`,
              padding: '6px 12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.82rem' }}>
              Sample {i + 1}
            </span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <VerdictBadge verdict={tc.verdict} />
              <span style={{ color: '#888', fontSize: '0.75rem' }}>
                {tc.runtimeMs}ms · {(tc.memoryKb / 1024).toFixed(1)}MB
              </span>
            </div>
          </div>

          {tc.stdout && (
            <pre
              style={{
                backgroundColor: '#0d0d1a',
                color: '#e0e0e0',
                margin: 0,
                padding: '8px 12px',
                fontSize: '0.78rem',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                maxHeight: 120,
              }}
            >
              {tc.stdout}
            </pre>
          )}

          {tc.stderr && tc.verdict === 'RE' && (
            <pre
              style={{
                backgroundColor: '#1a0005',
                color: '#ff8080',
                margin: 0,
                padding: '8px 12px',
                fontSize: '0.75rem',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                maxHeight: 80,
              }}
            >
              {tc.stderr}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}

function SubmitResultPanel({ result }: { result: SubmitResult }) {
  const isAC = result.verdict === 'AC';
  return (
    <div className="p-4 space-y-3">
      <div
        style={{
          background: `linear-gradient(135deg, ${VERDICT_COLORS[result.verdict]}20, transparent)`,
          border: `1px solid ${VERDICT_COLORS[result.verdict]}50`,
          borderRadius: 12,
          padding: '1rem 1.25rem',
        }}
      >
        <div style={{ marginBottom: 8 }}>
          <VerdictBadge verdict={result.verdict} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 8 }}>
          {[
            { label: 'Tests Passed', value: `${result.passedTests} / ${result.totalTests}` },
            { label: 'Runtime', value: `${result.runtimeMs}ms` },
            { label: 'Memory', value: `${(result.memoryKb / 1024).toFixed(1)}MB` },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{ color: '#888', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {stat.label}
              </div>
              <div style={{ color: isAC ? VERDICT_COLORS.AC : '#fff', fontWeight: 700, fontSize: '1rem', marginTop: 2 }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {result.error && (
        <div style={{ color: '#888', fontSize: '0.8rem', textAlign: 'center' }}>
          {result.error}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type ActiveTab = 'run' | 'submit';

export function CodeEditor({ problemId, starterCode }: CodeEditorProps) {
  const [language, setLanguage] = useState<Language>('cpp');
  const [code, setCode] = useState(starterCode?.cpp ?? BOILERPLATE['cpp']);
  const [stdin, setStdin] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('run');
  const editorRef = useRef<any>(null);

  const {
    runCode,
    submitCode,
    isRunning,
    isSubmitting,
    runResult,
    submitResult,
    pendingSubmissionId,
  } = useJudge({ problemId });

  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
    if (!code.trim() || code === BOILERPLATE[language]) {
      setCode(starterCode?.[lang] ?? BOILERPLATE[lang]);
    }
  }, [code, language, starterCode]);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    // Anti-cheat: disable copy/paste at Monaco level
    editor.onKeyDown((e: any) => {
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyV' || e.code === 'KeyC')) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  };

  const handleRun = async () => {
    setActiveTab('run');
    await runCode(code, language, stdin || undefined);
  };

  const handleSubmit = async () => {
    setActiveTab('submit');
    await submitCode(code, language);
  };

  const isBusy = isRunning || isSubmitting;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#0a0a14' }}>
      {/* ── Toolbar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          borderBottom: '1px solid #1e1e3a',
          background: 'rgba(10,10,30,0.8)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value as Language)}
          disabled={isBusy}
          style={{
            background: '#12122a',
            border: '1px solid #2a2a5a',
            borderRadius: 6,
            padding: '4px 10px',
            color: '#a0a0e0',
            fontSize: '0.82rem',
            cursor: 'pointer',
          }}
        >
          <option value="cpp">C++17</option>
          <option value="c">C17</option>
          <option value="python">Python 3.12</option>
          <option value="java">Java 21</option>
        </select>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            id="run-code-btn"
            onClick={handleRun}
            disabled={isBusy}
            style={{
              padding: '5px 16px',
              fontSize: '0.82rem',
              borderRadius: 6,
              border: '1px solid #2a5a2a',
              background: isRunning ? '#1a3a1a' : '#12321a',
              color: isRunning ? '#558855' : '#55aa55',
              cursor: isBusy ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s',
            }}
          >
            {isRunning ? '⏳ Running…' : '▶ Run'}
          </button>

          <button
            id="submit-code-btn"
            onClick={handleSubmit}
            disabled={isBusy}
            style={{
              padding: '5px 16px',
              fontSize: '0.82rem',
              borderRadius: 6,
              border: '1px solid #5a1a2a',
              background: isSubmitting ? '#3a0a1a' : '#2a0a14',
              color: isSubmitting ? '#cc5566' : '#ff3d71',
              cursor: isBusy ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              transition: 'all 0.2s',
              letterSpacing: '0.03em',
            }}
          >
            {isSubmitting ? '⚖️ Judging…' : '🚀 Submit'}
          </button>
        </div>
      </div>

      {/* ── Monaco Editor ── */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <Editor
          height="100%"
          language={MONACO_LANG_MAP[language]}
          value={code}
          onChange={(v) => setCode(v ?? '')}
          onMount={handleMount}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            contextmenu: false,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontLigatures: true,
            lineNumbersMinChars: 3,
            folding: true,
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>

      {/* ── Custom stdin ── */}
      <div
        style={{
          height: 70,
          borderTop: '1px solid #1e1e3a',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '2px 12px', fontSize: '0.7rem', color: '#444', letterSpacing: '0.05em' }}>
          CUSTOM INPUT (Run only)
        </div>
        <textarea
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          placeholder="Paste custom input here for the Run button…"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#a0a0e0',
            fontSize: '0.8rem',
            fontFamily: 'monospace',
            resize: 'none',
            padding: '0 12px 6px',
          }}
        />
      </div>

      {/* ── Results panel ── */}
      <div
        style={{
          borderTop: '1px solid #1e1e3a',
          background: '#070714',
          maxHeight: 280,
          overflowY: 'auto',
        }}
      >
        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e1e3a' }}>
          {(['run', 'submit'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '6px 20px',
                fontSize: '0.78rem',
                fontWeight: tab === activeTab ? 700 : 400,
                color: tab === activeTab ? '#a0a0ff' : '#555',
                background: 'transparent',
                border: 'none',
                borderBottom: tab === activeTab ? '2px solid #6666cc' : '2px solid transparent',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                transition: 'all 0.2s',
              }}
            >
              {tab === 'run' ? 'Run Output' : 'Submission'}
            </button>
          ))}

          {pendingSubmissionId && (
            <div
              style={{
                marginLeft: 'auto',
                padding: '6px 16px',
                fontSize: '0.72rem',
                color: '#ffaa00',
                animation: 'pulse 1.5s infinite',
              }}
            >
              ⚖️ Judging submission…
            </div>
          )}
        </div>

        {/* Tab content */}
        {activeTab === 'run' && (
          <>
            {!runResult && !isRunning && (
              <div style={{ padding: '1.5rem', color: '#444', textAlign: 'center', fontSize: '0.82rem' }}>
                Click <strong style={{ color: '#55aa55' }}>Run</strong> to test against sample cases
              </div>
            )}
            {isRunning && (
              <div style={{ padding: '1.5rem', color: '#55aa55', textAlign: 'center', fontSize: '0.85rem' }}>
                ⏳ Compiling and running…
              </div>
            )}
            {runResult && !isRunning && <RunResultPanel result={runResult} />}
          </>
        )}

        {activeTab === 'submit' && (
          <>
            {!submitResult && !isSubmitting && (
              <div style={{ padding: '1.5rem', color: '#444', textAlign: 'center', fontSize: '0.82rem' }}>
                Click <strong style={{ color: '#ff3d71' }}>Submit</strong> to judge against all test cases
              </div>
            )}
            {isSubmitting && (
              <div style={{ padding: '1.5rem', color: '#ffaa00', textAlign: 'center', fontSize: '0.85rem' }}>
                ⚖️ Judging all test cases… (this may take up to 30s)
              </div>
            )}
            {submitResult && !isSubmitting && <SubmitResultPanel result={submitResult} />}
          </>
        )}
      </div>
    </div>
  );
}
