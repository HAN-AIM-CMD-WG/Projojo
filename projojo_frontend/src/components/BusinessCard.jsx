import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FILE_BASE_URL } from '../services';
import { useAuth } from './AuthProvider';
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
        createBusinessInviteLink(businessId)
            .then(({ link, timestamp }) => {
                setInviteLink(link);
                setExpiry(timestamp);

                setIsLoading(false);
            })
            .catch(error => {
                setError(error.message);
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
        <div className="flex flex-col items-center bg-slate-200 border border-gray-200 rounded-lg shadow md:flex-row w-full  ">
            <img className="w-full max-h-64 rounded-t-lg md:h-48 md:w-48 md:rounded-none md:rounded-s-lg object-cover" src={`${FILE_BASE_URL}${image}`} alt="Bedrijfslogo" />
            <div className="flex flex-col justify-between p-4 leading-normal">
                <h2 className="mb-1 text-4xl font-bold tracking-tight text-gray-900">{name}</h2>
                <h3 className="mb-1 text-xl font-bold tracking-tight text-gray-900 flex gap-1">
                    <svg className="w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" /></svg>
                    {location && location.length > 0 ? 
                        (Array.isArray(location) ? location[0] : location) :
                        <p className="italic text-gray-500 text-lg font-normal">Geen locatie bekend</p>
                    }
                </h3>
                {showDescription && <div className="mb-1 tracking-tight text-gray-900 "><RichTextViewer text={description} /></div>}
                {topSkills && (
                    <>
                        <p className="mb-3 font-normal text-gray-700 ">Top {topSkills.length} skills in dit bedrijf: </p><div className="flex flex-wrap gap-2 pt-1 pb-4">
                            {topSkills.map((skill) => (
                                <SkillBadge key={skill.skillId} skillName={skill.name} isPending={skill.isPending} />
                            ))}
                        </div>
                    </>
                )
                }
            </div>
            <div className="md:ml-auto p-4 flex gap-3 flex-col">
                {!showUpdateButton && <Link to={`/business/${businessId}`} className="btn-primary">Bekijk bedrijf</Link>}
                {showUpdateButton && authData.businessId === businessId && (
                    <>
                        <Link to={`/projects/add`} className="btn-primary ps-3 flex flex-row gap-2 justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden viewBox="0 0 448 512" className='h-5 w-5' stroke='#fff'>
                                <path fill="#ffffff" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z" />
                            </svg>
                            <p>Project toevoegen</p>
                        </Link>
                        <Link className="btn-primary ps-2 flex flex-row gap-2 justify-center items-center" to={`/business/update`}>
                            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden viewBox="0 0 512 512" className='h-4 w-4'>
                                <path fill="#ffffff" d="M362.7 19.3L314.3 67.7 444.3 197.7l48.4-48.4c25-25 25-65.5 0-90.5L453.3 19.3c-25-25-65.5-25-90.5 0zm-71 71L58.6 323.5c-10.4 10.4-18 23.3-22.2 37.4L1 481.2C-1.5 489.7 .8 498.8 7 505s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L421.7 220.3 291.7 90.3z" />
                            </svg>
                            <p>Bedrijf aanpassen</p>
                        </Link>
                    </>
                  )}
                        {(showUpdateButton && (authData.type === "teacher" || authData.businessId === businessId)) && (
                            <button className='btn-primary ps-4 flex flex-row gap-2 justify-center items-center' onClick={openGenerateLinkModel}>
                                <svg xmlns="http://www.w3.org/2000/svg" aria-hidden viewBox="0 0 640 512" className='h-5 w-5'>
                                    <path fill="#ffffff" d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3zM504 312l0-64-64 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l64 0 0-64c0-13.3 10.7-24 24-24s24 10.7 24 24l0 64 64 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-64 0 0 64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"/>
                                </svg>
                                <p>Collega toevoegen</p>
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
                                <p className='font-semibold'>Deel de volgende link met je collega:</p>
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
