import { useEffect, useState, useMemo, useRef } from "react";
import { getSkills } from '../services';
import { normalizeSkill } from '../utils/skills';
import { useStudentSkills } from '../context/StudentSkillsContext';
import { useStudentWork } from '../context/StudentWorkContext';
import Alert from "./Alert";
import SkillsEditor from "./SkillsEditor";
import OverviewMap from "./OverviewMap";

/** Map sector names to distinctive Material Symbols icons */
const SECTOR_ICONS = {
    'agri': 'agriculture', 'food': 'restaurant', 'agri & food': 'agriculture',
    'technologie': 'memory', 'tech': 'memory', 'ict': 'dns', 'it': 'dns',
    'energie': 'bolt', 'energy': 'bolt',
    'zorg': 'health_and_safety', 'health': 'health_and_safety', 'gezondheid': 'health_and_safety',
    'bouw': 'construction', 'vastgoed': 'domain',
    'onderwijs': 'school', 'educatie': 'school',
    'logistiek': 'local_shipping', 'transport': 'local_shipping',
    'financ': 'account_balance', 'bank': 'account_balance',
    'overheid': 'gavel', 'publiek': 'gavel',
    'retail': 'storefront', 'winkel': 'storefront',
    'media': 'movie', 'communicatie': 'campaign',
    'duurzaam': 'eco', 'milieu': 'eco', 'groen': 'eco',
    'water': 'water_drop',
    'chemie': 'science', 'farmac': 'biotech',
    'creatief': 'palette', 'design': 'palette', 'kunst': 'palette',
    'juridisch': 'balance', 'recht': 'balance',
    'sport': 'sports_soccer', 'recreatie': 'sports_soccer',
    'horeca': 'restaurant_menu', 'toerisme': 'travel_explore',
    'consultancy': 'business_center', 'advies': 'business_center',
    'industrie': 'factory', 'productie': 'factory', 'maakindustrie': 'precision_manufacturing',
};

function getSectorIcon(sectorName) {
    const lower = sectorName.toLowerCase();
    // Exact match first
    if (SECTOR_ICONS[lower]) return SECTOR_ICONS[lower];
    // Partial match
    for (const [key, icon] of Object.entries(SECTOR_ICONS)) {
        if (lower.includes(key) || key.includes(lower)) return icon;
    }
    return 'category';
}

/**
 * Compact dropdown button with popover for scalable filter options.
 * Shows a search field when there are more than 8 options.
 * Optionally shows counts per option.
 */
