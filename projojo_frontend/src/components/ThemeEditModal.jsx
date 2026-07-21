import { useLayoutEffect, useRef, useState } from "react";
import { updateTheme } from "../services";
import Modal from "./Modal";
import { notification } from "./notifications/NotifySystem";
import ThemeForm, { DEFAULT_COLOR, EMPTY_FORM, joinSdgCodes, parseSdgCodes } from "./ThemeForm";

/** Map a persisted theme record onto the shared form shape. */
function themeToForm(theme) {
    return {
        name: theme?.name ?? "",
        description: theme?.description ?? "",
        sdgCodes: parseSdgCodes(theme?.sdg_code),
        // <input type="color"> normalises to lower-case hex, so store it lower-case
        // up front; that keeps the change-detection below from treating an untouched
        // colour as edited.
        color: (theme?.color ?? DEFAULT_COLOR).toLowerCase(),
        icon: theme?.icon ?? "",
    };
}

/**
 * Teacher-facing "Thema bewerken" edit form (TS-task-012).
 *
 * Kept mounted while closed (isOpen toggles) so the shared Modal can restore focus
 * to the "Bewerken" button on close, matching the create modal. The form is
 * re-seeded from `theme` each time it opens, which is what discards an unsaved edit
 * (AC-8). Only the fields the teacher actually changed are sent (AC-4 partial
 * update); an unchanged name is therefore never sent, so re-saving cannot trip the
 * name uniqueness check (AC-7).
 *
 * @param {object} props
 * @param {object|null} props.theme          the theme being edited (has an id when open)
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {(theme: object) => void} props.onUpdated
 */
export default function ThemeEditModal({ theme, isOpen, onClose, onUpdated }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    // Which theme the modal is currently editing. A save started for one theme can
    // resolve after the teacher switched to another (the modal stays mounted, so the
    // in-flight closure outlives the switch); comparing against this ref lets a stale
    // completion skip closing/erroring the newer modal.
    const activeThemeIdRef = useRef(null);

    // Re-seed before paint each time a theme is opened, so the fields are pre-filled
    // with no empty flash and a reopened modal shows the original (not a prior edit).
    useLayoutEffect(() => {
        if (isOpen && theme) {
            setForm(themeToForm(theme));
            setError(null);
            setIsSaving(false);
            activeThemeIdRef.current = theme.id;
        }
    }, [isOpen, theme]);

    const handleSave = async () => {
        if (isSaving) return;
        if (!form.name.trim()) {
            setError("Naam is verplicht");
            return;
        }

        // Build a partial payload of only the changed fields (Technical Notes:
        // "only changed fields are sent"), compared against the theme's own values.
        // An empty sdg_code/description is a real change (clears the field); the
        // backend accepts empty for these optional fields.
        const original = themeToForm(theme);
        const payload = {};
        const name = form.name.trim();
        if (name !== original.name) payload.name = name;
        if (joinSdgCodes(form.sdgCodes) !== joinSdgCodes(original.sdgCodes)) payload.sdg_code = joinSdgCodes(form.sdgCodes);
        if (form.icon !== original.icon) payload.icon = form.icon;
        if (form.description.trim() !== original.description.trim()) payload.description = form.description.trim();
        if (form.color !== original.color) payload.color = form.color;

        // Nothing changed: close without a pointless PUT or a misleading toast.
        if (Object.keys(payload).length === 0) {
            onClose();
            return;
        }

        setIsSaving(true);
        setError(null);
        // Remember which theme this save belongs to; if the teacher switches themes
        // before it resolves, its completion must not touch the newer modal.
        const savedThemeId = theme.id;
        const savedThemeName = name;
        try {
            const updated = await updateTheme(theme.id, payload);
            onUpdated?.(updated);
            if (activeThemeIdRef.current === savedThemeId) onClose();
        } catch (err) {
            const message = err?.message || "Er is iets misgegaan bij het bijwerken van het thema.";
            if (activeThemeIdRef.current === savedThemeId) {
                // Still on this theme: show the error inline in the form.
                setError(message);
            } else {
                // The teacher already moved on to another theme; surface the failure as
                // a toast so a stale save can't fail silently and leave data unsaved.
                notification.error(`Thema "${savedThemeName}" kon niet worden bijgewerkt. ${message}`);
            }
        } finally {
            if (activeThemeIdRef.current === savedThemeId) setIsSaving(false);
        }
    };

    return (
        <Modal
            isModalOpen={isOpen}
            setIsModalOpen={onClose}
            modalHeader="Thema bewerken"
            modalSubtitle="Werk de gegevens van dit thema bij"
            modalIcon="edit"
            maxWidth="max-w-lg"
        >
            <ThemeForm
                testId="theme-edit-modal"
                form={form}
                onChange={patch => setForm(current => ({ ...current, ...patch }))}
                error={error}
                isSaving={isSaving}
                onSubmit={handleSave}
                onCancel={onClose}
            />
        </Modal>
    );
}
