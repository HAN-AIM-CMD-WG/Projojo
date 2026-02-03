import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPublicProjects, getPublicProject, getThemes, IMAGE_BASE_URL } from '../services';
import PublicProjectCard from '../components/PublicProjectCard';
import Loading from '../components/Loading';
import RichTextViewer from '../components/RichTextViewer';
import LocationMap from '../components/LocationMap';
import { formatDate, getCountdownText } from '../utils/dates';

/**
 * PublicDiscoveryPage
 * 
 * Full page for browsing public projects without login.
 * Can show all projects or a specific project detail.
 */
export default function PublicDiscoveryPage() {
    const { projectId } = useParams();
    
    if (projectId) {
        return <PublicProjectDetail projectId={projectId} />;
    }
    
    return <PublicProjectList />;
}

// List view component
function PublicProjectList() {
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [themes, setThemes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState('');
    const [selectedTheme, setSelectedTheme] = useState(null);

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
        if (locationFilter) {
            result = result.filter(p => p.business?.location === locationFilter);
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
    }, [projects, activeFilter, searchTerm, locationFilter, selectedTheme]);

    // Calculate stats
    const stats = {
        total: projects.length,
        active: projects.filter(p => !p.end_date || new Date(p.end_date) >= new Date()).length,
        completed: projects.filter(p => p.end_date && new Date(p.end_date) < new Date()).length,
        totalPositions: projects.reduce((sum, p) => sum + (p.open_positions || 0), 0),
        organizations: new Set(projects.map(p => p.business?.id).filter(Boolean)).size
    };

    return (
        <div className="min-h-screen bg-[var(--neu-bg)]">
            {/* Header */}
            <header className="bg-gradient-to-r from-primary to-orange-500 text-white py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                        Terug naar home
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black mb-4">
                        Ontdek Projecten
                    </h1>
                    <p className="text-xl text-white/90 max-w-2xl">
                        Bekijk wat er gebeurt in de regio. Lopende en afgeronde projecten van organisaties.
                    </p>
                    
                    {/* Stats */}
                    <div className="flex flex-wrap gap-6 mt-8">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined">folder_open</span>
                            <span className="font-bold text-2xl">{stats.total}</span>
                            <span className="text-white/80">projecten</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined">work</span>
                            <span className="font-bold text-2xl">{stats.totalPositions}</span>
                            <span className="text-white/80">open plekken</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined">business</span>
                            <span className="font-bold text-2xl">{stats.organizations}</span>
                            <span className="text-white/80">organisaties</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Theme filter bar */}
            {themes.length > 0 && (
                <div className="bg-[var(--gray-100)] border-b border-[var(--neu-border)] py-3 px-6">
                    <div className="max-w-7xl mx-auto flex flex-wrap gap-2 items-center">
                        <span className="text-sm font-bold text-[var(--text-muted)] mr-2">Thema's:</span>
                        <button
                            onClick={() => setSelectedTheme(null)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                !selectedTheme
                                    ? 'bg-[var(--text-primary)] text-white shadow-sm'
                                    : 'bg-white text-[var(--text-secondary)] hover:bg-[var(--gray-200)]'
                            }`}
                        >
                            Alles
                        </button>
                        {themes.map(theme => {
                            const count = projects.filter(p => p.themes?.some(t => t.id === theme.id)).length;
                            if (count === 0) return null;
                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => setSelectedTheme(theme.id)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1 ${
                                        selectedTheme === theme.id
                                            ? 'shadow-sm text-white'
                                            : 'bg-white text-[var(--text-secondary)] hover:bg-[var(--gray-200)]'
                                    }`}
                                    style={selectedTheme === theme.id && theme.color ? { backgroundColor: theme.color } : {}}
                                >
                                    {theme.icon && (
                                        <span className="material-symbols-outlined text-xs">{theme.icon}</span>
                                    )}
                                    {theme.name}
                                    <span className="opacity-60">({count})</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="sticky top-0 z-10 bg-[var(--neu-bg)] border-b border-[var(--neu-border)] py-4 px-6">
                <div className="max-w-7xl mx-auto flex flex-wrap gap-4 items-center justify-between">
                    {/* Status filter pills */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveFilter('all')}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                activeFilter === 'all'
                                    ? 'bg-primary text-white shadow-md'
                                    : 'neu-btn'
                            }`}
                        >
                            Alles ({stats.total})
                        </button>
                        <button
                            onClick={() => setActiveFilter('active')}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                activeFilter === 'active'
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'neu-btn'
                            }`}
                        >
                            Lopend ({stats.active})
                        </button>
                        <button
                            onClick={() => setActiveFilter('completed')}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                                activeFilter === 'completed'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'neu-btn'
                            }`}
                        >
                            Afgerond ({stats.completed})
                        </button>
                    </div>

                    <div className="flex gap-4 items-center">
                        {/* Location filter pills */}
                        {locations.length > 0 && (
                            <div className="flex gap-1.5 items-center">
                                <span className="material-symbols-outlined text-sm text-[var(--text-muted)]">location_on</span>
                                <button
                                    onClick={() => setLocationFilter('')}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                        !locationFilter
                                            ? 'bg-blue-500 text-white shadow-sm'
                                            : 'neu-btn !py-1.5 !px-3 !text-xs'
                                    }`}
                                >
                                    Alles
                                </button>
                                {locations.slice(0, 4).map(loc => (
                                    <button
                                        key={loc}
                                        onClick={() => setLocationFilter(loc)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                            locationFilter === loc
                                                ? 'bg-blue-500 text-white shadow-sm'
                                                : 'neu-btn !py-1.5 !px-3 !text-xs'
                                        }`}
                                    >
                                        {loc}
                                    </button>
                                ))}
                                {locations.length > 4 && (
                                    <select
                                        value={locationFilter}
                                        onChange={(e) => setLocationFilter(e.target.value)}
                                        className="neu-input py-1.5 px-2 text-xs"
                                    >
                                        <option value="">Meer...</option>
                                        {locations.slice(4).map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        {/* Search */}
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                                search
                            </span>
                            <input
                                type="text"
                                placeholder="Zoeken..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="neu-input pl-10 pr-4 py-2 w-48 md:w-64"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <main className="max-w-7xl mx-auto py-8 px-6">
                {isLoading ? (
                    <div className="text-center py-20">
                        <Loading size="64px" />
                        <p className="mt-4 text-[var(--text-muted)]">Projecten laden...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <span className="material-symbols-outlined text-5xl text-red-400 mb-4">error</span>
                        <p className="text-[var(--text-muted)]">{error}</p>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-20">
                        <span className="material-symbols-outlined text-5xl text-[var(--text-muted)] mb-4">search_off</span>
                        <p className="text-[var(--text-muted)]">Geen projecten gevonden</p>
                        {(searchTerm || locationFilter || activeFilter !== 'all' || selectedTheme) && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setLocationFilter('');
                                    setActiveFilter('all');
                                    setSelectedTheme(null);
                                }}
                                className="mt-4 text-primary font-bold hover:underline"
                            >
                                Filters wissen
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <p className="text-[var(--text-muted)] mb-6">
                            {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projecten'} gevonden
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredProjects.map((project, index) => (
                                <PublicProjectCard key={project.id} project={project} index={index} />
                            ))}
                        </div>
                    </>
                )}
            </main>

            {/* CTA Footer */}
            <footer className="bg-[var(--gray-100)] py-12 px-6">
                <div className="max-w-7xl mx-auto text-center">
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                        Wil je meewerken aan een project?
                    </h3>
                    <p className="text-[var(--text-secondary)] mb-6">
                        Maak een account aan om je aan te melden voor projecten en je portfolio op te bouwen.
                    </p>
                    <Link to="/login" className="neu-btn-primary inline-flex items-center gap-2">
                        Aan de slag
                        <span className="material-symbols-outlined">arrow_forward</span>
                    </Link>
                </div>
            </footer>
        </div>
    );
}

// Detail view component
function PublicProjectDetail({ projectId }) {
    const [project, setProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showMap, setShowMap] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        getPublicProject(projectId)
            .then(data => {
                setProject(data);
                setError(null);
            })
            .catch(err => {
                console.error('Error fetching project:', err);
                setError('Project niet gevonden');
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [projectId]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--neu-bg)] flex items-center justify-center">
                <Loading size="64px" />
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen bg-[var(--neu-bg)] flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-[var(--text-muted)] mb-4">search_off</span>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Project niet gevonden</h1>
                <p className="text-[var(--text-muted)] mb-6">{error}</p>
                <Link to="/ontdek" className="neu-btn-primary">
                    Terug naar projecten
                </Link>
            </div>
        );
    }

    // Determine status
    const getStatus = () => {
        if (!project.end_date) return { label: 'Lopend', color: 'text-emerald-600 bg-emerald-100' };
        const endDate = new Date(project.end_date);
        if (endDate < new Date()) return { label: 'Afgerond', color: 'text-blue-600 bg-blue-100' };
        return { label: 'Lopend', color: 'text-emerald-600 bg-emerald-100' };
    };
    const status = getStatus();

    return (
        <div className="min-h-screen bg-[var(--neu-bg)]">
            {/* Header with image */}
            <header className="relative h-64 md:h-80">
                <img
                    src={`${IMAGE_BASE_URL}${project.image_path}`}
                    alt={project.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                {/* Back button */}
                <Link 
                    to="/ontdek"
                    className="absolute top-6 left-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Alle projecten
                </Link>

                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="max-w-4xl mx-auto">
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mb-3 ${status.color}`}>
                            {status.label}
                        </span>
                        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
                            {project.name}
                        </h1>
                        {project.business && (
                            <p className="text-white/80 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">business</span>
                                {project.business.name}
                                {project.business.location && (
                                    <>
                                        <span className="mx-2">•</span>
                                        <span className="material-symbols-outlined text-sm">location_on</span>
                                        {project.business.location}
                                    </>
                                )}
                            </p>
                        )}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto py-8 px-6">
                {/* Key info cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="neu-flat p-4 text-center">
                        <span className="material-symbols-outlined text-2xl text-primary mb-1">work</span>
                        <p className="text-2xl font-bold text-[var(--text-primary)]">{project.open_positions || 0}</p>
                        <p className="text-xs text-[var(--text-muted)]">Open plekken</p>
                    </div>
                    <div className="neu-flat p-4 text-center">
                        <span className="material-symbols-outlined text-2xl text-blue-500 mb-1">groups</span>
                        <p className="text-2xl font-bold text-[var(--text-primary)]">{project.total_positions || 0}</p>
                        <p className="text-xs text-[var(--text-muted)]">Totale plekken</p>
                    </div>
                    {project.start_date && (
                        <div className="neu-flat p-4 text-center">
                            <span className="material-symbols-outlined text-2xl text-emerald-500 mb-1">calendar_today</span>
                            <p className="text-sm font-bold text-[var(--text-primary)]">{formatDate(project.start_date)}</p>
                            <p className="text-xs text-[var(--text-muted)]">Startdatum</p>
                        </div>
                    )}
                    {project.end_date && (
                        <div className="neu-flat p-4 text-center">
                            <span className="material-symbols-outlined text-2xl text-orange-500 mb-1">event</span>
                            <p className="text-sm font-bold text-[var(--text-primary)]">{formatDate(project.end_date)}</p>
                            <p className="text-xs text-[var(--text-muted)]">Deadline</p>
                        </div>
                    )}
                </div>

                {/* Impact summary for completed projects */}
                {project.impact_summary && (
                    <div className="neu-flat p-6 mb-8 border-l-4 border-blue-500">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-blue-500 text-2xl">emoji_events</span>
                            <div>
                                <h3 className="font-bold text-[var(--text-primary)] mb-2">Impact & Resultaten</h3>
                                <p className="text-[var(--text-secondary)]">{project.impact_summary}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Description */}
                <div className="neu-flat p-6 mb-8">
                    <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">description</span>
                        Over dit project
                    </h3>
                    <div className="text-[var(--text-secondary)] prose max-w-none">
                        <RichTextViewer text={project.description} />
                    </div>
                </div>

                {/* Skills */}
                {project.skills && project.skills.length > 0 && (
                    <div className="neu-flat p-6 mb-8">
                        <h3 className="font-bold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">psychology</span>
                            Gevraagde skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {project.skills.map(skill => (
                                <span 
                                    key={skill}
                                    className="px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Location map */}
                {project.business?.location && (
                    <div className="neu-flat p-6 mb-8">
                        <button
                            onClick={() => setShowMap(!showMap)}
                            className="w-full flex items-center justify-between"
                        >
                            <h3 className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">location_on</span>
                                Locatie
                            </h3>
                            <span className={`material-symbols-outlined transition-transform ${showMap ? 'rotate-180' : ''}`}>
                                expand_more
                            </span>
                        </button>
                        {showMap && (
                            <div className="mt-4 rounded-xl overflow-hidden">
                                <LocationMap 
                                    address={project.business.location}
                                    name={project.business.name}
                                    height="200px"
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* CTA */}
                <div className="neu-flat p-8 text-center bg-gradient-to-r from-primary/5 to-orange-500/5">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                        Interesse in dit project?
                    </h3>
                    <p className="text-[var(--text-secondary)] mb-6">
                        Log in om je aan te melden en meer details te bekijken.
                    </p>
                    <Link to="/login" className="neu-btn-primary inline-flex items-center gap-2">
                        Inloggen om aan te melden
                        <span className="material-symbols-outlined">login</span>
                    </Link>
                </div>
            </main>
        </div>
    );
}
