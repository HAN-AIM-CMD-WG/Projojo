import { useEffect, useState, useMemo } from "react";
import { getSkills } from '../services';
import { normalizeSkill } from '../utils/skills';
import { useStudentSkills } from '../context/StudentSkillsContext';
import Alert from "./Alert";
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
    
    // Create set of student skill IDs for matching
    const studentSkillIds = useMemo(() => 
        new Set(studentSkills.map(s => s.id)), 
        [studentSkills]
    );

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
        onFilter({
            searchInput: search,
            selectedSkills: normalized
        });
    };

    const handleSkillsClear = () => {
        setSelectedSkills([]);
        onFilter({
            searchInput: search,
            selectedSkills: []
        });
    };

    // Remove individual skill filter
    const handleRemoveSkill = (skillToRemove) => {
        const newSkills = selectedSkills.filter(s => 
            (s.skillId || s.id) !== (skillToRemove.skillId || skillToRemove.id)
        );
        setSelectedSkills(newSkills);
        onFilter({
            searchInput: search,
            selectedSkills: newSkills
        });
    };

    const handleSearch = (e) => {
        e.preventDefault();
        onFilter({
            searchInput: search,
            selectedSkills
        });
    };

    const handleSearchClear = (e) => {
        e.preventDefault();
        setSearch('');
        onFilter({
            searchInput: '',
            selectedSkills
        });
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

    return (
        <div className="relative mb-8">
            <div className="flex flex-col justify-between items-stretch gap-5 sm:flex-row sm:items-center neu-flat p-5 sm:p-6">
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

                {/* Map toggle button */}
                {businesses.length > 0 && (
                    <button 
                        type="button"
                        className={`neu-btn !px-4 shrink-0 ${showMap ? 'text-primary neu-pressed' : ''}`}
                        onClick={() => setShowMap(!showMap)}
                        aria-expanded={showMap}
                        aria-label={showMap ? 'Verberg kaart' : 'Toon kaart'}
                    >
                        <span className="material-symbols-outlined" aria-hidden="true">
                            {showMap ? 'map' : 'map'}
                        </span>
                    </button>
                )}
            </div>

            {/* Map section - expandable */}
            {showMap && businesses.length > 0 && (
                <div className="mt-4 neu-flat p-4 rounded-2xl animate-fade-in">
                    {/* View toggle */}
                    <div className="flex items-center gap-4 mb-4">
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
                        <span className="text-xs text-[var(--text-muted)] font-medium">
                            {mapView === 'businesses' 
                                ? `${businesses.length} ${businesses.length === 1 ? 'bedrijf' : 'bedrijven'}` 
                                : `${totalProjects} ${totalProjects === 1 ? 'project' : 'projecten'}`}
                        </span>
                    </div>
                    
                    {/* Map */}
                    <OverviewMap 
                        locations={mapLocations}
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
