import { useRef } from "react";
import Tooltip from "./Tooltip";
import { parseSdgGoals } from "../utils/sdg";
import { legibleFill } from "../utils/themeColor";

const UN_GOAL_URL = "https://sdgs.un.org/goals/goal";

/**
 * SdgBadge Component (TS-task-022)
 *
 * Renders a theme's `sdg_code` as one small round badge per UN Sustainable
 * Development Goal, filled with that goal's official UN colour and linking to
 * its page on sdgs.un.org.
 *
 *   <SdgBadge sdgCode="SDG12" />       one badge
 *   <SdgBadge sdgCode="SDG2,SDG12" />  one badge per goal
 *   <SdgBadge sdgCode={null} />        nothing at all
 *
 * The number is the only visible content, so the goal's Dutch name is carried
 * twice over: as the link's accessible name for screen readers, and as the
 * hover/focus tooltip for sighted users. The number itself is aria-hidden, so a
 * screen reader announces "SDG 12: Verantwoorde consumptie en productie" rather
 * than a bare "12".
 *
 * The label colour is picked by legibleFill rather than by a fixed rule: the 17
 * official colours span very light (#FCC30B) to very dark (#19486A), and only a
 * contrast-based choice keeps every one of them readable. Contrast is not hue
 * consistent, so similar colours can end up with opposite labels — among the reds,
 * SDG1 and SDG5 read black while SDG4, SDG8 and SDG10 read white. That is the
 * choice, not a bug: every badge clears WCAG AA, which a per-hue rule would not.
 *
 * The link role is the native one an <a href> already carries, so no role
 * attribute is set: spelling it out would be redundant ARIA on an element that
 * means it natively.
 */
export default function SdgBadge({ sdgCode }) {
    const goals = parseSdgGoals(sdgCode);
    if (!goals.length) return null;

    return (
        <span className="inline-flex flex-wrap items-center gap-1">
            {goals.map(goal => <SdgGoalBadge key={goal.number} goal={goal} />)}
        </span>
    );
}

/**
 * One goal's badge. Split out because each badge needs its own ref for the
 * tooltip, and hooks cannot be called from inside the map above.
 */
function SdgGoalBadge({ goal }) {
    const badgeRef = useRef(null);

    return (
        <a
            ref={badgeRef}
            data-testid="sdg-badge"
            data-sdg-code={`SDG${goal.number}`}
            href={`${UN_GOAL_URL}${goal.number}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`SDG ${goal.number}: ${goal.name}`}
            // ring-offset keeps the focus ring off the fill: the primary ring against
            // an orange goal colour (SDG9, SDG11) would otherwise barely read.
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50 transition-transform hover:scale-110"
            style={legibleFill(goal.color)}
        >
            <span data-testid="sdg-badge-number" aria-hidden="true">{goal.number}</span>
            <Tooltip parentRef={badgeRef}>{goal.name}</Tooltip>
        </a>
    );
}
