import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import spideySenseImg from '../../Assets/Spidey sense usage.png';

interface SpideySenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SpideySenseModal({ isOpen, onClose }: SpideySenseModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
        {/* Blurred background overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.5, rotate: 10, opacity: 0 }}
          animate={{ 
            scale: 1, 
            rotate: 0, 
            opacity: 1, 
            transition: { type: "spring", stiffness: 120, damping: 12 } 
          }}
          exit={{ scale: 0.5, rotate: -10, opacity: 0 }}
          className="relative max-w-xl w-full bg-yellow-300 border-5 border-black p-4 shadow-[8px_8px_0_0_rgba(0,0,0,1)] z-10"
        >
          {/* Halftone texture overlay */}
          <div className="absolute inset-0 comic-halftone opacity-20 pointer-events-none" />

          {/* Close button in comic style */}
          <button
            onClick={onClose}
            className="absolute -top-5 -right-5 w-10 h-10 bg-red-600 hover:bg-red-500 text-white font-black border-4 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none transition flex items-center justify-center rounded-none z-20 cursor-pointer"
            title="CLOSE"
          >
            <X className="w-6 h-6 stroke-[3.5]" />
          </button>

          {/* Title Header Badge */}
          <div className="absolute -top-6 left-6 bg-blue-600 border-4 border-black px-4 py-1.5 text-white font-display text-xl tracking-widest shadow-[4px_4px_0_0_rgba(0,0,0,1)] transform -rotate-1">
            SPIDEY SENSE ACTIVE!
          </div>

          {/* Content Area */}
          <div className="mt-4 flex flex-col items-center gap-4 relative">
            <div className="border-4 border-black bg-black overflow-hidden shadow-[4px_4px_0_0_rgba(0,0,0,1)] max-h-[70vh] flex items-center justify-center">
              <img 
                src={spideySenseImg} 
                alt="Spidey Sense Alert" 
                className="w-full h-auto object-contain select-none max-h-[60vh]"
              />
            </div>
            
            <p className="font-display text-xl text-black tracking-wide text-center leading-none mt-2">
              WARNING: NEURAL CONNECTIONS STIMULATED! USE WITH EXTREME CAUTION!
            </p>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
