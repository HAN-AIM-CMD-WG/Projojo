# TS-task-010 — Theme Management List on TeacherPage

**Phase**: 2 — UI Workflows  
**Priority**: 🔴 Critical  
**Type**: Functional Task  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §2A](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §2.1](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: None (reads via existing `GET /themes/`)  

---

## Task Story

As a **docent** (teacher),  
I want to see all themes in a manageable list on my teacher page,  
so that I can oversee the theme catalog and access management actions.

---

## Acceptance Criteria

### AC-1: Theme section visible on TeacherPage

**Given** a teacher navigates to the TeacherPage  
**When** the page loads  
**Then** a "Thema's" section is visible alongside the existing business and skills management sections

### AC-2: All themes displayed in sorted list

**Given** 6 seed themes exist in the database  
**When** the "Thema's" section loads  
**Then** all 6 themes are displayed in a table/list sorted by display_order then name  
**And** each row shows: color swatch, icon, theme name, SDG code(s), description (truncated if long)

### AC-3: Action buttons per theme

**Given** the theme list is displayed  
**When** the teacher views a theme row  
**Then** each row has a "Bewerken" (edit) button and a "Verwijderen" (delete) button

### AC-4: "Nieuw thema" button available

**Given** the teacher is viewing the "Thema's" section  
**When** looking above the theme list  
**Then** a "Nieuw thema" (new theme) button is visible and clickable

### AC-5: Loading state

**Given** the teacher navigates to the TeacherPage  
**When** themes are being fetched  
**Then** a loading indicator (skeleton or spinner) is shown in the theme section

### AC-6: Error state

**Given** the theme fetch fails  
**When** the API returns an error  
**Then** an error message is displayed: "Er is iets misgegaan bij het ophalen van de thema's."

### AC-7: Empty state

**Given** no themes exist in the database  
**When** the theme list loads  
**Then** a message is shown: "Nog geen thema's aangemaakt"  
**And** the "Nieuw thema" button remains available

### AC-8: Non-teachers cannot access

**Given** a user who is not a teacher (student or supervisor)  
**When** they navigate to the TeacherPage  
**Then** they are redirected to /not-found (existing behavior)

---

## Technical Notes

- **New component**: `projojo_frontend/src/components/ThemeManagement.jsx`
- **Embed in**: [`projojo_frontend/src/pages/TeacherPage.jsx`](../../../projojo_frontend/src/pages/TeacherPage.jsx:6) alongside [`NewSkillsManagement`](../../../projojo_frontend/src/components/NewSkillsManagement.jsx:7)
- **Service call**: [`getThemes()`](../../../projojo_frontend/src/services.js:236) — already defined and working
- **Design pattern**: Match the table/list style already used for businesses on TeacherPage (list items with action buttons)
- **Neumorphic styling**: Use `neu-flat` for the section container, `neu-btn` for action buttons
- This task handles the read/display portion. Create ([TS-task-011](TS-task-011-theme-create-modal.md)), edit ([TS-task-012](TS-task-012-theme-edit-modal.md)), and delete ([TS-task-013](TS-task-013-theme-delete-confirmation.md)) are separate tasks
