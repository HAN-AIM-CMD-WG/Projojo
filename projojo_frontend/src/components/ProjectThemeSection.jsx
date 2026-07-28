import { useEffect, useState } from 'react';
import { getProjectThemes } from '../services';
import { legibleFill } from '../utils/themeColor';

/**
 * ProjectThemeSection - read-only display of the themes a project is linked to.
 *
 * Fetches the project's themes from GET /themes/project/{id} (its own data
 * lifecycle, independent of the project fetch) and renders them as solid,
 * colour-filled pills with their Material Symbols icon and name, matching the
 * ThemePicker's read-only pill look. Editing is a separate concern (TS-task-017),
 * so the pills here are plain, non-interactive spans.
 *
 * States: a brief skeleton while loading, the pills once loaded, an empty-state
 * message when the project has no themes, and a distinct load-error message when
 * the fetch fails - so a backend hiccup never masquerades as "no themes".
 *
 * @param {object} props
 * @param {string} props.projectId - the project whose themes to show
 */
export default function ProjectThemeSection({ projectId }) {
    const [themes, setThemes] = useState([]);
    const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

    useEffect(() => {
        if (!projectId) return;
        let active = true;
        setStatus('loading');
        getProjectThemes(projectId)
            .then((data) => {
                if (!active) return;
                setThemes(Array.isArray(data) ? data : []);
                setStatus('ready');
            })
            .catch((error) => {
                if (!active) return;
                console.error('Failed to load project themes', error);
                setStatus('error');
            });
        return () => { active = false; };
    }, [projectId]);

    // One flat flex-wrap row so the "Thema's:" label shares the first line with the
    // first pills and any overflow wraps beneath them - exactly like the Skills row.
    // role="status" makes the region a polite live region so a screen reader is told
    // when the themes finish loading, come back empty, or fail - the content swaps in
    // after first paint (matches SkeletonList / ThemeManagement loading regions).
    return (
        <div
            data-testid="project-themes"
            role="status"
            className="mt-3 flex flex-wrap items-center gap-1.5"
        >
            <span className="text-xs font-semibold text-[var(--text-muted)] mr-1">{"Thema's:"}</span>

            {status === 'loading' ? (
                <span data-testid="project-themes-loading" className="inline-flex items-center gap-1.5">
                    <span className="sr-only">{"Thema's laden..."}</span>
                    {[0, 1].map((i) => (
                        <span
                            key={i}
                            className="inline-block h-6 w-20 rounded-full bg-gray-200/70 animate-pulse"
                            aria-hidden="true"
                        />
                    ))}
                </span>
            ) : status === 'error' ? (
                <span data-testid="project-themes-error" className="text-xs text-[var(--text-muted)]">
                    {"Thema's konden niet worden geladen"}
                </span>
            ) : themes.length === 0 ? (
                <span data-testid="project-themes-empty" className="text-xs text-[var(--text-muted)]">
                    {"Geen thema's gekoppeld"}
                </span>
            ) : (
                themes.map((theme) => (
                    <span
                        key={theme.id}
                        data-testid="project-theme-pill"
                        data-theme-id={theme.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full cursor-default"
                        style={legibleFill(theme.color || '#FF7F50')}
                    >
                        {theme.icon && (
                            <span
                                data-testid="project-theme-icon"
                                className="material-symbols-outlined text-sm leading-none"
                                aria-hidden="true"
                            >
                                {theme.icon}
                            </span>
                        )}
                        <span data-testid="project-theme-name">{theme.name}</span>
                    </span>
                ))
            )}
        </div>
    );
}
