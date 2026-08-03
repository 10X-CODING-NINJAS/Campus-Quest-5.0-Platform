export declare function useJudge(problemId: string): {
    runCode: (code: string, language: string, stdin: string) => void;
    submitCode: (code: string, language: string) => void;
    isRunning: boolean;
    runResult: any;
};
//# sourceMappingURL=useJudge.d.ts.map