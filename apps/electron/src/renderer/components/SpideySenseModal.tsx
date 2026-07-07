import { motion, AnimatePresence } from 'framer-motion';
import spideySenseImg from '../../Assets/Spidey sense usage.png';

interface SpideySenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SpideySenseModal({ isOpen, onClose }: SpideySenseModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Blurred background overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md cursor-pointer"
        />

        {/* Modal Container with original image */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          className="relative max-w-4xl w-full aspect-[1536/1024] bg-transparent flex items-center justify-center z-10"
        >
          <img 
            src={spideySenseImg} 
            alt="Spidey Sense Alert" 
            className="w-full h-full object-contain select-none"
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
