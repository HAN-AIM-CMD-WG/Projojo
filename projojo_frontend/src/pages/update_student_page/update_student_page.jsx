import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import RichTextEditor from "../../components/RichTextEditor";
import PdfPreview from "../../components/PdfPreview";
import { createErrorMessage, getUser, updateStudent } from "../../services";
import useFetch from "../../useFetch";
import { IMAGE_BASE_URL, PDF_BASE_URL } from "../../services";
import { notification } from "../../components/notifications/NotifySystem";

const authErrorMessages = {
    401: "Je bent niet ingelogd. Log opnieuw in.",
    403: "Je bent niet ingelogd als student. Log opnieuw in.",
}

/**
 * Single-page profile editor with neumorphic design
 */
export default function UpdateStudentPage() {
    const { authData } = useAuth();

    const [description, setDescription] = useState();
    const [serverError, setServerError] = useState();
    const [descriptionError, setDescriptionError] = useState();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    // Photo state
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    
    // CV state
    const [cvFile, setCvFile] = useState(null);
    const [cvPreview, setCvPreview] = useState(null);
    const [cvDeleted, setCvDeleted] = useState(false);

    useEffect(() => {
        if (authData.type !== "student" && !authData.isLoading) {
            navigate("/home");
        }
    }, [authData.isLoading, authData.type, navigate]);

    const { data, error, isLoading } = useFetch(
        () => authData.userId ? getUser(authData.userId) : Promise.resolve(null),
        [authData.userId, authData.isLoading]
    );

    // Initialize data when loaded
    useEffect(() => {
        if (!isLoading && data) {
            if (description === undefined) {
                setDescription(data.description || '');
            }
            if (data.image_path && !photoPreview) {
                setPhotoPreview(IMAGE_BASE_URL + data.image_path);
            }
            if (data.cv_path && !cvPreview && !cvDeleted) {
                setCvPreview(PDF_BASE_URL + data.cv_path);
            }
        }
    }, [data, isLoading, description, photoPreview, cvPreview, cvDeleted]);

    useEffect(() => {
        if (error !== undefined && serverError === undefined) {
            setServerError(createErrorMessage(error, {
                ...authErrorMessages,
                404: "Je account is niet gevonden? Probeer opnieuw in te loggen",
            }));
        }
    }, [error, serverError]);

    function handlePhotoChange(e) {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                notification.error('Alleen afbeeldingen zijn toegestaan');
                return;
            }
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    }

    function handleCvChange(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                notification.error('Alleen PDF-bestanden zijn toegestaan');
                return;
            }
            setCvFile(file);
            setCvPreview(URL.createObjectURL(file));
            setCvDeleted(false);
        }
    }

    function handleCvDelete() {
        setCvFile(null);
        setCvPreview(null);
        setCvDeleted(true);
    }

    function onSubmit(event) {
        event.preventDefault();
        if (descriptionError !== undefined) {
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.set("description", description);

        if (photoFile) {
            formData.set("profilePicture", photoFile);
        }
        if (cvFile) {
            formData.set("cv", cvFile);
        }
        if (cvDeleted) {
            formData.set("cv_deleted", "true");
        }

        updateStudent(authData.userId, formData)
            .then((response) => {
                if (response.message) {
                    notification.success(response.message);
                }
                navigate(`/student/${authData.userId}`);
            })
            .catch(error => {
                setServerError(createErrorMessage(error, {
                    400: "Er is een fout ontstaan bij het versturen van de data.",
                    ...authErrorMessages,
                }));
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    }

    const isDataLoading = authData.isLoading || isLoading || !data || description === undefined;

    if (isDataLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="neu-flat p-8 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600 font-medium">Profiel laden...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <Link 
                        to={`/student/${authData.userId}`}
                        className="neu-btn !p-3 !rounded-full"
                        title="Terug naar profiel"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800">Profiel bewerken</h1>
                        <p className="text-sm text-gray-500">Pas je gegevens aan</p>
                    </div>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-6">
                {/* Top Section: Photo + Basic Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Photo Section */}
                    <div className="neu-flat p-6 rounded-2xl">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary">photo_camera</span>
                            Profielfoto
                        </h2>
                        
                        <div className="flex flex-col items-center">
                            {/* Photo Preview */}
                            <div className="relative group mb-4">
                                <div className="w-32 h-32 rounded-full neu-pressed p-1 overflow-hidden">
                                    {photoPreview ? (
                                        <img 
                                            src={photoPreview} 
                                            alt="Profielfoto" 
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-4xl text-gray-400">person</span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Hover Overlay */}
                                <label 
                                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {/* Upload Button */}
                            <label className="neu-btn text-sm cursor-pointer flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">upload</span>
                                Foto wijzigen
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />
                            </label>
                            
                            <p className="text-xs text-gray-400 mt-3 text-center">
                                JPG, PNG of GIF<br/>Max 5MB
                            </p>
                        </div>
                    </div>

                    {/* Bio Section */}
                    <div className="lg:col-span-2 neu-flat p-6 rounded-2xl">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2 mb-4">
                            <span className="material-symbols-outlined text-primary">person</span>
                            Over jou
                        </h2>

                        {/* Name (readonly) */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                Naam
                            </label>
                            <div className="neu-pressed px-4 py-3 rounded-xl text-gray-700 font-medium flex items-center gap-2">
                                <span className="material-symbols-outlined text-gray-400 text-lg">badge</span>
                                {data?.full_name}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                Neem contact op met een docent om je naam te wijzigen
                            </p>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">
                                Bio <span className="text-primary">*</span>
                            </label>
                            <RichTextEditor
                                onSave={setDescription}
                                defaultText={description}
                                max={4000}
                                required
                                error={descriptionError}
                                setError={setDescriptionError}
                            />
                        </div>
                    </div>
                </div>

                {/* CV Section */}
                <div className="neu-flat p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">description</span>
                            Curriculum Vitae
                            <span className="text-xs font-normal text-gray-400 ml-1">(optioneel)</span>
                        </h2>
                        
                        {cvPreview && (
                            <div className="flex items-center gap-2">
                                <a 
                                    href={cvPreview}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="neu-btn text-sm flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-lg">open_in_new</span>
                                    <span className="hidden sm:inline">Openen</span>
                                </a>
                                <button
                                    type="button"
                                    onClick={handleCvDelete}
                                    className="neu-btn text-sm flex items-center gap-2 text-red-500 hover:text-red-600"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                    <span className="hidden sm:inline">Verwijderen</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {cvPreview ? (
                        /* CV Preview */
                        <div className="neu-pressed p-2 rounded-xl overflow-hidden">
                            <PdfPreview url={cvPreview} className="h-[20rem]" />
                        </div>
                    ) : (
                        /* Upload Area */
                        <label className="block cursor-pointer">
                            <div className="neu-pressed p-8 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary/50 transition-colors">
                                <div className="flex flex-col items-center text-center">
                                    <div className="neu-flat p-4 rounded-full mb-4">
                                        <span className="material-symbols-outlined text-3xl text-primary">upload_file</span>
                                    </div>
                                    <p className="font-medium text-gray-700 mb-1">
                                        Sleep je CV hierheen of klik om te uploaden
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        Alleen PDF-bestanden • Max 10MB
                                    </p>
                                </div>
                            </div>
                            <input 
                                type="file" 
                                accept="application/pdf" 
                                onChange={handleCvChange}
                                className="hidden"
                            />
                        </label>
                    )}
                </div>

                {/* Error Message */}
                {serverError && (
                    <div className="neu-flat p-4 rounded-xl border-l-4 border-red-500 flex items-center gap-3">
                        <span className="material-symbols-outlined text-red-500">error</span>
                        <span className="text-red-600 font-medium">{serverError}</span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4">
                    <Link 
                        to={`/student/${authData.userId}`}
                        className="neu-btn flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined">close</span>
                        Annuleren
                    </Link>
                    
                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="neu-btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Opslaan...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">save</span>
                                Wijzigingen opslaan
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
