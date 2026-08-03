import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  ShieldAlert,
  Radio,
  Activity,
  Trophy,
  Send,
  Zap,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  OctagonX,
  Search,
  MessageSquare,
  BarChart3,
  Flame,
  Users,
  Sparkles,
} from 'lucide-react';

const API_URL = 'http://localhost:3001/admin';
const DEMO_URL = 'http://localhost:3001/demo';
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
  legitimateSolvedCount?: number;
  bypassedCount?: number;
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

interface HelpRequest {
  id: string;
  teamId: string;
  teamName?: string;
  problemId: string;
  problemTitle?: string;
  status: 'PENDING' | 'ANSWERED' | 'EXPIRED';
  hint?: string;
  answeredBy?: string;
  createdAt: string;
  answeredAt?: string;
  remainingSuitTech?: number;
}

interface PowerupLog {
  teamId: string;
  type: string;
  timestamp: string;
  freezeDurationMs?: number;
}

interface AnalyticsData {
  mostSolvedQuestion: string;
  mostFailedQuestion: string;
  mostBypassedQuestion: string;
  mostRequestedMission?: string;
  averageAttempts: number;
  averageRuntime: number;
  averageMemory: number;
  spiderSenseUsage: number;
  webFluidUsage?: number;
  suitTechUsage?: number;
  totalPowerupUsage: number;
  violationCount: number;
  fastestSolve: number;
  totalHintRequests?: number;
  hintsSent?: number;
  averageResponseTimeSec?: number;
  unusedSuitTech?: number;
}

interface DemoTeam {
  id: string;
  name: string;
  email: string;
}

