import { useRef } from "react";

export const DESCRIPTION_MAX_LENGTH = 500;
export const DEFAULT_COLOR = "#4caf50";

export const EMPTY_FORM = { name: "", description: "", sdgCodes: [], icon: "", color: DEFAULT_COLOR };

// SDG1–SDG17 with their Dutch labels (THEME_SDG_IMPLEMENTATION_PLAN.md §3.1).
export const SDG_OPTIONS = [
    { code: "SDG1", label: "Geen armoede" },
    { code: "SDG2", label: "Geen honger" },
    { code: "SDG3", label: "Goede gezondheid en welzijn" },
    { code: "SDG4", label: "Kwaliteitsonderwijs" },
    { code: "SDG5", label: "Gendergelijkheid" },
    { code: "SDG6", label: "Schoon water en sanitair" },
    { code: "SDG7", label: "Betaalbare en duurzame energie" },
    { code: "SDG8", label: "Waardig werk en economische groei" },
    { code: "SDG9", label: "Industrie, innovatie en infrastructuur" },
    { code: "SDG10", label: "Ongelijkheid verminderen" },
    { code: "SDG11", label: "Duurzame steden en gemeenschappen" },
    { code: "SDG12", label: "Verantwoorde consumptie en productie" },
    { code: "SDG13", label: "Klimaatactie" },
    { code: "SDG14", label: "Leven in het water" },
    { code: "SDG15", label: "Leven op het land" },
    { code: "SDG16", label: "Vrede, justitie en sterke instellingen" },
    { code: "SDG17", label: "Partnerschap om doelstellingen te bereiken" },
];

// Curated Material Symbols icons relevant to themes (sustainability, nature,
// education, technology, society, economy, infrastructure).
export const ICON_OPTIONS = [
    "eco", "recycling", "forest", "park", "energy_savings_leaf", "compost",
    "solar_power", "wind_power", "water_drop", "waves", "air", "cloud",
    "wb_sunny", "bolt", "local_florist", "spa", "grass", "nature",
    "pets", "cruelty_free", "agriculture", "yard", "potted_plant", "hive",
    "thermostat", "filter_hdr", "terrain", "volcano", "tsunami", "flood",
    "school", "menu_book", "book", "auto_stories", "science", "biotech",
    "calculate", "functions", "history_edu", "psychology", "backpack", "draw",
    "palette", "brush", "architecture", "engineering", "construction", "lightbulb",
    "memory", "developer_board", "computer", "smartphone", "devices", "hub",
    "sensors", "precision_manufacturing", "rocket_launch", "code", "terminal", "wifi",
    "smart_toy", "api", "favorite", "health_and_safety", "medical_services", "vaccines",
    "volunteer_activism", "diversity_3", "groups", "handshake", "public", "balance",
    "gavel", "accessibility_new", "elderly", "emoji_people", "sign_language", "work",
    "business_center", "factory", "storefront", "savings", "payments", "trending_up",
    "insights", "analytics", "workspace_premium", "verified", "emoji_events", "category",
];

/** Join selected SDG codes into the canonical SDG1..SDG17 order, regardless of click order. */
export function joinSdgCodes(sdgCodes) {
    return SDG_OPTIONS.filter(option => sdgCodes.includes(option.code)).map(option => option.code).join(",");
}

/** Parse a stored "SDG2,SDG12" code string back into an array of codes. */
export function parseSdgCodes(sdgCode) {
    return sdgCode ? sdgCode.split(",").map(code => code.trim()).filter(Boolean) : [];
}

/**
 * Shared theme form used by both the create (TS-task-011) and edit (TS-task-012)
 * modals. It owns only the field rendering and in-field interaction (SDG toggling,
 * icon selection); the owning modal keeps the form state and the persistence call.
 *
 * @param {object} props
 * @param {string} props.testId              data-testid for the <form> (scopes the fields per modal)
 * @param {object} props.form                { name, description, sdgCodes, icon, color }
 * @param {(patch: object) => void} props.onChange
 * @param {string|null} props.error          inline error message, or null
 * @param {boolean} props.isSaving
 * @param {() => void} props.onSubmit
 * @param {() => void} props.onCancel
 */
