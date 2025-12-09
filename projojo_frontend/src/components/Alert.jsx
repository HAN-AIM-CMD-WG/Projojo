import { useEffect, useState } from "react";

/**
 * @param {{
 * text: string,
 * isCloseable?: boolean,
 * onClose?: () => void
 * }} props
 * @returns {JSX.Element}
 */
export default function Alert({ text, isCloseable = true, onClose = () => { } }) {
    const [showMessage, setShowMessage] = useState(true);

    const handleClose = () => {
        setShowMessage(false);
        onClose();
    }

    useEffect(() => {
        setShowMessage(true);
    }, [text]);

    if (!showMessage || !text) {
        return null;
    }

    return (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-red-200" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)' }} role="alert">
            <span className="material-symbols-outlined text-red-600">error</span>
            <div className="text-sm font-semibold text-red-700 flex-1">
                {text}
            </div>
            {isCloseable && (
                <button type="button" onClick={handleClose} className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 transition-colors" aria-label="Alert sluiten">
                    <span className="sr-only">Close</span>
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>
            )}
        </div>
    )
}