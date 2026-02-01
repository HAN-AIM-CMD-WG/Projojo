import { useRef } from "react";
import Tooltip from "./Tooltip";

/**
 * @param {{
 * children: React.ReactNode,
 * skillName: string,
 * isPending?: boolean
 * }} props
 * @returns {JSX.Element}
 */
export default function SkillBadge({ children, skillName, isPending, onClick = null, ariaLabel = null }) {
    const toolTipRef = useRef(null);

    let classNames = isPending ? 'bg-gray-300 text-black border border-gray-400' : 'bg-primary text-white';
    classNames += ' px-3 py-1 break-words whitespace-normal text-start text-sm font-medium rounded-2xl shadow-md inline-block max-w-full';

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