import TopBar from './components/TopBar';
import LeftSidebar from './components/LeftSidebar';
import ProblemPanel from './components/ProblemPanel';
import RightPanel from './components/RightPanel';

export default function App() {
  return (
    <div className="flex flex-col h-screen w-screen bg-spider-bg overflow-hidden text-spider-text select-none">
      {/* Custom Header with controls & timer */}
      <TopBar />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Navigation & Progress */}
        <LeftSidebar />

        {/* Code Editor and Statement panel */}
        <ProblemPanel />

        {/* Live Leaderboard & Intel progress */}
        <RightPanel />
      </div>
    </div>
  );
}
