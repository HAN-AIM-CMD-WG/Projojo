import { useEffect, useRef } from "react";

const notificationTypes = {
    "success": {
        textColor: "text-white",
        bgColor: "bg-[#22bb33]",
        closeBtnHoverBgColor: "hover:bg-[#39db4b]",
        closeBtnHoverTextColor: "hover:text-gray-100",
    },
    "error": {
        textColor: "text-white",
        bgColor: "bg-[#bb2124]",
        closeBtnHoverBgColor: "hover:bg-[#dc3a3d]",
        closeBtnHoverTextColor: "hover:text-gray-100",
    },
    "info": {
        textColor: "text-white",
        bgColor: "bg-[#f0ad4e]",
        closeBtnHoverBgColor: "hover:bg-[#f3bd71]",
        closeBtnHoverTextColor: "hover:text-gray-100",
    }
}

export default function Notification({ message, isShown, type, onClose }) {
    const notificationType = notificationTypes[type] ?? { bgColor: "", lightBgColor: "" };
    const notificationRef = useRef();

    useEffect(() => {
        let invalid = false;

        setTimeout(() => {
            if (!invalid && !isShown) {
                notificationRef.current.classList.add("hidden");
            }
        }, 150);

        return () => invalid = true;
    }, [isShown]);

    return <div className={`fixed transition-all ease-in-out top-20 ${isShown ? "translate-x-[-100%] left-[99%]" : "translate-x-[100%] left-[100%]"}`} ref={notificationRef}>
        <div id="toast-default" className={`flex items-center p-4 ${notificationType.textColor} ${notificationType.bgColor} rounded-lg shadow`} role="alert">
            <p className="ms-3 break-words max-w-72 min-w-48 text-sm font-normal">{message}</p>
            <button onClick={() => onClose && onClose()} type="button" className={`ms-auto -mx-1.5 -my-1.5 ${notificationType.textColor} ${notificationType.bgColor} ${notificationType.closeBtnHoverTextColor} rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 ${notificationType.closeBtnHoverBgColor} inline-flex items-center justify-center h-8 w-8`} data-dismiss-target="#toast-default" aria-label="Close">
                <span className="sr-only">Close</span>
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                </svg>
            </button>
        </div>
    </div>
}