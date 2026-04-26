# TS-story-002 — Teacher Theme Management

**Priority**: 🔴 Critical  
**Type**: User Story  
**Dependencies**: [TS-story-001](TS-story-001-theme-platform-integrity.md)  
**Child tasks**: [TS-task-010](TS-task-010-theme-management-list.md), [TS-task-011](TS-task-011-theme-create-modal.md), [TS-task-012](TS-task-012-theme-edit-modal.md), [TS-task-013](TS-task-013-theme-delete-confirmation.md)

---

## User Story

As a **docent** (teacher),  
I want to manage the theme catalog from one coherent workflow,  
so that I can maintain themes, correct mistakes, and safely control what supervisors can apply to projects.

---

## Scope Included

- Teacher-facing theme management list
- Theme creation flow
- Theme editing flow
- Theme deletion confirmation and impact warning

## Scope Excluded

- Project-side theme selection UX for supervisors
- Read-only theme display outside the teacher catalog
- SDG-specific visual enhancements
- Student interest features

---

## User Story Acceptance Criteria

1. Teachers can list all themes in a manageable overview.
2. Teachers can create, edit, and delete themes through explicit management flows.
3. Destructive theme actions include clear warning and confirmation behavior.
4. Theme management UI relies on the validated backend contract from foundational work.
5. The child tasks in this user story together provide a complete teacher theme-catalog workflow.

---

## Child Tasks

1. [TS-task-010 — Theme Management List on TeacherPage](TS-task-010-theme-management-list.md)
2. [TS-task-011 — Theme Create Modal for Teachers](TS-task-011-theme-create-modal.md)
3. [TS-task-012 — Theme Edit Modal for Teachers](TS-task-012-theme-edit-modal.md)
4. [TS-task-013 — Theme Delete with Confirmation Dialog](TS-task-013-theme-delete-confirmation.md)

---

## Definition of Done

- A teacher can manage the theme catalog end-to-end without leaving the intended workflow.
- Theme creation, editing, and deletion behave predictably and safely.
- The teacher management experience is usable without depending on incomplete future enhancements.
