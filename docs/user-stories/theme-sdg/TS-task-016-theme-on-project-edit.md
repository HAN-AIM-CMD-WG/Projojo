# TS-task-016 — Theme Selection on Project Edit

**Phase**: 2 — UI Workflows  
**Priority**: 🔴 Critical  
**Type**: Functional Task  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §2B](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §2.2B](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: [TS-task-014](TS-task-014-theme-picker-component.md), [TS-task-003](TS-task-003-link-ownership-enforcement.md) + [TS-task-005](TS-task-005-atomic-theme-linking.md)  

---

## Task Story

As a **begeleider** (supervisor),  
I want to add or remove themes on an existing project via the edit form,  
so that I can keep the project's theme tags up to date as the project evolves.

---

## Acceptance Criteria

### AC-1: ThemePicker shows current themes pre-selected

**Given** a project linked to themes "Duurzaamheid" and "Innovatie & Technologie"  
**When** the supervisor opens the UpdateProjectPage for that project  
**Then** the ThemePicker section shows those 2 themes as selected pills

### AC-2: Add a theme

**Given** the project currently has themes A and B selected  
**When** the supervisor clicks on theme C (previously unselected)  
**Then** theme C becomes selected  
**And** upon saving, the project is linked to A, B, and C

### AC-3: Remove a theme

**Given** the project currently has themes A, B, and C selected  
**When** the supervisor clicks on theme B (deselecting it)  
**Then** theme B becomes unselected  
**And** upon saving, the project is linked to A and C only

### AC-4: Removing last theme shows confirmation

**Given** the project has only theme A selected  
**When** the supervisor deselects theme A (making the selection empty)  
**And** they attempt to save  
**Then** a confirmation appears: *"Alle thema's worden verwijderd van dit project. Weet je het zeker?"*

### AC-5: Confirm removes all themes

**Given** the empty-theme confirmation is showing  
**When** the supervisor clicks "Ja, verwijderen"  
**Then** all theme links are removed from the project  
**And** the save succeeds

### AC-6: Cancel preserves existing themes

**Given** the empty-theme confirmation is showing  
**When** the supervisor clicks "Annuleren"  
**Then** the theme selection reverts to the pre-deselected state  
**And** no changes are saved

### AC-7: Theme changes saved alongside other edits

**Given** the supervisor changes both the project description and the theme selection  
**When** they save the form  
**Then** both the project data update and the theme linking happen  
**And** the user experiences a single save action

---

## Technical Notes

- **File**: [`projojo_frontend/src/pages/UpdateProjectPage.jsx`](../../../projojo_frontend/src/pages/UpdateProjectPage.jsx) — currently has zero theme references
- **Service calls**:
  1. [`getProjectThemes(projectId)`](../../../projojo_frontend/src/services.js:253) — fetch current themes on page load (currently unused service function)
  2. [`linkProjectThemes(projectId, themeIds)`](../../../projojo_frontend/src/services.js:307) — save updated theme selection
- **Component**: Use `<ThemePicker initialSelected={currentThemeIds} onChange={setSelectedThemes}>` from [TS-task-014](TS-task-014-theme-picker-component.md)
- Theme linking is a separate API call from the project update — coordinate both in the save handler
