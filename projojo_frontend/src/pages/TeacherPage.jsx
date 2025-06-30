import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";
import BusinessesOverview from "../components/BusinessesOverview";
import FormInput from "../components/FormInput";
import Loading from "../components/Loading";
import Modal from "../components/Modal";
import NewSkillsManagement from "../components/NewSkillsManagement";
import PageHeader from '../components/PageHeader';
import Tooltip from "../components/Tooltip";
import { createTeacherInviteKey, createNewBusiness, getBusinessesBasic } from "../services";

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
                const timestamp = new Date(new Date(data.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);

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
            <BusinessesOverview businesses={businesses} />
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
