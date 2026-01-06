import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { getSupervisorDashboard, updateRegistration } from '../services';
import SkillBadge from '../components/SkillBadge';
import Alert from '../components/Alert';
import Loading from '../components/Loading';
import { IMAGE_BASE_URL } from '../services';

/**
 * Supervisor Dashboard - Shows business projects, pending registrations and active students
 */
export default function SupervisorDashboard() {
    const { authData } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Get time-based greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Goedemorgen';
        if (hour < 18) return 'Goedemiddag';
        return 'Goedenavond';
    };

    const fetchDashboard = async () => {
        try {
            setIsLoading(true);
            const data = await getSupervisorDashboard();
            setDashboardData(data);
            setError(null);
        } catch (err) {
            setError(err.message || 'Er is iets misgegaan bij het ophalen van het dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (authData.isLoading || authData.type !== 'supervisor') {
            setIsLoading(false);
            return;
        }

        fetchDashboard();
    }, [authData.isLoading, authData.type]);

    // Show different message for non-supervisors
    if (authData.type !== 'supervisor') {
        return (
            <div className="space-y-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                        {getGreeting()}!
                    </h1>
                    <p className="text-sm text-[var(--text-muted)] font-medium mt-1">
                        Welkom bij Projojo
                    </p>
                </div>
                
                <div className="neu-flat p-8 text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-400 mb-3">business</span>
                    <p className="text-[var(--text-secondary)] font-medium">
                        Dit dashboard is alleen beschikbaar voor supervisors.
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
                <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
                    {getGreeting()}!
                </h1>
                <p className="text-sm text-[var(--text-muted)] font-medium mt-1">
                    {dashboardData?.stats?.pending_count > 0 ? (
                        <>
                            Je hebt <span className="text-primary font-bold">{dashboardData.stats.pending_count}</span> openstaande {dashboardData.stats.pending_count === 1 ? 'aanmelding' : 'aanmeldingen'}
                        </>
                    ) : (
                        'Welkom bij je bedrijfsdashboard'
                    )}
                </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
                <Link to="/projects/add" className="neu-btn-primary inline-flex items-center gap-2">
                    <span className="material-symbols-outlined">add</span>
                    Nieuw Project
                </Link>
            </div>

            <Alert text={error} />

            {isLoading ? (
                <Loading />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Pending Registrations Section */}
                        <section className="neu-flat p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
                                    <span className="material-symbols-outlined text-primary">pending_actions</span>
                                    Openstaande Aanmeldingen
                                </h2>
                                {dashboardData?.pending_registrations?.length > 0 && (
                                    <span className="neu-badge-primary">{dashboardData.pending_registrations.length}</span>
                                )}
                            </div>

                            {(!dashboardData?.pending_registrations || dashboardData.pending_registrations.length === 0) ? (
                                <div className="neu-pressed p-6 text-center">
                                    <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">inbox</span>
                                    <p className="text-[var(--text-muted)] text-sm">
                                        Geen openstaande aanmeldingen
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {dashboardData.pending_registrations.map((registration, index) => (
                                        <RegistrationCard 
                                            key={`${registration.task_id}-${registration.student_id}-${index}`} 
                                            registration={registration}
                                            onUpdate={fetchDashboard}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Projects Section */}
                        <section className="neu-flat p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
                                    <span className="material-symbols-outlined text-primary">folder</span>
                                    Mijn Projecten
                                </h2>
                                {dashboardData?.projects?.length > 0 && (
                                    <span className="neu-badge-primary">{dashboardData.projects.length}</span>
                                )}
                            </div>

                            {(!dashboardData?.projects || dashboardData.projects.length === 0) ? (
                                <div className="neu-pressed p-6 text-center">
                                    <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">folder_off</span>
                                    <p className="text-[var(--text-muted)] text-sm mb-4">
                                        Nog geen projecten aangemaakt
                                    </p>
                                    <Link to="/projects/add" className="neu-btn-primary inline-flex items-center gap-2">
                                        <span className="material-symbols-outlined">add</span>
                                        Maak je eerste project
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {dashboardData.projects.map((project) => {
                                        // Calculate pending registrations for this project
                                        const projectPendingCount = dashboardData.pending_registrations?.filter(
                                            reg => reg.project_id === project.id
                                        ).length || 0;
                                        
                                        return (
                                            <ProjectCard 
                                                key={project.id} 
                                                project={project} 
                                                pendingCount={projectPendingCount}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        {/* Active Students Section */}
                        <section className="neu-flat p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
                                    <span className="material-symbols-outlined text-green-500">group</span>
                                    Actieve Studenten
                                </h2>
                                {dashboardData?.active_students?.length > 0 && (
                                    <span className="neu-badge-success-solid">{dashboardData.active_students.length}</span>
                                )}
                            </div>

                            {(!dashboardData?.active_students || dashboardData.active_students.length === 0) ? (
                                <div className="neu-pressed p-6 text-center">
                                    <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">person_off</span>
                                    <p className="text-[var(--text-muted)] text-sm">
                                        Nog geen actieve studenten
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {dashboardData.active_students.map((student, index) => (
                                        <ActiveStudentCard 
                                            key={`${student.task_id}-${student.student_id}-${index}`} 
                                            student={student} 
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Stats */}
                        <section className="neu-flat p-5">
                            <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
                                Statistieken
                            </h3>
                            <div className="space-y-3">
                                <StatItem 
                                    icon="folder" 
                                    label="Projecten" 
                                    value={dashboardData?.stats?.total_projects || 0}
                                    color="text-primary"
                                />
                                <StatItem 
                                    icon="task" 
                                    label="Taken" 
                                    value={dashboardData?.stats?.total_tasks || 0}
                                    color="text-[var(--text-muted)]"
                                />
                                <StatItem 
                                    icon="hourglass_top" 
                                    label="Aanmeldingen" 
                                    value={dashboardData?.stats?.pending_count || 0}
                                    color="text-primary"
                                />
                                <StatItem 
                                    icon="group" 
                                    label="Actieve studenten" 
                                    value={dashboardData?.stats?.active_students_count || 0}
                                    color="text-green-500"
                                />
                            </div>
                        </section>

                        {/* Quick Actions */}
                        <section className="neu-flat p-5">
                            <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
                                Snelle acties
                            </h3>
                            <div className="space-y-2">
                                <Link to="/projects/add" className="neu-btn w-full justify-start gap-3 !text-sm">
                                    <span className="material-symbols-outlined text-primary">add_box</span>
                                    Nieuw project
                                </Link>
                                <Link to={`/business/${dashboardData?.business_id}`} className="neu-btn w-full justify-start gap-3 !text-sm">
                                    <span className="material-symbols-outlined text-primary">business</span>
                                    Bedrijfspagina
                                </Link>
                                <Link to="/ontdek" className="neu-btn w-full justify-start gap-3 !text-sm">
                                    <span className="material-symbols-outlined text-primary">explore</span>
                                    Ontdek platform
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
                                        Reageer snel op aanmeldingen om gemotiveerde studenten te behouden voor je projecten.
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
 * Registration Card component - Shows pending registration with accept/reject actions
 */
function RegistrationCard({ registration, onUpdate }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [showResponse, setShowResponse] = useState(false);
    const [response, setResponse] = useState('');
    const [actionType, setActionType] = useState(null); // 'accept' or 'reject'
    const [localError, setLocalError] = useState(null);

    const handleAction = (type) => {
        setActionType(type);
        setShowResponse(true);
        setResponse('');
    };

    const handleSubmit = async () => {
        if (isProcessing) return;
        
        setIsProcessing(true);
        setLocalError(null);

        try {
            await updateRegistration({
                taskId: registration.task_id,
                userId: registration.student_id,
                accepted: actionType === 'accept',
                response: response
            });
            
            // Refresh dashboard data
            if (onUpdate) onUpdate();
        } catch (err) {
            setLocalError(err.message || 'Er is iets misgegaan');
            setIsProcessing(false);
        }
    };

    const handleCancel = () => {
        setShowResponse(false);
        setActionType(null);
        setResponse('');
    };

    return (
        <div className="neu-flat p-5">
            {/* Main content - horizontal on desktop */}
            <div className="flex flex-col lg:flex-row gap-5">
                {/* Left: Student info */}
                <div className="flex items-start gap-4 lg:w-1/4">
                    <img 
                        src={`${IMAGE_BASE_URL}${registration.student_image}`}
                        alt={registration.student_name}
                        className="w-14 h-14 rounded-full object-cover neu-pressed flex-shrink-0"
                        onError={(e) => {
                            e.target.src = '/default_profile_picture.png';
                        }}
                    />
                    <div>
                        <Link 
                            to={`/student/${registration.student_id}`}
                            className="font-bold text-[var(--text-primary)] hover:text-primary transition-colors text-lg"
                        >
                            {registration.student_name}
                        </Link>
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                            Student
                        </p>
                        {/* Skills compact */}
                        {registration.student_skills && registration.student_skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {registration.student_skills.slice(0, 3).map((skill) => (
                                    <SkillBadge 
                                        key={skill.id} 
                                        skillName={skill.name}
                                    />
                                ))}
                                {registration.student_skills.length > 3 && (
                                    <span className="text-xs text-[var(--text-muted)] self-center">+{registration.student_skills.length - 3}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Middle: Task & Project info */}
                <div className="flex-1 lg:border-l lg:border-r lg:border-gray-100 lg:px-5">
                    <div className="neu-pressed p-4 rounded-lg">
                        <div className="flex items-start gap-3 mb-3">
                            <span className="material-symbols-outlined text-primary text-lg">task</span>
                            <div>
                                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Taak</p>
                                <Link 
                                    to={`/projects/${registration.project_id}#task-${registration.task_id}`}
                                    className="font-bold text-[var(--text-primary)] hover:text-primary transition-colors"
                                >
                                    {registration.task_name}
                                </Link>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-gray-400 text-lg">folder</span>
                            <div>
                                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Project</p>
                                <p className="font-semibold text-[var(--text-secondary)]">{registration.project_name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Motivation */}
                    {registration.motivation && (
                        <div className="mt-3">
                            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Motivatie</p>
                            <p className="text-sm text-[var(--text-secondary)] font-normal">
                                {registration.motivation}
                            </p>
                        </div>
                    )}
                </div>

                {/* Right: Actions */}
                <div className="lg:w-1/4 flex flex-col justify-center">
                    {/* Error message */}
                    {localError && (
                        <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">error</span>
                            {localError}
                        </p>
                    )}

                    {/* Response input */}
                    {showResponse ? (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1 block">
                                    {actionType === 'accept' ? 'Bericht (optioneel)' : 'Reden (optioneel)'}
                                </label>
                                <textarea
                                    value={response}
                                    onChange={(e) => setResponse(e.target.value)}
                                    className="neu-input w-full h-16 resize-none text-sm"
                                    placeholder={actionType === 'accept' ? 'Welkom!' : 'Reden...'}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSubmit}
                                    disabled={isProcessing}
                                    className={`flex-1 text-sm ${actionType === 'accept' ? 'neu-btn-primary' : 'neu-btn !text-red-500 !border-red-200 hover:!bg-red-50'}`}
                                >
                                    {isProcessing ? 'Bezig...' : 'Bevestig'}
                                </button>
                                <button
                                    onClick={handleCancel}
                                    disabled={isProcessing}
                                    className="neu-btn text-sm"
                                >
                                    Terug
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Action buttons - stacked on mobile, side-by-side on desktop */
                        <div className="flex lg:flex-col gap-2">
                            <button
                                onClick={() => handleAction('accept')}
                                className="neu-btn-primary flex-1"
                            >
                                <span className="material-symbols-outlined text-sm mr-1.5">check</span>
                                Accepteren
                            </button>
                            <button
                                onClick={() => handleAction('reject')}
                                className="neu-btn flex-1 !text-red-500 hover:!bg-red-50"
                            >
                                <span className="material-symbols-outlined text-sm mr-1.5">close</span>
                                Afwijzen
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Active Student Card component - Larger with clear project/task info
 */
function ActiveStudentCard({ student }) {
    return (
        <Link 
            to={`/student/${student.student_id}`}
            className="neu-flat-interactive !p-5 !text-left block"
        >
            {/* Student header */}
            <div className="flex items-center gap-4 mb-4">
                <img 
                    src={`${IMAGE_BASE_URL}${student.student_image}`}
                    alt={student.student_name}
                    className="w-14 h-14 rounded-full object-cover neu-pressed"
                    onError={(e) => {
                        e.target.src = '/default_profile_picture.png';
                    }}
                />
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-[var(--text-primary)] text-lg">
                        {student.student_name}
                    </p>
                    <span className="neu-badge-success-solid text-xs">Actief</span>
                </div>
            </div>
            
            {/* Project & Task info */}
            <div className="neu-pressed p-3 rounded-lg space-y-2">
                <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-gray-400 text-sm mt-0.5">folder</span>
                    <div>
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Project</p>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{student.project_name}</p>
                    </div>
                </div>
                <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-sm mt-0.5">task</span>
                    <div>
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Taak</p>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{student.task_name}</p>
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-end mt-3 text-xs text-primary font-medium">
                Bekijk profiel
                <span className="material-symbols-outlined text-sm ml-1">arrow_forward</span>
            </div>
        </Link>
    );
}

/**
 * Project Card component for the dashboard - More spacious layout
 */
function ProjectCard({ project, pendingCount = 0 }) {
    const taskCount = project.tasks?.length || 0;
    
    return (
        <Link 
            to={`/projects/${project.id}`}
            className="neu-flat-interactive !p-5 !text-left block"
        >
            {/* Project header with icon */}
            <div className="flex items-start gap-3 mb-3">
                <div className="neu-pressed p-2.5 rounded-lg relative">
                    <span className="material-symbols-outlined text-primary text-xl">folder</span>
                    {/* Pending badge on icon */}
                    {pendingCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                            {pendingCount}
                        </span>
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[var(--text-primary)] text-base leading-tight">
                        {project.name}
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                        Project
                    </p>
                </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                    <span className="material-symbols-outlined text-base text-gray-400">task</span>
                    <span className="font-semibold">{taskCount}</span>
                    <span className="text-[var(--text-muted)]">{taskCount === 1 ? 'taak' : 'taken'}</span>
                </div>
                {/* Pending registrations indicator */}
                {pendingCount > 0 && (
                    <div className="flex items-center gap-1.5 text-sm text-primary">
                        <span className="material-symbols-outlined text-base">person_add</span>
                        <span className="font-semibold">{pendingCount}</span>
                        <span className="text-primary/70">{pendingCount === 1 ? 'aanmelding' : 'aanmeldingen'}</span>
                    </div>
                )}
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                {pendingCount > 0 ? (
                    <span className="text-xs text-primary font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">priority_high</span>
                        Actie vereist
                    </span>
                ) : (
                    <span />
                )}
                <span className="flex items-center gap-1 text-primary text-sm font-medium">
                    Bekijk
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
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
