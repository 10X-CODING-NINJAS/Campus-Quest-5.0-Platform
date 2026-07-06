import React, { useEffect, useRef } from "react";
import { Play, Check, Code, Terminal } from "lucide-react";
import { Challenge, SubmissionResult } from "../types";

interface EditorPanelProps {
  activeChallenge: Challenge;
  language: "cpp" | "python" | "javascript";
  setLanguage: (lang: "cpp" | "python" | "javascript") => void;
  code: string;
  onChangeCode: (code: string) => void;
  onRunCode: () => void;
  onSubmitCode: () => void;
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
  submissionResult,
  consoleLogs
}: EditorPanelProps) {
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineCount = code.split("\n").length;
  const lineNumbers = Array.from({ length: Math.max(1, lineCount) }, (_, i) => i + 1);

  // Auto scroll terminal logs
  const logEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLogs]);

  // Handle Tab key insertion inside textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = code.substring(0, start) + "    " + code.substring(end);
      onChangeCode(newValue);
      
      // Reset cursor position
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

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
            onClick={() => setLanguage("javascript")}
            className={`px-3 py-1 border-2 border-black rounded-none text-[10px] font-mono font-black transition shadow-[1px_1px_0_rgba(0,0,0,1)] cursor-pointer ${
              language === "javascript" ? "bg-sky-500 text-white" : "bg-white text-black hover:bg-zinc-100"
            }`}
          >
            JS/TS x
          </button>
        </div>
        
        <div className="flex items-center gap-1 font-mono text-[9px] text-zinc-500 font-bold uppercase">
          <Code className="w-3.5 h-3.5 text-zinc-600 animate-pulse" />
          {language === "cpp" ? "main.cpp" : language === "python" ? "main.py" : "main.ts"}
        </div>
      </div>

      {/* 2. Main IDE Textarea with line numbers */}
      <div className="flex font-mono text-xs bg-[#1E1E1E] text-[#D4D4D4] rounded-none border-3 border-black overflow-hidden h-[480px] shadow-[3px_3px_0_0_rgba(0,0,0,1)] relative">
        {/* Line Numbers Sidebar */}
        <div className="bg-[#151515] select-none text-zinc-600 py-3.5 px-2 text-right min-w-[34px] border-r border-zinc-800 text-[11px] font-semibold leading-normal overflow-hidden">
          {lineNumbers.map((n) => (
            <div key={n} className="h-5">
              {n}
            </div>
          ))}
        </div>
        
        {/* Textarea Input overlay */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChangeCode(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck="false"
          className="flex-1 bg-transparent p-3 text-[#E0E0E0] outline-none resize-none font-mono text-[11px] leading-5 whitespace-pre overflow-auto scrollbar-thin scrollbar-thumb-zinc-700"
          style={{ tabSize: 4 }}
          placeholder="// Type your multi-dimensional Spider algorithm here..."
        />
      </div>

      {/* 3. Action Buttons Section (Run & Submit) */}
      <div className="grid grid-cols-2 gap-3.5">
        <button
          id="btn_run"
          onClick={onRunCode}
          disabled={submissionResult.status === "PENDING" || submissionResult.status === "RUNNING"}
          className="bg-red-500 hover:bg-red-600 text-white font-sans font-black tracking-wide text-xs uppercase border-3 border-black rounded-none py-2.5 px-4 shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          Run Code
        </button>

        <button
          id="btn_submit"
          onClick={onSubmitCode}
          disabled={submissionResult.status === "PENDING" || submissionResult.status === "RUNNING"}
          className="bg-sky-500 hover:bg-sky-600 text-white font-sans font-black tracking-wide text-xs uppercase border-3 border-black rounded-none py-2.5 px-4 shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Check className="w-4 h-4" />
          Submit Code
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
