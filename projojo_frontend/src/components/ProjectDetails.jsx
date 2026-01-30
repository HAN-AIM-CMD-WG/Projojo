import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createTask, IMAGE_BASE_URL, archiveProject, restoreProject, deleteProject } from "../services";
import { useAuth } from "../auth/AuthProvider";
import { useStudentSkills } from "../context/StudentSkillsContext";
import FormInput from "./FormInput";
import LocationMap from "./LocationMap";
import Modal from "./Modal";
import RichTextEditor from "./RichTextEditor";
import RichTextViewer from "./RichTextViewer";
import SkillBadge from "./SkillBadge";
import Alert from "./Alert";
import ProjectActionModal from "./ProjectActionModal";

export default function ProjectDetails({ project, businessId, refreshData }) {
    const isLoading = !project;
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [actionType, setActionType] = useState(null); // "archive" | "delete"
    const [affectedStudents, setAffectedStudents] = useState([]);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const { authData } = useAuth();
    const { studentSkills } = useStudentSkills();
    const studentSkillIds = new Set(studentSkills.map(s => s.skillId).filter(Boolean));
    const isOwner = authData.type === "supervisor" && authData.businessId === businessId;
    const isTeacher = authData.type === "teacher";
    const canManageProject = isOwner || isTeacher;
    const [newTaskDescription, setNewTaskDescription] = useState("");
    const [formKey, setFormKey] = useState(0);

    const formDataObj = {};

    const handleSubmit = (data) => {
        data.forEach((value, key) => {
            formDataObj[key] = value;
        });
        setError("");

        createTask(project.id, formDataObj)
            .then(() => {
                handleCloseModal();
                refreshData();
            })
            .catch(error => setError(error.message));
    }

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setNewTaskDescription("");
        setFormKey(prev => prev + 1); // Force form remount by changing key
    };

    // Project action handlers (archive/delete)
    const handleArchiveClick = async () => {
        setActionType("archive");
        setIsActionLoading(true);
        try {
            // First call without confirm to get affected students
            const result = await archiveProject(project.id, false);
            if (result.requires_confirmation) {
                setAffectedStudents(result.affected_students || []);
                setIsActionModalOpen(true);
            } else {
                // No students affected, archived directly
                setSuccessMessage(result.message);
                refreshData?.();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleRestoreClick = async () => {
        setIsActionLoading(true);
        try {
            const result = await restoreProject(project.id);
            setSuccessMessage(result.message);
            refreshData?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleDeleteClick = async () => {
        setActionType("delete");
        setIsActionLoading(true);
        try {
            // First call without confirm to get affected students
            const result = await deleteProject(project.id, false);
            if (result.requires_confirmation) {
                setAffectedStudents(result.affected_students || []);
                setIsActionModalOpen(true);
            } else {
                // No students affected, deleted directly
                setSuccessMessage(result.message);
                // Navigate back to business page after delete
                if (businessId) {
                    navigate(`/business/${businessId}`);
                } else {
                    navigate('/');
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleConfirmAction = async () => {
        setIsActionLoading(true);
        try {
            let result;
            if (actionType === "archive") {
                result = await archiveProject(project.id, true);
                setSuccessMessage(result.message);
                refreshData?.();
            } else if (actionType === "delete") {
                result = await deleteProject(project.id, true);
                setSuccessMessage(result.message);
                // Navigate back after delete
                if (businessId) {
                    navigate(`/business/${businessId}`);
                } else {
                    navigate('/');
                }
            }
            setIsActionModalOpen(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) {
        project = {
            id: 0,
            projectId: 0,
            name: "Laden...",
            title: "Laden...",
            description: "",
            business_id: "",
            image_path: "",
            created_at: ""
        }
    }

    return (
        <div className="bg-neu-bg">
            {/* Hero section with image */}
            <div className="relative">
                <div className="h-48 sm:h-64 w-full overflow-hidden neu-flat">
                        <img
                        className="w-full h-full object-cover"
                            src={isLoading ? '/loading.gif' : `${IMAGE_BASE_URL}${project.image_path}`}
                            alt={isLoading ? "Aan het laden" : "Projectafbeelding"}
                        />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    </div>
                
                {/* Project title overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="neu-badge-glass mb-2 inline-block">Project</span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-lg">
                            {project.name}
                            
                        </h1>
                        <h2 className="text-1xl font-semibold text-gray-800 tracking-wide leading-tight  m-4 pb-2">
                        {project.location && project.location.trim().length > 0 && (
                                            <div className="flex gap-1 items-center">
                                                <svg className="w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" /></svg>
                                                {project.location}
                                            </div>
                                        )}
                                        </h2>
                </div>
            </div>

            {/* Business info card */}
            <div className="p-6">
                {!isLoading && project.business && (
                                    <Link
                                        to={`/business/${project.business.id}`}
                        className="flex items-center gap-4 mb-6 neu-flat p-4 hover:translate-y-[-2px] transition-all duration-200 group"
                    >
                        <div className="shrink-0">
                            {project.business.image_path && project.business.image_path !== 'default.png' ? (
                                <img
                                    className="h-14 w-14 sm:h-16 sm:w-16 object-cover rounded-xl"
                                    src={`${IMAGE_BASE_URL}${project.business.image_path}`}
                                    alt="Bedrijfslogo"
                                />
                            ) : (
                                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    <span className="font-bold text-primary text-xl">
                                        {project.business.name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'B'}
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Aangeboden door</span>
                            <p className="font-bold text-lg text-[var(--text-primary)] group-hover:text-primary transition">
                                {project.business.name}
                            </p>
                            <div className="text-[var(--text-muted)] text-sm flex flex-col gap-1">
                                <div className="flex gap-1 items-center">
                                    <svg className="w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" /></svg>
                                    {project.business.location}
                                </div>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-gray-300 group-hover:text-primary transition">
                            chevron_right
                        </span>
                    </Link>
                )}

                {/* Description */}
                {project.description && (
                    <div className="neu-pressed p-5 rounded-2xl mb-6">
                        <p className="neu-label mb-3">Beschrijving</p>
                        <div className="text-[var(--text-secondary)]">
                            <RichTextViewer text={project.description} />
                        </div>
                    </div>
                )}

                {/* Success/Error messages */}
                {successMessage && (
                    <Alert 
                        text={successMessage} 
                        type="success" 
                        onClose={() => setSuccessMessage("")} 
                    />
                )}
                {error && (
                    <Alert 
                        text={error} 
                        onClose={() => setError("")} 
                    />
                )}

                {/* Skills section */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="neu-label mb-3">Gevraagde skills</p>
                        <ul className="flex flex-wrap gap-2">
                    {project.topSkills?.map((skill) => {
                        const isMatch = studentSkillIds.has(skill.skillId);
                        return (
                        <li key={skill.skillId}>
                                <SkillBadge 
                                    skillName={skill.name} 
                                    isPending={skill.isPending ?? skill.is_pending}
                                    isOwn={isMatch}
                                >
                                    {isMatch && (
                                        <span className="material-symbols-outlined text-xs mr-1">check</span>
                                    )}
                                </SkillBadge>
                        </li>
                        );
                    })}
                            {(!project.topSkills || project.topSkills.length === 0) && (
                                <li className="text-[var(--text-muted)] text-sm">Geen skills gespecificeerd</li>
                            )}
                </ul>
                    </div>
                {isOwner && (
                        <button className="neu-btn-primary" onClick={handleOpenModal}>
                            <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined">add</span>
                                Taak toevoegen
                            </span>
                        </button>
                    )}
                </div>

                {/* Project management buttons (for owner/teacher) */}
                {canManageProject && !isLoading && (
                    <div className="mt-6 pt-6 border-t border-[var(--neu-border)]">
                        <p className="neu-label mb-3">Projectbeheer</p>
                        <div className="flex flex-wrap gap-3">
                            {/* Archive/Restore button */}
                            {project.is_archived ? (
                                <button 
                                    className="neu-btn flex items-center gap-2 text-green-600 hover:text-green-700"
                                    onClick={handleRestoreClick}
                                    disabled={isActionLoading}
                                >
                                    <span className="material-symbols-outlined text-lg">unarchive</span>
                                    Herstellen
                                </button>
                            ) : (
                                <button 
                                    className="neu-btn flex items-center gap-2 text-amber-600 hover:text-amber-700"
                                    onClick={handleArchiveClick}
                                    disabled={isActionLoading}
                                >
                                    <span className="material-symbols-outlined text-lg">archive</span>
                                    Archiveren
                                </button>
                            )}
                            
                            {/* Delete button (teacher only) */}
                            {isTeacher && (
                                <button 
                                    className="neu-btn flex items-center gap-2 text-red-600 hover:text-red-700"
                                    onClick={handleDeleteClick}
                                    disabled={isActionLoading}
                                >
                                    <span className="material-symbols-outlined text-lg">delete_forever</span>
                                    Verwijderen
                                </button>
                            )}
                        </div>
                        
                        {/* Archived badge */}
                        {project.is_archived && (
                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm">
                                <span className="material-symbols-outlined text-base">inventory_2</span>
                                Dit project is gearchiveerd
                            </div>
                        )}
                    </div>
                )}

                {/* Location Map */}
                {!isLoading && project.business?.location && (
                    <div className="mt-6">
                        <p className="neu-label mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                            Locatie
                        </p>
                        <LocationMap 
                            address={project.business.location}
                            name={project.business.name}
                            height="200px"
                        />
                    </div>
                )}
            </div>
            {isOwner && (
                <Modal
                    modalHeader={`Nieuwe taak`}
                    isModalOpen={isModalOpen}
                    setIsModalOpen={setIsModalOpen}
                >
                    <form
                        key={formKey}
                        className="p-5"
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            formData.append("description", newTaskDescription);
                            handleSubmit(formData);
                        }}
                    >
                        <div className="flex flex-col gap-4 mb-6">
                            {error && <Alert text={error} onClose={() => setError("")} />}
                            <FormInput type="text" label={`Titel voor nieuwe taak`} placeholder={"Titel"} name={`title`} required />
                            <RichTextEditor
                                onSave={setNewTaskDescription}
                                label={`Beschrijving`}
                                required
                                max={4000}
                                defaultText={newTaskDescription}
                            />
                            <FormInput name={`totalNeeded`} label={`Aantal plekken`} type="number" min={1} initialValue="1" required />
                            
                            {/* Task dates - auto-inherit from project */}
                            <div className="pt-3 border-t border-[var(--neu-border)]">
                                <p className="neu-label mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-sm text-primary">schedule</span>
                                    Planning (optioneel)
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormInput 
                                        type="date" 
                                        label="Startdatum" 
                                        name="start_date" 
                                        initialValue={project?.start_date?.split('T')[0] || ''}
                                    />
                                    <FormInput 
                                        type="date" 
                                        label="Einddatum (deadline)" 
                                        name="end_date"
                                        initialValue={project?.end_date?.split('T')[0] || ''}
                                    />
                                </div>
                                {(project?.start_date || project?.end_date) && (
                                    <p className="text-xs text-[var(--text-muted)] mt-2">
                                        <span className="material-symbols-outlined text-xs align-middle mr-1">info</span>
                                        Datums zijn overgenomen van het project
                                    </p>
                                )}
                            </div>
                        </div>
                        <button type="submit" name="Taak Toevoegen" className="neu-btn-primary w-full">
                            <span className="flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined">add_task</span>
                                Taak toevoegen
                            </span>
                        </button>
                    </form>
                </Modal>
            )}

            {/* Project Action Modal (Archive/Delete confirmation) */}
            <ProjectActionModal
                isOpen={isActionModalOpen}
                onClose={() => {
                    setIsActionModalOpen(false);
                    setAffectedStudents([]);
                }}
                onConfirm={handleConfirmAction}
                action={actionType}
                projectName={project?.name || ""}
                affectedStudents={affectedStudents}
                isLoading={isActionLoading}
            />
        </div>
    )
}
