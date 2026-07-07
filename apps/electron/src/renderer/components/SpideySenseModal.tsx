import { motion, AnimatePresence } from 'framer-motion';
import spideySenseBase from '../../Assets/SpideySenseBase.png';
import spideySenseUsage from '../../Assets/Spidey sense usage.png';

interface SpideySenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SpideySenseModal({ isOpen, onClose }: SpideySenseModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* CSS for highly erratic shaking effect */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes erratic-shake-extreme {
            0% { transform: translate(0, 0) rotate(0deg); }
            10% { transform: translate(-7px, 5px) rotate(-2deg); }
            20% { transform: translate(6px, -7px) rotate(3deg); }
            30% { transform: translate(-3px, -5px) rotate(-1.5deg); }
            40% { transform: translate(7px, 3px) rotate(2deg); }
            50% { transform: translate(-5px, 7px) rotate(-3.5deg); }
            60% { transform: translate(4px, -3px) rotate(1.5deg); }
            70% { transform: translate(-7px, -5px) rotate(3deg); }
            80% { transform: translate(6px, 7px) rotate(-2deg); }
            90% { transform: translate(-3px, 3px) rotate(1.5deg); }
            100% { transform: translate(0, 0) rotate(0deg); }
          }
          .animate-erratic-shake-extreme {
            animation: erratic-shake-extreme 0.08s infinite;
          }
        `}} />

        {/* Less intense blurred background overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-[6px] cursor-pointer"
        />

        {/* Modal Container - Zoomed in further (w-[92vw] max-w-[1150px]) to occupy more space overall */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative w-[92vw] max-w-[1150px] aspect-[1536/1024] bg-transparent z-10"
        >
          {/* Base image (TINGLING ALERT) shaking erratically - scaled/zoomed */}
          <div className="absolute inset-0 animate-erratic-shake-extreme pointer-events-none">
            <img 
              src={spideySenseBase} 
              alt="Spidey Sense Base" 
              className="w-full h-full object-contain select-none"
            />
          </div>

          {/* Usage image (TEXT AND BUTTONS) layered statically on top */}
          <div className="absolute inset-0 pointer-events-none">
            <img 
              src={spideySenseUsage} 
              alt="Spidey Sense Usage" 
              className="w-full h-full object-contain select-none"
            />
          </div>

          {/* Overlapping interactive buttons for Cancel and Use - completely transparent */}
          {/* CANCEL BUTTON */}
          <button
            onClick={onClose}
            type="button"
            className="absolute left-[33.5%] bottom-[12%] w-[14%] h-[9%] rounded-xl cursor-pointer bg-transparent border-0 outline-none hover:bg-white/5 active:bg-white/10 transition-all z-30"
            title="CANCEL"
          />

          {/* USE BUTTON */}
          <button
            onClick={() => {
              alert("SPIDEY SENSE DEPLOYED!");
              onClose();
            }}
            type="button"
            className="absolute right-[33.5%] bottom-[12%] w-[14%] h-[9%] rounded-xl cursor-pointer bg-transparent border-0 outline-none hover:bg-white/5 active:bg-white/10 transition-all z-30"
            title="USE SPIDEY SENSE"
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
