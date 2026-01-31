import BusinessCard from './BusinessCard';
import ProjectDashboard from './ProjectDashboard';

export default function BusinessProjectDashboard({ business, projects, topSkills, showDescription = false, showUpdateButton = false, isAlwaysExtended = false }) {
    
    // Handle skill click - scroll to and highlight all projects with matching skill
    const handleSkillClick = (skillId) => {
        if (!projects) return;
        
        // Find ALL projects that have tasks with this skill
        const projectsWithSkill = projects.filter(project => 
            project.tasks?.some(task => 
                task.skills?.some(s => (s.skillId ?? s.id) === skillId)
            )
        );
        
        if (projectsWithSkill.length > 0) {
            // Scroll to first matching project
            const firstElement = document.getElementById(`project-${projectsWithSkill[0].id}`);
            firstElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Highlight ALL matching projects
            projectsWithSkill.forEach(project => {
                const projectElement = document.getElementById(`project-${project.id}`);
                if (projectElement) {
                    projectElement.classList.add('animate-highlight');
                    setTimeout(() => {
                        projectElement.classList.remove('animate-highlight');
                    }, 1500);
                }
            });
        }
    };
    
    return (
        <div className="neu-flat overflow-hidden">
            <BusinessCard
                name={business?.name}
                image={business?.image_path}
                location={business?.location}
                sector={business?.sector}
                companySize={business?.company_size}
                website={business?.website}
                showUpdateButton={showUpdateButton}
                businessId={business?.id}
                showDescription={showDescription}
                description={business?.description}
                topSkills={topSkills}
                onSkillClick={handleSkillClick}
            />
            {projects?.length > 0 && <ProjectDashboard projects={projects} isAlwaysExtended={isAlwaysExtended} />}
        </div>
    );
}
