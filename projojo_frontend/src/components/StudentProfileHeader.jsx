import { Link } from "react-router-dom";
import { IMAGE_BASE_URL } from "../services";
import { useAuth } from "../auth/AuthProvider";

export default function StudentProfileHeader({ student }) {
    const { authData } = useAuth();
    const isOwnProfile = authData.type === "student" && authData.userId === student.id;

    // Calculate profile completeness
    const calculateCompleteness = () => {
        let score = 0;
        if (student?.image_path) score += 25;
        if (student?.full_name) score += 25;
        if (student?.Skills?.length >= 3) score += 25;
        if (student?.cv_path) score += 25;
        return score;
    };

    const completeness = calculateCompleteness();

    // Get top 5 skills for display
    const topSkills = student?.Skills?.slice(0, 5) || [];

    return (
        <div className="neu-flat p-8 rounded-[2rem] relative group sticky top-24">
            {/* Edit button - top right */}
            {isOwnProfile && (
                <Link 
                    to="/student/update" 
                    className="absolute top-5 right-5 neu-btn !p-2.5 !rounded-xl text-gray-400 hover:text-primary"
                    aria-label="Profiel bewerken"
                >
                    <span className="material-symbols-outlined text-lg">edit</span>
                </Link>
            )}
            
            <div className="flex flex-col items-center">
                {/* Avatar with glow effect - clickable for own profile */}
                <div className="relative mb-5">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {isOwnProfile ? (
                        <Link 
                            to="/student/update" 
                            className="relative block group/avatar"
                            aria-label="Profielfoto wijzigen"
                        >
                            <img 
                                src={student?.image_path ? `${IMAGE_BASE_URL}${student?.image_path}` : "/loading.gif"} 
                                alt={student?.full_name || "Profielfoto"} 
                                className="w-28 h-28 rounded-full neu-flat p-2 object-cover relative z-10 transition-all group-hover/avatar:brightness-75"
                            />
                            {/* Hover overlay with camera icon */}
                            <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                <div className="bg-black/50 rounded-full p-3">
                                    <span className="material-symbols-outlined text-white text-2xl">photo_camera</span>
                                </div>
                            </div>
                        </Link>
                    ) : (
                        <img 
                            src={student?.image_path ? `${IMAGE_BASE_URL}${student?.image_path}` : "/loading.gif"} 
                            alt={student?.full_name || "Profielfoto"} 
                            className="w-28 h-28 rounded-full neu-flat p-2 object-cover relative z-10"
                        />
                    )}
                    {/* Online indicator */}
                    <div className="absolute bottom-2 right-2 w-4 h-4 bg-green-400 rounded-full border-2 border-neu-bg z-20"></div>
                </div>

                {/* Name */}
                <h3 className="text-2xl font-extrabold text-gray-800 text-center">
                    {student?.full_name || 'Laden...'}
                </h3>
                
                {/* Bio - strip HTML/markdown for clean display */}
                {student?.description && (
                    <p className="text-sm text-gray-500 mt-3 text-center leading-relaxed max-w-[280px]">
                        {(() => {
                            const cleanText = student.description
                                .replace(/<[^>]*>/g, '')  // Strip HTML tags
                                .replace(/\*\*([^*]+)\*\*/g, '$1') // Strip bold markdown **text**
                                .replace(/\*([^*]+)\*/g, '$1')     // Strip italic markdown *text*
                                .replace(/__([^_]+)__/g, '$1')     // Strip bold markdown __text__
                                .replace(/_([^_]+)_/g, '$1')       // Strip italic markdown _text_
                                .replace(/~~([^~]+)~~/g, '$1')     // Strip strikethrough
                                .replace(/\n/g, ' ')               // Replace newlines with spaces
                                .trim();
                            return cleanText.length > 120 
                                ? cleanText.substring(0, 120) + '...' 
                                : cleanText;
                        })()}
                    </p>
                )}
                
                {/* Skill Pills - coral/primary colored */}
                {topSkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center mt-6 mb-6">
                        {topSkills.map(skill => (
                            <span 
                                key={skill.skillId || skill.id} 
                                className={`px-3 py-1.5 text-xs font-bold rounded-xl ${
                                    skill.is_pending 
                                        ? 'text-primary bg-primary/5 border-2 border-dashed border-primary/40' 
                                        : 'text-white bg-primary/90'
                                }`}
                            >
                                {skill.name}
                            </span>
                        ))}
                        {student?.Skills?.length > 5 && (
                            <span className="px-3 py-1.5 text-xs font-bold text-primary bg-primary/10 rounded-xl">
                                +{student.Skills.length - 5}
                            </span>
                        )}
                    </div>
                )}

                {/* Profile Completeness Progress Bar */}
                <div className="w-full mt-4">
                    <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="text-gray-400">Profiel compleetheid</span>
                        <span className="text-primary">{completeness}%</span>
                    </div>
                    <div className="w-full h-4 neu-pressed rounded-full overflow-hidden p-[2px]">
                        <div 
                            className="h-full bg-primary rounded-full shadow-sm relative overflow-hidden transition-all duration-500"
                            style={{ width: `${completeness}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                    
                    {/* Completeness tips - actionable links */}
                    {completeness < 100 && isOwnProfile && (
                        <div className="mt-5 space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Maak je profiel compleet:</p>
                            <div className="space-y-2">
                                {!student?.image_path && (
                                    <Link 
                                        to="/student/update" 
                                        className="flex items-center gap-2 text-xs text-gray-500 hover:text-primary transition-colors group/tip"
                                    >
                                        <span className="material-symbols-outlined text-sm text-amber-500 group-hover/tip:text-primary">add_a_photo</span>
                                        <span>Voeg een profielfoto toe</span>
                                        <span className="material-symbols-outlined text-sm opacity-0 group-hover/tip:opacity-100 transition-opacity">arrow_forward</span>
                                    </Link>
                                )}
                                {(!student?.Skills || student.Skills.length < 3) && (
                                    <button 
                                        onClick={() => document.querySelector('[data-skills-section]')?.scrollIntoView({ behavior: 'smooth' })}
                                        className="flex items-center gap-2 text-xs text-gray-500 hover:text-primary transition-colors group/tip w-full text-left"
                                    >
                                        <span className="material-symbols-outlined text-sm text-amber-500 group-hover/tip:text-primary">psychology</span>
                                        <span>Voeg minimaal 3 skills toe ({student?.Skills?.length || 0}/3)</span>
                                        <span className="material-symbols-outlined text-sm opacity-0 group-hover/tip:opacity-100 transition-opacity">arrow_downward</span>
                                    </button>
                                )}
                                {!student?.cv_path && (
                                    <Link 
                                        to="/student/update" 
                                        className="flex items-center gap-2 text-xs text-gray-500 hover:text-primary transition-colors group/tip"
                                    >
                                        <span className="material-symbols-outlined text-sm text-amber-500 group-hover/tip:text-primary">description</span>
                                        <span>Upload je CV</span>
                                        <span className="material-symbols-outlined text-sm opacity-0 group-hover/tip:opacity-100 transition-opacity">arrow_forward</span>
                                    </Link>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
