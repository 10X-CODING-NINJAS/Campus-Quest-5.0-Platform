import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import axios from 'axios';
const API_URL = 'http://localhost:3000/admin';
export default function App() {
    const [status, setStatus] = useState('Unknown');
    const [error, setError] = useState(null);
    const handleAction = async (action) => {
        try {
            setError(null);
            let endpoint = '';
            if (action === 'start')
                endpoint = '/start-contest';
            else if (action === 'pause')
                endpoint = '/pause-contest';
            else if (action === 'resume')
                endpoint = '/resume-contest';
            const res = await axios.post(`${API_URL}${endpoint}`);
            setStatus(res.data.status || 'Success');
        }
        catch (err) {
            setError(err.response?.data?.error || err.message || 'An error occurred');
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-slate-100 p-8", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-8", children: [_jsxs("header", { className: "bg-white p-6 rounded-xl shadow-sm border border-slate-200", children: [_jsx("h1", { className: "text-3xl font-bold text-slate-800", children: "Campus Quest - Admin Portal" }), _jsx("p", { className: "text-slate-500 mt-2", children: "Manage the contest state and monitor teams." })] }), _jsxs("section", { className: "bg-white p-6 rounded-xl shadow-sm border border-slate-200", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Contest Controls" }), error && (_jsx("div", { className: "mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded", children: error })), _jsxs("div", { className: "flex gap-4", children: [_jsxs("button", { onClick: () => handleAction('start'), className: "px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow flex items-center gap-2", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("polygon", { points: "6 3 20 12 6 21 6 3" }) }), "Start Contest"] }), _jsxs("button", { onClick: () => handleAction('pause'), className: "px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium shadow flex items-center gap-2", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("rect", { x: "6", y: "4", width: "4", height: "16" }), _jsx("rect", { x: "14", y: "4", width: "4", height: "16" })] }), "Pause Contest"] }), _jsxs("button", { onClick: () => handleAction('resume'), className: "px-6 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded-lg font-medium shadow flex items-center gap-2", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }) }), "Stop Contest"] })] }), _jsxs("div", { className: "mt-6 p-4 bg-slate-50 rounded-lg text-sm text-slate-600", children: ["Last Action Status: ", _jsx("span", { className: "font-mono font-bold text-slate-800", children: status })] })] })] }) }));
}
//# sourceMappingURL=App.js.map