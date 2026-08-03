interface SuitTechModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isPending?: boolean;
    currentProblemTitle?: string;
}
export default function SuitTechModal({ isOpen, onClose, onConfirm, isPending, currentProblemTitle }: SuitTechModalProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=SuitTechModal.d.ts.map