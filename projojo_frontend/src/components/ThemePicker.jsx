import { useEffect, useState } from 'react';
import { getThemes } from '../services';

/**
 * ThemePicker - reusable visual theme selector (controlled).
 *
 * Renders the available themes (from GET /themes/) as colored pills. In edit
 * mode every theme is a toggle button; in read-only mode only the selected
 * themes are shown as non-interactive pills.
 *
 * Selection is fully controlled by the parent: `selected` is the array of theme
 * ids the component renders, and every user toggle is reported through `onChange`
 * with the next array - the parent must apply it (typically to its own state)
 * for the change to take effect. The component keeps no selection state of its
 * own, so pre-selection, reset and cancel are the parent's to own: a Cancel that
 * reverts is just setting `selected` back to its previous value, with no remount.
 *
 * @param {object} props
 * @param {string[]} [props.selected] - currently selected theme ids
 * @param {(selectedIds: string[]) => void} [props.onChange] - called on each toggle with the next ids
 * @param {boolean} [props.readOnly] - show selected themes without interaction
 */
export default function ThemePicker({ selected = [], onChange, readOnly = false }) {
    const [themes, setThemes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let active = true;
        getThemes()
            .then((data) => { if (active) setThemes(Array.isArray(data) ? data : []); })
            .finally(() => { if (active) setIsLoading(false); });
        return () => { active = false; };
    }, []);

    // Report the next selection and let the parent own/apply it. Called directly
    // (not from an effect) so it fires exactly once per user toggle.
    function toggle(id) {
        interactedRef.current = true;
        const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
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
                const fillStyle = legibleFill(color);

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
                        className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer hover:-translate-y-0.5 focus:outline-none focus:shadow-[0_0_0_3px_var(--primary-color)] ${isSelected
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

const DARK_TEXT = '#000000';
const WHITE_TEXT = '#FFFFFF';

/**
 * Choose a legible { backgroundColor, color } for a selected pill: use whichever of white
 * or black text has the higher contrast.
 *
 * Pure black and pure white bracket the whole sRGB cube: white clears WCAG AA
 * (4.5:1) against every background with relative luminance <= 0.1833 and black
 * against every one >= 0.175, so the two ranges overlap and the better of the
 * pair is always at least 4.58:1 (worst case around #CF0DCC). The fill itself
 * therefore never has to be altered to stay legible.
 *
 * This only holds for PURE black - the #1A1512 dark-surface token leaves a gap
 * around luminance 0.197 (worst case 4.26:1, ~5.7% of sRGB) where neither
 * option reaches AA, which is why that token is deliberately not used here.
 */
function legibleFill(hex) {
    const bgLum = luminance(...toRgb(hex));
    const white = contrast(bgLum, luminance(...toRgb(WHITE_TEXT)));
    const dark = contrast(bgLum, luminance(...toRgb(DARK_TEXT)));
    return { backgroundColor: hex, color: white >= dark ? WHITE_TEXT : DARK_TEXT };
}

function contrast(lumA, lumB) {
    return (Math.max(lumA, lumB) + 0.05) / (Math.min(lumA, lumB) + 0.05);
}

function toRgb(hex) {
    const value = hex.replace('#', '');
    return [value.slice(0, 2), value.slice(2, 4), value.slice(4, 6)].map((c) => parseInt(c, 16));
}

function luminance(r, g, b) {
    const toLinear = (channel) => {
        const c = channel / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}
