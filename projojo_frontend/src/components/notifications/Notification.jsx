import { useEffect, useRef, useState } from "react";

const notificationTypes = {
    "success": {
        icon: "check_circle",
        title: "Gelukt!",
        bgClass: "bg-emerald-50 border-emerald-200",
        iconClass: "text-emerald-500",
        textClass: "text-emerald-800",
        progressClass: "bg-emerald-500",
    },
    "error": {
        icon: "error",
        title: "Fout",
        bgClass: "bg-red-50 border-red-200",
        iconClass: "text-red-500",
        textClass: "text-red-800",
        progressClass: "bg-red-500",
    },
    "info": {
        icon: "info",
        title: "Info",
        bgClass: "bg-amber-50 border-amber-200",
        iconClass: "text-amber-500",
        textClass: "text-amber-800",
        progressClass: "bg-amber-500",
    }
};

// Duration in milliseconds
const NOTIFICATION_DURATION = 7000;

export default function Notification({ message, isShown, type, onClose }) {
    const config = notificationTypes[type] ?? notificationTypes.info;
    const notificationRef = useRef();
    const [progress, setProgress] = useState(100);
    const progressIntervalRef = useRef(null);

    // Reset and start progress bar when notification shows
    useEffect(() => {
        if (isShown) {
            setProgress(100);
            const startTime = Date.now();
            
            progressIntervalRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 100 - (elapsed / NOTIFICATION_DURATION) * 100);
                setProgress(remaining);
                
                if (remaining <= 0) {
                    clearInterval(progressIntervalRef.current);
                }
            }, 50);
        } else {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        }

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, [isShown]);

    // Handle visibility after animation
    useEffect(() => {
        let invalid = false;

        if (!isShown) {
            setTimeout(() => {
                if (!invalid && notificationRef.current) {
                    notificationRef.current.classList.add("hidden");
                }
            }, 300);
        } else {
            if (notificationRef.current) {
                notificationRef.current.classList.remove("hidden");
            }
        }

        return () => { invalid = true; };
    }, [isShown]);

    return (
        <div 
            ref={notificationRef}
            className={`fixed top-6 right-6 z-[9999] transition-all duration-300 ease-out ${
                isShown 
                    ? "translate-x-0 opacity-100" 
                    : "translate-x-full opacity-0"
            }`}
        >
            <div 
                className={`
                    relative overflow-hidden
                    min-w-[320px] max-w-[420px]
                    rounded-2xl border shadow-lg
                    ${config.bgClass}
                `}
                role="alert"
            >
                {/* Main content */}
                <div className="p-4 flex items-start gap-3">
                    {/* Icon */}
                    <div className={`shrink-0 ${config.iconClass}`}>
                        <span className="material-symbols-outlined text-2xl">
                            {config.icon}
                        </span>
                    </div>
                    
                    {/* Text content */}
                    <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm ${config.textClass}`}>
                            {config.title}
                        </p>
                        <p className={`text-sm mt-0.5 ${config.textClass} opacity-90`}>
                            {message}
                        </p>
                    </div>
                    
                    {/* Close button */}
                    <button 
                        onClick={() => onClose && onClose()} 
                        type="button" 
                        className={`
                            shrink-0 p-1.5 rounded-lg
                            ${config.textClass} opacity-60
                            hover:opacity-100 hover:bg-black/5
                            transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-current
                        `}
                        aria-label="Sluiten"
                    >
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
                
                {/* Progress bar */}
                <div className="h-1 w-full bg-black/5">
                    <div 
                        className={`h-full ${config.progressClass} transition-all duration-100 ease-linear`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
