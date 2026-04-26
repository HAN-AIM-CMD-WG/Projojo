# TS-task-017 — Inline Theme Editing on ProjectDetailsPage

**Phase**: 2 — UI Workflows  
**Priority**: 🟠 Medium-High  
**Type**: Functional Task  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §2B, §2D](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §2.2C](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: [TS-task-014](TS-task-014-theme-picker-component.md), [TS-task-019](TS-task-019-project-details-theme-display.md) (read-only display must exist first)  

---

## Task Story

As a **begeleider** (supervisor) viewing my project details,  
I want to edit theme assignments directly on the project details page,  
so that I can quickly update themes without navigating to the full edit form.

---

## Acceptance Criteria

### AC-1: Edit button visible for project owners

**Given** a supervisor who owns the project (through their business)  
**When** they view the theme section on ProjectDetailsPage  
**Then** an edit (pencil) icon/button is visible next to the themes heading

### AC-2: Edit button visible for teachers

**Given** a teacher viewing any project's details page  
**When** they view the theme section  
**Then** the edit button is visible (teachers can edit any project's themes)

### AC-3: Edit button hidden for non-owners

**Given** a student or a supervisor from a different business  
**When** they view the project details page  
**Then** no edit button is visible in the theme section  
**And** themes are displayed in read-only mode only

### AC-4: Click edit toggles to ThemePicker

**Given** the project owner clicks the edit button  
**When** the theme section enters edit mode  
**Then** the read-only theme pills are replaced by the interactive ThemePicker  
**And** currently linked themes are pre-selected  
**And** "Opslaan" (Save) and "Annuleren" (Cancel) buttons appear

### AC-5: Save persists changes

**Given** the supervisor has toggled theme selections in edit mode  
**When** they click "Opslaan"  
**Then** the theme links are updated via the API  
**And** the section returns to read-only mode with updated themes  
**And** a success message is shown

### AC-6: Cancel discards changes

**Given** the supervisor has modified selections  
**When** they click "Annuleren"  
**Then** the section returns to read-only mode with original themes  
**And** no API call is made

### AC-7: Removing last theme shows confirmation

**Given** the project has 1 theme and the supervisor deselects it  
**When** they click "Opslaan"  
**Then** a confirmation dialog appears: *"Alle thema's worden verwijderd van dit project. Weet je het zeker?"*

### AC-8: Error during save

**Given** the supervisor saves theme changes  
**When** the API returns an error  
**Then** the error message is displayed  
**And** the section remains in edit mode for retry

---

## Technical Notes

- **File**: [`projojo_frontend/src/pages/ProjectDetailsPage.jsx`](../../../projojo_frontend/src/pages/ProjectDetailsPage.jsx) — currently has zero theme references
- **Component**: Use `<ThemePicker readOnly={!isEditing} initialSelected={currentThemeIds} onChange={...}>` from [TS-task-014](TS-task-014-theme-picker-component.md)
- **Service calls**: 
  - [`getProjectThemes(projectId)`](../../../projojo_frontend/src/services.js:253) — fetch current themes
  - [`linkProjectThemes(projectId, themeIds)`](../../../projojo_frontend/src/services.js:307) — save changes
- **Ownership check**: Determine if current user can edit by checking `authData.type === "teacher"` or matching supervisor's business against project's business
- Match inline edit patterns already used elsewhere in the project detail views (e.g. task editing in [`Task.jsx`](../../../projojo_frontend/src/components/Task.jsx))
