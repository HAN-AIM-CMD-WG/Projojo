import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddProjectForm from "../components/AddProjectForm";
import { createProject } from "../services";

export default function ProjectsAddPage() {
    const navigate = useNavigate();
    const [serverErrorMessage, setServerErrorMessage] = useState('');

    const onSubmit = (data) => {
        // Check if there's an error from the image upload
        if (data.error) {
            setServerErrorMessage(data.error);
            return;
        }
        
        createProject(data)
            .then(newProject => {
                navigate(`/projects/${newProject.id}`);
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
