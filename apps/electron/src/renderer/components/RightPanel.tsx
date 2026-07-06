import { CheckCircle2, Lock, ChevronRight, TrendingUp } from 'lucide-react';

const leaderboardData = [
  { rank: 1, name: 'Web-Warriors', score: 680, solved: 8, time: '00:42:11', dot: '#ef4444', self: false },
  { rank: 2, name: "Peter's Pals", score: 590, solved: 7, time: '00:44:02', dot: '#3b82f6', self: false },
  { rank: 3, name: 'Binary Spiders', score: 520, solved: 7, time: '00:46:33', dot: '#22c55e', self: false },
  { rank: 4, name: 'Earth-1610', score: 420, solved: 6, time: '00:52:18', dot: '#cc1a1a', self: true },
  { rank: 5, name: 'Spectacular Coders', score: 410, solved: 6, time: '00:53:01', dot: '#a78bfa', self: false },
];

const notifications = [
  { type: 'update', color: '#1adb6e', label: 'Mission Update', text: 'Longitude fully recovered!', time: '2 min ago' },
  { type: 'sense', color: '#f59e0b', label: 'Spider Sense Used', text: 'Question 5 solved using Spider Sense.', time: '15 min ago' },
  { type: 'broadcast', color: '#ef4444', label: 'System Broadcast', text: 'Stay focused, true believer.', time: '20 min ago' },
];

function IntelProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = (value / max) * 100;
  return (
    <div
      className="h-2.5 rounded-full overflow-hidden"
      style={{ background: '#1e1e3a' }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
      />
    </div>
  );
}

function RankIndicator({ rank }: { rank: number }) {
  const colors = ['leaderboard-rank-1', 'leaderboard-rank-2', 'leaderboard-rank-3'];
  return (
    <span className={`font-bold text-sm font-display ${rank <= 3 ? colors[rank - 1] : 'text-spider-text-dim'}`}>
      {rank}
    </span>
  );
}

export default function RightPanel() {
  return (
    <aside
      className="w-72 flex-shrink-0 border-l border-spider-border flex flex-col overflow-hidden select-none"
      style={{ background: '#0d0d1e' }}
    >
      <div className="flex-1 overflow-y-auto">
        {/* Mission Intel */}
        <div className="px-4 pt-4 pb-3 border-b border-spider-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white font-bold text-xs font-display tracking-widest uppercase">Mission Intel</span>
          </div>
          <p className="text-spider-text-muted text-xs mb-3">Data Fragments Recovered</p>

          <div className="space-y-3">
            <div className="intel-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-spider-text-dim text-xs font-semibold uppercase tracking-wider">Latitude</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-bold"
                    style={{ background: 'rgba(26,219,110,0.12)', color: '#1adb6e', fontSize: '9px', letterSpacing: '0.1em' }}
                  >
                    COMPLETE
                  </span>
                  <span className="text-white font-bold text-sm font-display">22.81° N</span>
                </div>
              </div>
              <IntelProgressBar value={8} max={8} color="#1adb6e" />
            </div>

            <div className="intel-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-spider-text-dim text-xs font-semibold uppercase tracking-wider">Longitude</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-xs px-1.5 py-0.5 rounded font-bold"
                    style={{ background: 'rgba(26,219,110,0.12)', color: '#1adb6e', fontSize: '9px', letterSpacing: '0.1em' }}
                  >
                    COMPLETE
                  </span>
                  <span className="text-white font-bold text-sm font-display">88.37° E</span>
                </div>
              </div>
              <IntelProgressBar value={8} max={8} color="#1adb6e" />
            </div>

            <div className="intel-card">
              <div className="flex items-center justify-between mb-2">
                <span className="text-spider-text-dim text-xs font-semibold uppercase tracking-wider">Riddle</span>
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-spider-purple" />
                  <span className="text-white font-bold text-sm font-display">3 / 4</span>
                </div>
              </div>
              <IntelProgressBar value={3} max={4} color="#8b5cf6" />
              <p className="text-spider-text-muted text-xs mt-2 italic">
                After the final piece of the riddle, the exact location will be revealed.
              </p>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="px-4 pt-4 pb-3 border-b border-spider-border">
          <span className="text-white font-bold text-xs font-display tracking-widest uppercase">Test Results</span>

          <div className="mt-3 flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-spider-green flex-shrink-0" style={{ filter: 'drop-shadow(0 0 6px #1adb6e)' }} />
            <span className="text-spider-green font-bold text-lg font-display" style={{ textShadow: '0 0 12px #1adb6e50' }}>
              Accepted
            </span>
          </div>
          <p className="text-spider-text-muted text-xs mb-3">All test cases passed</p>

          <div
            className="rounded-lg p-3 grid grid-cols-3 gap-3"
            style={{ background: '#080810', border: '1px solid #1e1e3a' }}
          >
            <div className="text-center">
              <div className="text-white font-bold text-sm font-display">18 / 18</div>
              <div className="text-spider-text-muted text-xs">Test Cases</div>
            </div>
            <div className="text-center border-x border-spider-border">
              <div className="text-white font-bold text-sm font-display">37 ms</div>
              <div className="text-spider-text-muted text-xs">Runtime</div>
            </div>
            <div className="text-center">
              <div className="text-white font-bold text-sm font-display">12.4 MB</div>
              <div className="text-spider-text-muted text-xs">Memory</div>
            </div>
          </div>

          <button className="mt-3 flex items-center gap-1 text-spider-red text-xs font-semibold hover:text-spider-red-bright transition-colors cursor-pointer">
            View Submission
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Leaderboard */}
        <div className="px-4 pt-4 pb-3 border-b border-spider-border">
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

        {/* Notifications */}
        <div className="px-4 pt-4 pb-3 border-b border-spider-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-bold text-xs font-display tracking-widest uppercase">Notifications</span>
            <button className="text-spider-red text-xs font-semibold hover:text-spider-red-bright transition-colors cursor-pointer">
              View All
            </button>
          </div>

          <div className="space-y-2">
            {notifications.map((n, i) => (
              <div
                key={i}
                className="rounded-lg px-3 py-2.5"
                style={{ background: '#080810', border: '1px solid #1e1e3a' }}
              >
                <div className="flex items-start gap-2">
                  <div
                    className="notification-dot mt-1"
                    style={{ background: n.color, boxShadow: `0 0 6px ${n.color}` }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: n.color }}
                      >
                        {n.label}
                      </span>
                      <span className="text-spider-text-muted text-xs">{n.time}</span>
                    </div>
                    <p className="text-spider-text-dim text-xs leading-relaxed">{n.text}</p>
                  </div>
                </div>
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
