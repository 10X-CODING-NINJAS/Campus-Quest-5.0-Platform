interface RightPanelProps {
    questionNum: number;
    selectedLang: string;
    setSelectedLang: (lang: string) => void;
    isSaved: boolean;
    setIsSaved: React.Dispatch<React.SetStateAction<boolean>>;
    powerupCounts: {
        SPIDER_SENSE: number;
        WEB_FLUID: number;
        SUIT_TECH: number;
    };
    onUsePowerup: (type: 'SPIDER_SENSE' | 'WEB_FLUID' | 'SUIT_TECH', problemId?: string) => void;
    onUseSpideySenseSuccess?: () => void;
    currentProblem: any;
    teamId: string;
    teamName: string;
    solvedCount: number;
    currentRank: number;
    latestVerdict: string;
    hintStage: number;
    totalProblems: number;
}
export default function RightPanel({ selectedLang, setSelectedLang, setIsSaved, powerupCounts, onUsePowerup, onUseSpideySenseSuccess, currentProblem, teamId, teamName: _teamName, // kept in props interface for LeftSidebar display; not used directly here
solvedCount, currentRank, latestVerdict, hintStage, totalProblems }: RightPanelProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=RightPanel.d.ts.map