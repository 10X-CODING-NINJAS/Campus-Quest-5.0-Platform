import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Bell, Settings, Minus, Square, X } from 'lucide-react';
import spiderLogo from '../../Assets/SpiderLogo.jpg';
export default function TopBar({ isPaused = false, isLobby = false, solidBg = false, teamName = 'Team Earth-1610', onTeamNameChange, currentScreen = 'coding', onNavigate, hintStage = 0, contestEndsAt = null, }) {
    // True when running inside the Electron desktop app; false in a plain browser.
    const isElectron = !!window.electronAPI;
    // CRITICAL-4: Derive remaining seconds from server end time
    const computeRemaining = () => {
        if (!contestEndsAt)
            return 0;
        return Math.max(0, Math.floor((new Date(contestEndsAt).getTime() - Date.now()) / 1000));
    };
    const [seconds, setSeconds] = useState(computeRemaining);
    const [colonVisible, setColonVisible] = useState(true);
    // Recompute remaining time whenever contestEndsAt changes (start, resume, reconnect)
    useEffect(() => {
        setSeconds(computeRemaining());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contestEndsAt]);
    // Tick down every second, stops when paused or at 0
    useEffect(() => {
        if (isPaused || seconds <= 0)
            return;
        const interval = setInterval(() => {
            setSeconds(s => Math.max(0, s - 1));
        }, 1000);
        return () => clearInterval(interval);
    }, [isPaused, seconds > 0]);
    useEffect(() => {
        const blink = setInterval(() => setColonVisible(v => !v), 500);
        return () => clearInterval(blink);
    }, []);
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    const handleMinimize = () => {
        if (window.electronAPI) {
            window.electronAPI.minimize();
        }
    };
    const handleMaximize = () => {
        if (window.electronAPI) {
            window.electronAPI.maximize();
        }
    };
    const handleClose = () => {
        if (window.electronAPI) {
            window.electronAPI.close();
        }
    };
    return (_jsxs("header", { className: `flex items-center ${isLobby ? 'h-20 bg-black' : `h-16 ${solidBg ? 'bg-[#0d0d1e]' : 'bg-[#0d0d1e]/30 backdrop-blur-md'}`} px-4 border-b-4 border-black flex-shrink-0 relative z-10 select-none comic-halftone`, children: [_jsxs("div", { className: "flex items-center gap-2.5 flex-shrink-0", children: [_jsx("div", { className: "relative flex items-center justify-center w-10 h-10 border-2 border-black rounded-full overflow-hidden shadow-[2px_2px_0px_0px_#000]", children: _jsx("img", { src: spiderLogo, alt: "Spider Logo", className: "w-full h-full object-cover" }) }), _jsxs("div", { children: [_jsx("div", { className: "text-white comic-title text-xl tracking-wide leading-none text-red-500", style: { WebkitTextStroke: '0.5px black' }, children: "SPIDER-VERSE: FRAGMENT HUNT" }), _jsx("div", { className: "text-gray-400 font-mono text-[10px] uppercase tracking-wider mt-0.5", children: "4. CORE MISSION TERMINAL" })] })] }), !isLobby && onNavigate && (_jsxs("div", { className: "flex items-center gap-2 border-2 border-black bg-black/40 rounded-lg p-1 ml-6 shadow-[2px_2px_0px_#000]", children: [_jsx("button", { onClick: () => onNavigate('coding'), className: `px-3 py-1.5 text-xs font-bold font-mono border-2 border-black rounded transition-all shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none ${currentScreen === 'coding'
                            ? 'bg-yellow-400 text-black'
                            : 'bg-zinc-800 text-zinc-300 hover:text-white'}`, children: "CODING" }), _jsxs("button", { onClick: () => onNavigate('hints'), className: `px-3 py-1.5 text-xs font-bold font-mono border-2 border-black rounded transition-all shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none flex items-center gap-1 ${currentScreen === 'hints'
                            ? 'bg-yellow-400 text-black'
                            : 'bg-zinc-800 text-zinc-300 hover:text-white'}`, children: [hintStage === 0 && _jsx("span", { className: "text-[10px]", children: "\uD83D\uDD12" }), "HINTS MAP"] })] })), _jsx("div", { className: "flex-1" }), !isLobby && (_jsxs("div", { className: "absolute left-1/2 transform -translate-x-1/2 top-0 flex flex-col items-center bg-[#05050a] border-x-4 border-b-4 border-black px-8 py-1.5 shadow-[0px_4px_0px_0px_rgba(0,0,0,0.15)] rounded-b-xl z-20", children: [_jsx("span", { className: "text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mb-0.5", children: "MISSION TIME" }), _jsxs("div", { className: "font-digital text-red-500 font-bold text-2xl tracking-widest leading-none drop-shadow-[0_0_8px_#ef4444]", children: [h, _jsx("span", { className: colonVisible ? 'opacity-100' : 'opacity-20', children: ":" }), m, _jsx("span", { className: colonVisible ? 'opacity-100' : 'opacity-20', children: ":" }), s] })] })), _jsx("div", { className: "flex-1" }), _jsxs("div", { className: "flex items-center gap-2 mr-3 bg-black/40 border-2 border-black rounded-lg px-2 py-1 shadow-[2px_2px_0px_0px_#000]", children: [_jsx("div", { className: "w-8 h-8 rounded-full overflow-hidden border-2 border-red-500 flex-shrink-0 bg-red-600", children: _jsx("img", { src: spiderLogo, alt: "Team avatar", className: "w-full h-full object-cover" }) }), _jsxs("div", { className: "text-left hidden lg:block", children: [isLobby ? (_jsx("input", { type: "text", value: teamName, onChange: (e) => onTeamNameChange?.(e.target.value), className: "bg-transparent border-b border-dashed border-red-500 text-white text-xs font-bold font-sans tracking-wide focus:outline-none focus:border-solid w-32" })) : (_jsx("div", { className: "text-white text-xs font-bold font-sans tracking-wide whitespace-nowrap", children: teamName })), _jsx("div", { className: "text-gray-400 text-[10px] font-mono italic whitespace-nowrap", children: "- We do this together." })] })] }), _jsx("div", { className: "flex-1 flex justify-center", children: _jsx("h1", { className: "text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 tracking-widest comic-title uppercase transform -skew-x-6 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]", children: "MISSION CONTROL" }) }), _jsxs("div", { className: "flex items-center gap-1.5 bg-[#1a1a2e] border-2 border-black rounded-lg p-1.5 shadow-[2px_2px_0px_0px_#000]", children: [_jsxs("button", { className: "relative w-7 h-7 flex items-center justify-center rounded border border-transparent hover:border-black hover:bg-black/30 transition-all cursor-pointer", children: [_jsx(Bell, { className: "w-3.5 h-3.5 text-gray-400" }), _jsx("span", { className: "absolute top-1 right-1 w-1.5 h-1.5 bg-red-600 rounded-full border border-black" })] }), _jsx("button", { className: "w-7 h-7 flex items-center justify-center rounded border border-transparent hover:border-black hover:bg-black/30 transition-all cursor-pointer", children: _jsx(Settings, { className: "w-3.5 h-3.5 text-gray-400" }) }), isElectron && (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-px h-4 bg-black/50 mx-0.5" }), _jsx("button", { onClick: handleMinimize, className: "w-6 h-6 flex items-center justify-center rounded border border-transparent hover:border-black hover:bg-black/30 transition-all cursor-pointer", children: _jsx(Minus, { className: "w-3 h-3 text-gray-400" }) }), _jsx("button", { onClick: handleMaximize, className: "w-6 h-6 flex items-center justify-center rounded border border-transparent hover:border-black hover:bg-black/30 transition-all cursor-pointer", children: _jsx(Square, { className: "w-2.5 h-2.5 text-gray-400" }) }), _jsx("button", { onClick: handleClose, className: "w-6 h-6 flex items-center justify-center rounded border border-transparent hover:border-black hover:bg-red-600/80 transition-all cursor-pointer", children: _jsx(X, { className: "w-3 h-3 text-gray-400 hover:text-white" }) })] }))] })] }));
}
//# sourceMappingURL=TopBar.js.map