import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPublicProjects, getPublicProject, getThemes, IMAGE_BASE_URL } from '../services';
import PublicProjectCard from '../components/PublicProjectCard';
import SkeletonList from '../components/SkeletonList';
import Loading from '../components/Loading';
import RichTextViewer from '../components/RichTextViewer';
import LocationMap from '../components/LocationMap';
import OverviewMap from '../components/OverviewMap';
import { formatDate } from '../utils/dates';

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
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [showMap, setShowMap] = useState(false);

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

    // Active filter chips for display
    const activeFilterChips = [];
    if (activeFilter !== 'all') activeFilterChips.push({ label: activeFilter === 'active' ? 'Lopend' : 'Afgerond', onClear: () => setActiveFilter('all') });
    if (selectedTheme) {
        const theme = themes.find(t => t.id === selectedTheme);
        activeFilterChips.push({ label: theme?.name || 'Thema', onClear: () => setSelectedTheme(null) });
    }
    if (locationFilter) activeFilterChips.push({ label: locationFilter, onClear: () => setLocationFilter('') });
    if (searchTerm.trim()) activeFilterChips.push({ label: `"${searchTerm}"`, onClear: () => setSearchTerm('') });

    return (
        <div className="min-h-screen bg-[var(--neu-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
            {/* Hero section - Compact neumorphic with horizontal layout */}
            <section className="neu-flat-xl p-5 sm:p-8 relative overflow-hidden">
                {/* Subtle decorative accents */}
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

                <div className="relative">
                    <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-primary transition-colors mb-4 uppercase tracking-wide">
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
                        Home
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-8">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight mb-1.5">
                                Ontdek Projecten
                            </h1>
                            <p className="text-sm sm:text-base text-[var(--text-muted)] font-medium max-w-xl">
                                Bekijk lopende en afgeronde projecten van organisaties in de regio.
                            </p>
                        </div>

                        {/* Stats - Inline neumorphic counters */}
                        <div className="flex gap-3 shrink-0">
                            <div className="neu-pressed px-4 py-2.5 text-center rounded-xl min-w-[80px]">
                                <p className="text-lg sm:text-xl font-black text-primary leading-tight">{stats.total}</p>
                                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">projecten</p>
                            </div>
                            <div className="neu-pressed px-4 py-2.5 text-center rounded-xl min-w-[80px]">
                                <p className="text-lg sm:text-xl font-black text-primary leading-tight">{stats.totalPositions}</p>
                                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">open plekken</p>
                            </div>
                            <div className="neu-pressed px-4 py-2.5 text-center rounded-xl min-w-[80px]">
                                <p className="text-lg sm:text-xl font-black text-primary leading-tight">{stats.organizations}</p>
                                <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">organisaties</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Filter section - Neumorphic card */}
            <section className="neu-flat p-4 sm:p-5">
                {/* Search + status in one row on desktop */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    {/* Search bar */}
                    <div className="relative flex-1 group">
                        <label className="sr-only" htmlFor="public-search">Zoek een project of organisatie</label>
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-lg group-focus-within:text-primary transition-colors" aria-hidden="true">
                            search
                        </span>
                        <input
                            id="public-search"
                            type="text"
                            placeholder="Zoek project, organisatie of skill..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="neu-input w-full !pl-11 !pr-10 !py-2.5 text-sm"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-primary transition-colors cursor-pointer"
                                aria-label="Wis zoekopdracht"
                            >
                                <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
                            </button>
                        )}
                    </div>

                    {/* Status + Location filters in one line */}
                    <div className="flex items-center gap-2 shrink-0">
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

                        {/* Location filter */}
                        {locations.length > 0 && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                                    className={`neu-btn !py-1.5 !px-3 text-xs cursor-pointer ${locationFilter ? 'ring-2 ring-primary/30' : ''}`}
                                    aria-expanded={showLocationDropdown}
                                    aria-haspopup="listbox"
                                >
                                    <span className="material-symbols-outlined text-sm mr-0.5" aria-hidden="true">location_on</span>
                                    <span className="font-bold hidden sm:inline">{locationFilter || 'Locatie'}</span>
                                    <span className="material-symbols-outlined text-sm" aria-hidden="true">
                                        {showLocationDropdown ? 'expand_less' : 'expand_more'}
                                    </span>
                                </button>
                                {showLocationDropdown && (
                                    <div className="absolute top-full right-0 mt-2 z-50 neu-flat rounded-xl p-1.5 min-w-[200px] animate-fade-in" role="listbox">
                                        <button
                                            onClick={() => { setLocationFilter(''); setShowLocationDropdown(false); }}
                                            className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                                                !locationFilter
                                                    ? 'font-bold text-primary bg-primary/10'
                                                    : 'font-semibold text-[var(--text-primary)] hover:text-primary hover:bg-primary/5'
                                            }`}
                                            role="option"
                                            aria-selected={!locationFilter}
                                        >
                                            Alle locaties
                                        </button>
                                        {locations.map(loc => (
                                            <button
                                                key={loc}
                                                onClick={() => { setLocationFilter(loc); setShowLocationDropdown(false); }}
                                                className={`w-full text-left px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer ${
                                                    locationFilter === loc
                                                        ? 'font-bold text-primary bg-primary/10'
                                                        : 'font-semibold text-[var(--text-secondary)] hover:text-primary hover:bg-primary/5'
                                                }`}
                                                role="option"
                                                aria-selected={locationFilter === loc}
                                            >
                                                <span className="material-symbols-outlined text-[11px] mr-1 align-middle" aria-hidden="true">location_on</span>
                                                {loc}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Theme pills - compact single row with overflow */}
                {themes.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1 pb-1 -mx-1 px-1">
                        <span className="neu-label shrink-0 mr-0.5">Thema&apos;s</span>
                        <button
                            onClick={() => setSelectedTheme(null)}
                            className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                                !selectedTheme
                                    ? 'bg-primary text-white'
                                    : 'text-[var(--text-muted)] hover:text-primary'
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
                                    onClick={() => setSelectedTheme(selectedTheme === theme.id ? null : theme.id)}
                                    className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                                        selectedTheme === theme.id
                                            ? 'text-white'
                                            : 'text-[var(--text-secondary)] hover:text-primary'
                                    }`}
                                    style={selectedTheme === theme.id && theme.color ? { backgroundColor: theme.color } : {}}
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

                {/* Active filter chips */}
                {activeFilterChips.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-3 mt-3 border-t border-[var(--neu-border)]">
                        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">Actief:</span>
                        {activeFilterChips.map((chip, i) => (
                            <button
                                key={i}
                                onClick={chip.onClear}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer group"
                                aria-label={`Verwijder filter: ${chip.label}`}
                            >
                                {chip.label}
                                <span className="material-symbols-outlined text-xs opacity-50 group-hover:opacity-100" aria-hidden="true">close</span>
                            </button>
                        ))}
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setLocationFilter('');
                                setActiveFilter('all');
                                setSelectedTheme(null);
                            }}
                            className="text-[11px] font-bold text-[var(--text-muted)] hover:text-primary transition-colors ml-1 cursor-pointer"
                        >
                            Wis alles
                        </button>
                    </div>
                )}
            </section>

            {/* Content */}
            {isLoading ? (
                <SkeletonList count={6} variant="project" />
            ) : error ? (
                <div className="neu-flat p-12 text-center">
                    <span className="material-symbols-outlined text-5xl text-red-400 mb-4" aria-hidden="true">error</span>
                    <p className="text-[var(--text-muted)] font-medium">{error}</p>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="neu-flat p-12 text-center">
                    <span className="material-symbols-outlined text-5xl text-[var(--text-muted)] mb-3" aria-hidden="true">search_off</span>
                    <p className="text-lg font-bold text-[var(--text-primary)] mb-2">Geen projecten gevonden</p>
                    <p className="text-sm text-[var(--text-muted)] mb-4">Probeer je filters aan te passen</p>
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setLocationFilter('');
                            setActiveFilter('all');
                            setSelectedTheme(null);
                        }}
                        className="neu-btn-primary inline-flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined" aria-hidden="true">filter_alt_off</span>
                        Filters wissen
                    </button>
                </div>
            ) : (
                <>
                    {/* Results header + map toggle */}
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-[var(--text-muted)]">
                            <span className="text-lg text-[var(--text-primary)]">{filteredProjects.length}</span> {filteredProjects.length === 1 ? 'project' : 'projecten'} gevonden
                        </p>
                        <button
                            onClick={() => setShowMap(!showMap)}
                            className={`neu-btn !py-2 !px-3 text-xs ${showMap ? 'ring-2 ring-primary/30' : ''}`}
                            aria-expanded={showMap}
                            aria-label={showMap ? 'Verberg kaart' : 'Toon kaart'}
                        >
                            <span className="material-symbols-outlined text-sm mr-1" aria-hidden="true">map</span>
                            {showMap ? 'Verberg kaart' : 'Toon kaart'}
                        </button>
                    </div>

                    {/* Map section - collapsible */}
                    {showMap && (
                        <section className="neu-flat overflow-hidden animate-fade-in">
                            <OverviewMap
                                locations={filteredProjects
                                    .filter(p => p.business?.location)
                                    .map(p => ({
                                        id: p.id,
                                        name: p.name,
                                        address: p.business.location,
                                        type: 'project',
                                        businessName: p.business.name,
                                        image: p.business.image_path,
                                        linkTo: `/publiek/${p.id}`
                                    }))}
                                height="260px"
                            />
                        </section>
                    )}

                    {/* Project grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredProjects.map((project, index) => (
                            <PublicProjectCard key={project.id} project={project} index={index} />
                        ))}
                    </div>
                </>
            )}

            {/* CTA Footer - Neumorphic */}
            <section className="neu-flat-xl p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />
                <div className="relative flex flex-col sm:flex-row items-center gap-5 sm:gap-8">
                    <div className="neu-icon-container shrink-0">
                        <span className="material-symbols-outlined text-primary text-2xl" aria-hidden="true">rocket_launch</span>
                    </div>
                    <div className="text-center sm:text-left flex-1">
                        <h3 className="text-lg sm:text-xl font-black text-[var(--text-primary)] mb-1">
                            Wil je meewerken aan een project?
                        </h3>
                        <p className="text-sm text-[var(--text-muted)] font-medium">
                            Maak een account aan om je aan te melden en je portfolio op te bouwen.
                        </p>
                    </div>
                    <Link to="/login" className="neu-btn-primary inline-flex items-center gap-2 !px-6 !py-2.5 shrink-0">
                        Aan de slag
                        <span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_forward</span>
                    </Link>
                </div>
            </section>
        </div>
        </div>
    );
}

