import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { getUser } from "../services";
import { normalizeSkill } from "../utils/skills";

const StudentSkillsContext = createContext();

/**
 * Provider that fetches and caches the current student's skills
 * Makes skills available throughout the app without repeated API calls
 */
export function StudentSkillsProvider({ children }) {
    const { authData } = useAuth();
    const [studentSkills, setStudentSkills] = useState([]);
    const [studentName, setStudentName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let ignore = false;

        // Wait for auth to finish loading
        if (authData.isLoading) {
            setIsLoading(true);
            return;
        }

        // Only fetch skills for students
        if (authData.type !== 'student' || !authData.userId) {
            setStudentSkills([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        getUser(authData.userId)
            .then(data => {
                if (ignore) return;
                
                // Store student's name (first name only for friendlier UX)
                if (data.full_name) {
                    const firstName = data.full_name.split(' ')[0];
                    setStudentName(firstName);
                }
                
                // Handle different API response formats
                // Use normalizeSkill to ensure consistent format with skillId property
                let skills = [];
                if (data.Skills && Array.isArray(data.Skills)) {
                    skills = data.Skills.map(normalizeSkill).filter(Boolean);
                } else if (data.skill_ids && Array.isArray(data.skill_ids)) {
                    skills = data.skill_ids.map(s => normalizeSkill({
                        id: s.skill_id,
                        name: s.name || ''
                    })).filter(Boolean);
                }
                
                setStudentSkills(skills);
            })
            .catch(() => {
                if (ignore) return;
                setStudentSkills([]);
            })
            .finally(() => {
                if (ignore) return;
                setIsLoading(false);
            });

        return () => {
            ignore = true;
        };
    }, [authData.userId, authData.type, authData.isLoading]);

    return (
        <StudentSkillsContext.Provider value={{ studentSkills, studentName, isLoading }}>
            {children}
        </StudentSkillsContext.Provider>
    );
}

/**
 * Hook to access the student's skills and name
 * @returns {{ studentSkills: {skillId: string, name: string, isPending: boolean}[], studentName: string, isLoading: boolean }}
 */
export function useStudentSkills() {
    const context = useContext(StudentSkillsContext);
    if (!context) {
        // Return empty state if used outside provider
        return { studentSkills: [], studentName: '', isLoading: false };
    }
    return context;
}
