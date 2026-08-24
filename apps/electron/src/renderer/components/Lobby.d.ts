/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
interface LobbyProps {
    onProceed: () => void;
    teamName: string;
    onTeamNameChange: (name: string) => void;
    lobbyTimeLeftMs?: number;
    contestStatus?: string;
}
export default function Lobby({ onProceed, teamName, onTeamNameChange, lobbyTimeLeftMs, contestStatus }: LobbyProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=Lobby.d.ts.map