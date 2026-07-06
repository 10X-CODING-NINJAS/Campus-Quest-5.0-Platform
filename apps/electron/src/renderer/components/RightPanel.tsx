import { useState } from 'react';
import { CheckCircle2, ChevronRight, ChevronLeft, TrendingUp } from 'lucide-react';

const leaderboardData = [
  { rank: 1, name: 'Web-Warriors', score: 680, solved: 8, time: '00:42:11', dot: '#ef4444', self: false },
  { rank: 2, name: "Peter's Pals", score: 590, solved: 7, time: '00:44:02', dot: '#3b82f6', self: false },
  { rank: 3, name: 'Binary Spiders', score: 520, solved: 7, time: '00:46:33', dot: '#22c55e', self: false },
  { rank: 4, name: 'Earth-1610', score: 420, solved: 6, time: '00:52:18', dot: '#cc1a1a', self: true },
  { rank: 5, name: 'Spectacular Coders', score: 410, solved: 6, time: '00:53:01', dot: '#a78bfa', self: false },
];

function RankIndicator({ rank }: { rank: number }) {
  const colors = ['leaderboard-rank-1', 'leaderboard-rank-2', 'leaderboard-rank-3'];
  return (
    <span className={`font-bold text-sm font-display ${rank <= 3 ? colors[rank - 1] : 'text-spider-text-dim'}`}>
      {rank}
    </span>
  );
}

export default function RightPanel() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <aside
        className="w-12 flex-shrink-0 border-l border-spider-border flex flex-col items-center py-4 cursor-pointer hover:bg-white/[0.01] transition-all select-none"
        style={{ background: '#0d0d1e' }}
        onClick={() => setIsCollapsed(false)}
        title="Expand Stats Panel"
      >
        <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-spider-bg-hover transition-colors mb-6">
          <ChevronLeft className="w-4 h-4 text-spider-text-dim" />
        </button>
        <div className="flex-1 flex items-center justify-center">
          <span
            className="text-[10px] font-bold text-spider-text-dim tracking-[0.2em] uppercase select-none whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            Leaderboard & Results
          </span>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="w-72 flex-shrink-0 border-l border-spider-border flex flex-col overflow-hidden select-none"
      style={{ background: '#0d0d1e' }}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-spider-border bg-[#080810]/30 flex-shrink-0">
        <span className="text-white font-bold text-xs font-display tracking-widest uppercase">Workspace Stats</span>
        <button
          onClick={() => setIsCollapsed(true)}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-spider-bg-hover transition-colors"
          title="Collapse Panel"
        >
          <ChevronRight className="w-4 h-4 text-spider-text-dim" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Test Results */}
        <div className="px-4 pt-4 pb-4 border-b border-spider-border">
          <span className="text-white font-bold text-xs font-display tracking-widest uppercase">Test Results</span>

          <div className="mt-3 flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-spider-green flex-shrink-0" style={{ filter: 'drop-shadow(0 0 6px #1adb6e)' }} />
            <span className="text-spider-green font-bold text-lg font-display" style={{ textShadow: '0 0 12px #1adb6e50' }}>
              Accepted
            </span>
          </div>
          <p className="text-spider-text-muted text-xs mb-3">All test cases passed successfully.</p>

          <div
            className="rounded-lg p-3 grid grid-cols-2 gap-x-3 gap-y-4"
            style={{ background: '#080810', border: '1px solid #1e1e3a' }}
          >
            <div>
              <div className="text-white font-bold text-sm font-display">18 / 18</div>
              <div className="text-spider-text-muted text-[10px] uppercase font-semibold">Test Cases</div>
            </div>
            <div className="border-l border-spider-border pl-3">
              <div className="text-white font-bold text-sm font-display">37 ms</div>
              <div className="text-spider-text-muted text-[10px] uppercase font-semibold">Runtime</div>
            </div>
            <div className="border-t border-spider-border pt-3">
              <div className="text-white font-bold text-sm font-display">12.4 MB</div>
              <div className="text-spider-text-muted text-[10px] uppercase font-semibold">Memory</div>
            </div>
            <div className="border-t border-l border-spider-border pt-3 pl-3">
              <div className="text-white font-bold text-sm font-display">2.4%</div>
              <div className="text-spider-text-muted text-[10px] uppercase font-semibold">Peak CPU</div>
            </div>
            <div className="border-t border-spider-border pt-3">
              <div className="text-white font-bold text-sm font-display">0.85 KB</div>
              <div className="text-spider-text-muted text-[10px] uppercase font-semibold">Code Size</div>
            </div>
            <div className="border-t border-l border-spider-border pt-3 pl-3">
              <div className="text-white font-bold text-sm font-display">1.2 KB</div>
              <div className="text-spider-text-muted text-[10px] uppercase font-semibold">Output Size</div>
            </div>
          </div>

          <button className="mt-3.5 flex items-center gap-1 text-spider-red text-xs font-semibold hover:text-spider-red-bright transition-colors cursor-pointer">
            View Submission
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Leaderboard */}
        <div className="px-4 pt-4 pb-4 border-b border-spider-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-bold text-xs font-display tracking-widest uppercase">Leaderboard</span>
            <button className="text-spider-red text-xs font-semibold hover:text-spider-red-bright transition-colors cursor-pointer">
              View Full
            </button>
          </div>

          <div
            className="rounded-lg overflow-hidden"
            style={{ border: '1px solid #1e1e3a' }}
          >
            <div
              className="grid grid-cols-4 px-3 py-1.5"
              style={{ background: '#080810', borderBottom: '1px solid #1e1e3a' }}
            >
              <span className="text-spider-text-muted text-xs font-semibold">#</span>
              <span className="text-spider-text-muted text-xs font-semibold col-span-1">Team</span>
              <span className="text-spider-text-muted text-xs font-semibold text-right">Score</span>
              <span className="text-spider-text-muted text-xs font-semibold text-right">Time</span>
            </div>
            {leaderboardData.map(entry => (
              <div
                key={entry.rank}
                className="grid grid-cols-4 items-center px-3 py-2 transition-colors hover:bg-white/[0.02]"
                style={{
                  background: entry.self ? 'rgba(204,26,26,0.12)' : 'transparent',
                  borderBottom: entry.rank < leaderboardData.length ? '1px solid #1e1e3a' : 'none',
                }}
              >
                <RankIndicator rank={entry.rank} />
                <div className="flex items-center gap-1.5 col-span-1 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: entry.dot, boxShadow: `0 0 4px ${entry.dot}` }}
                  />
                  <span className={`text-xs truncate ${entry.self ? 'text-white font-semibold' : 'text-spider-text-dim'}`}>
                    {entry.name}
                  </span>
                </div>
                <span className={`text-xs text-right font-mono font-semibold ${entry.self ? 'text-spider-red' : 'text-spider-text'}`}>
                  {entry.score}
                </span>
                <span className="text-spider-text-muted text-xs text-right font-mono">{entry.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contest Status */}
        <div className="px-4 pt-4 pb-4">
          <div className="flex items-center justify-between">
            <span className="text-white font-bold text-xs font-display tracking-widest uppercase">Contest Status</span>
            <div className="flex items-center gap-2">
              <div className="live-dot" />
              <span className="text-spider-green text-xs font-semibold">Live</span>
              <TrendingUp className="w-3.5 h-3.5 text-spider-green" />
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
