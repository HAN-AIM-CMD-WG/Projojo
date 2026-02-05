import BusinessProjectDashboard from './BusinessProjectDashboard';

export default function BusinessesOverview({ businesses }) {
    return (
        <div className="flex flex-col gap-6">
            {businesses.map((business) => (
                <BusinessProjectDashboard
                    key={business.id}
                    business={business}
                    showUpdateButton={true}
                    showViewButton={true}
                />
            ))}
        </div>
    );
}