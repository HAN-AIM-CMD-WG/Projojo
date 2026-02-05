import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { useAuth } from "../auth/AuthProvider";
import { getStudentRegistrations } from "../services";

const StudentWorkContext = createContext();

/**
 * Provider that fetches and caches the current student's work registrations
 * Makes information about where the student works available throughout the app
 */
export function StudentWorkProvider({ children }) {
    const { authData } = useAuth();
    const [registrations, setRegistrations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let ignore = false;

        // Wait for auth to finish loading
        if (authData.isLoading) {
            setIsLoading(true);
            return;
        }

        // Only fetch registrations for students
        if (authData.type !== 'student' || !authData.userId) {
            setRegistrations([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        getStudentRegistrations()
            .then(data => {
                if (ignore) return;
                setRegistrations(data || []);
            })
            .catch(() => {
                if (ignore) return;
                setRegistrations([]);
            })
            .finally(() => {
                if (ignore) return;
                setIsLoading(false);
            });

        return () => {
            ignore = true;
        };
    }, [authData.userId, authData.type, authData.isLoading]);

    // Filter registrations by status
    // is_accepted: true = accepted, false = rejected, null/undefined = pending
    // completed_at: set when task is finished
    const activeRegistrations = useMemo(() => {
        return registrations.filter(r => r.is_accepted === true && !r.completed_at);
    }, [registrations]);

    const pendingRegistrations = useMemo(() => {
        return registrations.filter(r => r.is_accepted === null || r.is_accepted === undefined);
    }, [registrations]);

    // Compute Sets for efficient lookups - ACTIVE registrations (accepted, not completed)
    const workingBusinessIds = useMemo(() => {
        return new Set(activeRegistrations.map(r => r.business_id).filter(Boolean));
    }, [activeRegistrations]);

    const workingProjectIds = useMemo(() => {
        return new Set(activeRegistrations.map(r => r.project_id).filter(Boolean));
    }, [activeRegistrations]);

    const workingTaskIds = useMemo(() => {
        return new Set(activeRegistrations.map(r => r.id).filter(Boolean));
    }, [activeRegistrations]);

    // Compute Sets for PENDING registrations (awaiting approval)
    const pendingBusinessIds = useMemo(() => {
        return new Set(pendingRegistrations.map(r => r.business_id).filter(Boolean));
    }, [pendingRegistrations]);

    const pendingProjectIds = useMemo(() => {
        return new Set(pendingRegistrations.map(r => r.project_id).filter(Boolean));
    }, [pendingRegistrations]);

    const pendingTaskIds = useMemo(() => {
        return new Set(pendingRegistrations.map(r => r.id).filter(Boolean));
    }, [pendingRegistrations]);

    // Helper functions for easy checking - active (accepted, not completed)
    const isWorkingAtBusiness = (businessId) => workingBusinessIds.has(businessId);
    const isWorkingOnProject = (projectId) => workingProjectIds.has(projectId);
    const isWorkingOnTask = (taskId) => workingTaskIds.has(taskId);

    // Helper functions for pending registrations (awaiting approval)
    const hasPendingAtBusiness = (businessId) => pendingBusinessIds.has(businessId);
    const hasPendingOnProject = (projectId) => pendingProjectIds.has(projectId);
    const hasPendingOnTask = (taskId) => pendingTaskIds.has(taskId);

    const value = {
        registrations,
        activeRegistrations,
        pendingRegistrations,
        workingBusinessIds,
        workingProjectIds,
        workingTaskIds,
        pendingBusinessIds,
        pendingProjectIds,
        pendingTaskIds,
        isWorkingAtBusiness,
        isWorkingOnProject,
        isWorkingOnTask,
        hasPendingAtBusiness,
        hasPendingOnProject,
        hasPendingOnTask,
        isLoading
    };

    return (
        <StudentWorkContext.Provider value={value}>
            {children}
        </StudentWorkContext.Provider>
    );
}

/**
 * Hook to access the student's work registrations
 * Provides both ACTIVE (accepted, not completed) and PENDING (awaiting approval) registrations
 * @returns {{
 *   registrations: Array,
 *   activeRegistrations: Array,
 *   pendingRegistrations: Array,
 *   workingBusinessIds: Set<string>,
 *   workingProjectIds: Set<string>,
 *   workingTaskIds: Set<string>,
 *   pendingBusinessIds: Set<string>,
 *   pendingProjectIds: Set<string>,
 *   pendingTaskIds: Set<string>,
 *   isWorkingAtBusiness: (id: string) => boolean,
 *   isWorkingOnProject: (id: string) => boolean,
 *   isWorkingOnTask: (id: string) => boolean,
 *   hasPendingAtBusiness: (id: string) => boolean,
 *   hasPendingOnProject: (id: string) => boolean,
 *   hasPendingOnTask: (id: string) => boolean,
 *   isLoading: boolean
 * }}
 */
export function useStudentWork() {
    const context = useContext(StudentWorkContext);
    if (!context) {
        // Return empty state if used outside provider
        return {
            registrations: [],
            activeRegistrations: [],
            pendingRegistrations: [],
            workingBusinessIds: new Set(),
            workingProjectIds: new Set(),
            workingTaskIds: new Set(),
            pendingBusinessIds: new Set(),
            pendingProjectIds: new Set(),
            pendingTaskIds: new Set(),
            isWorkingAtBusiness: () => false,
            isWorkingOnProject: () => false,
            isWorkingOnTask: () => false,
            hasPendingAtBusiness: () => false,
            hasPendingOnProject: () => false,
            hasPendingOnTask: () => false,
            isLoading: false
        };
    }
    return context;
}
