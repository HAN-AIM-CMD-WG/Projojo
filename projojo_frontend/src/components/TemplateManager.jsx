import { useState, useEffect } from 'react';
import Modal from './Modal';
import SubtaskForm from './SubtaskForm';
import {
    getSubtaskTemplates,
    createSubtaskTemplate,
    updateSubtaskTemplate,
    deleteSubtaskTemplate,
} from '../services';

/**
 * TemplateManager component - Allows supervisors to manage subtask templates
 * Templates can be reused when creating new subtasks for tasks
 */
export default function TemplateManager({ businessId }) {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);

    // Fetch templates
    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const data = await getSubtaskTemplates(businessId);
            setTemplates(data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching templates:', err);
            setError('Kon templates niet laden');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (businessId) {
            fetchTemplates();
        }
    }, [businessId]);

    // Handle creating a new template
    const handleCreate = async (templateData) => {
        try {
            setActionLoading('create');
            await createSubtaskTemplate(businessId, {
                template_name: templateData.title, // Use title as template name
                title: templateData.title,
                what: templateData.what,
                why: templateData.why,
                how: templateData.how,
                criteria: templateData.criteria,
            });
            await fetchTemplates();
            setShowAddModal(false);
        } catch (err) {
            console.error('Error creating template:', err);
            setError('Kon template niet aanmaken');
        } finally {
            setActionLoading(null);
        }
    };

    // Handle updating a template
    const handleUpdate = async (templateData) => {
        if (!editingTemplate) return;
        
        try {
            setActionLoading(editingTemplate.id);
            await updateSubtaskTemplate(editingTemplate.id, {
                template_name: templateData.title,
                title: templateData.title,
                what: templateData.what,
                why: templateData.why,
                how: templateData.how,
                criteria: templateData.criteria,
            });
            await fetchTemplates();
            setEditingTemplate(null);
        } catch (err) {
            console.error('Error updating template:', err);
            setError('Kon template niet bijwerken');
        } finally {
            setActionLoading(null);
        }
    };

    // Handle deleting a template
    const handleDelete = async (templateId) => {
        if (!confirm('Weet je zeker dat je deze template wilt verwijderen?')) return;
        
        try {
            setActionLoading(templateId);
            await deleteSubtaskTemplate(templateId);
            await fetchTemplates();
        } catch (err) {
            console.error('Error deleting template:', err);
            setError('Kon template niet verwijderen');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="neu-flat p-6 rounded-2xl">
                <div className="flex items-center gap-3 text-[var(--text-muted)]">
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    <span>Templates laden...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="neu-flat p-5 rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-wide">
                    Templates
                </h3>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="neu-btn-primary !py-1.5 !px-2.5 text-xs"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Nieuw
                </button>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-500 rounded-xl text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined">error</span>
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            )}

            {/* Templates list */}
            {templates.length === 0 ? (
                <div className="neu-pressed rounded-xl p-6 text-center">
                    <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">content_copy</span>
                    <p className="text-sm text-[var(--text-muted)]">Nog geen templates</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                        Maak templates voor veelvoorkomende deeltaken
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {templates.map((template) => {
                        const isLoading = actionLoading === template.id;
                        const filledFields = [
                            template.what && { icon: 'assignment', color: 'text-blue-500', label: 'WAT' },
                            template.why && { icon: 'lightbulb', color: 'text-amber-500', label: 'WAAROM' },
                            template.how && { icon: 'route', color: 'text-green-500', label: 'HOE' },
                            template.criteria && { icon: 'checklist', color: 'text-purple-500', label: 'CRITERIA' },
                        ].filter(Boolean);
                        
                        return (
                            <div 
                                key={template.id}
                                className="neu-flat p-3 rounded-xl flex items-center gap-3 group hover:shadow-md transition-shadow"
                            >
                                {/* Template icon */}
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-primary">description</span>
                                </div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-[var(--text-primary)] text-sm truncate">
                                        {template.template_name}
                                    </h4>
                                    
                                    {/* Field indicators as small badges */}
                                    <div className="flex items-center gap-1.5 mt-1">
                                        {filledFields.map((field, idx) => (
                                            <span 
                                                key={idx}
                                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 ${field.color}`}
                                                title={`${field.label} is ingevuld`}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>{field.icon}</span>
                                            </span>
                                        ))}
                                        {filledFields.length === 0 && (
                                            <span className="text-xs text-[var(--text-muted)]">Geen velden ingevuld</span>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {isLoading ? (
                                        <span className="material-symbols-outlined animate-spin text-[var(--text-muted)]">
                                            progress_activity
                                        </span>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setEditingTemplate(template)}
                                                className="p-1.5 rounded-lg hover:bg-[var(--gray-200)] transition"
                                                title="Bewerken"
                                            >
                                                <span className="material-symbols-outlined text-sm text-[var(--text-muted)]">edit</span>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(template.id)}
                                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                                                title="Verwijderen"
                                            >
                                                <span className="material-symbols-outlined text-sm text-red-500">delete</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add template modal */}
            <Modal
                isModalOpen={showAddModal}
                setIsModalOpen={setShowAddModal}
                modalHeader="Nieuwe template"
                modalSubtitle="Maak een herbruikbare template voor deeltaken"
                modalIcon="content_copy"
                maxWidth="max-w-lg"
            >
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                    <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
                    Templates helpen je snel deeltaken aan te maken met vooraf ingevulde velden.
                </div>
                <SubtaskForm
                    onSubmit={handleCreate}
                    onCancel={() => setShowAddModal(false)}
                    isLoading={actionLoading === 'create'}
                />
            </Modal>

            {/* Edit template modal */}
            <Modal
                isModalOpen={!!editingTemplate}
                setIsModalOpen={(open) => !open && setEditingTemplate(null)}
                modalHeader="Template bewerken"
                modalSubtitle={editingTemplate?.template_name || 'Pas de template aan'}
                modalIcon="edit"
                maxWidth="max-w-lg"
            >
                {editingTemplate && (
                    <SubtaskForm
                        onSubmit={handleUpdate}
                        onCancel={() => setEditingTemplate(null)}
                        initialData={{
                            title: editingTemplate.title || editingTemplate.template_name,
                            what: editingTemplate.what,
                            why: editingTemplate.why,
                            how: editingTemplate.how,
                            criteria: editingTemplate.criteria,
                        }}
                        isLoading={actionLoading === editingTemplate.id}
                    />
                )}
            </Modal>
        </div>
    );
}
