import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import FormInput from "../components/FormInput";
import Modal from "../components/Modal";
import NewSkillsManagement from "../components/NewSkillsManagement";
import PageHeader from '../components/PageHeader';
import SkeletonList from "../components/SkeletonList";
import Alert from "../components/Alert";
import { createNewBusiness, getBusinessesBasic, getArchivedBusinesses, getArchivedProjects, getArchivedTasks, archiveBusiness, restoreBusiness, restoreProject, restoreTask, IMAGE_BASE_URL } from "../services";

export default function TeacherPage() {
    const { authData } = useAuth();
    const navigation = useNavigate();
    const [error, setError] = useState(null);
    const [businesses, setBusinesses] = useState([]);
    const [archivedBusinesses, setArchivedBusinesses] = useState([]);
    const [archivedProjects, setArchivedProjects] = useState([]);
    const [archivedTasks, setArchivedTasks] = useState([]);
    const [isCreateBusinessModalVisible, setIsCreateBusinessModalVisible] = useState(false);
    const [newBusinessName, setNewBusinessName] = useState("");
    const [createNewBusinessError, setCreateNewBusinessError] = useState("");
    const [numberToReloadBusinesses, setNumberToReloadBusinesses] = useState(0);
    const [archiveModalBusiness, setArchiveModalBusiness] = useState(null);
    const [isArchiving, setIsArchiving] = useState(false);
    const [showArchivedBusinesses, setShowArchivedBusinesses] = useState(false);
    const [showArchivedProjects, setShowArchivedProjects] = useState(false);
    const [showArchivedTasks, setShowArchivedTasks] = useState(false);
    const [archiveReason, setArchiveReason] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authData.isLoading && authData.type !== 'teacher') {
            navigation("/not-found");
        }
    }, [authData.isLoading]);

    const onCreateNewBusiness = () => {
        createNewBusiness(newBusinessName)
            .then(() => {
                setCreateNewBusinessError(null);
                setIsCreateBusinessModalVisible(false);
                setNewBusinessName("");
                setNumberToReloadBusinesses(numberToReloadBusinesses + 1);
            })
            .catch(error => {
                setCreateNewBusinessError(error.message);
            })
    }

    useEffect(() => {
        let ignore = false;
        setIsLoading(true);

        // Fetch active businesses first
        getBusinessesBasic()
            .then(data => {
                if (ignore) return;
                setBusinesses(data);
            })
            .catch(err => {
                if (ignore) return;
                setError(err.message);
            })

        // Fetch archived businesses separately (non-blocking)
        getArchivedBusinesses()
            .then(data => {
                if (ignore) return;
                setArchivedBusinesses(data);
            })
            .catch(() => {
                // Silently fail - archived businesses are optional
                if (ignore) return;
                setArchivedBusinesses([]);
            })
            .finally(() => {
                if (ignore) return;
                setIsLoading(false);
            });

        getArchivedProjects()
            .then(data => {
                if (ignore) return;
                setArchivedProjects(data);
            })
            .catch(() => {
                if (ignore) return;
                setArchivedProjects([]);
            });

        getArchivedTasks()
            .then(data => {
                if (ignore) return;
                setArchivedTasks(data);
            })
            .catch(() => {
                if (ignore) return;
                setArchivedTasks([]);
            });

        return () => {
            ignore = true;
        }
    }, [numberToReloadBusinesses]);

    const handleArchiveBusiness = async () => {
        if (!archiveModalBusiness || isArchiving) return;

        setIsArchiving(true);
        try {
            await archiveBusiness(archiveModalBusiness.id, archiveReason.trim());
            setArchiveModalBusiness(null);
            setArchiveReason("");
            setNumberToReloadBusinesses(prev => prev + 1);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsArchiving(false);
        }
    };

    const handleRestoreBusiness = async (businessId) => {
        try {
            await restoreBusiness(businessId);
            // Force refresh of both lists
            setNumberToReloadBusinesses(prev => prev + 1);
        } catch (err) {
            console.error("Error restoring business:", err);
            setError(err.message || "Er ging iets mis bij het herstellen");
        }
    };

    const handleRestoreProject = async (projectId) => {
        try {
            await restoreProject(projectId);
            setNumberToReloadBusinesses(prev => prev + 1);
        } catch (err) {
            setError(err.message || "Er ging iets mis bij het herstellen van het project");
        }
    };

    const handleRestoreTask = async (taskId) => {
        try {
            await restoreTask(taskId);
            setNumberToReloadBusinesses(prev => prev + 1);
        } catch (err) {
            setError(err.message || "Er ging iets mis bij het herstellen van de taak");
        }
    };

    return (
        <>
            <Alert text={error} onClose={() => setError(null)} />
            <PageHeader name={'Beheerpagina'} />
            <div className="flex flex-wrap gap-4 justify-between mb-6">
                <button onClick={() => setIsCreateBusinessModalVisible(true)} className="neu-btn-primary">
                    <span className="material-symbols-outlined text-sm mr-2">add_business</span>
                    Organisatie aanmaken
                </button>
            </div>

            {/* Active Businesses */}
            <section className="mb-8">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">business</span>
                    Actieve Organisaties
                    <span className="neu-badge-primary ml-2">{businesses.length}</span>
                </h2>

                {isLoading ? (
                    <SkeletonList count={6} variant="business" />
                ) : businesses.length === 0 ? (
                    <div className="neu-pressed p-8 text-center">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">business</span>
                        <p className="text-[var(--text-muted)]">Nog geen organisaties aangemaakt</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {businesses.map((business) => (
                            <div key={business.id} className="neu-flat p-4">
                                <div className="flex items-start gap-3">
                                    {business.image_path && business.image_path !== 'default.png' ? (
                                        <img
                                            src={`${IMAGE_BASE_URL}${business.image_path}`}
                                            alt={business.name}
                                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                                            <span className="font-bold text-primary">
                                                {business.name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'B'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-[var(--text-primary)] truncate">{business.name}</h3>
                                        <p className="text-sm text-[var(--text-muted)] truncate">{business.location || 'Geen locatie'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Link
                                        to={`/business/${business.id}`}
                                        className="neu-btn flex-1 text-sm justify-center"
                                    >
                                        <span className="material-symbols-outlined text-sm mr-1">visibility</span>
                                        Bekijk
                                    </Link>
                                    <button
                                        onClick={() => setArchiveModalBusiness(business)}
                                        className="neu-btn text-sm !text-red-500"
                                    >
                                        <span className="material-symbols-outlined text-sm">archive</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Archived Businesses Section */}
            <section className="mb-8">
                <button
                    onClick={() => setShowArchivedBusinesses(!showArchivedBusinesses)}
                    className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4"
                >
                    <span className={`material-symbols-outlined transition-transform ${showArchivedBusinesses ? 'rotate-90' : ''}`}>
                        chevron_right
                    </span>
                    <span className="font-bold">Gearchiveerde Organisaties</span>
                    {archivedBusinesses.length > 0 && (
                        <span className="neu-badge-outline">{archivedBusinesses.length}</span>
                    )}
                </button>

                {showArchivedBusinesses && (
                    archivedBusinesses.length === 0 ? (
                        <div className="neu-pressed p-6 text-center">
                            <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">inventory_2</span>
                            <p className="text-[var(--text-muted)] text-sm">Geen gearchiveerde organisaties</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {archivedBusinesses.map((business) => (
                                <div key={business.id} className="neu-pressed p-4 opacity-75">
                                    <div className="flex items-start gap-3">
                                        {business.image_path && business.image_path !== 'default.png' ? (
                                            <img
                                                src={`${IMAGE_BASE_URL}${business.image_path}`}
                                                alt={business.name}
                                                className="w-12 h-12 rounded-xl object-cover shrink-0 grayscale"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                                                <span className="font-bold text-gray-400">
                                                    {business.name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'B'}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[var(--text-secondary)] truncate">{business.name}</h3>
                                            <p className="text-sm text-[var(--text-muted)] truncate">{business.location || 'Geen locatie'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <Link
                                            to={`/business/${business.id}`}
                                            className="neu-btn flex-1 text-sm justify-center"
                                        >
                                            <span className="material-symbols-outlined text-sm mr-1">edit</span>
                                            Bewerken
                                        </Link>
                                        <button
                                            onClick={() => handleRestoreBusiness(business.id)}
                                            className="neu-btn text-sm !text-green-600"
                                            title="Publiceren"
                                        >
                                            <span className="material-symbols-outlined text-sm">unarchive</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </section>

            <section className="mb-8">
                <button
                    onClick={() => setShowArchivedProjects(!showArchivedProjects)}
                    className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4"
                >
                    <span className={`material-symbols-outlined transition-transform ${showArchivedProjects ? 'rotate-90' : ''}`}>
                        chevron_right
                    </span>
                    <span className="font-bold">Gearchiveerde Projecten</span>
                    <span className="neu-badge-outline">{archivedProjects.length}</span>
                </button>
                {showArchivedProjects && (
                    archivedProjects.length === 0 ? (
                        <div className="neu-pressed p-6 text-center text-[var(--text-muted)] text-sm">Geen gearchiveerde projecten</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {archivedProjects.map((project) => (
                                <div key={project.id} className="neu-pressed p-4 opacity-75">
                                    <div className="flex flex-col gap-2">
                                        <h3 className="font-bold text-[var(--text-secondary)] truncate">{project.name}</h3>
                                        <p className="text-sm text-[var(--text-muted)] truncate">Business: {project.business_id || 'Onbekend'}</p>
                                        <p className="text-xs text-[var(--text-muted)] line-clamp-2">{project.archived_reason || 'Geen reden opgegeven'}</p>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <Link to={`/projects/${project.id}`} className="neu-btn flex-1 text-sm justify-center">
                                            <span className="material-symbols-outlined text-sm mr-1">visibility</span>
                                            Bekijk
                                        </Link>
                                        <button onClick={() => handleRestoreProject(project.id)} className="neu-btn text-sm !text-green-600">
                                            <span className="material-symbols-outlined text-sm">unarchive</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </section>

            <section className="mb-8">
                <button
                    onClick={() => setShowArchivedTasks(!showArchivedTasks)}
                    className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4"
                >
                    <span className={`material-symbols-outlined transition-transform ${showArchivedTasks ? 'rotate-90' : ''}`}>
                        chevron_right
                    </span>
                    <span className="font-bold">Gearchiveerde Taken</span>
                    <span className="neu-badge-outline">{archivedTasks.length}</span>
                </button>
                {showArchivedTasks && (
                    archivedTasks.length === 0 ? (
                        <div className="neu-pressed p-6 text-center text-[var(--text-muted)] text-sm">Geen gearchiveerde taken</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {archivedTasks.map((task) => (
                                <div key={task.id} className="neu-pressed p-4 opacity-75">
                                    <div className="flex flex-col gap-2">
                                        <h3 className="font-bold text-[var(--text-secondary)] truncate">{task.name}</h3>
                                        <p className="text-sm text-[var(--text-muted)] truncate">Project: {task.project_id || 'Onbekend'}</p>
                                        <p className="text-xs text-[var(--text-muted)] line-clamp-2">{task.archived_reason || 'Geen reden opgegeven'}</p>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <Link to={`/projects/${task.project_id}`} className="neu-btn flex-1 text-sm justify-center">
                                            <span className="material-symbols-outlined text-sm mr-1">visibility</span>
                                            Project
                                        </Link>
                                        <button onClick={() => handleRestoreTask(task.id)} className="neu-btn text-sm !text-green-600">
                                            <span className="material-symbols-outlined text-sm">unarchive</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </section>

            <hr className="mt-8 mb-6 border-gray-200" />
            <NewSkillsManagement />

            {/* Archive Confirmation Modal */}
            <Modal
                modalHeader="Organisatie archiveren"
                isModalOpen={!!archiveModalBusiness}
                setIsModalOpen={() => setArchiveModalBusiness(null)}
            >
                <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
                        </div>
                        <div>
                            <p className="font-semibold text-[var(--text-primary)]">
                                Weet je zeker dat je <span className="text-primary">{archiveModalBusiness?.name}</span> wilt archiveren?
                            </p>
                            <p className="text-sm text-[var(--text-muted)] mt-1">
                                De organisatie wordt verborgen voor studenten en supervisors.
                            </p>
                        </div>
                    </div>
                    <div className="mb-4">
                        <FormInput
                            label="Reden voor archivering"
                            placeholder="Waarom wordt deze organisatie gearchiveerd?"
                            value={archiveReason}
                            onChange={setArchiveReason}
                            required
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setArchiveModalBusiness(null)}
                            disabled={isArchiving}
                            className="neu-btn flex-1"
                        >
                            Annuleren
                        </button>
                        <button
                            onClick={handleArchiveBusiness}
                            disabled={isArchiving || !archiveReason.trim()}
                            className="neu-btn flex-1 !bg-red-500 !text-white hover:!bg-red-600"
                        >
                            {isArchiving ? (
                                <>
                                    <span className="material-symbols-outlined text-sm animate-spin mr-1">hourglass_empty</span>
                                    Bezig...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm mr-1">archive</span>
                                    Archiveren
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                modalHeader={`Nieuwe organisatie`}
                isModalOpen={isCreateBusinessModalVisible}
                setIsModalOpen={setIsCreateBusinessModalVisible}
            >
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        onCreateNewBusiness();
                    }}
                    className="p-4"
                >
                    <div className="flex flex-col mb-4">
                        <FormInput onChange={businessName => setNewBusinessName(businessName)} value={newBusinessName} type="text" label={`Organisatienaam`} placeholder={"Vul de naam van de organisatie in..."} name={`title`} required />
                        <p className="mt-1 text-sm italic text-[var(--text-secondary)]">De rest van de informatie vult de organisatie zelf in.</p>
                    </div>

                    {createNewBusinessError && <p className="col-span-2 text-red-600 bg-red-50 p-3 rounded-md border border-red-200 mb-2">{createNewBusinessError}</p>}
                    <button type="submit" name="Organisatie aanmaken" className="neu-btn-primary w-full justify-center">
                        <span className="material-symbols-outlined text-sm mr-2">add_business</span>
                        Organisatie aanmaken
                    </button>
                </form>
            </Modal>
        </>
    )
}
