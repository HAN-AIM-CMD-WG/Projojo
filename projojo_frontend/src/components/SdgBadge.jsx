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
 * `interactive` (default true) chooses the badge's element. Interactive renders an
 * <a href> to the goal's UN page, whose link role and focus ring are native. Passive
 * (`interactive={false}`) renders a <span role="img"> with the same fill, tooltip and
 * accessible name but no link: it is for surfaces where the badge sits inside another
 * anchor — the project cards are a single <Link>, and a nested <a> there is invalid
 * HTML — so the colour-and-tooltip indicator stands in for the goal link.
 */
export default function SdgBadge({ sdgCode, interactive = true }) {
    const goals = parseSdgGoals(sdgCode);
    if (!goals.length) return null;

    return (
        <span className="inline-flex flex-wrap items-center gap-1">
            {goals.map(goal => <SdgGoalBadge key={goal.number} goal={goal} interactive={interactive} />)}
        </span>
    );
}

/**
 * One goal's badge. Split out because each badge needs its own ref for the
 * tooltip, and hooks cannot be called from inside the map above.
 */
function SdgGoalBadge({ goal, interactive }) {
    const badgeRef = useRef(null);
    const Tag = interactive ? "a" : "span";

    // The link carries the new-tab attributes and the focus ring. The passive span
    // carries neither; it also swaps the custom Tooltip for a native `title`, because
    // its only home is the project card, whose overflow-hidden frame would clip an
    // absolutely-positioned tooltip to an unreadable sliver. A native title is drawn
    // by the browser outside that frame. The span still needs an explicit role="img"
    // so its aria-label is announced (an <a href> announces as a link natively).
    // ring-offset keeps the focus ring off the fill: the primary ring against an
    // orange goal colour (SDG9, SDG11) would otherwise barely read.
    const roleProps = interactive
        ? { href: `${UN_GOAL_URL}${goal.number}`, target: "_blank", rel: "noopener noreferrer" }
        : { role: "img", title: goal.name };
    const focusRing = interactive ? " focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50" : "";

    return (
        <Tag
            ref={badgeRef}
            data-testid="sdg-badge"
            data-sdg-code={`SDG${goal.number}`}
            aria-label={`SDG ${goal.number}: ${goal.name}`}
            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-transform hover:scale-110${focusRing}`}
            style={legibleFill(goal.color)}
            {...roleProps}
        >
            <span data-testid="sdg-badge-number" aria-hidden="true">{goal.number}</span>
            {interactive && <Tooltip parentRef={badgeRef}>{goal.name}</Tooltip>}
        </Tag>
    );
}
