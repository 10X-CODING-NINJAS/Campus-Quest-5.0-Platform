import { LayoutDashboard, AlertCircle, Brain, Map, Trophy, FileText, Bell, Target, Star, AlertTriangle } from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard' },
  { icon: AlertCircle, label: 'Problems', active: true },
  { icon: Brain, label: 'Mission Intel' },
  { icon: Map, label: 'Map' },
  { icon: Trophy, label: 'Leaderboard' },
  { icon: FileText, label: 'Submissions' },
  { icon: Bell, label: 'Announcements' },
];

function WebIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2 L12 22 M2 12 L22 12 M5 5 L19 19 M19 5 L5 19" />
    </svg>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: 'green' | 'purple' }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className="h-2 flex-1 rounded-sm transition-all duration-300"
          style={{
            background: i < value
              ? color === 'green'
                ? 'linear-gradient(90deg, #1adb6e, #22c55e)'
                : 'linear-gradient(90deg, #8b5cf6, #a78bfa)'
              : '#1e1e3a',
            boxShadow: i < value
              ? color === 'green' ? '0 0 4px #1adb6e50' : '0 0 4px #8b5cf650'
              : 'none',
          }}
        />
      ))}
    </div>
  );
}

function MissionProgressItem({
  label, status, coord,
  barColor, barValue, barMax,
}: {
  label: string; value: string; status: string;
  coord: string; barColor: 'green' | 'purple';
  barValue: number; barMax: number;
}) {
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-spider-text-dim text-xs font-semibold tracking-wider uppercase">{label}</span>
        <span
          className="text-xs font-semibold px-1.5 py-0.5 rounded"
          style={{
            background: status === 'COMPLETE' ? 'rgba(26,219,110,0.1)' : 'rgba(204,26,26,0.1)',
            color: status === 'COMPLETE' ? '#1adb6e' : '#ff5555',
            fontSize: '9px',
            letterSpacing: '0.1em',
          }}
        >
          {status}
        </span>
      </div>
      <ProgressBar value={barValue} max={barMax} color={barColor} />
      <div className="flex items-center justify-between mt-1">
        <span className="text-white font-bold text-sm font-display">{coord}</span>
      </div>
    </div>
  );
}

export default function LeftSidebar() {
  return (
    <aside className="w-52 flex-shrink-0 bg-spider-bg-sidebar border-r border-spider-border flex flex-col overflow-hidden select-none">
      {/* Navigation */}
      <div className="px-3 pt-4 pb-3 border-b border-spider-border">
        <p className="section-label px-1">Mission Control</p>
        <nav className="flex flex-col gap-0.5">
          {navItems.map(({ icon: Icon, label, active }) => (
            <div key={label} className={active ? 'nav-item-active' : 'nav-item'}>
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </div>
          ))}
        </nav>
      </div>

      {/* Mission Progress */}
      <div className="px-3 pt-4 pb-3 border-b border-spider-border">
        <p className="section-label px-1">Mission Progress</p>

        <MissionProgressItem
          label="Latitude"
          value="22.81"
          status="COMPLETE"
          coord="22.81° N"
          barColor="green"
          barValue={8}
          barMax={8}
        />
        <MissionProgressItem
          label="Longitude"
          value="88.37"
          status="COMPLETE"
          coord="88.37° E"
          barColor="green"
          barValue={8}
          barMax={8}
        />

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-spider-text-dim text-xs font-semibold tracking-wider uppercase">Riddle</span>
            <span
              className="text-xs font-semibold px-1.5 py-0.5 rounded"
              style={{
                background: 'rgba(139,92,246,0.12)',
                color: '#a78bfa',
                fontSize: '9px',
                letterSpacing: '0.1em',
              }}
            >
              LOCKED
            </span>
          </div>
          <ProgressBar value={3} max={4} color="purple" />
          <div className="flex items-center justify-between mt-1">
            <span className="text-white font-bold text-sm font-display">3 / 4</span>
          </div>
        </div>
      </div>

      {/* Team Status */}
      <div className="px-3 pt-4 pb-3 border-b border-spider-border">
        <p className="section-label px-1">Team Status</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-spider-text-dim text-xs">
              <Target className="w-3.5 h-3.5" />
              <span>Score</span>
            </div>
            <span className="text-white font-bold text-sm font-display">420</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-spider-text-dim text-xs">
              <FileText className="w-3.5 h-3.5" />
              <span>Questions Solved</span>
            </div>
            <span className="text-white font-bold text-sm font-display">6 / 10</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-spider-text-dim text-xs">
              <WebIcon className="w-3.5 h-3.5" />
              <span>Spider Sense Used</span>
            </div>
            <span className="text-white font-bold text-sm font-display">1</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-500/80 text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Warnings</span>
            </div>
            <span className="font-bold text-sm font-display text-yellow-400">1</span>
          </div>
        </div>
      </div>

      {/* Quote Card */}
      <div className="flex-1 p-3 flex items-end">
        <div
          className="w-full rounded-lg p-3 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(204,26,26,0.12), rgba(139,0,0,0.06))',
            border: '1px solid rgba(204,26,26,0.2)',
          }}
        >
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-spider-red flex-shrink-0">
              <img
                src="https://images.pexels.com/photos/6985004/pexels-photo-6985004.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&dpr=1"
                alt="Miles"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <p className="text-spider-text text-xs leading-relaxed italic">
                "Anyone can wear the mask. You have to choose how you wear it."
              </p>
              <p className="text-spider-red text-xs font-semibold mt-1 font-display">— Miles Morales</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 opacity-10">
            <Star className="w-12 h-12 text-spider-red" />
          </div>
        </div>
      </div>
    </aside>
  );
}
