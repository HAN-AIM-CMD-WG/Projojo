import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../components/AuthProvider";
import Card from "../../components/Card";
import DragDrop from "../../components/DragDrop";
import FormInput from "../../components/FormInput";
import Page from "../../components/paged_component/page";
import PagedComponent from "../../components/paged_component/paged_component";
import RichTextEditor from "../../components/RichTextEditor";
import { createErrorMessage, getUser, /*updateStudent*/ } from "../../services";
import useFetch from "../../useFetch";

const authErrorMessages = {
    401: "Je bent niet ingelogd. Log opnieuw in.",
    403: "Je bent niet ingelogd als student. Log opnieuw in.",
}

/**
 * Creates a UpdateStudentPage component
 */
export default function UpdateStudentPage() {
    const { authData } = useAuth();

    const [cv, setCV] = useState([]);
    const [description, setDescription] = useState();
    const [serverError, setServerError] = useState();
    const [nameError, setNameError] = useState();
    const [descriptionError, setDescriptionError] = useState();
    const navigate = useNavigate();

    if (authData.type !== "student") {
        navigate("/home");
    }

    const { data, error, isLoading } = useFetch(() => getUser(authData.userId), [authData.userId]);
    
    useEffect(() => {
        if (!isLoading && data && description === undefined) {
            setDescription(data.description);
        }
    }, [data, isLoading, description]);

    useEffect(() => {
        if (error !== undefined && serverError === undefined) {
            setServerError(createErrorMessage(error, {
                ...authErrorMessages,
                404: "Je account is niet gevonden? Probeer opnieuw in te loggen",
            }));
        }
    }, [error, serverError]);

    function onSubmit(event) {
        event.preventDefault();
        if (nameError !== undefined || descriptionError !== undefined) {
            return;
        }

        const formData = new FormData(event.target);
        formData.set("description", description);

        if (formData.get("profilePicture") === null || formData.get("profilePicture").size === 0) {
            formData.delete("profilePicture");
        }
        if (formData.get("cv") === null || formData.get("cv").size === 0) {
            formData.delete("cv");
        }
        updateStudent(formData)
            .then(() => {
                navigate(`/profile/${authData.userId}`);
            })
            .catch(error => {
                setServerError(createErrorMessage(error, {
                    400: "Er is een fout ontstaan bij het versturen van de data.",
                    ...authErrorMessages,
                }));
            })
    }

    function onCVAdded(files) {
        setCV(files);
    }

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-3" data-testid="update_student_page">
            <Card header={"Pagina aanpassen"} className={"px-6 py-12 sm:rounded-lg sm:px-12"} isLoading={isLoading}>
                <PagedComponent finishButtonText="Opslaan">
                    <Page className="flex flex-col gap-4">
                        <FormInput label="Gebruikersnaam" type="text" name="username" max={255} error={nameError} setError={setNameError} initialValue={data?.username} required readonly />
                        <RichTextEditor
                            label="Zeg iets over jezelf"
                            onSave={setDescription}
                            defaultText={description}
                            max={4000}
                            required
                            error={descriptionError}
                            setError={setDescriptionError}
                        />
                        <DragDrop accept="image/*" name="profilePicture" initialFilePath={data?.profilePicture?.path} />
                    </Page>
                    <Page>
                        <DragDrop accept="application/pdf" text="Sleep uw cv hier" onFileChanged={onCVAdded} showAddedFiles={false} name="cv" initialFilePath={data?.cv?.path} />
                        <div aria-label="pdf voorbeelden" className="flex justify-center mt-3">
                            {
                                cv.map((file, index) =>
                                    <embed key={index} src={URL.createObjectURL(file)} className="h-96 w-full" title="voorbeeld pdf" />)
                            }
                        </div>
                    </Page>
                </PagedComponent>
                <div className="text-center mt-6">
                    {serverError && <span className="text-primary">{serverError}</span>}
                </div>
            </Card>
        </form>
    );
}
