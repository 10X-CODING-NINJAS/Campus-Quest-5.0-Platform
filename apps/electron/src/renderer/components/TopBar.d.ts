interface TopBarProps {
    isPaused?: boolean;
    isLobby?: boolean;
    solidBg?: boolean;
    teamName?: string;
    onTeamNameChange?: (name: string) => void;
    currentScreen?: 'login' | 'diagnostics' | 'lobby' | 'coding' | 'hints';
    onNavigate?: (screen: 'coding' | 'hints') => void;
    hintStage?: number;
    contestEndsAt?: string | null;
    teamFrozenUntil?: string | null;
}
export default function TopBar({ isPaused, isLobby, solidBg, teamName, onTeamNameChange, currentScreen, onNavigate, hintStage, contestEndsAt, teamFrozenUntil, }: TopBarProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=TopBar.d.ts.map