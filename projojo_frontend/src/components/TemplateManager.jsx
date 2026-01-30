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
        <div className="neu-flat p-6 rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-2xl">content_copy</span>
                    <div>
                        <h3 className="font-bold text-[var(--text-primary)]">Deeltaak Templates</h3>
                        <p className="text-xs text-[var(--text-muted)]">
                            Herbruikbare templates voor veelvoorkomende deeltaken
                        </p>
                    </div>
                </div>
                
                <button
                    onClick={() => setShowAddModal(true)}
                    className="neu-btn-primary !py-2 !px-3 text-sm"
                >
                    <span className="material-symbols-outlined text-base">add</span>
                    Template
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

            {/* Templates grid */}
            {templates.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)]">
                    <span className="material-symbols-outlined text-4xl mb-2 block opacity-50">content_copy</span>
                    <p>Nog geen templates</p>
                    <p className="text-sm mt-1">
                        Maak templates voor veelvoorkomende deeltaken zoals "Bug Fix", "Feature", of "Documentatie"
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {templates.map((template) => {
                        const isLoading = actionLoading === template.id;
                        
                        return (
                            <div 
                                key={template.id}
                                className="neu-pressed p-4 rounded-xl"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-[var(--text-primary)] truncate">
                                            {template.template_name}
                                        </h4>
                                        {template.title && template.title !== template.template_name && (
                                            <p className="text-sm text-[var(--text-muted)] truncate">
                                                Titel: {template.title}
                                            </p>
                                        )}
                                        
                                        {/* Show preview of fields */}
                                        <div className="mt-2 space-y-1">
                                            {template.what && (
                                                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs text-blue-500">assignment</span>
                                                    WAT ingevuld
                                                </p>
                                            )}
                                            {template.why && (
                                                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs text-amber-500">lightbulb</span>
                                                    WAAROM ingevuld
                                                </p>
                                            )}
                                            {template.how && (
                                                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs text-green-500">route</span>
                                                    HOE ingevuld
                                                </p>
                                            )}
                                            {template.criteria && (
                                                <p className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-xs text-purple-500">checklist</span>
                                                    CRITERIA ingevuld
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        {isLoading ? (
                                            <span className="material-symbols-outlined animate-spin text-[var(--text-muted)]">
                                                progress_activity
                                            </span>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => setEditingTemplate(template)}
                                                    className="p-1.5 rounded hover:bg-[var(--gray-200)] transition"
                                                    title="Bewerken"
                                                >
                                                    <span className="material-symbols-outlined text-sm text-[var(--text-muted)]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(template.id)}
                                                    className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                                                    title="Verwijderen"
                                                >
                                                    <span className="material-symbols-outlined text-sm text-red-500">delete</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add template modal */}
            {showAddModal && (
                <Modal
                    title="Nieuwe template"
                    onClose={() => setShowAddModal(false)}
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
            )}

            {/* Edit template modal */}
            {editingTemplate && (
                <Modal
                    title="Template bewerken"
                    onClose={() => setEditingTemplate(null)}
                >
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
                </Modal>
            )}
        </div>
    );
}
