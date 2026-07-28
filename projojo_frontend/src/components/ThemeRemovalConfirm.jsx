import Modal from './Modal';

/**
 * Confirmation for a theme save that would leave a project with no themes at all.
 *
 * Shared by the project edit form (UpdateProjectPage) and the inline editor on the
 * project details page (ProjectThemeSection) so both surfaces ask the same
 * question, with the same wording and the same two choices. It is only rendered
 * when a save would really remove themes - with nothing linked there is nothing to
 * warn about.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - whether the confirmation is being asked
 * @param {() => void} props.onCancel - dismiss and cancel the whole save
 * @param {() => void} props.onConfirm - go ahead and remove every theme
 * @param {string} [props.projectName] - shown as the dialog's subtitle
 */
export default function ThemeRemovalConfirm({ isOpen, onCancel, onConfirm, projectName }) {
    return (
        <Modal
            isModalOpen={isOpen}
            setIsModalOpen={onCancel}
            modalHeader="Thema's verwijderen"
            modalSubtitle={projectName}
            modalIcon="category"
            maxWidth="max-w-lg"
        >
            <div data-testid="theme-removal-modal" className="flex flex-col gap-4">
                <div className="rounded-xl p-4 border bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-xl mt-0.5" aria-hidden="true">warning</span>
                        <p data-testid="theme-removal-message" className="text-sm">
                            {"Alle thema's worden verwijderd van dit project. Weet je het zeker?"}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 pt-1">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="neu-btn flex-1 justify-center"
                    >
                        Annuleren
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="flex-1 py-2.5 rounded-xl font-medium transition-all bg-red-500 hover:bg-red-600 text-white"
                    >
                        Ja, verwijderen
                    </button>
                </div>
            </div>
        </Modal>
    );
}