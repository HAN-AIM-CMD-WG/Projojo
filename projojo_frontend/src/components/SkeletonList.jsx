import SkeletonCard from "./SkeletonCard";

/**
 * Grid of skeleton cards for loading states.
 * Matches the grid layout used in TeacherPage and OverviewPage.
 * 
 * @param {number} count - Number of skeleton cards to show
 * @param {"business" | "project"} variant - Card layout variant
 * @param {string} className - Additional grid container classes
 */
export default function SkeletonList({ count = 6, variant = "business", className = "" }) {
    const gridClasses = variant === "project"
        ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
        : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4";

    return (
        <div className={`${gridClasses} ${className}`} role="status" aria-label="Inhoud laden">
            <span className="sr-only">Laden...</span>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} variant={variant} />
            ))}
        </div>
    );
}
