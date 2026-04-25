# ARCH-task-014 — Archive Modal with Backend Preview

**User Story**: [ARCH-story-004 — Archive Management UX](ARCH-story-004-archive-management-ux.md)  
**Priority**: 🔴 Critical  
**Type**: Functional Task  
**Spec references**: [§3.1](../../ARCHIVING_SPECIFICATION.md), [§6.2](../../ARCHIVING_SPECIFICATION.md), [§7.5](../../ARCHIVING_SPECIFICATION.md)  
**Dependencies**: [ARCH-task-006](ARCH-task-006-business-archive.md), [ARCH-task-007](ARCH-task-007-project-archive.md), [ARCH-task-008](ARCH-task-008-task-archive.md)

---

## Task Story

As a **teacher**,  
I want a modal that shows me the real backend-calculated impact of archiving an entity before I confirm, with a required reason field,  
so that I make informed archive decisions and every archive action has a documented reason.

---

## Context: What Must Change and Why

The current codebase has three separate archive modal implementations:

- [`BusinessCard.jsx:231–253`](../../../projojo_frontend/src/components/BusinessCard.jsx:231): Hardcoded warning text, no preview, no reason field
- [`ProjectDetails.jsx:221–248`](../../../projojo_frontend/src/components/ProjectDetails.jsx:221): Same pattern
- [`Task.jsx:234–259`](../../../projojo_frontend/src/components/Task.jsx:234): Same pattern

All three share the same flaws per [`ARCHIVING_REUSABLE_CODE.md` §11.1–11.3](../../ARCHIVING_REUSABLE_CODE.md):
1. No backend preview — the modal shows a generic hardcoded warning
2. No reason input field — `archived_reason` is required in the HTTP API contract
3. Supervisor/owner visibility checks — must become teacher-only
4. Direct execution without preview step

The specification (§6.2) requires:
1. Open modal → request backend preview → show real impact → teacher enters reason → confirm execution

**UI design note**: The existing modal component (`Modal.jsx`), the loading state pattern, the error display, and the cancel/confirm button layout are the desired interaction patterns per the task instructions. Preserve these styling conventions.

---

## Acceptance Criteria

### AC-1: Archive action visible only to teachers

**Given** a user views a business, project, or task  
**When** the user's role is checked  
**Then** the archive button/icon is visible only to teachers  
**And** not to supervisors or students

**This is a change from current behavior** where supervisors also see archive options for their own entities.

### AC-2: Modal opens and immediately fetches preview

**Given** a teacher clicks the archive action on any entity  
**When** the archive modal opens  
**Then** the modal immediately calls the backend preview endpoint (`confirm=false`)  
**And** a loading state is shown while the preview loads

### AC-3: Preview displays affected entities from backend response

**Given** the backend returns an archive preview response  
**When** the preview renders in the modal  
**Then** the modal shows the list of affected entities by type:
- For business: affected projects, tasks, registrations, supervisors (with `will_be_archived` flag)
- For project: affected tasks, registrations
- For task: affected registrations

**And** entity counts are shown per type  
**And** individual entity names are listed (or summarized if the list is very long)

### AC-4: Reason field required before confirmation

**Given** the preview has loaded in the modal  
**When** the teacher has not entered a reason  
**Then** the confirm button is disabled  
**And** the reason text input has a placeholder like "Reden voor archivering"

**And given** the teacher enters a non-empty reason  
**Then** the confirm button becomes enabled

### AC-5: Confirmation executes archive with reason

**Given** the teacher has reviewed the preview and entered a reason  
**When** the teacher clicks the confirm button  
**Then** the frontend calls the archive endpoint with `confirm=true` and the entered reason in the `archived_reason` request field  
**And** a loading state is shown during execution  
**And** on success, the modal closes and the page data refreshes  
**And** duplicate submissions are prevented (button disabled during loading)

### AC-6: Error handling in modal

**Given** the backend preview or execution returns an error  
**When** the error is received  
**Then** an error message is displayed inside the modal  
**And** the modal remains open so the teacher can retry or cancel

