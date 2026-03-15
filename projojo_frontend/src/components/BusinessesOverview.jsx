import BusinessProjectDashboard from './BusinessProjectDashboard';

export default function BusinessesOverview({ businesses, onChanged, isArchived = false, showUpdateButton = true }) {
    return (
        <div className="flex flex-col gap-6">
            {businesses.map((business) => (
                <BusinessProjectDashboard
                    key={business.id}
                    business={business}
                    showUpdateButton={showUpdateButton}
                    isArchived={isArchived}
                    onChanged={onChanged}
                />
            ))}
        </div>
    );
}
