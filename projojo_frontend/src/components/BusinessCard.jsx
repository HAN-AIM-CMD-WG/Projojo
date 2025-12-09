import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { IMAGE_BASE_URL, createSupervisorInviteKey } from '../services';
import { useAuth } from '../auth/AuthProvider';
import FormInput from './FormInput';
import Loading from "./Loading";
import Modal from "./Modal";
import RichTextViewer from './RichTextViewer';
import Tooltip from './Tooltip';

export default function BusinessCard({ 
    name, 
    image, 
    location, 
    businessId, 
    topSkills, 
    description, 
    sector,
    companySize,
    website,
    showDescription = false, 
    showUpdateButton = false 
}) {
    const { authData } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inviteLink, setInviteLink] = useState(null);
    const [expiry, setExpiry] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const toolTipRef = useRef(null);
    const [tooltipText, setTooltipText] = useState("Kopieer link");
    const [timeoutRef, setTimeoutRef] = useState(null);

    const formatDate = date => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString("nl-NL", options);
    };

    const openGenerateLinkModel = () => {
        setInviteLink(null);
        setExpiry(null);
        setError(null);
        setIsModalOpen(true);

        setIsLoading(true);
        createSupervisorInviteKey(businessId)
            .then(data => {
                const link = `${window.location.origin}/invite?key=${data.key}`;
                const timestamp = new Date(new Date(data.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000);

                setInviteLink(link);
                setExpiry(timestamp);
            })
            .catch(error => {
                setError(error.message);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }

    const onCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        setTooltipText("Gekopieerd!");

        if (timeoutRef) {
            clearTimeout(timeoutRef);
        }

        setTimeoutRef(setTimeout(() => {
            setTooltipText("Kopieer link");
        }, 5000));
    }

    // Handle arrays from API (TypeDB returns optional fields as arrays)
    const locationText = Array.isArray(location) ? location[0] : location;
    const sectorText = Array.isArray(sector) ? sector[0] : sector;
    const companySizeText = Array.isArray(companySize) ? companySize[0] : companySize;
    const websiteUrl = Array.isArray(website) ? website[0] : website;

    // Format company size for display
    const formatCompanySize = (size) => {
        if (!size) return null;
        const sizeMap = {
            "1-10": "1-10",
            "11-50": "11-50", 
            "51-200": "51-200",
            "200+": "200+"
        };
        return sizeMap[size] || size;
    };

    // Show more skills (max 6, then +X)
    const maxSkillsShown = 6;
    const visibleSkills = topSkills?.slice(0, maxSkillsShown) || [];
    const remainingSkills = (topSkills?.length || 0) - maxSkillsShown;

    // Check if we have any metadata to show
    const hasMetadata = sectorText || companySizeText || websiteUrl;

    return (
        <>
            <div className="neu-flat rounded-2xl p-6">
                {/* Header row: Logo + Name + Location */}
                <div className="flex items-start gap-4">
                    {/* Company logo - clickable */}
                    <Link 
                        to={`/business/${businessId}`}
                        className="w-14 h-14 rounded-xl overflow-hidden shrink-0 neu-pressed p-0.5 hover:scale-105 transition-transform"
                    >
                        <img 
                            className="w-full h-full object-cover rounded-[10px]" 
                            src={`${IMAGE_BASE_URL}${image}`} 
                            alt={`Logo van ${name}`} 
                        />
                    </Link>

                    {/* Name and location */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <Link 
                                    to={`/business/${businessId}`}
                                    className="block"
                                >
                                    <h2 className="text-xl font-extrabold text-gray-800 truncate hover:underline">
                                        {name}
                                    </h2>
                                </Link>
                                {locationText && (
                                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                                        <span className="material-symbols-outlined text-base text-primary/70">location_on</span>
                                        {locationText}
                                    </p>
                                )}
                            </div>

                            {/* Action button */}
                            {!showUpdateButton && (
                                <Link 
                                    to={`/business/${businessId}`} 
                                    className="neu-btn !py-2.5 !px-4 text-sm font-bold shrink-0 flex items-center gap-2"
                                >
                                    Bekijk bedrijf
                                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Info Pills Row - neumorphic pressed style */}
                {hasMetadata && (
                    <div className="flex flex-wrap gap-3 mt-5">
                        {sectorText && (
                            <div className="neu-pressed px-4 py-2 rounded-xl flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-gray-500">domain</span>
                                <span className="text-sm font-bold text-gray-600">{sectorText}</span>
                            </div>
                        )}
                        {companySizeText && (
                            <div className="neu-pressed px-4 py-2 rounded-xl flex items-center gap-2">
                                <span className="material-symbols-outlined text-base text-gray-500">groups</span>
                                <span className="text-sm font-bold text-gray-600">{formatCompanySize(companySizeText)} medewerkers</span>
                            </div>
                        )}
                        {websiteUrl && (
                            <a
                                href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="neu-btn-outline !py-2 !px-4 rounded-xl flex items-center gap-2 text-sm"
                            >
                                <span className="material-symbols-outlined text-base">language</span>
                                Website
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                            </a>
                        )}
                    </div>
                )}

                {/* Description (optional) */}
                {showDescription && description && (
                    <div className="mt-4 text-sm text-gray-500 line-clamp-2">
                        <RichTextViewer text={description} />
                    </div>
                )}

                {/* Skills section */}
                {visibleSkills.length > 0 && (
                    <div className="mt-5 pt-4 border-t border-gray-200/60">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm">psychology</span>
                            Gevraagde skills
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                            {visibleSkills.map((skill) => (
                                <span 
                                    key={skill.skillId ?? skill.id} 
                                    className="px-4 py-2 text-sm font-bold text-primary border-2 border-primary/30 rounded-full bg-white/50"
                                >
                                    {skill.name}
                                </span>
                            ))}
                            {remainingSkills > 0 && (
                                <span className="px-4 py-2 text-sm font-bold rounded-full border-2 border-gray-200 text-gray-500 bg-white/50">
                                    +{remainingSkills} meer
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Management buttons (only for supervisors/teachers) */}
                {showUpdateButton && authData.businessId === businessId && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200/50">
                        <Link to={`/projects/add`} className="neu-btn-primary !py-2 !px-3 text-sm flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-lg">add</span>
                            Project toevoegen
                        </Link>
                        <Link to={`/business/update`} className="neu-btn !py-2 !px-3 text-sm flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-lg">edit</span>
                            Aanpassen
                        </Link>
                        <button onClick={openGenerateLinkModel} className="neu-btn !py-2 !px-3 text-sm flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-lg">person_add</span>
                            Collega
                        </button>
                    </div>
                )}

                {/* Teacher-only invite button */}
                {showUpdateButton && authData.type === "teacher" && authData.businessId !== businessId && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200/50">
                        <button onClick={openGenerateLinkModel} className="neu-btn !py-2 !px-3 text-sm flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-lg">person_add</span>
                            Collega toevoegen
                        </button>
                    </div>
                )}
            </div>

            {/* Modal stays the same */}
            <Modal
                modalHeader={`Collega toevoegen aan ${name}`}
                isModalOpen={isModalOpen}
                setIsModalOpen={setIsModalOpen}
            >
                <div className="p-4">
                    {isLoading ?
                        <div className='flex flex-col items-center gap-4'>
                            <p className='font-semibold'>Aan het laden...</p>
                            <Loading size="48px" />
                        </div>
                        : error ?
                            <div className="flex flex-col items-center gap-2 text-red-600">
                                <p className='font-semibold'>Er is iets misgegaan.</p>
                                <p className='text-sm'>{error}</p>
                                <button
                                    type="button"
                                    className="neu-btn-primary mt-2"
                                    onClick={openGenerateLinkModel}
                                >
                                    Probeer opnieuw
                                </button>
                            </div>
                            : inviteLink &&
                            <div className="flex flex-col items-center">
                                <p className='font-semibold'>Deel de volgende link met een collega:</p>
                                <div className='w-full flex flex-row gap-2 mt-2'>
                                    <div className="basis-full">
                                        <FormInput
                                            placeholder={"Uitnodigingslink"}
                                            readonly={true}
                                            initialValue={inviteLink}
                                        />
                                    </div>
                                    <button
                                        className="neu-btn !p-2"
                                        onClick={onCopyLink}
                                        ref={toolTipRef}
                                    >
                                        <span className="material-symbols-outlined">content_copy</span>
                                        <span className="sr-only">Kopieer link</span>
                                        <Tooltip parentRef={toolTipRef}>
                                            {tooltipText}
                                        </Tooltip>
                                    </button>
                                </div>
                                <p className='text-sm mt-2 text-gray-500'>Geldig tot {formatDate(expiry)}</p>
                                <p className='text-xs mt-1 text-gray-400'>De link is slechts één keer bruikbaar.</p>
                                <button
                                    type="button"
                                    className="neu-btn mt-4 text-sm"
                                    onClick={openGenerateLinkModel}
                                >
                                    Nieuwe link genereren
                                </button>
                            </div>
                    }
                </div>
            </Modal>
        </>
    )
}
