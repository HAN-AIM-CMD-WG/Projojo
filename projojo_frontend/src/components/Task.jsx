import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createRegistration, getRegistrations, updateRegistration, updateTaskSkills } from "../services";
import Alert from "./Alert";
import { useAuth } from "../auth/AuthProvider";
import { useStudentSkills } from "../context/StudentSkillsContext";
import FormInput from "./FormInput";
import InfoBox from "./InfoBox";
import Modal from "./Modal";
import RichTextEditor from "./RichTextEditor";
import RichTextViewer from "./RichTextViewer";
import SkillBadge from "./SkillBadge";
import SkillsEditor from "./SkillsEditor";
import CreateBusinessEmail from "./CreateBusinessEmail";

export default function Task({ task, setFetchAmount, businessId, allSkills, studentAlreadyRegistered }) {
    const { authData } = useAuth();
    const { studentSkills } = useStudentSkills();
    const studentSkillIds = new Set(studentSkills.map(s => s.skillId).filter(Boolean));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState("");
    const [registrationErrors, setRegistrationErrors] = useState([]);
    const [taskSkillsError, setTaskSkillsError] = useState("");
    const [isRegistrationsModalOpen, setIsRegistrationsModalOpen] = useState(false);
    const [registrations, setRegistrations] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [motivation, setMotivation] = useState("");
    const [canSubmit, setCanSubmit] = useState(true);

    const isOwner = (authData.type === "supervisor" && authData.businessId === businessId) || authData.type === "teacher";

    const isFull = task.total_accepted >= task.total_needed;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!canSubmit) {
            return;
        }

        setError("");

        try {
            createRegistration(task.id, motivation.trim())
                .then(() => {
                    setIsModalOpen(false);
                    if (setFetchAmount) {
                        setFetchAmount(currentAmount => currentAmount + 1);
                    }
                })
                .catch(error => setError(error.message));
        } catch {
            setError("Er is iets misgegaan bij het versturen van de aanmelding.");
        }
    };

    useEffect(() => {
        if (!isOwner) {
            return;
        }
        let ignore = false;

        getRegistrations(task.id)
            .then(data => {
                if (ignore) return;
                setRegistrations(data);
            })
            .catch(error => {
                if (ignore) return;
                setRegistrationErrors((currentErrors) => [...currentErrors, error.message]);
            });

        return () => {
            ignore = true;
        };
    }, [isOwner, task.id]);

    const handleRegistrationResponse = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userId = formData.get("userId");
        const response = formData.get("response").trim();
        const accepted = e.nativeEvent.submitter.value === "true";

        setRegistrationErrors((currentErrors) => currentErrors.filter((errorObj) => {
            return errorObj.userId !== userId;
        }));

        updateRegistration({
            taskId: task.id,
            userId: userId,
            accepted,
            response,
        })
            .then(() => {
                setRegistrations((currentRegistrations) => {
                    return currentRegistrations.filter((registration) => {
                        return registration.student.id !== userId;
                    });
                });
                setFetchAmount((currentAmount) => currentAmount + 1);
            })
            .catch((error) => {
                setRegistrationErrors((currentErrors) => [...currentErrors, { userId, error: error.message }]);
            });
    }

    const handleSave = async (skills) => {
        const skillIds = skills.map((skill) => skill.skillId || skill.id);

        setTaskSkillsError("");

        try {
            await updateTaskSkills(task.id, skillIds);
            setIsEditing(false)
            setFetchAmount((currentAmount) => currentAmount + 1);
        } catch (error) {
            setTaskSkillsError(error.message);
        }
    };

    // Calculate available spots
    const spotsAvailable = task.total_needed - task.total_accepted;

    return (
        <div id={`task-${task.id}`} className="group h-full">
            <div className="target neu-flat p-6 h-full flex flex-col">
                <div className="flex flex-col lg:flex-row gap-6 flex-grow">
                    {/* Main content */}
                    <div className="flex-grow space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="neu-icon-container text-primary shrink-0">
                                <span className="material-symbols-outlined">assignment</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
                        {task.name}
                    </h2>
                                <span className="neu-label">Taak</span>
                            </div>
                        </div>

                        <div className="text-[var(--text-secondary)] text-sm">
                            <RichTextViewer text={task.description} />
                        </div>

                    <Alert text={taskSkillsError} onClose={() => { setTaskSkillsError("") }} />
                        
                        {/* Skills */}
                        <div>
                            <p className="neu-label mb-2">Vereiste skills</p>
                    <SkillsEditor
                        allSkills={allSkills}
                        initialSkills={task.skills}
                        isEditing={isEditing && isOwner}
                        onSave={handleSave}
                        onCancel={() => setIsEditing(false)}
                        setError={setTaskSkillsError}
                        isAllowedToAddSkill={isOwner}
                    >
                        <div className="flex flex-wrap gap-2 items-center">
                                    {task.skills && task.skills.length === 0 && (
                                        <span className="text-[var(--text-muted)] text-sm">Geen specifieke skills vereist</span>
                                    )}
                            {task.skills && task.skills.map((skill) => {
                                const skillId = skill.skillId ?? skill.id;
                                const isMatch = studentSkillIds.has(skillId);
                                return (
                                    <SkillBadge
                                        key={skillId}
                                        skillName={skill.name}
                                        isPending={skill.isPending ?? skill.is_pending}
                                        isOwn={isMatch}
                                    >
                                        {isMatch && (
                                            <span className="material-symbols-outlined text-xs mr-1">check</span>
                                        )}
                                    </SkillBadge>
                                );
                            })}
                        </div>
                    </SkillsEditor>
                </div>
                    </div>

                    {/* Sidebar with stats and actions */}
                    <div className="lg:w-64 shrink-0 flex flex-col gap-3 lg:justify-between">
                        {/* Stats */}
                        <div className="neu-pressed p-4 rounded-xl space-y-3">
                            <div className="flex items-center gap-2">
                                <span className={`material-symbols-outlined ${spotsAvailable > 0 ? 'text-emerald-600' : 'text-[var(--text-muted)]'}`}>
                                    {spotsAvailable > 0 ? 'check_circle' : 'cancel'}
                                </span>
                                <span className="text-sm font-bold text-[var(--text-primary)]">
                                    {spotsAvailable > 0 ? (
                                        <><span className="text-emerald-600">{spotsAvailable}</span> van {task.total_needed} plekken</>
                                    ) : (
                                        'Taak is vol'
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500">pending</span>
                                <span className="text-sm text-[var(--text-secondary)]">
                                    <span className="font-bold text-amber-600">{task.total_registered}</span> aanmeldingen
                                </span>
                            </div>
                        </div>

                        {/* Action buttons */}
                    {authData.type === "student" && (
                            <button 
                                className={`neu-btn-primary w-full ${(studentAlreadyRegistered || isFull) ? "opacity-50 cursor-not-allowed" : ""}`} 
                                disabled={(studentAlreadyRegistered || isFull)} 
                                onClick={() => setIsModalOpen(true)}
                            >
                                <span className="flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined">
                                        {studentAlreadyRegistered ? 'check' : isFull ? 'block' : 'send'}
                                    </span>
                                    {studentAlreadyRegistered ? "Aangemeld" : isFull ? "Vol" : "Aanmelden"}
                                </span>
                            </button>
                    )}
                        {isOwner && (
                            <>
                                <button className="neu-btn w-full" onClick={() => setIsRegistrationsModalOpen(true)}>
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined">group</span>
                                        Aanmeldingen ({task.total_registered})
                                    </span>
                                </button>
                        <Link to={`/tasks/${task.id}/update`} className="btn-primary w-full text-center">
                            <p>Taak aanpassen</p>
                        </Link>
                        <CreateBusinessEmail taskId={task.id} />
                    </>
                    )}
                </div>
            </div>
            </div>
            {/* Registration modal for students */}
            {!(studentAlreadyRegistered || isFull) && (
                <Modal
                    modalHeader="Aanmelden voor taak"
                    modalSubtitle={task.name}
                    modalIcon="rocket_launch"
                    isModalOpen={isModalOpen}
                    setIsModalOpen={setIsModalOpen}
                >
                    <form onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-5">
                            {/* Info banner */}
                            <div 
                                className="flex items-start gap-3 p-4 rounded-xl"
                                style={{ background: 'rgba(255, 127, 80, 0.05)', border: '1px solid rgba(255, 127, 80, 0.15)' }}
                            >
                                <span className="material-symbols-outlined text-lg mt-0.5 text-primary">lightbulb</span>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                    <span className="font-semibold text-primary">Tip:</span> Een goede motivatie vertelt waarom jij de perfecte match bent voor deze taak.
                                </p>
                            </div>

                            <Alert text={error} />

                            {/* Skills match indicator */}
                            {task.skills && task.skills.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-[var(--text-primary)]">Jouw skills match</span>
                                        <span className="text-sm font-bold text-primary">
                                            {task.skills.filter(s => studentSkillIds.has(s.skillId ?? s.id)).length} van {task.skills.length}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {task.skills.map((skill) => {
                                            const skillId = skill.skillId ?? skill.id;
                                            const isMatch = studentSkillIds.has(skillId);
                                            return (
                                                <span 
                                                    key={skillId}
                                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg ${
                                                        isMatch 
                                                            ? 'bg-primary text-white' 
                                                            : 'bg-[var(--gray-200)] text-[var(--text-muted)]'
                                                    }`}
                                                >
                                                    {isMatch && '✓ '}{skill.name}
                                                </span>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Motivation editor */}
                            <RichTextEditor
                                label="Jouw motivatie"
                                onSave={setMotivation}
                                setCanSubmit={setCanSubmit}
                            />

                            {/* Footer buttons */}
                            <div className="flex items-center justify-between gap-4 pt-2 border-t border-[var(--neu-border)]">
                                <button 
                                    type="button" 
                                    className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors py-2"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Annuleren
                                </button>
                                <button 
                                    type="submit" 
                                    className="group relative overflow-hidden rounded-xl px-6 py-3 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 bg-gradient-to-r from-primary to-orange-600"
                                    style={{ boxShadow: '0 4px 14px rgba(255, 127, 80, 0.3)' }}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">send</span>
                                        Verstuur aanmelding
                                    </span>
                                </button>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Registrations modal for owners */}
            {isOwner && (
                <Modal 
                    maxWidth="max-w-2xl" 
                    modalHeader="Aanmeldingen bekijken"
                    modalSubtitle={task.name}
                    modalIcon="group"
                    isModalOpen={isRegistrationsModalOpen} 
                    setIsModalOpen={setIsRegistrationsModalOpen}
                >
                    <div className="flex flex-col gap-4">
                        {registrations.length === 0 && (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--gray-200)] flex items-center justify-center">
                                    <span className="material-symbols-outlined text-3xl text-[var(--text-muted)]">inbox</span>
                                </div>
                                <p className="text-[var(--text-muted)] font-medium">Er zijn geen open aanmeldingen voor deze taak</p>
                            </div>
                        )}
                        {isFull && (
                            <Alert isCloseable={false} text="Deze taak is vol. Er kunnen geen nieuwe aanmeldingen meer worden geaccepteerd." />
                        )}
                        {registrations.map((registration) => {
                            const taskSkillIds = new Set(task.skills?.map(s => s.skillId ?? s.id) || []);
                            const matchingSkills = registration.student.skills.filter(s => taskSkillIds.has(s.skillId ?? s.id)).length;
                            
                            return (
                                <div 
                                    key={registration.student.id} 
                                    className="rounded-2xl overflow-hidden border border-[var(--neu-border)] bg-[var(--neu-bg)]"
                                >
                                    {/* Student header */}
                                    <div className="p-5 border-b border-[var(--neu-border)]" style={{ background: 'linear-gradient(135deg, rgba(255, 127, 80, 0.03) 0%, transparent 100%)' }}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-orange-400/20 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-primary text-xl">person</span>
                                                </div>
                                                <div>
                                                    <Link 
                                                        to={`/student/${registration.student.id}`} 
                                                        className="text-lg font-bold text-[var(--text-primary)] hover:text-primary transition" 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                    >
                                                        {registration.student.full_name}
                                                    </Link>
                                                    <p className="text-xs text-[var(--text-muted)]">
                                                        <span className="font-semibold text-primary">{matchingSkills}</span> van {task.skills?.length || 0} skills match
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Motivation */}
                                    <div className="p-5 space-y-4">
                                        <div>
                                            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Motivatie</span>
                                            <div className="text-[var(--text-secondary)] text-sm bg-[var(--gray-200)]/50 p-4 rounded-xl">
                                                <RichTextViewer text={registration.reason} />
                                            </div>
                                        </div>

                                        {/* Skills */}
                                        <div>
                                            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">Skills</span>
                                            <div className="flex flex-wrap gap-2">
                                                {registration.student.skills.map((skill) => {
                                                    const skillId = skill.skillId ?? skill.id;
                                                    const matchesTask = taskSkillIds.has(skillId);
                                                    return (
                                                        <SkillBadge
                                                            key={skillId}
                                                            skillName={skill.name}
                                                            isPending={skill.isPending ?? skill.is_pending}
                                                            isOwn={matchesTask}
                                                        >
                                                            {matchesTask && (
                                                                <span className="material-symbols-outlined text-xs mr-1">check</span>
                                                            )}
                                                        </SkillBadge>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <Alert text={registrationErrors.find((errorObj) => errorObj.userId === registration.student.id)?.error} />
                                        
                                        {/* Response form */}
                                        <form onSubmit={handleRegistrationResponse} className="pt-2 border-t border-[var(--neu-border)]">
                                            <FormInput label="Reactie (optioneel)" max={400} min={0} type="textarea" name="response" rows={2} placeholder="Voeg een persoonlijke boodschap toe..." />
                                            <input type="hidden" name="userId" value={registration.student.id} />
                                            <div className="flex gap-3 mt-4">
                                                <button 
                                                    type="submit" 
                                                    value={true} 
                                                    disabled={isFull} 
                                                    className={`flex-1 rounded-xl py-3 font-bold transition-all ${
                                                        isFull 
                                                            ? "bg-[var(--gray-200)] text-[var(--text-muted)] cursor-not-allowed" 
                                                            : "bg-emerald-500 text-white hover:bg-emerald-600 hover:-translate-y-0.5"
                                                    }`}
                                                    style={!isFull ? { boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' } : {}}
                                                >
                                                    <span className="flex items-center justify-center gap-2">
                                                        <span className="material-symbols-outlined">check</span>
                                                        Accepteren
                                                    </span>
                                                </button>
                                                <button 
                                                    type="submit" 
                                                    value={false} 
                                                    className="flex-1 rounded-xl py-3 font-bold bg-red-500 text-white hover:bg-red-600 hover:-translate-y-0.5 transition-all"
                                                    style={{ boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}
                                                >
                                                    <span className="flex items-center justify-center gap-2">
                                                        <span className="material-symbols-outlined">close</span>
                                                        Weigeren
                                                    </span>
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Footer */}
                    <div className="flex justify-center pt-4 mt-4 border-t border-[var(--neu-border)]">
                        <button 
                            className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                            onClick={() => setIsRegistrationsModalOpen(false)}
                        >
                            Sluiten
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
