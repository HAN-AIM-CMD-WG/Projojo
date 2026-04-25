# TS-task-013 — Theme Delete with Confirmation Dialog

**Phase**: 2 — UI Workflows  
**Priority**: 🔴 Critical  
**Type**: Functional Task  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §2A](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §2.1](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: [TS-task-010](TS-task-010-theme-management-list.md), [TS-task-002](TS-task-002-project-deletion-cascade.md) (cascade must work first)  

---

## Task Story

As a **docent** (teacher),  
I want to delete themes with a clear warning about the impact,  
so that I don't accidentally unlink themes from projects without understanding the consequences.

---

## Acceptance Criteria

### AC-1: Delete button triggers confirmation dialog

**Given** the teacher clicks "Verwijderen" on a theme row  
**When** the action is triggered  
**Then** a confirmation modal appears (the theme is NOT immediately deleted)

### AC-2: Confirmation shows project count

**Given** the theme "Duurzaamheid" is linked to 4 projects  
**When** the delete confirmation dialog opens  
**Then** the dialog shows: *"Weet je zeker dat je het thema 'Duurzaamheid' wilt verwijderen? Dit thema is gekoppeld aan 4 project(en). Deze koppelingen worden ook verwijderd."*

### AC-3: Confirmation for theme with no projects

**Given** a theme "Nieuw Thema" is linked to 0 projects  
**When** the delete confirmation dialog opens  
**Then** the dialog shows: *"Weet je zeker dat je het thema 'Nieuw Thema' wilt verwijderen? Dit thema is aan geen projecten gekoppeld."*

### AC-4: Confirm delete executes deletion

**Given** the confirmation dialog is showing  
**When** the teacher clicks "Verwijderen" (confirm)  
**Then** the theme is deleted via the API  
**And** the theme disappears from the list  
**And** the modal closes  
**And** a success message is shown

### AC-5: Cancel preserves the theme

**Given** the confirmation dialog is showing  
**When** the teacher clicks "Annuleren"  
**Then** the theme is NOT deleted  
**And** the dialog closes

### AC-6: Delete failure shows error

**Given** the teacher confirms deletion  
**When** the API returns an error  
**Then** an error message is displayed  
**And** the theme remains in the list

### AC-7: Cascade cleanup happens server-side

**Given** a theme linked to 3 projects is deleted  
**When** the deletion succeeds  
**Then** all 3 `hasTheme` relations are removed server-side (verified by [TS-task-002](TS-task-002-project-deletion-cascade.md) backend fix)  
**And** those 3 projects still exist but no longer show the deleted theme

---

## Technical Notes

- **Service call**: [`deleteTheme(themeId)`](../../../projojo_frontend/src/services.js:295) — already defined, currently unused
- **Project count**: To show the linked project count, either:
  1. Extend the `GET /themes/` response to include a `project_count` field per theme (preferred — avoids extra API call)
  2. Or call `GET /themes/project/{theme_id}` to count (but this endpoint doesn't exist; `GET /themes/{theme_id}` doesn't include project count)
  - **Recommendation**: Add a `project_count` field to the theme list response from [`ThemeRepository.get_all()`](../../../projojo_backend/domain/repositories/theme_repository.py:35) — do a count sub-query on `hasTheme` relations
- **UI**: Use existing [`Modal`](../../../projojo_frontend/src/components/Modal.jsx) component with destructive action styling (red confirm button)
- Backend [`ThemeRepository.delete()`](../../../projojo_backend/domain/repositories/theme_repository.py:141) already cascades hasTheme relation deletion before theme entity deletion
