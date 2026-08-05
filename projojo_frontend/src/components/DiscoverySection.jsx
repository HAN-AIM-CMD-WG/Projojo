import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPublicProjects, getThemes, IMAGE_BASE_URL } from '../services';
import PublicProjectCard from './PublicProjectCard';
import SkeletonList from './SkeletonList';
import { legibleFill, COLORLESS_THEME_FILL } from '../utils/themeColor';

/**
 * DiscoverySection Component
 *
 * Compact discovery section for the landing page.
 * Shows public projects with neumorphic-consistent filters.
 */
export default function DiscoverySection() {
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [themes, setThemes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTheme, setSelectedTheme] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState('');

    useEffect(() => {
        setIsLoading(true);
        Promise.allSettled([getPublicProjects(), getThemes()])
            .then((results) => {
                const projectsData = results[0].status === 'fulfilled' ? results[0].value : [];
                const themesData = results[1].status === 'fulfilled' ? results[1].value : [];
                setProjects(projectsData);
                setFilteredProjects(projectsData);
                setThemes(themesData);
                setError(null);
            })
            .catch(err => {
                console.error('Error fetching data:', err);
                setError('Kon projecten niet laden');
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    // Get unique locations
    const locations = [...new Set(projects.map(p => p.business?.location).filter(Boolean))].sort();

    // Apply filters
    useEffect(() => {
        let result = [...projects];

        if (activeFilter === 'active') {
            result = result.filter(p => {
                if (!p.end_date) return true;
                return new Date(p.end_date) >= new Date();
            });
        } else if (activeFilter === 'completed') {
            result = result.filter(p => {
                if (!p.end_date) return false;
                return new Date(p.end_date) < new Date();
            });
        }

        if (selectedTheme) {
            result = result.filter(p =>
                p.themes?.some(t => t.id === selectedTheme)
            );
        }

        if (selectedLocation) {
            result = result.filter(p => p.business?.location === selectedLocation);
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.description?.toLowerCase().includes(term) ||
                p.business?.name?.toLowerCase().includes(term) ||
                p.skills?.some(s => s.toLowerCase().includes(term)) ||
                p.themes?.some(t => t.name.toLowerCase().includes(term))
            );
        }

        setFilteredProjects(result);
    }, [projects, activeFilter, searchTerm, selectedTheme, selectedLocation]);

    // Calculate stats
    const stats = {
        total: projects.length,
        active: projects.filter(p => !p.end_date || new Date(p.end_date) >= new Date()).length,
        completed: projects.filter(p => p.end_date && new Date(p.end_date) < new Date()).length,
        totalPositions: projects.reduce((sum, p) => sum + (p.open_positions || 0), 0),
        organizations: new Set(projects.map(p => p.business?.id).filter(Boolean)).size
    };

    if (error || (!isLoading && projects.length === 0)) {
        return null;
    }

    return (
        <section id="discover" className="py-12 sm:py-16 px-4 sm:px-6 bg-[var(--neu-bg)]">
            <div className="max-w-7xl mx-auto">
                {/* Header - compact */}
                <div className="text-center mb-8">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">explore</span>
                        Ontdek
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] mb-2">
                        Wat er gebeurt in de regio
                    </h2>
                    <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-xl mx-auto">
                        Bekijk lopende en afgeronde projecten van organisaties in onze omgeving
                    </p>
                </div>

                {/* Stats - inline */}
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6">
                    <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                        <span className="material-symbols-outlined text-primary text-base" aria-hidden="true">folder_open</span>
                        <span className="font-bold">{stats.total}</span>
                        <span>projecten</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                        <span className="material-symbols-outlined text-primary text-base" aria-hidden="true">work</span>
                        <span className="font-bold">{stats.totalPositions}</span>
                        <span>open plekken</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                        <span className="material-symbols-outlined text-primary text-base" aria-hidden="true">business</span>
                        <span className="font-bold">{stats.organizations}</span>
                        <span>organisaties</span>
                    </div>
                </div>

                {/* Filters - neumorphic card */}
                <div className="neu-flat p-4 mb-8">
                    <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
                        {/* Status filter - neumorphic segment */}
                        <div className="neu-segment-container !p-1">
                            <button
                                onClick={() => setActiveFilter('all')}
                                className={`neu-segment-btn !px-3 !py-1.5 !text-[11px] cursor-pointer ${activeFilter === 'all' ? 'active' : ''}`}
                            >
                                Alles
                                <span className="ml-1 opacity-50">{stats.total}</span>
                            </button>
                            <button
                                onClick={() => setActiveFilter('active')}
                                className={`neu-segment-btn !px-3 !py-1.5 !text-[11px] cursor-pointer ${activeFilter === 'active' ? 'active' : ''}`}
                            >
                                Lopend
                            </button>
                            <button
                                onClick={() => setActiveFilter('completed')}
                                className={`neu-segment-btn !px-3 !py-1.5 !text-[11px] cursor-pointer ${activeFilter === 'completed' ? 'active' : ''}`}
                            >
                                Afgerond
                            </button>
                        </div>

                        {/* Search - compact */}
                        <div className="relative">
                            <label className="sr-only" htmlFor="discovery-search">Zoek een project</label>
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-base" aria-hidden="true">
                                search
                            </span>
                            <input
                                id="discovery-search"
                                type="text"
                                placeholder="Zoek op naam, skill of organisatie..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="neu-input !pl-9 !pr-4 !py-2 text-xs w-56 sm:w-64"
                            />
                        </div>
                    </div>

                    {/* Theme pills - wraps so no pill is ever sliced off at the card edge */}
                    {themes.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-[var(--neu-border)]">
                            <span className="neu-label shrink-0 mr-0.5">Thema&apos;s</span>
                            <button
                                type="button"
                                aria-pressed={!selectedTheme}
                                onClick={() => setSelectedTheme(null)}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${!selectedTheme
                                        ? 'bg-primary text-white'
                                        : 'text-[var(--text-muted)] hover:text-primary'
                                    }`}
                            >
                                Alles
                            </button>
                            {themes.map(theme => {
                                const count = projects.filter(p => p.themes?.some(t => t.id === theme.id)).length;
                                if (count === 0) return null;
                                const isSelected = selectedTheme === theme.id;
                                return (
                                    <button
                                        key={theme.id}
                                        type="button"
                                        aria-pressed={isSelected}
                                        onClick={() => setSelectedTheme(isSelected ? null : theme.id)}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${isSelected
                                                ? ''
                                                : 'text-[var(--text-secondary)] hover:text-primary'
                                            }`}
                                        style={isSelected ? legibleFill(theme.color || COLORLESS_THEME_FILL) : undefined}
                                    >
                                        {theme.icon && (
                                            <span className="material-symbols-outlined text-[11px]" aria-hidden="true">{theme.icon}</span>
                                        )}
                                        {theme.name}
                                        <span className="opacity-50">{count}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Location filter - wraps, same reason as the theme row above */}
                    {locations.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            <span className="material-symbols-outlined text-xs text-[var(--text-muted)] shrink-0" aria-hidden="true">location_on</span>
                            <button
                                type="button"
                                aria-pressed={!selectedLocation}
                                onClick={() => setSelectedLocation('')}
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${!selectedLocation
                                        ? 'bg-primary text-white'
                                        : 'text-[var(--text-muted)] hover:text-primary'
                                    }`}
                            >
                                Alle locaties
                            </button>
                            {locations.map(loc => (
                                <button
                                    key={loc}
                                    type="button"
                                    aria-pressed={selectedLocation === loc}
                                    onClick={() => setSelectedLocation(selectedLocation === loc ? '' : loc)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${selectedLocation === loc
                                            ? 'bg-primary text-white'
                                            : 'text-[var(--text-muted)] hover:text-primary'
                                        }`}
                                >
                                    {loc}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Content */}
                {isLoading ? (
                    <SkeletonList count={6} variant="project" />
                ) : filteredProjects.length === 0 ? (
                    <div className="neu-flat p-10 text-center">
                        <span className="material-symbols-outlined text-4xl text-[var(--text-muted)] mb-3" aria-hidden="true">search_off</span>
                        <p className="text-sm font-bold text-[var(--text-primary)] mb-1">Geen projecten gevonden</p>
                        <p className="text-xs text-[var(--text-muted)]">Probeer andere filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredProjects.slice(0, 6).map((project, index) => (
                            <PublicProjectCard key={project.id} project={project} index={index} />
                        ))}
                    </div>
                )}

                {/* View all link */}
                {filteredProjects.length > 6 && (
                    <div className="text-center mt-8">
                        <Link
                            to="/publiek"
                            className="neu-btn-primary inline-flex items-center gap-2"
                        >
                            Bekijk alle {filteredProjects.length} projecten
                            <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span>
                        </Link>
                    </div>
                )}

                {/* CTA for students */}
                <div className="mt-10 text-center">
                    <p className="text-sm text-[var(--text-muted)] mb-3">
                        Wil je meewerken aan een van deze projecten?
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-1.5 text-primary font-bold text-sm hover:underline"
                    >
                        Maak een account aan
                        <span className="material-symbols-outlined text-base" aria-hidden="true">arrow_forward</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
