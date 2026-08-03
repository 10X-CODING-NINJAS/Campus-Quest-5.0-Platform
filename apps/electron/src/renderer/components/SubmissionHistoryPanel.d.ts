interface Submission {
    id: string;
    verdict: 'AC' | 'WA' | 'TLE' | 'MLE' | 'RE' | 'CE' | 'BYPASSED';
    runtimeMs: number;
    memoryKb: number;
    language: string;
    sourceCode: string;
    createdAt: string;
}
interface SubmissionHistoryPanelProps {
    submissions: Submission[];
}
export default function SubmissionHistoryPanel({ submissions }: SubmissionHistoryPanelProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=SubmissionHistoryPanel.d.ts.map