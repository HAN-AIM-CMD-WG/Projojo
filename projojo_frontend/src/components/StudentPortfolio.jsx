import { useState, useEffect } from "react";
import { getStudentPortfolio } from "../services";
import PortfolioList from "./PortfolioList";
import PortfolioRoadmap from "./PortfolioRoadmap";

/**
 * StudentPortfolio - Combined portfolio view with list and roadmap tabs
 * 
 * @param {Object} props
 * @param {string} props.studentId - The student's ID
 * @param {string} props.studentName - The student's name (optional)
 * @param {boolean} props.isOwnProfile - Whether viewing own profile
 */
export default function StudentPortfolio({ studentId, studentName = "", isOwnProfile = false }) {
    const [activeTab, setActiveTab] = useState("roadmap"); // "list" | "roadmap"
    const [portfolio, setPortfolio] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!studentId) return;

        let ignore = false;
        setIsLoading(true);
        setError(null);

        getStudentPortfolio(studentId)
            .then(data => {
                if (ignore) return;
                setPortfolio(data);
            })
            .catch(err => {
                if (ignore) return;
                setError(err.message || "Er ging iets mis bij het laden van het portfolio");
            })
            .finally(() => {
                if (ignore) return;
                setIsLoading(false);
            });

        return () => {
            ignore = true;
        };
    }, [studentId]);

    // If no items, show empty state
    if (!isLoading && portfolio && portfolio.items?.length === 0) {
        return (
            <section className="neu-flat p-6">
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary">folder_special</span>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">
                        {isOwnProfile ? "Mijn Portfolio" : "Portfolio"}
                    </h2>
                </div>
                <div className="neu-pressed p-8 text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-3">
                        work_history
                    </span>
                    <p className="text-[var(--text-muted)] font-medium">
                        {isOwnProfile 
                            ? "Je hebt nog geen voltooide taken in je portfolio"
                            : "Deze student heeft nog geen voltooide taken"
                        }
                    </p>
                    <p className="text-sm text-[var(--text-muted)] mt-2">
                        Voltooide taken verschijnen hier automatisch
                    </p>
                </div>
            </section>
        );
    }

    return (
        <section className="neu-flat p-6">
            {/* Header with tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">folder_special</span>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">
                        {isOwnProfile ? "Mijn Portfolio" : "Portfolio"}
                    </h2>
                    {portfolio && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                            {portfolio.total_count || 0}
                        </span>
                    )}
                </div>

                {/* View toggle */}
                <div className="flex gap-1 p-1 neu-pressed rounded-xl">
                    <button
                        onClick={() => setActiveTab("list")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                            activeTab === "list"
                                ? "bg-[var(--neu-bg)] shadow-sm text-[var(--text-primary)]"
                                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                        }`}
                    >
                        <span className="material-symbols-outlined text-base">list</span>
                        Lijst
                    </button>
                    <button
                        onClick={() => setActiveTab("roadmap")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                            activeTab === "roadmap"
                                ? "bg-[var(--neu-bg)] shadow-sm text-[var(--text-primary)]"
                                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                        }`}
                    >
                        <span className="material-symbols-outlined text-base">timeline</span>
                        Tijdlijn
                    </button>
                </div>
            </div>

            {/* Error state */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <span className="material-symbols-outlined">error</span>
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                </div>
            )}

            {/* Content based on active tab */}
            {activeTab === "list" ? (
                <PortfolioList
                    items={portfolio?.items || []}
                    studentName={studentName || portfolio?.student_name}
                    isLoading={isLoading}
                />
            ) : (
                <PortfolioRoadmap
                    items={portfolio?.items || []}
                    studentName={studentName || portfolio?.student_name}
                />
            )}

            {/* Stats footer */}
            {portfolio && portfolio.total_count > 0 && (
                <div className="mt-6 pt-4 border-t border-[var(--neu-border)]">
                    <div className="flex flex-wrap gap-6 text-sm">
                        {portfolio.active_count > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-blue-500" />
                                <span className="text-[var(--text-muted)]">
                                    <strong className="text-[var(--text-primary)]">{portfolio.active_count}</strong> actief
                                </span>
                            </div>
                        )}
                        {portfolio.completed_count > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-green-500" />
                                <span className="text-[var(--text-muted)]">
                                    <strong className="text-[var(--text-primary)]">{portfolio.completed_count}</strong> voltooid
                                </span>
                            </div>
                        )}
                        {portfolio.snapshot_count > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-gray-400" />
                                <span className="text-[var(--text-muted)]">
                                    <strong className="text-[var(--text-primary)]">{portfolio.snapshot_count}</strong> archief
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
