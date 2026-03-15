import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddProjectForm from "../components/AddProjectForm";
import { createProject } from "../services";
import { useAuth } from "../auth/AuthProvider";
import NotFound from "./NotFound";

export default function ProjectsAddPage() {
    const navigate = useNavigate();
    const { authData } = useAuth();
    const [serverErrorMessage, setServerErrorMessage] = useState('');

    if (authData && !authData.isLoading && authData.type !== 'supervisor' && authData.type !== 'teacher') {
        return <NotFound />;
    }

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
