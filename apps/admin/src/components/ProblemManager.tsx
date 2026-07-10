import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import ProblemEditor from './ProblemEditor';

interface ProblemRow {
  id: string;
  title: string;
  difficulty: string;
  timeLimit: number;
  memoryLimit: number;
  order: number | null;
  enabled: boolean;
  sampleCount: number;
  hiddenCount: number;
  readyStatus: 'draft' | 'validating' | 'ready' | 'published';
  lastValidation: {
    status: 'passed' | 'failed' | 'warning';
    timestamp: string;
  } | null;
}

interface ProblemManagerProps {
  adminToken: string;
  apiUrl: string;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Easy: 'bg-emerald-100 text-emerald-700',
  Medium: 'bg-amber-100 text-amber-700',
  Hard: 'bg-red-100 text-red-700',
};

export default function ProblemManager({ adminToken, apiUrl }: ProblemManagerProps) {
  const [problems, setProblems] = useState<ProblemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null | undefined>(undefined); // undefined = closed, null = new, string = editing

  const headers = { 'x-admin-token': adminToken, 'Content-Type': 'application/json' };

  const fetchProblems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/admin/problems`, {
        headers: { 'x-admin-token': adminToken },
      });
      if (!res.ok) throw new Error('Failed to load problems');
      const data: ProblemRow[] = await res.json();
      setProblems(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, adminToken]);

  // Initial load + Socket.IO live sync
  useEffect(() => {
    fetchProblems();
    const socket = io(apiUrl, { transports: ['websocket', 'polling'] });
    socket.on('problems:updated', () => {
      fetchProblems();
    });
    return () => {
      socket.off('problems:updated');
      socket.disconnect();
    };
  }, [fetchProblems, apiUrl]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?\n\nThis will permanently remove the problem and all its testcases.`)) return;
    try {
      const res = await fetch(`${apiUrl}/admin/problems/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete');
      }
      fetchProblems();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`${apiUrl}/admin/problems/${id}/duplicate`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to duplicate');
      }
      fetchProblems();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleEnabled = async (id: string, currentEnabled: boolean) => {
    try {
      const res = await fetch(`${apiUrl}/admin/problems/${id}/enabled`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to toggle');
      }
      fetchProblems();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMoveOrder = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= problems.length) return;

    // Build new order array
    const newProblems = [...problems];
    const [moved] = newProblems.splice(index, 1);
    newProblems.splice(targetIndex, 0, moved);

    const orderPayload = newProblems.map((p, i) => ({ id: p.id, order: i + 1 }));

    // Optimistic update
    setProblems(newProblems.map((p, i) => ({ ...p, order: i + 1 })));

    try {
      const res = await fetch(`${apiUrl}/admin/problems/reorder`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ order: orderPayload }),
      });
      if (!res.ok) {
        fetchProblems(); // rollback
      }
    } catch {
      fetchProblems(); // rollback
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Problem Manager</h2>
          <p className="text-sm text-slate-500 mt-1">
            {problems.length} problem{problems.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchProblems}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Refresh
          </button>
          <button
            onClick={() => setEditingId(null)}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Problem
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider w-12">#</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Title</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider w-24">Difficulty</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider w-20">Enabled</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider w-16">Order</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider w-28">Testcases</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider w-28">Verification</th>
                <th className="text-center py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider w-24">Published</th>
                <th className="text-right py-3 px-4 font-semibold text-slate-500 text-xs uppercase tracking-wider w-48">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && problems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Loading problems…
                    </div>
                  </td>
                </tr>
              ) : problems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    <div className="space-y-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-slate-300"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                      <p>No problems yet. Create your first problem to get started.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                problems.map((p, index) => (
                  <tr
                    key={p.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group"
                  >
                    {/* Row number */}
                    <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                      {index + 1}
                    </td>

                    {/* Title + id */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors">
                        {p.title}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{p.id}</div>
                    </td>

                    {/* Difficulty */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${DIFFICULTY_COLORS[p.difficulty] || 'bg-slate-100 text-slate-700'}`}>
                        {p.difficulty}
                      </span>
                    </td>

                    {/* Enabled toggle */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleToggleEnabled(p.id, p.enabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                          p.enabled ? 'bg-blue-600' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                            p.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Order + reorder buttons */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleMoveOrder(index, -1)}
                          disabled={index === 0}
                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          title="Move up"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                        </button>
                        <span className="text-xs font-mono text-slate-500 min-w-[20px] text-center">
                          {p.order ?? '—'}
                        </span>
                        <button
                          onClick={() => handleMoveOrder(index, 1)}
                          disabled={index === problems.length - 1}
                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                          title="Move down"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                      </div>
                    </td>

                    {/* Testcase counts */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded font-medium" title="Sample testcases">
                          👁 {p.sampleCount}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded font-medium" title="Hidden testcases">
                          🔒 {p.hiddenCount}
                        </span>
                      </div>
                    </td>

                    {/* Verification status */}
                    <td className="py-3 px-4 text-center">
                      {p.lastValidation ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          p.lastValidation.status === 'passed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                          p.lastValidation.status === 'warning' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-red-50 text-red-600 border-red-200'
                        }`}>
                          {p.lastValidation.status.toUpperCase()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                          Unvalidated
                        </span>
                      )}
                    </td>

                    {/* Published status (readyStatus) */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium uppercase ${
                        p.readyStatus === 'published' ? 'bg-purple-100 text-purple-700' :
                        p.readyStatus === 'ready' ? 'bg-emerald-100 text-emerald-700' :
                        p.readyStatus === 'validating' ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {p.readyStatus || 'draft'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditingId(p.id)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button
                          onClick={() => handleDuplicate(p.id)}
                          className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                          title="Duplicate"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.title)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Problem Editor Modal */}
      {editingId !== undefined && (
        <ProblemEditor
          problemId={editingId}
          adminToken={adminToken}
          apiUrl={apiUrl}
          onClose={() => setEditingId(undefined)}
          onSaved={fetchProblems}
        />
      )}
    </div>
  );
}
