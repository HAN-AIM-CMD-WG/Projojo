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
 *  hideSelectedSkills?: boolean
 *  instantApply?: boolean
 *  }} props
 * @returns {JSX.Element}
 */
export default function SkillsEditor({ children, allSkills, initialSkills, isEditing, onSave, onCancel, setError, isAllowedToAddSkill = false, isAbsolute = true, maxSkillsDisplayed = 20, showOwnSkillsOption = false, hideSelectedSkills = false, instantApply = false }) {
    const { authData } = useAuth();
    const [search, setSearch] = useState('')
    const [selectedSkills, setSelectedSkills] = useState(initialSkills)
    const formattedSearch = search.trim().replace(/\s+/g, ' ')
    const [showAllSkills, setShowAllSkills] = useState(false)
    const [onlyShowStudentsSkills, setOnlyShowStudentsSkills] = useState(false)
    const [studentsSkills, setStudentsSkills] = useState([])
    
    // Animation state - keeps component mounted during close animation
    const [isVisible, setIsVisible] = useState(false)
    const [isAnimating, setIsAnimating] = useState(false)
    
    // Ref for click outside detection
    const containerRef = useRef(null)

    const isSearchInString = (search, string) => string.toLowerCase().includes(search.toLowerCase())

    // Filter and categorize skills into 3 groups
    const baseFilteredSkills = allSkills
        .filter(skill =>
            isSearchInString(formattedSearch, skill.name) &&
            !(selectedSkills ?? []).some(s => (s.skillId || s.id) === (skill.skillId || skill.id))
        )
        .sort((a, b) => a.name.localeCompare(b.name));

    // Categorize skills
    const ownSkills = baseFilteredSkills.filter(skill => 
        studentsSkills.includes(skill.skillId || skill.id) && !skill.isPending
    );
    const pendingSkills = baseFilteredSkills.filter(skill => skill.isPending);
    const otherSkills = baseFilteredSkills.filter(skill => 
        !studentsSkills.includes(skill.skillId || skill.id) && !skill.isPending
    );

    // For backward compatibility - combined list when not showing sections
    const filteredSkills = onlyShowStudentsSkills 
        ? ownSkills 
        : baseFilteredSkills

    const searchedSkillExists = allSkills.some(skill => isSearchInString(formattedSearch, skill.name)) || selectedSkills.some(skill => isSearchInString(formattedSearch, skill.name))

    const toggleSkill = (skill) => {
        const skillId = skill.skillId || skill.id;
        
        setSelectedSkills(currentSelectedSkills => {
            let newSkills;
            if (currentSelectedSkills.some(s => (s.skillId || s.id) === skillId)) {
                newSkills = currentSelectedSkills.filter(s => (s.skillId || s.id) !== skillId);
            } else {
                newSkills = [...currentSelectedSkills, skill];
            }
            
            // Instant apply: immediately call onSave with new selection, keep popup open
            if (instantApply) {
                setTimeout(() => onSave(newSkills, true), 0);
            }
            
            return newSkills;
        });
        setSearch('');
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

    // Handle open/close animation
    useEffect(() => {
        if (isEditing) {
            // Opening: mount first, then animate in
            setIsVisible(true)
            // Small delay to ensure mount before animation starts
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setIsAnimating(true)
                })
            })
        } else {
            // Closing: animate out first, then unmount
            setIsAnimating(false)
            const timer = setTimeout(() => {
                setIsVisible(false)
            }, 200) // Match transition duration
            return () => clearTimeout(timer)
        }
    }, [isEditing])

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

    // Don't render dialog if not visible (after close animation)
    if (!isVisible && !isEditing) {
        return children
    }

    return (
        <div ref={containerRef} className={`${hideSelectedSkills ? '' : 'flex flex-col gap-2'} relative`}>
            {/* Selected skills display - can be hidden when parent handles this */}
            {!hideSelectedSkills && (
                <div className="flex flex-wrap gap-2 items-center">
                    {selectedSkills.length === 0 && <span>Er zijn geen skills geselecteerd.</span>}
                    {selectedSkills.map((skill) => (
                        <SkillBadge key={skill.skillId || skill.id} skillName={skill.name} isPending={skill.isPending} onClick={() => toggleSkill(skill)} ariaLabel={`Verwijder ${skill.name}`}>
                            <span className="ps-1 font-bold text-xl leading-3">×</span>
                        </SkillBadge>
                    ))}
                </div>
            )}
            <div 
                className={`${isAbsolute ? 'absolute bottom-0 translate-y-full -mb-2 z-30' : ''} flex flex-col gap-3 p-4 neu-flat min-w-full sm:min-w-[400px] md:min-w-[480px] transition-all duration-200 ease-out origin-top ${
                    isAnimating 
                        ? 'opacity-100 scale-100' 
                        : 'opacity-0 scale-95 -translate-y-2'
                }`} 
                role="dialog" 
                aria-label="Skill editor dialog"
            >
                {/* Selected skills indicator - subtle bar at top */}
                {instantApply && selectedSkills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-gray-200">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Geselecteerd:</span>
                        {selectedSkills.map((skill) => (
                            <button
                                key={skill.skillId || skill.id}
                                onClick={() => toggleSkill(skill)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white hover:bg-primary/80 transition-colors"
                                aria-label={`Verwijder ${skill.name}`}
                            >
                                {skill.name}
                                <span className="material-symbols-outlined text-[12px]">close</span>
                            </button>
                        ))}
                    </div>
                )}

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
                {/* Skills organized in sections */}
                <div className="neu-pressed p-3 max-h-72 overflow-y-auto custom-scroll space-y-4">
                    {baseFilteredSkills.length === 0 && search.length <= 0 && (
                        <p className="text-text-muted text-sm text-center py-2">Geen skills beschikbaar.</p>
                    )}
                    {baseFilteredSkills.length === 0 && search.length > 0 && (
                        <div className="text-center py-2">
                            <p className="text-text-muted text-sm">Geen skills gevonden.</p>
                            {isAllowedToAddSkill && !searchedSkillExists && (
                                <button className="neu-btn-primary !py-2 !px-3 text-sm mt-2" onClick={handleCreateSkill}>&ldquo;{formattedSearch}&rdquo; toevoegen</button>
                            )}
                        </div>
                    )}

                    {/* Section: Own skills (coral) */}
                    {showOwnSkillsOption && authData.type === 'student' && ownSkills.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-primary text-sm">verified</span>
                                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Jouw skills</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {ownSkills.map((skill) => (
                                    <SkillBadge 
                                        key={skill.skillId || skill.id} 
                                        skillName={skill.name} 
                                        isOwn={true}
                                        onClick={() => toggleSkill(skill)} 
                                        ariaLabel={`${skill.name} toevoegen`}
                                    >
                                        <span className="ps-1 font-bold text-lg leading-3">+</span>
                                    </SkillBadge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section: Pending skills (coral dashed) */}
                    {pendingSkills.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-primary/60 text-sm">hourglass_top</span>
                                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">In afwachting</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {pendingSkills.map((skill) => (
                                    <SkillBadge 
                                        key={skill.skillId || skill.id} 
                                        skillName={skill.name} 
                                        isPending={true}
                                        onClick={() => toggleSkill(skill)} 
                                        ariaLabel={`${skill.name} toevoegen`}
                                    >
                                        <span className="ps-1 font-bold text-lg leading-3">+</span>
                                    </SkillBadge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section: Other skills (gray outline) */}
                    {otherSkills.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="material-symbols-outlined text-gray-400 text-sm">school</span>
                                <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">Andere skills</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {otherSkills.slice(0, showAllSkills ? otherSkills.length : maxSkillsDisplayed).map((skill) => (
                                    <SkillBadge 
                                        key={skill.skillId || skill.id} 
                                        skillName={skill.name} 
                                        variant="outline"
                                        onClick={() => toggleSkill(skill)} 
                                        ariaLabel={`${skill.name} toevoegen`}
                                    >
                                        <span className="ps-1 font-bold text-lg leading-3">+</span>
                                    </SkillBadge>
                                ))}
                                {otherSkills.length > maxSkillsDisplayed && !showAllSkills && (
                                    <button className="neu-btn !py-1 !px-3 text-xs" onClick={() => setShowAllSkills(true)}>
                                        +{otherSkills.length - maxSkillsDisplayed} meer
                                    </button>
                                )}
                                {otherSkills.length > maxSkillsDisplayed && showAllSkills && (
                                    <button className="neu-btn !py-1 !px-3 text-xs" onClick={() => setShowAllSkills(false)}>
                                        Minder tonen
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {/* Buttons: show close only for instant apply, save/cancel for normal mode */}
                <div className="flex flex-wrap justify-end gap-3 pt-2">
                    {instantApply ? (
                        <button className="neu-btn" onClick={onCancel}>
                            <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-sm">check</span>
                                Sluiten
                            </span>
                        </button>
                    ) : (
                        <>
                            <button className="neu-btn" onClick={handleCancel}>Annuleren</button>
                            <button className="neu-btn-primary" onClick={handleSave}>Opslaan</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
