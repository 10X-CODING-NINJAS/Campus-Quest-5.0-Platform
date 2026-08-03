import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Send, X } from 'lucide-react';

interface SuitTechModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending?: boolean;
  currentProblemTitle?: string;
}

export default function SuitTechModal({
  isOpen,
  onClose,
  onConfirm,
  isPending = false,
  currentProblemTitle = 'Current Mission'
}: SuitTechModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-[6px] cursor-pointer"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 10 }}
          className="relative w-full max-w-lg bg-[#0d1117] border-3 border-sky-500 p-6 shadow-[6px_6px_0_#0284c7] z-10 font-sans text-white select-none"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 border-b border-sky-500/30 pb-3 mb-4">
            <div className="w-10 h-10 bg-sky-600/20 border-2 border-sky-400 flex items-center justify-center text-sky-400">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg uppercase tracking-wider text-sky-400">
                SUIT TECH • SPIDER-COMMS
              </h2>
              <p className="font-mono text-xs text-slate-400">Tactical Assistance Relay</p>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs mb-6">
            <div className="bg-sky-950/40 border border-sky-500/40 p-3 rounded text-slate-200">
              <span className="text-sky-300 font-bold uppercase">TARGET MISSION: </span>
              <span className="font-extrabold text-white">{currentProblemTitle}</span>
            </div>

            <p className="text-slate-300 leading-relaxed">
              Request direct tactical guidance from the Spider-Vision Command Center for this mission.
            </p>

            <div className="bg-yellow-950/30 border border-yellow-500/40 p-2.5 text-yellow-300 text-[11px]">
              ⚠️ <span className="font-bold">Notice:</span> Only 1 pending assistance request is permitted at a time. Charges are deducted immediately upon dispatch.
            </div>

            {isPending && (
              <div className="bg-amber-900/60 border border-amber-500 text-amber-200 p-2.5 text-center font-bold animate-pulse">
                ⏳ A request is currently pending response from HQ.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 font-mono text-xs font-bold uppercase">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 shadow-[2px_2px_0_#000]"
            >
              Cancel
            </button>
            <button
              disabled={isPending}
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-5 py-2 flex items-center gap-2 border-2 border-black shadow-[3px_3px_0_#000] ${
                isPending
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-sky-500 hover:bg-sky-400 text-black font-extrabold active:translate-y-0.5 active:shadow-none cursor-pointer'
              }`}
            >
              <Send className="w-4 h-4" />
              {isPending ? 'Request Pending' : 'Request Assistance'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
