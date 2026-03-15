import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(undefined);

const THEME_KEY = 'projojo-theme';
const HIGH_CONTRAST_KEY = 'projojo-high-contrast';

/**
 * Theme Provider Component
 * 
 * Manages theme state (light/dark) and high contrast mode.
 * Persists preferences to localStorage and respects system preferences.
 */
export function ThemeProvider({ children }) {
    const [theme, setThemeState] = useState('light');
    const [isHighContrast, setIsHighContrast] = useState(false);
    const [isUsingSystemTheme, setIsUsingSystemTheme] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        const savedTheme = localStorage.getItem(THEME_KEY);
        const savedHighContrast = localStorage.getItem(HIGH_CONTRAST_KEY);
        
        // Check system preferences
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
        
        // Set theme: saved > system preference > default (light)
        if (savedTheme === 'dark' || savedTheme === 'light') {
            setThemeState(savedTheme);
            setIsUsingSystemTheme(false);
        } else if (savedTheme === 'system') {
            setThemeState(prefersDark ? 'dark' : 'light');
            setIsUsingSystemTheme(true);
        } else {
            // First visit - use system preference
            setThemeState(prefersDark ? 'dark' : 'light');
            setIsUsingSystemTheme(true);
        }
        
        // Set high contrast: saved > system preference > default (false)
        if (savedHighContrast !== null) {
            setIsHighContrast(savedHighContrast === 'true');
        } else {
            setIsHighContrast(prefersHighContrast);
        }
        
        setIsInitialized(true);
    }, []);

    // Listen for system preference changes
    useEffect(() => {
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const highContrastQuery = window.matchMedia('(prefers-contrast: more)');
        
        const handleDarkModeChange = (e) => {
            const savedTheme = localStorage.getItem(THEME_KEY);
            // Only auto-switch if user hasn't set a preference or prefers system
            if (!savedTheme || savedTheme === 'system') {
                setThemeState(e.matches ? 'dark' : 'light');
            }
        };
        
        const handleHighContrastChange = (e) => {
            const savedHighContrast = localStorage.getItem(HIGH_CONTRAST_KEY);
            // Only auto-switch if user hasn't set a preference
            if (!savedHighContrast) {
                setIsHighContrast(e.matches);
            }
        };
        
        darkModeQuery.addEventListener('change', handleDarkModeChange);
        highContrastQuery.addEventListener('change', handleHighContrastChange);
        
        return () => {
            darkModeQuery.removeEventListener('change', handleDarkModeChange);
            highContrastQuery.removeEventListener('change', handleHighContrastChange);
        };
    }, []);

    // Apply theme classes to document
    useEffect(() => {
        if (!isInitialized) return;
        
        const root = document.documentElement;
        
        // Remove existing theme classes
        root.classList.remove('light', 'dark', 'high-contrast');
        
        // Add current theme class
        root.classList.add(theme);
        
        // Add high contrast class if enabled
        if (isHighContrast) {
            root.classList.add('high-contrast');
        }
        
        // Update meta theme-color for mobile browsers
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', theme === 'dark' ? '#1A1512' : '#EFEEEE');
        }
    }, [theme, isHighContrast, isInitialized]);

    // Set theme and persist to localStorage
    const setTheme = useCallback((newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem(THEME_KEY, newTheme);
        setIsUsingSystemTheme(false);
        
        // Announce to screen readers
        const announcement = newTheme === 'dark' ? 'Donkere modus ingeschakeld' : 'Lichte modus ingeschakeld';
        announceToScreenReader(announcement);
    }, []);

    // Toggle between light and dark
    const toggleDarkMode = useCallback(() => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    }, [theme, setTheme]);

    // Set high contrast mode
    const setHighContrast = useCallback((enabled) => {
        setIsHighContrast(enabled);
        localStorage.setItem(HIGH_CONTRAST_KEY, String(enabled));
        
        // Announce to screen readers
        const announcement = enabled ? 'Hoog contrast ingeschakeld' : 'Hoog contrast uitgeschakeld';
        announceToScreenReader(announcement);
    }, []);

    // Toggle high contrast
    const toggleHighContrast = useCallback(() => {
        setHighContrast(!isHighContrast);
    }, [isHighContrast, setHighContrast]);

    // Reset to system preferences
    const resetToSystem = useCallback(() => {
        localStorage.removeItem(THEME_KEY);
        localStorage.removeItem(HIGH_CONTRAST_KEY);
        
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
        
        setThemeState(prefersDark ? 'dark' : 'light');
        setIsHighContrast(prefersHighContrast);
        setIsUsingSystemTheme(true);
        
        announceToScreenReader('Thema-instellingen hersteld naar systeemvoorkeur');
    }, []);

    // Toggle system theme preference
    const toggleSystemTheme = useCallback(() => {
        if (isUsingSystemTheme) {
            // Switch to explicit theme (current theme becomes explicit)
            localStorage.setItem(THEME_KEY, theme);
            setIsUsingSystemTheme(false);
            announceToScreenReader('Handmatige thema-instelling ingeschakeld');
        } else {
            // Switch to system preference
            resetToSystem();
        }
    }, [isUsingSystemTheme, theme, resetToSystem]);

    const value = {
        theme,
        setTheme,
        toggleDarkMode,
        isHighContrast,
        setHighContrast,
        toggleHighContrast,
        resetToSystem,
        isUsingSystemTheme,
        toggleSystemTheme,
        isDark: theme === 'dark',
    };

    // Prevent flash of wrong theme
    if (!isInitialized) {
        return null;
    }

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

/**
 * Hook to access theme context
 */
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

/**
 * Announce message to screen readers via aria-live region
 */
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement is made
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

export default ThemeContext;
