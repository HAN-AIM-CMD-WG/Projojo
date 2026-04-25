# ARCH-task-013 — Teacher Page: Archived Views for Businesses, Projects, and Tasks

**User Story**: [ARCH-story-004 — Archive Management UX](ARCH-story-004-archive-management-ux.md)  
**Priority**: 🔴 Critical  
**Type**: Functional Task  
**Spec references**: [§6.1](../../ARCHIVING_SPECIFICATION.md), [§6.5](../../ARCHIVING_SPECIFICATION.md)  
**Dependencies**: [ARCH-task-012](ARCH-task-012-archived-listing-endpoints.md)

---

## Task Story

As a **teacher**,  
I want to see archived businesses, projects, and tasks in dedicated sections on my management page, with archive metadata displayed and restore actions available or disabled with explanation,  
so that I can review archived entities and initiate restore when appropriate.

---

## Context: What Must Change and Why

The current [`TeacherPage.jsx`](../../../projojo_frontend/src/pages/TeacherPage.jsx:13) has a partial implementation:

**What exists and is reusable (current UI styling):**
- Collapsible "Gearchiveerde Organisaties" section with count badge ([line 184–247](../../../projojo_frontend/src/pages/TeacherPage.jsx:184))
- `neu-pressed` card styling for archived items with `opacity-75` and `grayscale` image treatment
- Grid layout matching active business cards
- Restore button with green `unarchive` icon

**What must change:**
1. **No archive metadata displayed** — items show name/location only. Spec §6.1 requires `archivedAt`, `archivedReason` to be visible.
2. **No archived projects or tasks sections** — only businesses are shown. Spec §6.1 requires all three entity types.
3. **Restore button calls directly** — no preview modal. Must open restore preview modal (ARCH-task-015).
4. **No blocked-restore indication** — projects/tasks with archived parents show no explanation. Spec §6.1 requires disabled action with explanation.
5. **"Publiceren" title on restore button** ([line 239](../../../projojo_frontend/src/pages/TeacherPage.jsx:239)) — draft/publication language must be removed (ARCH-task-003).
6. **Archive state detection uses `isArchived`** — must use `archived_at` presence (spec §6.5).
7. **`end_date` must not drive visibility** — ensure no archive heuristic based on end dates.

---

## Acceptance Criteria

### AC-1: Archived businesses section with metadata

**Given** archived businesses exist  
**When** a teacher views the TeacherPage  
**Then** a collapsible "Gearchiveerde Organisaties" section is visible with a count badge  
**And** each archived business card shows:
- Business name and location
- `archived_at` formatted as a readable date
- `archived_reason` text
- A restore action button

### AC-2: Archived projects section with metadata

**Given** archived projects exist  
**When** a teacher views the TeacherPage  
**Then** a collapsible "Gearchiveerde Projecten" section is visible with a count badge  
**And** each archived project card shows:
- Project name, parent business name
- `archived_at` formatted as a readable date
- `archived_reason` text
- A restore action button (or disabled button if blocked)

### AC-3: Archived tasks section with metadata

**Given** archived tasks exist  
**When** a teacher views the TeacherPage  
**Then** a collapsible "Gearchiveerde Taken" section is visible with a count badge  
**And** each archived task card shows:
- Task name, parent project name
- `archived_at` formatted as a readable date
- `archived_reason` text
- A restore action button (or disabled button if blocked)

### AC-4: Blocked restore shows disabled button with explanation

**Given** an archived project whose parent business is still archived  
**When** the teacher views the project in the archived projects section  
**Then** the restore button is **disabled, not hidden**  
**And** an explanation is shown (tooltip or inline text) such as "Kan niet worden hersteld: het bovenliggende bedrijf is nog gearchiveerd"

### AC-5: Blocked restore for tasks with archived parents

**Given** an archived task whose parent project or grandparent business is archived  
**When** the teacher views the task in the archived tasks section  
**Then** the restore button is disabled  
**And** an explanation identifies which parent entity is still archived

