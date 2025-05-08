import { useEffect, useState } from "react";
import { createSkill, getUser } from "../services";
import { useAuth } from "./AuthProvider";
import SkillBadge from "./SkillBadge";

/**
 * @param {{
 *  children: React.ReactNode,
 *  allSkills: {skillId: number, name: string}[],
 *  initialSkills: {skillId: number, name: string}[],
 *  isEditing: boolean,
 *  onSave: (newSkills: {skillId: number, name: string}[]) => void,
 *  onCancel: () => void
 *  setError: (error: string) => void
 *  isAllowedToAddSkill?: boolean
 *  isAbsolute?: boolean
 *  maxSkillsDisplayed?: number
 *  showOwnSkillsOption?: boolean
 *  }} props
 * @returns {JSX.Element}
 */
export default function SkillsEditor({ children, allSkills, initialSkills, isEditing, onSave, onCancel, setError, isAllowedToAddSkill = false, isAbsolute = true, maxSkillsDisplayed = 20, showOwnSkillsOption = false }) {
    const { authData } = useAuth();
    const [search, setSearch] = useState('')
    const [selectedSkills, setSelectedSkills] = useState(initialSkills)
    const formattedSearch = search.trim().replace(/\s+/g, ' ')
    const [showAllSkills, setShowAllSkills] = useState(false)
    const [onlyShowStudentsSkills, setOnlyShowStudentsSkills] = useState(false)
    const [studentsSkills, setStudentsSkills] = useState([])

    const isSearchInString = (search, string) => string.toLowerCase().includes(search.toLowerCase())

    const filteredSkills = allSkills
        .filter(skill =>
            isSearchInString(formattedSearch, skill.name) && !selectedSkills.some(s => s.skillId === skill.skillId)
        )
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(skill => !showOwnSkillsOption || authData.type !== 'student' || !onlyShowStudentsSkills || (onlyShowStudentsSkills && studentsSkills.includes(skill.skillId)))

    const searchedSkillExists = allSkills.some(skill => isSearchInString(formattedSearch, skill.name)) || selectedSkills.some(skill => isSearchInString(formattedSearch, skill.name))

    const toggleSkill = (skill) => {
        setSelectedSkills(currentSelectedSkills => {
            // .some returns true if the condition is met for at least one element
            if (currentSelectedSkills.some(s => s.skillId === skill.skillId)) {
                return currentSelectedSkills.filter(s => s.skillId !== skill.skillId)
            } else {
                return [...currentSelectedSkills, skill]
            }
        })
        setSearch('')
    }

    const handleSave = () => {
        setSearch('')
        setShowAllSkills(false)
        onSave(selectedSkills)
    }

    const handleCancel = () => {
        setSearch('')
        setShowAllSkills(false)
        setSelectedSkills(initialSkills)
        onCancel()
    }

    const handleCreateSkill = () => {
        if (!isAllowedToAddSkill || searchedSkillExists) return

        createSkill(formattedSearch)
            .then(skill => {
                setSelectedSkills(currentSelectedSkills => [...currentSelectedSkills, skill])
                setSearch('')
            })
            .catch((error) => {
                setError(error.message)
            })
    }

    useEffect(() => {
        setSelectedSkills(initialSkills)
    }, [initialSkills])

    useEffect(() => {
        let ignore = false

        if (authData.type === 'student') {
            getUser(authData.userId)
                .then(data => {
                    if (ignore) return
                    // Handle the new API response format
                    if (data.skill_ids) {
                        // If we have skill_ids directly in the user object
                        setStudentsSkills(data.skill_ids)
                    } else if (data.skills) {
                        // If we have a skills array
                        setStudentsSkills(data.skills.map(skill => skill.id))
                    }
                })
                .catch(() => {
                    if (ignore) return
                    showOwnSkillsOption = false
                })
        }

        return () => {
            ignore = true
        }
    }, [authData.isLoading])

    if (!isEditing) {
        return children
    }

    return (
        <div className="flex flex-col gap-2 relative">
            <div className="flex flex-wrap gap-2 items-center">
                {selectedSkills.length === 0 && <span>Er zijn geen skills geselecteerd.</span>}
                {selectedSkills.map((skill) => (
                    <SkillBadge key={skill.skillId} skillName={skill.name} isPending={skill.isPending} onClick={() => toggleSkill(skill)} ariaLabel={`Verwijder ${skill.name}`}>
                        <span className="ps-1 font-bold text-xl leading-3">×</span>
                    </SkillBadge>
                ))}
            </div>
            <div className={`${isAbsolute && 'absolute bottom-0 translate-y-full -mb-2 z-10'} flex flex-col gap-2 p-2 border bg-white border-gray-400 rounded-lg shadow-lg min-w-full`} role="dialog" aria-label="Skill editor dialog">
                <div>
                    <label className="block text-sm font-medium leading-6 text-gray-900" htmlFor="search">
                        Zoeken
                    </label>
                    <input
                        id="search"
                        type="text"
                        placeholder="Zoek naar een skill"
                        value={search}
                        maxLength={50}
                        onChange={(e) => setSearch(e.target.value)}
                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 placeholder:text-gray-400 sm:text-sm sm:leading-6 p-3"
                    />
                </div>
                {showOwnSkillsOption && authData.type === 'student' && (
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="only-show-students-skills"
                            checked={onlyShowStudentsSkills}
                            onChange={() => setOnlyShowStudentsSkills((prev) => !prev)}
                            className="w-4 h-4 accent-primary"
                        />
                        <label htmlFor="only-show-students-skills" className="text-sm font-medium text-gray-900">Laat alleen mijn eigen skills zien</label>
                    </div>
                )}
                <div className="flex flex-wrap gap-2 items-center border bg-gray-100 border-gray-600 rounded-md p-2">
                    {filteredSkills.length === 0 && search.length <= 0 && (
                        <p>Geen skills beschikbaar.</p>
                    )}
                    {filteredSkills.length === 0 && search.length > 0 && (
                        <>
                            <p>Geen skills gevonden.</p>
                            {isAllowedToAddSkill && !searchedSkillExists && (
                                <button className="btn-primary px-3 py-1" onClick={handleCreateSkill}>&ldquo;{formattedSearch}&rdquo; toevoegen</button>
                            )}
                        </>
                    )}
                    <div className="flex flex-wrap gap-2 items-center">
                        {filteredSkills.slice(0, maxSkillsDisplayed).map((skill) => (
                            <SkillBadge key={skill.skillId} skillName={skill.name} isPending={skill.isPending} onClick={() => toggleSkill(skill)} ariaLabel={`${skill.name} toevoegen`}>
                                <span className="ps-1 font-bold text-xl leading-3">+</span>
                            </SkillBadge>
                        ))}
                        {(filteredSkills.length > maxSkillsDisplayed && !showAllSkills) && (
                            <button className="btn-secondary px-2 py-1" onClick={() => setShowAllSkills(true)}>+{filteredSkills.length - maxSkillsDisplayed} tonen</button>
                        )}
                        {filteredSkills.length > maxSkillsDisplayed && showAllSkills && (
                            <>
                                {filteredSkills.slice(maxSkillsDisplayed).map((skill) => (
                                    <SkillBadge key={skill.skillId} skillName={skill.name} isPending={skill.isPending} onClick={() => toggleSkill(skill)} ariaLabel={`${skill.name} toevoegen`}>
                                        <span className="ps-1 font-bold text-xl leading-3">+</span>
                                    </SkillBadge>
                                ))}
                                <button className="btn-secondary px-2 py-1" onClick={() => setShowAllSkills(false)}>Minder tonen</button>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                    <button className="btn-secondary" onClick={handleCancel}>Annuleren</button>
                    <button className="btn-primary" onClick={handleSave}>Opslaan</button>
                </div>
            </div>
        </div>
    )
}
