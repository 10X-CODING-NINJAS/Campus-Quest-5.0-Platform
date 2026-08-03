import React, { useState, useEffect } from 'react';
import loginBg from '../../Assets/LoginPage.png';
import { connectSocket, API_BASE } from '../lib/socket';

interface LoginPageProps {
  onLogin: (teamId: string, teamName: string) => void;
}

interface TestTeam {
  id: string;
  name: string;
  password: string;
}

// Hardcoded fallback — shown even if backend fetch fails
const FALLBACK_TEST_TEAMS: TestTeam[] = [
  { id: 'test-team-alpha', name: 'Spider Squad',  password: 'spider123'  },
  { id: 'test-team-beta',  name: 'Iron Coders',   password: 'iron456'    },
  { id: 'test-team-gamma', name: 'Web Slingers',  password: 'web789'     },
  { id: 'test-team-delta', name: 'Quantum Devs',  password: 'quantum000' },
];

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [testTeams, setTestTeams] = useState<TestTeam[]>(FALLBACK_TEST_TEAMS);

  // Try to load any extra test teams from backend (optional — fallback is always shown)
  useEffect(() => {
    fetch(`${API_BASE}/api/test-teams`)
      .then(r => r.ok ? r.json() : null)
      .then((data: TestTeam[] | null) => { if (data?.length) setTestTeams(data); })
      .catch(() => {}); // silent — fallback list is already set
  }, []);

  const doLogin = async (name: string, pwd: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName: name, password: pwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'INVALID CREDENTIALS, HERO!');
        return;
      }
      // Re-attach socket with correct token auth
      connectSocket(data.token);
      onLogin(data.teamId, data.teamName);
    } catch {
      setError('BACKEND UNREACHABLE — IS THE SERVER RUNNING?');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !password.trim()) {
      setError('ALL FIELDS REQUIRED, HERO!');
      return;
    }
    doLogin(teamName.trim(), password.trim());
  };

  return (
    <div className="h-screen w-screen bg-[#000000] flex items-center justify-center overflow-hidden select-none">
      {/* Halftone texture overlay for comic printed feel */}
      <div className="absolute inset-0 comic-halftone opacity-30 pointer-events-none z-0" />

      {/* Aspect-ratio locked container to map coordinates perfectly to the image */}
      <div
        className="relative w-full h-full max-w-[1448px] max-h-[1086px] aspect-[1448/1086] bg-contain bg-center bg-no-repeat flex items-center justify-center z-10"
        style={{ backgroundImage: `url(${loginBg})` }}
      >

        {/* Error Message */}
        {error && (
          <div className="absolute left-1/2 -translate-x-1/2 top-[24%] z-30 bg-red-600 border-4 border-black text-white px-6 py-2 font-display text-xl tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-1 animate-bounce">
            {error}
          </div>
        )}

        {/* Inputs container */}
        <div className="absolute left-1/2 top-[51%] -translate-x-1/2 -translate-y-1/2 w-[32%] min-w-[280px] flex flex-col gap-6 z-20">

          {/* Team Name Input */}
          <div className="flex flex-col gap-1 relative">
            <label className="absolute -top-3 left-4 font-display text-sm md:text-base text-black tracking-wide bg-yellow-400 border-2 border-black px-2 py-0.5 transform -rotate-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
              TEAM NAME
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full bg-white border-4 border-black p-3 pt-4 text-black font-sans font-bold text-base md:text-lg focus:outline-none focus:bg-yellow-50 placeholder-black/30 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors"
              placeholder="e.g. Spider Squad"
              onKeyDown={e => e.key === 'Enter' && handleSubmit(e as any)}
            />
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1 relative mt-2">
            <label className="absolute -top-3 left-4 font-display text-sm md:text-base text-black tracking-wide bg-blue-400 border-2 border-black px-2 py-0.5 transform rotate-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] z-10">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border-4 border-black p-3 pt-4 text-black font-sans font-bold text-base md:text-lg focus:outline-none focus:bg-blue-50 placeholder-black/30 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-colors"
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && handleSubmit(e as any)}
            />
          </div>

          {/* Quick-Login dev buttons — always shown from hardcoded list */}
          <div className="mt-1">
            <div className="text-[10px] font-mono font-bold text-black/60 uppercase tracking-widest mb-1.5 text-center">
              ⚡ QUICK LOGIN (Dev Mode)
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {testTeams.map(t => (
                <button
                  key={t.id}
                  onClick={() => doLogin(t.name, t.password)}
                  disabled={loading}
                  className="bg-yellow-400 hover:bg-yellow-300 border-2 border-black text-black font-bold text-[11px] py-1.5 px-2 shadow-[2px_2px_0_#000] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all truncate disabled:opacity-50"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Circular Login Button — sits over the background LOGIN button */}
        <button
          onClick={handleSubmit}
          type="button"
          disabled={loading}
          className="absolute left-[49.7%] top-[77.4%] -translate-x-1/2 -translate-y-1/2 w-[10.5%] aspect-square rounded-full cursor-pointer z-20 outline-none group bg-transparent"
          title="TRANSMIT CREDENTIALS"
        >
          <div className={`absolute inset-0 rounded-full bg-transparent group-hover:bg-red-600/10 group-hover:scale-105 group-active:scale-95 group-hover:shadow-[0_0_25px_rgba(239,68,68,0.7)] border-4 border-transparent group-hover:border-red-500/40 transition-all duration-200 ${loading ? 'animate-pulse' : ''}`} />
        </button>

      </div>
    </div>
  );
}
