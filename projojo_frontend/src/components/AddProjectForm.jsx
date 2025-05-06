import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "./Alert";
import DragDrop from "./DragDrop";
import FormInput from "./FormInput";
import RichTextEditor from "./RichTextEditor";

export default function AddProjectForm({ onSubmit, serverErrorMessage }) {
    const [titleError, setTitleError] = useState();
    const [descriptionError, setDescriptionError] = useState();
    const navigation = useNavigate();

    const [description, setDescription] = useState("");

    const handleSubmit = event => {
        event.preventDefault();
        if (titleError != undefined || descriptionError != undefined) {
            return;
        }

        const formData = new FormData(event.target);
        formData.set("title", formData.get("title").trim());
        formData.set("description", description.trim());

        onSubmit(formData);
    }

    return (
        <form onSubmit={handleSubmit} aria-label="Project aanmaken form">
            <div className="flex flex-col gap-3 px-6 py-12 sm:rounded-lg sm:px-12 bg-white shadow-xl border border-gray-300">
                <div className="text-2xl font-semibold text-center">
                    Project aanmaken
                </div>
                <Alert text={serverErrorMessage} />
                <FormInput
                    label="Titel"
                    placeholder="Titel van het project"
                    type="text"
                    name="title"
                    error={titleError}
                    setError={setTitleError}
                    max={50}
                    required
                />
                <RichTextEditor
                    onSave={setDescription}
                    defaultText={description}
                    required={true}
                    label="Beschrijving"
                    max={4000}
                    error={descriptionError}
                    setError={setDescriptionError}
                />
                <DragDrop multiple={false} name="image" />
                <div className="grid grid-cols-2 gap-2">
                    <button type="button" className="btn-secondary w-full" onClick={() => navigation(-1)}>Annuleren</button>
                    <button type="submit" className="btn-primary w-full">Opslaan</button>
                </div>
            </div>
        </form>
    )
}