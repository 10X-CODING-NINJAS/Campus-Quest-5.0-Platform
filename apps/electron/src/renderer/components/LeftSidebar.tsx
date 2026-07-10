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
  questionsSolved: number;
  hintProgress: 0 | 1 | 2 | 3;
  missionCompleted: boolean;
}

export default function LeftSidebar({ onSpiderSenseClick, powerupCounts, onUsePowerup, questionsSolved, hintProgress, missionCompleted }: LeftSidebarProps) {
  const spideySenseRemaining = 3 - (powerupCounts?.SPIDER_SENSE || 0);
  const webFluidRemaining = 2 - (powerupCounts?.WEB_FLUID || 0);
  const suitTechRemaining = 2 - (powerupCounts?.SUIT_TECH || 0);

  // Compute progress percentages
  const latProgress = Math.min(questionsSolved, 3) / 3 * 100;
  const longProgress = Math.max(0, Math.min(questionsSolved - 3, 3)) / 3 * 100;
  const riddleProgress = Math.max(0, Math.min(questionsSolved - 6, 4)) / 4 * 100;

  // Compute label text
  const latLabel = questionsSolved >= 3 ? "100% (40.7128° N)" : `${Math.round(latProgress)}% (Decrypting)`;
  const longLabel = questionsSolved >= 6 ? "100% (74.0060° W)" : questionsSolved < 3 ? "0% (Locked)" : `${Math.round(longProgress)}% (Decrypting)`;
  const riddleLabel = questionsSolved >= 10 ? "100% (Decrypted)" : questionsSolved < 6 ? "0% (Locked)" : `${Math.round(riddleProgress)}% (Decrypting)`;

  return (
    <aside className="w-full bg-[#fdf6e2] comic-panel flex flex-col select-none p-5 text-black h-fit">
      {/* Team Stats Header */}
      <div className="flex items-center justify-between mb-4 border-b-2 border-black/10 pb-2">
        <div className="comic-badge-yellow text-sm font-bold tracking-widest uppercase rounded-none flex items-center gap-2">
          TEAM MISSION SUMMARY
        </div>
        <div className="font-display font-black text-sm text-red-600 bg-white border-2 border-black px-2 py-0.5 shadow-[1.5px_1.5px_0px_#000]">
          RESOLVED: {questionsSolved} / 10
        </div>
      </div>

      {/* Horizontal Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progress Bars */}
        <div className="space-y-3">
          {/* Latitude */}
          <div>
            <div className="flex justify-between text-black font-display font-extrabold text-[9px] uppercase tracking-wider mb-0.5">
              <span>Latitude Signal</span>
              <span className="text-red-600 font-black">{latLabel}</span>
            </div>
            <div className="w-full h-4 border-2 border-black bg-stone-700 rounded-none shadow-[1.5px_1.5px_0px_#000] overflow-hidden">
              <div 
                className="h-full bg-[#ef4444] transition-all duration-500 ease-out" 
                style={{ width: `${latProgress}%` }} 
              />
            </div>
          </div>

          {/* Longitude */}
          <div>
            <div className="flex justify-between text-black font-display font-extrabold text-[9px] uppercase tracking-wider mb-0.5">
              <span>Longitude Signal</span>
              <span className="text-blue-600 font-black">{longLabel}</span>
            </div>
            <div className="w-full h-4 border-2 border-black bg-stone-700 rounded-none shadow-[1.5px_1.5px_0px_#000] overflow-hidden">
              <div 
                className="h-full bg-[#3b82f6] transition-all duration-500 ease-out" 
                style={{ width: `${longProgress}%` }} 
              />
            </div>
          </div>

          {/* Riddle */}
          <div>
            <div className="flex justify-between text-black font-display font-extrabold text-[9px] uppercase tracking-wider mb-0.5">
              <span>CTF Riddle Fragments</span>
              <span className="text-pink-600 font-black">{riddleLabel}</span>
            </div>
            <div className="w-full h-4 border-2 border-black bg-stone-700 rounded-none shadow-[1.5px_1.5px_0px_#000] overflow-hidden">
              <div 
                className="h-full bg-pink-500 transition-all duration-500 ease-out" 
                style={{ width: `${riddleProgress}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Spider Actions */}
        <div className="flex flex-col justify-center">
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

        <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-emerald-700">
          Mission Status: {missionCompleted ? 'Completed' : hintProgress > 0 ? 'In Progress' : 'Not Started'}
        </div>
      </div>
    </aside>
  );
}
