import { useEffect, useRef, useState } from 'react';
import { getThemes } from '../services';

/**
 * ThemePicker - reusable visual theme selector.
 *
 * Renders the available themes (from GET /themes/) as colored pills. In edit
 * mode every theme is a toggle button; in read-only mode only the selected
 * themes are shown as non-interactive pills. Selection state is managed
 * internally and reported through `onChange` on every user toggle.
 *
 * `initialSelected` seeds the selection and is re-synced if it changes (e.g. a
 * consumer that supplies it from an async fetch) until the user first interacts,
 * after which the internal selection wins so in-progress edits are never lost.
 *
 * Two consequences for consumers:
 * - "Interacted" is sticky for the lifetime of the mount, so pushing an older
 *   `initialSelected` back will NOT revert a selection the user has touched. To
 *   implement a Cancel/reset that reverts in place, remount the picker with a
 *   changed `key` instead.
 * - Re-syncing does not call `onChange` (the parent already owns the value it
 *   just supplied). Seed any save state from your own `initialSelected`, not
 *   from the first `onChange`, or a pre-fill the user never touched is lost.
 *
 * @param {object} props
 * @param {string[]} [props.initialSelected] - theme ids selected initially
 * @param {(selectedIds: string[]) => void} [props.onChange] - called on each toggle
 * @param {boolean} [props.readOnly] - show selected themes without interaction
 */
export default function ThemePicker({ initialSelected = [], onChange, readOnly = false }) {
    const [themes, setThemes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selected, setSelected] = useState(() => initialSelected);

    const interactedRef = useRef(false);

    useEffect(() => {
        let active = true;
        getThemes()
            .then((data) => { if (active) setThemes(Array.isArray(data) ? data : []); })
            .finally(() => { if (active) setIsLoading(false); });
        return () => { active = false; };
    }, []);

    // Re-sync when `initialSelected` changes (async-fed consumers) but never once
    // the user has started editing. Keyed on the value, not array identity.
    const initialKey = initialSelected.join(',');
    useEffect(() => {
        if (interactedRef.current) return;
        setSelected(initialSelected);
    }, [initialKey]);

    // onChange is called here rather than from an effect so it fires exactly once
    // per toggle (an effect would also fire on mount and double-fire in StrictMode).
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

const DARK_TEXT = '#1A1512';
const WHITE_TEXT = '#FFFFFF';
const AA_CONTRAST = 4.5;

/**
 * Choose a legible { backgroundColor, color } for a selected pill: keep the theme
 * color and use whichever of white/dark text has the higher contrast. If neither
 * reaches WCAG AA (4.5:1) - e.g. a mid-luminance brand color like #E91E63 -
 * darken the fill until white text is legible, so no selected pill ships below AA.
 */
function legibleFill(hex) {
    let [r, g, b] = toRgb(hex);
    const white = contrast(luminance(r, g, b), 1);
    const dark = contrast(luminance(r, g, b), luminance(...toRgb(DARK_TEXT)));
    if (Math.max(white, dark) >= AA_CONTRAST) {
        return { backgroundColor: hex, color: white >= dark ? WHITE_TEXT : DARK_TEXT };
    }
    for (let i = 0; i < 20 && contrast(luminance(r, g, b), 1) < AA_CONTRAST; i += 1) {
        [r, g, b] = [r, g, b].map((c) => Math.round(c * 0.9));
    }
    return { backgroundColor: `rgb(${r}, ${g}, ${b})`, color: WHITE_TEXT };
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
