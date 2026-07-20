import { useLayoutEffect, useState } from "react";
import { deleteTheme } from "../services";
import Modal from "./Modal";

/** Reported when the theme turned out to be gone already, instead of an error. */
export const ALREADY_DELETED_MESSAGE = "Thema was al verwijderd";

/**
 * The impact warning a teacher must read before deleting a theme (TS-task-013
 * AC-2/AC-3): how many projects lose a theme link, or that none do.
 */
export function deleteImpactMessage(theme) {
    const question = `Weet je zeker dat je het thema '${theme.name}' wilt verwijderen?`;
    const count = theme.project_count ?? 0;
    return count > 0
        ? `${question} Dit thema is gekoppeld aan ${count} project(en). Deze koppelingen worden ook verwijderd.`
        : `${question} Dit thema is aan geen projecten gekoppeld.`;
}

/**
 * Teacher-facing "Thema verwijderen" confirmation (TS-task-013).
 *
 * Kept mounted while closed (isOpen toggles) so the shared Modal can restore focus
 * to the row's "Verwijderen" button on close, matching the create and edit modals.
 * Nothing is deleted until the teacher confirms; a failed delete keeps the dialog
 * open with the server's message so the theme is visibly still there (AC-6). The
 * one exception is a 404, which means the theme is already gone rather than that
 * anything went wrong, so that path completes the flow with its own message.
 *
 * @param {object} props
 * @param {object|null} props.theme          the theme being deleted (has an id when open)
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {(theme: object, message?: string) => void} props.onDeleted
 */
export default function ThemeDeleteModal({ theme, isOpen, onClose, onDeleted }) {
    const [error, setError] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Clear a previous failure before paint, so reopening never shows a stale error.
    useLayoutEffect(() => {
        if (isOpen) setError(null);
    }, [isOpen, theme]);

    const handleConfirm = async () => {
        if (isDeleting) return;

        setIsDeleting(true);
        setError(null);
        try {
            await deleteTheme(theme.id);
            onDeleted?.(theme);
            onClose();
        } catch (err) {
            // Someone else already deleted it. The teacher's goal state is reached,
            // so finish the flow and drop the stale row instead of trapping them in
            // a dialog with an error about work that is already done.
            if (err?.statusCode === 404) {
                onDeleted?.(theme, ALREADY_DELETED_MESSAGE);
                onClose();
                return;
            }
            setError(err?.message || "Er is iets misgegaan bij het verwijderen van het thema.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Modal
            isModalOpen={isOpen}
            setIsModalOpen={onClose}
            modalHeader="Thema verwijderen"
            modalSubtitle={theme?.name}
            modalIcon="delete_forever"
            maxWidth="max-w-lg"
        >
            <div data-testid="theme-delete-modal" className="flex flex-col gap-4">
                <div className="rounded-xl p-4 border bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-xl mt-0.5" aria-hidden="true">warning</span>
                        <p data-testid="theme-delete-message" className="text-sm">
                            {theme ? deleteImpactMessage(theme) : ""}
                        </p>
                    </div>
                </div>

                {error && (
                    <p role="alert" data-testid="theme-delete-error" className="text-red-600 bg-red-50 p-3 rounded-md border border-red-200 text-sm">{error}</p>
                )}

                <div className="flex gap-3 pt-1">
                    <button
                        type="button"
                        data-testid="theme-delete-cancel-button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="neu-btn flex-1 justify-center"
                    >
                        Annuleren
                    </button>
                    <button
                        type="button"
                        data-testid="theme-delete-confirm-button"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="flex-1 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-red-500 hover:bg-red-600 text-white"
                    >
                        {isDeleting ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-sm animate-spin" aria-hidden="true">hourglass_empty</span>
                                Bezig…
                            </span>
                        ) : "Verwijderen"}
                    </button>
                </div>

                <p className="text-xs text-center text-red-600 dark:text-red-400 font-medium">
                    <span className="material-symbols-outlined text-xs align-middle mr-1" aria-hidden="true">error</span>
                    Deze actie kan niet ongedaan worden gemaakt
                </p>
            </div>
        </Modal>
    );
}
