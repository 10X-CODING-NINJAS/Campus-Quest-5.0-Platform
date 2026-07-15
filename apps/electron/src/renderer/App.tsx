import { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import ProblemPanel from './components/ProblemPanel';
import RightPanel from './components/RightPanel';
import LoginPage from './components/LoginPage';
import Diagnostics from './components/Diagnostics';
import Lobby from './components/Lobby';
import HintsPage from './components/HintsPage';
import fullBg from '../Assets/Full bg.png';
import { socket } from './lib/socket';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'diagnostics' | 'lobby' | 'coding' | 'hints'>('login');
  const [teamName, setTeamName] = useState('Team Earth-1610');
  const [questionNum, setQuestionNum] = useState(1);
  const [selectedLang, setSelectedLang] = useState('cpp');
  const [isSaved, setIsSaved] = useState(true);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [isAutoSubmitted, setIsAutoSubmitted] = useState(false);
  const [contestStatus, setContestStatus] = useState<'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'ENDED'>('NOT_STARTED');
  const [isTeamPaused, setIsTeamPaused] = useState(false);
  const [powerupCounts, setPowerupCounts] = useState({ SPIDER_SENSE: 0, WEB_FLUID: 0, SUIT_TECH: 0 });
  const [problems, setProblems] = useState<any[]>([]);
  const [hintStage, setHintStage] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [currentRank, setCurrentRank] = useState(1);
  const [latestVerdict, setLatestVerdict] = useState<string>('none');
  const [reconnectState, setReconnectState] = useState<'IDLE' | 'DISCONNECTED' | 'RECONNECTING' | 'RESTORED'>('IDLE');

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/problems');
        if (res.ok) {
          const data = await res.json();
          setProblems(data);
        }
      } catch (err) {
        console.error('Error fetching problems:', err);
      }
    };
    fetchProblems();
  }, []);

  useEffect(() => {
    const handleContestStarted = () => setContestStatus('RUNNING');
    const handleContestPaused = () => setContestStatus('PAUSED');
    const handleContestEnded = () => setContestStatus('ENDED');
    const handleTeamPaused = () => setIsTeamPaused(true);
    const handleTeamResumed = () => {
      setIsTeamPaused(false);
      setSecurityWarning(null);
    };
    const handleProgressUpdated = (data: { hintStage: number; solvedCount: number }) => {
      setHintStage(data.hintStage);
      setSolvedCount(data.solvedCount);
    };

    const handleDisqualifiedAll = () => {
      setIsAutoSubmitted(true);
      setSecurityWarning(null);
    };

    const handleSubmitResult = (result: any) => {
      if (result.verdict) {
        setLatestVerdict(result.verdict);
        socket.emit('contest:sync');
      }
    };

    const handleConnect = () => {
      setReconnectState(prev => {
        if (prev === 'RECONNECTING' || prev === 'DISCONNECTED') {
          // Re-trigger contest sync to ensure state updates
          socket.emit('contest:sync');
          setTimeout(() => setReconnectState('IDLE'), 3500);
          return 'RESTORED';
        }
        return 'IDLE';
      });
    };

    const handleDisconnect = () => {
      setReconnectState('DISCONNECTED');
    };

    const handleConnectError = () => {
      setReconnectState('RECONNECTING');
    };

    socket.on('contest:started', handleContestStarted);
    socket.on('contest:paused', handleContestPaused);
    socket.on('contest:ended', handleContestEnded);
    socket.on('team:paused', handleTeamPaused);
    socket.on('team:resumed', handleTeamResumed);
    socket.on('team:progress_updated', handleProgressUpdated);
    socket.on('team:disqualified_all', handleDisqualifiedAll);
    socket.on('submit:result', handleSubmitResult);
    socket.on('powerup:updated', (counts: any) => setPowerupCounts(counts));
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    // Initial sync with backend
    socket.emit('contest:sync');
    socket.on('contest:sync_result', (data: any) => {
      setContestStatus(data.contestStatus);
      setIsTeamPaused(data.isTeamPaused);
      if (data.powerupCounts) setPowerupCounts(data.powerupCounts);
      if (data.hintStage !== undefined) setHintStage(data.hintStage);
      if (data.solvedCount !== undefined) setSolvedCount(data.solvedCount);
      if (data.currentRank !== undefined) setCurrentRank(data.currentRank);
    });

    if ((window as any).electronAPI?.onSecurityViolation) {
      (window as any).electronAPI.onSecurityViolation((type: string) => {
        setViolationCount((prev) => {
          const newCount = prev + 1;
          
          if (newCount >= 5) {
            setIsAutoSubmitted(true);
            setSecurityWarning(null); 
          } else {
            // Emit violation to backend to pause the team
            socket.emit('violation:trigger', { type });
            
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
      socket.off('contest:started', handleContestStarted);
      socket.off('contest:paused', handleContestPaused);
      socket.off('contest:ended', handleContestEnded);
      socket.off('team:paused', handleTeamPaused);
      socket.off('team:resumed', handleTeamResumed);
      socket.off('team:progress_updated', handleProgressUpdated);
      socket.off('team:disqualified_all', handleDisqualifiedAll);
      socket.off('submit:result', handleSubmitResult);
      socket.off('powerup:updated');
      socket.off('contest:sync_result');
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [reconnectState]);

  // Handler for using a powerup directly via socket
  const handleUsePowerup = (type: 'SPIDER_SENSE' | 'WEB_FLUID' | 'SUIT_TECH') => {
    // If using real socket:
    socket.emit('powerup:use', { type });
    
    // Mock for UI:
    setPowerupCounts(prev => ({
      ...prev,
      [type]: prev[type] + 1
    }));
  };

  if (currentScreen === 'login') {
    return <LoginPage onLogin={() => setCurrentScreen('diagnostics')} />;
  }

  if (currentScreen === 'diagnostics') {
    return <Diagnostics onProceed={() => setCurrentScreen('lobby')} />;
  }

  if (currentScreen === 'lobby') {
    return (
      <Lobby 
        teamName={teamName} 
        onTeamNameChange={setTeamName} 
        onProceed={() => setCurrentScreen('coding')} 
      />
    );
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
            <p className="text-2xl text-white mb-6">{securityWarning || `Security Violation Detected (Violation ${violationCount}/5).`}</p>
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

      {/* Reconnect Status Banner Alert */}
      {reconnectState !== 'IDLE' && (
        <div className={`w-full py-2.5 px-4 border-b-4 border-black flex items-center justify-between text-xs font-mono font-bold select-none transition-all z-50 ${
          reconnectState === 'DISCONNECTED' ? 'bg-red-500 text-white animate-pulse' :
          reconnectState === 'RECONNECTING' ? 'bg-yellow-400 text-black animate-pulse' : 'bg-green-500 text-white'
        }`}>
          <span className="flex items-center gap-1.5">
            {reconnectState === 'DISCONNECTED' && "⚠️ DIMENSIONAL PORTAL INTERRUPTED • CHECK YOUR INTERNET ROUTER"}
            {reconnectState === 'RECONNECTING' && "⚡ DIMENSIONAL SYNAPSE DECAYING • RECONNECTING TO EARTH-1610 ANCHOR..."}
            {reconnectState === 'RESTORED' && "✓ MULTIVERSE RE-SYNCHRONIZED • WORKSPACE & CONTEST STATE RESTORED!"}
          </span>
          <span className="text-[9px] uppercase border border-black/25 px-1.5 py-0.5 bg-black/10">
            {reconnectState === 'RESTORED' ? 'Resume Coding' : 'Do not close client'}
          </span>
        </div>
      )}

      {/* Custom Header with controls & timer */}
      <TopBar 
        isPaused={isTeamPaused || contestStatus !== 'RUNNING'} 
        teamName={teamName} 
        onTeamNameChange={setTeamName} 
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        hintStage={hintStage}
      />

      {/* Main Workspace Layout */}
      {currentScreen === 'hints' ? (
        <div className="flex-1 w-full relative min-h-0">
          <HintsPage hintStage={hintStage} />
        </div>
      ) : (
        <div className="flex-1 flex overflow-auto p-6 gap-6 items-start justify-center">
          {/* Mission Brief panel (Left Column) */}
          <ProblemPanel 
            questionNum={questionNum}
            setQuestionNum={setQuestionNum}
            currentProblem={problems[questionNum - 1] || null}
            totalProblems={problems.length}
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
            onUseSpideySenseSuccess={() => setCurrentScreen('hints')}
            currentProblem={problems[questionNum - 1] || null}
            teamName={teamName}
            solvedCount={solvedCount}
            currentRank={currentRank}
            latestVerdict={latestVerdict}
            hintStage={hintStage}
            totalProblems={problems.length}
          />
        </div>
      )}
    </div>
  );
}
