import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Calendar, Clock, Code } from 'lucide-react';
export default function SubmissionHistoryPanel({ submissions }) {
    const [expandedId, setExpandedId] = useState(null);
    const toggleExpand = (id) => {
        setExpandedId(prev => (prev === id ? null : id));
    };
    const getVerdictStyle = (verdict) => {
        switch (verdict) {
            case 'AC':
                return 'bg-green-100 text-green-700 border-green-400';
            case 'CE':
                return 'bg-yellow-100 text-yellow-700 border-yellow-400';
            case 'BYPASSED':
                return 'bg-orange-100 text-orange-700 border-orange-400';
            default:
                return 'bg-red-100 text-red-700 border-red-400';
        }
    };
    return (_jsxs("div", { className: "w-full bg-[#fdf6e2] comic-panel p-5 text-black h-fit shadow-[4px_4px_0_0_rgba(0,0,0,1)]", children: [_jsxs("div", { className: "flex items-center justify-between border-b-2 border-black/10 pb-2 mb-4", children: [_jsx("div", { className: "comic-badge-yellow text-sm font-bold tracking-widest uppercase rounded-none", children: "CHRONOLOGY OF ATTEMPTS" }), _jsxs("span", { className: "font-mono text-[10px] text-zinc-500 font-bold uppercase", children: [submissions.length, " Total Submissions"] })] }), submissions.length === 0 ? (_jsx("div", { className: "text-center py-6 text-zinc-500 font-mono text-xs", children: "No attempts recorded for this fragment yet." })) : (_jsx("div", { className: "space-y-3.5 max-h-[300px] overflow-y-auto pr-1", children: submissions.map((sub, idx) => {
                    const attemptNum = submissions.length - idx;
                    const isExpanded = expandedId === sub.id;
                    return (_jsxs("div", { className: "border-2 border-black bg-white rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,1)] overflow-hidden transition-all", children: [_jsxs("div", { onClick: () => toggleExpand(sub.id), className: "flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-50/80 active:bg-zinc-100/50", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("span", { className: "font-mono text-xs font-black text-zinc-500", children: ["#", attemptNum] }), _jsx("span", { className: `font-mono text-[10px] font-black border-2 px-1.5 py-0.5 rounded ${getVerdictStyle(sub.verdict)}`, children: sub.verdict === 'BYPASSED' ? 'MISSION BYPASSED' : sub.verdict }), _jsx("span", { className: "font-mono text-[10px] text-zinc-600 bg-zinc-100 border border-black/10 px-1.5 py-0.5", children: sub.language.toUpperCase() })] }), _jsxs("div", { className: "flex items-center gap-4 text-[10px] text-zinc-500 font-mono", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "w-3 h-3 text-zinc-400" }), _jsxs("span", { children: [sub.runtimeMs, "ms"] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Calendar, { className: "w-3 h-3 text-zinc-400" }), _jsx("span", { children: new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) })] })] })] }), isExpanded && (_jsxs("div", { className: "border-t-2 border-black bg-[#1e1e1e] p-3 text-[#d4d4d4] font-mono text-[10px] relative", children: [_jsxs("div", { className: "absolute top-2 right-2 flex items-center gap-1 bg-black/40 text-[9px] text-zinc-400 px-1.5 py-0.5 border border-zinc-800", children: [_jsx(Code, { className: "w-3 h-3" }), "Source Code"] }), _jsx("pre", { className: "overflow-x-auto whitespace-pre-wrap max-h-[160px] leading-relaxed pt-4", children: sub.sourceCode })] }))] }, sub.id));
                }) }))] }));
}
//# sourceMappingURL=SubmissionHistoryPanel.js.map