export default function ThemeForm({ testId, form, onChange, error, isSaving, onSubmit, onCancel }) {
    const iconDetailsRef = useRef(null);

    const toggleSdg = (code) => {
        onChange({ sdgCodes: form.sdgCodes.includes(code) ? form.sdgCodes.filter(c => c !== code) : [...form.sdgCodes, code] });
    };

    const selectIcon = (name) => {
        onChange({ icon: name });
        if (iconDetailsRef.current) iconDetailsRef.current.open = false;
    };

    const sdgSummary = form.sdgCodes.length
        ? SDG_OPTIONS.filter(option => form.sdgCodes.includes(option.code)).map(option => option.code).join(", ")
        : "Selecteer SDG('s)";

    return (
        <form data-testid={testId} className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); onSubmit(); }}>
            {/* Naam */}
            <div>
                <label htmlFor="theme-name" className="text-sm font-bold leading-6 text-text-primary block mb-1">
                    Naam <span className="text-primary">*</span>
                </label>
                <input
                    id="theme-name"
                    data-testid="theme-name-input"
                    type="text"
                    required
                    maxLength={100}
                    className="neu-input w-full"
                    placeholder="Bijv. Duurzaamheid"
                    value={form.name}
                    onChange={e => onChange({ name: e.target.value })}
                />
            </div>

            {/* Beschrijving */}
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label htmlFor="theme-description" className="text-sm font-bold leading-6 text-text-primary">Beschrijving</label>
                    <span data-testid="theme-description-counter" className="text-xs text-[var(--text-muted)]">
                        {form.description.length}/{DESCRIPTION_MAX_LENGTH}
                    </span>
                </div>
                <textarea
                    id="theme-description"
                    data-testid="theme-description-input"
                    rows={3}
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    className="neu-input w-full"
                    placeholder="Optionele beschrijving van het thema…"
                    value={form.description}
                    onChange={e => onChange({ description: e.target.value })}
                />
            </div>

            {/* SDG Code(s) */}
            <div>
                <span className="text-sm font-bold leading-6 text-text-primary block mb-1">SDG Code(s)</span>
                <details className="neu-pressed rounded-xl overflow-hidden">
                    <summary
                        data-testid="theme-sdg-trigger"
                        className="flex items-center justify-between px-4 py-2.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-[var(--text-secondary)]"
                    >
                        <span>{sdgSummary}</span>
                        <span className="material-symbols-outlined text-base" aria-hidden="true">expand_more</span>
                    </summary>
                    <ul className="max-h-52 overflow-y-auto px-2 pb-2">
                        {SDG_OPTIONS.map(option => (
                            <li key={option.code}>
                                <label data-testid={`theme-sdg-option-${option.code}`} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-[var(--gray-200)]/50 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        data-testid={`theme-sdg-checkbox-${option.code}`}
                                        className="w-4 h-4 accent-primary rounded"
                                        checked={form.sdgCodes.includes(option.code)}
                                        onChange={() => toggleSdg(option.code)}
                                    />
                                    <span className="text-sm text-[var(--text-primary)]">{option.code} — {option.label}</span>
                                </label>
                            </li>
                        ))}
                    </ul>
                </details>
            </div>

            {/* Icoon */}
            <div>
                <span className="text-sm font-bold leading-6 text-text-primary block mb-1">Icoon</span>
                <details ref={iconDetailsRef} className="neu-pressed rounded-xl overflow-hidden">
                    <summary
                        data-testid="theme-icon-trigger"
                        className="flex items-center justify-between px-4 py-2.5 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-[var(--text-secondary)]"
                    >
                        <span className="flex items-center gap-2">
                            {form.icon
                                ? <><span className="material-symbols-outlined text-primary" aria-hidden="true">{form.icon}</span>{form.icon}</>
                                : "Selecteer een icoon"}
                        </span>
                        <span className="material-symbols-outlined text-base" aria-hidden="true">expand_more</span>
                    </summary>
                    <div className="max-h-52 overflow-y-auto grid grid-cols-2 gap-1 px-2 pb-2">
                        {ICON_OPTIONS.map(name => (
                            <button
                                key={name}
                                type="button"
                                data-testid="theme-icon-option"
                                onClick={() => selectIcon(name)}
                                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-[var(--gray-200)]/50 ${form.icon === name ? "bg-primary/10" : ""}`}
                            >
                                <span className="material-symbols-outlined text-primary" aria-hidden="true">{name}</span>
                                <span className="text-sm text-[var(--text-primary)] truncate">{name}</span>
                            </button>
                        ))}
                    </div>
                </details>
            </div>

            {/* Kleur */}
            <div>
                <label htmlFor="theme-color" className="text-sm font-bold leading-6 text-text-primary block mb-1">Kleur</label>
                <div className="flex items-center gap-3">
                    <input
                        id="theme-color"
                        data-testid="theme-color-input"
                        type="color"
                        className="w-12 h-10 rounded-lg neu-pressed cursor-pointer"
                        value={form.color}
                        onChange={e => onChange({ color: e.target.value })}
                    />
                    <span data-testid="theme-color-hex" className="text-sm font-mono text-[var(--text-secondary)]">{form.color}</span>
                </div>
            </div>

            {error && (
                <p role="alert" data-testid="theme-form-error" className="text-red-600 bg-red-50 p-3 rounded-md border border-red-200 text-sm">{error}</p>
            )}

            <div className="flex gap-3 pt-1">
                <button type="button" data-testid="theme-cancel-button" onClick={onCancel} className="neu-btn flex-1 justify-center">
                    Annuleren
                </button>
                <button type="submit" data-testid="theme-save-button" disabled={isSaving} className="neu-btn-primary flex-1 justify-center">
                    {isSaving ? (
                        <>
                            <span className="material-symbols-outlined text-sm animate-spin mr-1" aria-hidden="true">hourglass_empty</span>
                            Bezig…
                        </>
                    ) : "Opslaan"}
                </button>
            </div>
        </form>
    );
}
