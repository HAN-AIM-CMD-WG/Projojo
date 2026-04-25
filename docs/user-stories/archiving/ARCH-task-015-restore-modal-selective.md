# ARCH-task-015 — Restore Modal with Selective Descendants

**User Story**: [ARCH-story-004 — Archive Management UX](ARCH-story-004-archive-management-ux.md)  
**Priority**: 🔴 Critical  
**Type**: Functional Task  
**Spec references**: [§6.3](../../ARCHIVING_SPECIFICATION.md), [§4.4](../../ARCHIVING_SPECIFICATION.md), [§7.5](../../ARCHIVING_SPECIFICATION.md)  
**Dependencies**: [ARCH-task-009](ARCH-task-009-business-restore.md), [ARCH-task-010](ARCH-task-010-project-restore.md), [ARCH-task-011](ARCH-task-011-task-restore.md), [ARCH-task-013](ARCH-task-013-teacher-archived-views.md)

---

## Task Story

As a **teacher**,  
I want a restore modal that shows all archived descendants with preselected items from the same cascade, allows me to adjust selections while respecting parent-child dependencies, and then executes the selective restore,  
so that I have full control over what gets restored and can restore incrementally.

---

## Context: What Must Change and Why

The current codebase has no restore modal — restore is a single-click button that blindly restores everything ([`TeacherPage.jsx:98`](../../../projojo_frontend/src/pages/TeacherPage.jsx:98)). The [`ARCHIVING_REUSABLE_CODE.md` §11.4](../../ARCHIVING_REUSABLE_CODE.md) rates the current unarchive button as 🔴 Reference Only because the spec requires an entirely different UX.

The specification (§6.3) requires a preview modal with:
1. Descendant listing with archive metadata
2. Intelligent preselection
3. Adjustable selections with dependency enforcement
4. Confirmation before execution

This is the most complex frontend component in the archiving system.

---

## Acceptance Criteria

### AC-1: Modal opens and fetches restore preview

**Given** a teacher clicks the restore action on an archived entity (from ARCH-task-013)  
**When** the restore modal opens  
**Then** the modal immediately calls the backend restore preview endpoint (`confirm=false`)  
**And** a loading state is shown while the preview loads

### AC-2: Root entity shown as always-restored

**Given** the restore preview loads  
**When** the modal renders the preview  
**Then** the root entity (business/project/task) is displayed prominently  
**And** it is marked as "will be restored" with no option to deselect it  
**And** its archive metadata (`archived_at`, `archived_reason`) is visible

### AC-3: Preselected descendants shown as checked

**Given** the restore preview contains descendants with `preselected: true`  
**When** the modal renders the descendant list  
**Then** those descendants have their checkboxes checked by default  
**And** the teacher can uncheck them

### AC-4: Non-preselected descendants shown as unchecked

**Given** the restore preview contains descendants with `preselected: false` (archived independently)  
**When** the modal renders  
**Then** those descendants have unchecked checkboxes  
**And** their archive metadata (different reason/date) is visible so the teacher understands why they were not preselected

### AC-5: Dependency enforcement prevents invalid selections

**Given** the restore preview shows a project with child tasks  
**When** the teacher unchecks a project  
**Then** all tasks under that project become disabled (cannot be selected)  
**And** if any tasks were checked, they are automatically unchecked  
**And** an inline explanation shows why (e.g., "Bovenliggend project niet geselecteerd")

### AC-6: Re-selecting parent re-enables children

**Given** the teacher previously unchecked a project, disabling its tasks  
**When** the teacher re-checks the project  
**Then** the tasks under that project become selectable again  
**And** previously preselected tasks are re-checked automatically

### AC-7: Blocked descendants shown with explanation

**Given** the restore preview contains descendants with `blocked: true` and a `blocked_reason`  
**When** the modal renders  
**Then** those descendants have disabled checkboxes  
**And** the `blocked_reason` is shown as helper text

### AC-8: Confirm executes selective restore

