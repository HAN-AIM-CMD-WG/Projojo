# TS-story-003 — Project Theme Linking and Visibility

**Priority**: 🔴 Critical  
**Type**: User Story  
**Dependencies**: [TS-story-001](TS-story-001-theme-platform-integrity.md)  
**Child tasks**: [TS-task-009](TS-task-009-backend-themes-in-business-query.md), [TS-task-014](TS-task-014-theme-picker-component.md), [TS-task-015](TS-task-015-theme-on-project-create.md), [TS-task-016](TS-task-016-theme-on-project-edit.md), [TS-task-017](TS-task-017-theme-inline-edit-details.md), [TS-task-018](TS-task-018-projectcard-theme-badges.md), [TS-task-019](TS-task-019-project-details-theme-display.md), [TS-task-020](TS-task-020-overviewpage-theme-fix.md), [TS-task-021](TS-task-021-supervisor-dashboard-themes.md)

---

## User Story

As a **supervisor or authenticated user**,  
I want themes to be attachable to projects and visible wherever project context matters,  
so that themes become part of real project workflows instead of existing only as isolated catalog data.

---

## Scope Included

- Backend theme data added to project/business query responses
- Reusable theme-picker UX
- Theme selection on project create and edit
- Inline theme editing on project details
- Read-only theme display across authenticated project views
- Fix for OverviewPage using only public-theme data
- Theme display on supervisor dashboard

## Scope Excluded

- Teacher theme catalog CRUD
- SDG badge enhancements beyond baseline theme visibility
- Student interest persistence and UI

---

## User Story Acceptance Criteria

1. Supervisors can link themes to projects during create and edit workflows.
2. Project-linked themes are visible in the major authenticated project views.
3. Theme data is supplied by shared backend query responses rather than ad hoc per-view workarounds.
4. Project theme visibility is consistent across overview, details, cards, and supervisor contexts.
5. The child tasks in this user story together make themes operational in project workflows.

---

## Child Tasks

1. [TS-task-009 — Add Themes to getBusinessesComplete()](TS-task-009-backend-themes-in-business-query.md)
2. [TS-task-014 — Reusable ThemePicker Component](TS-task-014-theme-picker-component.md)
3. [TS-task-015 — Theme Selection on Project Creation](TS-task-015-theme-on-project-create.md)
4. [TS-task-016 — Theme Selection on Project Edit](TS-task-016-theme-on-project-edit.md)
5. [TS-task-017 — Inline Theme Editing on ProjectDetailsPage](TS-task-017-theme-inline-edit-details.md)
6. [TS-task-018 — Theme Badges on Authenticated ProjectCard](TS-task-018-projectcard-theme-badges.md)
7. [TS-task-019 — Theme Display on ProjectDetailsPage](TS-task-019-project-details-theme-display.md)
8. [TS-task-020 — Fix OverviewPage Public-Only Theme Limitation](TS-task-020-overviewpage-theme-fix.md)
9. [TS-task-021 — Theme Display on Supervisor Dashboard](TS-task-021-supervisor-dashboard-themes.md)

---

## Definition of Done

- Themes can be linked to projects in the intended supervisor flows.
- Linked themes are visible in the key authenticated project surfaces.
- The platform no longer treats themes as catalog-only data disconnected from project usage.
