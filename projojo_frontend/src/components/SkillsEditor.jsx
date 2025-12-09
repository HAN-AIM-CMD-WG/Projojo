import { useEffect, useRef, useState } from "react";
import { createSkill, getUser } from "../services";
import { useAuth } from "../auth/AuthProvider";
import SkillBadge from "./SkillBadge";

/**
 * @param {{
 *  children: React.ReactNode,
 *  allSkills: {id: string, name: string}[],
 *  initialSkills: {id: string, name: string}[],
 *  isEditing: boolean,
 *  onSave: (newSkills: {id: string, name: string}[]) => void,
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
    
    // Ref for click outside detection
    const containerRef = useRef(null)

    const isSearchInString = (search, string) => string.toLowerCase().includes(search.toLowerCase())

    const filteredSkills = allSkills
        .filter(skill =>
            isSearchInString(formattedSearch, skill.name) &&
            !(selectedSkills ?? []).some(s => (s.skillId || s.id) === (skill.skillId || skill.id))
        )
        .sort((a, b) => a.name.localeCompare(b.name))
        .filter(skill => !showOwnSkillsOption || authData.type !== 'student' || !onlyShowStudentsSkills || (onlyShowStudentsSkills && studentsSkills.includes(skill.skillId || skill.id)))

    const searchedSkillExists = allSkills.some(skill => isSearchInString(formattedSearch, skill.name)) || selectedSkills.some(skill => isSearchInString(formattedSearch, skill.name))

    const toggleSkill = (skill) => {
        setSelectedSkills(currentSelectedSkills => {
            const skillId = skill.skillId || skill.id;
            if (currentSelectedSkills.some(s => (s.skillId || s.id) === skillId)) {
                return currentSelectedSkills.filter(s => (s.skillId || s.id) !== skillId);
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
        // Deduplicate skills based on skillId or id
        const uniqueSkills = initialSkills.reduce((acc, skill) => {
            const skillId = skill.skillId || skill.id;
            if (!acc.some(s => (s.skillId || s.id) === skillId)) {
                acc.push(skill);
            }
            return acc;
        }, []);
        setSelectedSkills(uniqueSkills)
    }, [initialSkills])

    useEffect(() => {
        let ignore = false

        if (authData.type === 'student') {
            getUser(authData.userId)
                .then(data => {
                    if (ignore) return
                    // Handle the new API response format
                    if (data.skill_ids) {
                        setStudentsSkills(data.skill_ids.map(skill => skill.skill_id))
                    } else if (data.Skills) {
                        // If we have a Skills array
                        setStudentsSkills(data.Skills.map(skill => skill.skillId ?? skill.id))
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

    // Click outside to close - UX pattern for dismissing dialogs
    useEffect(() => {
        if (!isEditing) return

        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                handleCancel()
            }
        }

        // Use mousedown for better UX (triggers before focus changes)
        document.addEventListener('mousedown', handleClickOutside)
        
        // Also handle Escape key for accessibility
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                handleCancel()
            }
        }
        document.addEventListener('keydown', handleEscape)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [isEditing])

    if (!isEditing) {
        return children
    }

    return (
        <div ref={containerRef} className="flex flex-col gap-2 relative">
            <div className="flex flex-wrap gap-2 items-center">
                {selectedSkills.length === 0 && <span>Er zijn geen skills geselecteerd.</span>}
                {selectedSkills.map((skill) => (
                    <SkillBadge key={skill.skillId || skill.id} skillName={skill.name} isPending={skill.isPending} onClick={() => toggleSkill(skill)} ariaLabel={`Verwijder ${skill.name}`}>
                        <span className="ps-1 font-bold text-xl leading-3">×</span>
                    </SkillBadge>
                ))}
            </div>
            <div className={`${isAbsolute && 'absolute bottom-0 translate-y-full -mb-2 z-30'} flex flex-col gap-3 p-4 neu-flat min-w-full sm:min-w-[400px] md:min-w-[480px]`} role="dialog" aria-label="Skill editor dialog">
                <div>
                    <label className="block text-sm font-bold leading-6 text-text-primary mb-1" htmlFor="search">
                        Zoeken
                    </label>
                    <input
                        id="search"
                        type="text"
                        placeholder="Zoek naar een skill"
                        value={search}
                        maxLength={50}
                        onChange={(e) => setSearch(e.target.value)}
                        className="neu-input w-full"
                    />
                </div>
                {showOwnSkillsOption && authData.type === 'student' && (
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="only-show-students-skills"
                            checked={onlyShowStudentsSkills}
                            onChange={() => setOnlyShowStudentsSkills((prev) => !prev)}
                            className="w-4 h-4 accent-primary rounded"
                        />
                        <label htmlFor="only-show-students-skills" className="text-sm font-medium text-text-secondary">Laat alleen mijn eigen skills zien</label>
                    </div>
                )}
                <div className="flex flex-wrap gap-2 items-center neu-pressed p-3 max-h-64 overflow-y-auto custom-scroll">
                    {filteredSkills.length === 0 && search.length <= 0 && (
                        <p className="text-text-muted text-sm">Geen skills beschikbaar.</p>
                    )}
                    {filteredSkills.length === 0 && search.length > 0 && (
                        <>
                            <p className="text-text-muted text-sm">Geen skills gevonden.</p>
                            {isAllowedToAddSkill && !searchedSkillExists && (
                                <button className="neu-btn-primary !py-2 !px-3 text-sm" onClick={handleCreateSkill}>&ldquo;{formattedSearch}&rdquo; toevoegen</button>
                            )}
                        </>
                    )}
                    <div className="flex flex-wrap gap-2 items-center">
                        {filteredSkills.slice(0, maxSkillsDisplayed).map((skill) => (
                            <SkillBadge key={skill.skillId || skill.id} skillName={skill.name} isPending={skill.isPending} onClick={() => toggleSkill(skill)} ariaLabel={`${skill.name} toevoegen`}>
                                <span className="ps-1 font-bold text-xl leading-3">+</span>
                            </SkillBadge>
                        ))}
                        {(filteredSkills.length > maxSkillsDisplayed && !showAllSkills) && (
                            <button className="neu-btn !py-1 !px-3 text-sm" onClick={() => setShowAllSkills(true)}>+{filteredSkills.length - maxSkillsDisplayed} tonen</button>
                        )}
                        {filteredSkills.length > maxSkillsDisplayed && showAllSkills && (
                            <>
                                {filteredSkills.slice(maxSkillsDisplayed).map((skill) => (
                                    <SkillBadge key={skill.skillId || skill.id} skillName={skill.name} isPending={skill.isPending} onClick={() => toggleSkill(skill)} ariaLabel={`${skill.name} toevoegen`}>
                                        <span className="ps-1 font-bold text-xl leading-3">+</span>
                                    </SkillBadge>
                                ))}
                                <button className="neu-btn !py-1 !px-3 text-sm" onClick={() => setShowAllSkills(false)}>Minder tonen</button>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex flex-wrap justify-end gap-3 pt-2">
                    <button className="neu-btn" onClick={handleCancel}>Annuleren</button>
                    <button className="neu-btn-primary" onClick={handleSave}>Opslaan</button>
                </div>
            </div>
        </div>
    )
}
