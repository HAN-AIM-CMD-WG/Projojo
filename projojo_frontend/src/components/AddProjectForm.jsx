import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import Alert from "./Alert";
import DragDrop from "./DragDrop";
import FormInput from "./FormInput";
import RichTextEditor from "./RichTextEditor";

export default function AddProjectForm({ onSubmit, serverErrorMessage }) {
    const [nameError, setNameError] = useState();
    const [descriptionError, setDescriptionError] = useState();
    const { authData } = useAuth();
    const navigation = useNavigate();

    const [description, setDescription] = useState("");
    const [image, setImage] = useState(null);
    const [imageError, setImageError] = useState('');

    const handleImageChange = (file) => {
        setImage(file);
        setImageError('');
    };

    const handleSubmit = event => {
        event.preventDefault();
        if (nameError != undefined || descriptionError != undefined) {
            return;
        }

        if (!image) {
            setImageError('Een projectafbeelding is verplicht.');
            return;
        }

        const formData = new FormData(event.target);

        // Get the image file
        const imageFile = formData.get("image");

        // Create project data object for submission with file
        const projectData = {
            id: formData.get("name").trim(),
            name: formData.get("name").trim(),
            description: description.trim(),
            supervisor_id: authData.userId,
            business_id: authData.businessId,
            imageFile: imageFile // Pass the actual file object
        };

        // Submit both project data and image in a single call
        onSubmit(projectData);
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
                    name="name"
                    error={nameError}
                    setError={setNameError}
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
                <DragDrop
                    accept="image/*"
                    name="image"
                    label="Upload een projectafbeelding"
                    onFileChanged={handleImageChange}
                />
                {imageError && <p className="text-red-500">{imageError}</p>}
                <div className="grid grid-cols-2 gap-2">
                    <button type="button" className="btn-secondary w-full" onClick={() => navigation(-1)}>Annuleren</button>
                    <button type="submit" className="btn-primary w-full">Opslaan</button>
                </div>
            </div>
        </form>
    )
}
