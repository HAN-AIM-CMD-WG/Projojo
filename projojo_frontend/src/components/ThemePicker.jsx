import { useEffect, useRef, useState } from 'react';
import { getThemes } from '../services';

/**
 * ThemePicker - reusable visual theme selector.
 *
 * Renders the available themes (from GET /themes/) as colored pills. In edit
 * mode every theme is a toggle button; in read-only mode only the selected
 * themes are shown as non-interactive pills. Selection state is managed
 * internally, seeded once from `initialSelected`, and reported through
 * `onChange` on every user toggle.
 *
 * @param {object} props
 * @param {string[]} [props.initialSelected] - theme ids selected on first render
 * @param {(selectedIds: string[]) => void} [props.onChange] - called on each toggle
 * @param {boolean} [props.readOnly] - show selected themes without interaction
 */
export default function ThemePicker({ initialSelected = [], onChange, readOnly = false }) {
    const [themes, setThemes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selected, setSelected] = useState(() => initialSelected);

    // Mirror the selection in a ref so a burst of clicks chains off the latest
    // value instead of a stale render closure, and so onChange fires exactly once
    // per toggle (an effect would double-fire under StrictMode / on mount).
    const selectedRef = useRef(selected);
    selectedRef.current = selected;

    useEffect(() => {
        let active = true;
        getThemes()
            .then((data) => { if (active) setThemes(Array.isArray(data) ? data : []); })
            .finally(() => { if (active) setIsLoading(false); });
        return () => { active = false; };
    }, []);

    function toggle(id) {
        const prev = selectedRef.current;
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        selectedRef.current = next;
        setSelected(next);
        onChange?.(next);
    }

    if (isLoading) {
        return (
            <div data-testid="theme-picker" className="flex flex-wrap gap-2">
                <span className="sr-only" data-testid="theme-picker-loading">Thema&apos;s laden...</span>
                {[0, 1, 2, 3, 4].map((i) => (
                    <span
                        key={i}
                        data-testid="theme-pill-skeleton"
                        className="inline-block h-9 w-24 rounded-full bg-gray-200/70 animate-pulse"
                        aria-hidden="true"
                    />
                ))}
            </div>
        );
    }

    if (themes.length === 0) {
        return (
            <div data-testid="theme-picker">
                <p data-testid="theme-picker-empty" className="text-sm text-[var(--text-muted)]">
                    {"Geen thema's beschikbaar"}
                </p>
            </div>
        );
    }

    const visible = readOnly ? themes.filter((t) => selected.includes(t.id)) : themes;

    return (
        <div data-testid="theme-picker" className="flex flex-wrap gap-2">
            {visible.map((theme) => {
                const isSelected = selected.includes(theme.id);
                const color = theme.color || '#FF7F50';
                const fillStyle = { backgroundColor: color, color: readableTextColor(color) };

                if (readOnly) {
                    return (
                        <span
                            key={theme.id}
                            data-testid="theme-pill"
                            data-theme-id={theme.id}
                            data-readonly="true"
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full border border-transparent cursor-default"
                            style={fillStyle}
                        >
                            {theme.name}
                        </span>
                    );
                }

                return (
                    <button
                        key={theme.id}
                        type="button"
                        data-testid="theme-pill"
                        data-theme-id={theme.id}
                        aria-pressed={isSelected}
                        onClick={() => toggle(theme.id)}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer hover:-translate-y-0.5 focus:outline-none focus:shadow-[0_0_0_3px_var(--color-primary)] ${isSelected
                            ? 'border border-transparent'
                            : 'bg-white/50 border border-gray-300 text-[var(--text-secondary)]'
                            }`}
                        style={isSelected ? fillStyle : undefined}
                    >
                        {!isSelected && (
                            <span
                                data-testid="theme-pill-dot"
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: color }}
                                aria-hidden="true"
                            />
                        )}
                        {theme.name}
                    </button>
                );
            })}
        </div>
    );
}

/**
 * Pick white or near-black text for a hex background, whichever has the higher
 * WCAG contrast ratio, so a selected pill's label stays legible on any color.
 */
function readableTextColor(hex) {
    const white = 1.05 / (relativeLuminance(hex) + 0.05);
    const dark = (relativeLuminance(hex) + 0.05) / 0.05;
    return white >= dark ? '#FFFFFF' : '#1A1512';
}

function relativeLuminance(hex) {
    const value = hex.replace('#', '');
    const toLinear = (channel) => {
        const c = parseInt(channel, 16) / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * toLinear(value.slice(0, 2)) + 0.7152 * toLinear(value.slice(2, 4)) + 0.0722 * toLinear(value.slice(4, 6));
}
