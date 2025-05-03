import BusinessProjectDashboard from './BusinessProjectDashboard';

export default function DashboardsOverview({ businesses }) {
    return (
        <div className="flex flex-col gap-16">
            {console.log("businesses", businesses)}
            {businesses.map((businessInformation) => (
                console.log("businessInformation", businessInformation),
                <BusinessProjectDashboard
                    key={businessInformation.id}
                    business={businessInformation}
                    topSkills={businessInformation.topSkills}
                    projects={businessInformation.projects}
                />
            ))}
        </div>
    );
}

