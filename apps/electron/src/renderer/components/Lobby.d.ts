/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
interface LobbyProps {
    onProceed: () => void;
    teamName: string;
    onTeamNameChange: (name: string) => void;
}
export default function Lobby({ onProceed, teamName, onTeamNameChange }: LobbyProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=Lobby.d.ts.map