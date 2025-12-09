import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { IMAGE_BASE_URL, createSupervisorInviteKey } from '../services';
import { useAuth } from '../auth/AuthProvider';
import FormInput from './FormInput';
import Loading from "./Loading";
import Modal from "./Modal";
import RichTextViewer from './RichTextViewer';
import SkillBadge from './SkillBadge';
import Tooltip from './Tooltip';

export default function BusinessCard({ name, image, location, businessId, topSkills, description, showDescription = false, showUpdateButton = false }) {
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

    return (
        <div className="flex flex-col items-center neu-flat md:flex-row w-full overflow-hidden">
            <img className="w-full max-h-64 rounded-t-2xl md:h-48 md:w-48 md:rounded-none md:rounded-l-2xl object-cover" src={`${IMAGE_BASE_URL}${image}`} alt="Bedrijfslogo" />
            <div className="flex flex-col justify-between p-6 leading-normal flex-1">
                <h2 className="mb-2 text-3xl font-extrabold tracking-tight text-text-primary">{name}</h2>
                <h3 className="mb-2 text-lg font-semibold tracking-tight text-text-secondary flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                    {location && location.length > 0 ?
                        (Array.isArray(location) ? location[0] : location) :
                        <span className="italic text-text-muted font-normal">Geen locatie bekend</span>
                    }
                </h3>
                {showDescription && <div className="mb-2 tracking-tight text-text-secondary"><RichTextViewer text={description} /></div>}
                {topSkills && (
                    <>
                        <p className="mb-3 font-semibold text-text-muted text-sm">Top {topSkills.length} skills in dit bedrijf:</p>
                        <div className="flex flex-wrap gap-2 pt-1 pb-4">
                            {topSkills.map((skill) => (
                                <SkillBadge key={skill.skillId ?? skill.id} skillName={skill.name} isPending={skill.isPending ?? skill.is_pending} />
                            ))}
                        </div>
                    </>
                )
                }
            </div>
            <div className="md:ml-auto p-6 flex gap-3 flex-col">
                {!showUpdateButton && <Link to={`/business/${businessId}`} className="neu-btn-primary text-center">Bekijk bedrijf</Link>}
                {showUpdateButton && authData.businessId === businessId && (
                    <>
                        <Link to={`/projects/add`} className="neu-btn-primary flex flex-row gap-2 justify-center items-center">
                            <span className="material-symbols-outlined text-lg">add</span>
                            <span>Project toevoegen</span>
                        </Link>
                        <Link className="neu-btn flex flex-row gap-2 justify-center items-center" to={`/business/update`}>
                            <span className="material-symbols-outlined text-lg">edit</span>
                            <span>Bedrijf aanpassen</span>
                        </Link>
                    </>
                )}
                {(showUpdateButton && (authData.type === "teacher" || authData.businessId === businessId)) && (
                    <button className='neu-btn flex flex-row gap-2 justify-center items-center' onClick={openGenerateLinkModel}>
                        <span className="material-symbols-outlined text-lg">person_add</span>
                        <span>Collega toevoegen</span>
                    </button>
                )}
            </div>

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
                                    className="btn-primary mt-2"
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
                                        className="hover:bg-gray-200 transition-colors p-2 rounded-md"
                                        onClick={onCopyLink}
                                        ref={toolTipRef}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className='w-5 h-5'><path stroke="currentColor" d="M104.6 48L64 48C28.7 48 0 76.7 0 112L0 384c0 35.3 28.7 64 64 64l96 0 0-48-96 0c-8.8 0-16-7.2-16-16l0-272c0-8.8 7.2-16 16-16l16 0c0 17.7 14.3 32 32 32l72.4 0C202 108.4 227.6 96 256 96l62 0c-7.1-27.6-32.2-48-62-48l-40.6 0C211.6 20.9 188.2 0 160 0s-51.6 20.9-55.4 48zM144 56a16 16 0 1 1 32 0 16 16 0 1 1 -32 0zM448 464l-192 0c-8.8 0-16-7.2-16-16l0-256c0-8.8 7.2-16 16-16l140.1 0L464 243.9 464 448c0 8.8-7.2 16-16 16zM256 512l192 0c35.3 0 64-28.7 64-64l0-204.1c0-12.7-5.1-24.9-14.1-33.9l-67.9-67.9c-9-9-21.2-14.1-33.9-14.1L256 128c-35.3 0-64 28.7-64 64l0 256c0 35.3 28.7 64 64 64z" /></svg>
                                        <div className="sr-only">Kopieer link</div>
                                        <Tooltip parentRef={toolTipRef}>
                                            {tooltipText}
                                        </Tooltip>
                                    </button>

                                </div>
                                <p className='text-sm mt-1 text-gray-600 italic'>Deze link is geldig tot {formatDate(expiry)}.</p>
                                <p className='text-sm mt-4'>De link is slechts één keer bruikbaar.</p>
                                <button
                                    type="button"
                                    className="btn-primary mt-2"
                                    onClick={openGenerateLinkModel}
                                >
                                    Maak een nieuwe link
                                </button>
                            </div>
                    }
                </div>
            </Modal>
        </div>
    )
}
