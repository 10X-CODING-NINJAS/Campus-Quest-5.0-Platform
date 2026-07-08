import { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import ProblemPanel from './components/ProblemPanel';
import RightPanel from './components/RightPanel';
import LoginPage from './components/LoginPage';
import Diagnostics from './components/Diagnostics';
import Lobby from './components/Lobby';
import HintsPage from './components/HintsPage';
import fullBg from '../Assets/Full bg.png';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'diagnostics' | 'lobby' | 'coding' | 'hints'>('login');
  const [teamName, setTeamName] = useState('Team Earth-1610');
  const [questionNum, setQuestionNum] = useState(7);
  const [selectedLang, setSelectedLang] = useState('cpp');
  const [isSaved, setIsSaved] = useState(true);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [isAutoSubmitted, setIsAutoSubmitted] = useState(false);
  const [contestStatus, setContestStatus] = useState<'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'ENDED'>('NOT_STARTED');
  const [isTeamPaused, setIsTeamPaused] = useState(false);
  const [powerupCounts, setPowerupCounts] = useState({ SPIDER_SENSE: 0, WEB_FLUID: 0, SUIT_TECH: 0 });

  useEffect(() => {
    // Mock socket logic (replace with real socket.io client)
    const handleContestStarted = () => setContestStatus('RUNNING');
    const handleTeamPaused = () => setIsTeamPaused(true);
    const handleTeamResumed = () => {
      setIsTeamPaused(false);
      setSecurityWarning(null);
    };

    // If using socket.io:
    // socket.on('contest:started', handleContestStarted);
    // socket.on('team:paused', handleTeamPaused);
    // socket.on('team:resumed', handleTeamResumed);
    // socket.on('powerup:updated', (counts) => setPowerupCounts(counts));

    // Initial sync mock
    // socket.emit('contest:sync');
    // socket.on('contest:sync_result', (data) => {
    //   setContestStatus(data.contestStatus);
    //   setIsTeamPaused(data.isTeamPaused);
    //   if (data.powerupCounts) setPowerupCounts(data.powerupCounts);
    // });
    
    // For development without backend, we just set it to RUNNING to allow testing
    setContestStatus('RUNNING');

    if ((window as any).electronAPI?.onSecurityViolation) {
      (window as any).electronAPI.onSecurityViolation((type: string) => {
        setViolationCount((prev) => {
          const newCount = prev + 1;
          
          if (newCount >= 5) {
            setIsAutoSubmitted(true);
            setSecurityWarning(null); 
          } else {
            // Emit violation to backend to pause the team
            // socket.emit('violation:trigger', { type });
            
            // For now, we simulate the socket response to test UI
            setIsTeamPaused(true);
            setSecurityWarning(
              type === 'blur' 
                ? `You switched away from the assessment window! (Violation ${newCount}/5)` 
                : `You attempted to exit full screen mode! (Violation ${newCount}/5)`
            );
          }
          
          return newCount;
        });
      });
    }

    return () => {
      // socket.off('contest:started', handleContestStarted);
      // socket.off('team:paused', handleTeamPaused);
      // socket.off('team:resumed', handleTeamResumed);
      // socket.off('powerup:updated');
    };
  }, []);

  // Handler for using a powerup directly via socket
  const handleUsePowerup = (type: 'SPIDER_SENSE' | 'WEB_FLUID' | 'SUIT_TECH') => {
    // If using real socket:
    // socket.emit('powerup:use', { type });
    
    // Mock for UI:
    setPowerupCounts(prev => ({
      ...prev,
      [type]: prev[type] + 1
    }));
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div 
      className="flex flex-col h-screen w-screen bg-[#080810] overflow-hidden text-white select-none relative"
      style={{ backgroundImage: `url(${fullBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
    >
      {/* Contest Not Started Overlay */}
      {contestStatus === 'NOT_STARTED' && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-6">
          <div className="bg-[#080810] border-4 border-blue-500 rounded-xl p-10 max-w-2xl text-center shadow-[12px_12px_0px_0px_rgba(59,130,246,1)] comic-halftone">
            <h1 className="text-5xl font-bold text-blue-500 mb-6 font-mono tracking-tighter uppercase">WAITING FOR ADMIN</h1>
            <p className="text-xl text-white font-bold mb-8">
              The contest will begin shortly. Please stand by.
            </p>
            <div className="flex justify-center items-center mb-4">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      )}

      {/* Team Paused Overlay (Security Lockout) */}
      {isTeamPaused && !isAutoSubmitted && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center bg-red-900/90 backdrop-blur-md p-6">
          <div className="bg-black border-4 border-red-600 rounded-xl p-10 max-w-2xl text-center shadow-[12px_12px_0px_0px_rgba(220,38,38,1)] comic-halftone">
            <h2 className="text-5xl font-bold text-red-500 mb-4 tracking-widest font-mono">TEST PAUSED</h2>
            <p className="text-2xl text-white mb-6">Security Violation Detected.</p>
            <p className="text-lg text-gray-300 mb-8 max-w-md mx-auto">
              Your test session has been suspended by the anti-cheat system. You must wait for an administrator to review the logs and unlock your terminal.
            </p>
            <div className="inline-block px-6 py-3 border-2 border-red-600 text-red-500 font-mono text-sm uppercase tracking-widest animate-pulse">
              PENDING ADMIN REVIEW...
            </div>
            
            {/* Developer bypass just for testing the UI locally */}
            <div className="mt-8">
              <button 
                onClick={() => { setIsTeamPaused(false); setSecurityWarning(null); }}
                className="text-[10px] text-gray-500 hover:text-gray-300 underline"
              >
                [Dev] Mock Admin Resume
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Submission Overlay */}
      {isAutoSubmitted && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-6">
          <div className="bg-[#080810] border-4 border-red-600 rounded-xl p-10 max-w-2xl text-center shadow-[12px_12px_0px_0px_rgba(220,38,38,1)]">
            <h1 className="text-6xl font-bold text-red-600 mb-6 font-mono tracking-tighter">TEST TERMINATED</h1>
            <p className="text-2xl text-white font-bold mb-4">
              Maximum security violations (5/5) reached.
            </p>
            <p className="text-lg text-gray-400 mb-8">
              Your test has been automatically submitted. No further editing is permitted.
            </p>
            <div className="flex justify-center items-center mb-8">
              <span className="text-red-500 animate-pulse">■</span>
              <span className="text-red-500 animate-pulse mx-2" style={{animationDelay: '150ms'}}>■</span>
              <span className="text-red-500 animate-pulse" style={{animationDelay: '300ms'}}>■</span>
            </div>
            <button 
              onClick={() => (window as any).electronAPI?.close()}
              className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded border-2 border-red-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:translate-x-1 active:shadow-none text-xl tracking-widest"
            >
              EXIT PLATFORM
            </button>
          </div>
        </div>
      )}

      {/* Custom Header with controls & timer */}
      <TopBar isPaused={isTeamPaused || contestStatus !== 'RUNNING'} />

      {/* Main Workspace Layout */}
      {currentScreen === 'hints' ? (
        <div className="flex-1 w-full relative min-h-0">
          <HintsPage />
        </div>
      ) : (
        <div className="flex-1 flex overflow-auto p-6 gap-6 items-start justify-center">
          {/* Mission Brief panel (Left Column) */}
          <ProblemPanel 
            questionNum={questionNum}
            setQuestionNum={setQuestionNum}
          />

        {/* Code Editor, Test cases and Team Stats panel (Right Column) */}
        <RightPanel 
          questionNum={questionNum}
          selectedLang={selectedLang}
          setSelectedLang={setSelectedLang}
          isSaved={isSaved}
          setIsSaved={setIsSaved}
          powerupCounts={powerupCounts}
          onUsePowerup={handleUsePowerup}
        />
      </div>
    </div>
  );
}
