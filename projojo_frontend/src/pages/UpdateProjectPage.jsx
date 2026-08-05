import { useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";
import Alert from '../components/Alert';
import { useAuth } from '../auth/AuthProvider';
import Card from '../components/Card';
import DragDrop from '../components/DragDrop';
import FormInput from '../components/FormInput';
import RichTextEditor from '../components/RichTextEditor';
import ThemePicker from '../components/ThemePicker';
import ThemeRemovalConfirm from '../components/ThemeRemovalConfirm';
import { getProject, getProjectThemes, IMAGE_BASE_URL, linkProjectThemes, updateProject } from '../services';
import { sameIds } from '../utils/themeSelection';
import useFetch from '../useFetch';
import Loading from '../components/Loading';

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
    // null while the supervisor has not touched the picker, so the selection
    // follows the project's saved themes until they actually change something.
    const [selectedThemeIds, setSelectedThemeIds] = useState(null);
    // The form data of a save that is held back by the empty-themes confirmation.
    const [pendingSave, setPendingSave] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const navigation = useNavigate();

    // Fetch project (complete)
    const { data: projectData, error: projectError, isLoading } = useFetch(() => getProject(projectId), [projectId]);
    const { data: projectThemes, error: themesError, isLoading: areThemesLoading } = useFetch(() => getProjectThemes(projectId), [projectId]);

    useEffect(() => {
        if (projectData && description === undefined) {
            // projectData.description exists as markdown/html from backend; initialize editor
            setDescription(projectData.description);
        }
    }, [projectData]);

    useEffect(() => {
        if (projectError?.statusCode == 404 || (!authData.isLoading && authData.type !== 'teacher' && authData.type !== 'supervisor')) {
            navigation("/not-found", { replace: true });
        }
    }, [authData.isLoading, isLoading]);

    if (projectError) {
        return <Alert text={projectError?.message} />;
    }

    // Without the saved themes there is no baseline: treating the failure as an
    // empty selection would silently replace (and delete) existing theme links.
    if (themesError) {
        return <Alert text="De thema's van dit project konden niet worden geladen. Probeer het later opnieuw." />;
    }

    if (isLoading || areThemesLoading || !projectData) {
        return <Loading />;
    }

    // Additional authorization check: supervisors only allowed if they created the project (server also enforces)
    const isOwner = authData.type === "supervisor" && authData.businessId === projectData.business?.id;
    const allowed = authData.type === "teacher" || isOwner;

    if (!allowed) {
        return <Alert text="Je bent niet geautoriseerd om dit project aan te passen." />;
    }

    const savedThemeIds = (projectThemes ?? []).map((theme) => theme.id);
    const themeIds = selectedThemeIds ?? savedThemeIds;
    const haveThemesChanged = !sameIds(themeIds, savedThemeIds);
    // Only a save that empties a non-empty selection has to be confirmed: with
    // nothing linked there is nothing to warn about removing.
    const removesEveryTheme = themeIds.length === 0 && savedThemeIds.length > 0;

    function onSubmit(event) {
        event.preventDefault();
        // Pressing Enter in a field submits even while the button is disabled, so
        // guard here too: one save action must stay one save action.
        if (isSaving || nameError != undefined || descriptionError != undefined || locationError != undefined) {
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

        if (removesEveryTheme) {
            // Hold the whole save back until the supervisor confirms: nothing is
            // written while the confirmation is open.
            setPendingSave(formData);
            return;
        }

        save(formData);
    }

    /**
     * Save the project and, when the selection changed, its theme links.
     *
     * The two are separate calls but one save action: the supervisor is only moved
     * on once both are done. Theme linking replaces every link, so it is skipped
     * entirely when the selection is untouched.
     */
    async function save(formData) {
        setIsSaving(true);
        setError(undefined);

        try {
            await updateProject(projectId, formData);
        } catch (updateError) {
            setError(updateError.message || "Er is een onbekende fout opgetreden bij het bijwerken van het project.");
            setIsSaving(false);
            return;
        }

        if (haveThemesChanged) {
            try {
                await linkProjectThemes(projectId, themeIds);
            } catch {
                // The project data itself is already saved, so keep the supervisor
                // here with their edits intact and let them retry the theme part.
                setError("Het project is opgeslagen, maar de thema's konden niet worden bijgewerkt. Probeer het opnieuw.");
                setIsSaving(false);
                return;
            }
        }

        navigation(`/projects/${projectId}`);
    }

    function confirmThemeRemoval() {
        const formData = pendingSave;
        setPendingSave(null);
        save(formData);
    }

    /**
     * Dismissing the confirmation cancels the entire save and restores the themes.
     * Resetting to null makes `themeIds` fall back to the saved selection, which
     * the controlled picker re-renders in place - no remount, no themes refetch.
     */
    function cancelThemeRemoval() {
        setPendingSave(null);
        setSelectedThemeIds(null);
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
                <div data-testid="project-theme-section" role="group" aria-labelledby="project-theme-label">
                    <h3 id="project-theme-label" className="block text-sm font-bold leading-6 text-text-primary mb-1">Thema&apos;s</h3>
                    <ThemePicker selected={themeIds} onChange={setSelectedThemeIds} />
                </div>
                <div className='grid grid-cols-2 gap-2'>
                    <button className="btn-secondary flex-grow" type="button" onClick={() => navigation(-1)}>Annuleren</button>
                    <button className="btn-primary flex-grow" type="submit" disabled={isSaving}>{isSaving ? "Opslaan..." : "Opslaan"}</button>
                </div>
            </Card>

            <ThemeRemovalConfirm
                isOpen={pendingSave !== null}
                onCancel={cancelThemeRemoval}
                onConfirm={confirmThemeRemoval}
                projectName={projectData.name}
            />
        </form>
    );
}
