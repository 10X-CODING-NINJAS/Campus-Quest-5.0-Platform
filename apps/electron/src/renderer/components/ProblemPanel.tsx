import { ChevronLeft, ChevronRight } from 'lucide-react';
import webBg from '../../Assets/web bg.png';

interface ProblemPanelProps {
  questionNum: number;
  setQuestionNum: React.Dispatch<React.SetStateAction<number>>;
  currentProblem: any;
  totalProblems: number;
  maxUnlockedQuestion?: number;
  solvedProblemIds?: Set<string>;
  bypassedProblemIds?: Set<string>;
  problems?: any[];
}

export default function ProblemPanel({ 
  questionNum, 
  setQuestionNum, 
  currentProblem,
  totalProblems,
  maxUnlockedQuestion = 1,
  solvedProblemIds = new Set(),
  bypassedProblemIds = new Set(),
  problems = []
}: ProblemPanelProps) {
  const handlePrevQuestion = () => {
    setQuestionNum(prev => (prev > 1 ? prev - 1 : 1));
  };

  const handleNextQuestion = () => {
    const max = Math.min(maxUnlockedQuestion, totalProblems || 1);
    setQuestionNum(prev => (prev < max ? prev + 1 : prev));
  };

  const sampleCase = currentProblem?.testCases?.find((tc: any) => !tc.hidden);

  return (
    <div className="w-[720px] h-[880px] flex-shrink-0 flex flex-col bg-[#faf8f0] comic-panel p-5 text-black select-none comic-halftone justify-between">
      
      {/* Question Nav & Mission Map */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center justify-between bg-white border-4 border-black p-2 rounded-none shadow-[3px_3px_0px_#000]">
          <button
            onClick={handlePrevQuestion}
            disabled={questionNum <= 1}
            className={`w-10 h-10 flex items-center justify-center border-3 border-black bg-yellow-400 rounded-none transition-colors shadow-[2px_2px_0px_#000] active:translate-y-[1px] active:shadow-none ${questionNum <= 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-500 cursor-pointer'}`}
          >
            <ChevronLeft className="w-6 h-6 text-black stroke-[3px]" />
          </button>
          <span className="font-display font-black text-base text-black uppercase tracking-wider">
            Mission {questionNum} of {totalProblems || 1}
          </span>
          <button
            onClick={handleNextQuestion}
            disabled={questionNum >= Math.min(maxUnlockedQuestion, totalProblems || 1)}
            className={`w-10 h-10 flex items-center justify-center border-3 border-black bg-yellow-400 rounded-none transition-colors shadow-[2px_2px_0px_#000] active:translate-y-[1px] active:shadow-none ${questionNum >= Math.min(maxUnlockedQuestion, totalProblems || 1) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-500 cursor-pointer'}`}
          >
            <ChevronRight className="w-6 h-6 text-black stroke-[3px]" />
          </button>
        </div>
        
        {/* Mission Map UI */}
        <div className="flex gap-2 justify-between bg-white border-4 border-black p-2 shadow-[3px_3px_0px_#000]">
          {problems.map((prob, idx) => {
            const num = idx + 1;
            const isSolved = solvedProblemIds.has(prob.id);
            const isBypassed = bypassedProblemIds.has(prob.id);
            const isLocked = num > maxUnlockedQuestion;
            const isCurrent = num === questionNum;
            
            let bgColor = 'bg-gray-400';
            if (isSolved) bgColor = 'bg-green-500';
            else if (isBypassed) bgColor = 'bg-orange-500';
            else if (!isLocked) bgColor = 'bg-yellow-400';
            
            return (
              <button
                key={prob.id}
                onClick={() => { if (!isLocked) setQuestionNum(num); }}
                className={`w-10 h-8 flex items-center justify-center border-2 border-black ${bgColor} ${isCurrent ? 'ring-4 ring-blue-500 z-10 animate-pulse' : ''} ${isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:-translate-y-1 transition-transform'}`}
                title={isLocked ? 'Locked' : prob.title}
              >
                <span className="font-display font-black text-xs text-black">{num}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mission Brief Badge */}
      <div className="mb-4">
        <div className="bg-[#fde047] border-4 border-black font-display font-black text-sm tracking-widest uppercase w-full text-center py-2 rounded-none shadow-[3px_3px_0px_#000] comic-halftone-yellow">
          MISSION BRIEF: {currentProblem ? currentProblem.title.toUpperCase() : 'LOADING...'}
        </div>
      </div>

      {/* Description box */}
      <div className="bg-[#fdf6e2] border-4 border-black p-4 shadow-[4px_4px_0px_#000] rounded-none relative overflow-y-auto mb-4 max-h-[220px]">
        <div className="text-sm font-sans font-extrabold leading-relaxed text-black whitespace-pre-wrap">
          {currentProblem ? currentProblem.statement : 'No problem selected.'}
        </div>
      </div>

      {/* Difficulty Badge */}
      <div className="text-center mb-4">
        <div className="bg-[#f97316] border-4 border-black text-black font-display font-black text-sm uppercase px-6 py-2 shadow-[3px_3px_0px_#000] inline-block tracking-wider transform -rotate-1 rounded-none">
          {currentProblem ? currentProblem.difficulty || 'EASY' : 'EASY'}: {currentProblem ? currentProblem.title : 'LOADING'}
        </div>
      </div>

      {/* Example card */}
      <div 
        className="border-4 border-black p-5 shadow-[5px_5px_0px_#000] rounded-none relative overflow-y-auto flex flex-col gap-3 min-h-[380px] flex-1"
        style={{ backgroundImage: `url(${webBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#fcf8f2' }}
      >
        {sampleCase ? (
          <>
            <div className="font-display font-black text-lg text-black mb-1 z-10">
              Sample TestCase:
            </div>

            <div className="space-y-4 z-10 flex-1 flex flex-col justify-center">
              <div>
                <div className="font-display font-black text-xs uppercase text-gray-800 mb-1">
                  Input
                </div>
                <pre className="font-mono text-sm bg-[#fdf6e2] text-black p-3.5 border-3 border-black rounded-none shadow-[2px_2px_0px_#000] leading-relaxed w-fit min-w-[140px] font-extrabold whitespace-pre-wrap">
                  {sampleCase.input}
                </pre>
              </div>

              <div>
                <div className="font-display font-black text-xs uppercase text-gray-800 mb-1">
                  Output
                </div>
                <pre className="font-mono text-sm bg-[#fdf6e2] text-black p-3.5 border-3 border-black rounded-none shadow-[2px_2px_0px_#000] leading-relaxed w-fit min-w-[140px] font-extrabold whitespace-pre-wrap">
                  {sampleCase.output}
                </pre>
              </div>
            </div>
          </>
        ) : (
          <div className="font-display font-black text-lg text-black mb-1 z-10 text-center py-10">
            No sample testcase available.
          </div>
        )}
      </div>
    </div>
  );
}
