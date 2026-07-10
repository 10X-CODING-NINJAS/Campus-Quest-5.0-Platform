import { useState, useEffect } from 'react';
import TestcaseEditor from './TestcaseEditor';

interface TestcaseItem {
  num: number;
  type: 'sample' | 'hidden';
  input: string;
  output: string;
}



interface ProblemEditorProps {
  problemId: string | null; // null = creating new
  adminToken: string;
  apiUrl: string;
  onClose: () => void;
  onSaved: () => void;
}

const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];
const CHECKER_OPTIONS = ['default', 'float', 'unordered', 'case-insensitive', 'custom'];
const LANG_TABS = [
  { key: 'c', label: 'C' },
  { key: 'cpp', label: 'C++' },
  { key: 'java', label: 'Java' },
  { key: 'python', label: 'Python' },
];

export default function ProblemEditor({
  problemId,
  adminToken,
  apiUrl,
  onClose,
  onSaved,
}: ProblemEditorProps) {
  const isNew = problemId === null;

  // Form state
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [timeLimit, setTimeLimit] = useState(2000);
  const [memoryLimit, setMemoryLimit] = useState(256);
  const [checkerType, setCheckerType] = useState('default');
  const [statement, setStatement] = useState('');
  const [starterCode, setStarterCode] = useState<Record<string, string>>({
    c: '', cpp: '', java: '', python: '',
  });
  const [referenceSolution, setReferenceSolution] = useState<{ language: string; code: string } | null>(null);
  const [samples, setSamples] = useState<TestcaseItem[]>([]);
  const [hidden, setHidden] = useState<TestcaseItem[]>([]);
  const [activeLang, setActiveLang] = useState('c');
  const [activeTab, setActiveTab] = useState<'meta' | 'statement' | 'starter' | 'reference' | 'testcases'>('meta');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const headers = { 'x-admin-token': adminToken, 'Content-Type': 'application/json' };

  // Load existing problem data
  useEffect(() => {
    if (!problemId) return;
    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${apiUrl}/admin/problems/${problemId}`, { headers });
        if (!res.ok) throw new Error('Failed to load problem');
        const data: any = await res.json();
        setTitle(data.title);
        setDifficulty(data.difficulty);
        setTimeLimit(data.timeLimit);
        setMemoryLimit(data.memoryLimit);
        setCheckerType(data.checkerType);
        setStatement(data.statement);
        setStarterCode({
          c: data.starterCode?.c ?? '',
          cpp: data.starterCode?.cpp ?? '',
          java: data.starterCode?.java ?? '',
          python: data.starterCode?.python ?? '',
        });
        setReferenceSolution(data.referenceSolution ? {
          language: data.referenceSolution.language,
          code: data.referenceSolution.code
        } : { language: 'cpp', code: '' });
        setSamples(data.samples);
        setHidden(data.hidden);
        setLoadedId(data.id);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [problemId]);

  const refreshTestcases = async () => {
    const id = loadedId || problemId;
    if (!id) return;
    try {
      const res = await fetch(`${apiUrl}/admin/problems/${id}`, { headers });
      if (res.ok) {
        const data: any = await res.json();
        setSamples(data.samples);
        setHidden(data.hidden);
      }
    } catch {}
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isNew) {
        // Create new problem
        const res = await fetch(`${apiUrl}/admin/problems`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ title, difficulty, timeLimit, memoryLimit, statement }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to create problem');
        }
        const data = await res.json();
        setLoadedId(data.id);

        // Now update starter code & reference solution
        await fetch(`${apiUrl}/admin/problems/${data.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            checkerType,
            starterCode,
            referenceSolution: referenceSolution?.code ? referenceSolution : undefined
          }),
        });

        setSuccessMsg(`Problem "${title}" created! You can now add testcases.`);
        // Switch to testcases tab
        setActiveTab('testcases');
        onSaved();
      } else {
        // Update existing problem
        const res = await fetch(`${apiUrl}/admin/problems/${problemId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            title,
            difficulty,
            timeLimit,
            memoryLimit,
            checkerType,
            statement,
            starterCode,
            referenceSolution: referenceSolution?.code ? referenceSolution : undefined,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to update problem');
        }
        setSuccessMsg('Problem saved successfully!');
        onSaved();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
        <div className="bg-white rounded-2xl p-10 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-slate-600 font-medium">Loading problem…</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-stretch justify-center overflow-hidden">
      <div className="w-full max-w-5xl my-4 mx-4 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {isNew ? 'Create New Problem' : `Edit: ${title}`}
            </h2>
            {loadedId && (
              <span className="text-xs font-mono text-slate-400 mt-0.5 block">ID: {loadedId}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                  {isNew ? 'Create Problem' : 'Save Changes'}
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mx-6 mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            {successMsg}
          </div>
        )}

        {/* Tab bar */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/50">
          {([
            { key: 'meta', label: 'Metadata' },
            { key: 'statement', label: 'Statement' },
            { key: 'starter', label: 'Starter Code' },
            { key: 'reference', label: 'Reference Solution' },
            { key: 'testcases', label: 'Testcases' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Metadata tab */}
          {activeTab === 'meta' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="e.g. Two Sum"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    {DIFFICULTY_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Checker Type</label>
                  <select
                    value={checkerType}
                    onChange={(e) => setCheckerType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    {CHECKER_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Time Limit (ms)</label>
                  <input
                    type="number"
                    value={timeLimit}
                    onChange={(e) => setTimeLimit(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                    min={100}
                    max={30000}
                    step={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Memory Limit (MB)</label>
                  <input
                    type="number"
                    value={memoryLimit}
                    onChange={(e) => setMemoryLimit(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                    min={16}
                    max={1024}
                    step={16}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Statement tab */}
          {activeTab === 'statement' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-slate-700">
                  Problem Statement (Markdown)
                </label>
                <span className="text-xs text-slate-400">
                  Include: Input Format, Output Format, Constraints, Examples
                </span>
              </div>
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                className="w-full h-[calc(100vh-340px)] min-h-[400px] font-mono text-sm border border-slate-300 rounded-lg px-4 py-3 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none leading-relaxed"
                placeholder={`# Problem Title\n\nProblem description here...\n\n## Input Format\n\n## Output Format\n\n## Constraints\n\n## Sample Input 1\n\n\`\`\`\n\n\`\`\`\n\n## Sample Output 1\n\n\`\`\`\n\n\`\`\``}
                spellCheck={false}
              />
            </div>
          )}

          {/* Starter Code tab */}
          {activeTab === 'starter' && (
            <div className="space-y-3">
              <div className="flex items-center gap-1 border-b border-slate-200">
                {LANG_TABS.map((lang) => (
                  <button
                    key={lang.key}
                    onClick={() => setActiveLang(lang.key)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeLang === lang.key
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
              <textarea
                value={starterCode[activeLang] ?? ''}
                onChange={(e) =>
                  setStarterCode((prev) => ({ ...prev, [activeLang]: e.target.value }))
                }
                className="w-full h-[calc(100vh-380px)] min-h-[350px] font-mono text-sm border border-slate-300 rounded-lg px-4 py-3 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none leading-relaxed"
                placeholder={`// Starter code for ${LANG_TABS.find(l => l.key === activeLang)?.label}`}
                spellCheck={false}
              />
            </div>
          )}

          {/* Reference Solution tab */}
          {activeTab === 'reference' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Language</label>
                  <select
                    value={referenceSolution?.language || 'cpp'}
                    onChange={(e) => setReferenceSolution(prev => ({
                      language: e.target.value,
                      code: prev?.code || ''
                    }))}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="c">C</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                    <option value="python">Python</option>
                  </select>
                </div>
                <div className="text-xs text-slate-400 mt-5">
                  Every problem requires exactly one valid reference solution to execute validation/benchmarks.
                </div>
              </div>
              <textarea
                value={referenceSolution?.code || ''}
                onChange={(e) => setReferenceSolution(prev => ({
                  language: prev?.language || 'cpp',
                  code: e.target.value
                }))}
                className="w-full h-[calc(100vh-380px)] min-h-[350px] font-mono text-sm border border-slate-300 rounded-lg px-4 py-3 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none leading-relaxed"
                placeholder="// Paste complete reference solution code here..."
                spellCheck={false}
              />
            </div>
          )}

          {/* Testcases tab */}
          {activeTab === 'testcases' && (
            <TestcaseEditor
              problemId={loadedId || problemId || ''}
              samples={samples}
              hidden={hidden}
              adminToken={adminToken}
              apiUrl={apiUrl}
              onChanged={refreshTestcases}
            />
          )}
        </div>
      </div>
    </div>
  );
}
