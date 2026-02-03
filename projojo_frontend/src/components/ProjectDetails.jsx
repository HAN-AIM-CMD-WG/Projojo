import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createTask, IMAGE_BASE_URL, archiveProject, restoreProject, deleteProject, setProjectVisibility, setProjectImpact } from "../services";
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
import { getCountdownText, calculateProgress, formatDate } from "../utils/dates";

export default function ProjectDetails({ project, tasks, businessId, refreshData }) {
    const isLoading = !project;
    
    // Scroll to task with specific skill - highlights ALL matching tasks
    const scrollToTaskWithSkill = (skillId) => {
        if (!tasks) return;
        
        // Find ALL tasks that have this skill
        const tasksWithSkill = tasks.filter(task => 
            task.skills?.some(s => (s.skillId ?? s.id) === skillId)
        );
        
        if (tasksWithSkill.length > 0) {
            // Scroll to first task
            const firstElement = document.getElementById(`task-${tasksWithSkill[0].id}`);
            firstElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight ALL matching tasks
            tasksWithSkill.forEach(task => {
                const taskElement = document.getElementById(`task-${task.id}`);
                if (taskElement) {
                    taskElement.classList.add('animate-highlight');
                    setTimeout(() => {
                        taskElement.classList.remove('animate-highlight');
                    }, 1500);
                }
            });
        }
    };
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
    const [showMap, setShowMap] = useState(false);
    const [isPublicLoading, setIsPublicLoading] = useState(false);
    const [isEditingImpact, setIsEditingImpact] = useState(false);
    const [impactText, setImpactText] = useState("");
    const [isImpactLoading, setIsImpactLoading] = useState(false);

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

    // Toggle public visibility
    const handleTogglePublic = async () => {
        if (!project?.id) return;
        setIsPublicLoading(true);
        try {
            const newPublicState = !project.is_public;
            const result = await setProjectVisibility(project.id, newPublicState);
            setSuccessMessage(result.message);
            refreshData?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsPublicLoading(false);
        }
    };

    // Save impact summary
    const handleSaveImpact = async () => {
        if (!project?.id) return;
        setIsImpactLoading(true);
        try {
            const result = await setProjectImpact(project.id, impactText.trim() || null);
            setSuccessMessage(result.message);
            setIsEditingImpact(false);
            refreshData?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsImpactLoading(false);
        }
    };

    // Check if project is completed (end_date passed)
    const isCompleted = project?.end_date && new Date(project.end_date) < new Date();

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
            {/* Compact Header with Image and Key Info */}
            <div className="flex flex-col sm:flex-row">
                {/* Project Image - Left side with neumorphic styling */}
                <div className="sm:w-52 h-40 sm:h-auto sm:min-h-[220px] flex-shrink-0 relative m-4 sm:m-5 sm:mr-0 rounded-2xl overflow-hidden neu-pressed p-1">
                    <div className="relative w-full h-full rounded-xl overflow-hidden">
                        <img
                            className="w-full h-full object-cover"
                            src={isLoading ? '/loading.gif' : `${IMAGE_BASE_URL}${project.image_path}`}
                            alt={isLoading ? "Aan het laden" : "Projectafbeelding"}
                        />
                        {/* Subtle vignette overlay for depth */}
                        <div className="absolute inset-0 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)]" />
                        {/* Archived overlay - subtle dimming only */}
                        {project.is_archived && (
                            <div className="absolute inset-0 bg-black/30" />
                        )}
                    </div>
                </div>
                
                {/* Main Info - Right side */}
                <div className="flex-1 p-4 sm:p-5">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                    Project
                                </span>
                                {project.is_archived && (
                                    <span className="text-xs font-medium text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                                        Gearchiveerd
                                    </span>
                                )}
                            </div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] leading-tight">
                                {project.name}
                            </h1>
                            {/* Business link - compact */}
                            {!isLoading && project.business && (
                                <div className="flex items-center gap-2 mt-1">
                                    <Link
                                        to={`/business/${project.business.id}`}
                                        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-primary transition group"
                                    >
                                        {project.business.image_path && project.business.image_path !== 'default.png' ? (
                                            <img
                                                className="h-5 w-5 object-cover rounded"
                                                src={`${IMAGE_BASE_URL}${project.business.image_path}`}
                                                alt=""
                                            />
                                        ) : (
                                            <span className="material-symbols-outlined text-sm">business</span>
                                        )}
                                        <span className="group-hover:underline">{project.business.name}</span>
                                    </Link>
                                    {project.business.location && (
                                        <button
                                            onClick={() => setShowMap(!showMap)}
                                            className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition ${
                                                showMap 
                                                    ? 'bg-primary/10 text-primary' 
                                                    : 'text-[var(--text-muted)] hover:text-primary hover:bg-primary/5'
                                            }`}
                                            title={showMap ? "Verberg kaart" : "Toon kaart"}
                                        >
                                            <span className="material-symbols-outlined text-xs">location_on</span>
                                            {project.business.location}
                                            <span className={`material-symbols-outlined text-xs transition-transform ${showMap ? 'rotate-180' : ''}`}>
                                                expand_more
                                            </span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {/* Add task button */}
                        {isOwner && (
                            <button className="neu-btn-primary !py-2 !px-3 text-sm flex-shrink-0" onClick={handleOpenModal}>
                                <span className="flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-base">add</span>
                                    <span className="hidden sm:inline">Taak toevoegen</span>
                                </span>
                            </button>
                        )}
                    </div>
                    
                    {/* Timeline - compact inline */}
                    {!isLoading && (project.start_date || project.end_date) && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm mb-3">
                            {project.start_date && (
                                <span className="flex items-center gap-1 text-[var(--text-muted)]">
                                    <span className="material-symbols-outlined text-sm text-primary">calendar_today</span>
                                    {formatDate(project.start_date)}
                                </span>
                            )}
                            {project.end_date && (
                                <span className="flex items-center gap-1 text-[var(--text-muted)]">
                                    <span className="material-symbols-outlined text-sm text-orange-500">event</span>
                                    {formatDate(project.end_date)}
                                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                                        ({getCountdownText(project.end_date)})
                                    </span>
                                </span>
                            )}
                            {project.start_date && project.end_date && (
                                <span className="text-xs font-semibold text-primary">
                                    {calculateProgress(project.start_date, project.end_date)}%
                                </span>
                            )}
                        </div>
                    )}
                    
                    {/* Progress bar - thin */}
                    {!isLoading && project.start_date && project.end_date && (
                        <div className="h-1.5 bg-[var(--gray-200)] rounded-full overflow-hidden mb-3">
                            <div 
                                className="h-full bg-gradient-to-r from-primary to-orange-500 rounded-full transition-all duration-500"
                                style={{ width: `${calculateProgress(project.start_date, project.end_date)}%` }}
                            />
                        </div>
                    )}
                    
                    {/* Description - truncated */}
                    {project.description && (
                        <div className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">
                            <RichTextViewer text={project.description} />
                        </div>
                    )}

                    {/* Impact Summary Section - for completed projects */}
                    {!isLoading && isCompleted && (
                        <div className="mb-3">
                            {project.impact_summary && !isEditingImpact ? (
                                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2">
                                            <span className="material-symbols-outlined text-blue-600 text-lg mt-0.5">emoji_events</span>
                                            <div>
                                                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Impact & Resultaten</p>
                                                <p className="text-sm text-blue-800">{project.impact_summary}</p>
                                            </div>
                                        </div>
                                        {canManageProject && (
                                            <button
                                                onClick={() => {
                                                    setImpactText(project.impact_summary || "");
                                                    setIsEditingImpact(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 p-1"
                                                title="Bewerk impact"
                                            >
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ) : canManageProject && (
                                <div className="p-3 rounded-lg border border-dashed border-blue-300 bg-blue-50/50">
                                    {isEditingImpact ? (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1">
                                                <span className="material-symbols-outlined text-sm">emoji_events</span>
                                                Impact & Resultaten
                                            </label>
                                            <textarea
                                                value={impactText}
                                                onChange={(e) => setImpactText(e.target.value)}
                                                placeholder="Beschrijf de impact en resultaten van dit project..."
                                                className="w-full p-2 text-sm rounded-lg border border-blue-200 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none resize-none"
                                                rows={3}
                                                maxLength={500}
                                            />
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-blue-500">{impactText.length}/500</span>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setIsEditingImpact(false)}
                                                        className="text-xs px-3 py-1.5 text-blue-600 hover:text-blue-800"
                                                    >
                                                        Annuleren
                                                    </button>
                                                    <button
                                                        onClick={handleSaveImpact}
                                                        disabled={isImpactLoading}
                                                        className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                                                    >
                                                        {isImpactLoading ? 'Opslaan...' : 'Opslaan'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditingImpact(true)}
                                            className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-800 text-sm py-2"
                                        >
                                            <span className="material-symbols-outlined text-lg">add_circle</span>
                                            Voeg impact samenvatting toe
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Skills - inline with label, clickable to jump to task */}
                    {project.topSkills && project.topSkills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-semibold text-[var(--text-muted)] mr-1">Skills:</span>
                            {project.topSkills.slice(0, 5).map((skill) => {
                                const isMatch = studentSkillIds.has(skill.skillId);
                                return (
                                    <button
                                        key={skill.skillId}
                                        onClick={() => scrollToTaskWithSkill(skill.skillId)}
                                        className="cursor-pointer hover:scale-105 transition-transform"
                                        title={`Ga naar taak met ${skill.name}`}
                                    >
                                        <SkillBadge 
                                            skillName={skill.name} 
                                            isPending={skill.isPending ?? skill.is_pending}
                                            isOwn={isMatch}
                                        />
                                    </button>
                                );
                            })}
                            {project.topSkills.length > 5 && (
                                <span className="text-xs text-[var(--text-muted)] self-center">
                                    +{project.topSkills.length - 5} meer
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Collapsible Map Section */}
            {!isLoading && showMap && project.business?.location && (
                <div className="mx-4 sm:mx-5 mt-2 mb-3 animate-fade-in rounded-xl overflow-hidden border border-[var(--neu-border)]">
                    <LocationMap 
                        address={project.business.location}
                        name={project.business.name}
                        height="140px"
                    />
                </div>
            )}
            
            {/* Success/Error messages */}
            <div className="px-4 sm:px-5">
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
            </div>

            {/* Project management - clean action bar */}
            {canManageProject && !isLoading && (
                <div className="px-4 sm:px-5 pb-4 border-t border-[var(--neu-border)] pt-3 mt-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Visibility toggle - action-oriented button */}
                        <button
                            onClick={handleTogglePublic}
                            disabled={isPublicLoading}
                            className={`
                                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                transition-all duration-200 border
                                ${isPublicLoading ? 'opacity-50 cursor-wait' : ''}
                                ${project.is_public 
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300' 
                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:border-gray-300'
                                }
                            `}
                            title={project.is_public 
                                ? 'Zichtbaar op de publieke ontdekpagina voor iedereen. Klik om te verbergen.' 
                                : 'Alleen zichtbaar voor ingelogde gebruikers. Klik om ook publiek vindbaar te maken.'
                            }
                        >
                            <span className="material-symbols-outlined text-sm">
                                {isPublicLoading ? 'sync' : (project.is_public ? 'public' : 'lock')}
                            </span>
                            {project.is_public ? 'Publiek vindbaar' : 'Niet publiek'}
                        </button>

                        {/* Archive/Restore button */}
                        {project.is_archived ? (
                            <button 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                    bg-green-50 border border-green-200 text-green-700 
                                    hover:bg-green-100 hover:border-green-300 transition-all duration-200"
                                onClick={handleRestoreClick}
                                disabled={isActionLoading}
                                title="Haal dit project uit het archief"
                            >
                                <span className="material-symbols-outlined text-sm">unarchive</span>
                                Herstellen
                            </button>
                        ) : (
                            <button 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                    bg-amber-50 border border-amber-200 text-amber-700 
                                    hover:bg-amber-100 hover:border-amber-300 transition-all duration-200"
                                onClick={handleArchiveClick}
                                disabled={isActionLoading}
                                title="Verplaats dit project naar het archief"
                            >
                                <span className="material-symbols-outlined text-sm">archive</span>
                                Archiveren
                            </button>
                        )}

                        {/* Delete button - teacher only */}
                        {isTeacher && (
                            <button 
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                                    bg-red-50 border border-red-200 text-red-700 
                                    hover:bg-red-100 hover:border-red-300 transition-all duration-200"
                                onClick={handleDeleteClick}
                                disabled={isActionLoading}
                                title="Verwijder dit project permanent"
                            >
                                <span className="material-symbols-outlined text-sm">delete</span>
                                Verwijderen
                            </button>
                        )}
                    </div>
                </div>
            )}
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