// Detail view component
function PublicProjectDetail({ projectId }) {
    const [project, setProject] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [detailShowMap, setDetailShowMap] = useState(false);

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
            <div className="min-h-screen bg-[var(--neu-bg)]">
                <div className="max-w-4xl mx-auto px-6 py-16">
                    <div className="neu-flat p-10 text-center">
                        <span className="material-symbols-outlined text-5xl text-[var(--text-muted)] mb-4" aria-hidden="true">search_off</span>
                        <h1 className="text-xl font-black text-[var(--text-primary)] mb-2">Project niet gevonden</h1>
                        <p className="text-sm text-[var(--text-muted)] mb-6">{error}</p>
                        <Link to="/publiek" className="neu-btn-primary inline-flex items-center gap-2">
                            <span className="material-symbols-outlined" aria-hidden="true">arrow_back</span>
                            Terug naar projecten
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Determine status
    const getStatus = () => {
        if (!project.end_date) return { label: 'Lopend', color: 'text-primary bg-primary/10 border border-primary/20' };
        const endDate = new Date(project.end_date);
        if (endDate < new Date()) return { label: 'Afgerond', color: 'text-[var(--text-muted)] bg-[var(--gray-200)] border border-[var(--neu-border)]' };
        return { label: 'Lopend', color: 'text-primary bg-primary/10 border border-primary/20' };
    };
    const status = getStatus();

    return (
        <div className="min-h-screen bg-[var(--neu-bg)]">
            {/* Hero header with image */}
            <header className="relative h-56 md:h-72">
                <img
                    src={`${IMAGE_BASE_URL}${project.image_path}`}
                    alt={project.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                
                {/* Back button */}
                <Link 
                    to="/publiek"
                    className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition-colors cursor-pointer"
                >
                    <span className="material-symbols-outlined text-base" aria-hidden="true">arrow_back</span>
                    Projecten
                </Link>

                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                    <div className="max-w-4xl mx-auto">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mb-2 ${status.color}`}>
                            {status.label}
                        </span>
                        <h1 className="text-2xl md:text-3xl font-black text-white leading-tight mb-1.5">
                            {project.name}
                        </h1>
                        {project.business && (
                            <p className="text-sm text-white/80 flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm" aria-hidden="true">business</span>
                                    {project.business.name}
                                </span>
                                {project.business.location && (
                                    <span className="inline-flex items-center gap-1">
                                        <span className="material-symbols-outlined text-sm" aria-hidden="true">location_on</span>
                                        {project.business.location}
                                    </span>
                                )}
                            </p>
                        )}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-5">
                {/* Key info cards - compact grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="neu-pressed p-3 text-center rounded-xl">
                        <span className="material-symbols-outlined text-lg text-primary mb-0.5" aria-hidden="true">work</span>
                        <p className="text-xl font-black text-[var(--text-primary)]">{project.open_positions || 0}</p>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">Open plekken</p>
                    </div>
                    <div className="neu-pressed p-3 text-center rounded-xl">
                        <span className="material-symbols-outlined text-lg text-primary mb-0.5" aria-hidden="true">groups</span>
                        <p className="text-xl font-black text-[var(--text-primary)]">{project.total_positions || 0}</p>
                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">Totale plekken</p>
                    </div>
                    {project.start_date && (
                        <div className="neu-pressed p-3 text-center rounded-xl">
                            <span className="material-symbols-outlined text-lg text-primary mb-0.5" aria-hidden="true">calendar_today</span>
                            <p className="text-sm font-bold text-[var(--text-primary)]">{formatDate(project.start_date)}</p>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">Startdatum</p>
                        </div>
                    )}
                    {project.end_date && (
                        <div className="neu-pressed p-3 text-center rounded-xl">
                            <span className="material-symbols-outlined text-lg text-primary mb-0.5" aria-hidden="true">event</span>
                            <p className="text-sm font-bold text-[var(--text-primary)]">{formatDate(project.end_date)}</p>
                            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wide">Deadline</p>
                        </div>
                    )}
                </div>

                {/* Impact summary for completed projects */}
                {project.impact_summary && (
                    <div className="neu-flat p-5 border-l-4 border-blue-500">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-primary text-xl" aria-hidden="true">emoji_events</span>
                            <div>
                                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Impact & Resultaten</h3>
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{project.impact_summary}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Description */}
                <div className="neu-flat p-5">
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-lg" aria-hidden="true">description</span>
                        Over dit project
                    </h3>
                    <div className="text-sm text-[var(--text-secondary)] prose prose-sm max-w-none leading-relaxed">
                        <RichTextViewer text={project.description} />
                    </div>
                </div>

                {/* Skills */}
                {project.skills && project.skills.length > 0 && (
                    <div className="neu-flat p-5">
                        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-lg" aria-hidden="true">psychology</span>
                            Gevraagde skills
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {project.skills.map(skill => (
                                <span 
                                    key={skill}
                                    className="skill-badge"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Location map - collapsible */}
                {project.business?.location && (
                    <div className="neu-flat p-5">
                        <button
                            onClick={() => setDetailShowMap(!detailShowMap)}
                            className="w-full flex items-center justify-between cursor-pointer"
                            aria-expanded={detailShowMap}
                        >
                            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-lg" aria-hidden="true">location_on</span>
                                Locatie — {project.business.location}
                            </h3>
                            <span className={`material-symbols-outlined text-[var(--text-muted)] transition-transform duration-200 ${detailShowMap ? 'rotate-180' : ''}`} aria-hidden="true">
                                expand_more
                            </span>
                        </button>
                        {detailShowMap && (
                            <div className="mt-3 rounded-xl overflow-hidden animate-fade-in">
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
                <div className="neu-flat-xl p-6 relative overflow-hidden">
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" aria-hidden="true" />
                    <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                        <div className="neu-icon-container-sm shrink-0">
                            <span className="material-symbols-outlined text-primary text-lg" aria-hidden="true">login</span>
                        </div>
                        <div className="text-center sm:text-left flex-1">
                            <h3 className="text-base font-black text-[var(--text-primary)] mb-0.5">
                                Interesse in dit project?
                            </h3>
                            <p className="text-xs text-[var(--text-muted)] font-medium">
                                Log in om je aan te melden en meer details te bekijken.
                            </p>
                        </div>
                        <Link to="/login" className="neu-btn-primary inline-flex items-center gap-2 shrink-0">
                            Inloggen
                            <span className="material-symbols-outlined text-lg" aria-hidden="true">arrow_forward</span>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
