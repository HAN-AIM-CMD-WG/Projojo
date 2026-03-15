import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import BusinessesOverview from "../components/BusinessesOverview";
import FormInput from "../components/FormInput";
import Modal from "../components/Modal";
import NewSkillsManagement from "../components/NewSkillsManagement";
import PageHeader from '../components/PageHeader';
import Tooltip from "../components/Tooltip";
import { createTeacherInviteKey, createNewBusiness, getBusinessesBasic, getArchivedBusinessesBasic, getArchivedProjects, getArchivedTasks, unarchiveProject, unarchiveTask } from "../services";
import { createNewBusiness, getBusinessesBasic } from "../services";
import Alert from "@/components/Alert";

export default function TeacherPage() {
    const { authData } = useAuth();
    const navigation = useNavigate();
    const [error, setError] = useState(null);
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

    useEffect(() => {
        let ignore = false;

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

        return () => {
            ignore = true;
        }
    }, [numberToReloadBusinesses]);

    return (
        <>
            <Alert text={error} onClose={() => setError(null)} />
            <PageHeader name={'Beheerpagina'} />
            <div className="flex flex-row gap-4 justify-end">
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
