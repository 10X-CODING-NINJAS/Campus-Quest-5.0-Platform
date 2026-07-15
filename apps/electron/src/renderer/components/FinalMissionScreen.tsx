/**
 * FinalMissionScreen — rendered when hintStage >= 3 (10 problems solved)
 * This is the MISSION COMPLETE cinematic screen.
 * The actual final riddle content is a placeholder for production.
 */

import { useEffect, useState } from 'react';

interface FinalMissionScreenProps {
  onClose?: () => void;
}

export default function FinalMissionScreen({ onClose }: FinalMissionScreenProps) {
  const [phase, setPhase] = useState<'cinematic' | 'reveal' | 'riddle'>('cinematic');
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

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden"
      id="final-mission-screen"
      style={{ fontFamily: "'Courier New', monospace" }}
    >
      {/* Animated scanlines overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)',
        }}
      />

      {/* Red particle flicker */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {Array.from({ length: 24 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-red-600"
            style={{
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.6 + 0.1,
              animation: `pulse ${Math.random() * 2 + 1}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Phase: cinematic — MISSION COMPLETE banner */}
      <div
        className="z-20 text-center transition-all duration-700"
        style={{
          opacity: phase === 'cinematic' ? 1 : 0.15,
          transform: phase === 'cinematic' ? 'scale(1)' : 'scale(0.85)',
          pointerEvents: phase === 'cinematic' ? 'auto' : 'none',
        }}
      >
        <div
          className="text-red-500 text-xs tracking-[0.5em] uppercase mb-6 animate-pulse"
          style={{ letterSpacing: '0.5em' }}
        >
          ● MULTIVERSE ANCHOR LOCK CONFIRMED
        </div>
        <h1
          className="font-black uppercase text-white"
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 6rem)',
            letterSpacing: '0.08em',
            textShadow: '0 0 60px rgba(239,68,68,0.8), 0 0 120px rgba(239,68,68,0.4)',
            animation: 'pulse 2s infinite',
          }}
        >
          MISSION
          <br />
          <span style={{ color: '#ef4444' }}>COMPLETE</span>
        </h1>
        <div className="mt-8 text-zinc-400 text-sm tracking-widest uppercase animate-pulse">
          Initiating Final Protocol...
        </div>
      </div>

      {/* Phase: reveal + riddle — card */}
      <div
        className="z-20 absolute inset-0 flex items-center justify-center"
        style={{
          opacity: phase === 'riddle' ? 1 : 0,
          transform: phase === 'riddle' ? 'translateY(0)' : 'translateY(40px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
          pointerEvents: phase === 'riddle' ? 'auto' : 'none',
        }}
      >
        <div
          className="max-w-2xl w-full mx-6"
          style={{
            border: '3px solid #ef4444',
            boxShadow: '0 0 60px rgba(239,68,68,0.5), 8px 8px 0px 0px #7f1d1d',
            background: 'rgba(10,0,0,0.95)',
          }}
        >
          {/* Card header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '2px solid #7f1d1d', background: 'rgba(127,29,29,0.25)' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-red-500 text-2xl">🕷</span>
              <div>
                <div className="text-red-400 text-xs tracking-widest uppercase font-bold">
                  CLASSIFIED — LEVEL 10 CLEARANCE
                </div>
                <div className="text-white font-black text-lg tracking-wide">
                  FINAL MISSION DOSSIER
                </div>
              </div>
            </div>
            <div
              className="text-[10px] font-mono text-red-600 animate-pulse border border-red-800 px-2 py-1"
              style={{ letterSpacing: '0.1em' }}
            >
              ▶ ACTIVE
            </div>
          </div>

          {/* Card body */}
          <div className="px-6 py-8">
            {/* Status block */}
            <div
              className="flex gap-6 mb-8 text-xs font-mono"
              style={{ borderBottom: '1px solid #3f0000', paddingBottom: '1.5rem' }}
            >
              <div>
                <div className="text-zinc-500 uppercase tracking-widest mb-1">Status</div>
                <div className="text-green-400 font-bold">ALL 10 ANCHORS LOCKED</div>
              </div>
              <div>
                <div className="text-zinc-500 uppercase tracking-widest mb-1">Hint Stage</div>
                <div className="text-purple-400 font-bold">STAGE 3 — FINAL</div>
              </div>
              <div>
                <div className="text-zinc-500 uppercase tracking-widest mb-1">Map</div>
                <div className="text-yellow-400 font-bold">FULLY UNLOCKED</div>
              </div>
            </div>

            {/* The riddle placeholder */}
            <div
              className="rounded text-center py-10 px-6"
              style={{
                border: '2px dashed #7f1d1d',
                background: 'rgba(127,29,29,0.08)',
              }}
            >
              <div className="text-red-500 text-3xl mb-4">🔒</div>
              <div className="text-zinc-300 text-sm tracking-widest uppercase mb-3 font-bold">
                Final Riddle — Intel Incoming
              </div>
              <div
                className="text-zinc-500 text-base leading-loose"
                style={{ fontStyle: 'italic' }}
              >
                "The final coordinates will be revealed during the live event.
                <br />
                Your team has proven its worth.
                <br />
                Stand by for the Mission Briefing."
              </div>
              <div
                className="mt-6 inline-block text-xs font-mono tracking-widest text-red-700 animate-pulse"
                style={{ borderTop: '1px solid #7f1d1d', paddingTop: '1rem' }}
              >
                ▒▒▒ FINAL MISSION COMING SOON ▒▒▒
              </div>
            </div>

            {/* Spider-Man flavor text */}
            <div className="mt-8 text-center text-zinc-600 text-xs italic leading-relaxed">
              "With great power comes great responsibility.
              <br />
              The multiverse is counting on you."
              <br />
              <span className="text-zinc-700">— Earth-1610 Intelligence Division</span>
            </div>
          </div>

          {/* Footer */}
          {showClose && onClose && (
            <div
              className="px-6 py-4 flex justify-end"
              style={{ borderTop: '1px solid #3f0000' }}
            >
              <button
                onClick={onClose}
                className="px-6 py-2 text-xs font-bold uppercase tracking-widest text-white transition-all"
                style={{
                  background: '#7f1d1d',
                  border: '2px solid #ef4444',
                  boxShadow: '2px 2px 0px #000',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#b91c1c')}
                onMouseLeave={e => (e.currentTarget.style.background = '#7f1d1d')}
                id="final-mission-close-btn"
              >
                Return to Intel Map →
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
