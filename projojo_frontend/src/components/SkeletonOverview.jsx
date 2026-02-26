/**
 * Skeleton placeholder for the OverviewPage business-with-projects layout.
 * Mimics the DashboardsOverview component structure.
 * Respects prefers-reduced-motion for accessibility.
 */
export default function SkeletonOverview({ count = 3 }) {
    const pulseClass = "motion-safe:animate-pulse bg-[var(--bg-pressed)] rounded";

    return (
        <div className="space-y-8" role="status" aria-label="Projecten laden">
            <span className="sr-only">Laden...</span>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="neu-flat p-5" aria-hidden="true">
                    {/* Business header */}
                    <div className="flex items-start gap-4 mb-4">
                        <div className={`${pulseClass} w-14 h-14 rounded-xl shrink-0`} />
                        <div className="flex-1 space-y-2">
                            <div className={`${pulseClass} h-3 w-20`} />
                            <div className={`${pulseClass} h-6 w-48`} />
                            <div className={`${pulseClass} h-4 w-32`} />
                        </div>
                    </div>
                    {/* Sector + website chips */}
                    <div className="flex gap-2 mb-4">
                        <div className={`${pulseClass} h-8 w-28 rounded-full`} />
                        <div className={`${pulseClass} h-8 w-24 rounded-full`} />
                        <div className={`${pulseClass} h-8 w-36 rounded-xl`} />
                    </div>
                    {/* Skills */}
                    <div className="flex gap-2 mb-4">
                        <div className={`${pulseClass} h-6 w-24 rounded-full`} />
                        <div className={`${pulseClass} h-6 w-20 rounded-full`} />
                        <div className={`${pulseClass} h-6 w-28 rounded-full`} />
                    </div>
                    {/* Project cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        {Array.from({ length: 2 }).map((_, j) => (
                            <div key={j} className="neu-pressed p-0 overflow-hidden rounded-xl">
                                <div className={`${pulseClass} h-36 rounded-none`} />
                                <div className="p-3 space-y-2">
                                    <div className={`${pulseClass} h-4 w-3/4`} />
                                    <div className={`${pulseClass} h-3 w-1/2`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
