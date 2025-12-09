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

    // Base styling - using neumorphic pill styles
    let classNames;
    
    if (isOwn || variant === 'own') {
        // Own skill: coral/primary filled
        classNames = 'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-primary/90 border border-primary';
    } else if (isPending || variant === 'pending') {
        // Pending: coral/primary dashed outline (same color family as own, but outline only)
        classNames = 'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold text-primary bg-primary/5 border-2 border-dashed border-primary/50';
    } else if (variant === 'subtle') {
        classNames = 'neu-pill-subtle';
    } else if (variant === 'outline') {
        // Other skills: gray outline
        classNames = 'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-gray-500 border border-gray-300 bg-white/50';
    } else {
        classNames = 'neu-pill';
    }

    // Add cursor pointer if clickable
    if (onClick) {
        classNames += ' cursor-pointer';
    }

    const content = (
        <>
            {skillName}
            {children}
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