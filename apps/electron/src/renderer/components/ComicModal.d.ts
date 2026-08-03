interface ComicModalProps {
    isOpen: boolean;
    onClose: () => void;
    status: "ACCEPTED" | "FAILED" | "COMPILE_ERROR" | "IDLE";
    passedCount: number;
    totalCount: number;
    runtimeMs: number;
    memoryMb: number;
    message?: string | undefined;
}
export default function ComicModal({ isOpen, onClose, status, passedCount, totalCount, runtimeMs, memoryMb, message }: ComicModalProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=ComicModal.d.ts.map