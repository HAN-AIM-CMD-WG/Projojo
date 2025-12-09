import { useState } from 'react';
import ProjectCard from './ProjectCard';

export default function ProjectDashboard({ projects, isAlwaysExtended = false }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const shownProjects = (isExpanded || isAlwaysExtended) ? projects : projects?.slice(0, 3);

    return (
        <div className="container mx-auto py-4 max-w-7xl">
            <div className="flex flex-col items-center">
                <div className={`flex flex-wrap justify-center gap-6 p-4 pb-8 w-full`}>
                    {projects?.length === 0 && (
                        <p className="text-text-muted">Dit bedrijf heeft nog geen openstaande projecten</p>
                    )}
                    {shownProjects?.map((project, projectIndex) => (
                        <div key={project.projectId} className="w-[350px]">
                            <ProjectCard project={project} index={projectIndex} isExpanded={isExpanded} />
                        </div>
                    ))}
                </div>

                {!isAlwaysExtended && projects?.length > 1 && (
                    <button className={`neu-btn-primary ${projects?.length == 3 ? 'block [@media(min-width:1195px)]:hidden' : projects?.length == 2 && 'block [@media(min-width:813px)]:hidden'}`} onClick={() => setIsExpanded(!isExpanded)}>{isExpanded ? 'Bekijk minder' : 'Bekijk meer'}</button>
                )}
            </div>
        </div>
    );
}


