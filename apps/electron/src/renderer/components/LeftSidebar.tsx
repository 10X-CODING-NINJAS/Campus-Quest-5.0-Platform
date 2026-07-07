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
}

export default function LeftSidebar({ onSpiderSenseClick }: LeftSidebarProps) {
  return (
    <aside className="w-full bg-[#fdf6e2] comic-panel flex flex-col select-none p-5 text-black h-fit">
      {/* Team Stats Header */}
      <div className="flex items-center justify-between mb-4 border-b-2 border-black/10 pb-2">
        <div className="comic-badge-yellow text-sm font-bold tracking-widest uppercase rounded-none">
          TEAM STATS
        </div>
      </div>

      {/* Horizontal Split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progress Bars */}
        <div className="space-y-4">
          <div>
            <div className="text-black font-display font-bold text-xs uppercase tracking-wider mb-1">
              FRAGMENT PROGRESS
            </div>
            <div className="w-full h-6 border-3 border-black bg-stone-700 rounded-none shadow-[2px_2px_0px_#000] overflow-hidden">
              <div className="h-full bg-[#ef4444] border-r-2 border-black rounded-none" style={{ width: '60%' }} />
            </div>
          </div>

          <div>
            <div className="text-black font-display font-bold text-xs uppercase tracking-wider mb-1">
              THWIP COUNT
            </div>
            <div className="w-full h-6 border-3 border-black bg-stone-700 rounded-none shadow-[2px_2px_0px_#000] overflow-hidden">
              <div className="h-full bg-[#3b82f6] border-r-2 border-black rounded-none" style={{ width: '40%' }} />
            </div>
          </div>
        </div>

        {/* Spider Actions */}
        <div className="flex flex-col justify-center">
          <div className="grid grid-cols-3 gap-3">
            {/* Spider Sense */}
            <div 
              onClick={onSpiderSenseClick}
              className="flex flex-col items-center justify-center bg-white/70 border-3 border-black p-2 rounded-none shadow-[3px_3px_0px_#000] hover:translate-y-[-1px] transition-transform cursor-pointer text-center"
            >
              <div className="w-9 h-9 rounded-none bg-[#ef4444] border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_#000] text-white mb-1.5">
                <WebIcon className="w-4.5 h-4.5" />
              </div>
              <div className="text-black font-display font-bold text-[11px] leading-none">SPIDER SENSE</div>
              <div className="text-[9px] text-gray-500 font-semibold mt-1">3 usage</div>
            </div>

            {/* Web Fluid */}
            <div className="flex flex-col items-center justify-center bg-white/70 border-3 border-black p-2 rounded-none shadow-[3px_3px_0px_#000] hover:translate-y-[-1px] transition-transform cursor-pointer text-center">
              <div className="w-9 h-9 rounded-none bg-[#3b82f6] border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_#000] text-white mb-1.5">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div className="text-black font-display font-bold text-[11px] leading-none">WEB-FLUID</div>
              <div className="text-[9px] text-gray-500 font-semibold mt-1">2 usage</div>
            </div>

            {/* Suit Tech */}
            <div className="flex flex-col items-center justify-center bg-white/70 border-3 border-black p-2 rounded-none shadow-[3px_3px_0px_#000] hover:translate-y-[-1px] transition-transform cursor-pointer text-center">
              <div className="w-9 h-9 rounded-none bg-[#3b82f6] border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_#000] text-white mb-1.5">
                <Shield className="w-4.5 h-4.5 fill-current" />
              </div>
              <div className="text-black font-display font-bold text-[11px] leading-none">SUIT TECH</div>
              <div className="text-[9px] text-gray-500 font-semibold mt-1">2 usage</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
