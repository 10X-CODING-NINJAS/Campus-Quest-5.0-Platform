import { motion, AnimatePresence } from 'framer-motion';
import { Radio, CheckCircle, UserCheck } from 'lucide-react';

interface SpiderCommsNotificationProps {
  isOpen: boolean;
  hintData: {
    hint: string;
    answeredBy?: string;
    answeredAt?: string;
    problemId?: string;
  } | null;
  onClose: () => void;
}

export default function SpiderCommsNotification({
  isOpen,
  hintData,
  onClose,
}: SpiderCommsNotificationProps) {
  if (!isOpen || !hintData) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-[8px] cursor-pointer"
        />

        {/* Cinematic Card Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotate: -2 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.8, opacity: 0, rotate: 2 }}
          className="relative w-full max-w-xl bg-slate-950 border-4 border-yellow-400 p-6 shadow-[8px_8px_0_#eab308] z-10 font-sans text-white select-none"
        >
          {/* Top Banner */}
          <div className="flex items-center justify-between border-b-2 border-yellow-400/40 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-yellow-400 text-black flex items-center justify-center font-black rounded-none shadow-[2px_2px_0_#000]">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="font-display font-black text-xl text-yellow-400 tracking-widest uppercase">
                  📡 SPIDER-COMMS
                </h2>
                <p className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                  Incoming Tactical Intel
                </p>
              </div>
            </div>

            <div className="bg-yellow-950/60 border border-yellow-500/50 px-2.5 py-1 font-mono text-[10px] text-yellow-400 font-bold uppercase">
              TRANSMISSION RECEIVED
            </div>
          </div>

          {/* Body Intel Box */}
          <div className="bg-slate-900 border-2 border-slate-700 p-4 mb-5 shadow-[3px_3px_0_#000]">
            <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 border-b border-slate-800 pb-2 mb-3">
              <span className="flex items-center gap-1.5 text-purple-400 font-bold">
                <UserCheck className="w-3.5 h-3.5" />
                OFFICER: {hintData.answeredBy || 'HQ Command'}
              </span>
              <span>{hintData.answeredAt ? new Date(hintData.answeredAt).toLocaleTimeString() : 'Just now'}</span>
            </div>

            <p className="font-mono text-sm text-yellow-200 font-bold leading-relaxed whitespace-pre-wrap">
              "{hintData.hint}"
            </p>
          </div>

          {/* Bottom Action Button */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-mono text-xs font-black uppercase border-2 border-black shadow-[3px_3px_0_#000] active:translate-y-0.5 active:shadow-none cursor-pointer flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Acknowledge Intel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
