import { useEffect } from "react";

/**
 * @param {{
 * children: React.ReactNode,
 * parentRef: React.RefObject<HTMLDivElement>
 * }} props
 * @returns {JSX.Element}
 */
export default function Tooltip({ children, parentRef, className }) {
    useEffect(() => {
        if (!parentRef) return;
        parentRef.current.classList.add("relative", "group/tooltip");
    }, [parentRef]);

    return (
        <div role="tooltip" className={`text-nowrap invisible group-hover/tooltip:visible opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-300 absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[calc(100%+0.25rem)] z-20 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm tooltip ${className}`}>
            {children}
        </div>
    )
}
