import { useEffect, useState } from 'react';
import { useNavigate, Link, useParams } from "react-router-dom";
import Alert from '../components/Alert';
import { useAuth } from '../auth/AuthProvider';
import DragDrop from '../components/DragDrop';
import FormInput from '../components/FormInput';
import RichTextEditor from '../components/RichTextEditor';
import { createErrorMessage, getBusinessById, IMAGE_BASE_URL, updateBusiness } from '../services';
import useFetch from '../useFetch';

/**
 * Creates a UpdateBusinessPage component with neumorphic design
 */
export default function UpdateBusinessPage() {
    const { authData } = useAuth();
    const { businessId: urlBusinessId } = useParams();
    const [error, setError] = useState();
    const [nameError, setNameError] = useState();
    const [description, setDescription] = useState();
    const [descriptionError, setDescriptionError] = useState();
    const [locationError, setLocationError] = useState();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigation = useNavigate();

    // Use URL businessId if provided (for teachers), otherwise use authData.businessId (for supervisors)
    const targetBusinessId = urlBusinessId || authData.businessId;

    useEffect(() => {
        if (!authData.isLoading) {
            // Allow supervisors editing their own business, or teachers editing any business
            const isAllowed = 
                (authData.type === 'supervisor' && authData.businessId === targetBusinessId) ||
                authData.type === 'teacher';
            
            if (!isAllowed) {
                navigation("/not-found");
            }
        }
    }, [authData.isLoading, authData.type, authData.businessId, targetBusinessId])

    const { data: business } = useFetch(async () => !authData.isLoading && targetBusinessId && await getBusinessById(targetBusinessId), [targetBusinessId]);
    
    if (business?.description !== undefined && description === undefined) {
        setDescription(business?.description);
    }

    // Handle arrays from TypeDB (optional fields come as arrays)
    const getSingleValue = (val) => Array.isArray(val) ? val[0] : val;

    function onSubmit(event) {
        event.preventDefault();
        if (nameError != undefined || descriptionError != undefined || locationError != undefined) {
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData(event.target);
        const photo = formData.get("photos");
        if (photo instanceof File && photo.size === 0 && photo.name.length === 0) {
            formData.delete("photos");
        }

        formData.append("description", description);

        updateBusiness(targetBusinessId, formData)
            .then(() => {
                navigation(`/business/${targetBusinessId}`);
            }).catch(error => {
                setError(createErrorMessage(
                    error,
                    {
                        401: "De bedrijfspagina kan niet aangepast worden als je niet bent ingelogd",
                        403: "Je bent niet geautoriseerd om de bedrijfspagina aan te passen",
                        404: "De bedrijfspagina kan niet gevonden worden",
                    }
                ));
            }).finally(() => {
                setIsSubmitting(false);
            });
    }

    // Company size options
    const companySizeOptions = [
        { value: "", label: "Selecteer..." },
        { value: "1-10", label: "1-10 medewerkers" },
        { value: "11-50", label: "11-50 medewerkers" },
        { value: "51-200", label: "51-200 medewerkers" },
        { value: "200+", label: "200+ medewerkers" },
    ];

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <Link 
                    to={`/business/${targetBusinessId}`}
                    className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-primary transition-colors mb-4"
                >
                    <span className="material-symbols-outlined text-xl">arrow_back</span>
                    Terug naar bedrijfspagina
                </Link>
                <h1 className="text-3xl font-extrabold text-[var(--text-primary)]">Bedrijf aanpassen</h1>
                <p className="text-[var(--text-muted)] mt-2">Pas de gegevens van je bedrijf aan</p>
            </div>

            <form onSubmit={onSubmit}>
                <Alert text={error} onClose={() => setError("")} />
                
                {/* Logo Section */}
                <div className="neu-flat rounded-2xl p-6 mb-6">
                    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">image</span>
                        Bedrijfslogo
                    </h2>
                    <DragDrop
                        name="image"
                        accept="image/*"
                        initialFilePath={business?.image_path ? IMAGE_BASE_URL + business.image_path : null}
                    />
                </div>

                {/* Basic Info Section */}
                <div className="neu-flat rounded-2xl p-6 mb-6">
                    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">business</span>
                        Basisgegevens
                    </h2>
                    <div className="space-y-4">
                        <FormInput
                            label="Bedrijfsnaam"
                            type="text"
                            name="name"
                            initialValue={business?.name}
                            error={nameError}
                            setError={setNameError}
                            max={50}
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
                            : <div className="flex justify-center py-8">
                                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                            </div>
                        }
                        
                        <FormInput
                            label="Locatie"
                            type="text"
                            name="location"
                            placeholder="bijv. Amsterdam, Noord-Holland"
                            initialValue={getSingleValue(business?.location)}
                            error={locationError}
                            setError={setLocationError}
                            max={255}
                            required={true}
                        />
                    </div>
                </div>

                {/* Extra Info Section */}
                <div className="neu-flat rounded-2xl p-6 mb-6">
                    <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">info</span>
                        Extra informatie
                        <span className="text-sm font-normal text-[var(--text-muted)] ml-2">(optioneel)</span>
                    </h2>
                    <div className="space-y-4">
                        <FormInput
                            label="Sector / Branche"
                            type="text"
                            name="sector"
                            placeholder="bijv. Agri & Food, IT, Zorg"
                            initialValue={getSingleValue(business?.sector)}
                            max={100}
                        />
                        
                        <div>
                            <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">
                                Aantal medewerkers
                            </label>
                            <select
                                name="company_size"
                                defaultValue={getSingleValue(business?.company_size) || ""}
                                className="w-full px-4 py-3 neu-pressed rounded-xl outline-none text-[var(--text-primary)] font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                            >
                                {companySizeOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        
                        <FormInput
                            label="Website"
                            type="url"
                            name="website"
                            placeholder="https://www.example.nl"
                            initialValue={getSingleValue(business?.website)}
                            max={255}
                        />
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
                                Opslaan...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">save</span>
                                Opslaan
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
