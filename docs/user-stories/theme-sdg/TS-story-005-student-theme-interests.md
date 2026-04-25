# TS-story-005 — Student Theme Interests

**Priority**: 🟡 Medium  
**Type**: User Story  
**Dependencies**: [TS-story-001](TS-story-001-theme-platform-integrity.md), [TS-story-003](TS-story-003-project-theme-linking-and-visibility.md)  
**Child tasks**: [TS-task-024](TS-task-024-student-interest-backend.md), [TS-task-025](TS-task-025-student-interest-selection.md), [TS-task-026](TS-task-026-student-interest-dashboard.md)

---

## User Story

As a **student**,  
I want to record and review my theme interests,  
so that the platform can later use that information to support more relevant discovery and recommendation experiences.

---

## Scope Included

- Student-interest schema and backend persistence
- Student profile UI for selecting theme interests
- Student dashboard summary of saved interests

## Scope Excluded

- Matching or recommendation algorithms
- Teacher theme management workflows
- Documentation/status correction work

---

## User Story Acceptance Criteria

1. Students can persist theme-interest preferences.
2. Students can manage those preferences through an intentional UI workflow.
3. Saved interests are visible back to the student in a meaningful summary view.
4. The child tasks in this user story deliver a complete first version of student theme interests without requiring recommendation logic.

---

## Child Tasks

1. [TS-task-024 — Student Interest Schema and Backend](TS-task-024-student-interest-backend.md)
2. [TS-task-025 — Student Interest Selection UI on Profile](TS-task-025-student-interest-selection.md)
3. [TS-task-026 — Student Interest Summary on Dashboard](TS-task-026-student-interest-dashboard.md)

---

## Definition of Done

- Student theme interests can be stored, edited, and displayed.
- The feature is usable as a standalone preference capability even before matching is implemented.
