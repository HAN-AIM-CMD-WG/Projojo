import { Link } from "react-router-dom";

/**
 * PortfolioItem - Displays a single portfolio item (completed task)
 * 
 * Handles both live items (from existing projects) and snapshot items
 * (preserved after project deletion).
 * 
 * @param {Object} props
 * @param {Object} props.item - The portfolio item data
 * @param {boolean} props.expanded - Whether to show expanded details
 * @param {Function} props.onToggleExpand - Callback to toggle expanded state
 */
export default function PortfolioItem({ item, expanded = false, onToggleExpand }) {
    const isLive = item.source_type === "live";
    const isArchived = item.is_archived;
    const isSnapshot = item.source_type === "snapshot";
    const registrationStatus = item.registration_status || null;
    const pendingRequest = item.pending_request || null;
    const isAfgerond = registrationStatus === "afgerond";
    const isAfgebroken = registrationStatus === "afgebroken";
    const isInBeoordeling = !!pendingRequest;

    // Parse timeline
    const timeline = item.timeline || {};
    const completedAt = timeline.completed_at 
        ? new Date(timeline.completed_at).toLocaleDateString('nl-NL', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
        })
        : null;

    // Calculate duration if we have start and end dates
    const getDuration = () => {
        const start = timeline.accepted_at || timeline.requested_at;
        const end = timeline.completed_at;
        if (!start || !end) return null;

        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 7) return `${diffDays} dagen`;
        if (diffDays < 30) return `${Math.round(diffDays / 7)} weken`;
        return `${Math.round(diffDays / 30)} maanden`;
    };

    const duration = getDuration();

    return (
        <div className={`neu-flat rounded-2xl overflow-hidden transition-all ${
            expanded ? 'ring-2 ring-primary/30' : ''
        }`}>
            {/* Header */}
            <div 
                className="p-4 cursor-pointer hover:bg-[var(--gray-100)]/30 transition-colors"
                onClick={onToggleExpand}
            >
                <div className="flex items-start gap-4">
                    {/* Business icon/avatar */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-primary text-xl">
                            business
                        </span>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-[var(--text-primary)] truncate">
                                {item.task_name}
                            </h3>
                            
                            {/* Status badges - consensus system */}
                            {isAfgerond && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-700 dark:text-green-400">
                                    <span className="material-symbols-outlined text-xs">check_circle</span>
                                    Afgerond
                                </span>
                            )}
                            {isAfgebroken && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-600 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-xs">cancel</span>
                                    Afgebroken
                                </span>
                            )}
                            {isInBeoordeling && !isAfgerond && !isAfgebroken && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400">
                                    <span className="material-symbols-outlined text-xs">hourglass_top</span>
                                    In beoordeling
                                </span>
                            )}
                            {!registrationStatus && !pendingRequest && isArchived && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-600 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-xs">inventory_2</span>
                                    Gearchiveerd
                                </span>
                            )}
                            {isSnapshot && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-600 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-xs">photo_library</span>
                                    Portfolio archief
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-sm text-[var(--text-muted)]">
                            <span className="material-symbols-outlined text-base">apartment</span>
                            <span className="truncate">
                                {item.business_name}
                                {isArchived && <span className="opacity-60"> (niet actief)</span>}
                            </span>
                        </div>

                        {/* Skills */}
                        {item.skills && item.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {item.skills.slice(0, expanded ? undefined : 3).map((skill, idx) => (
                                    <span 
                                        key={idx}
                                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                                    >
                                        {skill}
                                    </span>
                                ))}
                                {!expanded && item.skills.length > 3 && (
                                    <span className="text-xs text-[var(--text-muted)]">
                                        +{item.skills.length - 3} meer
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right side info */}
                    <div className="text-right shrink-0">
                        {completedAt && (
                            <div className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
                                <span className="material-symbols-outlined text-base text-green-500">check_circle</span>
                                {completedAt}
                            </div>
                        )}
                        {duration && (
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                                {duration}
                            </p>
                        )}
                        <button 
                            className="mt-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                            aria-label={expanded ? "Inklappen" : "Uitklappen"}
                        >
                            <span className={`material-symbols-outlined transition-transform ${expanded ? 'rotate-180' : ''}`}>
                                expand_more
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Expanded content */}
            {expanded && (
                <div className="px-4 pb-4 border-t border-[var(--neu-border)]">
                    <div className="pt-4 space-y-4">
                        {/* Project info */}
                        <div>
                            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
                                Project
                            </h4>
                            <div className="neu-pressed rounded-xl p-3">
                                <p className="font-medium text-[var(--text-primary)]">
                                    {item.project_name}
                                </p>
                                {item.project_description && (
                                    <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-3">
                                        {item.project_description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Business info */}
                        <div>
                            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
                                Organisatie
                            </h4>
                            <div className="neu-pressed rounded-xl p-3">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-[var(--text-primary)]">
                                            {item.business_name}
                                        </p>
                                        {item.business_location && (
                                            <p className="text-sm text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                                                <span className="material-symbols-outlined text-sm">location_on</span>
                                                {item.business_location}
                                            </p>
                                        )}
                                    </div>
                                    {isLive && item.source_project_id && !isArchived && (
                                        <Link
                                            to={`/projects/${item.source_project_id}`}
                                            className="neu-btn text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 hover:text-primary transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                                            Bekijk
                                        </Link>
                                    )}
                                </div>
                                {item.business_description && (
                                    <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2">
                                        {item.business_description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Task description */}
                        {item.task_description && (
                            <div>
                                <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
                                    Taak beschrijving
                                </h4>
                                <div className="neu-pressed rounded-xl p-3">
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        {item.task_description}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Timeline */}
                        <div>
                            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
                                Tijdlijn
                            </h4>
                            <div className="neu-pressed rounded-xl p-3">
                                <div className="space-y-2">
                                    {timeline.requested_at && (
                                        <TimelineStep 
                                            icon="send" 
                                            label="Aangevraagd" 
                                            date={timeline.requested_at}
                                            isComplete
                                        />
                                    )}
                                    {timeline.accepted_at && (
                                        <TimelineStep 
                                            icon="thumb_up" 
                                            label="Geaccepteerd" 
                                            date={timeline.accepted_at}
                                            isComplete
                                        />
                                    )}
                                    {timeline.started_at && (
                                        <TimelineStep 
                                            icon="play_arrow" 
                                            label="Gestart" 
                                            date={timeline.started_at}
                                            isComplete
                                        />
                                    )}
                                    {timeline.completed_at && (
                                        <TimelineStep 
                                            icon="check_circle" 
                                            label="Voltooid" 
                                            date={timeline.completed_at}
                                            isComplete
                                            isLast
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * TimelineStep - A single step in the timeline visualization
 */
function TimelineStep({ icon, label, date, isComplete, isLast = false }) {
    const formattedDate = date 
        ? new Date(date).toLocaleDateString('nl-NL', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
        : null;

    return (
        <div className="flex items-start gap-3">
            <div className="relative">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isComplete 
                        ? 'bg-green-500 text-white' 
                        : 'bg-[var(--gray-200)] text-[var(--text-muted)]'
                }`}>
                    <span className="material-symbols-outlined text-sm">{icon}</span>
                </div>
                {!isLast && (
                    <div className={`absolute top-6 left-1/2 -translate-x-1/2 w-0.5 h-4 ${
                        isComplete ? 'bg-green-500' : 'bg-[var(--gray-200)]'
                    }`} />
                )}
            </div>
            <div className="flex-1 pb-2">
                <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
                {formattedDate && (
                    <p className="text-xs text-[var(--text-muted)]">{formattedDate}</p>
                )}
            </div>
        </div>
    );
}
