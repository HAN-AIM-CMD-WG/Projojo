import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * PortfolioRoadmap - Gantt-style timeline visualization of portfolio items
 * 
 * Shows tasks as horizontal bars on a timeline, grouped by their work period.
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of portfolio items with timeline data
 * @param {string} props.studentName - Name of the student (optional)
 */
export default function PortfolioRoadmap({ items = [], studentName = "" }) {
    const navigate = useNavigate();
    const [hoveredItem, setHoveredItem] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [timeScale, setTimeScale] = useState("months"); // months, weeks
    const containerRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const hideTimeoutRef = useRef(null);

    // Month width based on scale
    const monthWidth = timeScale === "weeks" ? 160 : 80;

    // Clear any pending hide timeout
    const clearHideTimeout = () => {
        if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current);
            hideTimeoutRef.current = null;
        }
    };

    // Schedule tooltip hide with delay
    const scheduleHide = () => {
        clearHideTimeout();
        hideTimeoutRef.current = setTimeout(() => {
            setHoveredItem(null);
        }, 150); // Small delay to allow moving to tooltip
    };

    // Maximum visible rows before scrolling
    const MAX_VISIBLE_ROWS = 6;
    const ROW_HEIGHT = 52; // h-12 (48px) + mb-1 (4px)

    // Calculate timeline bounds and generate months
    const { months, minDate, maxDate, timelineWidth } = useMemo(() => {
        if (items.length === 0) return { months: [], minDate: null, maxDate: null, timelineWidth: 0 };

        // Find the date range from all items (including task periods)
        let earliest = null;
        let latest = null;
        const now = new Date();

        items.forEach(item => {
            const timeline = item.timeline || {};
            
            // Consider both work period and task period for timeline bounds
            const workStart = timeline.accepted_at || timeline.requested_at || timeline.created_at;
            const workEnd = timeline.completed_at || now;
            const taskStart = item.task_start_date;
            const taskEnd = item.task_end_date;

            // Find earliest date (consider task start if earlier than work start)
            const dates = [workStart, taskStart].filter(Boolean).map(d => new Date(d));
            dates.forEach(date => {
                if (!earliest || date < earliest) earliest = date;
            });

            // Find latest date (consider task end if later than work end)
            const endDates = [workEnd, taskEnd].filter(Boolean).map(d => new Date(d));
            endDates.forEach(date => {
                if (!latest || date > latest) latest = date;
            });
        });

        // Also ensure "today" is visible if it's after all items
        if (now > latest) latest = now;

        // If no dates found, use current month range
        if (!earliest) earliest = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        if (!latest) latest = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Add padding: 1 month before and after, aligned to month start
        const minDate = new Date(earliest.getFullYear(), earliest.getMonth() - 1, 1);
        const maxDate = new Date(latest.getFullYear(), latest.getMonth() + 2, 0); // End of month after

        // Generate month labels with cumulative day positions for accurate alignment
        const months = [];
        const current = new Date(minDate);
        let cumulativeDays = 0;
        const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
        
        while (current <= maxDate) {
            const monthStart = new Date(current);
            const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 1);
            const daysInMonth = Math.min(
                Math.ceil((nextMonth - monthStart) / (1000 * 60 * 60 * 24)),
                Math.ceil((maxDate - monthStart) / (1000 * 60 * 60 * 24)) + 1
            );
            
            months.push({
                date: new Date(current),
                label: current.toLocaleDateString('nl-NL', { month: 'short' }),
                year: current.getFullYear(),
                isYearStart: current.getMonth() === 0,
                startPercent: (cumulativeDays / totalDays) * 100,
                daysInMonth: daysInMonth
            });
            
            cumulativeDays += daysInMonth;
            current.setMonth(current.getMonth() + 1);
        }

        return { months, minDate, maxDate, timelineWidth: months.length * monthWidth };
    }, [items, monthWidth]);

    // Calculate position and width for each item bar using pixel positions
    const itemBars = useMemo(() => {
        if (!minDate || !maxDate || months.length === 0) return [];

        // Calculate pixel position based on month grid
        const getPixelPosition = (date) => {
            const d = new Date(date);
            let pixels = 0;
            
            for (const month of months) {
                const monthStart = month.date;
                const nextMonth = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 1);
                
                if (d < monthStart) {
                    break;
                } else if (d < nextMonth) {
                    // Date is within this month
                    const daysInMonth = (nextMonth - monthStart) / (1000 * 60 * 60 * 24);
                    const dayOfMonth = (d - monthStart) / (1000 * 60 * 60 * 24);
                    pixels += (dayOfMonth / daysInMonth) * monthWidth;
                    break;
                } else {
                    // Date is after this month
                    pixels += monthWidth;
                }
            }
            return pixels;
        };

        return items.map(item => {
            const timeline = item.timeline || {};
            const startStr = timeline.accepted_at || timeline.requested_at || timeline.created_at;
            const endStr = timeline.completed_at;

            if (!startStr) return null;

            // Work period (when student actually worked)
            const workStart = new Date(startStr);
            const workEnd = endStr ? new Date(endStr) : new Date();

            const leftPixels = getPixelPosition(workStart);
            const rightPixels = getPixelPosition(workEnd);
            const widthPixels = Math.max(rightPixels - leftPixels, 120); // Minimum 120px

            // Task period (official task duration) - for background bar
            let taskLeftPixels = null;
            let taskWidthPixels = null;
            let daysEarly = 0;

            if (item.task_start_date && item.task_end_date) {
                const taskStart = new Date(item.task_start_date);
                const taskEnd = new Date(item.task_end_date);
                
                taskLeftPixels = getPixelPosition(taskStart);
                const taskRightPixels = getPixelPosition(taskEnd);
                taskWidthPixels = Math.max(taskRightPixels - taskLeftPixels, 40);

                // Calculate days early (if completed before task end date)
                if (endStr) {
                    const completedDate = new Date(endStr);
                    if (completedDate < taskEnd) {
                        daysEarly = Math.floor((taskEnd - completedDate) / (1000 * 60 * 60 * 24));
                    }
                }
            }

            return {
                ...item,
                leftPixels,
                widthPixels,
                taskLeftPixels,
                taskWidthPixels,
                daysEarly,
                isCompleted: !!timeline.completed_at,
                isActive: !timeline.completed_at && (timeline.accepted_at || timeline.started_at),
            };
        }).filter(Boolean);
    }, [items, minDate, maxDate, months, monthWidth]);

    // Calculate "Today" position on timeline (in pixels)
    const todayPixelPosition = useMemo(() => {
        if (!minDate || !maxDate || months.length === 0) return null;
        const now = new Date();
        // Only show if today is within the timeline range
        if (now < minDate || now > maxDate) return null;
        
        // Calculate pixel position based on month grid
        let pixels = 0;
        for (const month of months) {
            const monthStart = month.date;
            const nextMonth = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 1);
            
            if (now < monthStart) {
                break;
            } else if (now < nextMonth) {
                // Today is within this month
                const daysInMonth = (nextMonth - monthStart) / (1000 * 60 * 60 * 24);
                const dayOfMonth = (now - monthStart) / (1000 * 60 * 60 * 24);
                pixels += (dayOfMonth / daysInMonth) * monthWidth;
                break;
            } else {
                // Today is after this month
                pixels += monthWidth;
            }
        }
        return pixels;
    }, [minDate, maxDate, months, monthWidth]);

    // Auto-scroll to "Today" when component mounts or timeline changes
    useEffect(() => {
        if (scrollContainerRef.current && todayPixelPosition !== null && timelineWidth > 0) {
            const container = scrollContainerRef.current;
            const containerWidth = container.clientWidth;
            // Calculate scroll position to center "today" in view
            const scrollTarget = Math.max(0, todayPixelPosition - containerWidth / 2);
            
            // Smooth scroll to position
            container.scrollTo({
                left: scrollTarget,
                behavior: 'smooth'
            });
        }
    }, [todayPixelPosition, timelineWidth]);

    // Group items by whether they overlap (using pixel positions)
    const itemRows = useMemo(() => {
        const rows = [];
        
        itemBars.forEach(item => {
            // Find a row where this item doesn't overlap
            let placed = false;
            for (const row of rows) {
                const overlaps = row.some(existing => {
                    const existingEnd = existing.leftPixels + existing.widthPixels;
                    const itemEnd = item.leftPixels + item.widthPixels;
                    // Add small gap (8px) between items
                    return !(item.leftPixels >= existingEnd + 8 || itemEnd + 8 <= existing.leftPixels);
                });
                
                if (!overlaps) {
                    row.push(item);
                    placed = true;
                    break;
                }
            }
            
            if (!placed) {
                rows.push([item]);
            }
        });
        
        return rows;
    }, [itemBars]);

    const getStatusColor = (item) => {
        if (item.is_archived) return "bg-amber-500";
        if (item.source_type === "snapshot") return "bg-gray-400";
        if (item.isCompleted) return "bg-green-500";
        return "bg-blue-500";
    };

    const getStatusBgColor = (item) => {
        if (item.is_archived) return "bg-amber-500/20";
        if (item.source_type === "snapshot") return "bg-gray-400/20";
        if (item.isCompleted) return "bg-green-500/20";
        return "bg-blue-500/20";
    };

    if (items.length === 0) {
        return (
            <div className="neu-pressed rounded-2xl p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-[var(--text-muted)] mb-3">
                    timeline
                </span>
                <p className="text-[var(--text-secondary)] font-medium">
                    Geen tijdlijn data beschikbaar
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                    Voltooi taken om je roadmap te zien
                </p>
            </div>
        );
    }

    // Handle item click - navigate to project
    const handleItemClick = (item) => {
        // Portfolio items use source_project_id, not project_id
        const projectId = item.source_project_id || item.project_id;
        if (projectId) {
            navigate(`/projects/${projectId}`);
        } else {
            console.warn('No project ID found for item:', item);
        }
    };

    // Handle mouse enter - set tooltip position once (fixed to viewport)
    const handleMouseEnter = (e, item) => {
        clearHideTimeout(); // Cancel any pending hide
        
        // Use viewport coordinates for fixed positioning
        setTooltipPos({
            x: e.clientX + 15, // Offset to the right of cursor
            y: e.clientY - 10  // Slightly above cursor
        });
        setHoveredItem(item);
    };

    return (
        <div className="space-y-4" ref={containerRef}>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                        Portfolio Roadmap {studentName && `- ${studentName}`}
                    </h2>
                    <p className="text-sm text-[var(--text-muted)]">
                        Klik op een taak om details te bekijken
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Scale selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)]">Schaal:</span>
                        <div className="flex gap-1 p-1 neu-pressed rounded-lg">
                            <button
                                onClick={() => setTimeScale("months")}
                                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                    timeScale === "months"
                                        ? "bg-[var(--neu-bg)] shadow-sm text-[var(--text-primary)]"
                                        : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                }`}
                            >
                                Maanden
                            </button>
                            <button
                                onClick={() => setTimeScale("weeks")}
                                className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                    timeScale === "weeks"
                                        ? "bg-[var(--neu-bg)] shadow-sm text-[var(--text-primary)]"
                                        : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                                }`}
                            >
                                Weken
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend - cleaner */}
            <div className="flex flex-wrap items-center gap-5 text-xs">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                    <span className="text-[var(--text-muted)]">Voltooid</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-500 text-sm animate-pulse">pending</span>
                    <span className="text-[var(--text-muted)]">Actief</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-[var(--text-muted)]">Gearchiveerd</span>
                </div>
            </div>

            {/* Timeline container */}
            <div className="neu-flat rounded-2xl overflow-hidden">
                <div ref={scrollContainerRef} className="overflow-x-auto">
                    <div style={{ minWidth: Math.max(timelineWidth, 600) }}>
                        {/* Month headers - using fixed width for simplicity */}
                        <div className="flex border-b border-[var(--neu-border)] bg-[var(--gray-100)]/30 sticky top-0 z-10">
                            {months.map((month, idx) => (
                                <div 
                                    key={idx}
                                    className={`flex-none px-2 py-2 text-center ${
                                        month.isYearStart ? 'border-l-2 border-primary/30' : 'border-l border-[var(--neu-border)]'
                                    }`}
                                    style={{ width: monthWidth }}
                                >
                                    {month.isYearStart && (
                                        <div className="text-xs font-bold text-primary mb-0.5">
                                            {month.year}
                                        </div>
                                    )}
                                    <div className="text-xs font-medium text-[var(--text-muted)] capitalize">
                                        {month.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Task bars - with vertical scroll when many rows */}
                        <div 
                            className="relative py-4 px-2"
                            style={{ 
                                maxHeight: itemRows.length > MAX_VISIBLE_ROWS ? `${MAX_VISIBLE_ROWS * ROW_HEIGHT + 32}px` : 'auto',
                                overflowY: itemRows.length > MAX_VISIBLE_ROWS ? 'auto' : 'visible'
                            }}
                        >
                            {/* Today indicator line - using pixel position */}
                            {todayPixelPosition !== null && (
                                <div 
                                    className="absolute top-0 bottom-0 w-0.5 bg-primary z-20 pointer-events-none"
                                    style={{ left: `${todayPixelPosition}px` }}
                                >
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-white text-[10px] font-bold rounded whitespace-nowrap shadow-md">
                                        Vandaag
                                    </div>
                                </div>
                            )}
                            
                            {itemRows.map((row, rowIdx) => (
                                <div key={rowIdx} className="relative h-12 mb-1">
                                    {row.map((item) => (
                                        <div key={item.id} className="contents">
                                            {/* Task period background bar - very subtle, only shows on hover */}
                                            {item.taskLeftPixels !== null && item.taskWidthPixels !== null && (
                                                <div
                                                    className="absolute top-0.5 h-10 rounded-lg bg-gray-300/20 dark:bg-gray-600/15 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                                                    style={{
                                                        left: `${item.taskLeftPixels}px`,
                                                        width: `${item.taskWidthPixels}px`,
                                                    }}
                                                />
                                            )}
                                            
                                            {/* Work period foreground bar - clean design */}
                                            <div
                                                className={`group absolute top-0.5 h-10 rounded-lg cursor-pointer transition-all hover:scale-[1.02] hover:z-10 hover:shadow-lg ${
                                                    item.isActive 
                                                        ? 'bg-blue-500/25 border-2 border-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.3)]' 
                                                        : item.isCompleted 
                                                            ? 'bg-green-500/20 border border-green-500/30' 
                                                            : getStatusBgColor(item) + ' border border-[var(--neu-border)]'
                                                }`}
                                                style={{
                                                    left: `${item.leftPixels}px`,
                                                    width: `${item.widthPixels}px`,
                                                }}
                                                onClick={() => handleItemClick(item)}
                                                onMouseEnter={(e) => handleMouseEnter(e, item)}
                                                onMouseLeave={() => scheduleHide()}
                                            >
                                                {/* Bar content - cleaner layout */}
                                                <div className="flex items-center h-full px-3 gap-2 overflow-hidden">
                                                    {/* Status icon - larger, at start */}
                                                    {item.isCompleted ? (
                                                        <span className="material-symbols-outlined text-green-600 text-base shrink-0">
                                                            check_circle
                                                        </span>
                                                    ) : item.isActive ? (
                                                        <span className="material-symbols-outlined text-blue-500 text-base shrink-0 animate-pulse">
                                                            pending
                                                        </span>
                                                    ) : (
                                                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStatusColor(item)}`} />
                                                    )}
                                                    
                                                    {/* Task name only - clean */}
                                                    <p className="text-sm font-medium text-[var(--text-primary)] truncate flex-1">
                                                        {item.task_name}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Scroll indicator when there are many rows */}
                {itemRows.length > MAX_VISIBLE_ROWS && (
                    <div className="px-4 py-2 border-t border-[var(--neu-border)] bg-[var(--gray-100)]/30 flex items-center justify-between text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">layers</span>
                            {itemRows.length} rijen • scroll omlaag voor meer
                        </span>
                        <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">unfold_more</span>
                        </span>
                    </div>
                )}
            </div>

            {/* Tooltip - Enhanced with better structure */}
            {hoveredItem && (
                <div 
                    className="portfolio-tooltip fixed z-[9999] bg-[var(--neu-bg)] rounded-2xl shadow-2xl border border-[var(--neu-border)] p-4 w-80"
                    style={{
                        left: Math.min(tooltipPos.x, window.innerWidth - 340),
                        top: Math.max(tooltipPos.y - 320, 10),
                    }}
                    onMouseEnter={clearHideTimeout}
                    onMouseLeave={() => scheduleHide()}
                >
                    {/* Header with status */}
                    <div className="flex items-start gap-3 mb-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            hoveredItem.isActive ? 'bg-blue-500/20' : hoveredItem.isCompleted ? 'bg-green-500/20' : getStatusBgColor(hoveredItem)
                        }`}>
                            <span className={`material-symbols-outlined text-xl ${
                                hoveredItem.isActive ? 'text-blue-500' : hoveredItem.isCompleted ? 'text-green-600' : 'text-[var(--text-primary)]'
                            }`}>
                                {hoveredItem.isCompleted ? 'task_alt' : hoveredItem.isActive ? 'pending' : 'schedule'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-[var(--text-primary)] leading-tight">
                                {hoveredItem.task_name}
                            </p>
                            <p className="text-sm text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-xs">business</span>
                                {hoveredItem.business_name}
                            </p>
                            {hoveredItem.project_name && (
                                <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 mt-0.5">
                                    <span className="material-symbols-outlined text-xs">folder</span>
                                    {hoveredItem.project_name}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Days early celebration - prominent */}
                    {hoveredItem.daysEarly > 0 && (
                        <div className="mb-3 p-2 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-green-600">emoji_events</span>
                            <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                                {hoveredItem.daysEarly} dagen eerder afgerond!
                            </span>
                        </div>
                    )}

                    {/* Timeline section - clearer labels */}
                    <div className="space-y-2 mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Tijdlijn</p>
                        <div className="space-y-1.5 text-xs">
                            {/* Start date */}
                            {hoveredItem.timeline?.accepted_at && (
                                <div className="flex items-center justify-between">
                                    <span className="text-[var(--text-muted)] flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs text-blue-500">play_arrow</span>
                                        Gestart
                                    </span>
                                    <span className="text-[var(--text-secondary)] font-medium">
                                        {new Date(hoveredItem.timeline.accepted_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            )}
                            {/* Completion or status */}
                            <div className="flex items-center justify-between">
                                <span className="text-[var(--text-muted)] flex items-center gap-1">
                                    <span className={`material-symbols-outlined text-xs ${hoveredItem.isCompleted ? 'text-green-600' : 'text-blue-500'}`}>
                                        {hoveredItem.isCompleted ? 'check_circle' : 'pending'}
                                    </span>
                                    {hoveredItem.isCompleted ? 'Voltooid' : 'Status'}
                                </span>
                                <span className={`font-medium ${hoveredItem.isCompleted ? 'text-green-600' : 'text-blue-600'}`}>
                                    {hoveredItem.timeline?.completed_at 
                                        ? new Date(hoveredItem.timeline.completed_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
                                        : 'Actief'}
                                </span>
                            </div>
                            {/* Deadline */}
                            {hoveredItem.task_end_date && (
                                <div className="flex items-center justify-between">
                                    <span className="text-[var(--text-muted)] flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs text-orange-500">event</span>
                                        Deadline
                                    </span>
                                    <span className="text-orange-600 font-medium">
                                        {new Date(hoveredItem.task_end_date).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Skills */}
                    {hoveredItem.skills && hoveredItem.skills.length > 0 && (
                        <div className="mb-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">Skills</p>
                            <div className="flex flex-wrap gap-1">
                                {hoveredItem.skills.slice(0, 4).map((skill, idx) => (
                                    <span 
                                        key={idx}
                                        className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                                    >
                                        {skill}
                                    </span>
                                ))}
                                {hoveredItem.skills.length > 4 && (
                                    <span className="text-xs text-[var(--text-muted)] self-center">
                                        +{hoveredItem.skills.length - 4}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action button */}
                    {(hoveredItem.source_project_id || hoveredItem.project_id) ? (
                        <button
                            onClick={() => handleItemClick(hoveredItem)}
                            className="w-full neu-btn-primary text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-medium"
                        >
                            <span className="material-symbols-outlined text-sm">open_in_new</span>
                            Bekijk project
                        </button>
                    ) : (
                        <p className="text-xs text-[var(--text-muted)] text-center italic py-2">
                            Project niet meer beschikbaar
                        </p>
                    )}
                </div>
            )}

        </div>
    );
}
