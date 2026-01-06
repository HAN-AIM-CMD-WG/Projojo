import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import FormInput from "../components/FormInput";
import Loading from "../components/Loading";
import Modal from "../components/Modal";
import NewSkillsManagement from "../components/NewSkillsManagement";
import PageHeader from '../components/PageHeader';
import Tooltip from "../components/Tooltip";
import { createTeacherInviteKey, createNewBusiness, getBusinessesBasic, getArchivedBusinesses, archiveBusiness, restoreBusiness, IMAGE_BASE_URL } from "../services";

export default function TeacherPage() {
    const { authData } = useAuth();
    const navigation = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [inviteLink, setInviteLink] = useState(null);
    const [expiry, setExpiry] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [tooltipText, setTooltipText] = useState("Kopieer link");
    const toolTipRef = useRef(null);
    const [timeoutRef, setTimeoutRef] = useState(null);
    const [businesses, setBusinesses] = useState([]);
    const [archivedBusinesses, setArchivedBusinesses] = useState([]);
    const [isCreateBusinessModalVisible, setIsCreateBusinessModalVisible] = useState(false);
    const [newBusinessName, setNewBusinessName] = useState("");
    const [createAsDraft, setCreateAsDraft] = useState(false);
    const [createNewBusinessError, setCreateNewBusinessError] = useState("");
    const [numberToReloadBusinesses, setNumberToReloadBusinesses] = useState(0);
    const [archiveModalBusiness, setArchiveModalBusiness] = useState(null);
    const [isArchiving, setIsArchiving] = useState(false);
    const [showArchivedSection, setShowArchivedSection] = useState(false);

    useEffect(() => {
        if (!authData.isLoading && authData.type !== 'teacher') {
            navigation("/not-found");
        }
    }, [authData.isLoading]);

    const formatDate = date => {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString("nl-NL", options);
    };

    const onCreateNewBusiness = () => {
        createNewBusiness(newBusinessName, createAsDraft)
            .then(() => {
                setCreateNewBusinessError(null);
                setIsCreateBusinessModalVisible(false);
                setNewBusinessName("");
                setCreateAsDraft(false);
                // If created as draft, show the archived section
                if (createAsDraft) {
                    setShowArchivedSection(true);
                }
                setNumberToReloadBusinesses(numberToReloadBusinesses + 1);
            })
            .catch(error => {
                setCreateNewBusinessError(error.message);
            })
    }

    const openGenerateLinkModel = () => {
        setInviteLink(null);
        setExpiry(null);
        setError(null);
        setIsModalOpen(true);

        setIsLoading(true);
        createTeacherInviteKey()
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

    useEffect(() => {
        let ignore = false;
        setIsLoading(true);

        // Fetch active businesses first
        getBusinessesBasic()
            .then(data => {
                if (ignore) return;
                setBusinesses(data);
            })
            .catch(err => {
                if (ignore) return;
                setError(err.message);
            })
            .finally(() => {
                if (ignore) return;
                setIsLoading(false);
            });

        // Fetch archived businesses separately (non-blocking)
        getArchivedBusinesses()
            .then(data => {
                if (ignore) return;
                setArchivedBusinesses(data);
            })
            .catch(() => {
                // Silently fail - archived businesses are optional
                if (ignore) return;
                setArchivedBusinesses([]);
            });

        return () => {
            ignore = true;
            setIsLoading(false);
        }
    }, [numberToReloadBusinesses]);

    const handleArchiveBusiness = async () => {
        if (!archiveModalBusiness || isArchiving) return;
        
        setIsArchiving(true);
        try {
            await archiveBusiness(archiveModalBusiness.id);
            setArchiveModalBusiness(null);
            setNumberToReloadBusinesses(prev => prev + 1);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsArchiving(false);
        }
    };

    const handleRestoreBusiness = async (businessId) => {
        try {
            await restoreBusiness(businessId);
            // Force refresh of both lists
            setNumberToReloadBusinesses(prev => prev + 1);
        } catch (err) {
            console.error("Error restoring business:", err);
            setError(err.message || "Er ging iets mis bij het herstellen");
        }
    };

    return (
        <>
            <PageHeader name={'Beheerpagina'} />
            <div className="flex flex-wrap gap-4 justify-between mb-6">
                <button onClick={() => openGenerateLinkModel()} className="neu-btn-primary">
                    <span className="material-symbols-outlined text-sm mr-2">person_add</span>
                    Nodig docenten uit
                </button>
                <button onClick={() => setIsCreateBusinessModalVisible(true)} className="neu-btn-primary">
                    <span className="material-symbols-outlined text-sm mr-2">add_business</span>
                    Bedrijf aanmaken
                </button>
            </div>

            {/* Active Businesses */}
            <section className="mb-8">
                <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">business</span>
                    Actieve Bedrijven
                    <span className="neu-badge-primary ml-2">{businesses.length}</span>
                </h2>
                
                {isLoading ? (
                    <Loading />
                ) : businesses.length === 0 ? (
                    <div className="neu-pressed p-8 text-center">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">business</span>
                        <p className="text-[var(--text-muted)]">Nog geen bedrijven aangemaakt</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {businesses.map((business) => (
                            <div key={business.id} className="neu-flat p-4">
                                <div className="flex items-start gap-3">
                                    {business.image_path ? (
                                        <img 
                                            src={`${IMAGE_BASE_URL}${business.image_path}`}
                                            alt={business.name}
                                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-gray-400">business</span>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-[var(--text-primary)] truncate">{business.name}</h3>
                                        <p className="text-sm text-[var(--text-muted)] truncate">{business.location || 'Geen locatie'}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Link 
                                        to={`/business/${business.id}`}
                                        className="neu-btn flex-1 text-sm justify-center"
                                    >
                                        <span className="material-symbols-outlined text-sm mr-1">visibility</span>
                                        Bekijk
                                    </Link>
                                    <button
                                        onClick={() => setArchiveModalBusiness(business)}
                                        className="neu-btn text-sm !text-red-500"
                                    >
                                        <span className="material-symbols-outlined text-sm">archive</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Archived Businesses Section */}
            <section className="mb-8">
                <button 
                    onClick={() => setShowArchivedSection(!showArchivedSection)}
                    className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-4"
                >
                    <span className={`material-symbols-outlined transition-transform ${showArchivedSection ? 'rotate-90' : ''}`}>
                        chevron_right
                    </span>
                    <span className="font-bold">Gearchiveerde Bedrijven</span>
                    {archivedBusinesses.length > 0 && (
                        <span className="neu-badge-outline">{archivedBusinesses.length}</span>
                    )}
                </button>
                
                {showArchivedSection && (
                    archivedBusinesses.length === 0 ? (
                        <div className="neu-pressed p-6 text-center">
                            <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">inventory_2</span>
                            <p className="text-[var(--text-muted)] text-sm">Geen gearchiveerde bedrijven</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {archivedBusinesses.map((business) => (
                                <div key={business.id} className="neu-pressed p-4 opacity-75">
                                    <div className="flex items-start gap-3">
                                        {business.image_path ? (
                                            <img 
                                                src={`${IMAGE_BASE_URL}${business.image_path}`}
                                                alt={business.name}
                                                className="w-12 h-12 rounded-xl object-cover shrink-0 grayscale"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-gray-400">business</span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[var(--text-secondary)] truncate">{business.name}</h3>
                                            <p className="text-sm text-[var(--text-muted)] truncate">{business.location || 'Geen locatie'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <Link 
                                            to={`/business/${business.id}`}
                                            className="neu-btn flex-1 text-sm justify-center"
                                        >
                                            <span className="material-symbols-outlined text-sm mr-1">edit</span>
                                            Bewerken
                                        </Link>
                                        <button
                                            onClick={() => handleRestoreBusiness(business.id)}
                                            className="neu-btn text-sm !text-green-600"
                                            title="Publiceren"
                                        >
                                            <span className="material-symbols-outlined text-sm">unarchive</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </section>

            <hr className="mt-8 mb-6 border-gray-200" />
            <NewSkillsManagement />

            <Modal
                modalHeader={`Collega toevoegen`}
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
                                <p className='text-sm mt-1 text-[var(--text-secondary)] italic'>Deze link is geldig tot {formatDate(expiry)}.</p>
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

            {/* Archive Confirmation Modal */}
            <Modal
                modalHeader="Bedrijf archiveren"
                isModalOpen={!!archiveModalBusiness}
                setIsModalOpen={() => setArchiveModalBusiness(null)}
            >
                <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
                        </div>
                        <div>
                            <p className="font-semibold text-[var(--text-primary)]">
                                Weet je zeker dat je <span className="text-primary">{archiveModalBusiness?.name}</span> wilt archiveren?
                            </p>
                            <p className="text-sm text-[var(--text-muted)] mt-1">
                                Het bedrijf wordt verborgen voor studenten en supervisors.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setArchiveModalBusiness(null)}
                            disabled={isArchiving}
                            className="neu-btn flex-1"
                        >
                            Annuleren
                        </button>
                        <button
                            onClick={handleArchiveBusiness}
                            disabled={isArchiving}
                            className="neu-btn flex-1 !bg-red-500 !text-white hover:!bg-red-600"
                        >
                            {isArchiving ? (
                                <>
                                    <span className="material-symbols-outlined text-sm animate-spin mr-1">hourglass_empty</span>
                                    Bezig...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm mr-1">archive</span>
                                    Archiveren
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal
                modalHeader={`Nieuw bedrijf`}
                isModalOpen={isCreateBusinessModalVisible}
                setIsModalOpen={setIsCreateBusinessModalVisible}
            >
                <form
                    onSubmit={e => {
                        e.preventDefault();
                        onCreateNewBusiness();
                    }}
                >
                    <div className="flex flex-col mb-4">
                        <FormInput onChange={businessName => setNewBusinessName(businessName)} value={newBusinessName} type="text" label={`Bedrijfsnaam`} placeholder={"Vul de naam van het bedrijf in..."} name={`title`} required />
                        <p className="mt-1 text-sm italic text-[var(--text-secondary)]">De rest van de informatie vult het bedrijf zelf in.</p>
                    </div>
                    
                    {/* Create as draft checkbox */}
                    <label className="flex items-center gap-3 mb-4 cursor-pointer group">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                checked={createAsDraft}
                                onChange={(e) => setCreateAsDraft(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-5 h-5 neu-pressed rounded-md peer-checked:bg-primary peer-checked:shadow-none transition-all flex items-center justify-center">
                                {createAsDraft && (
                                    <span className="material-symbols-outlined text-white text-sm">check</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-[var(--text-primary)] group-hover:text-primary transition-colors">Aanmaken als concept</span>
                            <p className="text-xs text-[var(--text-muted)]">Het bedrijf is verborgen totdat je het publiceert</p>
                        </div>
                    </label>
                    
                    {createNewBusinessError && <p className="col-span-2 text-red-600 bg-red-50 p-3 rounded-md border border-red-200 mb-2">{createNewBusinessError}</p>}
                    <button type="button" onClick={onCreateNewBusiness} name="Bedrijf aanmaken" className="neu-btn-primary w-full justify-center">
                        <span className="material-symbols-outlined text-sm mr-2">{createAsDraft ? 'edit_note' : 'add_business'}</span>
                        {createAsDraft ? 'Concept aanmaken' : 'Bedrijf aanmaken'}
                    </button>
                </form>
            </Modal>
        </>
    )
}
