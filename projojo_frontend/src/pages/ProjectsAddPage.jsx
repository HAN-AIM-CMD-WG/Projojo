import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddProjectForm from "../components/AddProjectForm";
import { createProject } from "../services";

export default function ProjectsAddPage() {
    const navigate = useNavigate();
    const [serverErrorMessage, setServerErrorMessage] = useState('');

    const onSubmit = (data) => {
        createProject(data)
            .then(newProjectId => {
                navigate(`/projects/${newProjectId}`);
            })
            .catch((errorMessage) => setServerErrorMessage(errorMessage.message));
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