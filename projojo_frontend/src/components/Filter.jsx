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

    const handleSave = (skills) => {
        const normalized = (skills || []).map(normalizeSkill).filter(Boolean);
        setSelectedSkills(normalized);
        setIsEditing(false);
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
                {/* Skills filter button */}
                <div className="sm:w-auto">
                    <SkillsEditor
                        allSkills={allSkills}
                        initialSkills={selectedSkills}
                        isEditing={isEditing}
                        onSave={handleSave}
                        onCancel={() => setIsEditing(false)}
                        setError={setError}
                        showOwnSkillsOption={true}
                    >
                        <button className="neu-btn flex items-center gap-2 text-sm" onClick={() => setIsEditing(true)}>
                            <span className="material-symbols-outlined text-lg">filter_list</span>
                            <span className="font-bold">Filter op skills</span>
                        </button>
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

            {/* Selected skills display */}
            {selectedSkills.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 mt-5">
                    <span className="neu-label">Actieve filters:</span>
                    {selectedSkills.map((skill) => (
                        <SkillBadge
                            key={skill.skillId}
                            skillName={skill.name}
                            isPending={skill.isPending}
                        />
                    ))}
                    {!isEditing && (
                        <button className="neu-btn !py-2 !px-4 text-xs" onClick={handleSkillsClear}>
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">close</span>
                                <span className="font-bold">Wis filters</span>
                            </span>
                        </button>
                    )}
                </div>
            )}

            <Alert text={error} />
        </div>
    );
}
