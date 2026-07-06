import { useState } from 'react';
import TopBar from './components/TopBar';
import LeftSidebar from './components/LeftSidebar';
import ProblemPanel from './components/ProblemPanel';
import RightPanel from './components/RightPanel';

export default function App() {
  const [questionNum, setQuestionNum] = useState(7);
  const [selectedLang, setSelectedLang] = useState('cpp');
  const [isSaved, setIsSaved] = useState(true);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#080810] overflow-hidden text-white select-none">
      {/* Custom Header with controls & timer */}
      <TopBar />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0 p-4 gap-4 comic-page-bg">
        {/* Navigation & Progress */}
        <LeftSidebar />

        {/* Mission Brief panel (Center Column) */}
        <ProblemPanel 
          questionNum={questionNum}
          setQuestionNum={setQuestionNum}
        />

        {/* Code Editor and Test cases panel (Right Column) */}
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
