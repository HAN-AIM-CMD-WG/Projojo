import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import BusinessesOverview from "../components/BusinessesOverview";
import FormInput from "../components/FormInput";
import Loading from "../components/Loading";
import Modal from "../components/Modal";
import NewSkillsManagement from "../components/NewSkillsManagement";
import PageHeader from '../components/PageHeader';
import Tooltip from "../components/Tooltip";
import { createTeacherInviteKey, createNewBusiness, getBusinessesBasic, getArchivedBusinessesBasic, getArchivedProjects, getArchivedTasks, unarchiveProject, unarchiveTask } from "../services";

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
    const [showArchived, setShowArchived] = useState(false);
    const [archivedProjects, setArchivedProjects] = useState([]);
    const [archivedTasks, setArchivedTasks] = useState([]);
    const [showActive, setShowActive] = useState(true);
    const [showArchivedProjects, setShowArchivedProjects] = useState(false);
    const [showArchivedTasks, setShowArchivedTasks] = useState(false);
    const [isCreateBusinessModalVisible, setIsCreateBusinessModalVisible] = useState(false);
    const [newBusinessName, setNewBusinessName] = useState("");
    const [createNewBusinessError, setCreateNewBusinessError] = useState("");
    const [numberToReloadBusinesses, setNumberToReloadBusinesses] = useState(0);

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
        createNewBusiness(newBusinessName)
            .then(() => {
                setCreateNewBusinessError(null);
                setIsCreateBusinessModalVisible(false);
                setNewBusinessName("");

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

        Promise.allSettled([
            getBusinessesBasic(),
            getArchivedBusinessesBasic(),
            getArchivedProjects(),
            getArchivedTasks()
        ])
            .then((results) => {
                if (ignore) return;
                const [activeRes, archivedBizRes, archivedProjRes, archivedTaskRes] = results;

                if (activeRes.status === "fulfilled") {
                    setBusinesses(activeRes.value || []);
                } else {
                    setBusinesses([]);
                    setError(prev => prev ? prev : activeRes.reason?.message || "Kon actieve bedrijven niet laden.");
                }

                if (archivedBizRes.status === "fulfilled") {
                    setArchivedBusinesses(archivedBizRes.value || []);
                } else {
                    setArchivedBusinesses([]);
                    setError(prev => prev ? prev : archivedBizRes.reason?.message || "Kon gearchiveerde bedrijven niet laden.");
                }

                if (archivedProjRes.status === "fulfilled") {
                    setArchivedProjects(archivedProjRes.value || []);
                } else {
                    setArchivedProjects([]);
                    setError(prev => prev ? prev : archivedProjRes.reason?.message || "Kon gearchiveerde projecten niet laden.");
                }

                if (archivedTaskRes.status === "fulfilled") {
                    setArchivedTasks(archivedTaskRes.value || []);
                } else {
                    setArchivedTasks([]);
                    setError(prev => prev ? prev : archivedTaskRes.reason?.message || "Kon gearchiveerde taken niet laden.");
                }
            })
            .finally(() => {
                if (ignore) return;
                setIsLoading(false);
            });

        return () => {
            ignore = true;
            setIsLoading(false);
        }
    }, [numberToReloadBusinesses]);

    return (
        <>
            <PageHeader name={'Beheerpagina'} />
            <div className="flex flex-row gap-4 justify-between">
                <button onClick={() => openGenerateLinkModel()} className="btn-primary mb-4">Nodig docenten uit</button>
                <button onClick={() => setIsCreateBusinessModalVisible(true)} className="btn-primary mb-4">Bedrijf aanmaken</button>
            </div>
            {error && (
                <div className="mb-4 p-3 rounded-md border border-red-200 text-red-700 bg-red-50">
                    {error}
                </div>
            )}

            {isLoading && (
                <div className="mb-4">
                    <Loading size="36px" />
                </div>
            )}

            {businesses?.length > 0 && (
                <div className="mt-4">
                    <button
                        className="w-full flex items-center justify-between p-3 rounded-md bg-slate-100 hover:bg-slate-200 transition"
                        onClick={() => setShowActive(!showActive)}
                    >
                        <span className="font-semibold">Actieve bedrijven ({businesses.length})</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showActive ? 'rotate-180' : ''}`} viewBox="0 0 320 512"><path d="M182.6 137.4c-9.4-9.4-24.6-9.4-33.9 0l-144 144c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0L160 201.9l121.4 121.4c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-144-144z"/></svg>
                    </button>
                    {showActive && (
                        <div className="mt-4">
                            <BusinessesOverview
                                businesses={businesses}
                                onChanged={() => setNumberToReloadBusinesses(numberToReloadBusinesses + 1)}
                                isArchived={false}
                                showUpdateButton={true}
                            />
                        </div>
                    )}
                </div>
            )}

            {archivedBusinesses?.length > 0 && (
                <div className="mt-8">
                    <button
                        className="w-full flex items-center justify-between p-3 rounded-md bg-slate-100 hover:bg-slate-200 transition"
                        onClick={() => setShowArchived(!showArchived)}
                    >
                        <span className="font-semibold">Gearchiveerde bedrijven ({archivedBusinesses.length})</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showArchived ? 'rotate-180' : ''}`} viewBox="0 0 320 512"><path d="M182.6 137.4c-9.4-9.4-24.6-9.4-33.9 0l-144 144c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0L160 201.9l121.4 121.4c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-144-144z"/></svg>
                    </button>
                    {showArchived && (
                        <div className="mt-4">
                            <BusinessesOverview
                                businesses={archivedBusinesses}
                                onChanged={() => setNumberToReloadBusinesses(numberToReloadBusinesses + 1)}
                                isArchived={true}
                                showUpdateButton={false}
                            />
                        </div>
                    )}
                </div>
            )}
            {archivedProjects?.length > 0 && (
                <div className="mt-6">
                    <button
                        className="w-full flex items-center justify-between p-3 rounded-md bg-slate-100 hover:bg-slate-200 transition"
                        onClick={() => setShowArchivedProjects(!showArchivedProjects)}
                    >
                        <span className="font-semibold">Gearchiveerde projecten ({archivedProjects.length})</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showArchivedProjects ? 'rotate-180' : ''}`} viewBox="0 0 320 512"><path d="M182.6 137.4c-9.4-9.4-24.6-9.4-33.9 0l-144 144c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0L160 201.9l121.4 121.4c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-144-144z"/></svg>
                    </button>
                    {showArchivedProjects && (
                        <div className="mt-4 flex flex-col gap-2">
                            {archivedProjects.map((proj) => (
                                <div key={proj.id} className="flex items-center justify-between p-3 bg-slate-100 rounded-md border">
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{proj.name}</span>
                                        <span className="text-sm text-gray-600">Project ID: {proj.id}</span>
                                    </div>
                                    <button
                                        className="btn-primary bg-green-600 hover:bg-green-700"
                                        onClick={() => unarchiveProject(proj.id).then(() => setNumberToReloadBusinesses(numberToReloadBusinesses + 1))}
                                    >
                                        Herstel
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {archivedTasks?.length > 0 && (
                <div className="mt-6">
                    <button
                        className="w-full flex items-center justify-between p-3 rounded-md bg-slate-100 hover:bg-slate-200 transition"
                        onClick={() => setShowArchivedTasks(!showArchivedTasks)}
                    >
                        <span className="font-semibold">Gearchiveerde taken ({archivedTasks.length})</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${showArchivedTasks ? 'rotate-180' : ''}`} viewBox="0 0 320 512"><path d="M182.6 137.4c-9.4-9.4-24.6-9.4-33.9 0l-144 144c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0L160 201.9l121.4 121.4c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-144-144z"/></svg>
                    </button>
                    {showArchivedTasks && (
                        <div className="mt-4 flex flex-col gap-2">
                            {archivedTasks.map((t) => (
                                <div key={t.id} className="flex items-center justify-between p-3 bg-slate-100 rounded-md border">
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{t.name}</span>
                                        <span className="text-sm text-gray-600">Taak ID: {t.id}</span>
                                    </div>
                                    <button
                                        className="btn-primary bg-green-600 hover:bg-green-700"
                                        onClick={() => unarchiveTask(t.id).then(() => setNumberToReloadBusinesses(numberToReloadBusinesses + 1))}
                                    >
                                        Herstel
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <hr className="mt-8 mb-3" />
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
                        <p className="mt-1 text-sm italic text-gray-600">De rest van de informatie vult het bedrijf zelf in.</p>
                    </div>
                    {createNewBusinessError && <p className="col-span-2 text-red-600 bg-red-50 p-3 rounded-md border border-red-200 mb-2">{createNewBusinessError}</p>}
                    <button type="button" onClick={onCreateNewBusiness} name="Bedrijf aanmaken" className="btn-primary w-full">
                        Bedrijf aanmaken
                    </button>
                </form>
            </Modal>
        </>
    )
}
