import { useRef } from "react";
import Tooltip from "./Tooltip";

/**
 * @param {{
 * children: React.ReactNode,
 * skillName: string,
 * isPending?: boolean,
 * isOwn?: boolean,
 * variant?: 'default' | 'subtle' | 'outline' | 'own' | 'pending'
 * }} props
 * @returns {JSX.Element}
 */
export default function SkillBadge({ children, skillName, isPending, isOwn = false, onClick = null, ariaLabel = null, variant = 'default' }) {
    const toolTipRef = useRef(null);

    // Clean skill badge styling - no gradients, consistent across app
    let classNames;
    
    if (isOwn || variant === 'own') {
        // Own skill: coral outline with light fill
        classNames = 'skill-badge-own';
    } else if (isPending || variant === 'pending') {
        // Pending: dashed coral border
        classNames = 'skill-badge-pending';
    } else {
        // Default: solid coral background
        classNames = 'skill-badge';
    }

    // Add cursor pointer if clickable
    if (onClick) {
        classNames += ' cursor-pointer hover:opacity-80 transition-opacity';
    }

    const content = (
        <>
            {children}
            {skillName}
            {isPending && (
                <Tooltip parentRef={toolTipRef}>
                    In afwachting van goedkeuring
                </Tooltip>
            )}
        </>
    );

    if (onClick) {
        return (
            <button ref={toolTipRef} className={classNames} onClick={onClick} aria-label={ariaLabel}>
                {content}
            </button>
        )
    }

    return (
        <span ref={toolTipRef} className={classNames}>
            {content}
        </span>
    )
}