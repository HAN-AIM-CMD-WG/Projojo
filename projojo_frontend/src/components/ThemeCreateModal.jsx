import { useRef, useState } from "react";
import { createTheme } from "../services";
import Modal from "./Modal";

const DESCRIPTION_MAX_LENGTH = 500;
const DEFAULT_COLOR = "#4caf50";

// SDG1–SDG17 with their Dutch labels (THEME_SDG_IMPLEMENTATION_PLAN.md §3.1).
const SDG_OPTIONS = [
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
const ICON_OPTIONS = [
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

const EMPTY_FORM = { name: "", description: "", sdgCodes: [], icon: "", color: DEFAULT_COLOR };

/**
 * Teacher-facing "Nieuw thema" create form (TS-task-011).
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {{display_order?: number}[]} props.existingThemes  used to auto-assign display_order
 * @param {(theme: object) => void} props.onCreated
 */
export default function ThemeCreateModal({ isOpen, onClose, existingThemes = [], onCreated }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const iconDetailsRef = useRef(null);

    const update = (patch) => setForm(current => ({ ...current, ...patch }));

    const close = () => {
        setForm(EMPTY_FORM);
        setError(null);
        onClose();
    };

    const toggleSdg = (code) => {
        update({ sdgCodes: form.sdgCodes.includes(code) ? form.sdgCodes.filter(c => c !== code) : [...form.sdgCodes, code] });
    };

    const selectIcon = (name) => {
        update({ icon: name });
        if (iconDetailsRef.current) iconDetailsRef.current.open = false;
    };

    const nextDisplayOrder = Math.max(0, ...existingThemes.map(theme => theme.display_order ?? 0)) + 1;

    const handleSave = async () => {
        if (isSaving) return;
        setIsSaving(true);
        setError(null);

        // Keep SDG codes in canonical SDG1..SDG17 order regardless of click order.
        const sdgCode = SDG_OPTIONS.filter(option => form.sdgCodes.includes(option.code)).map(option => option.code).join(",");

        const payload = { name: form.name.trim(), color: form.color, display_order: nextDisplayOrder };
        if (sdgCode) payload.sdg_code = sdgCode;
        if (form.icon) payload.icon = form.icon;
        if (form.description.trim()) payload.description = form.description.trim();

        try {
            const created = await createTheme(payload);
            onCreated?.(created);
            close();
        } catch (err) {
            setError(err?.message || "Er is iets misgegaan bij het aanmaken van het thema.");
        } finally {
            setIsSaving(false);
        }
    };

    const sdgSummary = form.sdgCodes.length
        ? SDG_OPTIONS.filter(option => form.sdgCodes.includes(option.code)).map(option => option.code).join(", ")
        : "Selecteer SDG('s)";

    return (
        <Modal
            isModalOpen={isOpen}
            setIsModalOpen={close}
            modalHeader="Nieuw thema"
            modalSubtitle="Voeg een thema toe aan de catalogus"
            modalIcon="category"
            maxWidth="max-w-lg"
        >
            <div data-testid="theme-create-modal" className="flex flex-col gap-4">
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
                        onChange={e => update({ name: e.target.value })}
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
                        onChange={e => update({ description: e.target.value })}
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
                            onChange={e => update({ color: e.target.value })}
                        />
                        <span data-testid="theme-color-hex" className="text-sm font-mono text-[var(--text-secondary)]">{form.color}</span>
                    </div>
                </div>

                {error && (
                    <p data-testid="theme-form-error" className="text-red-600 bg-red-50 p-3 rounded-md border border-red-200 text-sm">{error}</p>
                )}

                <div className="flex gap-3 pt-1">
                    <button type="button" data-testid="theme-cancel-button" onClick={close} className="neu-btn flex-1 justify-center">
                        Annuleren
                    </button>
                    <button type="button" data-testid="theme-save-button" onClick={handleSave} disabled={isSaving} className="neu-btn-primary flex-1 justify-center">
                        {isSaving ? (
                            <>
                                <span className="material-symbols-outlined text-sm animate-spin mr-1" aria-hidden="true">hourglass_empty</span>
                                Bezig…
                            </>
                        ) : "Opslaan"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
