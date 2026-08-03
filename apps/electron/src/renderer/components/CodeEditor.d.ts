type Language = 'c' | 'cpp' | 'python' | 'java';
interface CodeEditorProps {
    problemId: string;
    onRun: (code: string, language: Language, stdin: string) => void;
    onSubmit: (code: string, language: Language) => void;
    isRunning: boolean;
}
export declare function CodeEditor({ problemId: _, onRun, onSubmit, isRunning }: CodeEditorProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=CodeEditor.d.ts.map