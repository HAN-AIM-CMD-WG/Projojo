import { useEffect, useState } from "react";
import { getThemes } from "../services";
import Alert from "./Alert";
import Loading from "./Loading";
import ThemeCreateModal from "./ThemeCreateModal";
import { notification } from "./notifications/NotifySystem";

const DESCRIPTION_MAX_LENGTH = 100;

function truncateDescription(text) {
    if (!text) return "";
    return text.length > DESCRIPTION_MAX_LENGTH
        ? `${text.slice(0, DESCRIPTION_MAX_LENGTH).trimEnd()}…`
        : text;
}

function sortThemes(list) {
    return [...(list || [])].sort(
        (a, b) => (a.display_order ?? 999) - (b.display_order ?? 999) || a.name.localeCompare(b.name)
    );
}

/**
 * Teacher-facing overview of the theme catalog (TS-task-010, read/display only).
 *
 * Creating a theme is handled by the "Nieuw thema" button (TS-task-011). The
 * per-row "Bewerken" and "Verwijderen" actions are still inert here: editing
 * and deleting are handled by TS-task-012 and TS-task-013 respectively.
 */
export default function ThemeManagement() {
    const [themes, setThemes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    useEffect(() => {
        let ignore = false;

        getThemes()
            .then(data => {
                if (ignore) return;
                setThemes(sortThemes(data));
            })
            .catch(() => {
                if (ignore) return;
                setError("Er is iets misgegaan bij het ophalen van de thema's.");
            })
            .finally(() => {
                if (!ignore) setIsLoading(false);
            });

        return () => {
            ignore = true;
        };
    }, []);

    return (
        <section data-testid="theme-management" className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary" aria-hidden="true">category</span>
                        Thema&apos;s
                    </h2>
                    <p className="text-[var(--text-muted)] mt-1">
                        Er {themes.length === 1 ? "is" : "zijn"} <strong className="text-primary">{themes.length}</strong> thema{themes.length !== 1 ? "'s" : ""} in de catalogus.
                    </p>
                </div>
                <button type="button" className="neu-btn-primary" onClick={() => setIsCreateOpen(true)}>
                    <span className="material-symbols-outlined text-sm mr-2" aria-hidden="true">add</span>
                    Nieuw thema
                </button>
            </div>

            {isLoading ? (
                <div data-testid="theme-loading" role="status" className="neu-flat rounded-2xl p-8">
                    <span className="sr-only">Thema&apos;s laden…</span>
                    <Loading />
                </div>
            ) : error ? (
                <Alert text={error} isCloseable={false} />
            ) : themes.length === 0 ? (
                <div data-testid="theme-empty" className="neu-pressed p-8 text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2 block" aria-hidden="true">category</span>
                    <p className="text-[var(--text-muted)]">Nog geen thema&apos;s aangemaakt</p>
                </div>
            ) : (
                <div className="neu-flat rounded-2xl overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-[var(--text-muted)] uppercase bg-[var(--gray-200)]/50 border-b border-[var(--neu-border)]">
                            <tr>
                                <th scope="col" className="px-4 md:px-6 py-4 font-bold">Kleur</th>
                                <th scope="col" className="px-4 md:px-6 py-4 font-bold">Icoon</th>
                                <th scope="col" className="px-4 md:px-6 py-4 font-bold">Naam</th>
                                <th scope="col" className="px-4 md:px-6 py-4 font-bold">SDG</th>
                                <th scope="col" className="px-4 md:px-6 py-4 font-bold">Beschrijving</th>
                                <th scope="col" className="px-4 md:px-6 py-4 font-bold">Acties</th>
                            </tr>
                        </thead>
                        <tbody>
                            {themes.map(theme => (
                                <tr
                                    key={theme.id}
                                    data-testid="theme-row"
                                    className="border-b border-[var(--neu-border)] hover:bg-[var(--gray-200)]/30 transition-colors"
                                >
                                    <td className="px-4 md:px-6 py-4">
                                        <span
                                            data-testid="theme-swatch"
                                            className="inline-block w-6 h-6 rounded-full neu-pressed"
                                            style={{ backgroundColor: theme.color || "transparent" }}
                                            aria-hidden="true"
                                        />
                                    </td>
                                    <td className="px-4 md:px-6 py-4">
                                        <span data-testid="theme-icon" className="material-symbols-outlined text-primary" aria-hidden="true">
                                            {theme.icon || ""}
                                        </span>
                                    </td>
                                    <th scope="row" data-testid="theme-name" className="px-4 md:px-6 py-4 font-bold text-[var(--text-primary)]">
                                        {theme.name}
                                    </th>
                                    <td data-testid="theme-sdg" className="px-4 md:px-6 py-4 text-[var(--text-secondary)]">
                                        {theme.sdg_code || "—"}
                                    </td>
                                    <td
                                        data-testid="theme-description"
                                        title={theme.description || ""}
                                        className="px-4 md:px-6 py-4 text-[var(--text-secondary)] max-w-xs"
                                    >
                                        {truncateDescription(theme.description)}
                                    </td>
                                    <td className="px-4 md:px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button type="button" aria-label={`Bewerken: ${theme.name}`} className="neu-btn !py-2 !px-3 text-sm flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-base" aria-hidden="true">edit</span>
                                                Bewerken
                                            </button>
                                            <button type="button" aria-label={`Verwijderen: ${theme.name}`} className="neu-btn !py-2 !px-3 text-sm flex items-center gap-1.5 !text-red-600 hover:!bg-red-50">
                                                <span className="material-symbols-outlined text-base" aria-hidden="true">delete</span>
                                                Verwijderen
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <ThemeCreateModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onCreated={theme => {
                    setThemes(prev => sortThemes([...prev, theme]));
                    notification.success("Thema aangemaakt");
                }}
            />
        </section>
    );
}
