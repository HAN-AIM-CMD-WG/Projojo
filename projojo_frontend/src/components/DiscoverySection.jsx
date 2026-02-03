import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getPublicProjects, getThemes, IMAGE_BASE_URL } from '../services';
import PublicProjectCard from './PublicProjectCard';
import Loading from './Loading';

/**
 * DiscoverySection Component
 * 
 * A section for the landing page that shows public projects.
 * Allows non-logged-in users to browse what's happening in the region.
 */
export default function DiscoverySection() {
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [themes, setThemes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'completed'
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTheme, setSelectedTheme] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState('');

    useEffect(() => {
        setIsLoading(true);
        Promise.all([getPublicProjects(), getThemes()])
            .then(([projectsData, themesData]) => {
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
        
        // Status filter
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
        
        // Theme filter
        if (selectedTheme) {
            result = result.filter(p => 
                p.themes?.some(t => t.id === selectedTheme)
            );
        }
        
        // Location filter
        if (selectedLocation) {
            result = result.filter(p => p.business?.location === selectedLocation);
        }
        
        // Search filter
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

    if (error) {
        return null; // Don't show section if there's an error
    }

    if (isLoading) {
        return (
            <section className="py-16 px-6 bg-[var(--neu-bg)]">
                <div className="max-w-7xl mx-auto text-center">
                    <Loading size="48px" />
                    <p className="mt-4 text-[var(--text-muted)]">Projecten laden...</p>
                </div>
            </section>
        );
    }

    if (projects.length === 0) {
        return null; // Don't show section if no public projects
    }

    return (
        <section id="discover" className="py-16 px-6 bg-gradient-to-b from-[var(--neu-bg)] to-[var(--gray-100)]">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-10">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
                        <span className="material-symbols-outlined text-lg">explore</span>
                        Ontdek
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-[var(--text-primary)] mb-4">
                        Wat er gebeurt in de regio
                    </h2>
                    <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                        Bekijk lopende en afgeronde projecten van organisaties in onze omgeving
                    </p>
                </div>

                {/* Stats bar */}
                <div className="flex flex-wrap justify-center gap-6 mb-8">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <span className="material-symbols-outlined text-primary">folder_open</span>
                        <span className="font-bold">{stats.total}</span>
                        <span>projecten</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <span className="material-symbols-outlined text-emerald-500">work</span>
                        <span className="font-bold">{stats.totalPositions}</span>
                        <span>open plekken</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <span className="material-symbols-outlined text-blue-500">business</span>
                        <span className="font-bold">{stats.organizations}</span>
                        <span>organisaties</span>
                    </div>
                </div>

                {/* Theme filter pills */}
                {themes.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mb-6">
                        <button
                            onClick={() => setSelectedTheme(null)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                !selectedTheme
                                    ? 'bg-[var(--text-primary)] text-white shadow-md'
                                    : 'bg-[var(--gray-200)] text-[var(--text-secondary)] hover:bg-[var(--gray-300)]'
                            }`}
                        >
                            Alle thema's
                        </button>
                        {themes.map(theme => {
                            const count = projects.filter(p => p.themes?.some(t => t.id === theme.id)).length;
                            if (count === 0) return null;
                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => setSelectedTheme(theme.id)}
                                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all inline-flex items-center gap-1.5 ${
                                        selectedTheme === theme.id
                                            ? 'shadow-md text-white'
                                            : 'bg-[var(--gray-200)] text-[var(--text-secondary)] hover:bg-[var(--gray-300)]'
                                    }`}
                                    style={selectedTheme === theme.id && theme.color ? { backgroundColor: theme.color } : {}}
                                >
                                    {theme.icon && (
                                        <span className="material-symbols-outlined text-sm">{theme.icon}</span>
                                    )}
                                    {theme.name}
                                    <span className="text-xs opacity-70">({count})</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Location filter */}
                {locations.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-sm text-[var(--text-muted)] self-center mr-1">location_on</span>
                        <button
                            onClick={() => setSelectedLocation('')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                !selectedLocation
                                    ? 'bg-blue-500 text-white shadow-sm'
                                    : 'bg-[var(--gray-200)] text-[var(--text-secondary)] hover:bg-[var(--gray-300)]'
                            }`}
                        >
                            Alle locaties
                        </button>
                        {locations.slice(0, 5).map(loc => (
                            <button
                                key={loc}
                                onClick={() => setSelectedLocation(loc)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                    selectedLocation === loc
                                        ? 'bg-blue-500 text-white shadow-sm'
                                        : 'bg-[var(--gray-200)] text-[var(--text-secondary)] hover:bg-[var(--gray-300)]'
                                }`}
                            >
                                {loc}
                            </button>
                        ))}
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                    {/* Status filter pills */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                activeFilter === 'all'
                                    ? 'bg-primary text-white shadow-md'
                                    : 'bg-[var(--gray-200)] text-[var(--text-secondary)] hover:bg-[var(--gray-300)]'
                            }`}
                        >
                            Alles ({stats.total})
                        </button>
                        <button
                            onClick={() => setActiveFilter('active')}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                activeFilter === 'active'
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'bg-[var(--gray-200)] text-[var(--text-secondary)] hover:bg-[var(--gray-300)]'
                            }`}
                        >
                            <span className="inline-flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-current"></span>
                                Lopend ({stats.active})
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveFilter('completed')}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                activeFilter === 'completed'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'bg-[var(--gray-200)] text-[var(--text-secondary)] hover:bg-[var(--gray-300)]'
                            }`}
                        >
                            <span className="inline-flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Afgerond ({stats.completed})
                            </span>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Zoek op naam, skill of organisatie..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="neu-input pl-10 pr-4 py-2 w-64"
                        />
                    </div>
                </div>

                {/* Impact Showcase - Completed projects with impact */}
                {(() => {
                    const impactProjects = projects.filter(p => 
                        p.impact_summary && 
                        p.end_date && 
                        new Date(p.end_date) < new Date()
                    );
                    
                    if (impactProjects.length === 0 || activeFilter === 'active' || selectedTheme || selectedLocation || searchTerm) {
                        return null;
                    }
                    
                    return (
                        <div className="mb-12">
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-2xl text-blue-500">emoji_events</span>
                                <h3 className="text-xl font-bold text-[var(--text-primary)]">Impact Showcase</h3>
                                <span className="text-sm text-[var(--text-muted)]">- Wat we bereikt hebben</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {impactProjects.slice(0, 2).map(project => (
                                    <Link
                                        key={project.id}
                                        to={`/publiek/${project.id}`}
                                        className="neu-flat p-5 hover:shadow-lg transition-all group"
                                    >
                                        <div className="flex gap-4">
                                            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                                                <img
                                                    src={`${IMAGE_BASE_URL}${project.image_path}`}
                                                    alt={project.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase">Afgerond</span>
                                                    {project.themes?.[0] && (
                                                        <span 
                                                            className="px-2 py-0.5 text-[10px] font-bold rounded-full text-white"
                                                            style={{ backgroundColor: project.themes[0].color || '#6B7280' }}
                                                        >
                                                            {project.themes[0].name}
                                                        </span>
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-[var(--text-primary)] truncate group-hover:text-primary transition-colors">
                                                    {project.name}
                                                </h4>
                                                <p className="text-xs text-[var(--text-muted)] mb-2">{project.business?.name}</p>
                                                <p className="text-sm text-blue-700 line-clamp-2 italic">
                                                    "{project.impact_summary}"
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                })()}

                {/* Projects grid */}
                {filteredProjects.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-4xl text-[var(--text-muted)] mb-4">search_off</span>
                        <p className="text-[var(--text-muted)]">Geen projecten gevonden met deze filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </Link>
                    </div>
                )}

                {/* CTA for students */}
                <div className="mt-12 text-center">
                    <p className="text-[var(--text-secondary)] mb-4">
                        Wil je meewerken aan een van deze projecten?
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-primary font-bold hover:underline"
                    >
                        Maak een account aan
                        <span className="material-symbols-outlined">login</span>
                    </Link>
                </div>
            </div>
        </section>
    );
}
