import { useState } from 'react';

export interface HealthCheckItem {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
}

export interface HealthCheckReport {
  status: 'READY TO START' | 'FAILED';
  timestamp: string;
  checks: HealthCheckItem[];
}

interface ContestHealthCheckProps {
  adminToken: string;
  apiUrl: string;
}

export default function ContestHealthCheck({ adminToken, apiUrl }: ContestHealthCheckProps) {
  const [report, setReport] = useState<HealthCheckReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runHealthCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/admin/contest/health-check`, {
        method: 'POST',
        headers: {
          'x-admin-token': adminToken,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error('Health check request failed');
      }

      const data: HealthCheckReport = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred running the health check');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Contest Health Check</h2>
        <p className="text-sm text-slate-500 mb-6">
          Validate the active infrastructure services, Docker availability, database connectivity, and problems configuration prior to initiating the contest.
        </p>

        <button
          onClick={runHealthCheck}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running checks...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              Run Contest Validation
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {report && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">CONTEST VERDICT</span>
              <span className={`text-2xl font-black ${report.status === 'READY TO START' ? 'text-emerald-600 animate-pulse' : 'text-red-600'}`}>
                {report.status}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Executed At</span>
              <span className="text-sm font-medium text-slate-600 font-mono">
                {new Date(report.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {report.checks.map((check, idx) => (
              <div key={idx} className="p-6 flex items-start gap-4 hover:bg-slate-50/20 transition-colors">
                <div className="flex-shrink-0 mt-0.5">
                  {check.status === 'passed' && (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                      ✓
                    </span>
                  )}
                  {check.status === 'failed' && (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600">
                      ✗
                    </span>
                  )}
                  {check.status === 'warning' && (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-600">
                      !
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-800">{check.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{check.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
