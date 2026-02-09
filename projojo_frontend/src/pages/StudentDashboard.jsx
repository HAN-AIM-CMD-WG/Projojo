import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useStudentSkills } from '../context/StudentSkillsContext';
import useBookmarks from '../hooks/useBookmarks';
import { getStudentRegistrations, getTaskSkills, cancelRegistration, getProject, IMAGE_BASE_URL } from '../services';
import SkillBadge from '../components/SkillBadge';
import Alert from '../components/Alert';
import Loading from '../components/Loading';
import SkeletonList from '../components/SkeletonList';
import StudentPortfolio from '../components/StudentPortfolio';

/**
 * Student Dashboard - Shows active tasks, registrations and deadlines
 */
// Pagination constants
const TASKS_PER_PAGE = 5;

export default function StudentDashboard() {
    const { authData } = useAuth();
    const { studentName } = useStudentSkills();
    const [registrations, setRegistrations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [visibleActiveTasks, setVisibleActiveTasks] = useState(TASKS_PER_PAGE);
    const [visiblePendingTasks, setVisiblePendingTasks] = useState(TASKS_PER_PAGE);
    const [activeTasksExpanded, setActiveTasksExpanded] = useState(false);
    const [pendingTasksExpanded, setPendingTasksExpanded] = useState(false);

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

    // Separate active (accepted but not completed), pending, and rejected registrations
    // is_accepted: true = accepted, false = rejected, null/undefined = pending
    // completed_at: set when task is finished (should only show in portfolio, not active tasks)
    const activeTasks = registrations.filter(t => t.is_accepted === true && !t.completed_at);
    const pendingRegistrations = registrations.filter(t => t.is_accepted === null || t.is_accepted === undefined);
    const rejectedRegistrations = registrations.filter(t => t.is_accepted === false);

    // Handle cancellation - remove from local state
    const handleCancelRegistration = (taskId) => {
        setRegistrations(prev => prev.filter(t => t.id !== taskId));
    };

    // Show teacher dashboard for non-students
    if (authData.type !== 'student') {
        return <TeacherDashboard />;
    }

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="pt-4 mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                    Mijn dashboard
                </h1>
                <p className="text-base text-[var(--text-muted)] font-medium mt-2">
                    {activeTasks.length > 0 ? (
                        <>
                            Je hebt <span className="text-primary font-bold">{activeTasks.length}</span> actieve {activeTasks.length === 1 ? 'taak' : 'taken'}
                        </>
                    ) : (
                        'Beheer je aanmeldingen en volg je voortgang'
                    )}
                </p>
            </div>

            <Alert text={error} />

            {/* Portfolio/Gantt Chart - At the top for quick overview */}
            {!isLoading && authData.type === 'student' && (
                <div className="mb-6">
                    <StudentPortfolio 
                        studentId={authData.userId} 
                        studentName={studentName}
                        isOwnProfile={true}
                    />
                </div>
            )}

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
                                    <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
                                        <span className="material-symbols-outlined text-green-500">task_alt</span>
                                        Actieve Taken
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        {activeTasks.length > 0 && (
                                            <>
                                                <button 
                                                    onClick={() => setActiveTasksExpanded(!activeTasksExpanded)}
                                                    className="neu-btn !py-1 !px-2 text-xs"
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        {activeTasksExpanded ? 'unfold_less' : 'unfold_more'}
                                                    </span>
                                                    {activeTasksExpanded ? 'Compact' : 'Details'}
                                                </button>
                                                <span className="neu-badge-success-solid">{activeTasks.length}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {activeTasks.length === 0 ? (
                                    <div className="neu-pressed p-6 text-center">
                                        <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">inbox</span>
                                        <p className="text-[var(--text-muted)] text-sm">
                                            Nog geen actieve taken
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {activeTasks.slice(0, visibleActiveTasks).map((task) => (
                                            <TaskCard 
                                                key={task.id} 
                                                task={task} 
                                                status="active" 
                                                isExpanded={activeTasksExpanded}
                                            />
                                        ))}
                                        {activeTasks.length > visibleActiveTasks && (
                                            <button
                                                onClick={() => setVisibleActiveTasks(v => v + TASKS_PER_PAGE)}
                                                className="neu-btn w-full justify-center gap-2 text-sm"
                                            >
                                                <span className="material-symbols-outlined text-base">expand_more</span>
                                                Toon meer ({activeTasks.length - visibleActiveTasks} resterend)
                                            </button>
                                        )}
                                    </div>
                                )}
                            </section>

                            {/* Pending Registrations */}
                            <section className="neu-flat p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
                                        <span className="material-symbols-outlined text-primary">schedule</span>
                                        Aanmeldingen
                                    </h2>
                                    <div className="flex items-center gap-2">
                                        {pendingRegistrations.length > 0 && (
                                            <>
                                                <button 
                                                    onClick={() => setPendingTasksExpanded(!pendingTasksExpanded)}
                                                    className="neu-btn !py-1 !px-2 text-xs"
                                                >
                                                    <span className="material-symbols-outlined text-sm">
                                                        {pendingTasksExpanded ? 'unfold_less' : 'unfold_more'}
                                                    </span>
                                                    {pendingTasksExpanded ? 'Compact' : 'Details'}
                                                </button>
                                                <span className="neu-badge-primary">{pendingRegistrations.length}</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {pendingRegistrations.length === 0 ? (
                                    <div className="neu-pressed p-6 text-center">
                                        <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">hourglass_empty</span>
                                        <p className="text-[var(--text-muted)] text-sm">
                                            Geen openstaande aanmeldingen
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {pendingRegistrations.slice(0, visiblePendingTasks).map((task) => (
                                            <TaskCard 
                                                key={task.id} 
                                                task={task} 
                                                status="pending" 
                                                onCancel={handleCancelRegistration}
                                                isExpanded={pendingTasksExpanded}
                                            />
                                        ))}
                                        {pendingRegistrations.length > visiblePendingTasks && (
                                            <button
                                                onClick={() => setVisiblePendingTasks(v => v + TASKS_PER_PAGE)}
                                                className="neu-btn w-full justify-center gap-2 text-sm"
                                            >
                                                <span className="material-symbols-outlined text-base">expand_more</span>
                                                Toon meer ({pendingRegistrations.length - visiblePendingTasks} resterend)
                                            </button>
                                        )}
                                    </div>
                                )}
                            </section>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Stats */}
                        <section className="neu-flat p-5">
                            <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
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
                            <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
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
                                    <h4 className="font-bold text-[var(--text-primary)] text-sm">Tip</h4>
                                    <p className="text-xs text-[var(--text-muted)] mt-1">
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
 * Teacher Dashboard - Shows saved projects and quick actions
 */
function TeacherDashboard() {
    const { bookmarkedIds, removeBookmark, bookmarkCount } = useBookmarks();
    const [savedProjects, setSavedProjects] = useState([]);
    const [isLoadingSaved, setIsLoadingSaved] = useState(false);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        if (bookmarkedIds.length === 0) {
            setSavedProjects([]);
            return;
        }

        let ignore = false;
        setIsLoadingSaved(true);
        setLoadError(null);

        Promise.all(
            bookmarkedIds.map((id) =>
                getProject(id).catch(() => null) // silently skip deleted/unavailable projects
            )
        )
            .then((results) => {
                if (ignore) return;
                const valid = results.filter(Boolean);
                setSavedProjects(valid);
                // Clean up bookmarks for projects that no longer exist
                const validIds = new Set(valid.map((p) => p.id));
                bookmarkedIds.forEach((id) => {
                    if (!validIds.has(id)) removeBookmark(id);
                });
            })
            .catch((err) => {
                if (ignore) return;
                setLoadError(err.message);
            })
            .finally(() => {
                if (ignore) return;
                setIsLoadingSaved(false);
            });

        return () => {
            ignore = true;
        };
    }, [bookmarkedIds.length]);

    const handleCopyLink = (projectId) => {
        navigator.clipboard.writeText(`${window.location.origin}/projects/${projectId}`);
    };

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="pt-4 mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                    Dashboard
                </h1>
                <p className="text-base text-[var(--text-muted)] font-medium mt-2">
                    Welkom bij Projojo
                </p>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                    to="/ontdek"
                    className="neu-flat p-5 flex items-center gap-4 hover:scale-[1.01] transition-transform group"
                >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <span className="material-symbols-outlined text-primary text-2xl" aria-hidden="true">explore</span>
                    </div>
                    <div>
                        <p className="font-bold text-[var(--text-primary)] group-hover:text-primary transition-colors">Ontdek projecten</p>
                        <p className="text-xs text-[var(--text-muted)]">Vind vraagstukken voor je onderwijs</p>
                    </div>
                </Link>
                <Link
                    to="/teacher"
                    className="neu-flat p-5 flex items-center gap-4 hover:scale-[1.01] transition-transform group"
                >
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                        <span className="material-symbols-outlined text-blue-500 text-2xl" aria-hidden="true">business</span>
                    </div>
                    <div>
                        <p className="font-bold text-[var(--text-primary)] group-hover:text-blue-500 transition-colors">Beheer organisaties</p>
                        <p className="text-xs text-[var(--text-muted)]">Organisaties en skills beheren</p>
                    </div>
                </Link>
                <div className="neu-flat p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-emerald-500 text-2xl" aria-hidden="true">bookmark</span>
                    </div>
                    <div>
                        <p className="font-bold text-[var(--text-primary)]">Opgeslagen</p>
                        <p className="text-xs text-[var(--text-muted)]">
                            {bookmarkCount === 0
                                ? 'Nog geen projecten opgeslagen'
                                : `${bookmarkCount} ${bookmarkCount === 1 ? 'project' : 'projecten'} opgeslagen`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Saved projects section */}
            <section>
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">bookmark</span>
                    Opgeslagen projecten
                    {bookmarkCount > 0 && (
                        <span className="neu-badge-primary ml-2">{bookmarkCount}</span>
                    )}
                </h2>

                {loadError && <Alert text={loadError} />}

                {isLoadingSaved ? (
                    <SkeletonList count={3} variant="business" />
                ) : savedProjects.length === 0 ? (
                    <div className="neu-flat p-8 text-center">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-3" aria-hidden="true">bookmark_border</span>
                        <p className="text-[var(--text-secondary)] font-medium mb-2">
                            Je hebt nog geen projecten opgeslagen
                        </p>
                        <p className="text-sm text-[var(--text-muted)] mb-4">
                            Ga naar Ontdek om interessante projecten te vinden en sla ze op met de bookmark-knop.
                        </p>
                        <Link to="/ontdek" className="neu-btn-primary inline-flex items-center gap-2">
                            <span className="material-symbols-outlined" aria-hidden="true">explore</span>
                            Ontdek projecten
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {savedProjects.map((project) => (
                            <div key={project.id} className="neu-flat overflow-hidden flex flex-col">
                                {/* Project image */}
                                {project.image_path && (
                                    <Link to={`/projects/${project.id}`} className="block">
                                        <img
                                            src={`${IMAGE_BASE_URL}${project.image_path}`}
                                            alt={project.name}
                                            className="w-full h-36 object-cover hover:scale-[1.02] transition-transform"
                                        />
                                    </Link>
                                )}
                                <div className="p-4 flex-1 flex flex-col">
                                    {/* Business info */}
                                    {project.business && (
                                        <div className="flex items-center gap-2 mb-2">
                                            {project.business.image_path && project.business.image_path !== 'default.png' ? (
                                                <img
                                                    src={`${IMAGE_BASE_URL}${project.business.image_path}`}
                                                    alt=""
                                                    className="w-5 h-5 rounded object-cover"
                                                />
                                            ) : (
                                                <span className="material-symbols-outlined text-sm text-[var(--text-muted)]">business</span>
                                            )}
                                            <span className="text-xs text-[var(--text-muted)] truncate">{project.business.name}</span>
                                        </div>
                                    )}
                                    {/* Title */}
                                    <Link
                                        to={`/projects/${project.id}`}
                                        className="font-bold text-[var(--text-primary)] hover:text-primary transition-colors mb-2 line-clamp-2"
                                    >
                                        {project.name}
                                    </Link>
                                    {/* Skills */}
                                    {project.tasks && project.tasks.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-3">
                                            {[...new Map(
                                                project.tasks
                                                    .flatMap((t) => t.skills || [])
                                                    .map((s) => [s.name, s])
                                            ).values()]
                                                .slice(0, 3)
                                                .map((skill) => (
                                                    <SkillBadge
                                                        key={skill.name}
                                                        skillName={skill.name}
                                                        isPending={skill.isPending ?? skill.is_pending}
                                                    />
                                                ))}
                                        </div>
                                    )}
                                    {/* Actions */}
                                    <div className="flex gap-2 mt-auto pt-3 border-t border-[var(--neu-border)]">
                                        <Link
                                            to={`/projects/${project.id}`}
                                            className="neu-btn flex-1 text-sm justify-center"
                                        >
                                            <span className="material-symbols-outlined text-sm mr-1">visibility</span>
                                            Bekijk
                                        </Link>
                                        <button
                                            onClick={() => handleCopyLink(project.id)}
                                            className="neu-btn text-sm"
                                            title="Kopieer project link"
                                        >
                                            <span className="material-symbols-outlined text-sm">share</span>
                                        </button>
                                        <button
                                            onClick={() => removeBookmark(project.id)}
                                            className="neu-btn text-sm !text-red-500"
                                            title="Verwijder uit opgeslagen"
                                            aria-label={`Verwijder ${project.name} uit opgeslagen projecten`}
                                        >
                                            <span className="material-symbols-outlined text-sm">bookmark_remove</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

/**
 * Task Card component for the dashboard
 * @param {boolean} isExpanded - Whether to show full details or compact view
 */
function TaskCard({ task, status, onCancel, isExpanded = false }) {
    const { studentSkills } = useStudentSkills();
    const studentSkillIds = new Set(studentSkills.map(s => s.skillId).filter(Boolean));
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
            {/* Business info */}
            {task.business_name && (
                <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                    {task.business_image ? (
                        <img 
                            src={`${IMAGE_BASE_URL}${task.business_image}`}
                            alt={task.business_name}
                            className="w-8 h-8 rounded-lg object-cover shrink-0 ring-1 ring-gray-200"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-gray-400 text-sm">business</span>
                        </div>
                    )}
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--text-secondary)] truncate">{task.business_name}</p>
                        {task.project_name && (
                            <p className="text-[10px] text-[var(--text-muted)] truncate">{task.project_name}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Status badge + Task name */}
            <div className={`flex flex-col gap-1 ${isExpanded ? 'mb-2' : 'mb-3'}`}>
                <span className={`${config.badge} self-start`}>{config.badgeText}</span>
                {!isExpanded && (
                    <span className="font-bold text-[var(--text-primary)]">
                        {task.name || 'Taak'}
                    </span>
                )}
            </div>

            {/* Task name - full width when expanded */}
            {isExpanded && (
                <h4 className="font-bold text-[var(--text-primary)] mb-2">
                    {task.name || 'Taak'}
                </h4>
            )}

            {/* Expanded content */}
            {isExpanded && (
                <>
                    {/* Description - normal weight */}
                    {truncatedDescription && (
                        <p className="text-sm text-[var(--text-muted)] font-normal mb-3">
                            {truncatedDescription}
                        </p>
                    )}

                    {/* Skills */}
                    {task.skills && task.skills.length > 0 && (
                        <div className="mb-3">
                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Vereiste skills</p>
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
                                    <span className="text-xs text-[var(--text-muted)]">+{task.skills.length - 5} meer</span>
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
                            <p className="text-sm text-[var(--text-primary)] font-semibold mb-3 text-center">
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
                            className="neu-btn-primary w-full mb-3"
                        >
                            <span className="material-symbols-outlined text-sm mr-1.5">cancel</span>
                            Aanmelding annuleren
                        </button>
                    )}
                </>
            )}

            {/* Footer with metadata */}
            <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-gray-100">
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
                <span className="text-sm text-[var(--text-secondary)]">{label}</span>
            </div>
            <span className="font-bold text-[var(--text-primary)]">{value}</span>
        </div>
    );
}
