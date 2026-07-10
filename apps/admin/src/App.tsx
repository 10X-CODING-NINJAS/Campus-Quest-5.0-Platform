import { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const CONTEST_STATES = ['WAITING', 'DIAGNOSTICS', 'LOBBY', 'LIVE', 'PAUSED', 'MISSION_MODE', 'ENDED'] as const;
type ContestState = (typeof CONTEST_STATES)[number];
type TeamRow = {
  id: string;
  name: string;
  email: string;
  violationCount: number;
  isPaused: boolean;
  isDisqualified: boolean;
  spiderSenseCharges: number;
  questionsSolved: number;
  hintProgress: 0 | 1 | 2 | 3;
  missionCompleted: boolean;
  createdAt: string;
};

export default function App() {
  const [status, setStatus] = useState<string>('Unknown');
  const [error, setError] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState('change-me-in-production');
  const [contestState, setContestState] = useState<ContestState>('WAITING');
  const [teams, setTeams] = useState<TeamRow[]>([]);

  useEffect(() => {
    const s = io(API_URL, { transports: ['websocket', 'polling'] });
    s.on('contest:state', (snapshot: { state: ContestState }) => {
      setContestState(snapshot.state);
    });
    const refreshTeams = async () => {
      try {
        const res = await axios.get(`${API_URL}/admin/teams`, {
          headers: { 'x-admin-token': adminToken },
        });
        setTeams(res.data);
      } catch {}
    };
    s.on('hint:update', refreshTeams);
    s.on('connect', refreshTeams);

    axios.get(`${API_URL}/admin/contest/state`)
      .then((res) => {
        if (CONTEST_STATES.includes(res.data.state)) {
          setContestState(res.data.state);
          setStatus(`Current state: ${res.data.state}`);
        }
      })
      .catch(() => setStatus('Unable to load current state'));

    return () => {
      s.off('contest:state');
      s.off('hint:update');
      s.off('connect');
      s.disconnect();
    };
  }, []);

  const handleAction = async (action: 'start' | 'pause' | 'end') => {
    try {
      setError(null);
      let endpoint = '';
      if (action === 'start') endpoint = '/admin/contest/start';
      else if (action === 'pause') endpoint = '/admin/contest/pause';
      else if (action === 'end') endpoint = '/admin/contest/end';
      
      const res = await axios.post(`${API_URL}${endpoint}`, null, {
        headers: { 'x-admin-token': adminToken },
      });
      setStatus(res.data.message || 'Success');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    }
  };

  const handleStateChange = async (state: ContestState) => {
    try {
      setError(null);
      const res = await axios.post(`${API_URL}/admin/contest/state`, { state }, {
        headers: { 'x-admin-token': adminToken },
      });
      setContestState(res.data.contestState.state);
      setStatus(res.data.message || `Contest state changed to ${state}`);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'An error occurred');
    }
  };

    return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h1 className="text-3xl font-bold text-slate-800">Campus Quest - Admin Portal</h1>
          <p className="text-slate-500 mt-2">Manage the contest state and monitor teams.</p>
        </header>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-4">Contest Controls</h2>

          <label className="block mb-4 text-sm font-medium text-slate-700">
            Admin token
            <input
              type="password"
              value={adminToken}
              onChange={(event) => setAdminToken(event.target.value)}
              className="mt-1 block w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="mb-6">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Central Contest State
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {CONTEST_STATES.map((state) => (
                <button
                  key={state}
                  onClick={() => handleStateChange(state)}
                  className={`rounded-lg border px-4 py-3 text-sm font-bold shadow-sm ${
                    contestState === state
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {state.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => handleAction('start')}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>
              Start Contest
            </button>
            <button
              onClick={() => handleAction('pause')}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium shadow flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
              Pause Contest
            </button>
            <button
              onClick={() => handleAction('end')}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium shadow flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
              End Contest
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-slate-50 rounded-lg text-sm text-slate-600">
            Last Action Status: <span className="font-mono font-bold text-slate-800">{status}</span>
          </div>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-4">Live Team Progress</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500 uppercase text-xs">
                <tr>
                  <th className="py-2">Team</th>
                  <th className="py-2">Solved</th>
                  <th className="py-2">Hint Progress</th>
                  <th className="py-2">Mission</th>
                  <th className="py-2">Contest</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => (
                  <tr key={team.id} className="border-t border-slate-200">
                    <td className="py-3 font-medium text-slate-800">{team.name}</td>
                    <td className="py-3 text-slate-700">{team.questionsSolved} / 10</td>
                    <td className="py-3 text-slate-700">{team.hintProgress} / 3</td>
                    <td className="py-3 text-slate-700">{team.missionCompleted ? 'Completed' : 'In Progress'}</td>
                    <td className="py-3 text-slate-700">{contestState}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        
      </div>
    </div>
  );
}
