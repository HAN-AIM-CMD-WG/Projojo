import { useEffect, useId } from "react";

/**
 * Accessible Tooltip Component
 * 
 * Shows on hover AND focus for keyboard accessibility.
 * Uses aria-describedby to link tooltip to parent element.
 * 
 * @param {{
 * children: React.ReactNode,
 * parentRef: React.RefObject<HTMLDivElement>,
 * className?: string,
 * id?: string
 * }} props
 * @returns {JSX.Element}
 */
export default function Tooltip({ children, parentRef, className, id: externalId }) {
    const generatedId = useId();
    const tooltipId = externalId || `tooltip-${generatedId}`;

    useEffect(() => {
        if (!parentRef?.current) return;
        
        const element = parentRef.current;
        element.classList.add("relative", "group/tooltip");
        
        // Add aria-describedby to link tooltip to parent
        const existingDescribedBy = element.getAttribute('aria-describedby');
        if (existingDescribedBy) {
            if (!existingDescribedBy.includes(tooltipId)) {
                element.setAttribute('aria-describedby', `${existingDescribedBy} ${tooltipId}`);
            }
        } else {
            element.setAttribute('aria-describedby', tooltipId);
        }

        return () => {
            // Cleanup: remove the tooltip ID from aria-describedby
            const currentDescribedBy = element.getAttribute('aria-describedby');
            if (currentDescribedBy) {
                const newDescribedBy = currentDescribedBy
                    .split(' ')
                    .filter(id => id !== tooltipId)
                    .join(' ')
                    .trim();
                if (newDescribedBy) {
                    element.setAttribute('aria-describedby', newDescribedBy);
                } else {
                    element.removeAttribute('aria-describedby');
                }
            }
        };
    }, [parentRef, tooltipId]);

    return (
        <div 
            id={tooltipId}
            role="tooltip" 
            className={`text-nowrap invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-focus-within/tooltip:visible group-focus-within/tooltip:opacity-100 transition-opacity duration-300 absolute left-1/2 top-0 -translate-x-1/2 -translate-y-[calc(100%+0.25rem)] z-20 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm ${className || ''}`}
        >
            {children}
        </div>
    );
}
