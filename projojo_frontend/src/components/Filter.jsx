import { useEffect, useState } from "react";
import { getSkills } from '../services';
import { normalizeSkill } from '../utils/skills';
import Alert from "./Alert";
import SkillBadge from './SkillBadge';
import SkillsEditor from "./SkillsEditor";

/**
* @param {{
*  onFilter: ({ searchInput: string, selectedSkills: {skillId: number, name: string, isPending?: boolean}[]}) => void
*  }} props
* @returns {JSX.Element}
*/
export default function Filter({ onFilter }) {
    const [allSkills, setAllSkills] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [search, setSearch] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');

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
                    >
                        <span className="material-symbols-outlined text-lg">
                            {isEditing ? 'expand_less' : 'filter_list'}
                        </span>
                        <span className="font-bold">Filter op skills</span>
                        {/* Badge: show selected count only when closed */}
                        {selectedSkills.length > 0 && !isEditing && (
                            <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
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
                            <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
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
                            <span className="material-symbols-outlined">search</span>
                        </button>

                        {search && (
                            <button 
                                type="button"
                                className="neu-btn !px-4" 
                                onClick={handleSearchClear} 
                                aria-label="Wis zoekopdracht"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        )}
                    </form>
                </div>
            </div>

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
                            <span className="material-symbols-outlined text-sm opacity-60 group-hover:opacity-100">close</span>
                        </button>
                    ))}
                    {selectedSkills.length > 1 && (
                        <button className="neu-btn !py-1.5 !px-3 text-xs" onClick={handleSkillsClear}>
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">delete_sweep</span>
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
