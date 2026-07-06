import { useState, useEffect } from 'react';
import { Bell, Settings, Minus, Square, X, Zap, Clock } from 'lucide-react';

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
    <header className="flex items-center h-14 px-4 border-b border-spider-border bg-spider-bg-sidebar flex-shrink-0 relative z-10 select-none">
      {/* Logo */}
      <div className="flex items-center gap-2 w-60 flex-shrink-0">
        <div className="relative flex items-center justify-center w-8 h-8">
          <svg viewBox="0 0 32 32" className="w-8 h-8" fill="none">
            <circle cx="16" cy="16" r="15" fill="#cc1a1a" stroke="#ff2d2d" strokeWidth="0.5" />
            <path d="M16 4 C16 4 8 10 8 16 C8 22 16 28 16 28 C16 28 24 22 24 16 C24 10 16 4 16 4Z" fill="#080810" fillOpacity="0.6" />
            <path d="M4 16 L28 16 M12 8 L20 24 M20 8 L12 24" stroke="#ff2d2d" strokeWidth="0.8" strokeOpacity="0.6" />
            <circle cx="16" cy="16" r="3" fill="#ff2d2d" />
            <ellipse cx="13" cy="12" rx="2.5" ry="1.5" fill="white" fillOpacity="0.9" />
            <ellipse cx="19" cy="12" rx="2.5" ry="1.5" fill="white" fillOpacity="0.9" />
          </svg>
        </div>
        <div>
          <div className="text-white font-display font-bold text-sm tracking-wider leading-none">SPIDER-VERSE</div>
          <div className="text-spider-text-muted text-xs tracking-widest">CODEATHON</div>
        </div>
      </div>

      {/* Timer */}
      <div className="flex items-center gap-2 bg-spider-bg-panel border border-spider-border rounded-lg px-3 py-1.5 timer">
        <Clock className="w-3.5 h-3.5 text-spider-red" />
        <div className="font-mono text-white font-bold text-sm tracking-widest">
          {h}<span className={colonVisible ? 'opacity-100' : 'opacity-20'}>:</span>{m}<span className={colonVisible ? 'opacity-100' : 'opacity-20'}>:</span>{s}
        </div>
      </div>

      {/* Team Info */}
      <div className="flex items-center gap-2 ml-4">
        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-spider-red flex-shrink-0">
          <img
            src="https://images.pexels.com/photos/6985004/pexels-photo-6985004.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=1"
            alt="Team avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <div className="text-white text-xs font-semibold font-display tracking-wide">Team Earth-1610</div>
          <div className="text-spider-text-dim text-xs">We do this together.</div>
        </div>
      </div>

      <div className="flex-1" />

      {/* Spider Sense */}
      <div className="flex items-center gap-3 mr-4">
        <div className="flex items-center gap-2 bg-spider-bg-panel border border-spider-border rounded-lg px-3 py-1.5">
          <div className="relative">
            <svg viewBox="0 0 20 20" className="w-4 h-4 text-spider-red fill-current">
              <circle cx="10" cy="10" r="9" fill="#cc1a1a" />
              <path d="M10 2 L10 18 M2 10 L18 10 M4.5 4.5 L15.5 15.5 M15.5 4.5 L4.5 15.5" stroke="#ff000030" strokeWidth="0.8" />
              <circle cx="10" cy="10" r="3" fill="#ff2d2d" />
            </svg>
          </div>
          <div className="text-right">
            <div className="text-white font-bold text-sm leading-none">3</div>
            <div className="text-spider-text-dim text-xs">Uses Left</div>
          </div>
        </div>

        <button className="spider-sense-btn flex items-center gap-2 px-3 py-1.5 rounded-lg text-spider-red text-sm font-semibold font-display tracking-wide transition-all hover:text-white cursor-pointer">
          <Zap className="w-3.5 h-3.5" />
          Use Spider Sense
        </button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button className="relative w-8 h-8 flex items-center justify-center rounded-md hover:bg-spider-bg-hover transition-colors cursor-pointer">
          <Bell className="w-4 h-4 text-spider-text-dim" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-spider-red rounded-full" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-spider-bg-hover transition-colors cursor-pointer">
          <Settings className="w-4 h-4 text-spider-text-dim" />
        </button>
        <div className="w-px h-5 bg-spider-border mx-1" />
        <button onClick={handleMinimize} className="w-6 h-6 flex items-center justify-center rounded hover:bg-spider-bg-hover transition-colors cursor-pointer">
          <Minus className="w-3 h-3 text-spider-text-dim" />
        </button>
        <button onClick={handleMaximize} className="w-6 h-6 flex items-center justify-center rounded hover:bg-spider-bg-hover transition-colors cursor-pointer">
          <Square className="w-3 h-3 text-spider-text-dim" />
        </button>
        <button onClick={handleClose} className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-900 transition-colors cursor-pointer">
          <X className="w-3 h-3 text-spider-text-dim" />
        </button>
      </div>
    </header>
  );
}
