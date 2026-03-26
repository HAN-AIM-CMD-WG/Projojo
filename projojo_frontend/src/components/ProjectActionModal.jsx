import { useState } from "react";
import Modal from "./Modal";

/**
 * ProjectActionModal - Confirmation modal for archiving/deleting projects
 * 
 * Shows a warning when students are affected, with a list of affected students
 * and requires explicit confirmation before proceeding.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onConfirm - Callback when action is confirmed
 * @param {string} props.action - "archive" | "delete"
 * @param {string} props.projectName - Name of the project
 * @param {Array} props.affectedStudents - List of affected students
 * @param {boolean} props.isLoading - Whether the action is in progress
 */
export default function ProjectActionModal({
    isOpen,
    onClose,
    onConfirm,
    action = "archive",
    projectName = "",
    affectedStudents = [],
    isLoading = false
}) {
    const [confirmed, setConfirmed] = useState(false);
    const [reason, setReason] = useState("");

    const isArchive = action === "archive";
    const isDelete = action === "delete";
    
    const handleConfirm = () => {
        if (!confirmed && affectedStudents.length > 0) return;
        onConfirm({ reason });
    };

    const handleClose = () => {
        setConfirmed(false);
        setReason("");
        onClose();
    };

    const getIcon = () => {
        if (isDelete) return "delete_forever";
        return "archive";
    };

    const getTitle = () => {
        if (isDelete) return "Project verwijderen";
        return "Project archiveren";
    };

    const getSubtitle = () => {
        return projectName;
    };

    const getWarningColor = () => {
        if (isDelete) return "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400";
        return "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400";
    };

    const getButtonColor = () => {
        if (isDelete) return "bg-red-500 hover:bg-red-600 text-white";
        return "bg-amber-500 hover:bg-amber-600 text-white";
    };

    return (
        <Modal
            isModalOpen={isOpen}
            setIsModalOpen={handleClose}
            modalHeader={getTitle()}
            modalSubtitle={getSubtitle()}
            modalIcon={getIcon()}
            maxWidth="max-w-lg"
        >
            <div className="space-y-4">
                {/* Warning message */}
                {affectedStudents.length > 0 ? (
                    <div className={`rounded-xl p-4 border ${getWarningColor()}`}>
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-xl mt-0.5">warning</span>
                            <div>
                                <p className="font-semibold">
                                    {affectedStudents.length} student{affectedStudents.length !== 1 ? 'en' : ''} gekoppeld
                                </p>
                                <p className="text-sm mt-1 opacity-90">
                                    {isDelete 
                                        ? "Deze studenten krijgen een notificatie en hun voltooide werk wordt opgeslagen in hun portfolio."
                                        : "Deze studenten krijgen een notificatie dat het project niet meer actief is."
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-[var(--text-secondary)]">
                        {isDelete 
                            ? "Er zijn geen studenten gekoppeld aan dit project. Het project wordt permanent verwijderd."
                            : "Er zijn geen studenten gekoppeld aan dit project. Het project wordt gearchiveerd."
                        }
                    </p>
                )}

                {/* Affected students list */}
                {affectedStudents.length > 0 && (
                    <div className="neu-pressed rounded-xl p-3 max-h-48 overflow-y-auto">
                        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
                            Getroffen studenten
                        </p>
                        <ul className="space-y-2">
                            {affectedStudents.map((student, index) => (
                                <li 
                                    key={student.student_id || index}
                                    className="flex items-center justify-between p-2 rounded-lg bg-[var(--neu-bg)] border border-[var(--neu-border)]"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-sm font-bold text-primary">
                                                {student.student_name?.charAt(0) || "?"}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-[var(--text-primary)]">
                                                {student.student_name}
                                            </p>
                                            <p className="text-xs text-[var(--text-muted)]">
                                                {student.task_name}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {student.is_completed ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-700 dark:text-green-400">
                                                <span className="material-symbols-outlined text-xs">check_circle</span>
                                                Voltooid
                                            </span>
                                        ) : student.is_accepted ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400">
                                                <span className="material-symbols-outlined text-xs">play_circle</span>
                                                Actief
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-600 dark:text-gray-400">
                                                <span className="material-symbols-outlined text-xs">schedule</span>
                                                Aangevraagd
                                            </span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Optional reason field */}
                <div>
                    <label 
                        htmlFor="reason" 
                        className="block text-sm font-medium text-[var(--text-secondary)] mb-1"
                    >
                        Reden (optioneel)
                    </label>
                    <textarea
                        id="reason"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder={isDelete ? "Waarom wordt dit project verwijderd?" : "Waarom wordt dit project gearchiveerd?"}
                        rows={2}
                        className="w-full px-3 py-2 rounded-xl neu-pressed text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>

                {/* Confirmation checkbox */}
                {affectedStudents.length > 0 && (
                    <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative mt-0.5">
                            <input
                                type="checkbox"
                                checked={confirmed}
                                onChange={(e) => setConfirmed(e.target.checked)}
                                className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded-md border-2 transition-all ${
                                confirmed 
                                    ? 'bg-primary border-primary' 
                                    : 'border-[var(--neu-border)] group-hover:border-primary/50'
                            }`}>
                                {confirmed && (
                                    <span className="material-symbols-outlined text-white text-sm absolute inset-0 flex items-center justify-center">
                                        check
                                    </span>
                                )}
                            </div>
                        </div>
                        <span className="text-sm text-[var(--text-secondary)]">
                            Ik begrijp dat {affectedStudents.length} student{affectedStudents.length !== 1 ? 'en' : ''} een notificatie 
                            {isDelete ? ' ontvangen en het project permanent verwijderd wordt' : ' ontvangen'}.
                        </span>
                    </label>
                )}

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="flex-1 neu-btn py-2.5 rounded-xl font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        Annuleren
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading || (affectedStudents.length > 0 && !confirmed)}
                        className={`flex-1 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${getButtonColor()}`}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                                Bezig...
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-lg">{getIcon()}</span>
                                {isDelete ? "Verwijderen" : "Archiveren"}
                            </span>
                        )}
                    </button>
                </div>

                {/* Delete warning */}
                {isDelete && (
                    <p className="text-xs text-center text-red-600 dark:text-red-400 font-medium">
                        <span className="material-symbols-outlined text-xs align-middle mr-1">error</span>
                        Deze actie kan niet ongedaan worden gemaakt
                    </p>
                )}
            </div>
        </Modal>
    );
}
