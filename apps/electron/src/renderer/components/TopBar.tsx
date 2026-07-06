import { useState, useEffect } from 'react';
import { Bell, Settings, Minus, Square, X } from 'lucide-react';

export default function TopBar() {
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

  const handleMinimize = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.minimize();
    }
  };

  const handleMaximize = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.maximize();
    }
  };

  const handleClose = () => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.close();
    }
  };

  return (
    <header className="flex items-center h-16 px-4 border-b-4 border-black bg-[#0d0d1e] flex-shrink-0 relative z-10 select-none comic-halftone">
      {/* Logo */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="relative flex items-center justify-center w-10 h-10 border-2 border-black bg-red-600 rounded-full shadow-[2px_2px_0px_0px_#000]">
          <svg viewBox="0 0 32 32" className="w-7 h-7" fill="none">
            <circle cx="16" cy="16" r="15" fill="#cc1a1a" />
            <path d="M16 4 C16 4 8 10 8 16 C8 22 16 28 16 28 C16 28 24 22 24 16 C24 10 16 4 16 4Z" fill="#000000" fillOpacity="0.4" />
            <path d="M4 16 L28 16 M12 8 L20 24 M20 8 L12 24" stroke="#000000" strokeWidth="1.5" />
            <circle cx="16" cy="16" r="4" fill="#cc1a1a" stroke="#000" strokeWidth="1.5" />
            <ellipse cx="12" cy="12" rx="3.5" ry="2" fill="white" stroke="#000" strokeWidth="1" />
            <ellipse cx="20" cy="12" rx="3.5" ry="2" fill="white" stroke="#000" strokeWidth="1" />
          </svg>
        </div>
        <div>
          <div className="text-white comic-title text-xl tracking-wide leading-none text-red-500" style={{ WebkitTextStroke: '0.5px black' }}>
            SPIDER-VERSE: FRAGMENT HUNT
          </div>
          <div className="text-gray-400 font-mono text-[10px] uppercase tracking-wider mt-0.5">
            4. CORE MISSION TERMINAL
          </div>
        </div>
      </div>

      <div className="flex-1" />

      {/* Center Mission Time Digital Panel */}
      <div className="absolute left-1/2 transform -translate-x-1/2 top-0 flex flex-col items-center bg-[#05050a] border-x-4 border-b-4 border-black px-8 py-1.5 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.15)] rounded-b-xl z-20">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-0.5">MISSION TIME</span>
        <div className="font-digital text-red-500 font-bold text-2xl tracking-widest leading-none drop-shadow-[0_0_8px_#ef4444]">
          {h}<span className={colonVisible ? 'opacity-100' : 'opacity-20'}>:</span>{m}<span className={colonVisible ? 'opacity-100' : 'opacity-20'}>:</span>{s}
        </div>
      </div>

      <div className="flex-1" />

      {/* Team Info */}
      <div className="flex items-center gap-2.5 mr-6 bg-black/40 border-2 border-black rounded-lg px-3 py-1 shadow-[2px_2px_0px_0px_#000]">
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-red-500 flex-shrink-0 bg-red-600">
          <img
            src="https://images.pexels.com/photos/6985004/pexels-photo-6985004.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=1"
            alt="Team avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-left">
          <div className="text-white text-xs font-bold font-sans tracking-wide">Team Earth-1610</div>
          <div className="text-gray-400 text-[10px] font-mono italic">- We do this together.</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5 bg-[#1a1a2e] border-2 border-black rounded-lg p-1.5 shadow-[2px_2px_0px_0px_#000]">
        <button className="relative w-7 h-7 flex items-center justify-center rounded border border-transparent hover:border-black hover:bg-black/30 transition-all cursor-pointer">
          <Bell className="w-3.5 h-3.5 text-gray-400" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-600 rounded-full border border-black" />
        </button>
        <button className="w-7 h-7 flex items-center justify-center rounded border border-transparent hover:border-black hover:bg-black/30 transition-all cursor-pointer">
          <Settings className="w-3.5 h-3.5 text-gray-400" />
        </button>
        <div className="w-px h-4 bg-black/50 mx-0.5" />
        <button onClick={handleMinimize} className="w-6 h-6 flex items-center justify-center rounded border border-transparent hover:border-black hover:bg-black/30 transition-all cursor-pointer">
          <Minus className="w-3 h-3 text-gray-400" />
        </button>
        <button onClick={handleMaximize} className="w-6 h-6 flex items-center justify-center rounded border border-transparent hover:border-black hover:bg-black/30 transition-all cursor-pointer">
          <Square className="w-2.5 h-2.5 text-gray-400" />
        </button>
        <button onClick={handleClose} className="w-6 h-6 flex items-center justify-center rounded border border-transparent hover:border-black hover:bg-red-600/80 transition-all cursor-pointer">
          <X className="w-3 h-3 text-gray-400 hover:text-white" />
        </button>
      </div>
    </header>
  );
}
