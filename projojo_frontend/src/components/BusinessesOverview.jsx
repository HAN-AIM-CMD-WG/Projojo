import BusinessProjectDashboard from './BusinessProjectDashboard';

export default function BusinessesOverview({ businesses }) {
    return (
        <div className="flex flex-col gap-6">
            {businesses.map((business) => (
                <BusinessProjectDashboard
                    key={business.businessId}
                    business={business}
                    showUpdateButton={true}
                />
            ))}
        </div>
    );
}