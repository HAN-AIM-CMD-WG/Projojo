import { useState, useMemo, useEffect } from "react";
import PortfolioItem from "./PortfolioItem";

// Pagination constant
const ITEMS_PER_PAGE = 6;

/**
 * PortfolioList - Displays a student's portfolio with filtering and sorting
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of portfolio items
 * @param {string} props.studentName - Name of the student
 * @param {boolean} props.isLoading - Whether data is loading
 */
export default function PortfolioList({ 
    items = [], 
    studentName = "",
    isLoading = false 
}) {
    const [expandedId, setExpandedId] = useState(null);
    const [filter, setFilter] = useState("all"); // all, live, archived, snapshot
    const [sortBy, setSortBy] = useState("recent"); // recent, oldest, business
    const [searchQuery, setSearchQuery] = useState("");
    const [visibleItems, setVisibleItems] = useState(ITEMS_PER_PAGE);

    // Reset pagination when filter/search changes
    useEffect(() => {
        setVisibleItems(ITEMS_PER_PAGE);
    }, [filter, sortBy, searchQuery]);

    // Filter and sort items
    const filteredItems = useMemo(() => {
        let result = [...items];

        // Apply filter
        if (filter === "live") {
            result = result.filter(item => item.source_type === "live" && !item.is_archived);
        } else if (filter === "archived") {
            result = result.filter(item => item.is_archived);
        } else if (filter === "snapshot") {
            result = result.filter(item => item.source_type === "snapshot");
        }

        // Apply search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(item => 
                item.task_name?.toLowerCase().includes(query) ||
                item.project_name?.toLowerCase().includes(query) ||
                item.business_name?.toLowerCase().includes(query) ||
                item.skills?.some(skill => skill.toLowerCase().includes(query))
            );
        }

        // Apply sort
        result.sort((a, b) => {
            if (sortBy === "recent") {
                const dateA = new Date(a.timeline?.completed_at || 0);
                const dateB = new Date(b.timeline?.completed_at || 0);
                return dateB - dateA;
            } else if (sortBy === "oldest") {
                const dateA = new Date(a.timeline?.completed_at || 0);
                const dateB = new Date(b.timeline?.completed_at || 0);
                return dateA - dateB;
            } else if (sortBy === "business") {
                return (a.business_name || "").localeCompare(b.business_name || "");
            }
            return 0;
        });

        return result;
    }, [items, filter, sortBy, searchQuery]);

    // Count items by type
    const counts = useMemo(() => ({
        all: items.length,
        live: items.filter(item => item.source_type === "live" && !item.is_archived).length,
        archived: items.filter(item => item.is_archived).length,
        snapshot: items.filter(item => item.source_type === "snapshot").length,
    }), [items]);

    const handleToggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-4xl text-primary animate-spin">
                        progress_activity
                    </span>
                    <p className="text-[var(--text-muted)]">Portfolio laden...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                        Portfolio {studentName && `van ${studentName}`}
                    </h2>
                    <p className="text-sm text-[var(--text-muted)]">
                        {items.length} voltooide {items.length === 1 ? 'taak' : 'taken'}
                    </p>
                </div>

                {/* Search */}
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Zoek op taak, project, bedrijf of skill..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-xl neu-pressed text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
            </div>

            {/* Filters and sort */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Filter tabs */}
                <div className="flex gap-2 flex-wrap">
                    <FilterButton 
                        active={filter === "all"} 
                        onClick={() => setFilter("all")}
                        count={counts.all}
                    >
                        Alle
                    </FilterButton>
                    <FilterButton 
                        active={filter === "live"} 
                        onClick={() => setFilter("live")}
                        count={counts.live}
                    >
                        Actief
                    </FilterButton>
                    <FilterButton 
                        active={filter === "archived"} 
                        onClick={() => setFilter("archived")}
                        count={counts.archived}
                    >
                        Gearchiveerd
                    </FilterButton>
                    <FilterButton 
                        active={filter === "snapshot"} 
                        onClick={() => setFilter("snapshot")}
                        count={counts.snapshot}
                    >
                        Archief
                    </FilterButton>
                </div>

                {/* Sort */}
                <div className="sm:ml-auto">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 rounded-xl neu-flat text-sm text-[var(--text-secondary)] cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="recent">Recentste eerst</option>
                        <option value="oldest">Oudste eerst</option>
                        <option value="business">Op bedrijf</option>
                    </select>
                </div>
            </div>

            {/* Items list */}
            {filteredItems.length > 0 ? (
                <div className="space-y-4">
                    {filteredItems.slice(0, visibleItems).map((item) => (
                        <PortfolioItem
                            key={item.id}
                            item={item}
                            expanded={expandedId === item.id}
                            onToggleExpand={() => handleToggleExpand(item.id)}
                        />
                    ))}
                    {filteredItems.length > visibleItems && (
                        <button
                            onClick={() => setVisibleItems(v => v + ITEMS_PER_PAGE)}
                            className="neu-btn w-full justify-center gap-2 text-sm"
                        >
                            <span className="material-symbols-outlined text-base">expand_more</span>
                            Toon meer ({filteredItems.length - visibleItems} resterend)
                        </button>
                    )}
                </div>
            ) : (
                <div className="neu-pressed rounded-2xl p-8 text-center">
                    <span className="material-symbols-outlined text-4xl text-[var(--text-muted)] mb-3">
                        {searchQuery ? "search_off" : "folder_open"}
                    </span>
                    <p className="text-[var(--text-secondary)] font-medium">
                        {searchQuery 
                            ? "Geen resultaten gevonden" 
                            : filter === "all" 
                                ? "Nog geen voltooide taken"
                                : `Geen ${filter === "archived" ? "gearchiveerde" : filter === "snapshot" ? "archief" : "actieve"} items`
                        }
                    </p>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="mt-3 text-sm text-primary hover:underline"
                        >
                            Zoekopdracht wissen
                        </button>
                    )}
                </div>
            )}

            {/* Info about archived items */}
            {counts.archived > 0 || counts.snapshot > 0 ? (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-500">info</span>
                        <div className="text-sm text-[var(--text-secondary)]">
                            <p className="font-medium text-[var(--text-primary)] mb-1">Over gearchiveerde items</p>
                            {counts.archived > 0 && (
                                <p>
                                    <strong>{counts.archived}</strong> {counts.archived === 1 ? 'project is' : 'projecten zijn'} gearchiveerd 
                                    - het project is niet meer actief maar je werk blijft zichtbaar.
                                </p>
                            )}
                            {counts.snapshot > 0 && (
                                <p className="mt-1">
                                    <strong>{counts.snapshot}</strong> {counts.snapshot === 1 ? 'item is' : 'items zijn'} opgeslagen als archief 
                                    - het originele project is verwijderd maar je voltooide werk is bewaard.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

/**
 * FilterButton - A filter toggle button
 */
function FilterButton({ active, onClick, count, children }) {
    return (
        <button
            onClick={onClick}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                active 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'neu-flat text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
        >
            {children}
            {count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                    active 
                        ? 'bg-white/20 text-white' 
                        : 'bg-[var(--gray-200)] text-[var(--text-muted)]'
                }`}>
                    {count}
                </span>
            )}
        </button>
    );
}
