import React from "react";
import { Challenge, SubmissionResult } from "../types";
interface EditorPanelProps {
    activeChallenge: Challenge;
    language: "cpp" | "python" | "java";
    setLanguage: (lang: "cpp" | "python" | "java") => void;
    code: string;
    onChangeCode: (code: string) => void;
    onRunCode: () => void;
    onSubmitCode: () => void;
    onUseSpideySense: () => void;
    submissionResult: SubmissionResult;
    consoleLogs: string[];
    submissionProgress: {
        stage: 'IDLE' | 'COMPILING' | 'RUNNING' | 'DONE';
        currentTest: number;
        totalTests: number;
    };
}
export default function EditorPanel({ language, setLanguage, code, onChangeCode, onRunCode, onSubmitCode, onUseSpideySense, submissionResult, consoleLogs, submissionProgress }: EditorPanelProps): React.JSX.Element;
export {};
//# sourceMappingURL=EditorPanel.d.ts.map