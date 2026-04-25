# TS-task-015 — Theme Selection on Project Creation

**Phase**: 2 — UI Workflows  
**Priority**: 🔴 Critical  
**Type**: Functional Task  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §2B](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §2.2A](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: [TS-task-014](TS-task-014-theme-picker-component.md) (ThemePicker component), [TS-task-003](TS-task-003-link-ownership-enforcement.md) + [TS-task-005](TS-task-005-atomic-theme-linking.md) + [TS-task-008](TS-task-008-link-existence-validation.md) (backend linking must be secure and atomic)  

---

## Task Story

As a **begeleider** (supervisor),  
I want to assign themes when creating a new project,  
so that the project is discoverable by theme from the moment it is published.

---

## Acceptance Criteria

### AC-1: ThemePicker section in create form

**Given** a supervisor is on the ProjectsAddPage creating a new project  
**When** the form loads  
**Then** a "Thema's" section is visible containing the ThemePicker component with no pre-selected themes

### AC-2: Theme selection is optional

**Given** the create form with no themes selected  
**When** the supervisor submits the project  
**Then** the project is created successfully with no theme links  
**And** no error is shown about missing themes

### AC-3: Themes linked after project creation

**Given** the supervisor selects themes "Duurzaamheid" and "Klimaat & Milieu"  
**When** they submit the project  
**Then** the project is first created (getting a project ID)  
**And** then the selected themes are linked via `PUT /themes/project/{project_id}`  
**And** the user sees a single success flow (not two separate operations)

### AC-4: Theme linking failure does not lose the project

**Given** the supervisor creates a project and selects themes  
**When** the project creation succeeds but theme linking fails  
**Then** the project still exists (it was already created)  
**And** an error message explains that theme linking failed  
**And** the supervisor can retry linking from the project edit page

### AC-5: ThemePicker positioned logically in form

**Given** the project create form  
**When** the supervisor scrolls through fields  
**Then** the ThemePicker appears after the main project fields (name, description, etc.) and before the submit button

---

## Technical Notes

- **File**: [`projojo_frontend/src/pages/ProjectsAddPage.jsx`](../../../projojo_frontend/src/pages/ProjectsAddPage.jsx) — currently has zero theme references
- **Also related**: [`projojo_frontend/src/components/AddProjectForm.jsx`](../../../projojo_frontend/src/components/AddProjectForm.jsx) — the actual form component used within ProjectsAddPage
- **Service calls**: 
  1. Existing project creation call (already implemented)
  2. [`linkProjectThemes(projectId, themeIds)`](../../../projojo_frontend/src/services.js:307) — called after project creation with the returned project ID
- **Two-step flow**: Project creation returns the new project ID → use that ID to call the linking endpoint. This is necessary because the linking endpoint requires an existing project.
- **Component**: Use `<ThemePicker>` from [TS-task-014](TS-task-014-theme-picker-component.md)
