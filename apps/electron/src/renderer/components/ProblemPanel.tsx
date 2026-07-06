import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProblemPanelProps {
  questionNum: number;
  setQuestionNum: React.Dispatch<React.SetStateAction<number>>;
}

export default function ProblemPanel({ questionNum, setQuestionNum }: ProblemPanelProps) {
  const handlePrevQuestion = () => {
    setQuestionNum(prev => (prev > 1 ? prev - 1 : 10));
  };

  const handleNextQuestion = () => {
    setQuestionNum(prev => (prev < 10 ? prev + 1 : 1));
  };

  return (
    <div className="w-[540px] h-[640px] flex-shrink-0 flex flex-col bg-[#faf8f0] comic-panel p-4 text-black select-none comic-halftone">
      
      {/* Question Nav */}
      <div className="flex items-center justify-between mb-4 bg-white border-3 border-black p-2 rounded-none shadow-[2px_2px_0px_#000]">
        <button
          onClick={handlePrevQuestion}
          className="w-8 h-8 flex items-center justify-center border-2 border-black bg-yellow-400 hover:bg-yellow-500 rounded-none transition-colors cursor-pointer shadow-[1px_1px_0px_#000] active:translate-y-[1px]"
        >
          <ChevronLeft className="w-5 h-5 text-black stroke-[3px]" />
        </button>
        <span className="font-display font-bold text-sm text-black">Q. {questionNum} / 10</span>
        <button
          onClick={handleNextQuestion}
          className="w-8 h-8 flex items-center justify-center border-2 border-black bg-yellow-400 hover:bg-yellow-500 rounded-none transition-colors cursor-pointer shadow-[1px_1px_0px_#000] active:translate-y-[1px]"
        >
          <ChevronRight className="w-5 h-5 text-black stroke-[3px]" />
        </button>
      </div>

      {/* Mission Brief Badge */}
      <div className="mb-4">
        <div className="comic-badge-yellow text-xs font-bold tracking-widest uppercase w-full text-center py-1 rounded-none">
          MISSION BRIEF: THE DIMENSIONAL WEAVE
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* Description card */}
        <div className="bg-[#fafafa] border-3 border-black p-4 rounded-none shadow-[3px_3px_0px_#000] relative overflow-hidden">
          {/* Subtle background web pattern effect */}
          <div className="absolute inset-0 opacity-5 pointer-events-none comic-halftone" />
          <p className="text-xs font-sans font-bold leading-relaxed text-gray-800">
            The network of the Spider-Verse is connections. Given a web of nodes, determine the minimum number of connections required to connect all nodes together.
          </p>
        </div>

        {/* Difficulty Badge */}
        <div className="text-center">
          <div className="bg-red-500 border-3 border-black text-white font-display font-bold text-sm tracking-wider px-4 py-1.5 inline-block transform rotate-[1deg] shadow-[2px_2px_0px_#000] rounded-none">
            HARD: WEB OF CONNECTIONS
          </div>
        </div>

        {/* Example card */}
        <div className="bg-[#fdf6e2] border-3 border-black p-4 rounded-none shadow-[3px_3px_0px_#000]">
          <div className="font-display font-bold text-sm mb-3 border-b-2 border-black/10 pb-1 text-red-600">
            Example 1:
          </div>

          <div className="space-y-3">
            <div>
              <div className="font-display font-bold text-xs uppercase text-gray-600 mb-1">Input</div>
              <div className="font-mono text-xs bg-stone-800 text-green-400 p-2.5 border-2 border-black rounded-none shadow-[1px_1px_0px_#000] leading-relaxed">
                5 3<br />
                1 2<br />
                2 3<br />
                4 5
              </div>
            </div>

            <div>
              <div className="font-display font-bold text-xs uppercase text-gray-600 mb-1">Output</div>
              <div className="font-mono text-xs bg-stone-800 text-green-400 p-2.5 border-2 border-black rounded-none shadow-[1px_1px_0px_#000] leading-relaxed w-16 text-center">
                1
              </div>
            </div>

            <div className="border-t-2 border-black/10 pt-2.5 mt-2">
              <div className="font-display font-bold text-xs text-gray-700 mb-0.5">Explanation:</div>
              <p className="text-xs text-gray-600 leading-normal">
                We need one connection between (1,2,3,4) and (4,5).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
