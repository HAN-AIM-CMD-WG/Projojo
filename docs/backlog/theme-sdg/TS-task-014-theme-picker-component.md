# TS-task-014 — Reusable ThemePicker Component

**Phase**: 2 — UI Workflows  
**Priority**: 🔴 Critical  
**Type**: Functional Task  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §2B](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §2.2](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: None (uses existing `GET /themes/` endpoint)  

---

## Task Story

As a **begeleider** (supervisor),  
I want a visual theme picker where I can select themes for my project,  
so that I can tag projects with relevant themes in an intuitive way.

---

## Acceptance Criteria

### AC-1: All themes displayed as clickable pills

**Given** 6 themes exist in the database  
**When** the ThemePicker component renders  
**Then** all 6 themes are shown as pill/chip elements  
**And** each pill displays a color dot (using the theme's color) and the theme name

### AC-2: Unselected state styling

**Given** a theme pill that is not selected  
**When** viewed by the user  
**Then** it has a neutral/outlined appearance (neumorphic `neu-flat` or outlined style)  
**And** the theme color is visible as a small dot or subtle border

### AC-3: Selected state styling

**Given** a theme pill that is selected  
**When** viewed by the user  
**Then** it has a filled/highlighted appearance using the theme's color as background  
**And** the text is legible (white or dark depending on color contrast)

### AC-4: Toggle selection on click

**Given** an unselected theme pill  
**When** the user clicks it  
**Then** the pill becomes selected  
**And** the change is reflected immediately in the UI

**Given** a selected theme pill  
**When** the user clicks it  
**Then** the pill becomes unselected

### AC-5: No limit on selections

**Given** all 6 themes are available  
**When** the user selects all 6  
**Then** all 6 are marked as selected  
**And** no limit warning or blocking occurs

### AC-6: Pre-selected themes supported

**Given** a project already linked to themes A and C  
**When** the ThemePicker renders with `initialSelected={["theme-a", "theme-c"]}`  
**Then** pills A and C are shown in their selected state

### AC-7: Read-only mode

**Given** the ThemePicker is rendered with `readOnly={true}`  
**When** the user views the pills  
**Then** pills show selected themes but are not clickable  
**And** no hover/pointer cursor appears

### AC-8: Callback on selection change

**Given** the ThemePicker has an `onChange` callback prop  
**When** the user toggles any theme selection  
**Then** the callback is called with the current array of selected theme IDs

### AC-9: Loading state

**Given** themes are being fetched from the API  
**When** the ThemePicker is loading  
**Then** a subtle loading indicator or skeleton pills are shown

### AC-10: Empty state

**Given** no themes exist in the database  
**When** the ThemePicker renders  
**Then** a message is shown: "Geen thema's beschikbaar"

### AC-11: Keyboard accessible

**Given** the ThemePicker is rendered  
**When** a user navigates with Tab key  
**Then** each pill is focusable  
**And** Enter/Space toggles selection  
**And** focus indicators (3px primary color ring) are visible

---

## Technical Notes

- **New component**: `projojo_frontend/src/components/ThemePicker.jsx`
- **Props API**:
  ```jsx
  <ThemePicker
    initialSelected={["theme-id-1", "theme-id-2"]}  // pre-selected theme IDs
    onChange={(selectedIds) => { ... }}                 // callback on change
    readOnly={false}                                    // toggle read/edit mode
  />
  ```
- **Service call**: [`getThemes()`](../../../projojo_frontend/src/services.js:236) to fetch available themes
- **Design**: Match existing theme pills on [`PublicDiscoveryPage.jsx:82`](../../../projojo_frontend/src/pages/PublicDiscoveryPage.jsx:82) — colored pills with selection state
- **Reused in**: [TS-task-015](TS-task-015-theme-on-project-create.md) (ProjectsAddPage), [TS-task-016](TS-task-016-theme-on-project-edit.md) (UpdateProjectPage), [TS-task-017](TS-task-017-theme-inline-edit-details.md) (ProjectDetailsPage inline), [TS-task-025](TS-task-025-student-interest-selection.md) (student interest selection)
- **Accessibility**: WCAG 2.1 AA — keyboard navigation, focus indicators, `aria-pressed` on pills per [`AGENTS.md`](../../../AGENTS.md) requirements
