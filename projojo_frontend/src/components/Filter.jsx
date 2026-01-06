import { useEffect, useState, useMemo } from "react";
import { getSkills } from '../services';
import { normalizeSkill } from '../utils/skills';
import { useStudentSkills } from '../context/StudentSkillsContext';
import Alert from "./Alert";
import FilterChip from "./FilterChip";
import SkillBadge from './SkillBadge';
import SkillsEditor from "./SkillsEditor";
import OverviewMap from "./OverviewMap";

/**
* @param {{
*  onFilter: ({ searchInput: string, selectedSkills: {skillId: number, name: string, isPending?: boolean}[]}) => void,
*  businesses?: Array<{id: string, name: string, location: string, projects: Array}>
*  }} props
* @returns {JSX.Element}
*/
export default function Filter({ onFilter, businesses = [] }) {
    const { studentSkills } = useStudentSkills();
    const [allSkills, setAllSkills] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [search, setSearch] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [showMap, setShowMap] = useState(false);
    const [mapView, setMapView] = useState('businesses'); // 'businesses' | 'projects'
    const [showOnlyMatches, setShowOnlyMatches] = useState(false);
    
    // Quick filter chips state
    const [selectedCountry, setSelectedCountry] = useState(null);
    const [selectedSector, setSelectedSector] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedCompanySize, setSelectedCompanySize] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(null); // 'location' | 'sector' | 'companySize' | null
    const [showLocationPanel, setShowLocationPanel] = useState(false);
    
    // Create set of student skill IDs for matching
    const studentSkillIds = useMemo(() => 
        new Set(studentSkills.map(s => s.id)), 
        [studentSkills]
    );

    // Get unique filter options from businesses data
    const filterOptions = useMemo(() => {
        const countries = [...new Set(businesses.map(b => b.country || 'Nederland').filter(Boolean))].sort();
        
        // Filter locations based on selected country (cascading dropdown)
        const filteredBusinesses = selectedCountry 
            ? businesses.filter(b => (b.country || 'Nederland') === selectedCountry)
            : businesses;
        
        const locations = [...new Set(filteredBusinesses.map(b => {
            // Extract city from location string (e.g., "Arnhem, centrum" -> "Arnhem")
            const loc = b.location || '';
            return loc.split(',')[0].trim();
        }).filter(Boolean))].sort();
        
        const sectors = [...new Set(businesses.map(b => b.sector).filter(Boolean))].sort();
        const companySizes = [...new Set(businesses.map(b => b.companySize).filter(Boolean))].sort();
        
        return { countries, locations, sectors, companySizes };
    }, [businesses, selectedCountry]);

    // Trigger filter with current state + overrides
    const triggerFilter = (overrides = {}) => {
        onFilter({
            searchInput: search,
            selectedSkills,
            country: selectedCountry,
            sector: selectedSector,
            location: selectedLocation,
            companySize: selectedCompanySize,
            ...overrides
        });
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            // Don't close if clicking inside the location panel
            if (showLocationPanel && e.target.closest('.location-panel')) return;
            setOpenDropdown(null);
            setShowLocationPanel(false);
        };
        if (openDropdown || showLocationPanel) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [openDropdown, showLocationPanel]);

    useEffect(() => {
        let ignore = false;

        getSkills()
            .then(data => {
                if (ignore) return;
                // Normalize skills from backend before storing in state
                setAllSkills((data || []).map(normalizeSkill).filter(Boolean));
            })
            .catch(err => {
                if (ignore) return;
                setError(err.message);
            });

        return () => {
            ignore = true;
        }
    }, []);

    const handleSave = (skills, keepOpen = false) => {
        const normalized = (skills || []).map(normalizeSkill).filter(Boolean);
        setSelectedSkills(normalized);
        // Don't close when in instant apply mode (keepOpen from SkillsEditor)
        if (!keepOpen) {
        setIsEditing(false);
        }
        triggerFilter({ selectedSkills: normalized });
    };

    const handleSkillsClear = () => {
        setSelectedSkills([]);
        triggerFilter({ selectedSkills: [] });
    };

    // Remove individual skill filter
    const handleRemoveSkill = (skillToRemove) => {
        const newSkills = selectedSkills.filter(s => 
            (s.skillId || s.id) !== (skillToRemove.skillId || skillToRemove.id)
        );
        setSelectedSkills(newSkills);
        triggerFilter({ selectedSkills: newSkills });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        triggerFilter();
    };

    const handleSearchClear = (e) => {
        e.preventDefault();
        setSearch('');
        triggerFilter({ searchInput: '' });
    };

    // Clear all quick filters
    const handleClearAllQuickFilters = () => {
        setSelectedCountry(null);
        setSelectedSector(null);
        setSelectedLocation(null);
        setSelectedCompanySize(null);
        triggerFilter({ country: null, sector: null, location: null, companySize: null });
    };

    // Compute map locations based on view
    const mapLocations = useMemo(() => {
        if (mapView === 'businesses') {
            return businesses
                .filter(b => b.location)
                .map(b => {
                    // Calculate skill matches for business
                    const matchCount = b.topSkills?.filter(s => studentSkillIds.has(s.skillId))?.length || 0;
                    return {
                        id: b.id,
                        name: b.name,
                        address: b.location,
                        image: b.image,
                        type: 'business',
                        count: b.projects?.length || 0,
                        matchCount: matchCount
                    };
                });
        } else {
            // Projects view - use business location for now (projects don't have own location yet)
            const projectLocations = [];
            businesses.forEach(b => {
                if (b.location && b.projects) {
                    b.projects.forEach(p => {
                        // Get all skills from project tasks
                        const projectSkills = p.tasks?.flatMap(t => t.skills || []) || [];
                        const matchCount = projectSkills.filter(s => studentSkillIds.has(s.skillId || s.id))?.length || 0;
                        
                        projectLocations.push({
                            id: p.projectId || p.id,
                            name: p.title || p.name,
                            address: b.location, // Use business location
                            image: b.image, // Use business image
                            type: 'project',
                            businessName: b.name,
                            matchCount: matchCount
        });
                    });
                }
            });
            return projectLocations;
        }
    }, [businesses, mapView, studentSkillIds]);

    // Count totals for display
    const totalProjects = useMemo(() => 
        businesses.reduce((sum, b) => sum + (b.projects?.length || 0), 0),
        [businesses]
    );

    // Determine which locations match student skills (for map highlighting)
    const filteredMapLocations = useMemo(() => {
        return mapLocations.map(loc => {
            // A location "matches" if it has skills that match the student's skills
            const isMatch = loc.matchCount > 0;
            return { ...loc, isFilterMatch: isMatch };
        });
    }, [mapLocations]);

    // Count matching locations
    const matchingLocationsCount = useMemo(() => 
        filteredMapLocations.filter(loc => loc.isFilterMatch).length,
        [filteredMapLocations]
    );

    // Check if there are active filters (including quick filters)
    const hasActiveFilters = search.trim() || selectedSkills.length > 0 || selectedCountry || selectedSector || selectedLocation || selectedCompanySize;
    const hasQuickFilters = selectedCountry || selectedSector || selectedLocation || selectedCompanySize;
    // Show matching toggle only when student has skills (so matching is meaningful)
    const canShowMatching = studentSkills.length > 0;

    return (
        <div className="relative mb-8">
            <div className="neu-flat p-5 sm:p-6">
                {/* Quick filter chips - inside the search bar container */}
                <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-[var(--neu-border)]" onClick={(e) => e.stopPropagation()}>
                    {/* Location dropdown button with panel */}
                    <div className="relative">
                        <button
                            type="button"
                            className={`flex items-center gap-2 neu-btn !py-2 !px-3 text-sm ${
                                (selectedCountry || selectedLocation) ? 'ring-2 ring-primary/30' : ''
                            }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowLocationPanel(!showLocationPanel);
                                setOpenDropdown(null);
                            }}
                            aria-expanded={showLocationPanel}
                            aria-haspopup="true"
                        >
                            <span className="material-symbols-outlined text-base" aria-hidden="true">location_on</span>
                            <span className="font-bold">Locatie</span>
                            {(selectedCountry || selectedLocation) && (
                                <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                    {(selectedCountry ? 1 : 0) + (selectedLocation ? 1 : 0)}
                                </span>
                            )}
                            <span className="material-symbols-outlined text-base" aria-hidden="true">
                                {showLocationPanel ? 'expand_less' : 'expand_more'}
                            </span>
                        </button>

                        {/* Location panel dropdown */}
                        {showLocationPanel && (
                            <div 
                                className="location-panel absolute top-full left-0 mt-2 z-50 neu-flat rounded-xl p-4 min-w-[280px] animate-fade-in"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="space-y-4">
                                    {/* Land dropdown */}
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">Land</label>
                                        <select
                                            value={selectedCountry || ''}
                                            onChange={(e) => {
                                                const val = e.target.value || null;
                                                setSelectedCountry(val);
                                                // Reset plaats wanneer land wijzigt
                                                setSelectedLocation(null);
                                                triggerFilter({ country: val, location: null });
                                            }}
                                            className="w-full px-3 py-2 neu-pressed rounded-lg text-sm text-[var(--text-primary)] font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                                        >
                                            <option value="">Alle landen</option>
                                            {filterOptions.countries.map(country => (
                                                <option key={country} value={country}>{country}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Stad dropdown */}
                                    <div>
                                        <label className="block text-xs font-bold text-[var(--text-muted)] mb-1.5">Stad</label>
                                        <select
                                            value={selectedLocation || ''}
                                            onChange={(e) => {
                                                const val = e.target.value || null;
                                                setSelectedLocation(val);
                                                triggerFilter({ location: val });
                                            }}
                                            className="w-full px-3 py-2 neu-pressed rounded-lg text-sm text-[var(--text-primary)] font-semibold focus:ring-2 focus:ring-primary/20 transition-all"
                                        >
                                            <option value="">Alle steden</option>
                                            {filterOptions.locations.map(loc => (
                                                <option key={loc} value={loc}>{loc}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Clear location filters */}
                                    {(selectedCountry || selectedLocation) && (
                                        <button 
                                            type="button"
                                            className="w-full text-center text-xs text-[var(--text-muted)] hover:text-primary transition-colors py-1"
                                            onClick={() => {
                                                setSelectedCountry(null);
                                                setSelectedLocation(null);
                                                triggerFilter({ country: null, location: null });
                                            }}
                                        >
                                            Locatiefilters wissen
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Map toggle button - standalone coral filled */}
                    {businesses.length > 0 && (
                        <button 
                            type="button"
                            className={`flex items-center gap-2 !py-2 !px-3 text-sm font-bold rounded-xl transition-all ${
                                showMap 
                                    ? 'neu-pressed text-primary' 
                                    : 'neu-btn-primary'
                            }`}
                            onClick={() => setShowMap(!showMap)}
                            aria-expanded={showMap}
                            aria-label={showMap ? 'Verberg kaart' : 'Toon kaart'}
                        >
                            <span className="material-symbols-outlined text-base" aria-hidden="true">map</span>
                            <span className="hidden sm:inline">Kaart</span>
                        </button>
                    )}

                    {/* Business filters - separate group */}
                    <div className="flex items-center gap-2">
                        <FilterChip
                            label="Sector"
                            icon="category"
                            value={selectedSector}
                            options={filterOptions.sectors}
                            isOpen={openDropdown === 'sector'}
                            onToggle={() => {
                                setOpenDropdown(openDropdown === 'sector' ? null : 'sector');
                                setShowLocationPanel(false);
                            }}
                            onSelect={(val) => {
                                setSelectedSector(val);
                                setOpenDropdown(null);
                                triggerFilter({ sector: val });
                            }}
                            onClear={() => {
                                setSelectedSector(null);
                                triggerFilter({ sector: null });
                            }}
                        />

                        <FilterChip
                            label="Bedrijfsgrootte"
                            icon="apartment"
                            value={selectedCompanySize}
                            options={filterOptions.companySizes}
                            isOpen={openDropdown === 'companySize'}
                            onToggle={() => {
                                setOpenDropdown(openDropdown === 'companySize' ? null : 'companySize');
                                setShowLocationPanel(false);
                            }}
                            onSelect={(val) => {
                                setSelectedCompanySize(val);
                                setOpenDropdown(null);
                                triggerFilter({ companySize: val });
                            }}
                            onClear={() => {
                                setSelectedCompanySize(null);
                                triggerFilter({ companySize: null });
                            }}
                        />
                    </div>

                    {/* Clear all quick filters button */}
                    {hasQuickFilters && (
                        <button 
                            className="neu-btn !py-1.5 !px-3 text-xs ml-auto"
                            onClick={handleClearAllQuickFilters}
                            aria-label="Wis alle snelle filters"
                        >
                            <span className="material-symbols-outlined text-sm mr-1" aria-hidden="true">filter_alt_off</span>
                            Wis
                        </button>
                    )}
                </div>

                {/* Main filter bar */}
                <div className="flex flex-col justify-between items-stretch gap-5 sm:flex-row sm:items-center">
                {/* Skills filter - integrated button/panel */}
                <div className="sm:w-auto relative">
                    {/* Toggle button - transforms when open */}
                    <button 
                        className={`flex items-center gap-2 text-sm transition-all duration-200 ${
                            isEditing 
                                ? 'neu-pressed px-4 py-2.5 rounded-xl text-primary' 
                                : 'neu-btn'
                        }`}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => setIsEditing(!isEditing)}
                        aria-expanded={isEditing}
                        aria-controls="skills-filter-panel"
                    >
                        <span className="material-symbols-outlined text-lg" aria-hidden="true">
                            {isEditing ? 'expand_less' : 'filter_list'}
                        </span>
                        <span className="font-bold">Filter op skills</span>
                        {/* Badge: show selected count only when closed */}
                        {selectedSkills.length > 0 && !isEditing && (
                            <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center" aria-label={`${selectedSkills.length} filters actief`}>
                                {selectedSkills.length}
                            </span>
                        )}
                    </button>

                    {/* Skills editor panel - appears below button */}
                    <SkillsEditor
                        allSkills={allSkills}
                        initialSkills={selectedSkills}
                        isEditing={isEditing}
                        onSave={handleSave}
                        onCancel={() => setIsEditing(false)}
                        setError={setError}
                        showOwnSkillsOption={true}
                        hideSelectedSkills={true}
                        instantApply={true}
                    >
                        {/* Empty children - button is above */}
                        <></>
                    </SkillsEditor>
                </div>

                {/* Search form */}
                <div className="flex-1 max-w-xl">
                    <form onSubmit={handleSearch} className="flex w-full gap-3">
                        <div className="relative flex-1 group">
                            <label className="sr-only" htmlFor="search">Zoek een bedrijf of project</label>
                            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" aria-hidden="true">
                                search
                            </span>
                            <input
                                id="search"
                                type="text"
                                placeholder="Zoek een bedrijf of project..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                maxLength={50}
                                className="neu-input w-full pl-14 pr-6 text-sm"
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="neu-btn-primary !px-5" 
                            aria-label="Zoeken op bedrijfs- of projectnaam"
                        >
                            <span className="material-symbols-outlined" aria-hidden="true">search</span>
                        </button>

                        {search && (
                            <button 
                                type="button"
                                className="neu-btn !px-4" 
                                onClick={handleSearchClear} 
                                aria-label="Wis zoekopdracht"
                            >
                                <span className="material-symbols-outlined" aria-hidden="true">close</span>
                            </button>
                        )}
                    </form>
                </div>

                </div>
            </div>

            {/* Map section - expandable */}
            {showMap && businesses.length > 0 && (
                <div className="mt-4 neu-flat p-4 rounded-2xl animate-fade-in">
                    {/* View toggle and filter options */}
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                        <div className="neu-segment-container">
                            <button 
                                className={`neu-segment-btn ${mapView === 'businesses' ? 'active' : ''}`}
                                onClick={() => setMapView('businesses')}
                            >
                                <span className="material-symbols-outlined text-sm mr-1">business</span>
                                Bedrijven
                            </button>
                            <button 
                                className={`neu-segment-btn ${mapView === 'projects' ? 'active' : ''}`}
                                onClick={() => setMapView('projects')}
                            >
                                <span className="material-symbols-outlined text-sm mr-1">folder_open</span>
                                Projecten
                            </button>
                        </div>
                        
                        {/* Show only matches toggle - only visible when student has skills */}
                        {canShowMatching && (
                            <button 
                                className={`neu-btn !py-1.5 !px-3 text-xs ${showOnlyMatches ? 'neu-pressed text-primary' : ''}`}
                                onClick={() => setShowOnlyMatches(!showOnlyMatches)}
                                aria-pressed={showOnlyMatches}
                            >
                                <span className="material-symbols-outlined text-sm mr-1">
                                    {showOnlyMatches ? 'close' : 'filter_alt'}
                                </span>
                                {showOnlyMatches ? 'Toon alles' : 'Alleen mijn matches'}
                            </button>
                        )}
                        
                        <span className="text-xs text-[var(--text-muted)] font-medium ml-auto">
                            {canShowMatching && matchingLocationsCount > 0 ? (
                                <>
                                    <span className="text-primary font-bold">{matchingLocationsCount}</span>
                                    {' van '}
                                    {mapView === 'businesses' 
                                        ? `${businesses.length} ${businesses.length === 1 ? 'bedrijf' : 'bedrijven'}` 
                                        : `${totalProjects} ${totalProjects === 1 ? 'project' : 'projecten'}`}
                                    {' matcht jouw skills'}
                                </>
                            ) : (
                                mapView === 'businesses' 
                                    ? `${businesses.length} ${businesses.length === 1 ? 'bedrijf' : 'bedrijven'}` 
                                    : `${totalProjects} ${totalProjects === 1 ? 'project' : 'projecten'}`
                            )}
                        </span>
                    </div>
                    
                    {/* Map */}
                    <OverviewMap 
                        locations={filteredMapLocations}
                        showOnlyMatches={showOnlyMatches}
                        height="350px"
                    />
                </div>
            )}

            {/* Selected skills display with individual remove buttons */}
            {selectedSkills.length > 0 && !isEditing && (
                <div className="flex flex-wrap items-center gap-3 mt-5">
                    <span className="neu-label">Actieve filters:</span>
                    {selectedSkills.map((skill) => (
                        <button
                            key={skill.skillId || skill.id}
                            onClick={() => handleRemoveSkill(skill)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 hover:border-primary/50 transition-all group"
                            aria-label={`Verwijder filter ${skill.name}`}
                        >
                            {skill.name}
                            <span className="material-symbols-outlined text-sm opacity-60 group-hover:opacity-100" aria-hidden="true">close</span>
                        </button>
                    ))}
                    {selectedSkills.length > 1 && (
                        <button className="neu-btn !py-1.5 !px-3 text-xs" onClick={handleSkillsClear} aria-label="Alle filters wissen">
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm" aria-hidden="true">delete_sweep</span>
                                <span className="font-bold">Alles wissen</span>
                            </span>
                        </button>
                    )}
                </div>
            )}

            <Alert text={error} />
        </div>
    );
}
