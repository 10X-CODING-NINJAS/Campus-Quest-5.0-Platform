/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { SpiderVariant } from '../types';
interface DiagnosticsProps {
    variant?: SpiderVariant;
    onProceed?: () => void;
    onBack?: () => void;
}
export default function Diagnostics({ variant: propVariant, onProceed }: DiagnosticsProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=Diagnostics.d.ts.map