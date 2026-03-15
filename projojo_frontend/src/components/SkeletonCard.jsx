/**
 * Neumorphic skeleton card placeholder for loading states.
 * Mimics the layout of a business/organization card.
 * Respects prefers-reduced-motion for accessibility.
 * 
 * @param {"business" | "project"} variant - Layout variant
 */
export default function SkeletonCard({ variant = "business" }) {
    const pulseClass = "motion-safe:animate-pulse bg-[var(--bg-pressed)] rounded";

    if (variant === "project") {
        return (
            <div className="neu-flat p-0 overflow-hidden" aria-hidden="true">
                {/* Image placeholder */}
                <div className={`${pulseClass} h-40 rounded-none rounded-t-2xl`} />
                <div className="p-4 space-y-3">
                    {/* Title */}
                    <div className={`${pulseClass} h-5 w-3/4`} />
                    {/* Meta info */}
                    <div className="flex gap-3">
                        <div className={`${pulseClass} h-4 w-28`} />
                        <div className={`${pulseClass} h-4 w-24`} />
                    </div>
                    {/* Skills */}
                    <div className="flex gap-2">
                        <div className={`${pulseClass} h-6 w-20 rounded-full`} />
                        <div className={`${pulseClass} h-6 w-16 rounded-full`} />
                    </div>
                    {/* Description */}
                    <div className="space-y-1.5">
                        <div className={`${pulseClass} h-3 w-full`} />
                        <div className={`${pulseClass} h-3 w-5/6`} />
                    </div>
                </div>
            </div>
        );
    }

    // Default: business card variant
    return (
        <div className="neu-flat p-4" aria-hidden="true">
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className={`${pulseClass} w-12 h-12 rounded-xl shrink-0`} />
                <div className="flex-1 min-w-0 space-y-2">
                    {/* Name */}
                    <div className={`${pulseClass} h-5 w-3/4`} />
                    {/* Location */}
                    <div className={`${pulseClass} h-4 w-1/2`} />
                </div>
            </div>
            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
                <div className={`${pulseClass} h-9 flex-1 rounded-xl`} />
                <div className={`${pulseClass} h-9 w-10 rounded-xl`} />
            </div>
        </div>
    );
}
