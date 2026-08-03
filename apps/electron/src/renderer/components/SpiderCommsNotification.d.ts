interface SpiderCommsNotificationProps {
    isOpen: boolean;
    hintData: {
        hint: string;
        answeredBy?: string;
        answeredAt?: string;
        problemId?: string;
    } | null;
    onClose: () => void;
}
export default function SpiderCommsNotification({ isOpen, hintData, onClose, }: SpiderCommsNotificationProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=SpiderCommsNotification.d.ts.map