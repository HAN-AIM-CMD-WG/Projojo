import { useState, useEffect } from 'react';
import FormInput from './FormInput';

/**
 * Form component for creating/editing subtasks (deeltaken)
 * Uses the WAT/WAAROM/HOE/CRITERIA structure for clarity
 */
export default function SubtaskForm({
    onSubmit,
    onCancel,
    initialData = null,
    templates = [],
    isLoading = false,
}) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [what, setWhat] = useState(initialData?.what || '');
    const [why, setWhy] = useState(initialData?.why || '');
    const [how, setHow] = useState(initialData?.how || '');
    const [criteria, setCriteria] = useState(initialData?.criteria || '');
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [errors, setErrors] = useState({});

    // Reset form when initialData changes
    useEffect(() => {
        if (initialData) {
            setTitle(initialData.title || '');
            setWhat(initialData.what || '');
            setWhy(initialData.why || '');
            setHow(initialData.how || '');
            setCriteria(initialData.criteria || '');
        }
    }, [initialData]);

    // Apply template when selected
    const handleTemplateSelect = (templateId) => {
        setSelectedTemplateId(templateId);
        
        if (!templateId) return;
        
        const template = templates.find(t => t.id === templateId);
        if (template) {
            if (template.title) setTitle(template.title);
            if (template.what) setWhat(template.what);
            if (template.why) setWhy(template.why);
            if (template.how) setHow(template.how);
            if (template.criteria) setCriteria(template.criteria);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Validate
        const newErrors = {};
        if (!title.trim()) {
            newErrors.title = 'Titel is verplicht';
        }
        
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        onSubmit({
            title: title.trim(),
            what: what.trim() || null,
            why: why.trim() || null,
            how: how.trim() || null,
            criteria: criteria.trim() || null,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Template selector (only show if templates available) */}
            {templates.length > 0 && (
                <div>
                    <label className="text-sm font-bold text-[var(--text-primary)] block mb-1">
                        <span className="material-symbols-outlined text-base align-middle mr-1">content_copy</span>
                        Template gebruiken
                    </label>
                    <select
                        value={selectedTemplateId}
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                        className="neu-input w-full"
                    >
                        <option value="">-- Kies een template (optioneel) --</option>
                        {templates.map((template) => (
                            <option key={template.id} value={template.id}>
                                {template.template_name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Title */}
            <FormInput
                label="Titel"
                placeholder="Korte beschrijving van de deeltaak"
                required
                initialValue={title}
                onChange={setTitle}
                error={errors.title}
            />

            {/* WAT - What needs to be done */}
            <div>
                <label className="text-sm font-bold text-[var(--text-primary)] block mb-1">
                    <span className="material-symbols-outlined text-base align-middle mr-1 text-blue-500">assignment</span>
                    WAT
                    <span className="font-normal text-[var(--text-muted)] ml-2">Wat moet er gebeuren?</span>
                </label>
                <textarea
                    value={what}
                    onChange={(e) => setWhat(e.target.value)}
                    placeholder="Beschrijf concreet wat er gedaan moet worden..."
                    className="neu-input w-full"
                    rows={3}
                />
            </div>

            {/* WAAROM - Why is this needed */}
            <div>
                <label className="text-sm font-bold text-[var(--text-primary)] block mb-1">
                    <span className="material-symbols-outlined text-base align-middle mr-1 text-amber-500">lightbulb</span>
                    WAAROM
                    <span className="font-normal text-[var(--text-muted)] ml-2">Waarom is dit nodig?</span>
                </label>
                <textarea
                    value={why}
                    onChange={(e) => setWhy(e.target.value)}
                    placeholder="Leg uit waarom deze taak belangrijk is en wat de context is..."
                    className="neu-input w-full"
                    rows={3}
                />
            </div>

            {/* HOE - How to approach */}
            <div>
                <label className="text-sm font-bold text-[var(--text-primary)] block mb-1">
                    <span className="material-symbols-outlined text-base align-middle mr-1 text-green-500">route</span>
                    HOE
                    <span className="font-normal text-[var(--text-muted)] ml-2">Hoe pak je dit aan?</span>
                </label>
                <textarea
                    value={how}
                    onChange={(e) => setHow(e.target.value)}
                    placeholder="Stappen of aanpak om deze taak uit te voeren..."
                    className="neu-input w-full"
                    rows={3}
                />
            </div>

            {/* CRITERIA - Acceptance criteria */}
            <div>
                <label className="text-sm font-bold text-[var(--text-primary)] block mb-1">
                    <span className="material-symbols-outlined text-base align-middle mr-1 text-purple-500">checklist</span>
                    ACCEPTATIECRITERIA
                    <span className="font-normal text-[var(--text-muted)] ml-2">Waar moet het aan voldoen?</span>
                </label>
                <textarea
                    value={criteria}
                    onChange={(e) => setCriteria(e.target.value)}
                    placeholder="Criteria waaraan het resultaat moet voldoen:&#10;- Criterium 1&#10;- Criterium 2&#10;- ..."
                    className="neu-input w-full"
                    rows={4}
                />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="neu-btn"
                    disabled={isLoading}
                >
                    Annuleren
                </button>
                <button
                    type="submit"
                    className="neu-btn-primary"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
                            Opslaan...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-base">save</span>
                            {initialData ? 'Bijwerken' : 'Aanmaken'}
                        </span>
                    )}
                </button>
            </div>
        </form>
    );
}
