import { legibleFill, COLORLESS_THEME_FILL } from '../utils/themeColor';
import { parseSdgCodes } from '../utils/sdg';
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
 * (`interactive={false}`): colour and hover/focus tooltip only, no link. The whole
 * card is a single <Link>, so a nested <a> here would be invalid HTML - AC-5 of
 * TS-task-023 allows exactly this tooltip-only form when space is tight.
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
    const sdgCodes = parseSdgCodes(theme.sdg_code);
    const shownSdgCodes = sdgCodes.slice(0, CARD_SDG_BADGE_LIMIT);
    const hiddenSdgCount = sdgCodes.length - shownSdgCodes.length;

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
                {themes.length > 1 && (
                    <span data-testid="project-theme-badge-overflow" className="opacity-70">+{themes.length - 1}</span>
                )}
            </span>
            <SdgBadge sdgCode={shownSdgCodes.join(',')} interactive={false} />
            {hiddenSdgCount > 0 && (
                <span
                    data-testid="sdg-badge-overflow"
                    className="inline-flex items-center justify-center h-6 min-w-6 px-1 rounded-full text-[10px] font-bold bg-black/60 text-white"
                >
                    +{hiddenSdgCount}
                </span>
            )}
        </span>
    );
}
