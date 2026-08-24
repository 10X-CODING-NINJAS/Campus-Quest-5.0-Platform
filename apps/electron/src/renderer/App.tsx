import { useState, useEffect, useRef } from 'react';
import TopBar from './components/TopBar';
import ProblemPanel from './components/ProblemPanel';
import RightPanel from './components/RightPanel';
import LoginPage from './components/LoginPage';
import Diagnostics from './components/Diagnostics';
import Lobby from './components/Lobby';
import HintsPage from './components/HintsPage';
import fullBg from '../Assets/Full bg.png';
import { socket, API_BASE } from './lib/socket';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'login' | 'diagnostics' | 'lobby' | 'coding' | 'hints'>('login');
  const [teamName, setTeamName] = useState('Team Earth-1610');
  const [teamId, setTeamId] = useState<string>('');
  const [questionNum, setQuestionNum] = useState(1);
  const [selectedLang, setSelectedLang] = useState('cpp');
  const [isSaved, setIsSaved] = useState(true);
  const [contestStatus, setContestStatus] = useState<'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'ENDED'>('NOT_STARTED');
  const [powerupCounts, setPowerupCounts] = useState({ SPIDER_SENSE: 0, WEB_FLUID: 0, SUIT_TECH: 0 });
  const [problems, setProblems] = useState<any[]>([]);
  const [hintStage, setHintStage] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [currentRank, setCurrentRank] = useState(1);
  const [latestVerdict, setLatestVerdict] = useState<string>('none');
  const [reconnectState, setReconnectState] = useState<'IDLE' | 'DISCONNECTED' | 'RECONNECTING' | 'RESTORED'>('IDLE');
  // CRITICAL-4: Server-authoritative end time for the contest timer
  const [contestEndsAt, setContestEndsAt] = useState<string | null>(null);
  // Track solved problem IDs locally to avoid double-counting before server sync
  const solvedProblemIdsRef = useRef<Set<string>>(new Set());
  const bypassedProblemIdsRef = useRef<Set<string>>(new Set());
  const [maxUnlockedQuestion, setMaxUnlockedQuestion] = useState(1);

  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/problems`);
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

  // MEDIUM-2: Socket event registration uses [] so listeners are registered once.
  // Reconnect handling uses a separate effect below.
  useEffect(() => {
    const handleContestStarted = (data?: { endsAt?: string; serverTime?: string }) => {
      setContestStatus('RUNNING');
      // CRITICAL-4: Store server-authoritative end time when contest starts
      if (data?.endsAt) setContestEndsAt(data.endsAt);
    };

    // CRITICAL-5: contest:resumed is now distinct from contest:started
    const handleContestResumed = (data?: { endsAt?: string; serverTime?: string }) => {
      setContestStatus('RUNNING');
      // Update endsAt with adjusted value (pause time was added back by backend)
      if (data?.endsAt) setContestEndsAt(data.endsAt);
    };

    const handleContestPaused = () => setContestStatus('PAUSED');
    const handleContestEnded = () => setContestStatus('ENDED');
    const handleTeamPaused = () => {}; // no-op: proctoring disabled
    const handleTeamResumed = () => {}; // no-op: proctoring disabled
    const handleProgressUpdated = (data: { hintStage: number; solvedCount: number }) => {
      if (data.hintStage > hintStage && data.hintStage > 0) {
        let location = '';
        if (data.hintStage === 1) location = 'Empire State Building';
        if (data.hintStage === 2) location = 'One World Trade Center';
        if (data.hintStage === 3) location = 'Chrysler Building';
        
        if (location) {
          alert(`MISSION UPDATE: ${location} synchronized.\n${data.hintStage} / 3 Landmarks Activated.`);
        }
      }
      setHintStage(data.hintStage);
      setSolvedCount(data.solvedCount);
    };
    const handleDisqualifiedAll = () => {}; // no-op: proctoring disabled
    const handleSubmitResult = (result: any) => {
      // C5: submit:result is now OWNED by RightPanel exclusively.
      // App.tsx only updates latestVerdict and solved IDs from contest:sync_result.
      if (result.verdict) {
        setLatestVerdict(result.verdict);
        if (result.verdict === 'AC' && result.problemId) {
          if (!solvedProblemIdsRef.current.has(result.problemId)) {
            solvedProblemIdsRef.current.add(result.problemId);
            setSolvedCount(solvedProblemIdsRef.current.size);
          }
        }
        // Fire a sync to reconcile server state (rank, hints, etc)
        socket.emit('contest:sync');
      }
    };
    // MEDIUM-3/4: Named handler references for proper cleanup
    const handlePowerupUpdated = (counts: any) => setPowerupCounts(counts);
    const handleSyncResult = (data: any) => {
      setContestStatus(data.contestStatus);
      // isTeamPaused removed — proctoring disabled
      if (data.powerupCounts) setPowerupCounts(data.powerupCounts);
      
      // Handle hint stage with notification
      if (data.hintStage !== undefined) {
        if (data.hintStage > hintStage && data.hintStage > 0) {
          let location = '';
          if (data.hintStage === 1) location = 'Empire State Building';
          if (data.hintStage === 2) location = 'One World Trade Center';
          if (data.hintStage === 3) location = 'Chrysler Building';
          
          if (location) {
            // Using standard alert for now, can be replaced with custom toast
            alert(`MISSION UPDATE: ${location} synchronized.\n${data.hintStage} / 3 Landmarks Activated.`);
          }
        }
        setHintStage(data.hintStage);
      }
      
      if (data.solvedCount !== undefined) setSolvedCount(data.solvedCount);
      if (data.currentRank !== undefined) setCurrentRank(data.currentRank);
      
      if (data.solvedProblemIds) {
        solvedProblemIdsRef.current = new Set(data.solvedProblemIds);
      }
      if (data.bypassedProblemIds) {
        bypassedProblemIdsRef.current = new Set(data.bypassedProblemIds);
      }
      setMaxUnlockedQuestion(solvedProblemIdsRef.current.size + bypassedProblemIdsRef.current.size + 1);

      // CRITICAL-4: Restore timer from sync result (handles reconnects)
      if (data.endsAt) setContestEndsAt(data.endsAt);
    };

    socket.on('contest:started', handleContestStarted);
    socket.on('contest:resumed', handleContestResumed);
    socket.on('contest:paused', handleContestPaused);
    socket.on('contest:ended', handleContestEnded);
    socket.on('team:paused', handleTeamPaused);
    socket.on('team:resumed', handleTeamResumed);
    socket.on('team:progress_updated', handleProgressUpdated);
    socket.on('team:disqualified_all', handleDisqualifiedAll);
    socket.on('submit:result', handleSubmitResult);
    socket.on('powerup:updated', handlePowerupUpdated);
    socket.on('contest:sync_result', handleSyncResult);
    socket.on('leaderboard:update', (data: any) => {
      if (data.currentRank !== undefined) setCurrentRank(data.currentRank);
      if (data.solvedCount !== undefined) setSolvedCount(data.solvedCount);
    });

    // C4: Do NOT emit contest:sync here. The socket is not connected yet before login.
    // contest:sync is emitted by the reconnect handler after connectSocket() is called.

    // NOTE: Security monitoring disabled — no proctoring for testing


    return () => {
      socket.off('contest:started', handleContestStarted);
      socket.off('contest:resumed', handleContestResumed);
      socket.off('contest:paused', handleContestPaused);
      socket.off('contest:ended', handleContestEnded);
      socket.off('team:paused', handleTeamPaused);
      socket.off('team:resumed', handleTeamResumed);
      socket.off('team:progress_updated', handleProgressUpdated);
      socket.off('team:disqualified_all', handleDisqualifiedAll);
      socket.off('submit:result', handleSubmitResult);
      socket.off('powerup:updated', handlePowerupUpdated);
      socket.off('contest:sync_result', handleSyncResult);
      socket.off('leaderboard:update');
    };
  }, []); // MEDIUM-2: [] — register once, don't re-register on reconnect

  // MEDIUM-2: Reconnect handling in isolated effect
  useEffect(() => {
    const handleConnect = () => {
      setReconnectState(prev => {
        if (prev === 'RECONNECTING' || prev === 'DISCONNECTED') {
          socket.emit('contest:sync');
          setTimeout(() => setReconnectState('IDLE'), 3500);
          return 'RESTORED';
        }
        return 'IDLE';
      });
    };
    const handleDisconnect = () => setReconnectState('DISCONNECTED');
    const handleConnectError = () => setReconnectState('RECONNECTING');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
    };
  }, [reconnectState]);

  // HIGH-5: No optimistic update — powerup:updated event from server is authoritative
  const handleUsePowerup = (type: 'SPIDER_SENSE' | 'WEB_FLUID' | 'SUIT_TECH', problemId?: string) => {
    socket.emit('powerup:use', { type, problemId });
    // Do NOT optimistically update powerupCounts here.
    // The server emits 'powerup:updated' with the authoritative counts on success.
  };

  if (currentScreen === 'login') {
    return <LoginPage onLogin={(tid, tname) => {
      setTeamId(tid);
      setTeamName(tname);
      setCurrentScreen('diagnostics');
    }} />;
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
        isPaused={contestStatus !== 'RUNNING'}
        teamName={teamName}
        onTeamNameChange={setTeamName}
        currentScreen={currentScreen}
        onNavigate={(screen) => setCurrentScreen(screen)}
        hintStage={hintStage}
        contestEndsAt={contestEndsAt}
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
            maxUnlockedQuestion={maxUnlockedQuestion}
            solvedProblemIds={solvedProblemIdsRef.current}
            bypassedProblemIds={bypassedProblemIdsRef.current}
            problems={problems}
          />

          {/* Code Editor, Test cases and Team Stats panel (Right Column) */}
          {/* HIGH-2: teamId passed explicitly so workspace saves use the DB ID, not display name */}
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
            teamId={teamId}
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
