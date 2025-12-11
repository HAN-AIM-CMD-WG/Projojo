import { useEffect, useState } from "react";
import { getSkills, updateStudentSkills } from "../services";
import Alert from "./Alert";
import { useAuth } from "../auth/AuthProvider";
import SkillsEditor from "./SkillsEditor";
import StudentProfileSkill from "./StudentProfileSkill";

export default function StudentProfileSkills({ student, setFetchAmount }) {
    const [allSkills, setAllSkills] = useState([]);
    const [error, setError] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [studentSkillsError, setStudentSkillsError] = useState("");

    const { authData } = useAuth();
    const isOwnProfile = authData.type === "student" && authData.userId === student.id;

    const handleSave = async (skills) => {
        const skillIds = skills.map((skill) => skill.skillId || skill.id);

        setStudentSkillsError("");

        try {
            await updateStudentSkills(student.id, skillIds);
            setIsEditing(false)
            setFetchAmount((currentAmount) => currentAmount + 1);
        } catch (error) {
            setStudentSkillsError(error.message);
        }
    };

    useEffect(() => {
        let ignore = false;

        getSkills()
            .then(data => {
                if (ignore) return;
                setAllSkills(data);
            })
            .catch(err => {
                if (ignore) return;
                setError(err.message);
            });

        return () => {
            ignore = true;
        }
    }, []);
    // Map student skills to the format expected by SkillsEditor
    const currentSkills = student?.Skills?.map((skill) => {
        return {
            skillId: skill.skillId ?? skill.id,
            name: skill.name,
            isPending: skill.is_pending,
            description: skill.description,
            createdAt: skill.created_at
        }
    }) || [];
    return (
        <div className="neu-flat p-6 rounded-2xl" data-skills-section>
            {/* Section header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-extrabold text-gray-700 flex items-center gap-2 text-lg">
                    <span className="material-symbols-outlined text-primary">psychology</span>
                    Skills
                    {currentSkills.length > 0 && (
                        <span className="text-xs font-bold text-gray-400 bg-gray-200/50 px-2 py-0.5 rounded-full">
                            {currentSkills.length}
                        </span>
                    )}
                </h2>
                {isOwnProfile && !isEditing && (
                    <button 
                        className="neu-btn flex items-center gap-2 text-sm"
                        onClick={() => setIsEditing(true)}
                    >
                        <span className="material-symbols-outlined text-lg">edit</span>
                        <span className="font-bold">Aanpassen</span>
                    </button>
                )}
            </div>

            {/* Alerts */}
            {error && <Alert text={error} />}
            {studentSkillsError && <Alert text={studentSkillsError} />}

            {/* Skills content */}
            <div className="space-y-4">
                {/* Empty state */}
                {(!student?.Skills || student.Skills.length === 0) && !isEditing && (
                    <div className="neu-pressed p-6 rounded-xl text-center">
                        <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">lightbulb</span>
                        <p className="text-sm text-gray-500 font-medium">
                            {isOwnProfile 
                                ? 'Je hebt nog geen skills toegevoegd. Voeg skills toe om betere matches te krijgen!'
                                : 'Deze student heeft nog geen skills toegevoegd.'
                            }
                        </p>
                        {isOwnProfile && (
                            <button 
                                className="neu-btn-primary mt-4"
                                onClick={() => setIsEditing(true)}
                            >
                                <span className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-lg">add</span>
                                    Skills toevoegen
                                </span>
                            </button>
                        )}
                </div>
                )}

                {/* Skills editor / list */}
                    <SkillsEditor
                        allSkills={allSkills}
                        initialSkills={currentSkills}
                        isEditing={(isEditing && isOwnProfile)}
                        onSave={handleSave}
                        onCancel={() => setIsEditing(false)}
                        setError={setStudentSkillsError}
                        isAbsolute={false}
                    isAllowedToAddSkill={true}
                >
                    <div className="space-y-3">
                        {student?.Skills?.map(skill => (
                            <StudentProfileSkill 
                                key={skill.skillId ?? skill.id} 
                                skill={skill} 
                                isOwnProfile={isOwnProfile} 
                            />
                        ))}
                    </div>
                    </SkillsEditor>
            </div>
        </div>
    )
}
