import { useState } from "react";
import { createTheme } from "../services";
import Modal from "./Modal";
import ThemeForm, { EMPTY_FORM, joinSdgCodes } from "./ThemeForm";

/**
 * Teacher-facing "Nieuw thema" create form (TS-task-011).
 *
 * display_order is deliberately not sent: the server assigns max(existing) + 1
 * from the authoritative catalog (TS-task-011 AC-3). Computing it here would
 * mean trusting a theme list that may still be loading or have failed to load.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {(theme: object) => void} props.onCreated
 */
export default function ThemeCreateModal({ isOpen, onClose, onCreated }) {
    const [form, setForm] = useState(EMPTY_FORM);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const close = () => {
        setForm(EMPTY_FORM);
        setError(null);
        onClose();
    };

    const handleSave = async () => {
        if (isSaving) return;
        if (!form.name.trim()) {
            setError("Naam is verplicht");
            return;
        }
        setIsSaving(true);
        setError(null);

        const sdgCode = joinSdgCodes(form.sdgCodes);
        const payload = { name: form.name.trim(), color: form.color };
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

    return (
        <Modal
            isModalOpen={isOpen}
            setIsModalOpen={close}
            modalHeader="Nieuw thema"
            modalSubtitle="Voeg een thema toe aan de catalogus"
            modalIcon="category"
            maxWidth="max-w-lg"
        >
            <ThemeForm
                testId="theme-create-modal"
                form={form}
                onChange={patch => setForm(current => ({ ...current, ...patch }))}
                error={error}
                isSaving={isSaving}
                onSubmit={handleSave}
                onCancel={close}
            />
        </Modal>
    );
}
