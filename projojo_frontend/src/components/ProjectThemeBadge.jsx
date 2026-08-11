import { legibleFill, COLORLESS_THEME_FILL } from '../utils/themeColor';
import { parseSdgGoals } from '../utils/sdg';
import SdgBadge from './SdgBadge';

// How many SDG badges the cramped card shows before collapsing the rest into "+N".
const CARD_SDG_BADGE_LIMIT = 2;

/**
 * ProjectThemeBadge Component
 *
 * Compact theme badge for project cards: the project's first theme as a colored
 * pill with its Material Symbols icon, and the remaining themes summarised as a
 * "+N" count. Renders nothing when the project has no themes, so a card without
 * themes keeps its layout.
 *
 * The fill is opaque and its label colour is picked for contrast by legibleFill,
 * so a light theme colour (white, pale yellow) stays readable. A translucent fill
 * would make that choice depend on the project photo behind the badge.
 *
 * The primary theme's SDG badge sits beside the pill as a PASSIVE indicator
 * (`interactive={false}`): colour plus a native `title` on hover, no link. The whole
 * card is a single <Link>, so a nested <a> here would be invalid HTML - AC-5 of
 * TS-task-023 allows exactly this hover-only form when space is tight.
 *
 * Shared by PublicProjectCard and the authenticated ProjectCard so both surfaces
 * stay visually identical. Positioning is left to the card, since the two place
 * the badge in different corners of their image overlay.
 */
export default function ProjectThemeBadge({ themes }) {
    const [theme] = themes || [];
    if (!theme) return null;

    // Up to CARD_SDG_BADGE_LIMIT of the primary theme's SDG goals are drawn on the card,
    // with a "+N" count for any beyond that. The card is a cramped image overlay with a
    // status/archived badge in the opposite corner, so drawing a badge per goal would run
    // the row straight across that badge. This mirrors how the card already reduces "many
    // themes" to one pill plus "+N"; the full SDG set stays on the project details page.
    //
    // Counts are taken from parseSdgGoals - the deduped, valid-only list SdgBadge itself
    // renders - so the badge count and the "+N" count can never disagree. A repeated code
    // (e.g. "SDG12,SDG12", still accepted by the backend until TS-task-028) is one goal,
    // one badge, and is not miscounted into the overflow.
    const goals = parseSdgGoals(theme.sdg_code);
    const shownSdgCodes = goals.slice(0, CARD_SDG_BADGE_LIMIT).map((goal) => `SDG${goal.number}`);
    const hiddenSdgCount = goals.length - shownSdgCodes.length;
    const hiddenThemeCount = themes.length - 1;

    return (
        <span className="inline-flex items-center gap-1">
            <span
                data-testid="project-theme-badge"
                data-theme-id={theme.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={legibleFill(theme.color || COLORLESS_THEME_FILL)}
            >
                {theme.icon && (
                    <span data-testid="project-theme-badge-icon" className="material-symbols-outlined text-[10px]" aria-hidden="true">
                        {theme.icon}
                    </span>
                )}
                <span data-testid="project-theme-badge-name">{theme.name}</span>
                {hiddenThemeCount > 0 && (
                    <span
                        data-testid="project-theme-badge-overflow"
                        title={`nog ${hiddenThemeCount} thema${hiddenThemeCount === 1 ? '' : "'s"}`}
                        aria-label={`nog ${hiddenThemeCount} thema${hiddenThemeCount === 1 ? '' : "'s"}`}
                        className="opacity-70"
                    >
                        +{hiddenThemeCount}
                    </span>
                )}
            </span>
            <SdgBadge sdgCode={shownSdgCodes.join(',')} interactive={false} />
            {hiddenSdgCount > 0 && (
                // A translucent dark fill is safe here, unlike the goal badges whose fill must
                // be opaque: black at 60% can only ever darken what is behind it, so white text
                // composites to at worst ~5.7:1 (over pure white) - clear of WCAG AA 4.5:1 for
                // any project photo. Kept smaller and square-ish so it reads as a counter rather
                // than a third goal, and labelled in Dutch so a screen reader hears
                // "nog 15 SDG-doelen" rather than a bare "+15".
                <span
                    data-testid="sdg-badge-overflow"
                    title={`nog ${hiddenSdgCount} SDG-${hiddenSdgCount === 1 ? 'doel' : 'doelen'}`}
                    aria-label={`nog ${hiddenSdgCount} SDG-${hiddenSdgCount === 1 ? 'doel' : 'doelen'}`}
                    className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-md text-[9px] font-bold bg-black/60 text-white ring-1 ring-white/40"
                >
                    +{hiddenSdgCount}
                </span>
            )}
        </span>
    );
}
