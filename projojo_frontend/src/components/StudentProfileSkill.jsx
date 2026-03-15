import { useState } from 'react';
import { updateStudentSkillDescription } from "../services";
import Alert from "./Alert";
import { useAuth } from "../auth/AuthProvider";

export default function StudentProfileSkill({ skill, isOwnProfile }) {
    const [error, setError] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [description, setDescription] = useState(skill.description);
    const { authData } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const dataFormat = {
            ...skill,
            description: description
        };

        updateStudentSkillDescription(authData.userId, dataFormat)
            .then(() => {
                skill.description = description;
                setIsEditing(false);
            })
            .catch((error) => {
                setError(error.message);
            });
    };

    const handleClose = () => {
        setDescription(skill.description);
        setIsEditing(false);
        setError("");
    };

    return (
        <div key={skill.skillId ?? skill.id} className="w-full p-5 rounded-lg bg-white shadow-md border border-gray-300 transition hover:shadow-lg">
            <div className="w-full">
                <div className="flex flex-col min-[400px]:flex-row min-[400px]:justify-between  gap-2">
                    <h2 className="text-lg font-semibold text-gray-800 break-words min-w-0">{skill.name}</h2>
                    {isOwnProfile && !isEditing && (
                        <button className="btn-secondary py-1 px-3 self-start shrink-0" onClick={() => setIsEditing(true)}>Toelichting ✏️</button>
                    )}
                </div>
                {isOwnProfile && isEditing ? (
                    <div className="space-y-3">
                        <Alert text={error} />
                        <textarea
                            value={description || ""}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-2 rounded-lg border border-gray-300 focus:ring-pink-300 focus:border-pink-300"
                            rows="3"
                            placeholder="Beschrijf je ervaring met deze skill" />
                        <div className="flex gap-2 justify-end">
                            <button type="button" className="btn-secondary max-[340px]:px-2" onClick={handleClose}>Annuleren</button>
                            <button className="btn-primary max-[340px]:px-2" onClick={handleSubmit}>Opslaan</button>
                        </div>
                    </div>
                ) : skill.description !== "" && skill.description !== null && (
                    <div className="mt-3">
                        <span className="text-gray-600 w-full text-sm break-words">{skill.description}</span>
                    </div>
                )}
            </div>
        </div>
    );
};
