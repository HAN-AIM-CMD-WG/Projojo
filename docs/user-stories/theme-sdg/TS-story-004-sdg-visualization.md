# TS-story-004 — SDG Visualization

**Priority**: 🟡 Medium  
**Type**: User Story  
**Dependencies**: [TS-story-002](TS-story-002-teacher-theme-management.md), [TS-story-003](TS-story-003-project-theme-linking-and-visibility.md)  
**Child tasks**: [TS-task-022](TS-task-022-sdg-badge-component.md), [TS-task-023](TS-task-023-sdg-display-integration.md)

---

## User Story

As any **user**,  
I want SDG information to be visible wherever themes are shown,  
so that the relationship between themes and the UN Sustainable Development Goals is clear and consistently presented.

---

## Scope Included

- SDG badge component
- SDG badge styling and color treatment
- SDG badge integration into theme management, picker, and project-view surfaces

## Scope Excluded

- Core theme CRUD and linking behavior
- Student-interest data model
- Reporting or analytics based on SDGs

---

## User Story Acceptance Criteria

1. Themes with SDG metadata have a consistent SDG visual treatment.
2. The SDG visual treatment can be reused across the main theme-display surfaces.
3. Themes without SDG metadata render cleanly without broken or empty visual placeholders.
4. The child tasks in this user story add SDG meaning without changing the underlying theme contract.

---

## Child Tasks

1. [TS-task-022 — SDG Badge Component with Official UN Colors](TS-task-022-sdg-badge-component.md)
2. [TS-task-023 — SDG Badge Integration Across Theme Views](TS-task-023-sdg-display-integration.md)

---

## Definition of Done

- SDG information is visually recognizable across the intended theme surfaces.
- SDG display is implemented once and reused consistently rather than recreated per view.
