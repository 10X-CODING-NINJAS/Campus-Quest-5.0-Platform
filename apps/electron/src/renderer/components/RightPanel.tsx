import { useState } from 'react';
import { Play, Send, Maximize2, Settings } from 'lucide-react';
import Editor from '@monaco-editor/react';
import LeftSidebar from './LeftSidebar';
import ComicModal from './ComicModal';

// Import background assets from Assets/Web folder
import bgBluePink from '../../Assets/Web/Blue Pink web bg.png';
import bgBlue from '../../Assets/Web/Blue web bg.png';
import bgGreen from '../../Assets/Web/Green web bg.png';
import bgOrange from '../../Assets/Web/Orange web bg.png';
import bgRed from '../../Assets/Web/Red web bg.png';

const WEB_BACKGROUNDS = [bgRed, bgBluePink, bgBlue, bgGreen, bgOrange];

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

interface RightPanelProps {
  questionNum: number;
  selectedLang: string;
  setSelectedLang: (lang: string) => void;
  isSaved: boolean;
  setIsSaved: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function RightPanel({
  questionNum,
  selectedLang,
  setSelectedLang,
  isSaved,
  setIsSaved
}: RightPanelProps) {
  const [codes, setCodes] = useState<Record<string, string>>({
    c: C_TEMPLATE,
    cpp: CXX_TEMPLATE,
    python: PY_TEMPLATE,
    java: JAVA_TEMPLATE,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStatus, setModalStatus] = useState<'ACCEPTED' | 'FAILED' | 'COMPILE_ERROR' | 'IDLE'>('IDLE');

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
        'editor.background': '#0b0b14f0',
        'editorGutter.background': '#0b0b14f0',
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

  const webBgIndex = (questionNum - 1) % WEB_BACKGROUNDS.length;

  return (
    <div className="flex flex-col gap-4 w-[640px] h-fit">
      {/* Editor Window */}
      <div className="w-full h-[380px] flex flex-col overflow-hidden bg-[#0d0d1e] select-none relative comic-panel">
        {/* Editor Header / Tab bar */}
        <div className="flex items-center gap-3 px-4 py-2 bg-[#05050a] border-b-4 border-black flex-shrink-0">
          <div className="relative">
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
              className="bg-[#111128] text-white text-xs font-semibold font-mono rounded-none border-2 border-black px-3 py-1 outline-none cursor-pointer hover:bg-black/30 transition-colors appearance-none pr-8 relative"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                backgroundSize: '12px'
              }}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id}>
                  {lang.id === 'cpp' ? 'C++17' : lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-px h-4 bg-black/50" />

          <div className="bg-stone-800 border-2 border-black text-white text-xs font-mono px-3 py-1 rounded-none shadow-[1px_1px_0px_#000]">
            <span>{activeLangConfig.ext}</span>
          </div>

          <div className="flex-1" />

          <button className="w-7 h-7 flex items-center justify-center rounded-none border border-transparent hover:border-black hover:bg-black/30 text-gray-400 hover:text-white transition-all cursor-pointer">
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button className="w-7 h-7 flex items-center justify-center rounded-none border border-transparent hover:border-black hover:bg-black/30 text-gray-400 hover:text-white transition-all cursor-pointer">
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Editor container */}
        <div
          className="flex-1 relative overflow-hidden"
          style={{
            backgroundImage: `url("${WEB_BACKGROUNDS[webBgIndex]}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-black/30 z-0" />
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
      </div>

      {/* Control Actions & Comic Explosion Status Card */}
      <div className="w-full bg-[#fcf8f0] p-4 flex flex-col md:flex-row md:items-center justify-between flex-shrink-0 relative overflow-hidden select-none min-h-[140px] comic-panel comic-halftone">
        {/* Buttons on the Left */}
        <div className="flex flex-col gap-2 z-10">
          <button 
            onClick={() => { setModalStatus('FAILED'); setIsModalOpen(true); }}
            className="comic-btn-red flex items-center justify-center gap-2 px-6 py-2 rounded-none cursor-pointer text-base uppercase"
          >
            <Play className="w-4 h-4 fill-current" />
            Run Code
          </button>
          <button 
            onClick={() => { setModalStatus('ACCEPTED'); setIsModalOpen(true); }}
            className="comic-btn-blue flex items-center justify-center gap-2 px-6 py-2 rounded-none cursor-pointer text-base uppercase"
          >
            <Send className="w-4 h-4" />
            Submit Code
          </button>
          <div className="flex items-center gap-2 text-gray-500 font-mono text-[10px] mt-0.5 ml-1">
            <div className={`w-1.5 h-1.5 rounded-full ${isSaved ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
            {isSaved ? 'Auto-saved' : 'Saving...'}
          </div>
        </div>

        {/* Pow / Accepted Graphic */}
        <div className="relative flex items-center justify-center h-28 w-64 md:absolute md:right-4 md:bottom-10 z-10 select-none pointer-events-none">
          {/* Pow explosion */}
          <div className="absolute transform -rotate-[6deg] -translate-x-6 scale-90">
            <div className="bg-red-600 border-4 border-black px-4 py-2 font-display text-2xl font-bold tracking-widest text-yellow-300 shadow-[3px_3px_0px_#000] rounded-none">
              POW
            </div>
          </div>
          {/* Accepted Speech Bubble */}
          <div className="absolute transform rotate-[4deg] translate-x-12 translate-y-2 scale-110 flex items-center">
            <div className="bg-yellow-100 border-4 border-black px-6 py-3 font-display text-3xl font-bold tracking-wider text-green-600 shadow-[4px_4px_0px_#000] rounded-none flex items-center gap-2">
              ACCEPTED
              <span className="text-2xl">✔️</span>
            </div>
            {/* Specks and spiders around */}
            <span className="absolute -top-4 right-1 text-xs">🕷️</span>
            <span className="absolute -bottom-4 left-3 text-xs">🕷️</span>
          </div>
        </div>

        {/* Yellow test result status banner at bottom-right */}
        <div className="absolute bottom-0 right-0 bg-[#fde047] border-t-3 border-l-3 border-black px-4 py-1 text-black font-mono text-[10px] font-bold shadow-[-2px_-2px_0px_rgba(0,0,0,0.15)] z-20">
          18/18 Test Cases - 37ms Runtime - 12.4MB Memory
        </div>
      </div>
      <LeftSidebar />

      {/* Comic Book Alert Modal */}
      <ComicModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        status={modalStatus}
        passedCount={modalStatus === 'ACCEPTED' ? 18 : 6}
        totalCount={18}
        runtimeMs={37}
        memoryMb={12.4}
        message="Compilation Error: index 5 out of bounds for length 5"
      />
    </div>
  );
}
