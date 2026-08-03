interface LeftSidebarProps {
    onSpiderSenseClick?: () => void;
    powerupCounts?: {
        SPIDER_SENSE: number;
        WEB_FLUID: number;
        SUIT_TECH: number;
    };
    onUsePowerup?: (type: 'SPIDER_SENSE' | 'WEB_FLUID' | 'SUIT_TECH', problemId?: string) => void;
    solvedCount?: number;
    totalProblems?: number;
    currentRank?: number;
    hintStage?: number;
    latestVerdict?: string;
}
export default function LeftSidebar({ onSpiderSenseClick, powerupCounts, onUsePowerup, solvedCount, totalProblems, currentRank, hintStage, latestVerdict }: LeftSidebarProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=LeftSidebar.d.ts.map