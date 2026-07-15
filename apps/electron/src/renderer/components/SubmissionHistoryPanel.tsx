import { useState } from 'react';
import { Calendar, Clock, Code } from 'lucide-react';

interface Submission {
  id: string;
  verdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE';
  runtimeMs: number;
  memoryKb: number;
  language: string;
  sourceCode: string;
  createdAt: string;
}

interface SubmissionHistoryPanelProps {
  submissions: Submission[];
}

export default function SubmissionHistoryPanel({ submissions }: SubmissionHistoryPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const getVerdictStyle = (verdict: string) => {
    switch (verdict) {
      case 'AC':
        return 'bg-green-100 text-green-700 border-green-400';
      case 'CE':
        return 'bg-yellow-100 text-yellow-700 border-yellow-400';
      default:
        return 'bg-red-100 text-red-700 border-red-400';
    }
  };

  return (
    <div className="w-full bg-[#fdf6e2] comic-panel p-5 text-black h-fit shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between border-b-2 border-black/10 pb-2 mb-4">
        <div className="comic-badge-yellow text-sm font-bold tracking-widest uppercase rounded-none">
          CHRONOLOGY OF ATTEMPTS
        </div>
        <span className="font-mono text-[10px] text-zinc-500 font-bold uppercase">
          {submissions.length} Total Submissions
        </span>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-6 text-zinc-500 font-mono text-xs">
          No attempts recorded for this fragment yet.
        </div>
      ) : (
        <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
          {submissions.map((sub, idx) => {
            const attemptNum = submissions.length - idx;
            const isExpanded = expandedId === sub.id;
            
            return (
              <div 
                key={sub.id}
                className="border-2 border-black bg-white rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,1)] overflow-hidden transition-all"
              >
                {/* Header section */}
                <div 
                  onClick={() => toggleExpand(sub.id)}
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-50/80 active:bg-zinc-100/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-black text-zinc-500">
                      #{attemptNum}
                    </span>
                    <span className={`font-mono text-[10px] font-black border-2 px-1.5 py-0.5 rounded ${getVerdictStyle(sub.verdict)}`}>
                      {sub.verdict}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-600 bg-zinc-100 border border-black/10 px-1.5 py-0.5">
                      {sub.language.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-mono">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{sub.runtimeMs}ms</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-zinc-400" />
                      <span>{new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {/* Collapsible Source Code view */}
                {isExpanded && (
                  <div className="border-t-2 border-black bg-[#1e1e1e] p-3 text-[#d4d4d4] font-mono text-[10px] relative">
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/40 text-[9px] text-zinc-400 px-1.5 py-0.5 border border-zinc-800">
                      <Code className="w-3 h-3" />
                      Source Code
                    </div>
                    <pre className="overflow-x-auto whitespace-pre-wrap max-h-[160px] leading-relaxed pt-4">
                      {sub.sourceCode}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
