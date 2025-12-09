import BusinessCard from './BusinessCard';
import ProjectDashboard from './ProjectDashboard';

export default function BusinessProjectDashboard({ business, projects, topSkills, showDescription = false, showUpdateButton = false, isAlwaysExtended = false }) {
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
            />
            {projects?.length > 0 && <ProjectDashboard projects={projects} isAlwaysExtended={isAlwaysExtended} />}
        </div>
    );
}