function FilterDropdownButton({ label, icon, value, options, optionCounts, isOpen, searchQuery, onSearchChange, onToggle, onSelect }) {
    const SEARCH_THRESHOLD = 8;
    const showSearch = options.length > SEARCH_THRESHOLD;
    const filtered = searchQuery
        ? options.filter(o => o.toLowerCase().includes(searchQuery.toLowerCase()))
        : options;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={onToggle}
                className={`filter-dropdown-popover flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                    value
                        ? 'neu-pressed text-primary ring-1 ring-primary/20'
                        : isOpen
                            ? 'neu-pressed text-[var(--text-primary)]'
                            : 'neu-btn'
                }`}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
            >
                <span className="material-symbols-outlined text-sm" aria-hidden="true">{icon}</span>
                <span>{value || label}</span>
                <span className="material-symbols-outlined text-sm transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : '' }} aria-hidden="true">
                    expand_more
                </span>
            </button>

            {isOpen && (
                <div
                    className="filter-dropdown-popover absolute top-full left-0 mt-1.5 z-50 neu-flat rounded-xl p-2 min-w-[200px] max-w-[280px] animate-fade-in"
                    onClick={(e) => e.stopPropagation()}
                >
                    {showSearch && (
                        <div className="relative mb-2">
                            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm" aria-hidden="true">search</span>
                            <input
                                type="text"
                                placeholder={`Zoek ${label.toLowerCase()}...`}
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="neu-input w-full !pl-8 !pr-3 !py-1.5 !text-xs"
                                autoFocus
                            />
                        </div>
                    )}

                    <div className="max-h-[240px] overflow-y-auto space-y-0.5 scrollbar-thin">
                        <button
                            onClick={() => onSelect(null)}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                !value
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--gray-100)]'
                            }`}
                        >
                            Alles
                        </button>
                        {filtered.map(option => (
                            <button
                                key={option}
                                onClick={() => onSelect(option)}
                                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-between ${
                                    value === option
                                        ? 'bg-primary text-white'
                                        : 'text-[var(--text-secondary)] hover:bg-[var(--gray-100)]'
                                }`}
                            >
                                <span>{option}</span>
                                {optionCounts?.[option] != null && (
                                    <span className={`text-[10px] ${value === option ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                                        {optionCounts[option]}
                                    </span>
                                )}
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <p className="text-xs text-[var(--text-muted)] text-center py-3">Geen resultaten</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
* @param {{
*  onFilter: Function,
*  businesses?: Array<{id: string, name: string, location: string, projects: Array}>,
*  themes?: Array<{id: string, name: string, icon?: string, color?: string}>,
*  allBusinesses?: Array
*  }} props
* @returns {JSX.Element}
*/
export default function Filter({ onFilter, businesses = [], themes = [], allBusinesses = [] }) {
    const { studentSkills } = useStudentSkills();
    const { workingBusinessIds } = useStudentWork();
    const [allSkills, setAllSkills] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [search, setSearch] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [showMap, setShowMap] = useState(false);
    const [mapView, setMapView] = useState('businesses');
    const [showOnlyMatches, setShowOnlyMatches] = useState(false);
    const [showOnlyMyWork, setShowOnlyMyWork] = useState(false);
    
    const [selectedTheme, setSelectedTheme] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    
    const [selectedSector, setSelectedSector] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [selectedCompanySize, setSelectedCompanySize] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [dropdownSearch, setDropdownSearch] = useState('');
    
    // Debounced search ref
    const searchTimerRef = useRef(null);
    
    const studentSkillIds = useMemo(() => 
        new Set(studentSkills.map(s => s.skillId).filter(Boolean)), 
        [studentSkills]
    );

    const sourceBusinesses = allBusinesses.length > 0 ? allBusinesses : businesses;

    // Filter options with counts
    const filterOptions = useMemo(() => {
        const bList = sourceBusinesses.map(b => b.business || b);
        
        const sectorCounts = {};
        const locationCounts = {};
        const companySizeCounts = {};
        
        bList.forEach(b => {
            if (b.sector) sectorCounts[b.sector] = (sectorCounts[b.sector] || 0) + 1;
            const loc = (b.location || '').split(',')[0].trim();
            if (loc) locationCounts[loc] = (locationCounts[loc] || 0) + 1;
            if (b.companySize) companySizeCounts[b.companySize] = (companySizeCounts[b.companySize] || 0) + 1;
        });
        
        return {
            sectors: Object.keys(sectorCounts).sort(),
            locations: Object.keys(locationCounts).sort(),
            companySizes: Object.keys(companySizeCounts).sort(),
            sectorCounts,
            locationCounts,
            companySizeCounts
        };
    }, [sourceBusinesses]);

    // Theme counts
    const themeCounts = useMemo(() => {
        const counts = {};
        sourceBusinesses.flatMap(b => b.projects || []).forEach(p => {
            (p.themes || []).forEach(t => { counts[t.id] = (counts[t.id] || 0) + 1; });
        });
        return counts;
    }, [sourceBusinesses]);

    // Trigger filter with current state + overrides
    const triggerFilter = (overrides = {}) => {
        onFilter({
            searchInput: search,
            selectedSkills,
            sector: selectedSector,
            location: selectedLocation,
            companySize: selectedCompanySize,
            showOnlyMyWork,
            selectedTheme,
            statusFilter,
            ...overrides
        });
    };

    useEffect(() => {
        let ignore = false;
        getSkills()
            .then(data => {
                if (ignore) return;
                setAllSkills((data || []).map(normalizeSkill).filter(Boolean));
            })
            .catch(err => {
                if (ignore) return;
                setError(err.message);
            });
        return () => { ignore = true; }
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (!openDropdown) return;
        const handleClickOutside = (e) => {
            if (e.target.closest('.filter-dropdown-popover')) return;
            setOpenDropdown(null);
            setDropdownSearch('');
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [openDropdown]);

    // Debounced search handler
    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearch(val);
        clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            triggerFilter({ searchInput: val });
        }, 300);
    };

    const handleSearchClear = () => {
        clearTimeout(searchTimerRef.current);
        setSearch('');
        triggerFilter({ searchInput: '' });
    };

    const handleSave = (skills, keepOpen = false) => {
        const normalized = (skills || []).map(normalizeSkill).filter(Boolean);
        setSelectedSkills(normalized);
        if (!keepOpen) setIsEditing(false);
        triggerFilter({ selectedSkills: normalized });
    };

    const handleRemoveSkill = (skillToRemove) => {
        const newSkills = selectedSkills.filter(s => 
            (s.skillId || s.id) !== (skillToRemove.skillId || skillToRemove.id)
        );
        setSelectedSkills(newSkills);
        triggerFilter({ selectedSkills: newSkills });
    };

    const handleClearAll = () => {
        clearTimeout(searchTimerRef.current);
        setSelectedSector(null);
        setSelectedLocation(null);
        setSelectedCompanySize(null);
        setShowOnlyMyWork(false);
        setSelectedTheme(null);
        setStatusFilter('all');
        setSelectedSkills([]);
        setSearch('');
        triggerFilter({ 
            sector: null, location: null, companySize: null, 
            showOnlyMyWork: false, selectedTheme: null, statusFilter: 'all',
            selectedSkills: [], searchInput: ''
        });
    };

    // Map data
    const mapLocations = useMemo(() => {
        if (mapView === 'businesses') {
            return businesses.filter(b => b.location).map(b => {
                const matchCount = b.topSkills?.filter(s => studentSkillIds.has(s.skillId))?.length || 0;
                return { id: b.id, name: b.name, address: b.location, image: b.image, type: 'business', count: b.projects?.length || 0, matchCount };
            });
        }
        const locs = [];
        businesses.forEach(b => {
            if (b.location && b.projects) {
                b.projects.forEach(p => {
                    const projectSkills = p.tasks?.flatMap(t => t.skills || []) || [];
                    const matchCount = projectSkills.filter(s => studentSkillIds.has(s.skillId || s.id))?.length || 0;
                    locs.push({ id: p.projectId || p.id, name: p.title || p.name, address: b.location, image: b.image, type: 'project', businessName: b.name, matchCount });
                });
            }
        });
        return locs;
    }, [businesses, mapView, studentSkillIds]);

    const totalProjects = useMemo(() => businesses.reduce((sum, b) => sum + (b.projects?.length || 0), 0), [businesses]);
    const filteredMapLocations = useMemo(() => mapLocations.map(loc => ({ ...loc, isFilterMatch: loc.matchCount > 0 })), [mapLocations]);
    const matchingLocationsCount = useMemo(() => filteredMapLocations.filter(loc => loc.isFilterMatch).length, [filteredMapLocations]);
    const canShowMatching = studentSkills.length > 0;

    // Active filter chips
    const activeFilterChips = [];
    if (search.trim()) activeFilterChips.push({ label: `"${search}"`, onClear: handleSearchClear });
    if (showOnlyMyWork) activeFilterChips.push({ label: 'Mijn werk', onClear: () => { setShowOnlyMyWork(false); triggerFilter({ showOnlyMyWork: false }); } });
    if (statusFilter !== 'all') activeFilterChips.push({ label: statusFilter === 'active' ? 'Open' : 'Archief', onClear: () => { setStatusFilter('all'); triggerFilter({ statusFilter: 'all' }); } });
    if (selectedTheme) {
        const theme = themes.find(t => t.id === selectedTheme);
        activeFilterChips.push({ label: theme?.name || 'Thema', onClear: () => { setSelectedTheme(null); triggerFilter({ selectedTheme: null }); } });
    }
    if (selectedLocation) activeFilterChips.push({ label: selectedLocation, onClear: () => { setSelectedLocation(null); triggerFilter({ location: null }); } });
    if (selectedSector) activeFilterChips.push({ label: selectedSector, onClear: () => { setSelectedSector(null); triggerFilter({ sector: null }); } });
    if (selectedCompanySize) activeFilterChips.push({ label: selectedCompanySize, onClear: () => { setSelectedCompanySize(null); triggerFilter({ companySize: null }); } });
    selectedSkills.forEach(skill => {
        activeFilterChips.push({ label: skill.name, onClear: () => handleRemoveSkill(skill) });
    });
    const hasAnyFilter = activeFilterChips.length > 0;

    return (
        <div className="relative mb-8 max-w-5xl mx-auto">
            <div className="neu-flat p-4 sm:p-5">

                {/* === SINGLE ROW: Kaart | Search | Skills | Mijn werk | Status | Count === */}
                <div className="flex items-center gap-2 flex-wrap mb-4 pb-4 border-b border-[var(--neu-border)]">
                    {/* Kaart - ORANGE, first element */}
                    {businesses.length > 0 && (
                        <button 
                            type="button"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                                showMap ? 'neu-pressed text-primary' : 'neu-btn-primary'
                            }`}
                            onClick={() => setShowMap(!showMap)}
                            aria-expanded={showMap}
                        >
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">map</span>
                            <span className="hidden sm:inline">Kaart</span>
                        </button>
                    )}

                    {/* Search bar - debounced live search */}
                    <div className="relative flex-1 min-w-[180px] group">
                        <label className="sr-only" htmlFor="search">Zoek een organisatie of project</label>
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-lg group-focus-within:text-primary transition-colors" aria-hidden="true">
                            search
                        </span>
                        <input
                            id="search"
                            type="text"
                            placeholder="Zoek organisatie of project..."
                            value={search}
                            onChange={handleSearchChange}
                            maxLength={50}
                            className="neu-input w-full !pl-11 !pr-10 !py-2 text-sm"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={handleSearchClear}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-primary transition-colors cursor-pointer"
                                aria-label="Wis zoekopdracht"
                            >
                                <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
                            </button>
                        )}
                    </div>

                    {/* Skills */}
                    <button 
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-200 cursor-pointer ${
                            isEditing ? 'neu-pressed text-primary' : 'neu-btn'
                        }`}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={() => setIsEditing(!isEditing)}
                        aria-expanded={isEditing}
                    >
                        <span className="material-symbols-outlined text-sm" aria-hidden="true">
                            {isEditing ? 'expand_less' : 'filter_list'}
                        </span>
                        <span>Skills</span>
                        {selectedSkills.length > 0 && !isEditing && (
                            <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                {selectedSkills.length}
                            </span>
                        )}
                    </button>

                    {/* Mijn werk */}
                    {workingBusinessIds.size > 0 && (
                        <button 
                            type="button"
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all cursor-pointer ${
                                showOnlyMyWork ? 'neu-pressed text-primary ring-1 ring-primary/20' : 'neu-btn'
                            }`}
                            onClick={() => {
                                const newValue = !showOnlyMyWork;
                                setShowOnlyMyWork(newValue);
                                triggerFilter({ showOnlyMyWork: newValue });
                            }}
                            aria-pressed={showOnlyMyWork}
                        >
                            <span className="material-symbols-outlined text-sm" aria-hidden="true">work</span>
                            <span className="hidden sm:inline">Mijn werk</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                                showOnlyMyWork ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                            }`}>
                                {workingBusinessIds.size}
                            </span>
                        </button>
                    )}

                    {/* Status segment */}
                    <div className="neu-segment-container !p-1">
                        <button onClick={() => { setStatusFilter('all'); triggerFilter({ statusFilter: 'all' }); }} className={`neu-segment-btn !px-3 !py-1.5 !text-[11px] cursor-pointer ${statusFilter === 'all' ? 'active' : ''}`}>Alle</button>
                        <button onClick={() => { setStatusFilter('active'); triggerFilter({ statusFilter: 'active' }); }} className={`neu-segment-btn !px-3 !py-1.5 !text-[11px] cursor-pointer ${statusFilter === 'active' ? 'active' : ''}`}>Open</button>
                        <button onClick={() => { setStatusFilter('completed'); triggerFilter({ statusFilter: 'completed' }); }} className={`neu-segment-btn !px-3 !py-1.5 !text-[11px] cursor-pointer ${statusFilter === 'completed' ? 'active' : ''}`}>Archief</button>
                    </div>

                    {/* Live result count */}
                    <span className="text-[11px] text-[var(--text-muted)] font-medium ml-auto shrink-0 tabular-nums">
                        <span className="text-primary font-bold">{businesses.length}</span> {businesses.length === 1 ? 'organisatie' : 'organisaties'} &middot; <span className="text-primary font-bold">{totalProjects}</span> {totalProjects === 1 ? 'project' : 'projecten'}
                    </span>
                </div>

                {/* === Theme pills === */}
                {themes.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 -mx-1 px-1 mb-1">
                        <span className="neu-label shrink-0 mr-0.5">Thema&apos;s</span>
                        <button
                            onClick={() => { setSelectedTheme(null); triggerFilter({ selectedTheme: null }); }}
                            className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                                !selectedTheme ? 'bg-primary text-white' : 'text-[var(--text-muted)] hover:text-primary'
                            }`}
                        >
                            Alles
                        </button>
                        {themes.map(theme => {
                            const count = themeCounts[theme.id] || 0;
                            if (count === 0) return null;
                            return (
                                <button
                                    key={theme.id}
                                    onClick={() => { 
                                        const val = selectedTheme === theme.id ? null : theme.id;
                                        setSelectedTheme(val); 
                                        triggerFilter({ selectedTheme: val }); 
                                    }}
                                    className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                                        selectedTheme === theme.id ? 'text-white' : 'text-[var(--text-secondary)] hover:text-primary'
                                    }`}
                                    style={selectedTheme === theme.id && theme.color ? { backgroundColor: theme.color } : {}}
                                >
                                    {theme.icon && <span className="material-symbols-outlined text-[11px]" aria-hidden="true">{theme.icon}</span>}
                                    {theme.name}
                                    <span className="opacity-50">{count}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* === Sector pills === */}
                {filterOptions.sectors.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 -mx-1 px-1 mb-1">
                        <span className="neu-label shrink-0 mr-0.5">Sector</span>
                        <button
                            onClick={() => { setSelectedSector(null); triggerFilter({ sector: null }); }}
                            className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                                !selectedSector ? 'bg-primary text-white' : 'text-[var(--text-muted)] hover:text-primary'
                            }`}
                        >
                            Alles
                        </button>
                        {filterOptions.sectors.map(sector => {
                            const count = filterOptions.sectorCounts[sector] || 0;
                            return (
                                <button
                                    key={sector}
                                    onClick={() => { 
                                        const val = selectedSector === sector ? null : sector;
                                        setSelectedSector(val); 
                                        triggerFilter({ sector: val }); 
                                    }}
                                    className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                                        selectedSector === sector
                                            ? 'bg-[var(--text-primary)] text-white'
                                            : 'text-[var(--text-secondary)] hover:text-primary'
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[11px]" aria-hidden="true">{getSectorIcon(sector)}</span>
                                    {sector}
                                    <span className="opacity-50">{count}</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Skills editor panel */}
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
                    <></>
                </SkillsEditor>
            </div>

            {/* === Active filter chips === */}
            {hasAnyFilter && !isEditing && (
                <div className="flex flex-wrap items-center gap-1.5 mt-4 px-1">
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
                    {activeFilterChips.length > 1 && (
                        <button onClick={handleClearAll} className="text-[11px] font-bold text-[var(--text-muted)] hover:text-primary transition-colors ml-1 cursor-pointer">
                            Alles wissen
                        </button>
                    )}
                </div>
            )}

            {/* === Map section with Locatie dropdown in header === */}
            {showMap && businesses.length > 0 && (
                <div className="mt-4 neu-flat p-4 rounded-2xl animate-fade-in">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <div className="neu-segment-container">
                            <button className={`neu-segment-btn ${mapView === 'businesses' ? 'active' : ''}`} onClick={() => setMapView('businesses')}>
                                <span className="material-symbols-outlined text-sm mr-1">business</span>Bedrijven
                            </button>
                            <button className={`neu-segment-btn ${mapView === 'projects' ? 'active' : ''}`} onClick={() => setMapView('projects')}>
                                <span className="material-symbols-outlined text-sm mr-1">folder_open</span>Projecten
                            </button>
                        </div>

                        {/* Locatie dropdown - only in map context */}
                        {filterOptions.locations.length > 0 && (
                            <FilterDropdownButton
                                label="Locatie"
                                icon="location_on"
                                value={selectedLocation}
                                options={filterOptions.locations}
                                optionCounts={filterOptions.locationCounts}
                                isOpen={openDropdown === 'location'}
                                searchQuery={openDropdown === 'location' ? dropdownSearch : ''}
                                onSearchChange={setDropdownSearch}
                                onToggle={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'location' ? null : 'location'); setDropdownSearch(''); }}
                                onSelect={(val) => { setSelectedLocation(val); setOpenDropdown(null); setDropdownSearch(''); triggerFilter({ location: val }); }}
                            />
                        )}

                        {/* Grootte dropdown - only in map context for businesses */}
                        {mapView === 'businesses' && filterOptions.companySizes.length > 0 && (
                            <FilterDropdownButton
                                label="Grootte"
                                icon="apartment"
                                value={selectedCompanySize}
                                options={filterOptions.companySizes}
                                optionCounts={filterOptions.companySizeCounts}
                                isOpen={openDropdown === 'companySize'}
                                searchQuery={openDropdown === 'companySize' ? dropdownSearch : ''}
                                onSearchChange={setDropdownSearch}
                                onToggle={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === 'companySize' ? null : 'companySize'); setDropdownSearch(''); }}
                                onSelect={(val) => { setSelectedCompanySize(val); setOpenDropdown(null); setDropdownSearch(''); triggerFilter({ companySize: val }); }}
                            />
                        )}
                        
                        {canShowMatching && (
                            <button 
                                className={`neu-btn !py-1.5 !px-3 text-xs ${showOnlyMatches ? 'neu-pressed text-primary' : ''}`}
                                onClick={() => setShowOnlyMatches(!showOnlyMatches)}
                                aria-pressed={showOnlyMatches}
                            >
                                <span className="material-symbols-outlined text-sm mr-1">{showOnlyMatches ? 'close' : 'filter_alt'}</span>
                                {showOnlyMatches ? 'Toon alles' : 'Alleen matches'}
                            </button>
                        )}
                        
                        <span className="text-xs text-[var(--text-muted)] font-medium ml-auto">
                            {canShowMatching && matchingLocationsCount > 0 ? (
                                <>
                                    <span className="text-primary font-bold">{matchingLocationsCount}</span>
                                    {' van '}
                                    {mapView === 'businesses' 
                                        ? `${businesses.length} ${businesses.length === 1 ? 'organisatie' : 'organisaties'}` 
                                        : `${totalProjects} ${totalProjects === 1 ? 'project' : 'projecten'}`}
                                    {' matcht'}
                                </>
                            ) : (
                                mapView === 'businesses' 
                                    ? `${businesses.length} ${businesses.length === 1 ? 'organisatie' : 'organisaties'}` 
                                    : `${totalProjects} ${totalProjects === 1 ? 'project' : 'projecten'}`
                            )}
                        </span>
                    </div>
                    
                    <OverviewMap locations={filteredMapLocations} showOnlyMatches={showOnlyMatches} height="350px" />
                </div>
            )}

            <Alert text={error} />
        </div>
    );
}
