import { useEffect, useState } from "react";
import { getSkills } from '../services';
import Alert from "./Alert";
import SkillBadge from './SkillBadge';
import SkillsEditor from "./SkillsEditor3";
import SearchField from './SearchField';
import { FunnelPlus, Search, X, Skull } from "lucide-react";
import OneButtonForm from "./OneButtonForm";

/**
* @param {{
*  onFilter: ({ searchInput: string, selectedSkills: {skillId: number, name: string, isPending?: boolean}[]}) => void
*  }} props
* @returns {JSX.Element}
*/
export default function Filter({ onFilter }) {
    const [allSkills, setAllSkills] = useState([]);
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let ignore = false;

        getSkills()
            .then(data => {
                if (ignore) return;
                setAllSkills(data);
            })
            .catch(err => {
                if (ignore) return;
                setError(err.message);
            });

        return () => {
            ignore = true;
        }
    }, []);

    // Track current search term from SearchField
    const [currentSearchTerm, setCurrentSearchTerm] = useState('');

    const handleSave = (skills) => {
        setSelectedSkills(skills);
        setIsEditing(false);
        onFilter({
            searchInput: currentSearchTerm,
            selectedSkills: skills
        });
    };

    const handleSkillsClear = () => {
        setSelectedSkills([]);
        onFilter({
            searchInput: currentSearchTerm,
            selectedSkills: []
        });
    };

    const handleSearchChange = (searchTerm) => {
        setCurrentSearchTerm(searchTerm);
        onFilter({
            searchInput: searchTerm,
            selectedSkills
        });
    };

    return (
        <div>
            <OneButtonForm initialState={{ search: '', skills: [] }}
                onAction={(formData) => console.log(formData)}
                actionLabel= {<Search />}
                resetLabel={<X />}
                buttonClassName="rounded-full transition-colors"
                className="flex flex-row items-center w-full p-1 rounded-full bg-gray-100 rounded shadow-md mx-auto my-8 justify-end">
                <input
                    type="text"
                    name="search"
                    placeholder="zoek op bedrijfs- of projectnaam..."
                    className="pl-4 pr-2 max-w-[200ch] w-[70ch] focus:outline-none text-ellipsis overflow-hidden whitespace-nowrap text-sm" />
                <SkillsEditor
                    name="skills"
                    value={selectedSkills}
                    allSkills={allSkills}
                    isAllowedToAddSkill={true}
                    showOwnSkillsOption={true}
                >
                    <span className="text-xs shrink-0 basis-[min-content] text-nowrap">
                    <Skull className="inline-block mr-1 w-4 h-4" />
                    {/* <FunnelPlus className="inline-block mr-1 w-4 h-4" /> */}
                        skills
                    </span>
                </SkillsEditor>
            </OneButtonForm>
            
         
            <Alert text={error} />
        </div>
    );
}