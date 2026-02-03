import { Link } from "react-router-dom";
import { IMAGE_BASE_URL } from '../services';
import RichTextViewer from "./RichTextViewer";
import { getCountdownText, formatDateShort } from "../utils/dates";

/**
 * PublicProjectCard Component
 * 
 * A simplified project card for public discovery - no login required.
 * Shows project info without interactive features like registration.
 */
export default function PublicProjectCard({ project, index = 0 }) {
    // Animation delay based on index for staggered entrance
    const animationClass = `fade-in-up-${(index % 4) + 1}`;
    
    // Determine project status based on dates
    const getStatus = () => {
        if (!project.end_date) return null;
        const now = new Date();
        const endDate = new Date(project.end_date);
        if (endDate < now) return { label: 'Afgerond', className: 'bg-blue-500 text-white' };
        if (project.start_date && new Date(project.start_date) > now) {
            return { label: 'Binnenkort', className: 'bg-gray-500 text-white' };
        }
        return { label: 'Lopend', className: 'bg-emerald-500 text-white' };
    };
    
    const status = getStatus();

    return (
        <article className={`fade-in-up ${animationClass} h-full`}>
            <Link
                to={`/publiek/${project.id}`}
                className="block neu-flat-interactive h-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/30 group"
            >
                {/* Image section with gradient overlay */}
                <div className="h-40 w-full relative overflow-hidden">
                    <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src={`${IMAGE_BASE_URL}${project.image_path}`}
                        alt={project.name}
                    />
                    {/* Gradient overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    
                    {/* Status badge */}
                    {status && (
                        <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${status.className}`}>
                            {status.label}
                        </div>
                    )}
                    
                    {/* Theme badges */}
                    {project.themes && project.themes.length > 0 && (
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                            {project.themes.slice(0, 2).map(theme => (
                                <span 
                                    key={theme.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-black/40 backdrop-blur-sm"
                                    style={theme.color ? { backgroundColor: `${theme.color}CC` } : {}}
                                >
                                    {theme.icon && (
                                        <span className="material-symbols-outlined text-[10px]">{theme.icon}</span>
                                    )}
                                    {theme.name}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Title overlay at bottom of image */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h4 className="font-extrabold text-white text-lg leading-tight drop-shadow-md line-clamp-2">
                            {project.name}
                        </h4>
                    </div>
                </div>
                
                {/* Content section */}
                <div className="p-5">
                    {/* Organization info */}
                    {project.business && (
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-sm text-[var(--text-muted)]">business</span>
                            <span className="text-sm font-medium text-[var(--text-secondary)] truncate">
                                {project.business.name}
                            </span>
                            {project.business.location && (
                                <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                    <span className="material-symbols-outlined text-xs">location_on</span>
                                    {project.business.location}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Open positions */}
                    <div className="mb-4">
                        <div className="flex items-center gap-2">
                            <span className={`material-symbols-outlined text-lg w-[18px] text-center ${project.open_positions > 0 ? 'text-primary' : 'text-[var(--text-muted)]'}`}>
                                {project.open_positions > 0 ? 'work' : 'check_circle'}
                            </span>
                            <span className="text-sm font-bold text-[var(--text-primary)]">
                                {project.open_positions > 0 ? (
                                    <>{project.open_positions} {project.open_positions === 1 ? 'plek' : 'plekken'} beschikbaar</>
                                ) : (
                                    'Project vol'
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Deadline countdown */}
                    {project.end_date && getCountdownText(project.end_date) && (
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-4">
                            <span className="material-symbols-outlined text-sm">schedule</span>
                            <span>{getCountdownText(project.end_date)} • deadline {formatDateShort(project.end_date)}</span>
                        </div>
                    )}

                    {/* Skills */}
                    {project.skills && project.skills.length > 0 && (
                        <div className="mb-4">
                            <span className="neu-label mb-2 block">Gevraagde skills</span>
                            <div className="flex flex-wrap gap-1.5">
                                {project.skills.slice(0, 4).map(skill => (
                                    <span 
                                        key={skill} 
                                        className="inline-flex items-center px-2.5 py-1.5 rounded-full text-[10px] font-semibold text-[var(--text-muted)] border border-[var(--gray-300)] bg-[var(--neu-bg)]/50"
                                    >
                                        {skill}
                                    </span>
                                ))}
                                {project.skills.length > 4 && (
                                    <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-[10px] font-semibold text-[var(--text-muted)] border border-[var(--gray-300)] bg-[var(--neu-bg)]/50">
                                        +{project.skills.length - 4}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Description - brief */}
                    <div className="line-clamp-2 text-sm text-text-muted mb-4">
                        <RichTextViewer text={project.description} flatten={true} />
                    </div>

                    {/* Impact summary for completed projects */}
                    {project.impact_summary && (
                        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 mb-4">
                            <div className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-blue-600 text-sm mt-0.5">emoji_events</span>
                                <div>
                                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">Impact</p>
                                    <p className="text-sm text-blue-800 line-clamp-2">{project.impact_summary}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Call-to-action hint */}
                    <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide group-hover:text-primary transition-colors">
                            Bekijk project
                        </span>
                        <span className="material-symbols-outlined text-[var(--text-muted)] group-hover:text-primary group-hover:translate-x-1 transition-all">
                            arrow_forward
                        </span>
                    </div>
                </div>
            </Link>
        </article>
    );
}
