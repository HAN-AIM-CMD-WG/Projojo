import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "projojo_bookmarked_projects";

/**
 * Custom hook for managing bookmarked projects in localStorage.
 * Provides toggle, check, and list functionality.
 */
export default function useBookmarks() {
    const [bookmarkedIds, setBookmarkedIds] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    // Sync to localStorage whenever bookmarks change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarkedIds));
        } catch {
            // localStorage full or unavailable - silently fail
        }
    }, [bookmarkedIds]);

    const isBookmarked = useCallback(
        (projectId) => bookmarkedIds.includes(projectId),
        [bookmarkedIds]
    );

    const toggleBookmark = useCallback((projectId) => {
        setBookmarkedIds((prev) => {
            if (prev.includes(projectId)) {
                return prev.filter((id) => id !== projectId);
            }
            return [...prev, projectId];
        });
    }, []);

    const removeBookmark = useCallback((projectId) => {
        setBookmarkedIds((prev) => prev.filter((id) => id !== projectId));
    }, []);

    return {
        bookmarkedIds,
        isBookmarked,
        toggleBookmark,
        removeBookmark,
        bookmarkCount: bookmarkedIds.length,
    };
}
