import { useState, useEffect } from 'react';
import { Zap, Shield } from 'lucide-react';

function WebIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2 L12 22 M2 12 L22 12 M5 5 L19 19 M19 5 L5 19" strokeLinecap="round" />
    </svg>
  );
}

export default function LeftSidebar() {
  const [seconds, setSeconds] = useState(77 * 60 + 42);
  const [colonVisible, setColonVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(s => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const blink = setInterval(() => setColonVisible(v => !v), 500);
    return () => clearInterval(blink);
  }, []);

  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');

  return (
    <aside className="w-64 flex-shrink-0 bg-[#fdf6e2] comic-panel flex flex-col overflow-hidden select-none p-5 text-black">
      {/* Team Stats Badge */}
      <div className="mb-6">
        <div className="comic-badge-yellow text-sm font-bold tracking-widest uppercase rounded-none">
          TEAM STATS
        </div>
      </div>

      {/* Progress Bars */}
      <div className="space-y-4 mb-6">
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

      <div className="w-full h-[2px] bg-black/10 my-4" />

      {/* Spider Actions */}
      <div className="space-y-3.5 flex-1">
        {/* Spider Sense */}
        <div className="flex items-center gap-3 bg-white/70 border-3 border-black p-2 rounded-none shadow-[3px_3px_0px_#000] hover:translate-y-[-1px] transition-transform cursor-pointer">
          <div className="w-10 h-10 rounded-none bg-[#ef4444] border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_#000] text-white">
            <WebIcon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-black font-display font-bold text-sm tracking-wide leading-none">SPIDER SENSE</div>
            <div className="text-[10px] text-gray-500 font-semibold mt-1">3 usage</div>
          </div>
        </div>

        {/* Web Fluid */}
        <div className="flex items-center gap-3 bg-white/70 border-3 border-black p-2 rounded-none shadow-[3px_3px_0px_#000] hover:translate-y-[-1px] transition-transform cursor-pointer">
          <div className="w-10 h-10 rounded-none bg-[#3b82f6] border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_#000] text-white">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div className="text-left">
            <div className="text-black font-display font-bold text-sm tracking-wide leading-none">WEB-FLUID</div>
            <div className="text-[10px] text-gray-500 font-semibold mt-1">2 usage</div>
          </div>
        </div>

        {/* Suit Tech */}
        <div className="flex items-center gap-3 bg-white/70 border-3 border-black p-2 rounded-none shadow-[3px_3px_0px_#000] hover:translate-y-[-1px] transition-transform cursor-pointer">
          <div className="w-10 h-10 rounded-none bg-[#3b82f6] border-2 border-black flex items-center justify-center shadow-[1px_1px_0px_#000] text-white">
            <Shield className="w-5 h-5 fill-current" />
          </div>
          <div className="text-left">
            <div className="text-black font-display font-bold text-sm tracking-wide leading-none">SUIT TECH</div>
            <div className="text-[10px] text-gray-500 font-semibold mt-1">2 usage</div>
          </div>
        </div>
      </div>

      {/* Clock Display at bottom */}
      <div className="mt-auto">
        <div className="digital-clock rounded-none p-3 text-center border-3 border-black shadow-[3px_3px_0px_#000]">
          <div className="font-digital text-red-500 font-bold text-3xl tracking-widest drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]">
            {h}<span className={colonVisible ? 'opacity-100' : 'opacity-20'}>:</span>{m}<span className={colonVisible ? 'opacity-100' : 'opacity-20'}>:</span>{s}
          </div>
        </div>
      </div>
    </aside>
  );
}
