# TS-task-023 — SDG Badge Integration Across Theme Views

**Phase**: 3 — Enhancements  
**Priority**: 🟡 Medium  
**Type**: Functional Task  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §2I](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §3.1](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: [TS-task-022](TS-task-022-sdg-badge-component.md) (SdgBadge must exist), [TS-task-010](TS-task-010-theme-management-list.md), [TS-task-014](TS-task-014-theme-picker-component.md), [TS-task-019](TS-task-019-project-details-theme-display.md)  

---

## Task Story

As any **user**,  
I want SDG badges shown wherever themes are displayed throughout the platform,  
so that the SDG dimension is consistently visible and not hidden in the data.

---

## Acceptance Criteria

### AC-1: SDG badges on theme management list (TeacherPage)

**Given** a teacher viewing the theme management list ([TS-task-010](TS-task-010-theme-management-list.md))  
**When** themes with SDG codes are displayed  
**Then** each theme row shows the SdgBadge(s) next to the theme name

### AC-2: SDG badges in theme create/edit modal

**Given** a teacher selecting SDG codes in the multi-select dropdown ([TS-task-011](TS-task-011-theme-create-modal.md), [TS-task-012](TS-task-012-theme-edit-modal.md))  
**When** viewing the dropdown options  
**Then** each option shows the UN color preview alongside "SDG{N} — {Dutch name}"

### AC-3: SDG badges in ThemePicker pills

**Given** the ThemePicker component ([TS-task-014](TS-task-014-theme-picker-component.md)) showing theme pills  
**When** a theme has an associated SDG code  
**Then** the SDG badge is shown inside or adjacent to the theme pill

### AC-4: SDG badges on ProjectDetailsPage

**Given** the theme section on ProjectDetailsPage ([TS-task-019](TS-task-019-project-details-theme-display.md))  
**When** themes with SDG codes are displayed  
**Then** SDG badges are shown alongside each theme pill

### AC-5: SDG badges on project cards (optional, space-dependent)

**Given** theme badges on ProjectCard ([TS-task-018](TS-task-018-projectcard-theme-badges.md)) and PublicProjectCard  
**When** the primary theme has an SDG code  
**Then** the SDG badge is shown if space allows  
**Or** the SDG info is accessible via hover/tooltip if space is tight

### AC-6: Themes without SDG codes show no badge

**Given** a theme with `sdg_code = null`  
**When** displayed anywhere  
**Then** no SDG badge is rendered  
**And** the theme pill/row renders normally without an empty gap

---

## Technical Notes

- **Component**: Use `<SdgBadge sdgCode={theme.sdg_code}>` from [TS-task-022](TS-task-022-sdg-badge-component.md)
- **Integration points**:
  1. `ThemeManagement.jsx` — theme list rows ([TS-task-010](TS-task-010-theme-management-list.md))
  2. Theme create/edit modal — SDG multi-select options ([TS-task-011](TS-task-011-theme-create-modal.md))
  3. `ThemePicker.jsx` — inside theme pills ([TS-task-014](TS-task-014-theme-picker-component.md))
  4. `ProjectDetailsPage.jsx` — theme section ([TS-task-019](TS-task-019-project-details-theme-display.md))
  5. `ProjectCard.jsx` / `PublicProjectCard.jsx` — conditional inside badges ([TS-task-018](TS-task-018-projectcard-theme-badges.md))
- Theme data from the API already includes `sdg_code` field — no backend changes needed
- Keep SDG badges small enough not to overwhelm the primary theme content
