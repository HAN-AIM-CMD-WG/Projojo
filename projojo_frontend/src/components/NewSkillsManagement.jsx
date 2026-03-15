import { useEffect, useState } from "react";
import { getSkills, updateSkillAcceptance, updateSkillName as updateSkillNameService } from "../services";
import { normalizeSkill } from "../utils/skills";
import Alert from "./Alert";
import Modal from "./Modal";
import Loading from "./Loading";

export default function NewSkillsManagement() {
    const [pendingSkills, setPendingSkills] = useState([]);
    const [error, setError] = useState(null);
    const [updateError, setUpdateError] = useState(null);
    const [fetchAmount, setFetchAmount] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSkillId, setSelectedSkillId] = useState(null);
    const [newSkillName, setNewSkillName] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let ignore = false;
        setIsLoading(true);

        getSkills()
            .then(data => {
                if (ignore) return;
                const normalized = (data || []).map(normalizeSkill).filter(Boolean);
                setPendingSkills(
                    normalized
                        .filter(skill => skill.isPending === true)
                        .sort((a, b) => a.name.localeCompare(b.name))
                );
            })
            .catch(() => {
                if (ignore) return;
                setError("Er is iets misgegaan bij het ophalen van de skills.");
            })
            .finally(() => {
                if (ignore) return;
                setIsLoading(false);
            });

        return () => {
            ignore = true;
        }
    }, [fetchAmount]);

    function acceptSkill(skillId) {
        const skill = pendingSkills.find(skill => skill.skillId === skillId);
        if (!skill) {
            setError("Er is iets misgegaan bij het accepteren van de skill.");
            return;
        }

        updateSkillAcceptance(skillId, true)
            .then(() => {
                setFetchAmount((currentAmount) => currentAmount + 1);
            })
            .catch((error) => {
                setError(error.message);
            });
    }

    function declineSkill(skillId) {
        const skill = pendingSkills.find(skill => skill.skillId === skillId);
        if (!skill) {
            setError("Er is iets misgegaan bij het afwijzen van de skill.");
            return;
        }

        updateSkillAcceptance(skillId, false)
            .then(() => {
                setFetchAmount((currentAmount) => currentAmount + 1);
            })
            .catch((error) => {
                setError(error.message);
            });
    }

    function openEditModal(skillId) {
        setSelectedSkillId(skillId);
        setNewSkillName(pendingSkills.find(skill => skill.skillId === skillId).name);
        setIsModalOpen(true);
    }

    function updateSkillName() {
        updateSkillNameService(selectedSkillId, newSkillName)
            .then(() => {
                setFetchAmount((currentAmount) => currentAmount + 1);
                setIsModalOpen(false);
            })
            .catch((error) => {
                setUpdateError(error.message);
            });
    }

    if (isLoading) {
        return (
            <Loading />
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <Alert text={error} />
            <div className="mt-3">
                <h1 className="text-2xl text-gray-900 font-semibold">Skill beheer</h1>
                <p>Er zijn <strong>{pendingSkills.length}</strong> skills om te verwerken.</p>
            </div>
            <div className="relative overflow-x-auto shadow md:rounded-lg">
                <table className="w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th scope="col" className="px-3 md:px-6 py-3">Skill</th>
                            <th scope="col" className="px-3 md:px-6 py-3">Acties</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingSkills.length === 0 && (
                            <tr>
                                <td colSpan="2" className="px-3 md:px-6 py-2">Er zijn geen nieuwe skills om te verwerken</td>
                            </tr>
                        )}
                        {pendingSkills.map(skill => (
                            <tr key={skill.skillId || skill.id} className="border-b hover:bg-gray-100">
                                <th scope="row" className="px-3 md:px-6 py-2 font-medium text-gray-900 whitespace-nowrap w-full">
                                    {skill.name}
                                </th>
                                <td className="px-3 md:px-6 py-2 font-medium text-gray-900 whitespace-nowrap">
                                    <div className="flex items-center space-x-4">
                                        <button className="btn-secondary flex items-center" onClick={() => openEditModal(skill.skillId)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 -ml-0.5" fill="currentColor" viewBox="0 0 512 512"><path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L437.7 172.3 339.7 74.3 172.4 241.7zM96 64C43 64 0 107 0 160L0 416c0 53 43 96 96 96l256 0c53 0 96-43 96-96l0-96c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 96c0 17.7-14.3 32-32 32L96 448c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l96 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L96 64z" /></svg>
                                            Wijzigen
                                        </button>
                                        <button className="btn flex items-center bg-red-600 hover:bg-red-700 focus:ring-red-300 text-white" onClick={() => declineSkill(skill.skillId)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 -ml-0.5" fill="currentColor" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
                                            Afwijzen
                                        </button>
                                        <button className="btn flex items-center bg-green-700 hover:bg-green-800 focus:ring-green-500 text-white" onClick={() => acceptSkill(skill.skillId)}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 -ml-0.5" fill="currentColor" viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" /></svg>
                                            Accepteren
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Modal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} modalHeader={"Skillnaam wijzigen"}>
                <div className="flex flex-col gap-4">
                    <Alert text={updateError} />
                    <form onSubmit={(e) => e.preventDefault()}>
                        <div>
                            <label htmlFor="skillname" className="block text-sm font-medium leading-6 text-gray-900">Nieuwe naam</label>
                            <input type="text" id="skillname" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 placeholder:text-gray-400 sm:text-sm sm:leading-6 p-3" />
                        </div>

                        <div className="flex justify-center gap-3 mt-4">
                            <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Annuleren</button>
                            <button type="submit" className="btn-primary" onClick={updateSkillName}>Opslaan</button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    )
}