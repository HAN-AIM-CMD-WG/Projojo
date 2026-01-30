import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import Alert from "./Alert";
import DragDrop from "./DragDrop";
import FormInput from "./FormInput";
import RichTextEditor from "./RichTextEditor";

export default function AddProjectForm({ onSubmit, serverErrorMessage }) {
    const [nameError, setNameError] = useState();
    const [descriptionError, setDescriptionError] = useState();
    const [locationError, setLocationError] = useState();
    const { authData } = useAuth();
    const navigation = useNavigate();

    const [description, setDescription] = useState("");
    const [image, setImage] = useState(null);
    const [imageError, setImageError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageChange = (file) => {
        setImage(file);
        setImageError('');
    };

    const handleSubmit = event => {
        event.preventDefault();
        if (nameError != undefined || descriptionError != undefined || locationError != undefined) {
            return;
        }

        if (!image) {
            setImageError('Een projectafbeelding is verplicht.');
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData(event.target);

        // Get the image file
        const imageFile = formData.get("image");
        const location = (formData.get("location") ?? "").toString().trim() || undefined;
        const startDate = formData.get("start_date") || undefined;
        const endDate = formData.get("end_date") || undefined;

        // Validate dates
        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            setIsSubmitting(false);
            return;
        }

        // Create project data object for submission with file
        const projectData = {
            id: formData.get("name").trim(),
            name: formData.get("name").trim(),
            description: description.trim(),
            supervisor_id: authData.userId,
            business_id: authData.businessId,
            imageFile: imageFile, // Pass the actual file object
            location: location,
            start_date: startDate,
            end_date: endDate
        };

        // Submit both project data and image in a single call
        onSubmit(projectData);
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <Link 
                    to={`/business/${authData.businessId}`}
                    className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-primary transition-colors mb-4"
                >
                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                    Terug naar bedrijfspagina
                </Link>
                <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Project aanmaken</h1>
                <p className="text-[var(--text-muted)] mt-2">Maak een nieuw project aan voor je bedrijf</p>
            </div>

            <form onSubmit={handleSubmit} aria-label="Project aanmaken form">
                <Alert text={serverErrorMessage} />
                
                {/* Project Image Section */}
                <div className="neu-flat rounded-2xl p-6 mb-6">
                    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">image</span>
                        Projectafbeelding
                        <span className="text-sm font-normal text-red-500 ml-1">*</span>
                    </h2>
                    <DragDrop
                        accept="image/*"
                        name="image"
                        onFileChanged={handleImageChange}
                    />
                    {imageError && (
                        <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                            <span className="material-symbols-outlined text-base">error</span>
                            {imageError}
                        </p>
                    )}
                </div>

                {/* Project Details Section */}
                <div className="neu-flat rounded-2xl p-6 mb-6">
                    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">assignment</span>
                        Projectgegevens
                    </h2>
                    <div className="space-y-4">
                        <FormInput
                            label="Projecttitel"
                            placeholder="bijv. Smart Farming Dashboard"
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
                    </div>
                </div>

                {/* Project Planning Section */}
                <div className="neu-flat rounded-2xl p-6 mb-6">
                    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">calendar_month</span>
                        Planning
                        <span className="text-sm font-normal text-[var(--text-muted)] ml-2">(optioneel)</span>
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormInput
                            label="Startdatum"
                            type="date"
                            name="start_date"
                        />
                        <FormInput
                            label="Einddatum / Deadline"
                            type="date"
                            name="end_date"
                        />
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-2">
                        Deze datums helpen studenten om de planning te begrijpen. Taken moeten binnen deze periode vallen.
                    </p>
                </div>

                {/* Info Box */}
                <div className="neu-pressed rounded-xl p-4 mb-6 flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-0.5">info</span>
                    <div className="text-sm text-[var(--text-secondary)]">
                        <p className="font-semibold text-[var(--text-primary)]">Tip</p>
                        <p>Na het aanmaken kun je taken en benodigde skills toevoegen aan je project.</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button 
                        type="button" 
                        onClick={() => navigation(-1)}
                        className="neu-btn flex-1 py-3 font-bold"
                    >
                        Annuleren
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="neu-btn-primary flex-1 py-3 font-bold flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Aanmaken...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">add</span>
                                Project aanmaken
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    )
}
