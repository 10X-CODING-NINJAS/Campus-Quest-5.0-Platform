import { useState, useEffect } from 'react';
import TopBar from './components/TopBar';
import ProblemPanel from './components/ProblemPanel';
import RightPanel from './components/RightPanel';
import LoginPage from './components/LoginPage';
import Diagnostics from './components/Diagnostics';
import Lobby from './components/Lobby';
import HintsPage from './components/HintsPage';
import fullBg from '../Assets/Full bg.png';
import { getSocket, reconnectSocket } from './lib/socket';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';
const CONTEST_STATES = ['WAITING', 'DIAGNOSTICS', 'LOBBY', 'LIVE', 'PAUSED', 'MISSION_MODE', 'ENDED'] as const;
type ContestState = (typeof CONTEST_STATES)[number];

interface ContestStateSnapshot {
  state: ContestState;
  previousState: ContestState | null;
  updatedAt: string;
  startedAt: string | null;
  pausedAt: string | null;
  endsAt: string | null;
  durationMs: number;
}

interface HintProgressSnapshot {
  teamId: string;
  questionsSolved: number;
  hintProgress: 0 | 1 | 2 | 3;
  missionCompleted: boolean;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'diagnostics' | 'lobby' | 'coding' | 'hints'>('login');
  const [teamName, setTeamName] = useState('Team Earth-1610');
  const [questionNum, setQuestionNum] = useState(1);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [violationCount, setViolationCount] = useState(0);
  const [isAutoSubmitted, setIsAutoSubmitted] = useState(false);
  const [contestState, setContestState] = useState<ContestState>('WAITING');
  const [previousLiveScreen, setPreviousLiveScreen] = useState<'coding' | 'hints'>('coding');
  const [isTeamPaused, setIsTeamPaused] = useState(false);
  const [powerupCounts, setPowerupCounts] = useState({ SPIDER_SENSE: 0, WEB_FLUID: 0, SUIT_TECH: 0 });
  const [questionsSolved, setQuestionsSolved] = useState(0);
  const [hintProgress, setHintProgress] = useState<0 | 1 | 2 | 3>(0);
  const [missionCompleted, setMissionCompleted] = useState(false);
  const [socketEpoch, setSocketEpoch] = useState(0);

  // 10-Problem list and detail states
  const [problems, setProblems] = useState<any[]>([]);
  const [problemDetail, setProblemDetail] = useState<any>(null);
  const [problemsLoading, setProblemsLoading] = useState(false);

