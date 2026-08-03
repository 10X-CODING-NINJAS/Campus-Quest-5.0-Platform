import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * FinalMissionScreen — rendered when hintStage >= 3 (10 problems solved)
 * This is the MISSION COMPLETE cinematic screen.
 * The actual final riddle content is a placeholder for production.
 */
import { useEffect, useState } from 'react';
export default function FinalMissionScreen({ onClose }) {
    const [phase, setPhase] = useState('cinematic');
    const [showClose, setShowClose] = useState(false);
    useEffect(() => {
        // Phase 1: cinematic banner for 2s
        const t1 = setTimeout(() => setPhase('reveal'), 2000);
        // Phase 2: reveal card slides in at 4s
        const t2 = setTimeout(() => setPhase('riddle'), 4200);
        // Show close button after 5s
        const t3 = setTimeout(() => setShowClose(true), 5000);
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden", id: "final-mission-screen", style: { fontFamily: "'Courier New', monospace" }, children: [_jsx("div", { className: "pointer-events-none absolute inset-0 z-10", style: {
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)',
                } }), _jsx("div", { className: "pointer-events-none absolute inset-0 z-0 overflow-hidden", children: Array.from({ length: 24 }).map((_, i) => (_jsx("div", { className: "absolute rounded-full bg-red-600", style: {
                        width: `${Math.random() * 4 + 1}px`,
                        height: `${Math.random() * 4 + 1}px`,
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        opacity: Math.random() * 0.6 + 0.1,
                        animation: `pulse ${Math.random() * 2 + 1}s infinite alternate`,
                    } }, i))) }), _jsxs("div", { className: "z-20 text-center transition-all duration-700", style: {
                    opacity: phase === 'cinematic' ? 1 : 0.15,
                    transform: phase === 'cinematic' ? 'scale(1)' : 'scale(0.85)',
                    pointerEvents: phase === 'cinematic' ? 'auto' : 'none',
                }, children: [_jsx("div", { className: "text-red-500 text-xs tracking-[0.5em] uppercase mb-6 animate-pulse", style: { letterSpacing: '0.5em' }, children: "\u25CF MULTIVERSE ANCHOR LOCK CONFIRMED" }), _jsxs("h1", { className: "font-black uppercase text-white", style: {
                            fontSize: 'clamp(2.5rem, 8vw, 6rem)',
                            letterSpacing: '0.08em',
                            textShadow: '0 0 60px rgba(239,68,68,0.8), 0 0 120px rgba(239,68,68,0.4)',
                            animation: 'pulse 2s infinite',
                        }, children: ["MISSION", _jsx("br", {}), _jsx("span", { style: { color: '#ef4444' }, children: "COMPLETE" })] }), _jsx("div", { className: "mt-8 text-zinc-400 text-sm tracking-widest uppercase animate-pulse", children: "Initiating Final Protocol..." })] }), _jsx("div", { className: "z-20 absolute inset-0 flex items-center justify-center", style: {
                    opacity: phase === 'riddle' ? 1 : 0,
                    transform: phase === 'riddle' ? 'translateY(0)' : 'translateY(40px)',
                    transition: 'opacity 0.7s ease, transform 0.7s ease',
                    pointerEvents: phase === 'riddle' ? 'auto' : 'none',
                }, children: _jsxs("div", { className: "max-w-2xl w-full mx-6", style: {
                        border: '3px solid #ef4444',
                        boxShadow: '0 0 60px rgba(239,68,68,0.5), 8px 8px 0px 0px #7f1d1d',
                        background: 'rgba(10,0,0,0.95)',
                    }, children: [_jsxs("div", { className: "flex items-center justify-between px-6 py-4", style: { borderBottom: '2px solid #7f1d1d', background: 'rgba(127,29,29,0.25)' }, children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-red-500 text-2xl", children: "\uD83D\uDD77" }), _jsxs("div", { children: [_jsx("div", { className: "text-red-400 text-xs tracking-widest uppercase font-bold", children: "CLASSIFIED \u2014 LEVEL 10 CLEARANCE" }), _jsx("div", { className: "text-white font-black text-lg tracking-wide", children: "FINAL MISSION DOSSIER" })] })] }), _jsx("div", { className: "text-[10px] font-mono text-red-600 animate-pulse border border-red-800 px-2 py-1", style: { letterSpacing: '0.1em' }, children: "\u25B6 ACTIVE" })] }), _jsxs("div", { className: "px-6 py-8", children: [_jsxs("div", { className: "flex gap-6 mb-8 text-xs font-mono", style: { borderBottom: '1px solid #3f0000', paddingBottom: '1.5rem' }, children: [_jsxs("div", { children: [_jsx("div", { className: "text-zinc-500 uppercase tracking-widest mb-1", children: "Status" }), _jsx("div", { className: "text-green-400 font-bold", children: "ALL 10 ANCHORS LOCKED" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-zinc-500 uppercase tracking-widest mb-1", children: "Hint Stage" }), _jsx("div", { className: "text-purple-400 font-bold", children: "STAGE 3 \u2014 FINAL" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-zinc-500 uppercase tracking-widest mb-1", children: "Map" }), _jsx("div", { className: "text-yellow-400 font-bold", children: "FULLY UNLOCKED" })] })] }), _jsxs("div", { className: "rounded text-center py-10 px-6", style: {
                                        border: '2px dashed #7f1d1d',
                                        background: 'rgba(127,29,29,0.08)',
                                    }, children: [_jsx("div", { className: "text-red-500 text-3xl mb-4", children: "\uD83D\uDD12" }), _jsx("div", { className: "text-zinc-300 text-sm tracking-widest uppercase mb-3 font-bold", children: "Final Riddle \u2014 Intel Incoming" }), _jsxs("div", { className: "text-zinc-500 text-base leading-loose", style: { fontStyle: 'italic' }, children: ["\"The final coordinates will be revealed during the live event.", _jsx("br", {}), "Your team has proven its worth.", _jsx("br", {}), "Stand by for the Mission Briefing.\""] }), _jsx("div", { className: "mt-6 inline-block text-xs font-mono tracking-widest text-red-700 animate-pulse", style: { borderTop: '1px solid #7f1d1d', paddingTop: '1rem' }, children: "\u2592\u2592\u2592 FINAL MISSION COMING SOON \u2592\u2592\u2592" })] }), _jsxs("div", { className: "mt-8 text-center text-zinc-600 text-xs italic leading-relaxed", children: ["\"With great power comes great responsibility.", _jsx("br", {}), "The multiverse is counting on you.\"", _jsx("br", {}), _jsx("span", { className: "text-zinc-700", children: "\u2014 Earth-1610 Intelligence Division" })] })] }), showClose && onClose && (_jsx("div", { className: "px-6 py-4 flex justify-end", style: { borderTop: '1px solid #3f0000' }, children: _jsx("button", { onClick: onClose, className: "px-6 py-2 text-xs font-bold uppercase tracking-widest text-white transition-all", style: {
                                    background: '#7f1d1d',
                                    border: '2px solid #ef4444',
                                    boxShadow: '2px 2px 0px #000',
                                }, onMouseEnter: e => (e.currentTarget.style.background = '#b91c1c'), onMouseLeave: e => (e.currentTarget.style.background = '#7f1d1d'), id: "final-mission-close-btn", children: "Return to Intel Map \u2192" }) }))] }) }), _jsx("style", { children: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      ` })] }));
}
//# sourceMappingURL=FinalMissionScreen.js.map