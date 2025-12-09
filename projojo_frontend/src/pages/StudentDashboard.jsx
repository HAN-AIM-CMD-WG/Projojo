import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { useStudentSkills } from '../context/StudentSkillsContext';
import { getStudentRegistrations, getTaskById, IMAGE_BASE_URL } from '../services';
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
                // Get all task IDs the student registered for
                const taskIds = await getStudentRegistrations();
                
                if (ignore) return;
                
                if (!taskIds || taskIds.length === 0) {
                    setRegistrations([]);
                    setIsLoading(false);
                    return;
                }

                // Fetch details for each task
                const taskDetails = await Promise.all(
                    taskIds.map(async (taskId) => {
                        try {
                            const task = await getTaskById(taskId);
                            return task;
                        } catch {
                            return null;
                        }
                    })
                );

                if (ignore) return;

                // Filter out failed fetches and sort by status (accepted first, then pending)
                const validTasks = taskDetails
                    .filter(t => t !== null)
                    .sort((a, b) => {
                        // Accepted tasks first
                        if (a.is_accepted && !b.is_accepted) return -1;
                        if (!a.is_accepted && b.is_accepted) return 1;
                        return 0;
                    });

                setRegistrations(validTasks);
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

    // Separate active (accepted) and pending registrations
    const activeTasks = registrations.filter(t => t.is_accepted);
    const pendingRegistrations = registrations.filter(t => !t.is_accepted && !t.is_rejected);
    const rejectedRegistrations = registrations.filter(t => t.is_rejected);

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
                    {/* Main content - Active Tasks */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Active Tasks Section */}
                        <section className="neu-flat p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="flex items-center gap-2 text-lg font-bold text-gray-700">
                                    <span className="material-symbols-outlined text-primary">task_alt</span>
                                    Mijn Actieve Taken
                                </h2>
                                {activeTasks.length > 0 && (
                                    <span className="neu-badge-success-solid">{activeTasks.length} actief</span>
                                )}
                            </div>

                            {activeTasks.length === 0 ? (
                                <div className="neu-pressed p-6 text-center">
                                    <span className="material-symbols-outlined text-3xl text-gray-400 mb-2">inbox</span>
                                    <p className="text-gray-500 text-sm font-medium">
                                        Je hebt nog geen actieve taken.
                                    </p>
                                    <Link to="/ontdek" className="text-primary text-sm font-bold hover:underline mt-2 inline-block">
                                        Ontdek beschikbare projecten →
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activeTasks.map((task) => (
                                        <TaskCard key={task.id} task={task} status="active" />
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Pending Registrations */}
                        {pendingRegistrations.length > 0 && (
                            <section className="neu-flat p-6">
                                <div className="flex items-center justify-between mb-5">
                                    <h2 className="flex items-center gap-2 text-lg font-bold text-gray-700">
                                        <span className="material-symbols-outlined text-amber-500">pending</span>
                                        In Behandeling
                                    </h2>
                                    <span className="neu-badge-warning">{pendingRegistrations.length} wachtend</span>
                                </div>

                                <div className="space-y-4">
                                    {pendingRegistrations.map((task) => (
                                        <TaskCard key={task.id} task={task} status="pending" />
                                    ))}
                                </div>
                            </section>
                        )}
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
                                    color="text-green-600"
                                />
                                <StatItem 
                                    icon="hourglass_top" 
                                    label="In behandeling" 
                                    value={pendingRegistrations.length}
                                    color="text-amber-500"
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
                                <Link to="/ontdek" className="neu-btn w-full justify-start gap-3 !text-sm">
                                    <span className="material-symbols-outlined text-primary">explore</span>
                                    Ontdek projecten
                                </Link>
                                <Link to={`/student/${authData.userId}`} className="neu-btn w-full justify-start gap-3 !text-sm">
                                    <span className="material-symbols-outlined text-primary">person</span>
                                    Mijn profiel
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
function TaskCard({ task, status }) {
    const statusConfig = {
        active: {
            badge: 'neu-badge-success-solid',
            badgeText: 'Actief',
            borderColor: 'border-l-green-500'
        },
        pending: {
            badge: 'neu-badge-warning',
            badgeText: 'In behandeling',
            borderColor: 'border-l-amber-500'
        },
        rejected: {
            badge: 'neu-badge-error',
            badgeText: 'Afgewezen',
            borderColor: 'border-l-red-500'
        }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
        <Link 
            to={`/projects/${task.project_id}#task-${task.id}`}
            className={`block neu-pressed p-4 border-l-4 ${config.borderColor} hover:bg-gray-50/50 transition-colors group`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Project info */}
                    {task.project && (
                        <div className="flex items-center gap-2 mb-2">
                            {task.project.business?.image_path && (
                                <img 
                                    src={`${IMAGE_BASE_URL}${task.project.business.image_path}`}
                                    alt=""
                                    className="w-6 h-6 rounded-lg object-cover"
                                />
                            )}
                            <span className="text-xs font-medium text-gray-500 truncate">
                                {task.project.name}
                                {task.project.business && ` • ${task.project.business.name}`}
                            </span>
                        </div>
                    )}
                    
                    {/* Task name */}
                    <h4 className="font-bold text-gray-700 group-hover:text-primary transition-colors truncate">
                        {task.name}
                    </h4>
                    
                    {/* Task description preview */}
                    {task.description && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {task.description.replace(/<[^>]*>/g, '').substring(0, 100)}...
                        </p>
                    )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={config.badge}>{config.badgeText}</span>
                    <span className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">
                        arrow_forward
                    </span>
                </div>
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
