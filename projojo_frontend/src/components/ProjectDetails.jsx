import { useState } from "react";
import { Link } from "react-router-dom";
import { createTask, IMAGE_BASE_URL } from "../services";
import { useAuth } from "../auth/AuthProvider";
import FormInput from "./FormInput";
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
        <div className="inset-0 bg-gradient-to-b from-slate-100 via-slate-200 to-slate-300 z-10 rounded-lg shadow">
            <div className="flex flex-col rounded-t-lg overflow-hidden">
                <div className="flex flex-row items-start">
                    <div>
                        <img
                            className="w-full sm:w-48 h-52 sm:h-48 aspect-square object-cover"
                            src={isLoading ? '/loading.gif' : `${IMAGE_BASE_URL}${project.image_path}`}
                            alt={isLoading ? "Aan het laden" : "Projectafbeelding"}
                        />
                    </div>
                    <div className="w-full">
                        <h1 className="text-3xl font-semibold text-gray-800 tracking-wide leading-tight border-b-2 border-primary m-4 pb-2">
                            {project.name}
                        </h1>
                        <div className="flex flex-row gap-4 ms-4">
                            {!isLoading && <>
                                <Link to={`/business/${project.business.id}`} className="group">
                                    <img
                                        className="h-14 w-14 sm:h-16 sm:w-16 aspect-square object-cover rounded-full border border-gray-300 shadow-sm"
                                        src={isLoading ? '/loading.gif' : `${IMAGE_BASE_URL}${project.business.image_path}`}
                                        alt={isLoading ? "Aan het laden" : "Bedrijfslogo"}
                                    />
                                </Link>
                                <div className="max-w-[75%]">
                                    <Link
                                        to={`/business/${project.business.id}`}
                                        className="font-bold text-lg break-words text-black-800 hover:text-primary transition"
                                    >
                                        {project.business.name}
                                    </Link>
                                    <p className="text-black-600 text-sm flex gap-1">
                                        <svg className="w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" /></svg>
                                        {project.business.location.join(", ")}
                                    </p>
                                </div>
                            </>}
                        </div>
                    </div>
                </div>
                <div className="flex flex-row">
                    {project.description &&
                        <div className="flex flex-col w-full m-4">
                            <div className="mt-2 rounded-lg w-full bg-gray-100 shadow-lg">
                                <p className="text-black text-sm tracking-wider font-semibold p-4 pt-3 pb-3 border-b border-gray-300 border-solid">Beschrijving</p>
                                <div className="p-4 pt-3">
                                    <RichTextViewer text={project.description} />
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </div>

            <h2 className="text-lg font-semibold text-black-700 pt-3 px-4">
                Top {project.topSkills?.length || 0} skills van het project
            </h2>
            <div className="flex flex-row justify-between">
                <ul className="flex flex-wrap gap-3 p-4 pt-2 pb-6">
                    {project.topSkills?.map((skill) => (
                        <li key={skill.name}>
                            <SkillBadge skillName={skill.name} isPending={skill.is_pending} />
                        </li>
                    ))}
                </ul>
                {isOwner && (
                    <div className="w-fit p-4 pt-0 flex">
                        <button className="btn-primary w-full border border-gray-400" onClick={handleOpenModal}>Taak toevoegen</button>
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
                        className="p-4 md:p-5"
                        onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            formData.append("description", newTaskDescription);
                            handleSubmit(formData);
                        }}
                    >
                        <div className="flex flex-col gap-4 mb-4">
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
                            <input
                                id="projectId"
                                name="projectId"
                                type="hidden"
                                required
                                value={project.name || project.projectId || project.id}
                            />
                        </div>
                        <button type="submit" name="Taak Toevoegen" className="btn-primary w-full">
                            Taak Toevoegen
                        </button>
                    </form>
                </Modal>
            )}
        </div>
    )
}
