import { motion, AnimatePresence } from "framer-motion";
import { Trophy, ShieldAlert, X } from "lucide-react";

interface ComicModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: "ACCEPTED" | "FAILED" | "COMPILE_ERROR" | "IDLE";
  passedCount: number;
  totalCount: number;
  runtimeMs: number;
  memoryMb: number;
  message?: string;
}

export default function ComicModal({
  isOpen,
  onClose,
  status,
  passedCount,
  totalCount,
  runtimeMs,
  memoryMb,
  message
}: ComicModalProps) {
  if (!isOpen || status === "IDLE") return null;

  const isAccepted = status === "ACCEPTED";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Animated Background Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm cursor-pointer"
        />

        {/* Comic Panel Container */}
        <motion.div
          initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1, transition: { type: "spring", stiffness: 120, damping: 10 } }}
          exit={{ scale: 0.5, rotate: 10, opacity: 0 }}
          className="relative max-w-lg w-full bg-white border-5 border-black p-6 rounded-2xl shadow-[8px_8px_0_0_rgba(0,0,0,1)] select-none z-10"
        >
          {/* Halftone BG Pattern */}
          <div 
            className="absolute inset-0 opacity-10 rounded-2xl pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, #000 2px, transparent 2px)",
              backgroundSize: "8px 8px"
            }}
          />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-black text-white hover:bg-zinc-800 border-2 border-black rounded-lg transition active:translate-y-0.5 z-20"
          >
            <X className="w-4 h-4" />
          </button>

          {isAccepted ? (
            /* SUCCESS BURST PANEL */
            <div className="text-center relative">
              {/* Explosion Starburst Shape */}
              <div className="relative h-44 flex items-center justify-center mb-3">
                <svg className="absolute w-64 h-64 text-yellow-300 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]" viewBox="0 0 100 100">
                  <polygon points="50,0 60,35 95,20 70,50 100,70 65,70 75,100 50,80 25,100 35,70 0,70 30,50 5,20 40,35" fill="currentColor" stroke="#000" strokeWidth="2" />
                </svg>
                
                {/* Comic Splash Word */}
                <motion.div 
                  initial={{ scale: 0.2 }}
                  animate={{ scale: [1, 1.2, 1], rotate: [-5, 5, -3] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                  className="relative flex flex-col items-center justify-center z-10"
                >
                  <span className="font-comic text-7xl uppercase italic tracking-wider text-red-600 stroke-black drop-shadow-[3px_3px_0_rgba(0,0,0,1)] comic-title">
                    POW!
                  </span>
                  <span className="font-comic text-4xl uppercase tracking-widest text-green-700 stroke-white drop-shadow-[2px_2px_0_rgba(0,0,0,1)] bg-yellow-100 border-3 border-black py-1 px-4 rounded transform rotate-3 -mt-1 flex items-center gap-1.5 shadow-[2px_2px_0_rgba(0,0,0,1)] comic-title">
                    ACCEPTED ✓
                  </span>
                </motion.div>
              </div>

              {/* Stats Block - Exact Copy from Visual */}
              <div className="bg-yellow-100 border-3 border-black rounded-xl p-3.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] transform -rotate-1 relative z-10 mb-4">
                <h4 className="font-sans font-black text-sm uppercase text-black mb-1.5 flex items-center justify-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500 animate-bounce" />
                  Dimension Connected!
                </h4>
                <div className="font-mono text-xs text-zinc-900 space-y-1">
                  <div className="font-extrabold text-green-700">✓ {passedCount}/{totalCount} Test Cases Passed</div>
                  <div className="text-zinc-600 font-semibold">
                    Runtime: <span className="text-black font-black">{runtimeMs}ms</span>
                  </div>
                  <div className="text-zinc-600 font-semibold">
                    Memory: <span className="text-black font-black">{memoryMb}MB</span>
                  </div>
                </div>
              </div>

              <p className="font-mono text-xs text-zinc-700 font-bold mb-2 text-center">
                🕸️ Thwip! Miles' neural networks have synchronized with the Multiverse anchors!
              </p>
            </div>
          ) : (
            /* CRASH / FAIL BURST PANEL */
            <div className="text-center relative">
              <div className="relative h-44 flex items-center justify-center mb-3">
                {/* Purple / dark blast */}
                <svg className="absolute w-64 h-64 text-zinc-800 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]" viewBox="0 0 100 100">
                  <polygon points="50,0 58,30 90,15 68,48 98,68 62,68 70,98 50,78 30,98 38,68 2,68 32,48 10,15 42,30" fill="currentColor" stroke="#000" strokeWidth="2.5" />
                </svg>

                <motion.div 
                  initial={{ scale: 0.2 }}
                  animate={{ scale: [1, 1.15, 1], rotate: [3, -3, 3] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                  className="relative flex flex-col items-center justify-center z-10"
                >
                  <span className="font-comic text-7xl uppercase italic tracking-wider text-yellow-300 stroke-black drop-shadow-[3px_3px_0_rgba(0,0,0,1)] comic-title">
                    CRASH!
                  </span>
                  <span className="font-comic text-3xl uppercase tracking-widest text-red-500 stroke-white drop-shadow-[2px_2px_0_rgba(0,0,0,1)] bg-zinc-900 border-3 border-black py-1 px-4 rounded transform -rotate-2 -mt-1 flex items-center gap-1.5 shadow-[2px_2px_0_rgba(0,0,0,1)] comic-title">
                    FAILED ✗
                  </span>
                </motion.div>
              </div>

              <div className="bg-red-50 border-3 border-black rounded-xl p-3.5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] transform rotate-1 relative z-10 mb-4 text-left">
                <h4 className="font-sans font-black text-sm uppercase text-red-600 mb-1.5 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-600 animate-bounce" />
                  Dimension Anomaly Detected
                </h4>
                <div className="font-mono text-xs text-zinc-800 space-y-1">
                  <div className="font-extrabold text-red-600">✗ Only {passedCount}/{totalCount} Cases Validated</div>
                  {message && (
                    <div className="bg-white border border-red-300 p-2 rounded text-[10px] text-red-800 whitespace-pre-wrap leading-tight mt-2 max-h-20 overflow-y-auto">
                      {message}
                    </div>
                  )}
                </div>
              </div>

              <p className="font-mono text-xs text-zinc-700 font-bold mb-2 text-center">
                ⚡ Use your Spider-Sense or refill Web-Fluid to debug the synchronization anomaly!
              </p>
            </div>
          )}

          <div className="flex gap-2.5 justify-center relative z-10 mt-4">
            <button
              onClick={onClose}
              className="bg-zinc-950 text-white hover:bg-zinc-800 font-sans font-black tracking-wide text-xs uppercase border-3 border-black rounded-lg py-2 px-5 shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition cursor-pointer"
            >
              Back to Terminal
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
