import { useEffect, useState } from "react";
import { getSkills, updateSkillAcceptance, updateSkillName as updateSkillNameService } from "../services";
import { normalizeSkill } from "../utils/skills";
import Alert from "./Alert";
import Modal from "./Modal";

export default function NewSkillsManagement() {
    const [pendingSkills, setPendingSkills] = useState([]);
    const [error, setError] = useState(null);
    const [updateError, setUpdateError] = useState(null);
    const [fetchAmount, setFetchAmount] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSkillId, setSelectedSkillId] = useState(null);
    const [newSkillName, setNewSkillName] = useState("");

    useEffect(() => {
        let ignore = false;

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

    return (
        <div className="flex flex-col gap-6">
            <Alert text={error} />
            
            {/* Header */}
            <div>
                <h1 className="text-2xl font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">psychology</span>
                    Skill beheer
                </h1>
                <p className="text-[var(--text-muted)] mt-1">
                    Er {pendingSkills.length === 1 ? 'is' : 'zijn'} <strong className="text-primary">{pendingSkills.length}</strong> skill{pendingSkills.length !== 1 ? 's' : ''} om te verwerken.
                </p>
            </div>

            {/* Skills Table */}
            <div className="neu-flat rounded-2xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[var(--text-muted)] uppercase bg-[var(--gray-200)]/50 border-b border-[var(--neu-border)]">
                        <tr>
                            <th scope="col" className="px-4 md:px-6 py-4 font-bold">Skill</th>
                            <th scope="col" className="px-4 md:px-6 py-4 font-bold">Acties</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingSkills.length === 0 && (
                            <tr>
                                <td colSpan="2" className="px-4 md:px-6 py-8 text-center text-[var(--text-muted)]">
                                    <span className="material-symbols-outlined text-4xl mb-2 block">check_circle</span>
                                    Er zijn geen nieuwe skills om te verwerken
                                </td>
                            </tr>
                        )}
                        {pendingSkills.map(skill => (
                            <tr key={skill.skillId || skill.id} className="border-b border-[var(--neu-border)] hover:bg-[var(--gray-200)]/30 transition-colors">
                                <th scope="row" className="px-4 md:px-6 py-4 font-bold text-[var(--text-primary)] w-full">
                                    {skill.name}
                                </th>
                                <td className="px-4 md:px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button 
                                            className="neu-btn !py-2 !px-3 text-sm flex items-center gap-1.5" 
                                            onClick={() => openEditModal(skill.skillId)}
                                        >
                                            <span className="material-symbols-outlined text-base">edit</span>
                                            Wijzigen
                                        </button>
                                        <button 
                                            className="neu-btn !py-2 !px-3 text-sm flex items-center gap-1.5 !text-red-600 hover:!bg-red-50" 
                                            onClick={() => declineSkill(skill.skillId)}
                                        >
                                            <span className="material-symbols-outlined text-base">delete</span>
                                            Afwijzen
                                        </button>
                                        <button 
                                            className="neu-btn-primary !py-2 !px-3 text-sm flex items-center gap-1.5" 
                                            onClick={() => acceptSkill(skill.skillId)}
                                        >
                                            <span className="material-symbols-outlined text-base">check</span>
                                            Accepteren
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            <Modal isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen} modalHeader={"Skillnaam wijzigen"}>
                <div className="flex flex-col gap-4">
                    <Alert text={updateError} />
                    <form onSubmit={(e) => e.preventDefault()}>
                        <div>
                            <label htmlFor="skillname" className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Nieuwe naam</label>
                            <input 
                                type="text" 
                                id="skillname" 
                                value={newSkillName} 
                                onChange={(e) => setNewSkillName(e.target.value)} 
                                className="w-full px-4 py-3 neu-pressed rounded-xl outline-none text-[var(--text-primary)] font-semibold focus:ring-2 focus:ring-primary/20 transition-all" 
                            />
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button type="button" className="neu-btn font-bold" onClick={() => setIsModalOpen(false)}>Annuleren</button>
                            <button type="submit" className="neu-btn-primary font-bold flex items-center gap-2" onClick={updateSkillName}>
                                <span className="material-symbols-outlined text-lg">save</span>
                                Opslaan
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    )
}