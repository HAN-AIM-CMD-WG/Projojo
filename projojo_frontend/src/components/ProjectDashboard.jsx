import { useState } from 'react';
import ProjectCard from './ProjectCard';

export default function ProjectDashboard({ projects, isAlwaysExtended = false }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const effectivelyExpanded = isExpanded || isAlwaysExtended;
    const shownProjects = effectivelyExpanded ? projects : projects?.slice(0, 3);

    return (
        <div className="container mx-auto py-4 max-w-7xl">
            <div className="flex flex-col items-center">
                {/* Section header */}
                {projects?.length > 0 && (
                    <div className="w-full px-4 pb-2">
                        <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">folder_open</span>
                            Projecten ({projects.length})
                        </h3>
                    </div>
                )}
                <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-4 pb-8 w-full`}>
                    {projects?.length === 0 && (
                        <p className="text-text-muted col-span-full text-center">Dit bedrijf heeft nog geen openstaande projecten</p>
                    )}
                    {shownProjects?.map((project, projectIndex) => (
                        <div key={project.projectId} className="w-full">
                            <ProjectCard project={project} index={projectIndex} />
                        </div>
                    ))}
                </div>

                {!isAlwaysExtended && projects?.length > 3 && (
                    <button className="neu-btn-primary" onClick={() => setIsExpanded(!isExpanded)}>
                        {isExpanded ? 'Bekijk minder' : 'Bekijk meer'}
                    </button>
                )}
            </div>
        </div>
    );
}