  // Fetch problems list
  const fetchProblems = async () => {
    try {
      setProblemsLoading(true);
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${BACKEND_URL}/api/problems`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        // Sort by order ascending
        const sorted = data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        setProblems(sorted);
      }
    } catch (err) {
      console.error('[App] Failed to fetch problems list', err);
    } finally {
      setProblemsLoading(false);
    }
  };

  // Fetch single problem details (statement, samples, etc.)
  const fetchProblemDetail = async (id: string) => {
    try {
      setProblemsLoading(true);
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${BACKEND_URL}/api/problems/${id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setProblemDetail(data);
      }
    } catch (err) {
      console.error('[App] Failed to fetch problem details', err);
    } finally {
      setProblemsLoading(false);
    }
  };

  // Fetch team's submissions history to count solved problems
  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;
      const res = await fetch(`${BACKEND_URL}/api/submissions/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        void data;
      }
    } catch (err) {
      console.error('[App] Failed to fetch submissions', err);
    }
  };

  // Check for stored token and skip login on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const storedTeamName = localStorage.getItem('team_name');
    if (token) {
      if (storedTeamName) setTeamName(storedTeamName);
      // Re-initialize socket
      reconnectSocket(token);
      setSocketEpoch((epoch) => epoch + 1);
      fetchProblems();
      fetchSubmissions();
    }
  }, []);

  // Handle successful login/dynamic registration
  const handleLoginSuccess = (token: string, team: any) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('team_name', team.name);
    setTeamName(team.name);
    reconnectSocket(token);
    setSocketEpoch((epoch) => epoch + 1);
    fetchProblems();
    fetchSubmissions();
  };

  useEffect(() => {
    if (currentScreen === 'coding' || currentScreen === 'hints') {
      setPreviousLiveScreen(currentScreen);
    }
  }, [currentScreen]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token || contestState === 'WAITING') {
      setCurrentScreen('login');
      return;
    }

    if (contestState === 'DIAGNOSTICS') setCurrentScreen('diagnostics');
    else if (contestState === 'LOBBY') setCurrentScreen('lobby');
    else if (contestState === 'LIVE' || contestState === 'PAUSED') setCurrentScreen(previousLiveScreen);
  }, [contestState, previousLiveScreen]);

  // Fetch details whenever questionNum or problems list updates
  useEffect(() => {
    if (problems.length > 0) {
      const prob = problems[questionNum - 1];
      if (prob) {
        fetchProblemDetail(prob.id);
      }
    }
  }, [questionNum, problems]);

  // Hook up Socket.IO events for live status sync
  useEffect(() => {
    const activeSocket = getSocket();
    const requestSync = () => activeSocket.emit('contest:sync');
    const handleContestState = (snapshot: ContestStateSnapshot) => {
      if (snapshot?.state && CONTEST_STATES.includes(snapshot.state)) {
        setContestState(snapshot.state);
      }
    };
    const handleSyncResult = (payload: {
      contestStatus?: ContestState;
      contestState?: ContestStateSnapshot;
      isTeamPaused?: boolean;
      powerupCounts?: typeof powerupCounts;
      hintProgress?: HintProgressSnapshot;
    }) => {
      if (payload.contestState) handleContestState(payload.contestState);
      else if (payload.contestStatus && CONTEST_STATES.includes(payload.contestStatus)) setContestState(payload.contestStatus);
      if (typeof payload.isTeamPaused === 'boolean') setIsTeamPaused(payload.isTeamPaused);
      if (payload.powerupCounts) setPowerupCounts(payload.powerupCounts);
      if (payload.hintProgress) {
        setQuestionsSolved(payload.hintProgress.questionsSolved);
        setHintProgress(payload.hintProgress.hintProgress);
        setMissionCompleted(payload.hintProgress.missionCompleted);
      }
    };
    const handleHintUpdate = (snapshot: HintProgressSnapshot) => {
      setQuestionsSolved(snapshot.questionsSolved);
      setHintProgress(snapshot.hintProgress);
      setMissionCompleted(snapshot.missionCompleted);
    };
    const handleTeamPaused = () => setIsTeamPaused(true);
    const handleTeamResumed = () => {
      setIsTeamPaused(false);
      setSecurityWarning(null);
    };

    activeSocket.on('connect', requestSync);
    activeSocket.on('contest:state', handleContestState);
    activeSocket.on('contest:sync_result', handleSyncResult);
    activeSocket.on('hint:update', handleHintUpdate);
    activeSocket.on('team:paused', handleTeamPaused);
    activeSocket.on('team:resumed', handleTeamResumed);
    activeSocket.on('powerup:updated', (counts: any) => setPowerupCounts(counts));
    requestSync();

    // When a submit completes, refetch solved count dynamically
    activeSocket.on('submit:result', () => {
      fetchSubmissions();
    });

    // Live-reload problem list when admin changes problems
    activeSocket.on('problems:updated', () => {
      fetchProblems();
    });

    // Check security hook in Electron
    if ((window as any).electronAPI?.onSecurityViolation) {
      (window as any).electronAPI.onSecurityViolation((type: string) => {
        setViolationCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= 5) {
            setIsAutoSubmitted(true);
            setSecurityWarning(null);
          } else {
            activeSocket.emit('violation:trigger', { type });
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
      activeSocket.off('connect', requestSync);
      activeSocket.off('contest:state', handleContestState);
      activeSocket.off('contest:sync_result', handleSyncResult);
      activeSocket.off('hint:update', handleHintUpdate);
      activeSocket.off('team:paused', handleTeamPaused);
      activeSocket.off('team:resumed', handleTeamResumed);
      activeSocket.off('submit:result');
      activeSocket.off('problems:updated');
    };
  }, [socketEpoch]);

  const handleUsePowerup = (type: 'SPIDER_SENSE' | 'WEB_FLUID' | 'SUIT_TECH') => {
    getSocket().emit('powerup:use', { type });
    setPowerupCounts(prev => ({
      ...prev,
      [type]: prev[type] + 1
    }));
  };

  if (currentScreen === 'login') {
    return <LoginPage onLogin={handleLoginSuccess} />;
  }

  if (currentScreen === 'diagnostics') {
    return <Diagnostics />;
  }

  if (currentScreen === 'lobby') {
    return (
      <Lobby
        teamName={teamName}
        onTeamNameChange={setTeamName}
      />
    );
  }

  if (contestState === 'MISSION_MODE') {
    return (
      <div className="h-screen w-screen bg-black text-white flex items-center justify-center p-8">
        <div className="w-full max-w-xl border-4 border-red-600 bg-[#080810] p-8 shadow-[10px_10px_0px_0px_rgba(220,38,38,1)]">
          <h1 className="text-4xl font-black font-mono uppercase tracking-widest text-red-500 mb-4">Mission Mode</h1>
          <p className="text-zinc-300 mb-6">Submit the mission flag issued by the contest crew.</p>
          <input
            className="w-full bg-black border-2 border-zinc-700 px-4 py-3 font-mono text-lg outline-none focus:border-red-500"
            placeholder="CQ5{...}"
          />
          <button className="mt-4 w-full bg-red-600 hover:bg-red-500 px-4 py-3 font-bold uppercase tracking-widest">
            Submit Flag
          </button>
        </div>
      </div>
    );
  }

  if (contestState === 'ENDED') {
    return (
      <div className="h-screen w-screen bg-[#05050d] text-white flex items-center justify-center p-8">
        <div className="max-w-2xl text-center">
          <h1 className="text-6xl font-black font-mono uppercase tracking-tight text-emerald-400 mb-6">Contest Complete</h1>
          <p className="text-xl text-zinc-300">Submissions are closed. Please wait for final results from the organizers.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-screen w-screen bg-[#080810] overflow-hidden text-white select-none relative"
      style={{ backgroundImage: `url(${fullBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
    >
      {/* Contest Not Started Overlay */}
      {contestState === 'WAITING' && (
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

      {/* Custom Header with controls & timer */}
      <TopBar
        isPaused={isTeamPaused || contestState !== 'LIVE'}
        teamName={teamName}
        onTeamNameChange={setTeamName}
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
      />

      {/* Main Workspace Layout */}
      {currentScreen === 'hints' ? (
        <div className="flex-1 w-full relative min-h-0">
          <HintsPage questionsSolved={questionsSolved} hintProgress={hintProgress} missionCompleted={missionCompleted} />
        </div>
      ) : (
        <div className="flex-1 flex overflow-auto p-6 gap-6 items-start justify-center">
          {/* Mission Brief panel (Left Column) */}
          <ProblemPanel
            questionNum={questionNum}
            setQuestionNum={setQuestionNum}
            problem={problemDetail}
            loading={problemsLoading}
          />

          {/* Code Editor, Test cases and Team Stats panel (Right Column) */}
          <RightPanel
            questionNum={questionNum}
            powerupCounts={powerupCounts}
            onUsePowerup={handleUsePowerup}
            onUseSpideySenseSuccess={() => setCurrentScreen('hints')}
            problem={problemDetail}
            loading={problemsLoading}
            questionsSolved={questionsSolved}
            onSolveSuccess={fetchSubmissions}
          />
        </div>
      )}
    </div>
  );
}
