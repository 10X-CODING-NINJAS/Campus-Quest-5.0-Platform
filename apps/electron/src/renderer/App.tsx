import { useState } from 'react';
import TopBar from './components/TopBar';
import ProblemPanel from './components/ProblemPanel';
import RightPanel from './components/RightPanel';
import fullBg from '../Assets/Full bg.png';

export default function App() {
  const [questionNum, setQuestionNum] = useState(7);
  const [selectedLang, setSelectedLang] = useState('cpp');
  const [isSaved, setIsSaved] = useState(true);

  return (
    <div 
      className="flex flex-col h-screen w-screen bg-[#080810] overflow-hidden text-white select-none"
      style={{ backgroundImage: `url(${fullBg})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
    >
      {/* Custom Header with controls & timer */}
      <TopBar />

      {/* Main Workspace Layout */}
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
    </div>
  );
}
