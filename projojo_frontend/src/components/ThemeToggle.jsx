import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * ThemeToggle Component
 * 
 * Provides a single button for dark/light mode with a hover/focus
 * panel that reveals additional options (high contrast, system default).
 * 
 * Accessibility:
 * - Keyboard accessible (Tab, Enter, Space, Escape)
 * - Screen reader announcements
 * - Clear aria-labels
 * - Panel stays open on focus-within
 */
export default function ThemeToggle() {
    const { 
        toggleDarkMode, 
        isHighContrast, 
        toggleHighContrast, 
        isDark,
        isUsingSystemTheme,
        toggleSystemTheme
    } = useTheme();
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const containerRef = useRef(null);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsPanelOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle escape key to close panel
    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            setIsPanelOpen(false);
        }
    };

    return (
        <div 
            ref={containerRef}
            className="relative"
            onMouseEnter={() => setIsPanelOpen(true)}
            onMouseLeave={() => setIsPanelOpen(false)}
            onFocus={() => setIsPanelOpen(true)}
            onBlur={(e) => {
                // Only close if focus moves outside the container
                if (!containerRef.current?.contains(e.relatedTarget)) {
                    setIsPanelOpen(false);
                }
            }}
            onKeyDown={handleKeyDown}
        >
            {/* Main Theme Toggle Button */}
            <button
                type="button"
                onClick={toggleDarkMode}
                className="neu-icon-btn focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label={isDark ? 'Schakel naar lichte modus' : 'Schakel naar donkere modus'}
                aria-pressed={isDark}
                aria-haspopup="true"
                aria-expanded={isPanelOpen}
                title={isDark ? 'Lichte modus' : 'Donkere modus'}
            >
                <span className="material-symbols-outlined text-xl" aria-hidden="true">
                    {isDark ? 'light_mode' : 'dark_mode'}
                </span>
            </button>

            {/* Invisible bridge to prevent gap hover issue */}
            <div 
                className={`absolute right-0 top-full h-3 w-full ${isPanelOpen ? 'block' : 'hidden'}`}
                aria-hidden="true"
            />

            {/* Hover/Focus Panel with Options - Popup style with drop shadow */}
            <div 
                className={`
                    absolute right-0 top-full mt-3 z-50
                    bg-[var(--neu-bg)] p-3 min-w-[200px] rounded-xl
                    border border-[var(--neu-border)]
                    transition-all duration-200 origin-top-right
                    ${isPanelOpen 
                        ? 'opacity-100 scale-100 visible' 
                        : 'opacity-0 scale-95 invisible pointer-events-none'
                    }
                `}
                style={{
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
                role="menu"
                aria-label="Thema opties"
            >
                {/* Current theme indicator */}
                <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 px-1">
                    Weergave
                </div>

                {/* Theme status */}
                <div className="flex items-center gap-2 px-1 py-1.5 text-sm font-semibold text-[var(--text-secondary)]">
                    <span className="material-symbols-outlined text-base text-[var(--primary-color)]" aria-hidden="true">
                        {isDark ? 'dark_mode' : 'light_mode'}
                    </span>
                    <span>{isDark ? 'Donker thema' : 'Licht thema'}</span>
                </div>

                {/* Divider */}
                <div className="h-px bg-[var(--neu-border)] my-2" />

                {/* System Default Toggle */}
                <button
                    type="button"
                    onClick={toggleSystemTheme}
                    className="flex items-center gap-3 px-1 py-1.5 w-full cursor-pointer rounded-lg hover:bg-[var(--gray-200)]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/50"
                    role="menuitemcheckbox"
                    aria-checked={isUsingSystemTheme}
                    aria-describedby="system-theme-description"
                >
                    {/* Custom checkbox visual */}
                    <div className={`
                        w-5 h-5 rounded-md border-2 transition-all duration-200
                        flex items-center justify-center shrink-0
                        ${isUsingSystemTheme 
                            ? 'bg-[var(--primary-color)] border-[var(--primary-color)]' 
                            : 'bg-transparent border-[var(--gray-400)]'
                        }
                    `} aria-hidden="true">
                        {isUsingSystemTheme && (
                            <span className="material-symbols-outlined text-white text-sm">
                                check
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                            Systeemstandaard
                        </span>
                        <span 
                            id="system-theme-description" 
                            className="text-[10px] text-[var(--text-muted)]"
                        >
                            Volg apparaatinstelling
                        </span>
                    </div>
                </button>

                {/* High Contrast Toggle Button */}
                <button
                    type="button"
                    onClick={toggleHighContrast}
                    className="flex items-center gap-3 px-1 py-1.5 w-full cursor-pointer rounded-lg hover:bg-[var(--gray-200)]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]/50 mt-1"
                    role="menuitemcheckbox"
                    aria-checked={isHighContrast}
                    aria-describedby="high-contrast-description"
                >
                    {/* Custom checkbox visual */}
                    <div className={`
                        w-5 h-5 rounded-md border-2 transition-all duration-200
                        flex items-center justify-center shrink-0
                        ${isHighContrast 
                            ? 'bg-[var(--primary-color)] border-[var(--primary-color)]' 
                            : 'bg-transparent border-[var(--gray-400)]'
                        }
                    `} aria-hidden="true">
                        {isHighContrast && (
                            <span className="material-symbols-outlined text-white text-sm">
                                check
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col text-left">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">
                            Hoog contrast
                        </span>
                        <span 
                            id="high-contrast-description" 
                            className="text-[10px] text-[var(--text-muted)]"
                        >
                            Voor slechtzienden
                        </span>
                    </div>
                </button>
            </div>
        </div>
    );
}

/**
 * ThemeToggleMenu Component
 * 
 * A more detailed theme selector with labels,
 * useful for settings pages or dropdown menus.
 */
export function ThemeToggleMenu() {
    const { theme, setTheme, isHighContrast, toggleHighContrast, resetToSystem, isDark } = useTheme();

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
    };

    return (
        <div className="neu-flat p-4 space-y-4 min-w-[200px]">
            <div className="space-y-2">
                <span className="neu-label block">Thema</span>
                
                {/* Light Mode Option */}
                <button
                    type="button"
                    onClick={() => handleThemeChange('light')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        theme === 'light' && !isDark
                            ? 'neu-pressed text-primary'
                            : 'hover:bg-[var(--gray-200)]'
                    }`}
                    aria-pressed={theme === 'light'}
                >
                    <span className="material-symbols-outlined" aria-hidden="true">light_mode</span>
                    <span className="font-semibold text-sm">Licht</span>
                    {theme === 'light' && (
                        <span className="material-symbols-outlined text-primary ml-auto" aria-hidden="true">check</span>
                    )}
                </button>

                {/* Dark Mode Option */}
                <button
                    type="button"
                    onClick={() => handleThemeChange('dark')}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        theme === 'dark' && isDark
                            ? 'neu-pressed text-primary'
                            : 'hover:bg-[var(--gray-200)]'
                    }`}
                    aria-pressed={theme === 'dark'}
                >
                    <span className="material-symbols-outlined" aria-hidden="true">dark_mode</span>
                    <span className="font-semibold text-sm">Donker</span>
                    {theme === 'dark' && (
                        <span className="material-symbols-outlined text-primary ml-auto" aria-hidden="true">check</span>
                    )}
                </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-[var(--gray-200)]" />

            {/* High Contrast Toggle */}
            <button
                type="button"
                onClick={toggleHighContrast}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isHighContrast
                        ? 'neu-pressed text-primary'
                        : 'hover:bg-[var(--gray-200)]'
                }`}
                aria-pressed={isHighContrast}
            >
                <span className="material-symbols-outlined" aria-hidden="true">contrast</span>
                <span className="font-semibold text-sm">Hoog contrast</span>
                {isHighContrast && (
                    <span className="material-symbols-outlined text-primary ml-auto" aria-hidden="true">check</span>
                )}
            </button>

            {/* Reset to System */}
            <button
                type="button"
                onClick={resetToSystem}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-[var(--gray-200)] text-[var(--text-muted)]"
            >
                <span className="material-symbols-outlined" aria-hidden="true">settings_suggest</span>
                <span className="font-semibold text-sm">Systeemvoorkeur</span>
            </button>
        </div>
    );
}
