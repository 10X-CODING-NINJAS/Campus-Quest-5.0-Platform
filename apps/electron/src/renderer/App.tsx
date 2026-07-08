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

  useEffect(() => {
    if ((window as any).electronAPI?.onSecurityViolation) {
      (window as any).electronAPI.onSecurityViolation((type: string) => {
        setSecurityWarning(
          type === 'blur' 
            ? 'You switched away from the assessment window!' 
            : 'You attempted to exit full screen mode!'
        );
      });
    }
  }, []);

  if (currentScreen === 'login') {
    return <LoginPage onLogin={(name) => { setTeamName(name); setCurrentScreen('diagnostics'); }} />;
  }

  if (currentScreen === 'diagnostics') {
    return (
      <Diagnostics 
        onProceed={() => setCurrentScreen('lobby')} 
        onBack={() => setCurrentScreen('login')}
      />
    );
  }

  if (currentScreen === 'lobby') {
    return (
      <Lobby 
        onProceed={() => setCurrentScreen('coding')}
        teamName={teamName}
        onTeamNameChange={setTeamName}
      />
    );
  }

  return (
    <div 
      className="flex flex-col h-screen w-screen bg-[#080810] overflow-hidden text-white select-none relative"
      style={{ backgroundImage: `url(${fullBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
    >
      {/* Security Warning Overlay */}
      {securityWarning && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-red-900/90 backdrop-blur-sm p-6">
          <div className="bg-black border-4 border-red-600 rounded-xl p-8 max-w-lg text-center shadow-[8px_8px_0px_0px_rgba(220,38,38,1)]">
            <h2 className="text-4xl font-bold text-red-500 mb-4 tracking-widest font-mono">SECURITY WARNING</h2>
            <p className="text-xl text-white mb-8">{securityWarning}</p>
            <p className="text-sm text-gray-400 mb-8">
              Continuing to navigate away from the assessment environment may result in automatic disqualification.
            </p>
            <button 
              onClick={() => setSecurityWarning(null)}
              className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded border-2 border-red-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:translate-x-1 active:shadow-none"
            >
              I UNDERSTAND
            </button>
          </div>
        </div>
      )}

      {/* Custom Header with controls & timer */}
      <TopBar 
        teamName={teamName} 
        onTeamNameChange={setTeamName} 
        onHintsPage={currentScreen === 'hints'}
        onToggleHints={() => setCurrentScreen(prev => prev === 'hints' ? 'coding' : 'hints')}
      />

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
          />
        </div>
      )}
    </div>
  );
}
