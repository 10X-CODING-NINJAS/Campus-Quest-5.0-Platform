import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
const MONACO_LANG_MAP = {
    c: 'c',
    cpp: 'cpp',
    python: 'python',
    java: 'java',
};
const BOILERPLATE = {
    c: `#include <stdio.h>\n\nint main() {\n    \n    return 0;\n}\n`,
    cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n`,
    python: `def main():\n    pass\n\nif __name__ == "__main__":\n    main()\n`,
    java: `public class Main {\n    public static void main(String[] args) {\n        \n    }\n}\n`,
};
export function CodeEditor({ problemId: _, onRun, onSubmit, isRunning }) {
    const [language, setLanguage] = useState('cpp');
    const [code, setCode] = useState(BOILERPLATE['cpp']);
    const [stdin, setStdin] = useState('');
    const editorRef = useRef(null);
    const handleLanguageChange = (lang) => {
        setLanguage(lang);
        // Only reset to boilerplate if editor is empty or unedited — don't nuke their work
        if (!code.trim() || code === BOILERPLATE[language]) {
            setCode(BOILERPLATE[lang]);
        }
    };
    const handleMount = (editor) => {
        editorRef.current = editor;
        // Disable copy/paste at the Monaco level as part of anti-cheat
        editor.onKeyDown((e) => {
            if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyV' || e.code === 'KeyC')) {
                e.preventDefault();
                e.stopPropagation();
                // report to violation service
            }
        });
    };
    return (_jsxs("div", { className: "flex flex-col h-full", children: [_jsxs("div", { className: "flex items-center justify-between p-2 border-b border-gray-700 bg-gray-900/50", children: [_jsxs("select", { value: language, onChange: (e) => handleLanguageChange(e.target.value), className: "bg-black border border-gray-700 rounded px-2 py-1 text-sm text-white", disabled: isRunning, children: [_jsx("option", { value: "c", children: "C" }), _jsx("option", { value: "cpp", children: "C++" }), _jsx("option", { value: "python", children: "Python" }), _jsx("option", { value: "java", children: "Java" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => onRun(code, language, stdin), disabled: isRunning, className: "px-3 py-1 text-sm rounded bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50", children: isRunning ? 'Running…' : 'Run' }), _jsx("button", { onClick: () => onSubmit(code, language), disabled: isRunning, className: "px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-500 disabled:opacity-50", children: "Submit" })] })] }), _jsx("div", { className: "flex-1 min-h-0", children: _jsx(Editor, { height: "100%", language: MONACO_LANG_MAP[language], value: code, onChange: (v) => setCode(v ?? ''), onMount: handleMount, theme: "vs-dark", options: {
                        fontSize: 14,
                        minimap: { enabled: false },
                        automaticLayout: true,
                        scrollBeyondLastLine: false,
                        contextmenu: false, // no right-click paste
                    } }) }), _jsx("div", { className: "h-24 border-t border-gray-700 p-2 bg-black", children: _jsx("textarea", { value: stdin, onChange: (e) => setStdin(e.target.value), placeholder: "Custom input (for Run only)\u2026", className: "w-full h-full bg-transparent outline-none text-white text-sm font-mono resize-none" }) })] }));
}
//# sourceMappingURL=CodeEditor.js.map