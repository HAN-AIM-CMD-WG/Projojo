import { useEffect, useState } from 'react';
import { getProjectThemes, linkProjectThemes } from '../services';
import { legibleFill, COLORLESS_THEME_FILL } from '../utils/themeColor';
import { sameIds } from '../utils/themeSelection';
import ThemePicker from './ThemePicker';
import ThemeRemovalConfirm from './ThemeRemovalConfirm';
import SdgBadge from './SdgBadge';

/**
 * ProjectThemeSection - the themes a project is linked to, with inline editing for
 * the people allowed to change them.
 *
 * Fetches the project's themes from GET /themes/project/{id} (its own data
 * lifecycle, independent of the project fetch) and renders them as solid,
 * colour-filled pills with their Material Symbols icon and name. The fill and
 * its contrast-picked label colour come from the shared legibleFill helper that
 * every theme surface uses; the spacing is this row's own, tighter than the
 * picker's, which sits in a form rather than beside the project metadata.
 *
 * Read-only states: a brief skeleton while loading, the pills once loaded, an
 * empty-state message when the project has no themes, and a distinct load-error
 * message when the fetch fails - so a backend hiccup never masquerades as
 * "no themes".
 *
 * Editing (`canEdit`) is offered as a pencil next to the heading, and only once the
 * current themes are actually known: starting from an unknown baseline could save
 * an empty selection over real links. It swaps the pills for the interactive
 * ThemePicker, pre-selected with what is linked today. Saving replaces every link
 * in one call and is therefore skipped entirely when the selection is unchanged;
 * emptying a non-empty selection is confirmed first, through the same dialog the
 * project edit form uses. That one call decides whether the save succeeded: the read
 * that refreshes the pills afterwards can fail without a persisted change being
 * reported as a failure.
 *
 * @param {object} props
 * @param {string} props.projectId - the project whose themes to show
 * @param {string} [props.projectName] - shown as the removal confirmation's subtitle
 * @param {boolean} [props.canEdit] - whether this user may change the links
 */
