import { ChevronLeft, ChevronRight } from 'lucide-react';
import webBg from '../../Assets/web bg.png';

interface ProblemPanelProps {
  questionNum: number;
  setQuestionNum: React.Dispatch<React.SetStateAction<number>>;
  problem: any;
  loading: boolean;
}

export default function ProblemPanel({ questionNum, setQuestionNum, problem, loading }: ProblemPanelProps) {
  const handlePrevQuestion = () => {
    setQuestionNum(prev => (prev > 1 ? prev - 1 : 10));
  };

  const handleNextQuestion = () => {
    setQuestionNum(prev => (prev < 10 ? prev + 1 : 1));
  };

  return (
    <div className="w-[720px] h-[880px] flex-shrink-0 flex flex-col bg-[#faf8f0] comic-panel p-5 text-black select-none comic-halftone justify-between">
      
      {/* Question Nav */}
      <div className="flex items-center justify-between mb-4 bg-white border-4 border-black p-2 rounded-none shadow-[3px_3px_0px_#000]">
        <button
          onClick={handlePrevQuestion}
          className="w-10 h-10 flex items-center justify-center border-3 border-black bg-yellow-400 hover:bg-yellow-500 rounded-none transition-colors cursor-pointer shadow-[2px_2px_0px_#000] active:translate-y-[1px] active:shadow-none"
        >
          <ChevronLeft className="w-6 h-6 text-black stroke-[3px]" />
        </button>
        <span className="font-display font-black text-base text-black">Q. {questionNum} / 10</span>
        <button
          onClick={handleNextQuestion}
          className="w-10 h-10 flex items-center justify-center border-3 border-black bg-yellow-400 hover:bg-yellow-500 rounded-none transition-colors cursor-pointer shadow-[2px_2px_0px_#000] active:translate-y-[1px] active:shadow-none"
        >
          <ChevronRight className="w-6 h-6 text-black stroke-[3px]" />
        </button>
      </div>

      {/* Mission Brief Badge */}
      <div className="mb-4">
        <div className="bg-[#fde047] border-4 border-black font-display font-black text-sm tracking-widest uppercase w-full text-center py-2 rounded-none shadow-[3px_3px_0px_#000] comic-halftone-yellow">
          {loading ? 'SYNCING MULTIVERSE SIGNAL...' : `MISSION BRIEF: ${problem?.title?.toUpperCase() || 'LOADING...'}`}
        </div>
      </div>

      {/* Description & Content Scrollbox */}
      <div className="bg-[#fdf6e2] border-4 border-black p-5 shadow-[5px_5px_0px_#000] rounded-none flex-1 overflow-y-auto mb-2 flex flex-col gap-4 max-h-[700px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-20">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="font-mono text-xs uppercase text-zinc-600 font-bold">Synchronizing Multiverse Anchors...</span>
          </div>
        ) : problem ? (
          <div className="space-y-4 font-sans text-sm font-extrabold leading-relaxed text-black whitespace-pre-wrap select-text selection:bg-yellow-200">
            {problem.statement}
          </div>
        ) : (
          <div className="text-center font-mono text-xs text-red-600 font-bold py-10">
            ❌ FAILED TO RESOLVE DIMENSIONAL PACKETS.
          </div>
        )}
      </div>
      
      {/* Footer Info bar */}
      {problem && !loading && (
        <div className="flex justify-between items-center mt-2 px-1 text-[10px] font-mono text-zinc-600 uppercase font-black">
          <span>TIME LIMIT: {problem.timeLimit}MS</span>
          <span>MEM LIMIT: {problem.memoryLimit}MB</span>
          <span className="text-orange-600 bg-orange-100 border border-orange-400 px-2 py-0.5 transform rotate-1">
            DIFFICULTY: {problem.difficulty}
          </span>
        </div>
      )}
    </div>
  );
}
