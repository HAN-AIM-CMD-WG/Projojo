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
    const studentSkillIds = new Set(studentSkills.map(s => s.id));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState("");
    const [registrationErrors, setRegistrationErrors] = useState([]);
    const [taskSkillsError, setTaskSkillsError] = useState("");
    const [isRegistrationsModalOpen, setIsRegistrationsModalOpen] = useState(false);
    const [registrations, setRegistrations] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [motivation, setMotivation] = useState("");
    const [canSubmit, setCanSubmit] = useState(true);

    const isOwner = authData.type === "supervisor" && authData.businessId === businessId;

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
        <div id={`task-${task.id}`} className="group">
            <div className="target neu-flat p-6 transition-all duration-300 hover:shadow-lg">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main content */}
                    <div className="flex-grow space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="neu-icon-container text-primary shrink-0">
                                <span className="material-symbols-outlined">assignment</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-gray-700 tracking-tight">
                        {task.name}
                    </h2>
                                <span className="neu-label">Taak</span>
                            </div>
                        </div>

                        <div className="text-gray-600 text-sm">
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
                                        <span className="text-gray-400 text-sm">Geen specifieke skills vereist</span>
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
                    <div className="lg:w-64 shrink-0 flex flex-col gap-3">
                        {/* Stats */}
                        <div className="neu-pressed p-4 rounded-xl space-y-3">
                            <div className="flex items-center gap-2">
                                <span className={`material-symbols-outlined ${spotsAvailable > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                                    {spotsAvailable > 0 ? 'check_circle' : 'cancel'}
                                </span>
                                <span className="text-sm font-bold text-gray-700">
                                    {spotsAvailable > 0 ? (
                                        <><span className="text-emerald-600">{spotsAvailable}</span> van {task.total_needed} plekken</>
                                    ) : (
                                        'Taak is vol'
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-amber-500">pending</span>
                                <span className="text-sm text-gray-600">
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
                        <CreateBusinessEmail taskId={task.id} />
                    </>
                    )}
                    </div>
                </div>
            </div>
            {/* Registration modal for students */}
            {!(studentAlreadyRegistered || isFull) && (
                <Modal
                    modalHeader={`Aanmelden voor ${task.name}`}
                    isModalOpen={isModalOpen}
                    setIsModalOpen={setIsModalOpen}
                >
                    <form className="p-5" onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-4">
                            <Alert text={error} />
                            <RichTextEditor
                                label="Motivatiebrief"
                                onSave={setMotivation}
                                setCanSubmit={setCanSubmit}
                            />
                            <div className="flex gap-3 pt-2">
                                <button type="button" className="flex-1 neu-btn" onClick={() => setIsModalOpen(false)}>
                                    Annuleren
                                </button>
                                <button type="submit" className="flex-1 neu-btn-primary">
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="material-symbols-outlined">send</span>
                                        Verzenden
                                    </span>
                                </button>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}

            {/* Registrations modal for owners */}
            {isOwner && (
                <Modal maxWidth={"max-w-2xl"} modalHeader={`Aanmeldingen voor "${task.name}"`} isModalOpen={isRegistrationsModalOpen} setIsModalOpen={setIsRegistrationsModalOpen}>
                    <div className="flex flex-col gap-4 p-5">
                        {registrations.length === 0 && (
                            <p className="text-gray-500 text-center py-4">Er zijn geen open aanmeldingen voor deze taak</p>
                        )}
                        {isFull && (
                            <Alert isCloseable={false} text="Deze taak is vol. Er kunnen geen nieuwe aanmeldingen meer worden geaccepteerd." />
                        )}
                        {registrations.map((registration) => (
                            <div key={registration.student.id} className="neu-pressed p-5 rounded-xl">
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="material-symbols-outlined text-primary text-2xl">person</span>
                                    <Link 
                                        to={`/student/${registration.student.id}`} 
                                        className="text-lg font-bold text-gray-700 hover:text-primary transition" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                    >
                                        {registration.student.full_name}
                                    </Link>
                                </div>
                                <div className="text-gray-600 text-sm mb-3">
                                    <RichTextViewer text={registration.reason} />
                                </div>
                                <div className="mb-4">
                                    <span className="neu-label mb-2 block">Skills</span>
                                    <div className="flex flex-wrap gap-2">
                                    {registration.student.skills.map((skill) => {
                                        const skillId = skill.skillId ?? skill.id;
                                        // Highlight skills that match task requirements
                                        const taskSkillIds = new Set(task.skills?.map(s => s.skillId ?? s.id) || []);
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
                                <form onSubmit={handleRegistrationResponse}>
                                    <FormInput label={`Reden (optioneel)`} max={400} min={0} type="textarea" name={`response`} rows={1} />
                                    <input type="hidden" name="userId" value={registration.student.id} />
                                    <div className="flex gap-3 mt-4">
                                        <button 
                                            type="submit" 
                                            value={true} 
                                            disabled={isFull} 
                                            className={`flex-1 neu-btn ${isFull ? "opacity-50" : "!bg-emerald-500 !text-white hover:!bg-emerald-600"}`}
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined">check</span>
                                                Accepteren
                                            </span>
                                        </button>
                                        <button 
                                            type="submit" 
                                            value={false} 
                                            className="flex-1 neu-btn !bg-red-500 !text-white hover:!bg-red-600"
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="material-symbols-outlined">close</span>
                                                Weigeren
                                            </span>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center p-5 pt-0">
                        <button className="neu-btn" onClick={() => setIsRegistrationsModalOpen(false)}>Sluiten</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