export default function ProjectThemeSection({ projectId, projectName, canEdit = false }) {
    const [themes, setThemes] = useState([]);
    const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'
    // Non-null exactly while editing, and then the full working selection - so
    // "am I editing" and "what is selected" can never drift apart.
    const [selectedIds, setSelectedIds] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [hasSaved, setHasSaved] = useState(false);

    const loadThemes = () => getProjectThemes(projectId).then((data) => (Array.isArray(data) ? data : []));

    useEffect(() => {
        if (!projectId) return;
        let active = true;
        setStatus('loading');
        loadThemes()
            .then((data) => {
                if (!active) return;
                setThemes(data);
                setStatus('ready');
            })
            .catch((error) => {
                if (!active) return;
                console.error('Failed to load project themes', error);
                setStatus('error');
            });
        return () => { active = false; };
    }, [projectId]);

    const savedIds = themes.map((theme) => theme.id);
    const isEditing = selectedIds !== null;
    const hasChanged = isEditing && !sameIds(selectedIds, savedIds);
    // Only a save that empties a non-empty selection has to be confirmed: with
    // nothing linked there is nothing to warn about removing.
    const removesEveryTheme = isEditing && selectedIds.length === 0 && savedIds.length > 0;

    function startEditing() {
        setSaveError('');
        setHasSaved(false);
        setSelectedIds(savedIds);
    }

    function cancelEditing() {
        setSelectedIds(null);
        setSaveError('');
    }

    function requestSave() {
        if (removesEveryTheme) {
            // Nothing is written while the confirmation is open.
            setIsConfirmingRemoval(true);
            return;
        }
        save();
    }

    /**
     * Dismissing the confirmation cancels the save and restores the saved themes,
     * exactly as the project edit form does - the controlled picker re-renders them
     * in place, with no remount and no themes refetch.
     */
    function cancelRemoval() {
        setIsConfirmingRemoval(false);
        setSelectedIds(savedIds);
    }

    async function save() {
        setIsConfirmingRemoval(false);
        if (!hasChanged) {
            // Linking replaces every link, so an untouched selection is not worth a
            // rewrite - and there is no success to report for a save that wrote nothing.
            setSelectedIds(null);
            return;
        }

        setIsSaving(true);
        setSaveError('');
        try {
            await linkProjectThemes(projectId, selectedIds);
        } catch {
            // Keep the editor open with the selection intact so it can be retried.
            setSaveError("De thema's konden niet worden opgeslagen. Probeer het opnieuw.");
            setIsSaving(false);
            return;
        }
        setIsSaving(false);
        setSelectedIds(null);
        setHasSaved(true);

        // The pills need each theme's name, colour and icon, which the submitted ids
        // do not carry, so the new links have to be read back. The write has already
        // gone through by this point: a read that fails after it means "saved, but no
        // longer able to show what is linked" - never "not saved". Reporting the
        // latter would send someone back to redo a change that is already persisted.
        try {
            setThemes(await loadThemes());
        } catch (error) {
            console.error('Failed to reload project themes after saving', error);
            setStatus('error');
        }
    }

    return (
        <div data-testid="project-themes" className="mt-3">
            {/* One flat flex-wrap row so the "Thema's:" label shares the first line with
                the first pills and any overflow wraps beneath them - exactly like the
                Skills row. The polite live region (role="status") sits on the transient
                loading/empty/error messages below, NOT on this row: the loaded pills carry
                focusable SDG goal links (TS-task-023), which must not live inside a live
                region, and re-announcing the whole theme row on every reload would be
                noise. A screen reader is told when the themes come back empty or fail
                (states swapped in after first paint; the first-paint loading state itself
                has no mutation to announce). The editor is a deliberate action, not a status. */}
            <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-[var(--text-muted)] mr-1">{"Thema's:"}</span>

                {canEdit && status === 'ready' && !isEditing && (
                    <button
                        type="button"
                        data-testid="project-theme-edit"
                        onClick={startEditing}
                        aria-label={"Thema's aanpassen"}
                        title={"Thema's aanpassen"}
                        className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-[var(--text-muted)]
                            hover:text-primary hover:bg-primary/5 transition-all duration-200
                            focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">edit</span>
                    </button>
                )}

                {isEditing ? null : status === 'loading' ? (
                    <span data-testid="project-themes-loading" role="status" className="inline-flex items-center gap-1.5">
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
                    <span data-testid="project-themes-error" role="status" className="text-xs text-[var(--text-muted)]">
                        {"Thema's konden niet worden geladen"}
                    </span>
                ) : themes.length === 0 ? (
                    <span data-testid="project-themes-empty" role="status" className="text-xs text-[var(--text-muted)]">
                        {"Geen thema's gekoppeld"}
                    </span>
                ) : (
                    themes.map((theme) => (
                        // Pill and its SDG badge as siblings. The badge is the SdgBadge
                        // default (a link to the goal's UN page), kept ADJACENT to the pill
                        // rather than inside it so the read-only pill stays a plain <span>
                        // and the link is never nested in another control (TS-task-023 AC-4).
                        <span
                            key={theme.id}
                            data-testid="project-theme"
                            data-theme-id={theme.id}
                            className="inline-flex items-center gap-1.5"
                        >
                            <span
                                data-testid="project-theme-pill"
                                data-theme-id={theme.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full cursor-default"
                                style={legibleFill(theme.color || COLORLESS_THEME_FILL)}
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
                            <SdgBadge sdgCode={theme.sdg_code} />
                        </span>
                    ))
                )}
            </div>

            {isEditing && (
                <div className="mt-2 flex flex-col gap-3">
                    <ThemePicker selected={selectedIds} onChange={setSelectedIds} />
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            data-testid="project-theme-cancel"
                            onClick={cancelEditing}
                            disabled={isSaving}
                            className="neu-btn !py-1.5 !px-3 text-xs disabled:opacity-50"
                        >
                            Annuleren
                        </button>
                        <button
                            type="button"
                            data-testid="project-theme-save"
                            onClick={requestSave}
                            disabled={isSaving}
                            className="neu-btn-primary !py-1.5 !px-3 text-xs disabled:opacity-50 disabled:cursor-wait"
                        >
                            {isSaving ? 'Opslaan...' : 'Opslaan'}
                        </button>
                    </div>
                </div>
            )}

            {saveError && (
                <p
                    data-testid="project-theme-error"
                    role="alert"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400"
                >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">error</span>
                    {saveError}
                </p>
            )}

            {hasSaved && (
                <p
                    data-testid="project-theme-success"
                    role="status"
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400"
                >
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">check_circle</span>
                    {"Thema's bijgewerkt"}
                </p>
            )}

            <ThemeRemovalConfirm
                isOpen={isConfirmingRemoval}
                onCancel={cancelRemoval}
                onConfirm={save}
                projectName={projectName}
            />
        </div>
    );
}