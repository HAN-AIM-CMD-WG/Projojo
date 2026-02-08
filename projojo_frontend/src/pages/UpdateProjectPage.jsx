import { useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import Alert from '../components/Alert';
import { useAuth } from '../auth/AuthProvider';
import Card from '../components/Card';
import DragDrop from '../components/DragDrop';
import FormInput from '../components/FormInput';
import RichTextEditor from '../components/RichTextEditor';
import { getProject, IMAGE_BASE_URL, updateProject } from '../services';
import useFetch from '../useFetch';
import Loading from '../components/Loading';
import NotFound from './NotFound';

/**
 * UpdateProjectPage - allows supervisors (owner) or teachers to update a project.
 */
export default function UpdateProjectPage() {
    const { authData } = useAuth();
    const { projectId } = useParams();
    const [error, setError] = useState();
    const [nameError, setNameError] = useState();
    const [description, setDescription] = useState();
    const [descriptionError, setDescriptionError] = useState();
    const [locationError, setLocationError] = useState();
    const navigation = useNavigate();

    // Fetch project (complete)
    const { data: projectData, error: projectError, isLoading } = useFetch(() => getProject(projectId), [projectId]);

    useEffect(() => {
        if (projectData && description === undefined) {
            // projectData.description exists as markdown/html from backend; initialize editor
            setDescription(projectData.description);
        }
    }, [projectData]);

    if (projectError?.statusCode == 404 || (authData && !authData.isLoading && authData.type !== 'teacher' && authData.type !== 'supervisor')) {
        return <NotFound />;
    }

    if (projectError) {
        return <Alert text={projectError?.message} />;
    }

    if (isLoading || !projectData) {
        return <Loading />;
    }

    // Additional authorization check: supervisors only allowed if they created the project (server also enforces)
    const isOwner = authData.type === "supervisor" && authData.businessId === projectData.business?.id;
    const allowed = authData.type === "teacher" || isOwner;

    if (!allowed) {
        return <Alert text="Je bent niet geautoriseerd om dit project aan te passen." />;
    }

    function onSubmit(event) {
        event.preventDefault();
        if (nameError != undefined || descriptionError != undefined || locationError != undefined) {
            return;
        }

        const formData = new FormData(event.target);
        const photo = formData.get("image");
        if (photo instanceof File && photo.size === 0 && photo.name.length === 0) {
            formData.delete("image");
        }

        // Only send location if changed compared to current project value
        const currentLocation = (formData.get("location") ?? "").toString();
        const baselineLocation = (projectData.location ?? "");
        if (currentLocation === baselineLocation) {
            formData.delete("location");
        }

        formData.append("description", description);

        updateProject(projectId, formData)
            .then(() => {
                navigation(`/projects/${projectId}`);
            }).catch(error =>
                setError(error.message || "Er is een onbekende fout opgetreden bij het bijwerken van het project.")
            );
    }

    return (
        <form onSubmit={onSubmit} className="max-w-2xl mx-auto">
            <Card header="Project aanpassen" className="flex flex-col gap-3 px-6 py-12 sm:rounded-lg sm:px-12 shadow-xl border border-gray-300">
                <Alert text={error} onClose={() => setError("")} />
                <FormInput
                    label="Projectnaam"
                    type="text"
                    name="name"
                    initialValue={projectData.name}
                    error={nameError}
                    setError={setNameError}
                    max={100}
                    required={true}
                />
                {description !== undefined
                    ? <RichTextEditor
                        label="Beschrijving"
                        max={4000}
                        required
                        defaultText={description}
                        onSave={setDescription}
                        error={descriptionError}
                        setError={setDescriptionError}
                    />
                    : <div className="flex justify-center">
                        <img src="/loading.gif" alt="loading" />
                    </div>
                }
                <FormInput
                    label="Locatie"
                    type="text"
                    name="location"
                    placeholder={projectData.business?.location}
                    initialValue={projectData.location ?? ""}
                    error={locationError}
                    setError={setLocationError}
                    max={255}
                    required={false}
                />
                <DragDrop
                    name="image"
                    accept="image"
                    label="Projectafbeelding"
                    initialFilePath={IMAGE_BASE_URL + (projectData.image_path || projectData.image_path)}
                />
                <div className='grid grid-cols-2 gap-2'>
                    <button className="btn-secondary flex-grow" type="button" onClick={() => navigation(-1)}>Annuleren</button>
                    <button className="btn-primary flex-grow" type="submit">Opslaan</button>
                </div>
            </Card>
        </form>
    );
}
