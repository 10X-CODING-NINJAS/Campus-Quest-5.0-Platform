import { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:3000/admin';
const SOCKET_URL = 'http://localhost:3001';

interface Team {
  id: string;
  name: string;
  violationCount: number;
  isPaused: boolean;
  isDisqualified: boolean;
  spiderSenseCharges: number;
  hintStage: number;
  solvedCount: number;
  latestVerdict: string;
  currentProblemId: string;
  submissionCount?: number;
  penalty?: number;
}

interface Submission {
  id: string;
  teamId: string;
  problemId: string;
  language: string;
  verdict: string;
  runtimeMs: number;
  createdAt: string;
}

interface ViolationAlert {
  teamId: string;
  type: string;
  timestamp: string;
  violationCount?: number;
}

interface PowerupLog {
  teamId: string;
  type: string;
  timestamp: string;
}

export default function App() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [violations, setViolations] = useState<ViolationAlert[]>([]);
  const [powerups, setPowerups] = useState<PowerupLog[]>([]);
  const [contestStatus, setContestStatus] = useState<string>('Unknown');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'monitoring' | 'leaderboard'>('monitoring');

  // Fetch initial state
  const fetchData = async () => {
    try {
      const teamsRes = await axios.get(`http://localhost:3000/admin/teams`);
      setTeams(teamsRes.data);

      const subsRes = await axios.get(`http://localhost:3000/admin/submissions`);
      setSubmissions(subsRes.data);
    } catch (err: any) {
      console.error('Failed to load initial admin data:', err);
    }
  };

  useEffect(() => {
    fetchData();

    // Connect admin to live WebSocket updates
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      console.log('[Admin Socket] Connected to stream');
    });

    socket.on('admin:violation_alert', (alert: any) => {
      setViolations(prev => [
        {
          teamId: alert.teamId,
          type: alert.type,
          timestamp: new Date().toLocaleTimeString(),
          violationCount: alert.violationCount
        },
        ...prev.slice(0, 49)
      ]);
      // Refresh teams lists to update strike badges
      fetchData();
    });

    socket.on('admin:powerup_used', (usage: any) => {
      setPowerups(prev => [
        {
          teamId: usage.teamId,
          type: usage.type,
          timestamp: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 49)
      ]);
      fetchData();
    });

    socket.on('submit:result', () => {
      fetchData();
    });

    socket.on('contest:started', () => setContestStatus('RUNNING'));
    socket.on('contest:paused', () => setContestStatus('PAUSED'));
    socket.on('contest:ended', () => setContestStatus('ENDED'));

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleAction = async (action: 'start' | 'pause' | 'resume' | 'stop') => {
    try {
      setError(null);
      let endpoint = '';
      if (action === 'start') endpoint = '/start-contest';
      else if (action === 'pause') endpoint = '/pause-contest';
      else if (action === 'resume') endpoint = '/resume-contest';
      else if (action === 'stop') endpoint = '/emergency-stop';
      
      await axios.post(`${API_URL}${endpoint}`);
      setContestStatus(action === 'stop' ? 'ENDED' : action === 'start' || action === 'resume' ? 'RUNNING' : 'PAUSED');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    }
  };

  const handleResumeTeam = async (teamId: string) => {
    try {
      setError(null);
      await axios.post(`${API_URL}/resume-team`, { teamId });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to resume team');
    }
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'AC':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'CE':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default:
        return 'bg-red-100 text-red-700 border-red-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <header className="bg-slate-800 border-2 border-slate-700 p-5 rounded-none flex items-center justify-between shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <div>
            <h1 className="text-2xl font-black tracking-widest text-red-500 uppercase">🕷 SPIDER-VISION ADMIN CONSOLE</h1>
            <p className="text-xs text-slate-400 font-mono mt-1">REAL-TIME MULTIVERSE CONTEST STATE TELEMETRY</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-slate-950 px-4 py-2 border border-slate-700 text-xs font-mono">
              CONTEST STATUS: <span className={`font-bold ${contestStatus === 'RUNNING' ? 'text-green-400' : 'text-red-500 animate-pulse'}`}>{contestStatus.toUpperCase()}</span>
            </div>
          </div>
        </header>

        {/* Global Controls Grid */}
        <section className="bg-slate-800 border-2 border-slate-700 p-5 rounded-none shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-black tracking-widest text-slate-300 uppercase">CONTEST CONTROLS</h2>
            {error && <span className="text-xs text-red-400 font-mono font-bold">⚠️ ERROR: {error}</span>}
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => handleAction('start')}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-mono text-xs font-bold uppercase border-2 border-black shadow-[2px_2px_0_#000] active:translate-y-0.5 active:shadow-none flex items-center gap-2"
            >
              Start Contest
            </button>
            <button
              onClick={() => handleAction('pause')}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-mono text-xs font-bold uppercase border-2 border-black shadow-[2px_2px_0_#000] active:translate-y-0.5 active:shadow-none flex items-center gap-2"
            >
              Pause Contest
            </button>
            <button
              onClick={() => handleAction('resume')}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-mono text-xs font-bold uppercase border-2 border-black shadow-[2px_2px_0_#000] active:translate-y-0.5 active:shadow-none flex items-center gap-2"
            >
              Resume Contest
            </button>
            <button
              onClick={() => handleAction('stop')}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-mono text-xs font-bold uppercase border-2 border-black shadow-[2px_2px_0_#000] active:translate-y-0.5 active:shadow-none flex items-center gap-2"
            >
              ⚠️ EMERGENCY STOP
            </button>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex gap-4 border-b-2 border-slate-700 pb-2">
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`px-4 py-2 font-mono text-xs font-bold uppercase border-2 transition-all ${
              activeTab === 'monitoring' 
                ? 'bg-red-500 text-white border-black shadow-[2px_2px_0_#000]' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            Operations Monitoring
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 font-mono text-xs font-bold uppercase border-2 transition-all ${
              activeTab === 'leaderboard' 
                ? 'bg-red-500 text-white border-black shadow-[2px_2px_0_#000]' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            Championship Leaderboard
          </button>
        </div>

        {activeTab === 'monitoring' ? (
          /* Live Feed Split Columns */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Team Monitoring Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-800 border-2 border-slate-700 p-5 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <h3 className="text-sm font-black tracking-widest text-slate-300 uppercase mb-4">LIVE TEAMS MONITORING</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teams.map(t => (
                    <div 
                      key={t.id}
                      className={`border-2 p-4 bg-slate-900 shadow-[2px_2px_0_0_rgba(0,0,0,1)] flex flex-col justify-between ${
                        t.isDisqualified ? 'border-red-600 bg-red-950/20' : 
                        t.isPaused ? 'border-amber-500 bg-amber-950/20' : 'border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                          <span className="font-bold text-sm tracking-wide text-white">{t.name}</span>
                          <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 border ${
                            t.isDisqualified ? 'bg-red-900 border-red-500 text-white' :
                            t.isPaused ? 'bg-amber-900 border-amber-500 text-white' : 'bg-green-900 border-green-500 text-white'
                          }`}>
                            {t.isDisqualified ? 'DQ' : t.isPaused ? 'PAUSED' : 'ACTIVE'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-400 mt-2">
                          <div>Solved: <span className="text-white font-bold">{t.solvedCount}</span></div>
                          <div>Hint Stage: <span className="text-purple-400 font-bold">{t.hintStage}</span></div>
                          <div>Strikes: <span className={`font-bold ${t.violationCount > 2 ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>{t.violationCount}/5</span></div>
                          <div>Active: <span className="text-sky-400 font-bold">{t.currentProblemId.substring(0, 10)}</span></div>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2 justify-end">
                        {t.isPaused && !t.isDisqualified && (
                          <button
                            onClick={() => handleResumeTeam(t.id)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white font-mono text-[10px] font-bold uppercase border border-black shadow-[1px_1px_0_#000] active:translate-y-0.5 active:shadow-none"
                          >
                            Resume Team
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submissions Feed */}
              <div className="bg-slate-800 border-2 border-slate-700 p-5 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <h3 className="text-sm font-black tracking-widest text-slate-300 uppercase mb-4">LIVE SUBMISSIONS FEED</h3>
                <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                  {submissions.map(sub => (
                    <div 
                      key={sub.id}
                      className="border border-slate-700 bg-slate-900 p-3 flex justify-between items-center font-mono text-xs"
                    >
                      <div>
                        <div className="flex gap-2">
                          <span className="font-bold text-white">{sub.teamId}</span>
                          <span className="text-slate-500">submitted</span>
                          <span className="text-sky-400 font-bold">{sub.problemId}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">
                          Lang: {sub.language} • {new Date(sub.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="flex gap-3 items-center">
                        <span className="text-[10px] text-slate-400">{sub.runtimeMs}ms</span>
                        <span className={`border px-1.5 py-0.5 text-[10px] font-bold ${getVerdictBadge(sub.verdict)}`}>
                          {sub.verdict}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Side feeds (Violations & Powerups) */}
            <div className="space-y-6">
              
              {/* Live Violations */}
              <div className="bg-slate-800 border-2 border-slate-700 p-5 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <h3 className="text-sm font-black tracking-widest text-red-500 uppercase mb-4 flex items-center gap-2">
                  ⚠️ CHEAT DETECT ALERTS
                </h3>
                <div className="space-y-3 max-h-[250px] overflow-y-auto">
                  {violations.map((v, i) => (
                    <div key={i} className="border-l-4 border-red-500 bg-red-950/20 p-2.5 font-mono text-[11px]">
                      <div className="flex justify-between font-bold text-red-400">
                        <span>{v.teamId}</span>
                        <span>{v.timestamp}</span>
                      </div>
                      <p className="text-slate-300 mt-1 uppercase text-[10px]">VIOLATION: {v.type}</p>
                      {v.violationCount && <p className="text-slate-400 mt-0.5 text-[9px]">Strike Count: {v.violationCount}/5</p>}
                    </div>
                  ))}
                  {violations.length === 0 && (
                    <div className="text-center py-6 text-zinc-500 font-mono text-xs">
                      No violations detected.
                    </div>
                  )}
                </div>
              </div>

              {/* Powerups Feed */}
              <div className="bg-slate-800 border-2 border-slate-700 p-5 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <h3 className="text-sm font-black tracking-widest text-yellow-500 uppercase mb-4">
                  ⚡ POWERUP CONSUMPTION LOG
                </h3>
                <div className="space-y-3 max-h-[250px] overflow-y-auto">
                  {powerups.map((p, i) => (
                    <div key={i} className="border-l-4 border-yellow-500 bg-yellow-950/10 p-2.5 font-mono text-[11px]">
                      <div className="flex justify-between font-bold text-yellow-500">
                        <span>{p.teamId}</span>
                        <span>{p.timestamp}</span>
                      </div>
                      <p className="text-slate-300 mt-1 uppercase text-[10px]">Activated: {p.type}</p>
                    </div>
                  ))}
                  {powerups.length === 0 && (
                    <div className="text-center py-6 text-zinc-500 font-mono text-xs">
                      No powerups activated.
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* Championship Leaderboard Panel */
          <div className="bg-slate-800 border-2 border-slate-700 p-6 shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <h3 className="text-sm font-black tracking-widest text-slate-300 uppercase mb-4">
              CHAMPIONSHIP LEADERBOARD
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-700 text-slate-400 text-left">
                    <th className="pb-3 font-bold uppercase">Rank</th>
                    <th className="pb-3 font-bold uppercase">Team Name</th>
                    <th className="pb-3 font-bold uppercase text-center">Solved</th>
                    <th className="pb-3 font-bold uppercase text-center">Submissions</th>
                    <th className="pb-3 font-bold uppercase text-center">Penalty</th>
                    <th className="pb-3 font-bold uppercase text-right">Current Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {teams
                    .slice()
                    .sort((a, b) => {
                      if (b.solvedCount !== a.solvedCount) {
                        return b.solvedCount - a.solvedCount;
                      }
                      return (a.penalty ?? 0) - (b.penalty ?? 0);
                    })
                    .map((t, idx) => (
                      <tr 
                        key={t.id} 
                        className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="py-3.5 font-black text-slate-400 text-sm">
                          #{idx + 1}
                        </td>
                        <td className="py-3.5 font-bold text-white text-sm">
                          {t.name}
                        </td>
                        <td className="py-3.5 text-center font-black text-green-400 text-sm">
                          {t.solvedCount}
                        </td>
                        <td className="py-3.5 text-center text-slate-300">
                          {t.submissionCount || 0}
                        </td>
                        <td className="py-3.5 text-center text-red-400 font-bold">
                          {t.penalty || 0} pts
                        </td>
                        <td className="py-3.5 text-right font-semibold text-slate-400">
                          {t.isDisqualified ? (
                            <span className="text-red-500 font-bold uppercase">Disqualified</span>
                          ) : t.isPaused ? (
                            <span className="text-amber-500 font-bold uppercase">Locked Out</span>
                          ) : (
                            <span className="text-sky-400">
                              {t.latestVerdict !== 'none' ? `Verdict: ${t.latestVerdict} (${t.currentProblemId.substring(0, 10)})` : 'Active'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
