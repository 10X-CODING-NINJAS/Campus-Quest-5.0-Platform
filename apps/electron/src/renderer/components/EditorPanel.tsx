import { useEffect, useRef } from "react";
import { Play, Check, Code, Terminal, Zap } from "lucide-react";
import Editor from "@monaco-editor/react";
import { Challenge, SubmissionResult } from "../types";

interface EditorPanelProps {
  activeChallenge: Challenge;
  language: "cpp" | "python" | "c" | "java";
  setLanguage: (lang: "cpp" | "python" | "c" | "java") => void;
  code: string;
  onChangeCode: (code: string) => void;
  onRunCode: () => void;
  onSubmitCode: () => void;
  onUseSpideySense: () => void;
  submissionResult: SubmissionResult;
  consoleLogs: string[];
}

export default function EditorPanel({
  language,
  setLanguage,
  code,
  onChangeCode,
  onRunCode,
  onSubmitCode,
  onUseSpideySense,
  submissionResult,
  consoleLogs
}: EditorPanelProps) {
  // Auto scroll terminal logs
  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLogs]);

  return (
    <div className="w-full lg:w-[820px] bg-[#EAE8E0] border-4 border-black p-4 flex flex-col gap-4 select-none shadow-[6px_6px_0_0_rgba(0,0,0,1)] relative comic-panel comic-halftone">
      
      {/* 1. Header Bar: Tabs for Language Selector */}
      <div className="flex items-center justify-between border-b-2 border-black pb-2">
        <div className="flex gap-1.5">
          <button
            onClick={() => setLanguage("cpp")}
            className={`px-3 py-1 border-2 border-black rounded-none text-[10px] font-mono font-black transition shadow-[1px_1px_0_rgba(0,0,0,1)] cursor-pointer ${
              language === "cpp" ? "bg-red-500 text-white" : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            C++17 x
          </button>
          <button
            onClick={() => setLanguage("python")}
            className={`px-3 py-1 border-2 border-black rounded-none text-[10px] font-mono font-black transition shadow-[1px_1px_0_rgba(0,0,0,1)] cursor-pointer ${
              language === "python" ? "bg-yellow-400 text-black" : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            Python 3 x
          </button>
          <button
            onClick={() => setLanguage("c")}
            className={`px-3 py-1 border-2 border-black rounded-none text-[10px] font-mono font-black transition shadow-[1px_1px_0_rgba(0,0,0,1)] cursor-pointer ${
              language === "c" ? "bg-sky-500 text-white" : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            C17 x
          </button>
          <button
            onClick={() => setLanguage("java")}
            className={`px-3 py-1 border-2 border-black rounded-none text-[10px] font-mono font-black transition shadow-[1px_1px_0_rgba(0,0,0,1)] cursor-pointer ${
              language === "java" ? "bg-emerald-500 text-white" : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            Java 21 x
          </button>
        </div>
        
        <div className="flex items-center gap-1 font-mono text-[9px] text-zinc-500 font-bold uppercase">
          <Code className="w-3.5 h-3.5 text-zinc-600 animate-pulse" />
          {language === "cpp" ? "main.cpp" : language === "python" ? "main.py" : language === "java" ? "Main.java" : "main.c"}
        </div>
      </div>

      {/* 2. Main IDE Monaco Editor */}
      <div className="flex bg-[#1E1E1E] rounded-none border-3 border-black overflow-hidden h-[480px] shadow-[3px_3px_0_0_rgba(0,0,0,1)] relative w-full">
        <Editor
          height="100%"
          width="100%"
          language={language === "cpp" ? "cpp" : language === "python" ? "python" : language === "java" ? "java" : "c"}
          value={code}
          onChange={(v) => onChangeCode(v ?? "")}
          theme="vs-dark"
          options={{
            fontSize: 12,
            minimap: { enabled: false },
            automaticLayout: true,
            scrollBeyondLastLine: false,
            contextmenu: false,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            lineNumbersMinChars: 3,
            tabSize: 4,
          }}
        />
      </div>

      {/* 3. Action Buttons Section (Run, Submit, & Spidey Sense) */}
      <div className="grid grid-cols-3 gap-3">
        <button
          id="btn_run"
          onClick={onRunCode}
          disabled={submissionResult.status === "PENDING" || submissionResult.status === "RUNNING"}
          className="bg-red-500 hover:bg-red-600 text-white font-sans font-black tracking-wide text-xs uppercase border-3 border-black rounded-none py-2.5 px-3 shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          Run Code
        </button>

        <button
          id="btn_submit"
          onClick={onSubmitCode}
          disabled={submissionResult.status === "PENDING" || submissionResult.status === "RUNNING"}
          className="bg-sky-500 hover:bg-sky-600 text-white font-sans font-black tracking-wide text-xs uppercase border-3 border-black rounded-none py-2.5 px-3 shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          Submit Code
        </button>

        <button
          id="btn_spidey"
          onClick={onUseSpideySense}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-sans font-black tracking-wide text-xs uppercase border-3 border-black rounded-none py-2.5 px-3 shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-1.5 transition cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          Spidey Sense
        </button>
      </div>

      {/* 4. Terminal Simulation Window */}
      <div className="border-3 border-black bg-zinc-950 p-3 rounded-none flex-1 flex flex-col shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5 mb-2 select-none">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-zinc-400 font-bold uppercase">
            <Terminal className="w-3.5 h-3.5 text-zinc-500" />
            Active Console Log
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse border border-black" />
        </div>
        
        {/* Log Lines */}
        <div className="flex-1 overflow-y-auto max-h-[110px] font-mono text-[10px] text-zinc-300 space-y-1">
          {consoleLogs.map((log, idx) => (
            <div 
              key={idx} 
              className={`leading-relaxed whitespace-pre-wrap ${
                log.startsWith("✓") || log.includes("ACCEPTED") ? "text-green-400 font-bold" :
                log.startsWith("✗") || log.includes("ERROR") || log.includes("FAILED") ? "text-red-400 font-bold" : 
                log.startsWith("⚙") ? "text-yellow-400" : "text-zinc-300"
              }`}
            >
              {log}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

    </div>
  );
}
