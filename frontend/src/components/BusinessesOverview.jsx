import BusinessProjectDashboard from './BusinessProjectDashboard';

export default function BusinessesOverview({ businesses }) {
    return (
        <div className="flex flex-col gap-6">
            {businesses.map((businessInformation) => (
                <BusinessProjectDashboard
                    key={businessInformation.business.businessId}
                    business={businessInformation.business}
                    showUpdateButton={true}
                />
            ))}
        </div>
    );
}