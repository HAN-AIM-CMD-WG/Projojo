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
        const skillNames = skills.map((skill) => skill.name);

        setStudentSkillsError("");

        try {
            await updateStudentSkills(student.email, skillNames);
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
            skillId: skill.id,
            name: skill.name,
            isPending: skill.is_pending,
            description: skill.description,
            createdAt: skill.created_at
        }
    }) || [];
    return (
        <div className="flex flex-col gap-4 w-full rounded-b-lg">
            <div className="flex flex-col gap-3 bg-gray-200 p-3 rounded-lg">
                <div className="flex justify-between items-end">
                    <h2 className="text-lg ms-1 font-semibold">Skills</h2>
                    {isOwnProfile && !isEditing && <button className="btn-primary py-2 px-4" onClick={() => setIsEditing(true)}>Skills aanpassen</button>}
                </div>
                <Alert text={error} />
                <Alert text={studentSkillsError} />
                <div className="flex flex-col gap-4">
                    {student?.skills?.length === 0 && <h2 className="ms-1">Er zijn geen skills om weer te geven</h2>}
                    <SkillsEditor
                        allSkills={allSkills}
                        initialSkills={currentSkills}
                        isEditing={(isEditing && isOwnProfile)}
                        onSave={handleSave}
                        onCancel={() => setIsEditing(false)}
                        setError={setStudentSkillsError}
                        isAbsolute={false}
                    >
                        {student?.Skills?.map(skill => <StudentProfileSkill key={skill.id} skill={skill} isOwnProfile={isOwnProfile} />)}
                    </SkillsEditor>
                </div>
            </div>
        </div>
    )
}
