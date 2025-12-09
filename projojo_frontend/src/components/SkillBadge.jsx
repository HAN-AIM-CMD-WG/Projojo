import { useRef } from "react";
import Tooltip from "./Tooltip";

/**
 * @param {{
 * children: React.ReactNode,
 * skillName: string,
 * isPending?: boolean,
 * variant?: 'default' | 'subtle' | 'outline'
 * }} props
 * @returns {JSX.Element}
 */
export default function SkillBadge({ children, skillName, isPending, onClick = null, ariaLabel = null, variant = 'default' }) {
    const toolTipRef = useRef(null);

    // Base styling - using neumorphic pill styles
    let classNames;
    
    if (isPending) {
        classNames = 'neu-pill-subtle !bg-gray-200 !text-gray-600 !border-gray-300';
    } else if (variant === 'subtle') {
        classNames = 'neu-pill-subtle';
    } else if (variant === 'outline') {
        classNames = 'neu-pill-outline';
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