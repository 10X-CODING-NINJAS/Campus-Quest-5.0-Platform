import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../lib/socket';
import spideySenseBase from '../../Assets/SpideySenseBase.png';
import spideySenseUsage from '../../Assets/Spidey sense usage.png';

interface SpideySenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  problemId?: string;
  onUseSuccess?: (() => void) | undefined;
}

interface QuestionData {
  id: number;
  question: string;
  options: string[];
}

export default function SpideySenseModal({ isOpen, onClose, problemId, onUseSuccess }: SpideySenseModalProps) {
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  
  // Feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(false);
  const [syncFailed, setSyncFailed] = useState(false);

  // 1. Listen for secure backend verification events
  useEffect(() => {
    if (!isOpen) return;

    const handleChallengeInit = (data: { challengeId: string; questions: QuestionData[] }) => {
      setChallengeId(data.challengeId);
      setQuestions(data.questions);
      setCurrentIdx(0);
      setSelectedOption(null);
      setShowFeedback(false);
      setSyncFailed(false);
    };

    const handleChallengeResult = (data: { questionId: number; success: boolean; nextIndex: number; isCompleted: boolean }) => {
      setIsAnswerCorrect(data.success);
      setShowFeedback(true);

      if (!data.success) {
        // Incorrect answer triggers full sync failure feedback
        setSyncFailed(true);
      }
    };

    const handlePowerupError = (err: { message: string }) => {
      alert(`SPIDEY-SENSE ERROR: ${err.message}`);
      onClose();
    };

    socket.on('powerup:spider_sense_challenge', handleChallengeInit);
    socket.on('powerup:spider_sense_result', handleChallengeResult);
    socket.on('powerup:error', handlePowerupError);

    return () => {
      socket.off('powerup:spider_sense_challenge', handleChallengeInit);
      socket.off('powerup:spider_sense_result', handleChallengeResult);
      socket.off('powerup:error', handlePowerupError);
    };
  }, [isOpen, onClose]);

  // 2. Initial trigger to request challenge from backend
  const handleInitiateChallenge = () => {
    if (!problemId) return;
    socket.emit('powerup:spider_sense_init', { problemId });
  };

  const handleOptionSelect = (index: number) => {
    if (showFeedback) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !challengeId || questions.length === 0) return;
    const currentQ = questions[currentIdx];
    const selectedAnswerText = currentQ.options[selectedOption];

    // Emit answer to backend for secure verification
    socket.emit('powerup:spider_sense_submit', {
      challengeId,
      questionId: currentQ.id,
      selectedAnswer: selectedAnswerText
    });
  };

  const handleNextStep = () => {
    setShowFeedback(false);
    setSelectedOption(null);

    if (syncFailed) {
      // Neural sync failed, restart the challenge from index 0
      setCurrentIdx(0);
      setSyncFailed(false);
    } else {
      // Correct answer, progress to next question
      const nextIndex = currentIdx + 1;
      if (nextIndex < questions.length) {
        setCurrentIdx(nextIndex);
      } else {
        // All 3 answered correctly! Send final authorization request to consume charge & bypass
        if (challengeId) {
          socket.emit('powerup:spider_sense_confirm', { challengeId });
          onUseSuccess?.();
          onClose();
        }
      }
    }
  };

  if (!isOpen) return null;

  const currentQ = questions[currentIdx];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* CSS for the erratic shaking effect */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes erratic-shake-extreme {
            0% { transform: translate(0, 0) scale(1.15) rotate(0deg); }
            10% { transform: translate(-7px, 5px) scale(1.15) rotate(-2deg); }
            20% { transform: translate(6px, -7px) scale(1.15) rotate(3deg); }
            30% { transform: translate(-3px, -5px) scale(1.15) rotate(-1.5deg); }
            40% { transform: translate(7px, 3px) scale(1.15) rotate(2deg); }
            50% { transform: translate(-5px, 7px) scale(1.15) rotate(-3.5deg); }
            60% { transform: translate(4px, -3px) scale(1.15) rotate(1.5deg); }
            70% { transform: translate(-7px, -5px) scale(1.15) rotate(3deg); }
            80% { transform: translate(6px, 7px) scale(1.15) rotate(-2deg); }
            90% { transform: translate(-3px, 3px) scale(1.15) rotate(1.5deg); }
            100% { transform: translate(0, 0) scale(1.15) rotate(0deg); }
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
          className="absolute inset-0 bg-black/85 backdrop-blur-[6px] cursor-pointer"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative w-[92vw] max-w-[1150px] aspect-[1536/1024] bg-transparent z-10"
        >
          {challengeId === null ? (
            <>
              {/* Base image (TINGLING ALERT) shaking erratically */}
              <div className="absolute inset-0 animate-erratic-shake-extreme pointer-events-none transform origin-center">
                <img 
                  src={spideySenseBase} 
                  alt="Spidey Sense Base" 
                  className="w-full h-full object-contain select-none"
                />
              </div>

              {/* Usage image (TEXT AND BUTTONS) layered statically on top */}
              <div className="absolute inset-0 pointer-events-none transform scale-100 origin-center">
                <img 
                  src={spideySenseUsage} 
                  alt="Spidey Sense Usage" 
                  className="w-full h-full object-contain select-none"
                />
              </div>

              {/* Text Overlay for UX Polish */}
              <div className="absolute top-[50%] left-[20%] right-[20%] bg-[#05050d] border-4 border-[#ef4444] p-4 text-center shadow-[4px_4px_0_#ef4444] z-20">
                <h2 className="font-display font-black text-2xl text-[#ef4444] mb-2 uppercase tracking-widest">Establish Alternative Route</h2>
                <p className="font-sans text-sm text-white font-bold leading-relaxed">
                  Activate Spider-Sense to bypass this mission and uncover an alternate path.<br/>
                  <span className="text-[#fde047]">WARNING: Requires passing a neural synchronization test. Solved question will grant 70% points.</span>
                </p>
              </div>

              {/* MASSIVE INVISIBLE HITBOXES TO COVER THE BAKED-IN BUTTONS */}
              <div className="absolute top-[65%] left-[20%] right-[20%] h-[13%] flex gap-[2%] z-30">
                {/* CANCEL HITBOX */}
                <button
                  onClick={onClose}
                  type="button"
                  className="flex-1 h-full cursor-pointer bg-transparent"
                  title="CANCEL"
                  aria-label="Cancel"
                />
                {/* USE BUTTON HITBOX */}
                <button
                  onClick={handleInitiateChallenge}
                  type="button"
                  className="flex-[1.2] h-full cursor-pointer bg-transparent"
                  title="ESTABLISH ROUTE"
                  aria-label="Establish Route"
                />
              </div>
            </>
          ) : (
            /* MCQ QUESTION SCREEN */
            <div className="absolute inset-0 flex flex-col justify-center items-center p-8 bg-[#05050d] border-8 border-[#ef4444] text-white comic-halftone shadow-[12px_12px_0_0_#000] rounded-none">
              <h2 className="text-3xl font-black text-[#ef4444] tracking-widest uppercase mb-2 font-mono border-b-4 border-black pb-2 animate-pulse">
                🕷 SPIDER-SENSE
              </h2>
              <p className="text-sm font-bold text-yellow-400 uppercase tracking-wider mb-6 font-mono">
                Three quick questions stand between you and an alternate route.
              </p>
              
              {/* Question Index Indicator */}
              <div className="text-xl font-black text-zinc-400 mb-2 uppercase font-mono">
                QUESTION {currentIdx + 1} / 3
              </div>

              <div className="bg-[#111] border-4 border-black p-6 w-full max-w-3xl mb-6 shadow-[4px_4px_0_#ef4444]">
                <p className="text-md font-bold font-sans leading-relaxed text-zinc-100">
                  {currentQ?.question}
                </p>
              </div>

              <div className="flex flex-col gap-3 w-full max-w-3xl mb-6">
                {currentQ?.options.map((option, idx) => {
                  let btnStyle = "border-4 border-black bg-zinc-800 text-white";
                  if (selectedOption === idx) {
                    btnStyle = "border-4 border-[#ef4444] bg-[#ef4444] text-white font-black";
                  }
                  if (showFeedback && selectedOption === idx) {
                    btnStyle = isAnswerCorrect
                      ? "border-4 border-green-500 bg-green-600 text-white font-black"
                      : "border-4 border-red-500 bg-red-600 text-white";
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionSelect(idx)}
                      disabled={showFeedback}
                      className={`w-full py-4 px-4 text-left text-sm font-bold uppercase transition duration-150 rounded-none cursor-pointer ${btnStyle}`}
                    >
                      {String.fromCharCode(65 + idx)}. {option}
                    </button>
                  );
                })}
              </div>

              {showFeedback && (
                <div className="mb-6 text-center">
                  {isAnswerCorrect ? (
                    <div className="text-green-500 text-xl font-black font-mono animate-bounce">
                      ✓ NEURAL SYNC CONFIRMED
                    </div>
                  ) : (
                    <div className="text-red-500 text-xl font-black font-mono">
                      ✕ NEURAL SYNC FAILED • Your instincts need another try.
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                {!showFeedback ? (
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={selectedOption === null}
                    className="py-3 px-8 border-4 border-black bg-yellow-400 text-black font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-[4px_4px_0_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition"
                  >
                    Confirm Choice
                  </button>
                ) : (
                  <button
                    onClick={handleNextStep}
                    className={`py-3 px-8 border-4 border-black font-black uppercase tracking-wider cursor-pointer shadow-[4px_4px_0_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition ${isAnswerCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                  >
                    {isAnswerCorrect 
                      ? (currentIdx === 2 ? "Establish Route" : "Next Question") 
                      : "Retry Sync"
                    }
                  </button>
                )}
                <button
                  onClick={() => {
                    setChallengeId(null);
                    onClose();
                  }}
                  className="py-3 px-8 border-4 border-black bg-zinc-700 text-white font-black uppercase tracking-wider cursor-pointer shadow-[4px_4px_0_#000] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
