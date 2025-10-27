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
                setAllSkills((data || []).map(normalizeSkill));
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
        const normalized = (skills || []).map(normalizeSkill);
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
        <div>
            <div className="flex flex-col justify-between items-stretch gap-3 mb-5 sm:flex-row sm:items-center bg-gray-100 p-2 rounded-lg shadow">
                <div className="sm:w-96">
                    <SkillsEditor
                        allSkills={allSkills}
                        initialSkills={selectedSkills}
                        isEditing={isEditing}
                        onSave={handleSave}
                        onCancel={() => setIsEditing(false)}
                        setError={setError}
                        showOwnSkillsOption={true}
                    >
                        <button className="btn-primary" onClick={() => setIsEditing(true)}>Filter op skills</button>
                    </SkillsEditor>
                </div>

                <div className="flex items-center gap-2">
                    <form onSubmit={handleSearch} className="flex w-full gap-2">
                        <div className="relative flex-1 sm:w-60">
                            <label className="sr-only" htmlFor="search">Zoek op bedrijfs- of projectnaam</label>
                            <input
                                id="search"
                                type="text"
                                placeholder="Zoek op bedrijfs- of projectnaam"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                maxLength={50}
                                className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset h-full placeholder:text-gray-400 sm:text-sm sm:leading-6 p-3"
                            />
                        </div>
                        <button type="submit" className="btn-primary" aria-label="Zoeken op bedrijfs- of projectnaam">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="18" height="18" ><path fill="#ffffff" d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" /></svg>
                        </button>

                        {search && (
                            <button className="btn-secondary" onClick={handleSearchClear} aria-label="Wis zoekopdracht">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="18" height="18"><path fill="#ffffff" d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>
                            </button>
                        )}
                    </form>
                </div>
            </div >
            {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {selectedSkills.map((skill) => (
                        <SkillBadge
                            key={skill.skillId ?? skill.name}
                            skillName={skill.name}
                            isPending={skill.isPending}
                        />
                    ))}
                    {!isEditing && (
                        <button className="btn-secondary py-1 px-3" onClick={handleSkillsClear}>Wis skills</button>
                    )}
                </div>
            )}
            <Alert text={error} />
        </div>
    );
}
