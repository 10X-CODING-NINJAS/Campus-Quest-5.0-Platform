import { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000/admin';

export default function App() {
  const [status, setStatus] = useState<string>('Unknown');
  const [error, setError] = useState<string | null>(null);

  const handleAction = async (action: 'start' | 'pause' | 'resume') => {
    try {
      setError(null);
      let endpoint = '';
      if (action === 'start') endpoint = '/start-contest';
      else if (action === 'pause') endpoint = '/pause-contest';
      else if (action === 'resume') endpoint = '/resume-contest';
      
      const res = await axios.post(`${API_URL}${endpoint}`);
      setStatus(res.data.status || 'Success');
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
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
              {error}
            </div>
          )}

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
              onClick={() => handleAction('resume')}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium shadow flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>
              Stop Contest
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-slate-50 rounded-lg text-sm text-slate-600">
            Last Action Status: <span className="font-mono font-bold text-slate-800">{status}</span>
          </div>
        </section>
        
      </div>
    </div>
  );
}
