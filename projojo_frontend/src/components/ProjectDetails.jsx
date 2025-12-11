import { useState } from "react";
import { Link } from "react-router-dom";
import { createTask, IMAGE_BASE_URL } from "../services";
import { useAuth } from "../auth/AuthProvider";
import FormInput from "./FormInput";
import LocationMap from "./LocationMap";
import Modal from "./Modal";
import RichTextEditor from "./RichTextEditor";
import RichTextViewer from "./RichTextViewer";
import SkillBadge from "./SkillBadge";
import Alert from "./Alert";

export default function ProjectDetails({ project, businessId, refreshData }) {
    const isLoading = !project;
    const [error, setError] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { authData } = useAuth();
    const isOwner = authData.type === "supervisor" && authData.businessId === businessId;
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
                            <img
                                className="h-14 w-14 sm:h-16 sm:w-16 object-cover rounded-xl"
                                src={`${IMAGE_BASE_URL}${project.business.image_path}`}
                                alt="Bedrijfslogo"
                            />
                        </div>
                        <div className="flex-1">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Aangeboden door</span>
                            <p className="font-bold text-lg text-gray-700 group-hover:text-primary transition">
                                {project.business.name}
                            </p>
                            <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-0.5">
                                <span className="material-symbols-outlined text-base text-primary">location_on</span>
                                {project.business.location}
                            </p>
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
                        <div className="text-gray-600">
                            <RichTextViewer text={project.description} />
                        </div>
                    </div>
                )}

                {/* Skills section */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <p className="neu-label mb-3">Gevraagde skills</p>
                        <ul className="flex flex-wrap gap-2">
                            {project.topSkills?.map((skill) => (
                                <li key={skill.skillId}>
                                    <SkillBadge skillName={skill.name} isPending={skill.isPending ?? skill.is_pending} />
                                </li>
                            ))}
                            {(!project.topSkills || project.topSkills.length === 0) && (
                                <li className="text-gray-400 text-sm">Geen skills gespecificeerd</li>
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
        </div>
    )
}
