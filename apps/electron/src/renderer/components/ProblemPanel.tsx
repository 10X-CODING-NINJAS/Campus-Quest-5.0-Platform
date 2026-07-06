import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Send, Sun, Maximize2, Settings, AlertTriangle } from 'lucide-react';
import Editor from '@monaco-editor/react';

const INITIAL_CODE = `#include <bits/stdc++.h>
using namespace std;

int main(){
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    
    int n, m;
    if (!(cin >> n >> m)) return 0;
    vector<int> parent(n+1), sz(n+1, 1);
    iota(parent.begin(), parent.end(), 0);
    
    function<int(int)> find = [&](int x){
        if (parent[x] == x) return x;
        return parent[x] = find(parent[x]);
    };
    
    return 0;
}
`;

export default function ProblemPanel() {
  const [code, setCode] = useState(INITIAL_CODE);
  const [isSaved, setIsSaved] = useState(true);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      setIsSaved(false);
      // Auto-save simulation
      setTimeout(() => setIsSaved(true), 1000);
    }
  };

  const handleEditorDidMount = (_editor: any, monaco: any) => {
    monaco.editor.defineTheme('spider-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'cc1a1a', fontStyle: 'bold' },
        { token: 'number', foreground: '1adb6e' },
        { token: 'string', foreground: 'a78bfa' },
        { token: 'type', foreground: '60a5fa' },
        { token: 'delimiter', foreground: '94a3b8' },
      ],
      colors: {
        'editor.background': '#0a0a18',
        'editor.foreground': '#e2e8f0',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#cc1a1a',
        'editor.lineHighlightBackground': '#111128',
        'editor.selectionBackground': '#cc1a1a33',
        'editorCursor.foreground': '#cc1a1a',
      }
    });
    monaco.editor.setTheme('spider-theme');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Question Nav */}
      <div
        className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0"
        style={{ borderColor: '#1e1e3a', background: '#0e0e20' }}
      >
        <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-spider-bg-hover transition-colors cursor-pointer">
          <ChevronLeft className="w-4 h-4 text-spider-text-dim" />
        </button>
        <span className="text-spider-text text-sm font-medium">Question 7 of 10</span>
        <button className="w-6 h-6 flex items-center justify-center rounded hover:bg-spider-bg-hover transition-colors cursor-pointer">
          <ChevronRight className="w-4 h-4 text-spider-text-dim" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Problem Statement */}
        <div className="w-80 flex-shrink-0 border-r border-spider-border flex flex-col overflow-hidden" style={{ background: '#0d0d1e' }}>
          <div className="flex-1 overflow-y-auto p-4 select-text">
            {/* Title */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="badge-hard">HARD</span>
              </div>
              <h2 className="text-white text-lg font-bold font-display tracking-wide">Web of Connections</h2>
            </div>

            {/* Description */}
            <div className="text-spider-text text-xs leading-relaxed mb-4 space-y-2">
              <p>The network of the Spider-Verse is made of connections. Given a web of nodes, determine the minimum number of links needed to connect all nodes together.</p>
            </div>

            {/* Input */}
            <div className="mb-3">
              <h4 className="text-spider-text-dim text-xs font-bold uppercase tracking-wider mb-2">Input</h4>
              <p className="text-spider-text text-xs leading-relaxed">
                The first line contains two integers <code className="text-spider-green bg-spider-bg px-1 rounded font-mono">n</code> and <code className="text-spider-green bg-spider-bg px-1 rounded font-mono">m</code> — number of nodes and number of connections.
              </p>
              <p className="text-spider-text text-xs leading-relaxed mt-1">
                Next <code className="text-spider-green bg-spider-bg px-1 rounded font-mono">m</code> lines contain <code className="text-spider-green bg-spider-bg px-1 rounded font-mono">u, v</code> — an undirected connection between node <code className="text-spider-green bg-spider-bg px-1 rounded font-mono">u</code> and node <code className="text-spider-green bg-spider-bg px-1 rounded font-mono">v</code>.
              </p>
            </div>

            {/* Output */}
            <div className="mb-4">
              <h4 className="text-spider-text-dim text-xs font-bold uppercase tracking-wider mb-2">Output</h4>
              <p className="text-spider-text text-xs leading-relaxed">
                Print the minimum number of additional connections required to make the network fully connected.
              </p>
            </div>

            {/* Example */}
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: '1px solid #1e1e3a', background: '#080810' }}
            >
              <div className="px-3 py-2 border-b border-spider-border">
                <span className="text-spider-text-dim text-xs font-semibold">Example 1:</span>
              </div>
              <div className="p-3">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="text-spider-text-dim text-xs font-semibold mb-1.5">Input</div>
                    <div
                      className="rounded p-2 font-mono text-xs text-spider-text leading-5"
                      style={{ background: '#0e0e20', border: '1px solid #1e1e3a' }}
                    >
                      5 3<br />1 2<br />2 3<br />4 5
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="text-spider-text-dim text-xs font-semibold mb-1.5">Output</div>
                    <div
                      className="rounded p-2 font-mono text-xs text-spider-text leading-5"
                      style={{ background: '#0e0e20', border: '1px solid #1e1e3a' }}
                    >
                      1
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-spider-border">
                  <div className="text-spider-text-dim text-xs font-semibold mb-1">Explanation:</div>
                  <p className="text-spider-text-dim text-xs">
                    We need one connection between {'{1,2,3}'} and {'{4,5}'}.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Code Editor */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0a0a18' }}>
          {/* Editor Toolbar */}
          <div
            className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0"
            style={{ borderColor: '#1e1e3a', background: '#0d0d1e' }}
          >
            {/* Language Selector */}
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-md cursor-pointer hover:bg-spider-bg-hover transition-colors"
              style={{ background: '#111128', border: '1px solid #1e1e3a' }}
            >
              <span className="text-spider-text text-xs font-semibold font-mono">C++17</span>
              <svg className="w-3 h-3 text-spider-text-dim" fill="none" viewBox="0 0 16 16"><path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </div>

            <div className="w-px h-4 bg-spider-border mx-1" />

            {/* File Tab */}
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-md"
              style={{ background: '#111128', border: '1px solid #2a2a50' }}
            >
              <span className="text-white text-xs font-mono">main.cpp</span>
              {!isSaved && <span className="w-1.5 h-1.5 rounded-full bg-spider-red" title="Unsaved changes" />}
            </div>

            <div className="flex-1" />

            {/* Editor Controls */}
            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-spider-bg-hover transition-colors cursor-pointer" title="Toggle theme">
              <Sun className="w-3.5 h-3.5 text-spider-text-dim" />
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-spider-bg-hover transition-colors cursor-pointer" title="Fullscreen">
              <Maximize2 className="w-3.5 h-3.5 text-spider-text-dim" />
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-spider-bg-hover transition-colors cursor-pointer" title="Editor settings">
              <Settings className="w-3.5 h-3.5 text-spider-text-dim" />
            </button>
          </div>

          {/* Monaco Editor Content */}
          <div className="flex-1 relative" style={{ background: '#0a0a18' }}>
            <Editor
              height="100%"
              defaultLanguage="cpp"
              value={code}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              options={{
                fontSize: 13,
                fontFamily: "'Fira Code', 'Courier New', monospace",
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                readOnly: false,
                automaticLayout: true,
                minimap: { enabled: false },
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          {/* Action Bar */}
          <div
            className="flex items-center justify-between px-4 py-3 border-t flex-shrink-0"
            style={{ borderColor: '#1e1e3a', background: '#0d0d1e' }}
          >
            <div className="flex items-center gap-2">
              <button className="btn-run">
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Code
              </button>
              <button className="btn-primary">
                <Send className="w-3.5 h-3.5" />
                Submit Code
              </button>
            </div>
            <div className="flex items-center gap-2 text-spider-text-muted text-xs">
              <div className="live-dot" />
              {isSaved ? 'Auto-saved' : 'Saving...'}
            </div>
          </div>

          {/* Security Monitor */}
          <div className="security-warning flex items-center justify-between px-4 py-2 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-2 px-2 py-1 rounded text-xs font-bold tracking-widest uppercase"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
              >
                <AlertTriangle className="w-3 h-3" />
                Security Monitor
              </div>
              <span className="text-spider-text-dim text-xs">Warning: Unusual activity detected.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400/70 text-xs font-medium">Warning 1 of 3</span>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="w-4 h-1.5 rounded-sm"
                    style={{ background: i === 1 ? '#f59e0b' : '#1e1e3a' }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
