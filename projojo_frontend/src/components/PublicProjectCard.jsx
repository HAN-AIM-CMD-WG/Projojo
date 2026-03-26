import { Link } from "react-router-dom";
import { IMAGE_BASE_URL } from '../services';
import { getCountdownText } from "../utils/dates";

/**
 * PublicProjectCard Component
 * 
 * Compact neumorphic project card for public discovery.
 * Designed for scannability: image + key info + clear CTA.
 * No login required.
 */
export default function PublicProjectCard({ project, index = 0 }) {
    // Animation delay based on index for staggered entrance
    const animationClass = `fade-in-up-${(index % 4) + 1}`;
    
    // Determine project status based on dates
    const getStatus = () => {
        if (!project.end_date) return null;
        const now = new Date();
        const endDate = new Date(project.end_date);
        if (endDate < now) return { label: 'Afgerond', icon: 'check_circle', color: 'text-white bg-white/20 border-white/30' };
        if (project.start_date && new Date(project.start_date) > now) {
            return { label: 'Binnenkort', icon: 'schedule', color: 'text-white bg-white/20 border-white/30' };
        }
        return { label: 'Lopend', icon: 'play_circle', color: 'text-white bg-primary/80 border-primary/60' };
    };
    
    const status = getStatus();

    return (
        <article className={`fade-in-up ${animationClass} h-full`}>
            <Link
                to={`/publiek/${project.id}`}
                className="block neu-flat-interactive h-full overflow-hidden cursor-pointer focus:outline-none focus:ring-3 focus:ring-primary/40 group"
            >
                {/* Image section - clean overlay with title */}
                <div className="h-40 sm:h-44 w-full relative overflow-hidden">
                    <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src={`${IMAGE_BASE_URL}${project.image_path}`}
                        alt={project.name}
                        loading="lazy"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                    
                    {/* Status badge - top right */}
                    {status && (
                        <div className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border backdrop-blur-sm ${status.color}`}>
                            <span className="material-symbols-outlined text-[11px]" aria-hidden="true">{status.icon}</span>
                            {status.label}
                        </div>
                    )}
                    
                    {/* Theme badge - top left (max 1 for clean look) */}
                    {project.themes && project.themes.length > 0 && (
                        <div className="absolute top-2.5 left-2.5">
                            <span 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white backdrop-blur-sm"
                                style={{ backgroundColor: project.themes[0].color ? `${project.themes[0].color}CC` : 'rgba(0,0,0,0.45)' }}
                            >
                                {project.themes[0].icon && (
                                    <span className="material-symbols-outlined text-[10px]" aria-hidden="true">{project.themes[0].icon}</span>
                                )}
                                {project.themes[0].name}
                                {project.themes.length > 1 && (
                                    <span className="opacity-70">+{project.themes.length - 1}</span>
                                )}
                            </span>
                        </div>
                    )}

                    {/* Title on image */}
                    <div className="absolute bottom-0 left-0 right-0 p-3.5">
                        <h4 className="font-extrabold text-white text-base leading-snug drop-shadow-md line-clamp-2">
                            {project.name}
                        </h4>
                    </div>
                </div>
                
                {/* Content section - compact */}
                <div className="p-4 flex flex-col flex-1 gap-3">
                    {/* Organization + Location */}
                    {project.business && (
                        <div className="flex items-center justify-between text-xs">
                            <span className="inline-flex items-center gap-1.5 text-[var(--text-secondary)] font-semibold truncate">
                                <span className="material-symbols-outlined text-xs text-[var(--text-muted)]" aria-hidden="true">business</span>
                                {project.business.name}
                            </span>
                            {project.business.location && (
                                <span className="inline-flex items-center gap-0.5 text-[var(--text-muted)] shrink-0 ml-2">
                                    <span className="material-symbols-outlined text-[11px]" aria-hidden="true">location_on</span>
                                    {project.business.location}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Key metrics row - positions + deadline */}
                    <div className="flex items-center gap-3 text-xs">
                        <span className={`inline-flex items-center gap-1 font-bold ${project.open_positions > 0 ? 'text-primary' : 'text-[var(--text-muted)]'}`}>
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">
                                {project.open_positions > 0 ? 'work' : 'check_circle'}
                            </span>
                            {project.open_positions > 0
                                ? `${project.open_positions} ${project.open_positions === 1 ? 'plek' : 'plekken'}`
                                : 'Vol'}
                        </span>
                        {project.end_date && getCountdownText(project.end_date) && (
                            <span className="inline-flex items-center gap-0.5 text-[var(--text-muted)]">
                                <span className="material-symbols-outlined text-[11px]" aria-hidden="true">schedule</span>
                                {getCountdownText(project.end_date)}
                            </span>
                        )}
                    </div>

                    {/* Skills - compact pills (no label) */}
                    {project.skills && project.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {project.skills.slice(0, 3).map(skill => (
                                <span 
                                    key={skill} 
                                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--gray-200)] text-[var(--text-secondary)]"
                                >
                                    {skill}
                                </span>
                            ))}
                            {project.skills.length > 3 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--gray-200)] text-[var(--text-muted)]">
                                    +{project.skills.length - 3}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Footer with arrow indicator */}
                    <div className="mt-auto pt-2.5 border-t border-[var(--neu-border)] flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider group-hover:text-primary transition-colors">
                            Bekijk project
                        </span>
                        <span className="material-symbols-outlined text-lg text-[var(--text-muted)] group-hover:text-primary group-hover:translate-x-1 transition-all" aria-hidden="true">
                            arrow_forward
                        </span>
                    </div>
                </div>
            </Link>
        </article>
    );
}
