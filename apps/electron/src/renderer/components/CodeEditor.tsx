import { useState, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';

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
  python: `def main():\n    pass\n\nif __name__ == "__main__":\n    main()\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n`,
};

interface CodeEditorProps {
  problemId: string;
  onRun: (code: string, language: Language, stdin: string) => void;
  onSubmit: (code: string, language: Language) => void;
  isRunning: boolean;
}

export function CodeEditor({ problemId, onRun, onSubmit, isRunning }: CodeEditorProps) {
  const [language, setLanguage] = useState<Language>('cpp');
  const [code, setCode] = useState(BOILERPLATE['cpp']);
  const [stdin, setStdin] = useState('');
  const editorRef = useRef<any>(null);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    // Only reset to boilerplate if editor is empty or unedited — don't nuke their work
    if (!code.trim() || code === BOILERPLATE[language]) {
      setCode(BOILERPLATE[lang]);
    }
  };

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    // Disable copy/paste at the Monaco level as part of anti-cheat
    editor.onKeyDown((e: any) => {
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyV' || e.code === 'KeyC')) {
        e.preventDefault();
        e.stopPropagation();
        // report to violation service
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b border-gray-700 bg-gray-900/50">
        <select
          value={language}
          onChange={(e) => handleLanguageChange(e.target.value as Language)}
          className="bg-black border border-gray-700 rounded px-2 py-1 text-sm text-white"
          disabled={isRunning}
        >
          <option value="c">C</option>
          <option value="cpp">C++</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => onRun(code, language, stdin)}
            disabled={isRunning}
            className="px-3 py-1 text-sm rounded bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50"
          >
            {isRunning ? 'Running…' : 'Run'}
          </button>
          <button
            onClick={() => onSubmit(code, language)}
            disabled={isRunning}
            className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-500 disabled:opacity-50"
          >
            Submit
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
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
            contextmenu: false, // no right-click paste
          }}
        />
      </div>

      <div className="h-24 border-t border-gray-700 p-2 bg-black">
        <textarea
          value={stdin}
          onChange={(e) => setStdin(e.target.value)}
          placeholder="Custom input (for Run only)…"
          className="w-full h-full bg-transparent outline-none text-white text-sm font-mono resize-none"
        />
      </div>
    </div>
  );
}
