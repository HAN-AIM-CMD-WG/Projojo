import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useStudentSkills } from '../context/StudentSkillsContext';
import { getStudentRegistrations, getTaskSkills, cancelRegistration } from '../services';
import SkillBadge from '../components/SkillBadge';
import Alert from '../components/Alert';
import Loading from '../components/Loading';

/**
 * Student Dashboard - Shows active tasks, registrations and deadlines
 */
export default function StudentDashboard() {
    const { authData } = useAuth();
    const { studentName } = useStudentSkills();
    const [registrations, setRegistrations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Goedemorgen';
        if (hour < 18) return 'Goedemiddag';
        return 'Goedenavond';
    };

    useEffect(() => {
        if (authData.isLoading || authData.type !== 'student') {
            setIsLoading(false);
            return;
        }

        let ignore = false;
        setIsLoading(true);

        const fetchRegistrations = async () => {
            try {
                // Get all registrations with task details and status
                const tasks = await getStudentRegistrations();
                
                if (ignore) return;
                
                if (!tasks || tasks.length === 0) {
                    setRegistrations([]);
                    setIsLoading(false);
                    return;
                }

                // Fetch skills for each task
                const tasksWithSkills = await Promise.all(
                    tasks.map(async (task) => {
                        try {
                            const skillsData = await getTaskSkills(task.id);
                            return { ...task, skills: skillsData.skills || [] };
                        } catch {
                            return { ...task, skills: [] };
                        }
                    })
                );

                if (ignore) return;

                // Sort by status (accepted first, then pending)
                const sortedTasks = tasksWithSkills.sort((a, b) => {
                    if (a.is_accepted === true && b.is_accepted !== true) return -1;
                    if (a.is_accepted !== true && b.is_accepted === true) return 1;
                    return 0;
                });

                setRegistrations(sortedTasks);
            } catch (err) {
                if (ignore) return;
                setError(err.message);
            } finally {
                if (ignore) return;
                setIsLoading(false);
            }
        };

        fetchRegistrations();

        return () => {
            ignore = true;
        };
    }, [authData.isLoading, authData.type]);

    // Separate active (accepted), pending, and rejected registrations
    // is_accepted: true = accepted, false = rejected, null/undefined = pending
    const activeTasks = registrations.filter(t => t.is_accepted === true);
    const pendingRegistrations = registrations.filter(t => t.is_accepted === null || t.is_accepted === undefined);
    const rejectedRegistrations = registrations.filter(t => t.is_accepted === false);

    // Handle cancellation - remove from local state
    const handleCancelRegistration = (taskId) => {
        setRegistrations(prev => prev.filter(t => t.id !== taskId));
    };

    // Show different dashboard for non-students
    if (authData.type !== 'student') {
        return (
            <div className="space-y-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-extrabold text-gray-700 tracking-tight">
                        {getGreeting()}!
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                        Welkom bij Projojo
                    </p>
                </div>
                
                <div className="neu-flat p-8 text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-400 mb-3">dashboard</span>
                    <p className="text-gray-600 font-medium">
                        Het dashboard is momenteel alleen beschikbaar voor studenten.
                    </p>
                    <Link to="/ontdek" className="neu-btn-primary mt-4 inline-flex items-center gap-2">
                        <span className="material-symbols-outlined">explore</span>
                        Ontdek projecten
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome header */}
            <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-gray-700 tracking-tight">
                    {studentName ? `${getGreeting()}, ${studentName}!` : `${getGreeting()}!`}
                </h1>
                <p className="text-sm text-gray-500 font-medium mt-1">
                    {activeTasks.length > 0 ? (
                        <>
                            Je hebt <span className="text-primary font-bold">{activeTasks.length}</span> actieve {activeTasks.length === 1 ? 'taak' : 'taken'}
                        </>
                    ) : (
                        'Welkom bij je persoonlijke dashboard'
                    )}
                </p>
            </div>

            <Alert text={error} />

            {isLoading ? (
                <Loading />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main content - Tasks in two columns */}
                    <div className="lg:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Active Tasks Section */}
                            <section className="neu-flat p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="flex items-center gap-2 text-lg font-bold text-gray-700">
                                        <span className="material-symbols-outlined text-green-500">task_alt</span>
                                        Actieve Taken
                                    </h2>
                                    {activeTasks.length > 0 && (
                                        <span className="neu-badge-success-solid">{activeTasks.length}</span>
                                    )}
                                </div>

                                {activeTasks.length === 0 ? (
                                    <div className="neu-pressed p-6 text-center">
                                        <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">inbox</span>
                                        <p className="text-gray-500 text-sm">
                                            Nog geen actieve taken
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {activeTasks.map((task) => (
                                            <TaskCard key={task.id} task={task} status="active" />
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Pending Registrations */}
                            <section className="neu-flat p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="flex items-center gap-2 text-lg font-bold text-gray-700">
                                        <span className="material-symbols-outlined text-primary">schedule</span>
                                        Aanmeldingen
                                    </h2>
                                    {pendingRegistrations.length > 0 && (
                                        <span className="neu-badge-primary">{pendingRegistrations.length}</span>
                                    )}
                                </div>

                                {pendingRegistrations.length === 0 ? (
                                    <div className="neu-pressed p-6 text-center">
                                        <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">hourglass_empty</span>
                                        <p className="text-gray-500 text-sm">
                                            Geen openstaande aanmeldingen
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {pendingRegistrations.map((task) => (
                                            <TaskCard 
                                                key={task.id} 
                                                task={task} 
                                                status="pending" 
                                                onCancel={handleCancelRegistration}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Stats */}
                        <section className="neu-flat p-5">
                            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4">
                                Overzicht
                            </h3>
                            <div className="space-y-3">
                                <StatItem 
                                    icon="check_circle" 
                                    label="Actieve taken" 
                                    value={activeTasks.length}
                                    color="text-green-500"
                                />
                                <StatItem 
                                    icon="hourglass_top" 
                                    label="In behandeling" 
                                    value={pendingRegistrations.length}
                                    color="text-primary"
                                />
                                {rejectedRegistrations.length > 0 && (
                                    <StatItem 
                                        icon="cancel" 
                                        label="Afgewezen" 
                                        value={rejectedRegistrations.length}
                                        color="text-red-500"
                                    />
                                )}
                            </div>
                        </section>

                        {/* Quick Actions */}
                        <section className="neu-flat p-5">
                            <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4">
                                Snelle acties
                            </h3>
                            <div className="space-y-2">
                                <Link to={`/student/${authData.userId}`} className="neu-btn w-full justify-start gap-3 !text-sm">
                                    <span className="material-symbols-outlined text-primary">person</span>
                                    Mijn profiel
                                </Link>
                                <Link to="/ontdek" className="neu-btn w-full justify-start gap-3 !text-sm">
                                    <span className="material-symbols-outlined text-primary">explore</span>
                                    Ontdek projecten
                                </Link>
                            </div>
                        </section>

                        {/* Tips section */}
                        <section className="neu-pressed p-5">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-primary">lightbulb</span>
                                <div>
                                    <h4 className="font-bold text-gray-700 text-sm">Tip</h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Voeg skills toe aan je profiel om betere matches te krijgen met beschikbare taken.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Task Card component for the dashboard
 */
function TaskCard({ task, status, onCancel }) {
    const { studentSkills } = useStudentSkills();
    const studentSkillIds = new Set(studentSkills.map(s => s.id));
    const [isCancelling, setIsCancelling] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [cancelError, setCancelError] = useState(null);

    const handleCancelClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowConfirm(true);
    };

    const handleConfirmCancel = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (isCancelling) return;
        
        setIsCancelling(true);
        setCancelError(null);
        
        try {
            await cancelRegistration(task.id);
            if (onCancel) onCancel(task.id);
        } catch (err) {
            setCancelError(err.message || 'Er is iets misgegaan');
            setIsCancelling(false);
            setShowConfirm(false);
        }
    };

    const handleCancelConfirm = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowConfirm(false);
    };
    
    const statusConfig = {
        active: {
            badge: 'neu-badge-success-solid',
            badgeText: 'Aangenomen',
            borderColor: 'border-l-green-500'
        },
        pending: {
            badge: 'neu-badge-outline',
            badgeText: 'In behandeling',
            borderColor: 'border-l-primary'
        },
        rejected: {
            badge: 'neu-badge-error',
            badgeText: 'Afgewezen',
            borderColor: 'border-l-red-500'
        }
    };

    const config = statusConfig[status] || statusConfig.pending;

    // Strip HTML from description and limit to ~40 words
    const cleanDescription = task.description 
        ? task.description.replace(/<[^>]*>/g, '').trim()
        : '';
    const truncatedDescription = cleanDescription
        .split(' ')
        .slice(0, 40)
        .join(' ') + (cleanDescription.split(' ').length > 40 ? '...' : '');

    // Build the correct link
    const linkTo = task.project_id 
        ? `/projects/${task.project_id}#task-${task.id}`
        : `/tasks/${task.id}`;

    return (
        <Link 
            to={linkTo}
            className={`block neu-btn !p-4 !text-left border-l-4 ${config.borderColor}`}
        >
            {/* Status badge */}
            <div className="mb-2">
                <span className={config.badge}>{config.badgeText}</span>
            </div>

            {/* Task name */}
            <h4 className="font-bold text-gray-700 mb-2">
                {task.name || 'Taak'}
            </h4>

            {/* Description - normal weight */}
            {truncatedDescription && (
                <p className="text-sm text-gray-500 font-normal mb-3">
                    {truncatedDescription}
                </p>
            )}

            {/* Skills */}
            {task.skills && task.skills.length > 0 && (
                <div className="mb-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1.5">Vereiste skills</p>
                    <div className="flex flex-wrap gap-1.5">
                        {task.skills.slice(0, 5).map((skill) => {
                            const skillId = skill.skillId || skill.id;
                            const isMatch = studentSkillIds.has(skillId);
                            return (
                                <SkillBadge 
                                    key={skillId} 
                                    skillName={skill.name} 
                                    isPending={skill.isPending ?? skill.is_pending}
                                    isOwn={isMatch}
                                >
                                    {isMatch && (
                                        <span className="material-symbols-outlined text-xs mr-1">check</span>
                                    )}
                                </SkillBadge>
                            );
                        })}
                        {task.skills.length > 5 && (
                            <span className="text-xs text-gray-400">+{task.skills.length - 5} meer</span>
                        )}
                    </div>
                </div>
            )}

            {/* Error message */}
            {cancelError && (
                <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {cancelError}
                </p>
            )}

            {/* Confirmation dialog for pending registrations */}
            {status === 'pending' && showConfirm && (
                <div className="mb-3 p-4 neu-pressed">
                    <p className="text-sm text-gray-700 font-semibold mb-3 text-center">
                        Weet je zeker dat je deze aanmelding wilt annuleren?
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleConfirmCancel}
                            disabled={isCancelling}
                            className="neu-btn flex-1 !bg-red-500 !text-white hover:!bg-red-600"
                        >
                            {isCancelling ? (
                                <>
                                    <span className="material-symbols-outlined text-sm animate-spin mr-1">hourglass_empty</span>
                                    Bezig...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm mr-1">check</span>
                                    Ja, annuleren
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleCancelConfirm}
                            disabled={isCancelling}
                            className="neu-btn flex-1"
                        >
                            Nee, terug
                        </button>
                    </div>
                </div>
            )}

            {/* Cancel button for pending registrations - separate row */}
            {status === 'pending' && !showConfirm && (
                <button
                    onClick={handleCancelClick}
                    className="neu-btn w-full mb-3 !text-primary"
                >
                    <span className="material-symbols-outlined text-sm mr-1.5">cancel</span>
                    Aanmelding annuleren
                </button>
            )}

            {/* Footer with metadata */}
            <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
                {task.total_needed ? (
                    <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">group</span>
                        {task.total_needed} {task.total_needed === 1 ? 'plek' : 'plekken'}
                    </span>
                ) : <span />}
                
                <span className="flex items-center gap-1 text-primary font-medium">
                    Bekijk taak
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
            </div>
        </Link>
    );
}

/**
 * Stat item for the sidebar
 */
function StatItem({ icon, label, value, color }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-lg ${color}`}>{icon}</span>
                <span className="text-sm text-gray-600">{label}</span>
            </div>
            <span className="font-bold text-gray-700">{value}</span>
        </div>
    );
}
