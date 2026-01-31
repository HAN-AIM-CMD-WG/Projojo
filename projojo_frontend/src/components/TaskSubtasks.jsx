import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import Modal from './Modal';
import SubtaskForm from './SubtaskForm';
import {
    getSubtasksByTask,
    createSubtask,
    claimSubtask,
    unclaimSubtask,
    completeSubtask,
    deleteSubtask,
    getSubtaskTemplates,
} from '../services';

/**
 * TaskSubtasks component - Displays and manages subtasks (deeltaken) for a task
 * 
 * Features:
 * - Checklist UI with status indicators
 * - Claim/unclaim/complete actions for students
 * - Add/delete actions for supervisors
 * - Shows who is working on what
 */
export default function TaskSubtasks({ taskId, taskName = '', businessId, isAcceptedStudent = false, isSupervisor = false, embedded = false }) {
    const { user } = useAuth();
    const [subtasks, setSubtasks] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [expandedSubtaskId, setExpandedSubtaskId] = useState(null);
    const [actionLoading, setActionLoading] = useState(null); // Track which subtask has action in progress

    // Fetch subtasks
    const fetchSubtasks = async () => {
        try {
            setLoading(true);
            const data = await getSubtasksByTask(taskId);
            setSubtasks(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching subtasks:', err);
            setError('Kon deeltaken niet laden');
        } finally {
            setLoading(false);
        }
    };

    // Fetch templates for the business (for supervisors)
    const fetchTemplates = async () => {
        if (!businessId || !isSupervisor) return;
        try {
            const data = await getSubtaskTemplates(businessId);
            setTemplates(data || []);
        } catch (err) {
            console.error('Error fetching templates:', err);
        }
    };

    useEffect(() => {
        fetchSubtasks();
        fetchTemplates();
    }, [taskId, businessId]);

    // Handle creating a new subtask
    const handleCreateSubtask = async (subtaskData) => {
        try {
            setActionLoading('create');
            await createSubtask(taskId, subtaskData);
            await fetchSubtasks();
            setShowAddModal(false);
        } catch (err) {
            console.error('Error creating subtask:', err);
            setError('Kon deeltaak niet aanmaken');
        } finally {
            setActionLoading(null);
        }
    };

    // Handle claiming a subtask
    const handleClaim = async (subtaskId) => {
        try {
            setActionLoading(subtaskId);
            await claimSubtask(subtaskId);
            await fetchSubtasks();
        } catch (err) {
            console.error('Error claiming subtask:', err);
            setError(err.message || 'Kon deeltaak niet claimen');
        } finally {
            setActionLoading(null);
        }
    };

    // Handle unclaiming a subtask
    const handleUnclaim = async (subtaskId) => {
        try {
            setActionLoading(subtaskId);
            await unclaimSubtask(subtaskId);
            await fetchSubtasks();
        } catch (err) {
            console.error('Error unclaiming subtask:', err);
            setError(err.message || 'Kon deeltaak niet vrijgeven');
        } finally {
            setActionLoading(null);
        }
    };

    // Handle completing a subtask
    const handleComplete = async (subtaskId) => {
        try {
            setActionLoading(subtaskId);
            await completeSubtask(subtaskId);
            await fetchSubtasks();
        } catch (err) {
            console.error('Error completing subtask:', err);
            setError(err.message || 'Kon deeltaak niet voltooien');
        } finally {
            setActionLoading(null);
        }
    };

    // Handle deleting a subtask
    const handleDelete = async (subtaskId) => {
        if (!confirm('Weet je zeker dat je deze deeltaak wilt verwijderen?')) return;
        
        try {
            setActionLoading(subtaskId);
            await deleteSubtask(subtaskId);
            await fetchSubtasks();
        } catch (err) {
            console.error('Error deleting subtask:', err);
            setError(err.message || 'Kon deeltaak niet verwijderen');
        } finally {
            setActionLoading(null);
        }
    };

    // Get status styling
    const getStatusStyle = (status) => {
        switch (status) {
            case 'done':
                return {
                    bg: 'bg-green-100 dark:bg-green-900/30',
                    border: 'border-green-500',
                    text: 'text-green-700 dark:text-green-400',
                    icon: 'check_circle',
                };
            case 'in_progress':
                return {
                    bg: 'bg-blue-100 dark:bg-blue-900/30',
                    border: 'border-blue-500',
                    text: 'text-blue-700 dark:text-blue-400',
                    icon: 'pending',
                };
            default: // open
                return {
                    bg: 'bg-[var(--neu-bg)]',
                    border: 'border-[var(--neu-border)]',
                    text: 'text-[var(--text-muted)]',
                    icon: 'radio_button_unchecked',
                };
        }
    };

    // Count stats
    const stats = {
        total: subtasks.length,
        open: subtasks.filter(s => s.status === 'open').length,
        inProgress: subtasks.filter(s => s.status === 'in_progress').length,
        done: subtasks.filter(s => s.status === 'done').length,
    };

    // Wrapper class depends on whether component is embedded (in a tab) or standalone
    const wrapperClass = embedded ? "" : "neu-flat p-6 rounded-2xl";

    if (loading) {
        return (
            <div className={wrapperClass || "py-2"}>
                <div className="flex items-center gap-3 text-[var(--text-muted)]">
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span>Deeltaken laden...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={wrapperClass}>
            {/* Header - compact when embedded */}
            <div className={`flex items-center justify-between ${embedded ? 'mb-3' : 'mb-4'}`}>
                <div className="flex items-center gap-2">
                    {!embedded && <span className="material-symbols-outlined text-primary text-2xl">checklist</span>}
                    <div>
                        {!embedded && <h3 className="font-bold text-[var(--text-primary)]">Deeltaken</h3>}
                        <p className={`text-[var(--text-muted)] ${embedded ? 'text-sm font-medium' : 'text-xs'}`}>
                            {stats.done}/{stats.total} voltooid
                            {stats.inProgress > 0 && ` • ${stats.inProgress} bezig`}
                        </p>
                    </div>
                </div>
                
                {/* Add button (supervisor only) */}
                {isSupervisor && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className={`neu-btn-primary ${embedded ? '!py-1.5 !px-2.5 text-xs' : '!py-2 !px-3 text-sm'}`}
                    >
                        <span className={`material-symbols-outlined ${embedded ? 'text-sm' : 'text-base'}`}>add</span>
                        {!embedded && 'Toevoegen'}
                    </button>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-500 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined">error</span>
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            )}

            {/* Progress bar */}
            {stats.total > 0 && (
                <div className={embedded ? 'mb-3' : 'mb-4'}>
                    <div className={`bg-[var(--gray-200)] rounded-full overflow-hidden ${embedded ? 'h-1.5' : 'h-2'}`}>
                        <div 
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{ width: `${(stats.done / stats.total) * 100}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Subtasks list */}
            {subtasks.length === 0 ? (
                <div className={`text-center text-[var(--text-muted)] ${embedded ? 'py-4' : 'py-8'}`}>
                    <span className={`material-symbols-outlined mb-2 block opacity-50 ${embedded ? 'text-2xl' : 'text-4xl'}`}>task_alt</span>
                    <p className={embedded ? 'text-sm' : ''}>Nog geen deeltaken</p>
                    {isSupervisor && !embedded && (
                        <p className="text-sm mt-1">Voeg deeltaken toe zodat studenten kunnen beginnen</p>
                    )}
                </div>
            ) : (
                <div className={embedded ? 'space-y-1.5' : 'space-y-2'}>
                    {subtasks.map((subtask) => {
                        const style = getStatusStyle(subtask.status);
                        const isExpanded = expandedSubtaskId === subtask.id;
                        const isClaimedByMe = subtask.claimed_by_id === user?.id;
                        const isLoading = actionLoading === subtask.id;

                        return (
                            <div 
                                key={subtask.id}
                                className={`border ${style.border} ${style.bg} transition-all ${embedded ? 'rounded-lg' : 'rounded-xl'}`}
                            >
                                {/* Main row */}
                                <div 
                                    className={`flex items-center gap-2 cursor-pointer ${embedded ? 'p-2' : 'p-3 gap-3'}`}
                                    onClick={() => setExpandedSubtaskId(isExpanded ? null : subtask.id)}
                                >
                                    {/* Status icon */}
                                    <span className={`material-symbols-outlined ${style.text}`}>
                                        {style.icon}
                                    </span>

                                    {/* Title and claimed by info */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-medium ${subtask.status === 'done' ? 'line-through opacity-70' : ''} text-[var(--text-primary)] truncate`}>
                                            {subtask.title}
                                        </p>
                                        {subtask.claimed_by_name && (
                                            <p className="text-xs text-[var(--text-muted)]">
                                                <span className="material-symbols-outlined text-xs align-middle">person</span>
                                                {' '}{subtask.claimed_by_name}
                                                {isClaimedByMe && ' (jij)'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        {isLoading ? (
                                            <span className="material-symbols-outlined animate-spin text-[var(--text-muted)]">
                                                progress_activity
                                            </span>
                                        ) : (
                                            <>
                                                {/* Student actions */}
                                                {isAcceptedStudent && subtask.status === 'open' && (
                                                    <button
                                                        onClick={() => handleClaim(subtask.id)}
                                                        className="neu-btn !py-1 !px-2 text-xs"
                                                        title="Ik pak dit"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">front_hand</span>
                                                        Pakken
                                                    </button>
                                                )}
                                                
                                                {isClaimedByMe && subtask.status === 'in_progress' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleComplete(subtask.id)}
                                                            className="neu-btn-primary !py-1 !px-2 text-xs"
                                                            title="Markeer als klaar"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">check</span>
                                                            Klaar
                                                        </button>
                                                        <button
                                                            onClick={() => handleUnclaim(subtask.id)}
                                                            className="neu-btn !py-1 !px-2 text-xs"
                                                            title="Vrijgeven"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">undo</span>
                                                        </button>
                                                    </>
                                                )}

                                                {/* Supervisor delete (only if not claimed) */}
                                                {isSupervisor && subtask.status === 'open' && !subtask.claimed_by_id && (
                                                    <button
                                                        onClick={() => handleDelete(subtask.id)}
                                                        className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                                        title="Verwijderen"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* Expand indicator - outside stopPropagation div */}
                                    <span className={`material-symbols-outlined text-[var(--text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </div>

                                {/* Expanded details */}
                                {isExpanded && (
                                    <div className="px-4 pb-4 pt-2 border-t border-[var(--neu-border)] space-y-3">
                                        {subtask.what && (
                                            <div>
                                                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">assignment</span>
                                                    WAT
                                                </p>
                                                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{subtask.what}</p>
                                            </div>
                                        )}
                                        
                                        {subtask.why && (
                                            <div>
                                                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">lightbulb</span>
                                                    WAAROM
                                                </p>
                                                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{subtask.why}</p>
                                            </div>
                                        )}
                                        
                                        {subtask.how && (
                                            <div>
                                                <p className="text-xs font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">route</span>
                                                    HOE
                                                </p>
                                                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{subtask.how}</p>
                                            </div>
                                        )}
                                        
                                        {subtask.criteria && (
                                            <div>
                                                <p className="text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">checklist</span>
                                                    ACCEPTATIECRITERIA
                                                </p>
                                                <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">{subtask.criteria}</p>
                                            </div>
                                        )}

                                        {/* Show completion date if done */}
                                        {subtask.status === 'done' && subtask.completed_at && (
                                            <div className="pt-2 border-t border-[var(--neu-border)]">
                                                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-sm">check_circle</span>
                                                    Voltooid op {new Date(subtask.completed_at).toLocaleDateString('nl-NL')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add subtask modal */}
            <Modal
                isModalOpen={showAddModal}
                setIsModalOpen={setShowAddModal}
                modalHeader="Deeltaak toevoegen"
                modalSubtitle={taskName ? `Voor taak: ${taskName}` : "Voeg een nieuwe deeltaak toe"}
                modalIcon="add_task"
                maxWidth="max-w-lg"
            >
                <SubtaskForm
                    onSubmit={handleCreateSubtask}
                    onCancel={() => setShowAddModal(false)}
                    templates={templates}
                    isLoading={actionLoading === 'create'}
                />
            </Modal>
        </div>
    );
}
