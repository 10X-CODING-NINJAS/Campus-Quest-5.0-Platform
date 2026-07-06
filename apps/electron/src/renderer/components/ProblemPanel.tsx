import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Send, Image, Maximize2, Settings, AlertTriangle } from 'lucide-react';
import Editor from '@monaco-editor/react';

// Import background assets from Assets/Web folder
import bgBluePink from '../../Assets/Web/Blue Pink web bg.png';
import bgBlue from '../../Assets/Web/Blue web bg.png';
import bgGreen from '../../Assets/Web/Green web bg.png';
import bgOrange from '../../Assets/Web/Orange web bg.png';
import bgRed from '../../Assets/Web/Red web bg.png';

// Import background assets from Assets/Question folder
import qBlack from '../../Assets/Question/Black Question bg.jpg';
import qBlue from '../../Assets/Question/Blue Question bg.jpeg';
import qGreen from '../../Assets/Question/Green Question bg.jpg';
import qRed from '../../Assets/Question/Red Question bg.jpg';
import qWhite from '../../Assets/Question/White Question bg.jpg';

const WEB_BACKGROUNDS = [bgRed, bgBluePink, bgBlue, bgGreen, bgOrange];
const QUESTION_BACKGROUNDS = [qBlack, qBlue, qGreen, qRed, qWhite];

const C_TEMPLATE = `#include <stdio.h>
#include <stdlib.h>

int main() {
    int n, m;
    if (scanf("%d %d", &n, &m) != 2) return 0;
    
    // Write your C code here
    
    return 0;
}
`;

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

const JAVA_TEMPLATE = `import java.io.*;
import java.util.*;

public class Main {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        if (line == null) return;
        StringTokenizer st = new StringTokenizer(line);
        int n = Integer.parseInt(st.nextToken());
        int m = Integer.parseInt(st.nextToken());
        
        // Write your Java code here
    }
}
`;

const LANGUAGES = [
  { id: 'cpp', name: 'C++', ext: 'main.cpp' },
  { id: 'c', name: 'C', ext: 'main.c' },
  { id: 'python', name: 'Python 3', ext: 'main.py' },
  { id: 'java', name: 'Java 17', ext: 'Main.java' },
];

