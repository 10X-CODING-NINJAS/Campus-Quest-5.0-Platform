import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { ShieldAlert, Radio, Activity, Trophy, Send, Zap, AlertTriangle, Play, Pause, RotateCcw, OctagonX, Search, MessageSquare, BarChart3, Flame, Users, Sparkles, } from 'lucide-react';
const API_URL = 'http://localhost:3001/admin';
const DEMO_URL = 'http://localhost:3001/demo';
const SOCKET_URL = 'http://localhost:3001';
export default function App() {
    const [teams, setTeams] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [violations, setViolations] = useState([]);
    const [powerups, setPowerups] = useState([]);
    const [helpRequests, setHelpRequests] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [contestStatus, setContestStatus] = useState('Unknown');
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('monitoring');
    const [hintInputs, setHintInputs] = useState({});
    const [searchFilter, setSearchFilter] = useState('');
    const [demoModeEnabled, setDemoModeEnabled] = useState(false);
    const [demoTeams, setDemoTeams] = useState([]);
    const [selectedDemoTeam, setSelectedDemoTeam] = useState('');
    const [demoStatus, setDemoStatus] = useState(null);
    const [demoLoading, setDemoLoading] = useState(null);
    const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('cq_admin_token'));
    const [loginInput, setLoginInput] = useState('');
    const [loginError, setLoginError] = useState(null);
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
        }
        catch (err) {
            console.error('Failed to load initial admin data:', err);
        }
    }, []);
    useEffect(() => {
        if (!adminToken)
            return;
        fetchData();
        axios.get(`${DEMO_URL}/status`).then(res => {
            setDemoModeEnabled(res.data.enabled);
        }).catch(() => { });
        Promise.all([
            axios.get(`${DEMO_URL}/teams`).catch(() => ({ data: [] })),
            axios.get('http://localhost:3001/api/test-teams').catch(() => ({ data: [] })),
        ]).then(([demoRes, testRes]) => {
            const testList = testRes.data.map((t) => ({ id: t.id, name: `${t.name} (test)`, email: '' }));
            const demoList = demoRes.data;
            const merged = [...testList, ...demoList];
            setDemoTeams(merged);
            if (merged.length > 0)
                setSelectedDemoTeam(merged[0].id);
        });
        const socket = io(SOCKET_URL, {
            auth: { adminSecret: adminToken }
        });
        window.adminSocket = socket;
        socket.on('connect', () => {
            console.log('[Admin Socket] Connected to stream');
            socket.emit('join:admin');
        });
        socket.on('admin:violation_alert', (alert) => {
            setViolations(prev => [
                { teamId: alert.teamId, type: alert.type, timestamp: new Date().toLocaleTimeString(), violationCount: alert.violationCount },
                ...prev.slice(0, 49),
            ]);
            fetchData();
        });
        socket.on('admin:powerup_used', (usage) => {
            setPowerups(prev => [
                { teamId: usage.teamId, type: usage.type, timestamp: new Date().toLocaleTimeString(), freezeDurationMs: usage.freezeDurationMs },
                ...prev.slice(0, 49),
            ]);
            fetchData();
        });
        socket.on('admin:hint_request', (req) => {
            setHelpRequests(prev => [req, ...prev.filter(r => r.id !== req.id)]);
            fetchData();
        });
        socket.on('admin:hint_answered', (data) => {
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
    const handleLogin = async (e) => {
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
        }
        catch (err) {
            if (err.response?.status === 401) {
                setLoginError('Invalid admin secret. Access denied.');
            }
            else {
                setLoginError('Backend unreachable — is the server running?');
            }
        }
        finally {
            setLoginLoading(false);
        }
    };
    const handleAction = async (action) => {
        setError(null);
        try {
            if (action === 'start')
                await axios.post(`${API_URL}/start-contest`);
            if (action === 'pause')
                await axios.post(`${API_URL}/pause-contest`);
            if (action === 'resume')
                await axios.post(`${API_URL}/resume-contest`);
            if (action === 'stop')
                await axios.post(`${API_URL}/emergency-stop`);
            fetchData();
        }
        catch (err) {
            setError(err.response?.data?.message || `Failed to execute ${action}`);
        }
    };
    const handleResumeTeam = async (teamId) => {
        try {
            await axios.post(`${API_URL}/resume-team`, { teamId });
            fetchData();
        }
        catch (err) {
            setError(`Failed to unlock team ${teamId}`);
        }
    };
    const demoAction = async (endpoint, body, label) => {
        setDemoLoading(label);
        setDemoStatus(null);
        try {
            const res = await axios.post(`${DEMO_URL}/${endpoint}`, body);
            setDemoStatus(`✓ ${res.data.message || 'Success'}`);
            fetchData();
        }
        catch (err) {
            setDemoStatus(`❌ Error: ${err.response?.data?.message || err.message}`);
        }
        finally {
            setDemoLoading(null);
        }
    };
    if (!adminToken) {
        return (_jsxs("div", { className: "min-h-screen bg-[#060812] text-slate-100 flex items-center justify-center p-6 font-sans relative overflow-hidden", children: [_jsx("div", { className: "absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" }), _jsx("div", { className: "absolute bottom-10 right-10 w-80 h-80 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" }), _jsxs("div", { className: "w-full max-w-md bg-slate-900/90 border-2 border-red-500/50 backdrop-blur-xl p-8 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.2)] z-10 select-none", children: [_jsxs("div", { className: "flex flex-col items-center mb-6 text-center", children: [_jsx("div", { className: "w-14 h-14 bg-red-500/10 border-2 border-red-500/80 rounded-2xl flex items-center justify-center text-red-500 mb-4 shadow-[0_0_20px_rgba(239,68,68,0.3)]", children: _jsx(Radio, { className: "w-8 h-8 animate-pulse" }) }), _jsx("h1", { className: "text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-400 uppercase", children: "SPIDER-VISION ADMIN" }), _jsx("p", { className: "text-xs font-mono text-slate-400 mt-1 uppercase tracking-wider", children: "Multiverse Command Center Authorization" })] }), _jsxs("form", { onSubmit: handleLogin, className: "space-y-5", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-xs font-mono text-slate-300 font-bold uppercase mb-2 tracking-wider", children: "Admin Security Token" }), _jsx("input", { type: "password", value: loginInput, onChange: e => setLoginInput(e.target.value), placeholder: "Enter ADMIN_SECRET...", className: "w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-red-500 transition-colors shadow-inner", autoFocus: true })] }), loginError && (_jsxs("div", { className: "bg-red-950/60 border border-red-500/60 rounded-xl p-3 text-xs font-mono text-red-300 flex items-center gap-2", children: [_jsx(AlertTriangle, { className: "w-4 h-4 text-red-400 flex-shrink-0" }), _jsx("span", { children: loginError })] })), _jsx("button", { type: "submit", disabled: loginLoading, className: "w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-mono text-xs font-black uppercase tracking-widest rounded-xl border border-red-400/30 shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2", children: loginLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" }), _jsx("span", { children: "Authorizing..." })] })) : (_jsxs(_Fragment, { children: [_jsx(ShieldAlert, { className: "w-4 h-4" }), _jsx("span", { children: "Connect to Console" })] })) })] })] })] }));
    }
    const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(searchFilter.toLowerCase()));
    const pendingRequestsCount = helpRequests.filter(r => r.status === 'PENDING').length;
    return (_jsxs("div", { className: "min-h-screen bg-[#070913] text-slate-100 p-6 font-sans relative overflow-x-hidden selection:bg-red-500 selection:text-white", children: [_jsx("div", { className: "fixed top-0 left-1/4 w-[600px] h-[600px] bg-red-600/5 rounded-full blur-[140px] pointer-events-none" }), _jsx("div", { className: "fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-sky-600/5 rounded-full blur-[140px] pointer-events-none" }), _jsxs("div", { className: "max-w-7xl mx-auto space-y-6 relative z-10", children: [_jsxs("header", { className: "bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.4)]", children: [_jsxs("div", { className: "flex items-center gap-3.5", children: [_jsx("div", { className: "w-12 h-12 bg-red-500/10 border border-red-500/40 rounded-xl flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]", children: _jsx(Radio, { className: "w-6 h-6 animate-pulse" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-300 uppercase", children: "\uD83D\uDD77 SPIDER-VISION ADMIN CONSOLE" }), _jsx("p", { className: "text-[11px] text-slate-400 font-mono mt-0.5 tracking-wider uppercase", children: "Real-Time Multiverse Telemetry & Tactical Command" })] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [demoModeEnabled && (_jsxs("div", { className: "bg-yellow-950/60 border border-yellow-500/60 px-3 py-1.5 rounded-lg text-xs font-mono text-yellow-400 flex items-center gap-2 animate-pulse", children: [_jsx(Sparkles, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "DEMO MODE ACTIVE" })] })), _jsxs("div", { className: "bg-slate-950/90 px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono flex items-center gap-2 shadow-inner", children: [_jsx("span", { className: "text-slate-400", children: "CONTEST STATUS:" }), _jsx("span", { className: `font-black px-2 py-0.5 rounded text-[10px] uppercase border ${contestStatus === 'RUNNING' ? 'bg-emerald-950 border-emerald-500 text-emerald-400' :
                                                    contestStatus === 'PAUSED' ? 'bg-amber-950 border-amber-500 text-amber-400 animate-pulse' :
                                                        'bg-rose-950 border-rose-500 text-rose-400'}`, children: contestStatus })] }), _jsx("button", { onClick: () => {
                                            sessionStorage.removeItem('cq_admin_token');
                                            setAdminToken(null);
                                        }, className: "px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold rounded-xl border border-slate-700 transition-colors", children: "Sign Out" })] })] }), _jsxs("section", { className: "bg-slate-900/60 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-3.5", children: [_jsxs("h2", { className: "text-xs font-mono font-black tracking-widest text-slate-300 uppercase flex items-center gap-2", children: [_jsx(Activity, { className: "w-4 h-4 text-red-500" }), "GLOBAL CONTEST CONTROLS"] }), error && (_jsxs("span", { className: "text-xs text-rose-400 font-mono font-bold flex items-center gap-1", children: [_jsx(AlertTriangle, { className: "w-3.5 h-3.5" }), " ", error] }))] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs", children: [_jsxs("button", { onClick: () => handleAction('start'), className: "px-4 py-3 bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold uppercase rounded-xl border border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]", children: [_jsx(Play, { className: "w-4 h-4" }), " Start Contest"] }), _jsxs("button", { onClick: () => handleAction('pause'), className: "px-4 py-3 bg-amber-600/90 hover:bg-amber-500 text-white font-bold uppercase rounded-xl border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]", children: [_jsx(Pause, { className: "w-4 h-4" }), " Pause Contest"] }), _jsxs("button", { onClick: () => handleAction('resume'), className: "px-4 py-3 bg-sky-600/90 hover:bg-sky-500 text-white font-bold uppercase rounded-xl border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]", children: [_jsx(RotateCcw, { className: "w-4 h-4" }), " Resume Contest"] }), _jsxs("button", { onClick: () => handleAction('stop'), className: "px-4 py-3 bg-rose-700/90 hover:bg-rose-600 text-white font-bold uppercase rounded-xl border border-rose-500/40 shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]", children: [_jsx(OctagonX, { className: "w-4 h-4" }), " Emergency Stop"] })] })] }), _jsx("nav", { className: "flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto", children: [
                            { id: 'monitoring', label: 'Operations Monitoring', icon: Activity, badge: null },
                            { id: 'tactical', label: 'Tactical Assistance', icon: MessageSquare, badge: pendingRequestsCount > 0 ? pendingRequestsCount : null },
                            { id: 'leaderboard', label: 'Championship Leaderboard', icon: Trophy, badge: null },
                            { id: 'analytics', label: 'Analytics & Telemetry', icon: BarChart3, badge: null },
                            { id: 'demo', label: 'Demo Controls', icon: Zap, badge: null },
                        ].map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border whitespace-nowrap cursor-pointer ${isActive
                                    ? 'bg-red-600 text-white border-red-400/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'}`, children: [_jsx(Icon, { className: "w-3.5 h-3.5" }), _jsx("span", { children: tab.label }), tab.badge !== null && (_jsx("span", { className: "bg-amber-400 text-black text-[10px] font-black px-1.5 py-0.2 rounded-full animate-bounce", children: tab.badge }))] }, tab.id));
                        }) }), activeTab === 'monitoring' && (_jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [_jsx("div", { className: "lg:col-span-2 space-y-4", children: _jsxs("div", { className: "bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-lg", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "text-xs font-mono font-black tracking-widest text-slate-300 uppercase flex items-center gap-2", children: [_jsx(Users, { className: "w-4 h-4 text-sky-400" }), " LIVE CONTESTANT TEAMS (", teams.length, ")"] }), _jsxs("div", { className: "relative w-48", children: [_jsx(Search, { className: "w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" }), _jsx("input", { type: "text", placeholder: "Search team...", value: searchFilter, onChange: e => setSearchFilter(e.target.value), className: "w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 font-mono text-xs text-white focus:outline-none focus:border-sky-500" })] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: filteredTeams.map(t => (_jsxs("div", { className: `border rounded-xl p-4 bg-slate-950/70 transition-all flex flex-col justify-between ${t.isDisqualified ? 'border-rose-600/80 bg-rose-950/20' :
                                                    t.isPaused ? 'border-amber-500/80 bg-amber-950/20' :
                                                        'border-slate-800 hover:border-slate-700'}`, children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3", children: [_jsx("span", { className: "font-bold text-sm text-white tracking-wide", children: t.name }), _jsx("span", { className: `font-mono text-[9px] font-bold px-2 py-0.5 rounded border uppercase ${t.isDisqualified ? 'bg-rose-950 border-rose-500 text-rose-300' :
                                                                            t.isPaused ? 'bg-amber-950 border-amber-500 text-amber-300 animate-pulse' :
                                                                                'bg-emerald-950 border-emerald-500 text-emerald-300'}`, children: t.isDisqualified ? 'Disqualified' : t.isPaused ? 'Paused' : 'Active' })] }), _jsxs("div", { className: "space-y-2 font-mono text-xs", children: [_jsxs("div", { className: "flex justify-between text-slate-400", children: [_jsx("span", { children: "Solved Missions:" }), _jsxs("span", { className: "text-emerald-400 font-bold", children: [t.solvedCount || 0, " / 10"] })] }), _jsxs("div", { className: "flex justify-between text-slate-400", children: [_jsx("span", { children: "Security Alerts:" }), _jsxs("span", { className: `font-bold ${t.violationCount > 0 ? 'text-amber-400' : 'text-slate-300'}`, children: [t.violationCount, " / 5"] })] }), _jsxs("div", { className: "flex justify-between text-slate-400", children: [_jsx("span", { children: "Spider-Sense Charges:" }), _jsx("span", { className: "text-yellow-400 font-bold", children: t.spiderSenseCharges })] })] })] }), t.isPaused && !t.isDisqualified && (_jsx("button", { onClick: () => handleResumeTeam(t.id), className: "mt-4 w-full py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer", children: "Unlock Team Terminal" }))] }, t.id))) })] }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-lg", children: [_jsxs("h3", { className: "text-xs font-mono font-black tracking-widest text-slate-300 uppercase mb-3 flex items-center gap-2", children: [_jsx(ShieldAlert, { className: "w-4 h-4 text-amber-500" }), " ANTI-CHEAT ALERTS"] }), _jsx("div", { className: "space-y-2 max-h-56 overflow-y-auto font-mono text-xs", children: violations.length === 0 ? (_jsx("p", { className: "text-slate-500 text-center py-4", children: "No violations logged." })) : (violations.map((v, idx) => (_jsxs("div", { className: "bg-amber-950/30 border border-amber-500/40 p-2.5 rounded-lg flex justify-between items-center text-amber-200", children: [_jsxs("div", { children: [_jsx("div", { className: "font-bold", children: v.teamId }), _jsx("div", { className: "text-[10px] text-amber-400/80", children: v.type })] }), _jsx("span", { className: "text-[10px] text-slate-400", children: v.timestamp })] }, idx)))) })] }), _jsxs("div", { className: "bg-slate-900/80 backdrop-blur-md border border-slate-800 p-5 rounded-2xl shadow-lg", children: [_jsxs("h3", { className: "text-xs font-mono font-black tracking-widest text-slate-300 uppercase mb-3 flex items-center gap-2", children: [_jsx(Zap, { className: "w-4 h-4 text-yellow-400" }), " POWERUP DISPATCH LOG"] }), _jsx("div", { className: "space-y-2 max-h-56 overflow-y-auto font-mono text-xs", children: powerups.length === 0 ? (_jsx("p", { className: "text-slate-500 text-center py-4", children: "No powerups activated." })) : (powerups.map((p, idx) => (_jsxs("div", { className: "bg-slate-950 border border-slate-800 p-2.5 rounded-lg flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("div", { className: "font-bold text-white", children: p.teamId }), _jsxs("div", { className: "text-[10px] text-yellow-400 font-bold", children: [p.type, " ", p.freezeDurationMs ? '(60s Time Freeze)' : ''] })] }), _jsx("span", { className: "text-[10px] text-slate-400", children: p.timestamp })] }, idx)))) })] })] })] })), activeTab === 'tactical' && (_jsxs("div", { className: "bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-lg space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-base font-black tracking-widest text-sky-400 uppercase flex items-center gap-2", children: [_jsx(MessageSquare, { className: "w-5 h-5" }), " TACTICAL ASSISTANCE QUEUE (SPIDER-COMMS)"] }), _jsx("p", { className: "font-mono text-xs text-slate-400 mt-1", children: "Direct Organizer Tactical Advice & Hint Dispatch Engine" })] }), _jsxs("div", { className: "flex items-center gap-3 font-mono text-xs font-bold", children: [_jsxs("span", { className: "bg-amber-950/80 border border-amber-500/60 text-amber-300 px-3 py-1.5 rounded-xl flex items-center gap-1.5", children: [_jsx("span", { className: "w-2 h-2 rounded-full bg-amber-400 animate-ping" }), "PENDING: ", pendingRequestsCount] }), _jsxs("span", { className: "bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 px-3 py-1.5 rounded-xl", children: ["ANSWERED: ", helpRequests.filter(r => r.status === 'ANSWERED').length] })] })] }), helpRequests.length === 0 ? (_jsx("div", { className: "bg-slate-950 border border-slate-800 p-12 text-center text-slate-500 font-mono text-xs rounded-xl", children: "No tactical assistance requests received from teams yet." })) : (_jsx("div", { className: "space-y-4", children: helpRequests.map((req) => (_jsxs("div", { className: `border-2 p-5 rounded-2xl bg-slate-950/80 shadow-md flex flex-col gap-3.5 transition-all ${req.status === 'PENDING' ? 'border-sky-500/80 bg-sky-950/15' : 'border-slate-800'}`, children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5", children: [_jsxs("div", { className: "flex items-center gap-3 font-mono", children: [_jsx("span", { className: "text-white font-bold text-sm", children: req.teamName || req.teamId }), _jsxs("span", { className: "bg-slate-900 border border-sky-500/40 text-sky-300 text-[10px] px-2.5 py-0.5 rounded-lg font-bold uppercase", children: ["TARGET MISSION: ", req.problemTitle || req.problemId] })] }), _jsxs("div", { className: "flex items-center gap-3 font-mono text-xs", children: [_jsx("span", { className: "text-slate-400", children: req.createdAt ? new Date(req.createdAt).toLocaleTimeString() : 'Just now' }), _jsx("span", { className: `font-bold px-2.5 py-0.5 rounded-md border text-[10px] uppercase ${req.status === 'PENDING' ? 'bg-amber-950 border-amber-500 text-amber-300 animate-pulse' :
                                                                'bg-emerald-950 border-emerald-500 text-emerald-300'}`, children: req.status })] })] }), req.status === 'PENDING' ? (_jsxs("div", { className: "space-y-3 pt-1", children: [_jsxs("div", { className: "font-mono text-xs text-amber-300/90 flex items-center gap-1.5", children: [_jsx(Flame, { className: "w-4 h-4 text-amber-400 animate-bounce" }), "Contestant team requested tactical guidance for ", _jsx("span", { className: "font-bold text-white", children: req.problemTitle || req.problemId }), ":"] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3", children: [_jsx("input", { type: "text", placeholder: "Type custom hint or tactical code guidance...", value: hintInputs[req.id] || '', onChange: (e) => setHintInputs(prev => ({ ...prev, [req.id]: e.target.value })), className: "flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-sky-400" }), _jsxs("button", { onClick: () => {
                                                                const text = hintInputs[req.id]?.trim();
                                                                if (!text)
                                                                    return;
                                                                const socket = window.adminSocket;
                                                                if (socket) {
                                                                    socket.emit('admin:send_hint', {
                                                                        requestId: req.id,
                                                                        hint: text,
                                                                        adminName: 'Spider-Vision Command HQ',
                                                                    });
                                                                    setHintInputs(prev => ({ ...prev, [req.id]: '' }));
                                                                }
                                                            }, className: "px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-black font-mono text-xs font-black uppercase rounded-xl border border-sky-300 shadow-[0_0_15px_rgba(14,165,233,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95", children: [_jsx(Send, { className: "w-3.5 h-3.5" }), " Send Tactical Intel"] })] })] })) : (_jsxs("div", { className: "bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl font-mono text-xs space-y-1.5", children: [_jsxs("div", { className: "flex justify-between text-slate-400 text-[10px]", children: [_jsxs("span", { children: ["DISPATCHED BY: ", req.answeredBy || 'HQ Admin'] }), _jsx("span", { children: req.answeredAt ? new Date(req.answeredAt).toLocaleTimeString() : '' })] }), _jsxs("div", { className: "text-yellow-300 font-bold", children: ["\"", req.hint, "\""] })] }))] }, req.id))) }))] })), activeTab === 'leaderboard' && (_jsxs("div", { className: "bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-lg space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center border-b border-slate-800 pb-3", children: [_jsxs("h3", { className: "text-sm font-black tracking-widest text-slate-200 uppercase flex items-center gap-2", children: [_jsx(Trophy, { className: "w-4 h-4 text-yellow-400" }), " OFFICIAL CHAMPIONSHIP LEADERBOARD"] }), _jsxs("span", { className: "font-mono text-xs text-slate-400", children: ["Total Teams: ", teams.length] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full font-mono text-xs text-left", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider", children: [_jsx("th", { className: "py-3 px-2", children: "Rank" }), _jsx("th", { className: "py-3 px-2", children: "Team Name" }), _jsx("th", { className: "py-3 px-2 text-center", children: "Solved" }), _jsx("th", { className: "py-3 px-2 text-center", children: "Penalty" }), _jsx("th", { className: "py-3 px-2 text-right", children: "Status" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-800/60", children: teams
                                                .sort((a, b) => (b.solvedCount || 0) - (a.solvedCount || 0) || (a.penalty || 0) - (b.penalty || 0))
                                                .map((t, idx) => (_jsxs("tr", { className: "hover:bg-slate-800/40 transition-colors", children: [_jsx("td", { className: "py-3.5 px-2 font-bold", children: idx === 0 ? '🥇 1st' : idx === 1 ? '🥈 2nd' : idx === 2 ? '🥉 3rd' : `#${idx + 1}` }), _jsx("td", { className: "py-3.5 px-2 font-bold text-white", children: t.name }), _jsxs("td", { className: "py-3.5 px-2 text-center text-emerald-400 font-bold", children: [t.solvedCount || 0, " / 10"] }), _jsxs("td", { className: "py-3.5 px-2 text-center text-rose-400 font-bold", children: [t.penalty || 0, " pts"] }), _jsx("td", { className: "py-3.5 px-2 text-right", children: _jsx("span", { className: `px-2 py-0.5 rounded border text-[10px] uppercase font-bold ${t.isDisqualified ? 'bg-rose-950 border-rose-500 text-rose-300' :
                                                                t.isPaused ? 'bg-amber-950 border-amber-500 text-amber-300' :
                                                                    'bg-emerald-950 border-emerald-500 text-emerald-300'}`, children: t.isDisqualified ? 'Disqualified' : t.isPaused ? 'Paused' : 'Active' }) })] }, t.id))) })] }) })] })), activeTab === 'analytics' && analytics && (_jsxs("div", { className: "bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-lg space-y-6", children: [_jsxs("h3", { className: "text-sm font-black tracking-widest text-slate-200 uppercase flex items-center gap-2", children: [_jsx(BarChart3, { className: "w-4 h-4 text-sky-400" }), " CONTEST ANALYTICS & TELEMETRY"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsxs("div", { className: "bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3 font-mono text-xs", children: [_jsx("h4", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1", children: "Missions Breakdown" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Most Solved:" }), " ", _jsx("span", { className: "text-emerald-400 font-bold", children: analytics.mostSolvedQuestion })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Most Bypassed:" }), " ", _jsx("span", { className: "text-yellow-400 font-bold", children: analytics.mostBypassedQuestion })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Most Failed:" }), " ", _jsx("span", { className: "text-rose-400 font-bold", children: analytics.mostFailedQuestion })] }), analytics.mostRequestedMission && (_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Most Requested:" }), " ", _jsx("span", { className: "text-sky-400 font-bold", children: analytics.mostRequestedMission })] }))] })] }), _jsxs("div", { className: "bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3 font-mono text-xs", children: [_jsx("h4", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1", children: "Performance Metrics" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Total Submissions:" }), " ", _jsx("span", { className: "text-white font-bold", children: submissions.length })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Avg Runtime:" }), " ", _jsxs("span", { className: "text-sky-400 font-bold", children: [analytics.averageRuntime, " ms"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Avg Memory:" }), " ", _jsxs("span", { className: "text-purple-400 font-bold", children: [analytics.averageMemory, " KB"] })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Fastest Solve:" }), " ", _jsxs("span", { className: "text-white font-bold", children: [analytics.fastestSolve, " ms"] })] })] })] }), _jsxs("div", { className: "bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3 font-mono text-xs", children: [_jsx("h4", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1", children: "Powerup Usage" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Spider-Sense:" }), " ", _jsx("span", { className: "text-yellow-400 font-bold", children: analytics.spiderSenseUsage })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Web-Fluid:" }), " ", _jsx("span", { className: "text-sky-400 font-bold", children: analytics.webFluidUsage || 0 })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Suit Tech:" }), " ", _jsx("span", { className: "text-purple-400 font-bold", children: analytics.suitTechUsage || 0 })] })] })] }), _jsxs("div", { className: "bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3 font-mono text-xs", children: [_jsx("h4", { className: "text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1", children: "Spider-Comms Intel" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Total Requests:" }), " ", _jsx("span", { className: "text-sky-400 font-bold", children: analytics.totalHintRequests || 0 })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Hints Sent:" }), " ", _jsx("span", { className: "text-emerald-400 font-bold", children: analytics.hintsSent || 0 })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { className: "text-slate-400", children: "Avg Response:" }), " ", _jsxs("span", { className: "text-white font-bold", children: [analytics.averageResponseTimeSec || 0, "s"] })] })] })] })] })] })), activeTab === 'demo' && (_jsxs("div", { className: "bg-slate-900/80 backdrop-blur-md border border-slate-800 p-6 rounded-2xl shadow-lg space-y-6", children: [_jsxs("h3", { className: "text-sm font-black tracking-widest text-yellow-400 uppercase flex items-center gap-2", children: [_jsx(Zap, { className: "w-4 h-4 text-yellow-400" }), " DEMO CONTROLS & PRESENTATION SUITE"] }), demoStatus && (_jsx("div", { className: `p-3.5 rounded-xl font-mono text-xs border ${demoStatus.startsWith('✓') ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : 'bg-rose-950/80 border-rose-500 text-rose-300'}`, children: demoStatus })), _jsxs("div", { className: "flex items-center gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800", children: [_jsx("label", { className: "text-xs font-mono text-slate-400 uppercase tracking-wider font-bold", children: "Target Team:" }), _jsx("select", { value: selectedDemoTeam, onChange: e => setSelectedDemoTeam(e.target.value), className: "bg-slate-900 border border-slate-700 text-white font-mono text-xs px-4 py-2 rounded-lg focus:outline-none focus:border-yellow-500", children: demoTeams.map(t => (_jsx("option", { value: t.id, children: t.name }, t.id))) })] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs", children: [_jsx("button", { disabled: Boolean(demoLoading), onClick: () => demoAction('solve-current', { teamId: selectedDemoTeam }, 'Solve Current'), className: "p-3 bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold rounded-xl border border-emerald-400/40 transition-colors cursor-pointer disabled:opacity-50", children: demoLoading === 'Solve Current' ? 'Executing...' : 'Solve Current Mission' }), _jsx("button", { disabled: Boolean(demoLoading), onClick: () => demoAction('solve-next', { teamId: selectedDemoTeam }, 'Solve Next'), className: "p-3 bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold rounded-xl border border-emerald-400/40 transition-colors cursor-pointer disabled:opacity-50", children: demoLoading === 'Solve Next' ? 'Executing...' : 'Solve Next Mission' }), _jsx("button", { disabled: Boolean(demoLoading), onClick: () => demoAction('trigger-powerup', { teamId: selectedDemoTeam, type: 'WEB_FLUID' }, 'Trigger Web-Fluid'), className: "p-3 bg-sky-600/80 hover:bg-sky-500 text-white font-bold rounded-xl border border-sky-400/40 transition-colors cursor-pointer disabled:opacity-50", children: demoLoading === 'Trigger Web-Fluid' ? 'Executing...' : 'Trigger Web-Fluid (Freeze)' }), _jsx("button", { disabled: Boolean(demoLoading), onClick: () => demoAction('simulate-violation', { teamId: selectedDemoTeam, type: 'TAB_SWITCH' }, 'Simulate Violation'), className: "p-3 bg-rose-600/80 hover:bg-rose-500 text-white font-bold rounded-xl border border-rose-400/40 transition-colors cursor-pointer disabled:opacity-50", children: demoLoading === 'Simulate Violation' ? 'Executing...' : 'Simulate Security Violation' })] })] }))] })] }));
}
//# sourceMappingURL=App.js.map