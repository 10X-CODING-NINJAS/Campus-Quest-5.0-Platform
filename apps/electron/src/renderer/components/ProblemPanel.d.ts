interface ProblemPanelProps {
    questionNum: number;
    setQuestionNum: React.Dispatch<React.SetStateAction<number>>;
    currentProblem: any;
    totalProblems: number;
    maxUnlockedQuestion?: number;
    solvedProblemIds?: Set<string>;
    bypassedProblemIds?: Set<string>;
    problems?: any[];
}
export default function ProblemPanel({ questionNum, setQuestionNum, currentProblem, totalProblems, maxUnlockedQuestion, solvedProblemIds, bypassedProblemIds, problems }: ProblemPanelProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=ProblemPanel.d.ts.map