### AC-6: Restore button opens restore preview modal

**Given** a teacher views an archived entity where restore is not blocked  
**When** the teacher clicks the restore button  
**Then** the restore preview modal opens (implemented in ARCH-task-015)  
**And** the restore is **not** executed directly on button click

### AC-7: Archive state determined by `archived_at` presence

**Given** the frontend receives entity data from the API  
**When** determining whether to display an entity as archived  
**Then** the check uses `archived_at !== null` (or `archived_at` field presence)  
**And** does **not** use `is_archived`, `isArchived`, or `end_date` for this determination

### AC-8: Preserve current UI styling conventions

**Given** the existing archived business card design  
**When** archived sections are implemented for all three entity types  
**Then** the `neu-pressed` card style, `opacity-75`, grayscale image treatment, and grid layout are preserved  
**And** the green restore icon (`unarchive` material symbol) convention is preserved  
**And** the collapsible section pattern with chevron rotation is preserved

### AC-9: Loading and error states for each section

**Given** archived data is being fetched  
**When** the section is loading  
**Then** a skeleton or spinner is shown  
**And** if the fetch fails, an error message is displayed per section without breaking other sections

### AC-10: Empty state for each section

**Given** no archived entities of a particular type exist  
**When** the section is expanded  
**Then** a message like "Geen gearchiveerde [type]" is shown  
**And** the section count badge shows 0 or the section can be hidden

---

## Technical Notes

### Reusable code from current codebase

The current [`TeacherPage.jsx`](../../../projojo_frontend/src/pages/TeacherPage.jsx:184) archived business section (🟡 tier from [`ARCHIVING_REUSABLE_CODE.md` §11.5](../../ARCHIVING_REUSABLE_CODE.md)) provides the pattern to extend for projects and tasks:

```jsx
// Collapsible section pattern — reuse for all three types
<button onClick={() => setShowArchivedSection(!showArchivedSection)}
    className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
    <span className={`material-symbols-outlined transition-transform ${showArchivedSection ? 'rotate-90' : ''}`}>
        chevron_right
    </span>
    <span className="font-bold">Gearchiveerde Organisaties</span>
    <span className="neu-badge-outline">{archivedBusinesses.length}</span>
</button>

// Archived card styling — reuse for all types
<div className="neu-pressed p-4 opacity-75">
    {/* ... card contents with grayscale images ... */}
</div>
```

### Service calls

```javascript
// These already exist and need minor URL updates
getArchivedBusinesses()   // GET /businesses/archived
getArchivedProjects()     // GET /projects/archived  — needs adding if not present
getArchivedTasks()        // GET /tasks/archived     — needs adding if not present
```

### Component extraction suggestion

The three archived sections follow identical patterns. Consider extracting an `ArchivedSection` component that takes:
- `title`, `entityType`, `items`, `onRestore`, `isBlocked(item)`, `blockedReason(item)`

This aligns with [`ARCHIVING_REUSABLE_CODE.md` ADR-04](../../ARCHIVING_REUSABLE_CODE.md) which suggests extracting shared modal/section patterns.

### Risks

- **Risk**: Fetching three separate archived lists adds API calls to the teacher page load. Use `Promise.allSettled()` (the current pattern) for parallel non-blocking fetches.
- **Risk**: The blocked-restore logic requires the frontend to evaluate `parent_business_archived` / `parent_project_archived` from the listing API response (ARCH-task-012).

### Files likely affected

- [`projojo_frontend/src/pages/TeacherPage.jsx`](../../../projojo_frontend/src/pages/TeacherPage.jsx) — major update
- [`projojo_frontend/src/services.js`](../../../projojo_frontend/src/services.js) — ensure all three listing service functions exist
- Potentially new component: `ArchivedSection.jsx` or `ArchivedEntityCard.jsx`
