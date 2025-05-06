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
        <div className="flex items-center p-4 text-red-800 rounded-lg bg-red-50 border border-red-400" role="alert">
            <div className="text-sm font-medium">
                {text}
            </div>
            {isCloseable && (
                <button type="button" onClick={handleClose} className="ms-auto -mx-1.5 -my-1.5 bg-red-50 text-red-500 rounded-lg focus:ring-2 focus:ring-red-400 p-1.5 hover:bg-red-200 inline-flex items-center justify-center h-8 w-8" aria-label="Alert sluiten">
                    <span className="sr-only">Close</span>
                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                    </svg>
                </button>
            )}
        </div>
    )
}