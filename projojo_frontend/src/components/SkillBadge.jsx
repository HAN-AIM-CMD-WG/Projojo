import { useRef } from "react";
import Tooltip from "./Tooltip";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { X } from "lucide-react";


/**
 * @param {{
 * children: React.ReactNode,
 * skill: {
 *   id: number,
 *   name: string,
 *   isPending?: boolean
 * }
 * }} props
 * @returns {JSX.Element}
 */
export default function SkillBadge({ children, skill, onClick = null, onClose = null, ariaLabel = null }) {
    const toolTipRef = useRef(null);


    let variant = skill.isPending ? 'pending' : 'accepted';

    const content = (
        <Badge variant={variant} className="rounded-full text-nowrap text-xs font-medium shadow-md flex items-center gap-2">
            {skill.name}
            {children}
            {onClose && (
                <Button variant="ghost" onClick={onClose} className="px-0 has-[>svg]:px-0 h-1 hover:bg-transparent hover:text-inherit">
                    <X size={12} />
                </Button>
            )}
            {skill.isPending && (
                <Tooltip parentRef={toolTipRef}>
                    In afwachting van goedkeuring
                </Tooltip>
            )}
        </Badge>
    );


    if (onClick) {
        return (
            <Button ref={toolTipRef} variant="ghost" onClick={onClick} aria-label={ariaLabel}>
                {content}
            </Button>
        )
    }

    return (
        <span ref={toolTipRef}>
            {content}
        </span>
    )
}