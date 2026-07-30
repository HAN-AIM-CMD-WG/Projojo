/**
 * ProjectThemeBadge Component
 *
 * Compact theme badge for project cards: the project's first theme as a colored
 * pill with its Material Symbols icon, and the remaining themes summarised as a
 * "+N" count. Renders nothing when the project has no themes, so a card without
 * themes keeps its layout.
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
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white backdrop-blur-sm"
            style={{ backgroundColor: theme.color ? `${theme.color}CC` : 'rgba(0,0,0,0.45)' }}
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
