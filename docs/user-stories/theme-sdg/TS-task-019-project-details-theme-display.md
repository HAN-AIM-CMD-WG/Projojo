# TS-task-019 — Theme Display on ProjectDetailsPage

**Phase**: 2 — UI Workflows  
**Priority**: 🟠 Medium-High  
**Type**: Functional Task  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §2D](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §2.3B](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: None (uses existing `GET /themes/project/{id}` endpoint)  

---

## Task Story

As any **user** (student, supervisor, teacher, or public visitor),  
I want to see which themes a project belongs to on its detail page,  
so that I understand the project's thematic context and SDG alignment.

---

## Acceptance Criteria

### AC-1: Theme section visible on project details

**Given** a project linked to themes "Duurzaamheid" and "Klimaat & Milieu"  
**When** any user views the ProjectDetailsPage  
**Then** a "Thema's" section is visible showing both themes as colored pills with icons

### AC-2: Theme pills show color and icon

**Given** the theme "Duurzaamheid" with color `#4CAF50` and icon `eco`  
**When** displayed on the project details page  
**Then** the pill shows the Material Symbols icon "eco" and the text "Duurzaamheid"  
**And** the pill uses `#4CAF50` as background or border color

### AC-3: Multiple themes displayed

**Given** a project with 4 linked themes  
**When** the details page renders  
**Then** all 4 themes are displayed as individual pills  
**And** they wrap to the next line if they exceed the container width

### AC-4: No themes — graceful empty state

**Given** a project with no linked themes  
**When** the details page renders  
**Then** the theme section either:
  - Shows "Geen thema's gekoppeld" (no themes linked), or
  - Is hidden entirely (acceptable for minimal clutter)

### AC-5: Theme data fetched per-project

**Given** the user navigates to a project details page  
**When** the page loads  
**Then** themes are fetched via `GET /themes/project/{project_id}`  
**And** a brief loading state is shown while fetching

### AC-6: Theme section positioned logically

**Given** the project details page layout  
**When** viewing the theme section  
**Then** it appears near project metadata (e.g. near skills, description, or business info)  
**And** does not disrupt the existing page layout

### AC-7: Read-only for all users by default

**Given** any user viewing the theme section  
**When** the page renders  
**Then** theme pills are not clickable or editable (edit functionality is in [TS-task-017](TS-task-017-theme-inline-edit-details.md))

---

## Technical Notes

- **File**: [`projojo_frontend/src/pages/ProjectDetailsPage.jsx`](../../../projojo_frontend/src/pages/ProjectDetailsPage.jsx) — currently has zero theme references
- **Also**: [`projojo_frontend/src/components/ProjectDetails.jsx`](../../../projojo_frontend/src/components/ProjectDetails.jsx) — the detail rendering component
- **Service call**: [`getProjectThemes(projectId)`](../../../projojo_frontend/src/services.js:253) — already defined, currently unused
- **Component**: Use `<ThemePicker readOnly={true} initialSelected={themeIds}>` from [TS-task-014](TS-task-014-theme-picker-component.md) in read-only mode, or render theme pills directly
- This task handles read-only display; inline editing is handled by [TS-task-017](TS-task-017-theme-inline-edit-details.md) which builds on top of this
