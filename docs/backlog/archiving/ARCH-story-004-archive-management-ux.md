# ARCH-story-004 — Archive Management UX

**Priority**: 🔴 Critical  
**Type**: User Story  
**Dependencies**: [ARCH-story-002](ARCH-story-002-archive-operations.md), [ARCH-story-003](ARCH-story-003-restore-operations.md)  
**Child tasks**: [ARCH-task-012](ARCH-task-012-archived-listing-endpoints.md), [ARCH-task-013](ARCH-task-013-teacher-archived-views.md), [ARCH-task-014](ARCH-task-014-archive-modal-preview.md), [ARCH-task-015](ARCH-task-015-restore-modal-selective.md)

---

## User Story

As a **teacher**,  
I want one coherent archive-management experience for viewing archived items, previewing archive impact, and selectively restoring entities,  
so that archive and restore actions are understandable, safe, and operationally efficient.

---

## Scope Included

- Archived listing endpoints with parent context
- Teacher archived sections for businesses, projects, and tasks
- Archive modal with backend preview and reason capture
- Restore modal with preselection and dependency-aware selection
- Disabled restore actions with explanation when blocked

## Scope Excluded

- Backend archive/restore business rules themselves
- Student and supervisor-specific archive experiences
- Seed data and E2E verification

---

## User Story Acceptance Criteria

1. Teachers can see archived businesses, projects, and tasks with archive metadata.
2. Archive actions show real backend-calculated preview before execution.
3. Restore actions show preview, preselection, and valid descendant selection controls.
4. Blocked restore cases remain visible and are explained rather than hidden.
5. The child tasks in this user story are complete and produce one cohesive management workflow.

---

## Child Tasks

1. [ARCH-task-012 — Archived Listing Endpoints with Parent Context](ARCH-task-012-archived-listing-endpoints.md)
2. [ARCH-task-013 — Teacher Page: Archived Views for Businesses, Projects, and Tasks](ARCH-task-013-teacher-archived-views.md)
3. [ARCH-task-014 — Archive Modal with Backend Preview](ARCH-task-014-archive-modal-preview.md)
4. [ARCH-task-015 — Restore Modal with Selective Descendants](ARCH-task-015-restore-modal-selective.md)

---

## Definition of Done

- Archived list data and teacher UI are aligned on field naming and blocked-state logic.
- Archive and restore modals are driven by backend preview data rather than hardcoded assumptions.
- The teacher can manage archive state without direct destructive actions or hidden failure modes.
