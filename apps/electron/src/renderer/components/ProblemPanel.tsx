import { ChevronLeft, ChevronRight } from 'lucide-react';
import webBg from '../../Assets/web bg.png';

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
          MISSION BRIEF: THE DIMENSIONAL WEAVE
        </div>
      </div>

      {/* Description box */}
      <div className="bg-[#fdf6e2] border-4 border-black p-4 shadow-[4px_4px_0px_#000] rounded-none relative overflow-hidden mb-4">
        <p className="text-sm font-sans font-extrabold leading-relaxed text-black">
          The network of the Spider-Verse is connections. Given a work of nodes. Determinet the minimum number of nodes connected all nodes connections. Next m lines contains u, v - an undrected connection and mcnment to connect all nodes together.
        </p>
      </div>

      {/* Difficulty Badge */}
      <div className="text-center mb-4">
        <div className="bg-[#f97316] border-4 border-black text-black font-display font-black text-sm uppercase px-6 py-2 shadow-[3px_3px_0px_#000] inline-block tracking-wider transform -rotate-1 rounded-none">
          HARD: WEB OF CONNECTIONS
        </div>
      </div>

      {/* Example card */}
      <div 
        className="border-4 border-black p-5 shadow-[5px_5px_0px_#000] rounded-none relative overflow-hidden flex flex-col gap-3 min-h-[440px] flex-1"
        style={{ backgroundImage: `url(${webBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#fcf8f2' }}
      >

        <div className="font-display font-black text-lg text-black mb-1 z-10">
          Example 1:
        </div>

        <div className="space-y-4 z-10 flex-1 flex flex-col justify-center">
          <div>
            <div className="font-display font-black text-xs uppercase text-gray-800 mb-1">
              Input
            </div>
            <div className="font-mono text-sm bg-[#fdf6e2] text-black p-3.5 border-3 border-black rounded-none shadow-[2px_2px_0px_#000] leading-relaxed w-fit min-w-[140px] font-extrabold">
              5 3<br />
              1 2<br />
              2 3<br />
              4 5
            </div>
          </div>

          <div>
            <div className="font-display font-black text-xs uppercase text-gray-800 mb-1">
              Output
            </div>
            <div className="bg-[#fdf6e2] border-3 border-black p-3.5 shadow-[2px_2px_0px_#000] rounded-none">
              <div className="font-sans text-xs text-black font-extrabold leading-relaxed">
                <span className="font-display font-black text-xs uppercase text-black block mb-0.5">Explanation:</span>
                We need one connection between (1,2,3, 4) and (4,5).
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
