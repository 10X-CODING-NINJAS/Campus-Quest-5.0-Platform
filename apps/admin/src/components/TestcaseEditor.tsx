import { useState } from 'react';

interface TestcaseItem {
  num: number;
  type: 'sample' | 'hidden';
  input: string;
  output: string;
}

interface TestcaseEditorProps {
  problemId: string;
  samples: TestcaseItem[];
  hidden: TestcaseItem[];
  adminToken: string;
  apiUrl: string;
  onChanged: () => void;
}

export default function TestcaseEditor({
  problemId,
  samples,
  hidden,
  adminToken,
  apiUrl,
  onChanged,
}: TestcaseEditorProps) {
  const [editingTC, setEditingTC] = useState<TestcaseItem | null>(null);
  const [newTC, setNewTC] = useState<{ type: 'sample' | 'hidden'; input: string; output: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = { 'x-admin-token': adminToken, 'Content-Type': 'application/json' };

  const handleAdd = async () => {
    if (!newTC) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/admin/problems/${problemId}/testcases`, {
        method: 'POST',
        headers,
        body: JSON.stringify(newTC),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to add testcase');
      }
      setNewTC(null);
      onChanged();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (tc: TestcaseItem) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/admin/problems/${problemId}/testcases/${tc.num}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ type: tc.type, input: tc.input, output: tc.output }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update testcase');
      }
      setEditingTC(null);
      onChanged();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (num: number, type: 'sample' | 'hidden') => {
    if (!confirm(`Delete testcase #${num} (${type})?`)) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/admin/problems/${problemId}/testcases/${num}`, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete testcase');
      }
      onChanged();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleType = async (num: number, from: 'sample' | 'hidden') => {
    const to = from === 'sample' ? 'hidden' : 'sample';
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiUrl}/admin/problems/${problemId}/testcases/${num}/type`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ from, to }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to change testcase type');
      }
      onChanged();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderTestcaseRow = (tc: TestcaseItem, isEditing: boolean) => {
    if (isEditing && editingTC) {
      return (
        <div key={`${tc.type}-${tc.num}`} className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              Editing {tc.type === 'sample' ? 'Sample' : 'Hidden'} #{tc.num}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdate(editingTC)}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditingTC(null)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Input</label>
            <textarea
              value={editingTC.input}
              onChange={(e) => setEditingTC({ ...editingTC, input: e.target.value })}
              className="w-full h-24 font-mono text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-y"
              spellCheck={false}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Expected Output</label>
            <textarea
              value={editingTC.output}
              onChange={(e) => setEditingTC({ ...editingTC, output: e.target.value })}
              className="w-full h-24 font-mono text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-y"
              spellCheck={false}
            />
          </div>
        </div>
      );
    }

    return (
      <div
        key={`${tc.type}-${tc.num}`}
        className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors group"
      >
        <div className="flex-shrink-0 mt-0.5">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              tc.type === 'sample'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {tc.type === 'sample' ? '👁 Sample' : '🔒 Hidden'} #{tc.num}
          </span>
        </div>
        <div className="flex-1 min-w-0 grid grid-cols-2 gap-3">
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Input</span>
            <pre className="text-xs font-mono bg-slate-50 rounded p-2 overflow-auto max-h-20 text-slate-700 whitespace-pre-wrap break-all">
              {tc.input.length > 300 ? tc.input.slice(0, 300) + '…' : tc.input || '(empty)'}
            </pre>
          </div>
          <div>
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">Output</span>
            <pre className="text-xs font-mono bg-slate-50 rounded p-2 overflow-auto max-h-20 text-slate-700 whitespace-pre-wrap break-all">
              {tc.output.length > 300 ? tc.output.slice(0, 300) + '…' : tc.output || '(empty)'}
            </pre>
          </div>
        </div>
        <div className="flex-shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditingTC({ ...tc })}
            title="Edit"
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button
            onClick={() => handleToggleType(tc.num, tc.type)}
            title={tc.type === 'sample' ? 'Move to Hidden' : 'Move to Sample'}
            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>
          </button>
          <button
            onClick={() => handleDelete(tc.num, tc.type)}
            title="Delete"
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-800">
          Testcases
          <span className="ml-2 text-sm font-normal text-slate-500">
            {samples.length} sample · {hidden.length} hidden
          </span>
        </h3>
        <button
          onClick={() => setNewTC({ type: 'sample', input: '', output: '' })}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Testcase
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* New testcase form */}
      {newTC && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-700">New Testcase</span>
            <div className="flex gap-2">
              <select
                value={newTC.type}
                onChange={(e) => setNewTC({ ...newTC, type: e.target.value as 'sample' | 'hidden' })}
                className="text-xs border border-blue-300 rounded-md px-2 py-1 bg-white text-slate-700"
              >
                <option value="sample">Sample</option>
                <option value="hidden">Hidden</option>
              </select>
              <button
                onClick={handleAdd}
                disabled={loading}
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Adding…' : 'Add'}
              </button>
              <button
                onClick={() => setNewTC(null)}
                className="px-3 py-1.5 text-xs font-medium bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Input</label>
            <textarea
              value={newTC.input}
              onChange={(e) => setNewTC({ ...newTC, input: e.target.value })}
              className="w-full h-24 font-mono text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-y"
              placeholder="Enter test input..."
              spellCheck={false}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Expected Output</label>
            <textarea
              value={newTC.output}
              onChange={(e) => setNewTC({ ...newTC, output: e.target.value })}
              className="w-full h-24 font-mono text-sm border border-slate-300 rounded-md px-3 py-2 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-y"
              placeholder="Enter expected output..."
              spellCheck={false}
            />
          </div>
        </div>
      )}

      {/* Sample testcases */}
      {samples.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Sample Testcases</h4>
          {samples.map((tc) =>
            renderTestcaseRow(
              tc,
              editingTC?.type === tc.type && editingTC?.num === tc.num,
            ),
          )}
        </div>
      )}

      {/* Hidden testcases */}
      {hidden.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-600">Hidden Testcases</h4>
          {hidden.map((tc) =>
            renderTestcaseRow(
              tc,
              editingTC?.type === tc.type && editingTC?.num === tc.num,
            ),
          )}
        </div>
      )}

      {samples.length === 0 && hidden.length === 0 && !newTC && (
        <div className="text-center py-8 text-slate-400 text-sm">
          No testcases yet. Click "Add Testcase" to create one.
        </div>
      )}
    </div>
  );
}
