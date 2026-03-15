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
        <div className="neu-flat !rounded-2xl flex items-center gap-3 p-4 mt-6 border-l-4 border-primary/60" role="alert">
            <div className="neu-pressed !rounded-full p-2">
                <span className="material-symbols-outlined text-primary text-lg" aria-hidden="true">info</span>
            </div>
            <div className="text-sm font-medium text-text-secondary flex-1">
                {text}
            </div>
            {isCloseable && (
                <button type="button" onClick={handleClose} className="neu-btn !p-2 !rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50" aria-label="Alert sluiten">
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">close</span>
                </button>
            )}
        </div>
    )
}