import BusinessCard from './BusinessCard';
import ProjectDashboard from './ProjectDashboard';

export default function BusinessProjectDashboard({ business, projects, topSkills, showDescription = false, showUpdateButton = false, showViewButton = false, isAlwaysExtended = false }) {
    return (
        <div className="bg-slate-100 rounded-lg overflow-hidden">
            <BusinessCard
                name={business?.name}
                image={business?.image_path}
                location={business?.location}
                showUpdateButton={showUpdateButton}
                showViewButton={showViewButton}
                businessId={business?.id}
                showDescription={showDescription}
                description={business?.description}
                topSkills={topSkills}
            />
            {projects?.length > 0 && <ProjectDashboard projects={projects} isAlwaysExtended={isAlwaysExtended} />}
        </div>
    );
}