export default function App() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [violations, setViolations] = useState<ViolationAlert[]>([]);
  const [powerups, setPowerups] = useState<PowerupLog[]>([]);
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [contestStatus, setContestStatus] = useState<string>('Unknown');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'monitoring' | 'leaderboard' | 'tactical' | 'analytics' | 'demo'>('monitoring');
  const [hintInputs, setHintInputs] = useState<Record<string, string>>({});
  const [searchFilter, setSearchFilter] = useState('');
  const [demoModeEnabled, setDemoModeEnabled] = useState(false);
  const [demoTeams, setDemoTeams] = useState<DemoTeam[]>([]);
  const [selectedDemoTeam, setSelectedDemoTeam] = useState<string>('');
  const [demoStatus, setDemoStatus] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  const [adminToken, setAdminToken] = useState<string | null>(
    () => sessionStorage.getItem('cq_admin_token')
  );
  const [loginInput, setLoginInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (adminToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      sessionStorage.setItem('cq_admin_token', adminToken);
    }
  }, [adminToken]);

  const fetchData = useCallback(async () => {
    try {
      const teamsRes = await axios.get(`http://localhost:3001/admin/teams`);
      setTeams(teamsRes.data);
      const subsRes = await axios.get(`http://localhost:3001/admin/submissions`);
      setSubmissions(subsRes.data);
      const helpReqRes = await axios.get(`http://localhost:3001/admin/help-requests`).catch(() => ({ data: [] }));
      setHelpRequests(helpReqRes.data);
      const analyticsRes = await axios.get(`http://localhost:3001/admin/analytics`);
      setAnalytics(analyticsRes.data);
      const statusRes = await axios.get(`http://localhost:3001/admin/contest-status`);
      setContestStatus(statusRes.data?.status || 'NOT_STARTED');
    } catch (err: any) {
      console.error('Failed to load initial admin data:', err);
    }
  }, []);

  useEffect(() => {
    if (!adminToken) return;
    fetchData();

    axios.get(`${DEMO_URL}/status`).then(res => {
      setDemoModeEnabled(res.data.enabled);
    }).catch(() => {});

    Promise.all([
      axios.get(`${DEMO_URL}/teams`).catch(() => ({ data: [] })),
      axios.get('http://localhost:3001/api/test-teams').catch(() => ({ data: [] })),
    ]).then(([demoRes, testRes]) => {
      const testList = (testRes.data as any[]).map((t: any) => ({ id: t.id, name: `${t.name} (test)`, email: '' }));
      const demoList = (demoRes.data as DemoTeam[]);
      const merged = [...testList, ...demoList];
      setDemoTeams(merged);
      if (merged.length > 0) setSelectedDemoTeam(merged[0].id);
    });

    const socket = io(SOCKET_URL, {
      auth: { adminSecret: adminToken }
    });

    (window as any).adminSocket = socket;

    socket.on('connect', () => {
      console.log('[Admin Socket] Connected to stream');
      socket.emit('join:admin');
    });

    socket.on('admin:violation_alert', (alert: any) => {
      setViolations(prev => [
        { teamId: alert.teamId, type: alert.type, timestamp: new Date().toLocaleTimeString(), violationCount: alert.violationCount },
        ...prev.slice(0, 49),
      ]);
      fetchData();
    });

    socket.on('admin:powerup_used', (usage: any) => {
      setPowerups(prev => [
        { teamId: usage.teamId, type: usage.type, timestamp: new Date().toLocaleTimeString(), freezeDurationMs: usage.freezeDurationMs },
        ...prev.slice(0, 49),
      ]);
      fetchData();
    });

    socket.on('admin:hint_request', (req: any) => {
      setHelpRequests(prev => [req, ...prev.filter(r => r.id !== req.id)]);
      fetchData();
    });

    socket.on('admin:hint_answered', (data: any) => {
      setHelpRequests(prev => prev.map(r => r.id === data.requestId ? { ...r, status: 'ANSWERED', hint: data.hint, answeredBy: data.answeredBy, answeredAt: data.answeredAt } : r));
      fetchData();
    });

    socket.on('submit:result', () => { fetchData(); });
    socket.on('demo:leaderboard_updated', () => { fetchData(); });
    socket.on('demo:contest_reset', () => { fetchData(); setContestStatus('NOT_STARTED'); });
    socket.on('contest:started', () => setContestStatus('RUNNING'));
    socket.on('contest:paused', () => setContestStatus('PAUSED'));
    socket.on('contest:ended', () => setContestStatus('ENDED'));

    return () => { socket.disconnect(); };
  }, [fetchData, adminToken]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const secret = loginInput.trim();
    if (!secret) {
      setLoginError('Secret required');
      return;
    }
    setLoginLoading(true);
    setLoginError(null);
    try {
      await axios.get(`${API_URL}/contest-status`, {
        headers: { Authorization: `Bearer ${secret}` }
      });
      setAdminToken(secret);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setLoginError('Invalid admin secret. Access denied.');
      } else {
        setLoginError('Backend unreachable — is the server running?');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAction = async (action: 'start' | 'pause' | 'resume' | 'stop') => {
    setError(null);
    try {
      if (action === 'start') await axios.post(`${API_URL}/start-contest`);
      if (action === 'pause') await axios.post(`${API_URL}/pause-contest`);
      if (action === 'resume') await axios.post(`${API_URL}/resume-contest`);
      if (action === 'stop') await axios.post(`${API_URL}/emergency-stop`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to execute ${action}`);
    }
  };

  const handleResumeTeam = async (teamId: string) => {
    try {
      await axios.post(`${API_URL}/resume-team`, { teamId });
      fetchData();
    } catch (err: any) {
      setError(`Failed to unlock team ${teamId}`);
    }
  };

  const demoAction = async (endpoint: string, body: object, label: string) => {
    setDemoLoading(label);
    setDemoStatus(null);
    try {
      const res = await axios.post(`${DEMO_URL}/${endpoint}`, body);
      setDemoStatus(`✓ ${res.data.message || 'Success'}`);
      fetchData();
    } catch (err: any) {
      setDemoStatus(`❌ Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setDemoLoading(null);
    }
  };

  if (!adminToken) {
    return (
      <div className="min-h-screen bg-[#060812] text-slate-100 flex items-center justify-center p-6 font-sans relative overflow-hidden">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-slate-900/90 border-2 border-red-500/50 backdrop-blur-xl p-8 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.2)] z-10 select-none">
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-14 h-14 bg-red-500/10 border-2 border-red-500/80 rounded-2xl flex items-center justify-center text-red-500 mb-4 shadow-[0_0_20px_rgba(239,68,68,0.3)]">
              <Radio className="w-8 h-8 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 uppercase">
              SPIDER-VISION ADMIN
            </h1>
            <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-wider">
              Multiverse Command Center Authorization
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-mono text-slate-300 font-bold uppercase mb-2 tracking-wider">
                Admin Security Token
              </label>
              <input
                type="password"
                value={loginInput}
                onChange={e => setLoginInput(e.target.value)}
                placeholder="Enter ADMIN_SECRET..."
                className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-red-500 transition-colors shadow-inner"
                autoFocus
              />
            </div>

            {loginError && (
              <div className="bg-red-950/60 border border-red-500/60 rounded-xl p-3 text-xs font-mono text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-mono text-xs font-black uppercase tracking-widest rounded-xl border border-red-400/30 shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Authorizing...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Connect to Console</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchFilter.toLowerCase()));
  const pendingRequestsCount = helpRequests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 p-6 font-sans relative overflow-x-hidden selection:bg-red-500 selection:text-white">
      {/* Background Ambient Field */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-sky-600/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">

        {/* Top Header Bar */}
        <header className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/40 rounded-xl flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-300 uppercase">
                🕷 SPIDER-VISION ADMIN CONSOLE
              </h1>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5 tracking-wider uppercase">
                Real-Time Multiverse Telemetry & Tactical Command
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {demoModeEnabled && (
              <div className="bg-yellow-950/60 border border-yellow-500/60 px-3 py-1.5 rounded-lg text-xs font-mono text-yellow-400 flex items-center gap-2 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>DEMO MODE ACTIVE</span>
              </div>
            )}

            <div className="bg-slate-950/90 px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono flex items-center gap-2 shadow-inner">
              <span className="text-slate-400">CONTEST STATUS:</span>
              <span className={`font-black px-2 py-0.5 rounded text-[10px] uppercase border ${
                contestStatus === 'RUNNING' ? 'bg-emerald-950 border-emerald-500 text-emerald-400' :
                contestStatus === 'PAUSED' ? 'bg-amber-950 border-amber-500 text-amber-400 animate-pulse' :
                'bg-rose-950 border-rose-500 text-rose-400'
              }`}>
                {contestStatus}
              </span>
            </div>

            <button
              onClick={() => {
                sessionStorage.removeItem('cq_admin_token');
                setAdminToken(null);
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-xl border border-slate-700 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>

        {/* Global Contest Controls Grid */}
        <section className="bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-xs font-mono font-black tracking-widest text-slate-300 uppercase flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-500" />
              GLOBAL CONTEST CONTROLS
            </h2>
            {error && (
              <span className="text-xs text-rose-400 font-mono font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> {error}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
            <button
              onClick={() => handleAction('start')}
              className="px-4 py-3 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold uppercase rounded-xl border border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Play className="w-4 h-4" /> Start Contest
            </button>
            <button
              onClick={() => handleAction('pause')}
              className="px-4 py-3 bg-amber-600/90 hover:bg-amber-500 text-white font-bold uppercase rounded-xl border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Pause className="w-4 h-4" /> Pause Contest
            </button>
            <button
              onClick={() => handleAction('resume')}
              className="px-4 py-3 bg-sky-600/90 hover:bg-sky-500 text-white font-bold uppercase rounded-xl border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <RotateCcw className="w-4 h-4" /> Resume Contest
            </button>
            <button
              onClick={() => handleAction('stop')}
              className="px-4 py-3 bg-rose-700/90 hover:bg-rose-600 text-white font-bold uppercase rounded-xl border border-rose-500/40 shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <OctagonX className="w-4 h-4" /> Emergency Stop
            </button>
          </div>
        </section>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          {[
            { id: 'monitoring', label: 'Operations Monitoring', icon: Activity, badge: null },
            { id: 'tactical', label: 'Tactical Assistance', icon: MessageSquare, badge: pendingRequestsCount > 0 ? pendingRequestsCount : null },
            { id: 'leaderboard', label: 'Championship Leaderboard', icon: Trophy, badge: null },
            { id: 'analytics', label: 'Analytics & Telemetry', icon: BarChart3, badge: null },
            { id: 'demo', label: 'Demo Controls', icon: Zap, badge: null },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-red-600 text-white border-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== null && (
                  <span className="bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full animate-bounce">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* TAB 1: Operations Monitoring */}
        {activeTab === 'monitoring' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Live Teams Grid */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-mono font-black tracking-widest text-slate-300 uppercase flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-400" /> LIVE CONTESTANT TEAMS ({teams.length})
                  </h3>

                  <div className="relative w-48">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search team..."
                      value={searchFilter}
                      onChange={e => setSearchFilter(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTeams.map(t => (
                    <div
                      key={t.id}
                      className={`border rounded-xl p-4 bg-slate-950/70 transition-all flex flex-col justify-between ${
                        t.isDisqualified ? 'border-rose-600/80 bg-rose-950/20' :
                        t.isPaused ? 'border-amber-500/80 bg-amber-950/20' :
                        'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
                          <span className="font-bold text-sm text-white tracking-wide">{t.name}</span>
                          <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${
                            t.isDisqualified ? 'bg-rose-950 border-rose-500 text-rose-300' :
                            t.isPaused ? 'bg-amber-950 border-amber-500 text-amber-300 animate-pulse' :
                            'bg-emerald-950 border-emerald-500 text-emerald-300'
                          }`}>
                            {t.isDisqualified ? 'Disqualified' : t.isPaused ? 'Paused' : 'Active'}
                          </span>
                        </div>

                        <div className="space-y-2 font-mono text-xs">
                          <div className="flex justify-between text-slate-400">
                            <span>Solved Missions:</span>
                            <span className="text-emerald-400 font-bold">{t.solvedCount || 0} / 10</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Security Alerts:</span>
                            <span className={`font-bold ${t.violationCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                              {t.violationCount} / 5
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Spider-Sense Charges:</span>
                            <span className="text-yellow-400 font-bold">{t.spiderSenseCharges}</span>
                          </div>
                        </div>
                      </div>

                      {t.isPaused && !t.isDisqualified && (
                        <button
                          onClick={() => handleResumeTeam(t.id)}
                          className="mt-4 w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
                        >
                          Unlock Team Terminal
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feeds Column: Security & Powerups */}
            <div className="space-y-4">
              {/* Security Violation Alerts Feed */}
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-lg">
                <h3 className="text-xs font-mono font-black tracking-widest text-slate-300 uppercase mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500" /> ANTI-CHEAT ALERTS
                </h3>

                <div className="space-y-2 max-h-56 overflow-y-auto font-mono text-xs">
                  {violations.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No violations logged.</p>
                  ) : (
                    violations.map((v, idx) => (
                      <div key={idx} className="bg-amber-950/30 border border-amber-500/40 p-2.5 rounded-lg flex justify-between items-center text-amber-200">
                        <div>
                          <div className="font-bold">{v.teamId}</div>
                          <div className="text-[10px] text-amber-400/80">{v.type}</div>
                        </div>
                        <span className="text-[10px] text-slate-400">{v.timestamp}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Powerup Activity Log */}
              <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-lg">
                <h3 className="text-xs font-mono font-black tracking-widest text-slate-300 uppercase mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" /> POWERUP DISPATCH LOG
                </h3>

                <div className="space-y-2 max-h-56 overflow-y-auto font-mono text-xs">
                  {powerups.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No powerups activated.</p>
                  ) : (
                    powerups.map((p, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg flex justify-between items-center">
                        <div>
                          <div className="font-bold text-white">{p.teamId}</div>
                          <div className="text-[10px] text-yellow-400 font-bold">
                            {p.type} {p.freezeDurationMs ? '(60s Time Freeze)' : ''}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400">{p.timestamp}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: Tactical Assistance Queue (Suit Tech Spider-Comms) */}
        {activeTab === 'tactical' && (
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-black tracking-widest text-sky-400 uppercase flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" /> TACTICAL ASSISTANCE QUEUE (SPIDER-COMMS)
                </h3>
                <p className="font-mono text-xs text-slate-400 mt-1">
                  Direct Organizer Tactical Advice & Hint Dispatch Engine
                </p>
              </div>

              <div className="flex items-center gap-3 font-mono text-xs font-bold">
                <span className="bg-amber-950/80 border border-amber-500/60 text-amber-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  PENDING: {pendingRequestsCount}
                </span>
                <span className="bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 px-3 py-1.5 rounded-xl">
                  ANSWERED: {helpRequests.filter(r => r.status === 'ANSWERED').length}
                </span>
              </div>
            </div>

            {helpRequests.length === 0 ? (
              <div className="bg-slate-950 border border-slate-800 p-12 text-center text-slate-500 font-mono text-xs rounded-xl">
                No tactical assistance requests received from teams yet.
              </div>
            ) : (
              <div className="space-y-4">
                {helpRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`border-2 p-5 rounded-2xl bg-slate-950/80 shadow-md flex flex-col gap-3.5 transition-all ${
                      req.status === 'PENDING' ? 'border-sky-500/80 bg-sky-950/15' : 'border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-white font-bold text-sm">{req.teamName || req.teamId}</span>
                        <span className="bg-slate-900 border border-sky-500/40 text-sky-300 text-[10px] px-2.5 py-0.5 rounded-lg font-bold uppercase">
                          TARGET MISSION: {req.problemTitle || req.problemId}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 font-mono text-xs">
                        <span className="text-slate-400">
                          {req.createdAt ? new Date(req.createdAt).toLocaleTimeString() : 'Just now'}
                        </span>
                        <span className={`font-bold px-2.5 py-0.5 rounded-md border text-[10px] uppercase ${
                          req.status === 'PENDING' ? 'bg-amber-950 border-amber-500 text-amber-300 animate-pulse' :
                          'bg-emerald-950 border-emerald-500 text-emerald-300'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    </div>

                    {req.status === 'PENDING' ? (
                      <div className="space-y-3 pt-1">
                        <div className="font-mono text-xs text-amber-300/90 flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
                          Contestant team requested tactical guidance for <span className="font-bold text-white">{req.problemTitle || req.problemId}</span>:
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="text"
                            placeholder="Type custom hint or tactical code guidance..."
                            value={hintInputs[req.id] || ''}
                            onChange={(e) => setHintInputs(prev => ({ ...prev, [req.id]: e.target.value }))}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-400"
                          />
                          <button
                            onClick={() => {
                              const text = hintInputs[req.id]?.trim();
                              if (!text) return;
                              const socket = (window as any).adminSocket;
                              if (socket) {
                                socket.emit('admin:send_hint', {
                                  requestId: req.id,
                                  hint: text,
                                  adminName: 'Spider-Vision Command HQ',
                                });
                                setHintInputs(prev => ({ ...prev, [req.id]: '' }));
                              }
                            }}
                            className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-black font-mono text-xs font-black uppercase rounded-xl border border-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                          >
                            <Send className="w-3.5 h-3.5" /> Send Tactical Intel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl font-mono text-xs space-y-1.5">
                        <div className="flex justify-between text-slate-400 text-[10px]">
                          <span>DISPATCHED BY: {req.answeredBy || 'HQ Admin'}</span>
                          <span>{req.answeredAt ? new Date(req.answeredAt).toLocaleTimeString() : ''}</span>
                        </div>
                        <div className="text-yellow-300 font-bold">"{req.hint}"</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Championship Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-lg space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black tracking-widest text-slate-200 uppercase flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-400" /> OFFICIAL CHAMPIONSHIP LEADERBOARD
              </h3>
              <span className="font-mono text-xs text-slate-400">Total Teams: {teams.length}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-2">Rank</th>
                    <th className="py-3 px-2">Team Name</th>
                    <th className="py-3 px-2 text-center">Solved</th>
                    <th className="py-3 px-2 text-center">Penalty</th>
                    <th className="py-3 px-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {teams
                    .sort((a, b) => (b.solvedCount || 0) - (a.solvedCount || 0) || (a.penalty || 0) - (b.penalty || 0))
                    .map((t, idx) => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-2 font-bold">
                          {idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : idx === 2 ? '🥉 3rd' : `#${idx + 1}`}
                        </td>
                        <td className="py-3.5 px-2 font-bold text-white">{t.name}</td>
                        <td className="py-3.5 px-2 text-center text-emerald-400 font-bold">{t.solvedCount || 0} / 10</td>
                        <td className="py-3.5 px-2 text-center text-rose-400 font-bold">{t.penalty || 0} pts</td>
                        <td className="py-3.5 px-2 text-right">
                          <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-bold ${
                            t.isDisqualified ? 'bg-rose-950 border-rose-500 text-rose-300' :
                            t.isPaused ? 'bg-amber-950 border-amber-500 text-amber-300' :
                            'bg-emerald-950 border-emerald-500 text-emerald-300'
                          }`}>
                            {t.isDisqualified ? 'Disqualified' : t.isPaused ? 'Paused' : 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Analytics & Telemetry */}
        {activeTab === 'analytics' && analytics && (
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-lg space-y-6">
            <h3 className="text-sm font-black tracking-widest text-slate-200 uppercase flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-400" /> CONTEST ANALYTICS & TELEMETRY
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3 font-mono text-xs">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">Missions Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-slate-400">Most Solved:</span> <span className="text-emerald-400 font-bold">{analytics.mostSolvedQuestion}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Most Bypassed:</span> <span className="text-yellow-400 font-bold">{analytics.mostBypassedQuestion}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Most Failed:</span> <span className="text-rose-400 font-bold">{analytics.mostFailedQuestion}</span></div>
                  {analytics.mostRequestedMission && (
                    <div className="flex justify-between"><span className="text-slate-400">Most Requested:</span> <span className="text-sky-400 font-bold">{analytics.mostRequestedMission}</span></div>
                  )}
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3 font-mono text-xs">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">Performance Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-slate-400">Total Submissions:</span> <span className="text-white font-bold">{submissions.length}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Avg Runtime:</span> <span className="text-sky-400 font-bold">{analytics.averageRuntime} ms</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Avg Memory:</span> <span className="text-purple-400 font-bold">{analytics.averageMemory} KB</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Fastest Solve:</span> <span className="text-white font-bold">{analytics.fastestSolve} ms</span></div>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3 font-mono text-xs">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">Powerup Usage</h4>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-slate-400">Spider-Sense:</span> <span className="text-yellow-400 font-bold">{analytics.spiderSenseUsage}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Web-Fluid:</span> <span className="text-sky-400 font-bold">{analytics.webFluidUsage || 0}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Suit Tech:</span> <span className="text-purple-400 font-bold">{analytics.suitTechUsage || 0}</span></div>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3 font-mono text-xs">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">Spider-Comms Intel</h4>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-slate-400">Total Requests:</span> <span className="text-sky-400 font-bold">{analytics.totalHintRequests || 0}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Hints Sent:</span> <span className="text-emerald-400 font-bold">{analytics.hintsSent || 0}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Avg Response:</span> <span className="text-white font-bold">{analytics.averageResponseTimeSec || 0}s</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Demo Controls */}
        {activeTab === 'demo' && (
          <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-lg space-y-6">
            <h3 className="text-sm font-black tracking-widest text-yellow-400 uppercase flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" /> DEMO CONTROLS & PRESENTATION SUITE
            </h3>

            {demoStatus && (
              <div className={`p-3.5 rounded-xl font-mono text-xs border ${
                demoStatus.startsWith('✓') ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : 'bg-rose-950/80 border-rose-500 text-rose-300'
              }`}>
                {demoStatus}
              </div>
            )}

            <div className="flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">Target Team:</label>
              <select
                value={selectedDemoTeam}
                onChange={e => setSelectedDemoTeam(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white font-mono text-xs px-4 py-2 rounded-lg focus:outline-none focus:border-yellow-500"
              >
                {demoTeams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
              <button
                disabled={Boolean(demoLoading)}
                onClick={() => demoAction('solve-current', { teamId: selectedDemoTeam }, 'Solve Current')}
                className="p-3 bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold rounded-xl border border-emerald-400/40 transition-colors cursor-pointer disabled:opacity-50"
              >
                {demoLoading === 'Solve Current' ? 'Executing...' : 'Solve Current Mission'}
              </button>
              <button
                disabled={Boolean(demoLoading)}
                onClick={() => demoAction('solve-next', { teamId: selectedDemoTeam }, 'Solve Next')}
                className="p-3 bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold rounded-xl border border-emerald-400/40 transition-colors cursor-pointer disabled:opacity-50"
              >
                {demoLoading === 'Solve Next' ? 'Executing...' : 'Solve Next Mission'}
              </button>
              <button
                disabled={Boolean(demoLoading)}
                onClick={() => demoAction('trigger-powerup', { teamId: selectedDemoTeam, type: 'WEB_FLUID' }, 'Trigger Web-Fluid')}
                className="p-3 bg-sky-600/80 hover:bg-sky-500 text-white font-bold rounded-xl border border-sky-400/40 transition-colors cursor-pointer disabled:opacity-50"
              >
                {demoLoading === 'Trigger Web-Fluid' ? 'Executing...' : 'Trigger Web-Fluid (Freeze)'}
              </button>
              <button
                disabled={Boolean(demoLoading)}
                onClick={() => demoAction('simulate-violation', { teamId: selectedDemoTeam, type: 'TAB_SWITCH' }, 'Simulate Violation')}
                className="p-3 bg-rose-600/80 hover:bg-rose-500 text-white font-bold rounded-xl border border-rose-400/40 transition-colors cursor-pointer disabled:opacity-50"
              >
                {demoLoading === 'Simulate Violation' ? 'Executing...' : 'Simulate Security Violation'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