**Given** the teacher has reviewed and adjusted selections  
**When** the teacher clicks the confirm button  
**Then** the frontend calls the restore endpoint with `confirm=true` and the `selected` payload containing IDs of all checked descendants  
**And** a loading state is shown during execution  
**And** on success, the modal closes and the page data refreshes

### AC-9: Descendant groups organized by type

**Given** a business restore preview with projects, tasks, registrations, and supervisors  
**When** the modal renders descendants  
**Then** descendants are grouped by type with clear headings:
- "Projecten" with count
- "Taken" with count
- "Inschrijvingen" with count
- "Supervisoren" with count (business restore only)

### AC-10: Empty descendant state

**Given** the root entity has no archived descendants  
**When** the restore preview loads  
**Then** the modal shows the root entity will be restored  
**And** indicates "Geen gearchiveerde onderliggende items"  
**And** the confirm button is enabled (root-only restore is valid)

### AC-11: Error handling

**Given** the restore preview or execution fails  
**When** an error occurs  
**Then** an error message displays in the modal  
**And** the modal remains open for retry  
**And** the confirm button is re-enabled after an error

### AC-12: Cancel closes modal without side effects

**Given** the restore modal is open at any stage  
**When** the teacher cancels  
**Then** no data is modified and the modal resets

### AC-13: Notification honesty

**Given** notifications are not yet implemented  
**When** the restore modal is open  
**Then** it does not claim students will be notified about the restore

---

## Technical Notes

### Component structure

The restore modal is significantly more complex than the archive modal due to the interactive selection tree. Suggested component hierarchy:

```
RestoreModal
├── RestorePreviewRoot (shows root entity info)
├── RestoreCandidateGroup (one per entity type)
│   └── RestoreCandidateItem (checkbox + name + metadata + blocked reason)
└── RestoreActions (cancel + confirm buttons)
```

### Selection state management

The selection state can be modeled as a flat `Set<string>` of selected entity IDs. Dependency enforcement happens on the parent toggle:

```javascript
// When unchecking a project, uncheck all its child tasks
function toggleProject(projectId, checked) {
    if (!checked) {
        // Remove project and all tasks whose parent is this project
        const childTaskIds = candidates.tasks
            .filter(t => t.project_id === projectId)
            .map(t => t.id);
        setSelected(prev => {
            const next = new Set(prev);
            next.delete(projectId);
            childTaskIds.forEach(id => next.delete(id));
            return next;
        });
    }
}
```

### Service function changes

```javascript
// FROM:
export function restoreBusiness(businessId) {
    return fetchWithError(`...businesses/${businessId}/restore`, { method: "PATCH" }, true);

// TO:
export function restoreBusiness(businessId, { confirm, selected }) {
    return fetchWithError(`...businesses/${businessId}/restore`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm, selected }),
    });
}
```

### Preserve current UI conventions

- Use `neu-flat` / `neu-pressed` styling for the modal content areas
- Use `neu-btn-primary` for confirm, `neu-btn` for cancel
- Green confirm button for restore (matching current green restore icon)
- Use the existing `Modal.jsx` component as the shell

### Risks

- **Complexity**: This is the most complex frontend component in the archive system. The dependency tree enforcement with dynamic enable/disable is non-trivial. Consider thorough manual testing in addition to E2E tests.
- **Risk**: Deep hierarchies (business → projects → tasks → registrations) create a long list. Consider expandable/collapsible groups for business restore.
- **Accessibility**: Checkboxes with `disabled` state need proper `aria-disabled` and screen reader labels explaining why they're disabled.

### Files likely affected

- New component: `projojo_frontend/src/components/RestoreModal.jsx`
- [`projojo_frontend/src/pages/TeacherPage.jsx`](../../../projojo_frontend/src/pages/TeacherPage.jsx) — restore action triggers new modal
- [`projojo_frontend/src/services.js`](../../../projojo_frontend/src/services.js) — update restore service functions