export default function ProblemPanel() {
  const [selectedLang, setSelectedLang] = useState('cpp');
  const [webBgIndex, setWebBgIndex] = useState(0);
  const [questionBgIndex, setQuestionBgIndex] = useState(() => Math.floor(Math.random() * QUESTION_BACKGROUNDS.length));
  
  const [codes, setCodes] = useState<Record<string, string>>({
    c: C_TEMPLATE,
    cpp: CXX_TEMPLATE,
    python: PY_TEMPLATE,
    java: JAVA_TEMPLATE,
  });
  const [isSaved, setIsSaved] = useState(true);

  const activeLangConfig = LANGUAGES.find(l => l.id === selectedLang) || LANGUAGES[0];

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCodes(prev => ({
        ...prev,
        [selectedLang]: value,
      }));
      setIsSaved(false);
      // Auto-save simulation
      setTimeout(() => setIsSaved(true), 800);
    }
  };

  const handleCycleWebBackground = () => {
    setWebBgIndex(prev => (prev + 1) % WEB_BACKGROUNDS.length);
  };

  const handleRandomizeQuestionBackground = () => {
    let nextIndex = Math.floor(Math.random() * QUESTION_BACKGROUNDS.length);
    if (QUESTION_BACKGROUNDS.length > 1) {
      while (nextIndex === questionBgIndex) {
        nextIndex = Math.floor(Math.random() * QUESTION_BACKGROUNDS.length);
      }
    }
    setQuestionBgIndex(nextIndex);
  };

  const handleEditorDidMount = (_editor: any, monaco: any) => {
    monaco.editor.defineTheme('spider-theme-transparent', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '8fa3b8', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff3b30', fontStyle: 'bold' },
        { token: 'number', foreground: '00ff66' },
        { token: 'string', foreground: 'ffdd33' },
        { token: 'type', foreground: '38bdf8', fontStyle: 'bold' },
        { token: 'delimiter', foreground: 'ffffff' },
      ],
      colors: {
        'editor.background': '#00000000',
        'editorGutter.background': '#00000000',
        'editor.foreground': '#ffffff',
        'editorLineNumber.foreground': '#94a3b8',
        'editorLineNumber.activeForeground': '#ff3b30',
        'editor.lineHighlightBackground': '#ffffff14',
        'editor.selectionBackground': '#ff3b3044',
        'editorCursor.foreground': '#ff3b30',
      }
    });
    monaco.editor.setTheme('spider-theme-transparent');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-w-0">
      {/* Question Nav */}
      <div
        className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0"
        style={{ borderColor: '#1e1e3a', background: '#0e0e20' }}
      >
        <button
          onClick={handleRandomizeQuestionBackground}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-spider-bg-hover transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-spider-text-dim" />
        </button>
        <span className="text-spider-text text-sm font-medium">Question 7 of 10</span>
        <button
          onClick={handleRandomizeQuestionBackground}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-spider-bg-hover transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 text-spider-text-dim" />
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Problem Statement (Top) */}
        <div
          className="h-[38%] flex-shrink-0 border-b border-spider-border flex flex-col overflow-hidden relative"
          style={{
            backgroundImage: `url("${QUESTION_BACKGROUNDS[questionBgIndex]}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay to keep the text readable */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(13, 13, 30, 0.86)' }}
          />

          <div className="flex-1 overflow-y-auto p-4 select-text relative z-10">
            {/* Title */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="badge-hard">HARD</span>
              </div>
              <h2 className="text-white text-base font-bold font-display tracking-wide">Web of Connections</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Description & Constraints */}
              <div className="space-y-3">
                <div className="text-spider-text leading-relaxed">
                  <p>The network of the Spider-Verse is made of connections. Given a web of nodes, determine the minimum number of links needed to connect all nodes together.</p>
                </div>
                <div>
                  <h4 className="text-spider-text-dim font-bold uppercase tracking-wider mb-1">Input</h4>
                  <p className="text-spider-text leading-relaxed">
                    The first line contains two integers <code className="text-spider-green bg-spider-bg px-1 rounded font-mono">n</code> and <code className="text-spider-green bg-spider-bg px-1 rounded font-mono">m</code> — number of nodes and number of connections.
                  </p>
                  <p className="text-spider-text leading-relaxed mt-1">
                    Next <code className="text-spider-green bg-spider-bg px-1 rounded font-mono">m</code> lines contain <code className="text-spider-green bg-spider-bg px-1 rounded font-mono">u, v</code> — an undirected connection between node <code className="text-spider-green bg-spider-bg px-1 rounded font-mono">u</code> and node <code className="text-spider-green bg-spider-bg px-1 rounded font-mono">v</code>.
                  </p>
                </div>
                <div>
                  <h4 className="text-spider-text-dim font-bold uppercase tracking-wider mb-1">Output</h4>
                  <p className="text-spider-text leading-relaxed">
                    Print the minimum number of additional connections required to make the network fully connected.
                  </p>
                </div>
              </div>

              {/* Example Card */}
              <div>
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ border: '1px solid #1e1e3a', background: '#080810' }}
                >
                  <div className="px-3 py-1.5 border-b border-spider-border">
                    <span className="text-spider-text-dim font-semibold">Example 1:</span>
                  </div>
                  <div className="p-3">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <div className="text-spider-text-dim font-semibold mb-1">Input</div>
                        <div
                          className="rounded p-2 font-mono text-spider-text leading-5"
                          style={{ background: '#0e0e20', border: '1px solid #1e1e3a' }}
                        >
                          5 3<br />1 2<br />2 3<br />4 5
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-spider-text-dim font-semibold mb-1">Output</div>
                        <div
                          className="rounded p-2 font-mono text-spider-text leading-5"
                          style={{ background: '#0e0e20', border: '1px solid #1e1e3a' }}
                        >
                          1
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-spider-border">
                      <div className="text-spider-text-dim font-semibold mb-0.5">Explanation:</div>
                      <p className="text-spider-text-dim">
                        We need one connection between {'{1,2,3}'} and {'{4,5}'}.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Code Editor (Bottom) */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: '#0a0a18' }}>
          {/* Editor Toolbar */}
          <div
            className="flex items-center gap-2 px-3 py-2 border-b flex-shrink-0"
            style={{ borderColor: '#1e1e3a', background: '#0d0d1e' }}
          >
            {/* Language Selector Dropdown */}
            <div className="relative">
              <select
                value={selectedLang}
                onChange={(e) => setSelectedLang(e.target.value)}
                className="bg-[#111128] text-spider-text text-xs font-semibold font-mono rounded-md px-3 py-1 outline-none cursor-pointer border border-spider-border hover:bg-spider-bg-hover transition-colors appearance-none pr-8 relative"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 8px center',
                  backgroundSize: '12px'
                }}
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-px h-4 bg-spider-border mx-1" />

            {/* File Tab */}
            <div
              className="flex items-center gap-2 px-3 py-1 rounded-md"
              style={{ background: '#111128', border: '1px solid #2a2a50' }}
            >
              <span className="text-white text-xs font-mono">{activeLangConfig.ext}</span>
              {!isSaved && <span className="w-1.5 h-1.5 rounded-full bg-spider-red" title="Unsaved changes" />}
            </div>

            <div className="flex-1" />

            {/* Editor Controls */}
            <button
              onClick={handleCycleWebBackground}
              className="w-7 h-7 flex items-center justify-center rounded hover:bg-spider-bg-hover transition-colors cursor-pointer text-spider-text-dim hover:text-white"
              title="Cycle Background Image"
            >
              <Image className="w-3.5 h-3.5" />
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-spider-bg-hover transition-colors cursor-pointer text-spider-text-dim hover:text-white" title="Fullscreen">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded hover:bg-spider-bg-hover transition-colors cursor-pointer text-spider-text-dim hover:text-white" title="Editor settings">
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Monaco Editor Content with custom background container */}
          <div
            className="flex-1 relative overflow-hidden"
            style={{
              backgroundImage: `url("${WEB_BACKGROUNDS[webBgIndex]}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Translucent overlay for code legibility */}
            <div
              className="absolute inset-0 transition-colors duration-300"
              style={{ background: 'rgba(0, 0, 0, 0.15)' }}
            />
            
            <div className="absolute inset-0 z-10">
              <Editor
                height="100%"
                language={selectedLang === 'cpp' ? 'cpp' : selectedLang === 'c' ? 'c' : selectedLang}
                value={codes[selectedLang]}
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

          {/* Security Warning Monitor */}
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
