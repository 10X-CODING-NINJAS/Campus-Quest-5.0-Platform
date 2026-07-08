import { useState, useEffect } from 'react';
import { Bell, Settings, Minus, Square, X, Play, Pause } from 'lucide-react';
import spiderLogo from '../../Assets/SpiderLogo.jpg';

export default function TopBar({ isPaused = false }: { isPaused?: boolean }) {
  const [seconds, setSeconds] = useState(77 * 60 + 42);
  const [colonVisible, setColonVisible] = useState(true);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    let interval: any;
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setSeconds(s => (s > 0 ? s - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, isPaused]);

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
    <header className={`flex items-center ${isLobby ? 'h-20 bg-black' : `h-16 ${solidBg ? 'bg-[#0d0d1e]' : 'bg-[#0d0d1e]/30 backdrop-blur-md'}`} px-4 border-b-4 border-black flex-shrink-0 relative z-10 select-none comic-halftone`}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="relative flex items-center justify-center w-10 h-10 border-2 border-black rounded-full overflow-hidden shadow-[2px_2px_0px_0px_#000]">
          <img src={spiderLogo} alt="Spider Logo" className="w-full h-full object-cover" />
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
      {!isLobby && (
        <div className="absolute left-1/2 transform -translate-x-1/2 top-0 flex flex-col items-center bg-[#05050a] border-x-4 border-b-4 border-black px-8 py-1.5 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.15)] rounded-b-xl z-20">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-0.5">MISSION TIME</span>
          <div className="font-digital text-red-500 font-bold text-2xl tracking-widest leading-none drop-shadow-[0_0_8px_#ef4444]">
            {h}<span className={colonVisible ? 'opacity-100' : 'opacity-20'}>:</span>{m}<span className={colonVisible ? 'opacity-100' : 'opacity-20'}>:</span>{s}
          </div>
        </div>
      )}

      <div className="flex-1" />

      {/* Team Info */}
      <div className="flex items-center gap-2 mr-3 bg-black/40 border-2 border-black rounded-lg px-2 py-1 shadow-[2px_2px_0px_0px_#000]">
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-red-500 flex-shrink-0 bg-red-600">
          <img
            src={spiderLogo}
            alt="Team avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-left hidden lg:block">
          <div className="text-white text-xs font-bold font-sans tracking-wide whitespace-nowrap">Team Earth-1610</div>
          <div className="text-gray-400 text-[10px] font-mono italic whitespace-nowrap">- We do this together.</div>
        </div>
      </div>

      {/* Mission Control Title */}
      <div className="flex-1 flex justify-center">
        <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 tracking-widest comic-title uppercase transform -skew-x-6 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
          MISSION CONTROL
        </h1>
      </div>

      {/* Submit Test Button */}
      <button 
        onClick={() => {
          if (window.confirm("Are you sure you want to submit the test? This action cannot be undone.")) {
            alert("Test submitted successfully!");
            if ((window as any).electronAPI) {
              (window as any).electronAPI.close();
            }
          }
        }}
        className="mr-3 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-[0px_0px_0px_0px_#000] transition-all comic-halftone whitespace-nowrap text-sm"
      >
        SUBMIT TEST
      </button>

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
