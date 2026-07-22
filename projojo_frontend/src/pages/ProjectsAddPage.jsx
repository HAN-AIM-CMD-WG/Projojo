import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AddProjectForm from "../components/AddProjectForm";
import { notification } from "../components/notifications/NotifySystem";
import { createProject, linkProjectThemes } from "../services";

export default function ProjectsAddPage() {
    const navigate = useNavigate();
    const [serverErrorMessage, setServerErrorMessage] = useState('');

    /**
     * Link the selected themes to the freshly created project.
     *
     * Themes can only be linked to a project that already exists, so this runs
     * after the create call, with the id it returned. A failure here is caught
     * on purpose: the project itself was created and must not be lost, so the
     * supervisor is told what went wrong and still moves on to the project.
     */
    const linkThemes = (projectId, themeIds) => {
        if (themeIds.length === 0) {
            return Promise.resolve();
        }

        return linkProjectThemes(projectId, themeIds).catch((error) => {
            console.error("Error linking project themes:", error);
            notification.error("Project aangemaakt, maar de thema's konden niet worden gekoppeld. Voeg ze toe via Project bewerken.");
        });
    };

    const onSubmit = (data, themeIds) => {
        // Submit project data with image in a single call
        createProject(data)
            .then(newProject =>
                linkThemes(newProject.id, themeIds)
                    .then(() => navigate(`/projects/${newProject.id}`))
            )
            .catch((error) => {
                console.error("Error creating project:", error);
                setServerErrorMessage(error.message || "Kan project niet aanmaken");
            });
    }

    return (
        <AddProjectForm
            onSubmit={onSubmit}
            serverErrorMessage={serverErrorMessage}
        />
    )
}
