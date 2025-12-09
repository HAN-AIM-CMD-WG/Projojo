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
        <div className="neu-flat p-5 rounded-xl transition-all hover:-translate-y-0.5 group">
            <div className="w-full">
                {/* Skill header */}
                <div className="flex flex-col min-[400px]:flex-row min-[400px]:justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${
                            skill.is_pending 
                                ? 'neu-pressed' 
                                : 'bg-primary/10'
                        }`}>
                            <span className={`material-symbols-outlined text-lg ${
                                skill.is_pending ? 'text-amber-500' : 'text-primary'
                            }`}>
                                {skill.is_pending ? 'hourglass_top' : 'verified'}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-800 group-hover:text-primary transition-colors">
                                {skill.name}
                            </h2>
                            {skill.is_pending ? (
                                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">
                                    In afwachting van goedkeuring
                                </span>
                            ) : (
                                <span className="text-[10px] font-bold text-primary/60 uppercase tracking-wide">
                                    Goedgekeurd
                                </span>
                            )}
                        </div>
                    </div>
                    {isOwnProfile && !isEditing && (
                        <button 
                            className="neu-btn !py-1.5 !px-3 text-xs self-start flex items-center gap-1"
                            onClick={() => setIsEditing(true)}
                        >
                            <span className="material-symbols-outlined text-sm">edit_note</span>
                            <span className="font-bold">Toelichting</span>
                        </button>
                    )}
                </div>

                {/* Edit form */}
                {isOwnProfile && isEditing ? (
                    <div className="space-y-3 mt-4">
                        <Alert text={error} />
                        <textarea
                            value={description || ""}
                            onChange={(e) => setDescription(e.target.value)}
                            className="neu-input w-full min-h-[80px] resize-y"
                            rows="3"
                            placeholder="Beschrijf je ervaring met deze skill..."
                        />
                        <div className="flex gap-2 justify-end">
                            <button 
                                type="button" 
                                className="neu-btn text-sm" 
                                onClick={handleClose}
                            >
                                Annuleren
                            </button>
                            <button 
                                className="neu-btn-primary text-sm" 
                                onClick={handleSubmit}
                            >
                                <span className="flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">save</span>
                                    Opslaan
                                </span>
                            </button>
                        </div>
                    </div>
                ) : skill.description !== "" && skill.description !== null && (
                    <div className="mt-3 ml-11">
                        <p className="text-gray-600 text-sm break-words leading-relaxed">
                            {skill.description}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
