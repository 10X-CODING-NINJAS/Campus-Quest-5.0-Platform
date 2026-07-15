import { Zap, Shield } from 'lucide-react';

function WebIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2 L12 22 M2 12 L22 12 M5 5 L19 19 M19 5 L5 19" strokeLinecap="round" />
    </svg>
  );
}

interface LeftSidebarProps {
  onSpiderSenseClick?: () => void;
  powerupCounts?: { SPIDER_SENSE: number; WEB_FLUID: number; SUIT_TECH: number };
  onUsePowerup?: (type: 'SPIDER_SENSE' | 'WEB_FLUID' | 'SUIT_TECH') => void;
  solvedCount?: number;
  totalProblems?: number;
  currentRank?: number;
  hintStage?: number;
  latestVerdict?: string;
}

export default function LeftSidebar({
  onSpiderSenseClick,
  powerupCounts,
  onUsePowerup,
  solvedCount = 0,
  totalProblems = 10,
  currentRank = 1,
  hintStage = 0,
  latestVerdict = 'none'
}: LeftSidebarProps) {
  const spideySenseRemaining = 3 - (powerupCounts?.SPIDER_SENSE || 0);
  const webFluidRemaining = 2 - (powerupCounts?.WEB_FLUID || 0);
  const suitTechRemaining = 2 - (powerupCounts?.SUIT_TECH || 0);

  const progressPercent = totalProblems > 0 ? (solvedCount / totalProblems) * 100 : 0;

  const getHintStageLabel = () => {
    if (hintStage === 1) return 'STAGE 1 (Active)';
    if (hintStage === 2) return 'STAGE 2 (Resonance)';
    if (hintStage >= 3) return 'MISSION COMPLETE ✓';
    return 'LOCKED (Solve 3)';
  };

  return (
    <aside className="w-full bg-[#fdf6e2] comic-panel flex flex-col select-none p-5 text-black h-fit">
      {/* Team Stats Header */}
      <div className="flex items-center justify-between mb-4 border-b-2 border-black/10 pb-2">
        <div className="comic-badge-yellow text-sm font-bold tracking-widest uppercase rounded-none">
          MISSION CONTROL HUD
        </div>
        <div className="flex items-center gap-1.5 font-mono text-xs font-black">
          RANK: <span className="bg-yellow-400 text-black border-2 border-black px-2 py-0.5 rounded shadow-[1px_1px_0_#000]">#{currentRank}</span>
        </div>
      </div>

      {/* Stats Split Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progress Bars & Info Panels */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center text-black font-display font-bold text-xs uppercase tracking-wider mb-1">
              <span>FRAGMENT PROGRESS</span>
              <span className="font-mono text-xs text-red-600 font-extrabold">{solvedCount}/{totalProblems} Solved</span>
            </div>
            <div className="w-full h-6 border-3 border-black bg-stone-700 rounded-none shadow-[2px_2px_0px_#000] overflow-hidden p-0.5">
              <div 
                className="h-full bg-[#ef4444] border-r-2 border-black rounded-none transition-all duration-500" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div className="bg-white/60 border-2 border-black p-2 shadow-[2px_2px_0_#000]">
              <div className="text-[10px] text-zinc-500 font-display font-bold uppercase">HINT SENSOR</div>
              <div className="font-mono text-[10px] font-black text-purple-700 uppercase mt-0.5">
                {getHintStageLabel()}
              </div>
            </div>
            <div className="bg-white/60 border-2 border-black p-2 shadow-[2px_2px_0_#000]">
              <div className="text-[10px] text-zinc-500 font-display font-bold uppercase">LAST VERDICT</div>
              <div className={`font-mono text-[10px] font-black uppercase mt-0.5 ${
                latestVerdict === 'AC' ? 'text-green-600 animate-pulse' :
                latestVerdict === 'none' ? 'text-zinc-500' : 'text-red-500'
              }`}>
                {latestVerdict}
              </div>
            </div>
          </div>
        </div>

        {/* Spider Actions Powerup triggers */}
        <div className="flex flex-col justify-center">
          <div className="text-[10px] text-zinc-500 font-display font-bold uppercase mb-2">POWERUP ARSENAL</div>
          <div className="grid grid-cols-3 gap-3">
            {/* Spider Sense */}
            <div 
              onClick={() => {
                if (spideySenseRemaining > 0) {
                  onUsePowerup?.('SPIDER_SENSE');
                  if (onSpiderSenseClick) onSpiderSenseClick();
                }
              }}
              className={`flex flex-col items-center justify-center bg-white/70 border-3 border-black p-2 rounded-none shadow-[3px_3px_0px_#000] transition-transform text-center ${spideySenseRemaining > 0 ? 'hover:translate-y-[-1px] cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
            >
              <div className="w-9 h-9 rounded-none bg-[#ef4444] border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_#000] text-white mb-1.5">
                <WebIcon className="w-4.5 h-4.5" />
              </div>
              <div className="text-black font-display font-bold text-[11px] leading-none">SPIDER SENSE</div>
              <div className="text-[9px] text-gray-500 font-semibold mt-1">Remaining: {spideySenseRemaining}</div>
            </div>

            {/* Web Fluid */}
            <div 
              onClick={() => {
                if (webFluidRemaining > 0) onUsePowerup?.('WEB_FLUID');
              }}
              className={`flex flex-col items-center justify-center bg-white/70 border-3 border-black p-2 rounded-none shadow-[3px_3px_0px_#000] transition-transform text-center ${webFluidRemaining > 0 ? 'hover:translate-y-[-1px] cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
            >
              <div className="w-9 h-9 rounded-none bg-[#3b82f6] border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_#000] text-white mb-1.5">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div className="text-black font-display font-bold text-[11px] leading-none">WEB-FLUID</div>
              <div className="text-[9px] text-gray-500 font-semibold mt-1">Remaining: {webFluidRemaining}</div>
            </div>

            {/* Suit Tech */}
            <div 
              onClick={() => {
                if (suitTechRemaining > 0) onUsePowerup?.('SUIT_TECH');
              }}
              className={`flex flex-col items-center justify-center bg-white/70 border-3 border-black p-2 rounded-none shadow-[3px_3px_0px_#000] transition-transform text-center ${suitTechRemaining > 0 ? 'hover:translate-y-[-1px] cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
            >
              <div className="w-9 h-9 rounded-none bg-[#3b82f6] border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_#000] text-white mb-1.5">
                <Shield className="w-4.5 h-4.5 fill-current" />
              </div>
              <div className="text-black font-display font-bold text-[11px] leading-none">SUIT TECH</div>
              <div className="text-[9px] text-gray-500 font-semibold mt-1">Remaining: {suitTechRemaining}</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
