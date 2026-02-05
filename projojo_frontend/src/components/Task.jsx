import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createRegistration, getAllRegistrations, updateRegistration, updateTaskSkills, updateTask, markTaskStarted, markTaskCompleted } from "../services";
import Alert from "./Alert";
import { useAuth } from "../auth/AuthProvider";
import { useStudentSkills } from "../context/StudentSkillsContext";
import FormInput from "./FormInput";
import InfoBox from "./InfoBox";
import Modal from "./Modal";
import RichTextEditor from "./RichTextEditor";
import RichTextViewer from "./RichTextViewer";
import SkillBadge from "./SkillBadge";
import SkillsEditor from "./SkillsEditor";
import CreateBusinessEmail from "./CreateBusinessEmail";
import { formatDate, getCountdownText } from "../utils/dates";

export default function Task({ task, setFetchAmount, businessId, allSkills, studentAlreadyRegistered }) {
    const { authData, user } = useAuth();
    const { studentSkills } = useStudentSkills();
    const studentSkillIds = new Set(studentSkills.map(s => s.skillId).filter(Boolean));
    
    // Tab state
    const [activeTab, setActiveTab] = useState('details');
    
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState("");
    const [registrationErrors, setRegistrationErrors] = useState([]);
    const [taskSkillsError, setTaskSkillsError] = useState("");
    const [isRegistrationsModalOpen, setIsRegistrationsModalOpen] = useState(false);
    const [pendingRegistrations, setPendingRegistrations] = useState([]);
    const [acceptedRegistrations, setAcceptedRegistrations] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [motivation, setMotivation] = useState("");
    const [canSubmit, setCanSubmit] = useState(true);
    const [progressLoading, setProgressLoading] = useState({});
    
    // Task editing state
    const [isSpotsModalOpen, setIsSpotsModalOpen] = useState(false);
    const [newTotalNeeded, setNewTotalNeeded] = useState(task.total_needed);
    const [newName, setNewName] = useState(task.name);
    const [newDescription, setNewDescription] = useState(task.description);
    const [newStartDate, setNewStartDate] = useState(task.start_date ? task.start_date.split('T')[0] : '');
    const [newEndDate, setNewEndDate] = useState(task.end_date ? task.end_date.split('T')[0] : '');
    const [spotsError, setSpotsError] = useState("");
    const [isSavingTask, setIsSavingTask] = useState(false);
    const [taskSkillsState, setTaskSkillsState] = useState(task.skills || []);

    const isOwner = (authData.type === "supervisor" && authData.businessId === businessId) || authData.type === "teacher";

    const isFull = task.total_accepted >= task.total_needed;
    
    // Skills are locked (can't be removed) if there are any registrations
    const hasRegistrations = (task.total_registered > 0) || (task.total_accepted > 0);
    
    // Calculate available spots
    const spotsAvailable = task.total_needed - task.total_accepted;

    // Deadline status for color coding
    const getDeadlineStatus = () => {
        if (!task.end_date) return null;
        const now = new Date();
        const deadline = new Date(task.end_date);
        const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        
        if (daysLeft < 0) return { color: 'status-badge-error', text: 'Verlopen', icon: 'error' };
        if (daysLeft <= 3) return { color: 'status-badge-warning', text: `${daysLeft}d`, icon: 'warning' };
        if (daysLeft <= 7) return { color: 'status-badge-warning', text: `${daysLeft}d`, icon: 'schedule' };
        return { color: 'status-badge-success', text: `${daysLeft}d`, icon: 'event_available' };
    };

    const deadlineStatus = getDeadlineStatus();

    // === HANDLERS (unchanged from original) ===

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;
        setError("");

        try {
            createRegistration(task.id, motivation.trim())
                .then(() => {
                    setIsModalOpen(false);
                    if (setFetchAmount) {
                        setFetchAmount(currentAmount => currentAmount + 1);
                    }
                })
                .catch(error => setError(error.message));
        } catch {
            setError("Er is iets misgegaan bij het versturen van de aanmelding.");
        }
    };

    useEffect(() => {
        if (!isOwner) return;
        let ignore = false;

        getAllRegistrations(task.id)
            .then(data => {
                if (ignore) return;
                setPendingRegistrations(data.pending || []);
                setAcceptedRegistrations(data.accepted || []);
            })
            .catch(error => {
                if (ignore) return;
                setRegistrationErrors((currentErrors) => [...currentErrors, error.message]);
            });

        return () => { ignore = true; };
    }, [isOwner, task.id]);

    const refetchRegistrations = () => {
        getAllRegistrations(task.id)
            .then(data => {
                setPendingRegistrations(data.pending || []);
                setAcceptedRegistrations(data.accepted || []);
            })
            .catch(() => {});
    };

    const handleRegistrationResponse = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userId = formData.get("userId");
        const response = formData.get("response").trim();
        const accepted = e.nativeEvent.submitter.value === "true";

        setRegistrationErrors((currentErrors) => currentErrors.filter((errorObj) => errorObj.userId !== userId));

        updateRegistration({ taskId: task.id, userId, accepted, response })
            .then(() => {
                refetchRegistrations();
                setFetchAmount((currentAmount) => currentAmount + 1);
            })
            .catch((error) => {
                setRegistrationErrors((currentErrors) => [...currentErrors, { userId, error: error.message }]);
            });
    };

    const handleMarkStarted = async (studentId) => {
        setProgressLoading(prev => ({ ...prev, [studentId]: 'starting' }));
        try {
            await markTaskStarted(task.id, studentId);
            refetchRegistrations();
        } catch (error) {
            setRegistrationErrors(prev => [...prev, { userId: studentId, error: error.message }]);
        } finally {
            setProgressLoading(prev => ({ ...prev, [studentId]: null }));
        }
    };

    const handleMarkCompleted = async (studentId) => {
        setProgressLoading(prev => ({ ...prev, [studentId]: 'completing' }));
        try {
            await markTaskCompleted(task.id, studentId);
            refetchRegistrations();
            setFetchAmount((currentAmount) => currentAmount + 1);
        } catch (error) {
            setRegistrationErrors(prev => [...prev, { userId: studentId, error: error.message }]);
        } finally {
            setProgressLoading(prev => ({ ...prev, [studentId]: null }));
        }
    };

    const handleSaveTask = async () => {
        if (!newName || newName.trim() === '') {
            setSpotsError("Taaknaam is verplicht");
            return;
        }
        if (newTotalNeeded < task.total_accepted) {
            setSpotsError(`Aantal plekken kan niet lager zijn dan ${task.total_accepted} (al geaccepteerd)`);
            return;
        }
        if (newStartDate && newEndDate && new Date(newStartDate) > new Date(newEndDate)) {
            setSpotsError("Startdatum kan niet na de einddatum liggen");
            return;
        }

        setIsSavingTask(true);
        setSpotsError("");

        try {
            const formData = new FormData();
            formData.append('name', newName.trim());
            formData.append('description', newDescription || '');
            formData.append('total_needed', newTotalNeeded);
            if (newStartDate) formData.append('start_date', newStartDate);
            if (newEndDate) formData.append('end_date', newEndDate);
            
            await updateTask(task.id, formData);
            setIsSpotsModalOpen(false);
            setFetchAmount((currentAmount) => currentAmount + 1);
        } catch (error) {
            setSpotsError(error.message);
        } finally {
            setIsSavingTask(false);
        }
    };

    const handleSaveTaskWithSkills = async () => {
        if (!newName || newName.trim() === '') {
            setSpotsError("Taaknaam is verplicht");
            return;
        }
        if (newTotalNeeded < task.total_accepted) {
            setSpotsError(`Aantal plekken kan niet lager zijn dan ${task.total_accepted} (al geaccepteerd)`);
            return;
        }
        if (newStartDate && newEndDate && new Date(newStartDate) > new Date(newEndDate)) {
            setSpotsError("Startdatum kan niet na de einddatum liggen");
            return;
        }

        setIsSavingTask(true);
        setSpotsError("");
        setTaskSkillsError("");

        try {
            const skillIds = taskSkillsState.map((skill) => skill.skillId || skill.id);
            const result = await updateTaskSkills(task.id, skillIds);
            
            if (result.locked) {
                setTaskSkillsError("Skills konden niet worden gewijzigd omdat er al aanmeldingen zijn.");
                return;
            }
            
            const formData = new FormData();
            formData.append('name', newName.trim());
            formData.append('description', newDescription || '');
            formData.append('total_needed', newTotalNeeded);
            if (newStartDate) formData.append('start_date', newStartDate);
            if (newEndDate) formData.append('end_date', newEndDate);
            
            await updateTask(task.id, formData);
            setIsEditing(false);
            setFetchAmount((currentAmount) => currentAmount + 1);
        } catch (error) {
            setSpotsError(error.message);
        } finally {
            setIsSavingTask(false);
        }
    };

    const openEditModal = () => {
        setNewName(task.name);
        setNewDescription(task.description);
        setNewTotalNeeded(task.total_needed);
        setNewStartDate(task.start_date ? task.start_date.split('T')[0] : '');
        setNewEndDate(task.end_date ? task.end_date.split('T')[0] : '');
        setTaskSkillsState(task.skills || []);
        setSpotsError("");
        setTaskSkillsError("");
        if (hasRegistrations) {
            setIsSpotsModalOpen(true);
        } else {
            setIsEditing(true);
        }
    };

    // === TAB DEFINITIONS ===
    const tabs = [
        { id: 'details', label: 'Details', icon: 'info' },
        { 
            id: 'team', 
            label: 'Team', 
            icon: 'group',
            // Show accepted count, warning badge for pending
            count: acceptedRegistrations.length,
            badge: pendingRegistrations.length > 0 ? `+${pendingRegistrations.length}` : null,
            badgeColor: 'bg-amber-500',
            hidden: !isOwner
        },
    ].filter(tab => !tab.hidden);

    return (
        <div className="group h-full">
            <div id={`task-${task.id}`} className="neu-flat rounded-2xl h-full flex flex-col overflow-visible">
                
                {/* === COMPACT HEADER === */}
                <div className="p-3 sm:p-4 border-b border-[var(--neu-border)] rounded-t-2xl overflow-hidden">
                    <div className="flex items-start justify-between gap-2 sm:gap-3">
                        {/* Left: Icon + Title */}
                        <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-primary/20 to-orange-400/20 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-primary text-xl sm:text-2xl">assignment</span>
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-base font-bold text-[var(--text-primary)] leading-tight line-clamp-2">
                                    {task.name}
                                </h2>
                            </div>
                        </div>
                        
                        {/* Right: Status badges + Edit button */}
                        <div className="flex items-center gap-2 shrink-0">
                            {/* Status badges */}
                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                                {/* Spots badge */}
                                <span className={spotsAvailable > 0 ? 'status-badge-success' : 'status-badge-error'}>
                                    <span className="material-symbols-outlined text-[11px]">
                                        {spotsAvailable > 0 ? 'check_circle' : 'cancel'}
                                    </span>
                                    {spotsAvailable > 0 ? `${task.total_accepted}/${task.total_needed}` : 'Vol'}
                                </span>
                                
                                {/* Deadline badge */}
                                {deadlineStatus && (
                                    <span className={deadlineStatus.color}>
                                        <span className="material-symbols-outlined text-[11px]">{deadlineStatus.icon}</span>
                                        {deadlineStatus.text}
                                    </span>
                                )}
                                
                                {/* Pending registrations indicator */}
                                {isOwner && task.total_registered > 0 && (
                                    <span className="status-badge-warning">
                                        <span className="material-symbols-outlined text-[11px]">pending</span>
                                        {task.total_registered}
                                    </span>
                                )}
                            </div>
                            
                            {/* Edit button (owner only) */}
                            {isOwner && (
                                <button 
                                    onClick={openEditModal}
                                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-primary hover:bg-[var(--gray-200)] transition-colors"
                                    title="Taak bewerken"
                                >
                                    <span className="material-symbols-outlined text-lg">{hasRegistrations ? 'lock' : 'edit'}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* === TAB NAVIGATION === */}
                <div className="flex border-b border-[var(--neu-border)] bg-[var(--gray-100)] overflow-x-auto scrollbar-none">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors relative ${
                                activeTab === tab.id
                                    ? 'text-primary'
                                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                            }`}
                        >
                            <span className="material-symbols-outlined text-base sm:text-lg">{tab.icon}</span>
                            <span>{tab.label}</span>
                            {/* Subtle count in parentheses */}
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="text-[var(--text-light)] font-normal">
                                    ({tab.count})
                                </span>
                            )}
                            {/* Warning/progress badge */}
                            {tab.badge && (
                                <span className={`ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full ${
                                    tab.badgeColor || 'bg-primary/10 text-primary'
                                } ${tab.badgeColor ? 'text-white' : ''}`}>
                                    {tab.badge}
                                </span>
                            )}
                            {/* Active indicator */}
                            {activeTab === tab.id && (
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* === TAB CONTENT === */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 min-h-[160px] sm:min-h-[180px] max-h-[250px] sm:max-h-[300px] rounded-b-2xl">
                    
                    {/* Details Tab */}
                    {activeTab === 'details' && (
                        <div className="space-y-4">
                            {/* Description */}
                            <div>
                                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Beschrijving</p>
                                <div className="text-sm text-[var(--text-secondary)] line-clamp-4">
                                    <RichTextViewer text={task.description} />
                                </div>
                            </div>
                            
                            <Alert text={taskSkillsError} onClose={() => setTaskSkillsError("")} />
                            
                            {/* Skills */}
                            <div>
                                <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Vereiste skills</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {(!task.skills || task.skills.length === 0) && (
                                        <span className="text-[var(--text-muted)] text-sm">Geen specifieke skills vereist</span>
                                    )}
                                    {task.skills && task.skills.slice(0, 6).map((skill) => {
                                        const skillId = skill.skillId ?? skill.id;
                                        const isMatch = studentSkillIds.has(skillId);
                                        return (
                                            <SkillBadge
                                                key={skillId}
                                                skillName={skill.name}
                                                isPending={skill.isPending ?? skill.is_pending}
                                                isOwn={isMatch}
                                            />
                                        );
                                    })}
                                    {task.skills && task.skills.length > 6 && (
                                        <span className="text-xs text-[var(--text-muted)] self-center">
                                            +{task.skills.length - 6} meer
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            {/* Planning */}
                            {(task.start_date || task.end_date) && (
                                <div>
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Planning</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                                        {task.start_date && formatDate(task.start_date) && (
                                            <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                                                <span className="material-symbols-outlined text-sm text-primary">calendar_today</span>
                                                Start: {formatDate(task.start_date)}
                                            </span>
                                        )}
                                        {task.end_date && formatDate(task.end_date) && (
                                            <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                                                <span className="material-symbols-outlined text-sm text-orange-500">event</span>
                                                Deadline: {formatDate(task.end_date)}
                                                {getCountdownText(task.end_date) && (
                                                    <span className="text-[var(--text-muted)]">({getCountdownText(task.end_date)})</span>
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Team Tab */}
                    {activeTab === 'team' && isOwner && (
                        <div className="space-y-4">
                            {/* Accepted members */}
                            {acceptedRegistrations.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm text-emerald-500">check_circle</span>
                                        Geaccepteerd ({acceptedRegistrations.length})
                                    </p>
                                    <div className="space-y-2">
                                        {acceptedRegistrations.map((reg) => {
                                            const isStarted = !!reg.started_at;
                                            const isCompleted = !!reg.completed_at;
                                            const isLoading = progressLoading[reg.student.id];
                                            
                                            let statusBadge = { color: 'bg-gray-100 text-gray-600', text: 'Wacht' };
                                            if (isCompleted) statusBadge = { color: 'bg-blue-100 text-blue-600', text: 'Klaar' };
                                            else if (isStarted) statusBadge = { color: 'bg-amber-100 text-amber-600', text: 'Bezig' };
                                            
                                            return (
                                                <div key={reg.student.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--gray-100)] hover:bg-[var(--gray-200)] transition-colors">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <Link 
                                                            to={`/student/${reg.student.id}`}
                                                            className="text-sm font-medium text-[var(--text-primary)] hover:text-primary truncate"
                                                            target="_blank"
                                                        >
                                                            {reg.student.full_name}
                                                        </Link>
                                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                                                            {statusBadge.text}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        {!isStarted && !isCompleted && (
                                                            <button
                                                                onClick={() => handleMarkStarted(reg.student.id)}
                                                                disabled={isLoading}
                                                                className="p-1.5 rounded text-amber-600 hover:bg-amber-100 transition-colors"
                                                                title="Start"
                                                            >
                                                                {isLoading === 'starting' 
                                                                    ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                                                    : <span className="material-symbols-outlined text-sm">play_arrow</span>
                                                                }
                                                            </button>
                                                        )}
                                                        {isStarted && !isCompleted && (
                                                            <button
                                                                onClick={() => handleMarkCompleted(reg.student.id)}
                                                                disabled={isLoading}
                                                                className="p-1.5 rounded text-emerald-600 hover:bg-emerald-100 transition-colors"
                                                                title="Afronden"
                                                            >
                                                                {isLoading === 'completing'
                                                                    ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                                                    : <span className="material-symbols-outlined text-sm">check_circle</span>
                                                                }
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                            
                            {/* Pending registrations preview */}
                            {pendingRegistrations.length > 0 && (
                                <div>
                                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm text-amber-500">pending</span>
                                        Wachtend ({pendingRegistrations.length})
                                    </p>
                                    <button
                                        onClick={() => setIsRegistrationsModalOpen(true)}
                                        className="w-full p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-lg">inbox</span>
                                        Bekijk {pendingRegistrations.length} aanmelding{pendingRegistrations.length !== 1 ? 'en' : ''}
                                    </button>
                                </div>
                            )}
                            
                            {/* Empty state */}
                            {acceptedRegistrations.length === 0 && pendingRegistrations.length === 0 && (
                                <div className="text-center py-6 text-[var(--text-muted)]">
                                    <span className="material-symbols-outlined text-3xl mb-2 block opacity-50">group_off</span>
                                    <p className="text-sm">Nog geen teamleden</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* === FOOTER ACTIONS === */}
                <div className="p-2.5 sm:p-3 border-t border-[var(--neu-border)] bg-[var(--gray-50)]">
                    {authData.type === "student" && (
                        <button 
                            className={`neu-btn-primary w-full ${(studentAlreadyRegistered || isFull) ? "opacity-50 cursor-not-allowed" : ""}`} 
                            disabled={(studentAlreadyRegistered || isFull)} 
                            onClick={() => setIsModalOpen(true)}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-lg">
                                    {studentAlreadyRegistered ? 'check' : isFull ? 'block' : 'send'}
                                </span>
                                {studentAlreadyRegistered ? "Aangemeld" : isFull ? "Vol" : "Aanmelden"}
                            </span>
                        </button>
                    )}
                    {isOwner && (
                        <div className="flex gap-2">
                            <button 
                                className="neu-btn flex-1" 
                                onClick={() => setIsRegistrationsModalOpen(true)}
                            >
                                <span className="flex items-center justify-center gap-1.5">
                                    <span className="material-symbols-outlined text-lg">group</span>
                                    <span className="hidden sm:inline">Aanmeldingen</span>
                                    {task.total_registered > 0 && (
                                        <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                                            {task.total_registered}
                                        </span>
                                    )}
                                </span>
                            </button>
                            <CreateBusinessEmail taskId={task.id} compact />
                        </div>
                    )}
                </div>
            </div>

            {/* === MODALS (unchanged structure) === */}
            
            {/* Registration modal for students */}
            {!(studentAlreadyRegistered || isFull) && (
                <Modal
                    modalHeader="Aanmelden voor taak"
                    modalSubtitle={task.name}
                    modalIcon="rocket_launch"
                    isModalOpen={isModalOpen}
                    setIsModalOpen={setIsModalOpen}
                >
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-5">
                            <div 
                                className="flex items-start gap-3 p-4 rounded-xl"
                                style={{ background: 'rgba(255, 127, 80, 0.05)', border: '1px solid rgba(255, 127, 80, 0.15)' }}
                            >
                                <span className="material-symbols-outlined text-lg mt-0.5 text-primary">lightbulb</span>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                    <span className="font-semibold text-primary">Tip:</span> Een goede motivatie vertelt waarom jij de perfecte match bent voor deze taak.
                                </p>
                            </div>

                            <Alert text={error} />

                            {task.skills && task.skills.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-[var(--text-primary)]">Jouw skills match</span>
                                        <span className="text-sm font-bold text-primary">
                                            {task.skills.filter(s => studentSkillIds.has(s.skillId ?? s.id)).length} van {task.skills.length}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {task.skills.map((skill) => {
                                            const skillId = skill.skillId ?? skill.id;
                                            const isMatch = studentSkillIds.has(skillId);
                                            return (
                                                <span 
                                                    key={skillId}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                                                        isMatch ? 'bg-primary text-white' : 'bg-[var(--gray-200)] text-[var(--text-muted)]'
                                                    }`}
                                                >
                                                    {isMatch && '✓ '}{skill.name}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <RichTextEditor
                                label="Jouw motivatie"
                                onSave={setMotivation}
                                setCanSubmit={setCanSubmit}
                            />

                            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--neu-border)]">
                                <button type="button" className="neu-btn" onClick={() => setIsModalOpen(false)}>
                                    Annuleren
                                </button>
                                <button type="submit" className="neu-btn-primary">
                                    <span className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">send</span>
                                        Verstuur aanmelding
                                    </span>
                                </button>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Registrations modal for owners */}
            {isOwner && (
                <Modal 
                    maxWidth="max-w-2xl" 
                    modalHeader="Aanmeldingen beheren"
                    modalSubtitle={task.name}
                    modalIcon="group"
                    isModalOpen={isRegistrationsModalOpen} 
                    setIsModalOpen={setIsRegistrationsModalOpen}
                >
                    <div className="flex flex-col gap-6 max-h-[60vh] overflow-y-auto pr-1">
                        {pendingRegistrations.length === 0 && acceptedRegistrations.length === 0 && (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--gray-200)] flex items-center justify-center">
                                    <span className="material-symbols-outlined text-3xl text-[var(--text-muted)]">inbox</span>
                                </div>
                                <p className="text-[var(--text-muted)] font-medium">Er zijn geen aanmeldingen voor deze taak</p>
                            </div>
                        )}

                        {acceptedRegistrations.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                                    Geaccepteerd ({acceptedRegistrations.length})
                                </h3>
                                <div className="space-y-3">
                                    {acceptedRegistrations.map((registration) => {
                                        const isStarted = !!registration.started_at;
                                        const isCompleted = !!registration.completed_at;
                                        const isLoading = progressLoading[registration.student.id];
                                        
                                        let statusColor = 'text-emerald-600 bg-emerald-100';
                                        let statusIcon = 'schedule';
                                        let statusText = 'Wacht op start';
                                        
                                        if (isCompleted) {
                                            statusColor = 'text-blue-600 bg-blue-100';
                                            statusIcon = 'task_alt';
                                            statusText = 'Afgerond';
                                        } else if (isStarted) {
                                            statusColor = 'text-amber-600 bg-amber-100';
                                            statusIcon = 'play_circle';
                                            statusText = 'Bezig';
                                        }
                                        
                                        return (
                                            <div key={registration.student.id} className="rounded-xl border border-[var(--neu-border)] bg-[var(--neu-bg)] p-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-400/20 flex items-center justify-center flex-shrink-0">
                                                            <span className="material-symbols-outlined text-emerald-600">person</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <Link to={`/student/${registration.student.id}`} className="font-bold text-[var(--text-primary)] hover:text-primary transition truncate block" target="_blank">
                                                                {registration.student.full_name}
                                                            </Link>
                                                            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusColor}`}>
                                                                <span className="material-symbols-outlined text-sm">{statusIcon}</span>
                                                                {statusText}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 flex-shrink-0">
                                                        {!isStarted && !isCompleted && (
                                                            <button onClick={() => handleMarkStarted(registration.student.id)} disabled={isLoading} className="neu-btn !py-2 !px-3 text-sm flex items-center gap-1.5 hover:bg-amber-50 hover:text-amber-600 transition-colors" title="Markeer als gestart">
                                                                {isLoading === 'starting' ? <span className="material-symbols-outlined animate-spin text-base">progress_activity</span> : <span className="material-symbols-outlined text-base">play_arrow</span>}
                                                                Start
                                                            </button>
                                                        )}
                                                        {isStarted && !isCompleted && (
                                                            <button onClick={() => handleMarkCompleted(registration.student.id)} disabled={isLoading} className="neu-btn-primary !py-2 !px-3 text-sm flex items-center gap-1.5" title="Markeer als afgerond">
                                                                {isLoading === 'completing' ? <span className="material-symbols-outlined animate-spin text-base">progress_activity</span> : <span className="material-symbols-outlined text-base">check_circle</span>}
                                                                Afronden
                                                            </button>
                                                        )}
                                                        {isCompleted && (
                                                            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                                                <span className="material-symbols-outlined text-blue-500">verified</span>
                                                                In portfolio
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Alert text={registrationErrors.find((errorObj) => errorObj.userId === registration.student.id)?.error} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {pendingRegistrations.length > 0 && (
                            <div>
                                <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-amber-500">pending</span>
                                    Wachtend op beslissing ({pendingRegistrations.length})
                                </h3>
                                {isFull && <Alert isCloseable={false} text="Deze taak is vol. Er kunnen geen nieuwe aanmeldingen meer worden geaccepteerd." />}
                                <div className="space-y-4">
                                    {pendingRegistrations.map((registration) => {
                                        const taskSkillIdsSet = new Set(task.skills?.map(s => s.skillId ?? s.id) || []);
                                        const matchingSkills = registration.student.skills.filter(s => taskSkillIdsSet.has(s.skillId ?? s.id)).length;
                                        
                                        return (
                                            <div key={registration.student.id} className="rounded-2xl overflow-hidden border border-[var(--neu-border)] bg-[var(--neu-bg)]">
                                                <div className="p-4 border-b border-[var(--neu-border)]" style={{ background: 'linear-gradient(135deg, rgba(255, 127, 80, 0.03) 0%, transparent 100%)' }}>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-orange-400/20 flex items-center justify-center">
                                                            <span className="material-symbols-outlined text-primary">person</span>
                                                        </div>
                                                        <div>
                                                            <Link to={`/student/${registration.student.id}`} className="font-bold text-[var(--text-primary)] hover:text-primary transition" target="_blank">
                                                                {registration.student.full_name}
                                                            </Link>
                                                            <p className="text-xs text-[var(--text-muted)]">
                                                                <span className="font-semibold text-primary">{matchingSkills}</span> van {task.skills?.length || 0} skills match
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-4 space-y-3">
                                                    <div>
                                                        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1 block">Motivatie</span>
                                                        <div className="text-[var(--text-secondary)] text-sm bg-[var(--gray-200)]/50 p-3 rounded-lg">
                                                            <RichTextViewer text={registration.reason} />
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {registration.student.skills.slice(0, 5).map((skill) => {
                                                            const skillId = skill.skillId ?? skill.id;
                                                            const matchesTask = taskSkillIdsSet.has(skillId);
                                                            return <SkillBadge key={skillId} skillName={skill.name} isPending={skill.isPending ?? skill.is_pending} isOwn={matchesTask} />;
                                                        })}
                                                        {registration.student.skills.length > 5 && <span className="text-xs text-[var(--text-muted)] self-center">+{registration.student.skills.length - 5} meer</span>}
                                                    </div>
                                                    <Alert text={registrationErrors.find((errorObj) => errorObj.userId === registration.student.id)?.error} />
                                                    <form onSubmit={handleRegistrationResponse} className="pt-2 border-t border-[var(--neu-border)]">
                                                        <FormInput label="Reactie (optioneel)" max={400} min={0} type="textarea" name="response" rows={2} placeholder="Voeg een persoonlijke boodschap toe..." />
                                                        <input type="hidden" name="userId" value={registration.student.id} />
                                                        <div className="flex gap-3 mt-3">
                                                            <button type="submit" value={true} disabled={isFull} className={`flex-1 rounded-xl py-2.5 font-bold transition-all text-sm ${isFull ? "bg-[var(--gray-200)] text-[var(--text-muted)] cursor-not-allowed" : "bg-emerald-500 text-white hover:bg-emerald-600 hover:-translate-y-0.5"}`} style={!isFull ? { boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' } : {}}>
                                                                <span className="flex items-center justify-center gap-2">
                                                                    <span className="material-symbols-outlined text-lg">check</span>
                                                                    Accepteren
                                                                </span>
                                                            </button>
                                                            <button type="submit" value={false} className="flex-1 rounded-xl py-2.5 font-bold bg-red-500 text-white hover:bg-red-600 hover:-translate-y-0.5 transition-all text-sm" style={{ boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                                                                <span className="flex items-center justify-center gap-2">
                                                                    <span className="material-symbols-outlined text-lg">close</span>
                                                                    Weigeren
                                                                </span>
                                                            </button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-center pt-4 mt-4 border-t border-[var(--neu-border)]">
                        <button className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors" onClick={() => setIsRegistrationsModalOpen(false)}>
                            Sluiten
                        </button>
                    </div>
                </Modal>
            )}

            {/* Task editing modal for owners */}
            {isOwner && (
                <Modal
                    modalHeader="Taak aanpassen"
                    modalSubtitle={newName || task.name}
                    modalIcon="edit"
                    isModalOpen={hasRegistrations ? isSpotsModalOpen : isEditing}
                    setIsModalOpen={hasRegistrations ? setIsSpotsModalOpen : setIsEditing}
                    maxWidth="max-w-xl"
                >
                    <div className="flex flex-col gap-4 max-h-[50vh] overflow-y-auto pr-1 pb-4">
                        {hasRegistrations && (
                            <InfoBox type="info">
                                <span className="font-semibold">Taak vergrendeld:</span> Er zijn al aanmeldingen. Je kunt alleen extra plekken toevoegen.
                            </InfoBox>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-2">
                                <label className="neu-label mb-1.5 block" htmlFor="task-name">
                                    Taaknaam
                                    {hasRegistrations && <span className="material-symbols-outlined text-xs align-middle ml-1 text-[var(--text-muted)]">lock</span>}
                                </label>
                                {hasRegistrations ? (
                                    <p className="text-[var(--text-primary)] font-medium py-2">{task.name}</p>
                                ) : (
                                    <input id="task-name" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="neu-input w-full" maxLength={50} required />
                                )}
                            </div>
                            <div>
                                <p className="neu-label mb-1.5">Plekken</p>
                                <div className="flex items-center gap-2">
                                    <button type="button" className="neu-btn !p-1.5" onClick={() => setNewTotalNeeded(Math.max(task.total_accepted || 1, newTotalNeeded - 1))} disabled={newTotalNeeded <= (task.total_accepted || 1)} aria-label="Verlaag">
                                        <span className="material-symbols-outlined text-base">remove</span>
                                    </button>
                                    <div className="neu-pressed px-4 py-1.5 rounded-lg min-w-[50px] text-center">
                                        <span className="text-xl font-bold text-[var(--text-primary)]">{newTotalNeeded}</span>
                                    </div>
                                    <button type="button" className="neu-btn !p-1.5" onClick={() => setNewTotalNeeded(newTotalNeeded + 1)} aria-label="Verhoog">
                                        <span className="material-symbols-outlined text-base">add</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="neu-label mb-1.5 block">
                                Beschrijving
                                {hasRegistrations && <span className="material-symbols-outlined text-xs align-middle ml-1 text-[var(--text-muted)]">lock</span>}
                            </label>
                            {hasRegistrations ? (
                                <div className="text-[var(--text-secondary)] text-sm neu-pressed p-3 rounded-xl max-h-20 overflow-y-auto">
                                    <RichTextViewer text={task.description} />
                                </div>
                            ) : (
                                <RichTextEditor defaultText={newDescription} onSave={setNewDescription} max={4000} />
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="neu-label mb-1.5 block" htmlFor="task-start-date">
                                    <span className="material-symbols-outlined text-xs align-middle mr-1">calendar_today</span>
                                    Startdatum
                                </label>
                                <input id="task-start-date" type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} className="neu-input w-full" />
                            </div>
                            <div>
                                <label className="neu-label mb-1.5 block" htmlFor="task-end-date">
                                    <span className="material-symbols-outlined text-xs align-middle mr-1">event</span>
                                    Einddatum (deadline)
                                </label>
                                <input id="task-end-date" type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} className="neu-input w-full" />
                            </div>
                        </div>
                        <div className="pt-3 border-t border-[var(--neu-border)]">
                            <p className="neu-label mb-2">
                                Vereiste skills
                                {hasRegistrations && <span className="material-symbols-outlined text-xs align-middle ml-1 text-[var(--text-muted)]">lock</span>}
                            </p>
                            {hasRegistrations ? (
                                <div className="flex flex-wrap gap-1.5">
                                    {task.skills && task.skills.length === 0 && <span className="text-[var(--text-muted)] text-sm">Geen skills</span>}
                                    {task.skills && task.skills.map((skill) => <SkillBadge key={skill.skillId ?? skill.id} skillName={skill.name} isPending={skill.isPending ?? skill.is_pending} />)}
                                </div>
                            ) : (
                                <SkillsEditor allSkills={allSkills} initialSkills={task.skills} isEditing={true} onSave={(skills) => setTaskSkillsState(skills)} onCancel={() => setIsEditing(false)} setError={setTaskSkillsError} isAllowedToAddSkill={true} isAbsolute={false} hideSelectedSkills={false} instantApply={true} embedded={true} hideButtons={true} maxSkillsDisplayed={12}>
                                    <></>
                                </SkillsEditor>
                            )}
                        </div>
                    </div>
                    <div className="pt-4 border-t border-[var(--neu-border)]">
                        <Alert text={spotsError} onClose={() => setSpotsError("")} />
                        <Alert text={taskSkillsError} onClose={() => setTaskSkillsError("")} />
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button type="button" className="neu-btn" onClick={() => { hasRegistrations ? setIsSpotsModalOpen(false) : setIsEditing(false); }}>
                                Annuleren
                            </button>
                            <button type="button" className="neu-btn-primary" onClick={hasRegistrations ? handleSaveTask : handleSaveTaskWithSkills} disabled={isSavingTask}>
                                <span className="flex items-center gap-2">
                                    {isSavingTask ? (
                                        <><span className="material-symbols-outlined animate-spin">progress_activity</span>Opslaan...</>
                                    ) : (
                                        <><span className="material-symbols-outlined">save</span>Opslaan</>
                                    )}
                                </span>
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