### AC-7: Preview error shows graceful fallback

**Given** the backend preview fails (e.g., network error)  
**When** the modal is open  
**Then** an error message is shown instead of the preview  
**And** the confirm button remains disabled (cannot archive without seeing preview)

### AC-8: Cancel closes modal without side effects

**Given** the archive modal is open at any stage  
**When** the teacher clicks cancel or closes the modal  
**Then** no data is modified  
**And** the modal state resets cleanly

### AC-9: Notification honesty (spec §7.5)

**Given** notifications are deferred and not yet implemented  
**When** the archive modal displays the impact preview  
**Then** the modal does **not** claim students will be notified automatically  
**And** the warning text is honest about the impact without promising notification delivery

### AC-10: Single reusable modal component

**Given** archive modals are needed for business, project, and task  
**When** the modal component is implemented  
**Then** a single `ArchiveModal` component handles all three entity types  
**And** it accepts entity type, entity ID, and entity name as props  
**And** it adapts the preview display based on the response shape

---

## Technical Notes

### Reusable code from current codebase

The existing modal pattern (🟡 tier, [`ARCHIVING_REUSABLE_CODE.md` §11.1](../../ARCHIVING_REUSABLE_CODE.md)) provides the UX skeleton:

```jsx
// Current pattern — preserve this loading/confirm UX
<Modal modalHeader="Bedrijf archiveren" isModalOpen={...} setIsModalOpen={...}>
    <div className="p-4">
        {isLoading ? (
            <div className="flex flex-col items-center gap-4">
                <p className="font-semibold">Aan het archiveren...</p>
                <Loading size="48px" />
            </div>
        ) : (
            <>
                {error && <p className="text-red-600 ...">{error}</p>}
                {/* ADD: Preview content here */}
                {/* ADD: Reason input field here */}
                <div className="flex gap-2">
                    <button className="btn-secondary flex-1" onClick={cancel}>Annuleren</button>
                    <button className="btn-primary bg-red-600 hover:bg-red-700 flex-1" 
                            onClick={confirm} disabled={!reason.trim()}>
                        Bevestig archiveren
                    </button>
                </div>
            </>
        )}
    </div>
</Modal>
```

### Service function changes

The HTTP payload for archive requests uses snake_case field names to match existing backend API conventions. JavaScript may still use camelCase local variable names before serializing the request body.

Current archive service functions (🟡 tier) need body parameter:

```javascript
// FROM:
export function archiveBusiness(businessId) {
    return fetchWithError(`${API_BASE_URL}businesses/${businessId}/archive`, {
        method: "PATCH",
    }, true);
}

// TO:
export function archiveBusiness(businessId, { confirm, archivedReason }) {
    return fetchWithError(`${API_BASE_URL}businesses/${businessId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm, archived_reason: archivedReason }),
    });
}
```

### Risks

- **Risk**: The preview call adds latency before the teacher can see the impact. If the preview is slow, the UX may feel sluggish. Consider caching or optimistic display.
- **Resolved**: Show individual entity names for ≤10 items per type; for larger lists, show counts with expandable detail (e.g., "12 taken" with a click-to-expand).

### Files likely affected

- New component: `projojo_frontend/src/components/ArchiveModal.jsx`
- [`projojo_frontend/src/pages/TeacherPage.jsx`](../../../projojo_frontend/src/pages/TeacherPage.jsx) — archive button triggers new modal
- [`projojo_frontend/src/components/BusinessCard.jsx`](../../../projojo_frontend/src/components/BusinessCard.jsx) — remove old archive modal
- [`projojo_frontend/src/components/ProjectDetails.jsx`](../../../projojo_frontend/src/components/ProjectDetails.jsx) — remove old archive modal
- [`projojo_frontend/src/components/Task.jsx`](../../../projojo_frontend/src/components/Task.jsx) — remove old archive modal
- [`projojo_frontend/src/services.js`](../../../projojo_frontend/src/services.js) — update archive service functions
