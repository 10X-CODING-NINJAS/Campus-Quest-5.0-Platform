import { FileText, Target, Star, AlertTriangle } from 'lucide-react';

function WebIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2 L12 22 M2 12 L22 12 M5 5 L19 19 M19 5 L5 19" />
    </svg>
  );
}

export default function LeftSidebar() {
  return (
    <aside className="w-60 flex-shrink-0 bg-spider-bg-sidebar border-r border-spider-border flex flex-col overflow-hidden select-none">
      {/* Team Status */}
      <div className="px-4 pt-6 pb-4 border-b border-spider-border">
        <p className="section-label px-1 mb-3">Team Status</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-spider-text-dim text-xs">
              <Target className="w-4 h-4" />
              <span>Score</span>
            </div>
            <span className="text-white font-bold text-sm font-display">420</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-spider-text-dim text-xs">
              <FileText className="w-4 h-4" />
              <span>Questions Solved</span>
            </div>
            <span className="text-white font-bold text-sm font-display">6 / 10</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-spider-text-dim text-xs">
              <WebIcon className="w-4 h-4" />
              <span>Spider Sense Used</span>
            </div>
            <span className="text-white font-bold text-sm font-display">1</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-yellow-500/80 text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span>Warnings</span>
            </div>
            <span className="font-bold text-sm font-display text-yellow-400">1</span>
          </div>
        </div>
      </div>

      {/* Quote Card */}
      <div className="flex-1 p-4 flex items-end">
        <div
          className="w-full rounded-lg p-4 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(204,26,26,0.12), rgba(139,0,0,0.06))',
            border: '1px solid rgba(204,26,26,0.2)',
          }}
        >
          <div className="flex gap-2.5">
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
