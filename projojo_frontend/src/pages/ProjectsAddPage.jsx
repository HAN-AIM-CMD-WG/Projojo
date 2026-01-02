import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddProjectForm from "../components/AddProjectForm";
import { createProject } from "../services";

export default function ProjectsAddPage() {
    const navigate = useNavigate();
    const [serverErrorMessage, setServerErrorMessage] = useState('');

    const onSubmit = (data) => {
        // Submit project data with image in a single call
        createProject(data)
            .then(newProject => {
                navigate(`/projects/${newProject.id}`);
            })
            .catch((error) => {
                console.error("Error creating project:", error);
                setServerErrorMessage(error.message || "Kan project niet aanmaken");
            });
    }

    return (
        <div className="max-w-2xl mx-auto">
            <AddProjectForm
                onSubmit={onSubmit}
                serverErrorMessage={serverErrorMessage}
            />
        </div>
    )
}
