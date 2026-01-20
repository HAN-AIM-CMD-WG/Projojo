import { useMemo, useState, useRef } from "react";
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

    // Calculate timeline bounds and generate months
    const { months, minDate, maxDate, timelineWidth } = useMemo(() => {
        if (items.length === 0) return { months: [], minDate: null, maxDate: null, timelineWidth: 0 };

        // Find the date range from all items
        let earliest = null;
        let latest = null;
        const now = new Date();

        items.forEach(item => {
            const timeline = item.timeline || {};
            const startDate = timeline.accepted_at || timeline.requested_at || timeline.created_at;
            // Use completed_at if available, otherwise use now for active items
            const endDate = timeline.completed_at || now;

            if (startDate) {
                const start = new Date(startDate);
                if (!earliest || start < earliest) earliest = start;
            }
            if (endDate) {
                const end = new Date(endDate);
                if (!latest || end > latest) latest = end;
            }
        });

        // If no dates found, use current month range
        if (!earliest) earliest = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        if (!latest) latest = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Add padding: 1 month before and after
        const minDate = new Date(earliest);
        minDate.setMonth(minDate.getMonth() - 1);
        minDate.setDate(1);

        const maxDate = new Date(latest);
        maxDate.setMonth(maxDate.getMonth() + 2);
        maxDate.setDate(0);

        // Generate month labels
        const months = [];
        const current = new Date(minDate);
        while (current <= maxDate) {
            months.push({
                date: new Date(current),
                label: current.toLocaleDateString('nl-NL', { month: 'short' }),
                year: current.getFullYear(),
                isYearStart: current.getMonth() === 0
            });
            current.setMonth(current.getMonth() + 1);
        }

        return { months, minDate, maxDate, timelineWidth: months.length * monthWidth };
    }, [items, monthWidth]);

    // Calculate position and width for each item bar
    const itemBars = useMemo(() => {
        if (!minDate || !maxDate) return [];

        const totalDays = (maxDate - minDate) / (1000 * 60 * 60 * 24);

        return items.map(item => {
            const timeline = item.timeline || {};
            const startStr = timeline.accepted_at || timeline.requested_at || timeline.created_at;
            const endStr = timeline.completed_at;

            if (!startStr) return null;

            const start = new Date(startStr);
            const end = endStr ? new Date(endStr) : new Date();

            const startOffset = (start - minDate) / (1000 * 60 * 60 * 24);
            const duration = Math.max((end - start) / (1000 * 60 * 60 * 24), 7); // Minimum 7 days width

            const leftPercent = (startOffset / totalDays) * 100;
            const widthPercent = Math.max((duration / totalDays) * 100, 3); // Minimum 3% width

            return {
                ...item,
                leftPercent,
                widthPercent,
                isCompleted: !!timeline.completed_at,
                isActive: !timeline.completed_at && (timeline.accepted_at || timeline.started_at),
            };
        }).filter(Boolean);
    }, [items, minDate, maxDate]);

    // Group items by whether they overlap
    const itemRows = useMemo(() => {
        const rows = [];
        
        itemBars.forEach(item => {
            // Find a row where this item doesn't overlap
            let placed = false;
            for (const row of rows) {
                const overlaps = row.some(existing => {
                    const existingEnd = existing.leftPercent + existing.widthPercent;
                    const itemEnd = item.leftPercent + item.widthPercent;
                    return !(item.leftPercent >= existingEnd || itemEnd <= existing.leftPercent);
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

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-[var(--text-muted)]">Voltooid</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-[var(--text-muted)]">Actief</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-[var(--text-muted)]">Gearchiveerd</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <span className="text-[var(--text-muted)]">Archief</span>
                </div>
            </div>

            {/* Timeline container */}
            <div className="neu-flat rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <div style={{ minWidth: Math.max(timelineWidth, 600) }}>
                        {/* Month headers */}
                        <div className="flex border-b border-[var(--neu-border)] bg-[var(--gray-100)]/30">
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

                        {/* Task bars */}
                        <div className="relative py-4 px-2">
                            {itemRows.map((row, rowIdx) => (
                                <div key={rowIdx} className="relative h-14 mb-2">
                                    {row.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`absolute top-1 h-12 rounded-xl cursor-pointer transition-all hover:scale-[1.02] hover:z-10 hover:shadow-lg ${getStatusBgColor(item)} border border-[var(--neu-border)]`}
                                            style={{
                                                left: `${item.leftPercent}%`,
                                                width: `${item.widthPercent}%`,
                                                minWidth: '100px'
                                            }}
                                            onClick={() => handleItemClick(item)}
                                            onMouseEnter={(e) => handleMouseEnter(e, item)}
                                            onMouseLeave={() => scheduleHide()}
                                        >
                                            {/* Bar content */}
                                            <div className="flex items-center h-full px-3 gap-2 overflow-hidden">
                                                {/* Status dot */}
                                                <div className={`w-2 h-2 rounded-full shrink-0 ${getStatusColor(item)}`} />
                                                
                                                {/* Text content */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                                                        {item.task_name}
                                                    </p>
                                                    <p className="text-xs text-[var(--text-muted)] truncate">
                                                        {item.business_name}
                                                    </p>
                                                </div>

                                                {/* Status icon */}
                                                {item.isCompleted ? (
                                                    <span className="material-symbols-outlined text-green-500 text-sm shrink-0">
                                                        check_circle
                                                    </span>
                                                ) : item.isActive && (
                                                    <span className="material-symbols-outlined text-blue-500 text-sm shrink-0 animate-pulse">
                                                        pending
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tooltip - FIXED position so it appears above everything */}
            {hoveredItem && (
                <div 
                    className="portfolio-tooltip fixed z-[9999] bg-[var(--neu-bg)] rounded-xl shadow-2xl border border-[var(--neu-border)] p-4 w-72"
                    style={{
                        // Position above and to the right of cursor, but keep on screen
                        left: Math.min(tooltipPos.x, window.innerWidth - 300),
                        top: Math.max(tooltipPos.y - 280, 10), // Position ABOVE the cursor
                    }}
                    onMouseEnter={clearHideTimeout}
                    onMouseLeave={() => scheduleHide()}
                >
                    <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getStatusBgColor(hoveredItem)}`}>
                            <span className="material-symbols-outlined text-[var(--text-primary)]">
                                {hoveredItem.isCompleted ? 'task_alt' : 'schedule'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[var(--text-primary)]">
                                {hoveredItem.task_name}
                            </p>
                            <p className="text-sm text-[var(--text-muted)]">
                                {hoveredItem.business_name}
                            </p>
                            
                            {/* Project name */}
                            {hoveredItem.project_name && (
                                <p className="text-xs text-[var(--text-secondary)] mt-1">
                                    <span className="material-symbols-outlined text-xs align-middle mr-1">folder</span>
                                    {hoveredItem.project_name}
                                </p>
                            )}
                            
                            {/* Skills */}
                            {hoveredItem.skills && hoveredItem.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {hoveredItem.skills.slice(0, 3).map((skill, idx) => (
                                        <span 
                                            key={idx}
                                            className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                    {hoveredItem.skills.length > 3 && (
                                        <span className="text-xs text-[var(--text-muted)]">
                                            +{hoveredItem.skills.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Timeline info */}
                            <div className="flex flex-col gap-1 mt-2 text-xs text-[var(--text-muted)]">
                                {hoveredItem.timeline?.accepted_at && (
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-xs text-blue-500">play_arrow</span>
                                        Start: {new Date(hoveredItem.timeline.accepted_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                )}
                                {hoveredItem.timeline?.completed_at ? (
                                    <span className="flex items-center gap-1 text-green-600">
                                        <span className="material-symbols-outlined text-xs">check_circle</span>
                                        Voltooid: {new Date(hoveredItem.timeline.completed_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-blue-600">
                                        <span className="material-symbols-outlined text-xs">pending</span>
                                        Nog actief
                                    </span>
                                )}
                            </div>

                            {/* Action button */}
                            {(hoveredItem.source_project_id || hoveredItem.project_id) ? (
                                <button
                                    onClick={() => handleItemClick(hoveredItem)}
                                    className="mt-3 w-full neu-btn-primary text-xs py-2 rounded-lg flex items-center justify-center gap-1"
                                >
                                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                                    Bekijk project
                                </button>
                            ) : (
                                <p className="mt-3 text-xs text-[var(--text-muted)] text-center italic">
                                    Project niet meer beschikbaar
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
