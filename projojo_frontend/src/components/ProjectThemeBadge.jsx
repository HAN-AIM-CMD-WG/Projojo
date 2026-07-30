import { legibleFill } from '../utils/themeColor';

// Fill for a theme that carries no colour of its own, matching the theme pills on
// the project details page and in the theme picker.
const COLORLESS_THEME_FILL = '#FF7F50';

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
 * Shared by PublicProjectCard and the authenticated ProjectCard so both surfaces
 * stay visually identical. Positioning is left to the card, since the two place
 * the badge in different corners of their image overlay.
 */
export default function ProjectThemeBadge({ themes }) {
    const [theme] = themes || [];
    if (!theme) return null;

    return (
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
    );
}
