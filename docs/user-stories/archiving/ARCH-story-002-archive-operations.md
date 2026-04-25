# ARCH-story-002 — Archive Operations

**Priority**: 🔴 Critical  
**Type**: User Story  
**Dependencies**: [ARCH-story-001](ARCH-story-001-archiving-foundations.md)  
**Child tasks**: [ARCH-task-006](ARCH-task-006-business-archive.md), [ARCH-task-007](ARCH-task-007-project-archive.md), [ARCH-task-008](ARCH-task-008-task-archive.md)

---

## User Story

As a **teacher**,  
I want to preview and execute archive operations for businesses, projects, and tasks,  
so that I can safely remove entities from active use with a predictable cascade and a documented archive reason.

---

## Scope Included

- Archive preview and execute endpoints for business, project, and task
- Cascade behavior across descendants
- Shared stored `archivedReason` across each cascade
- Idempotent archive execution
- Teacher-only archive authorization
- Atomic archive execution requirements

## Scope Excluded

- Restore flows
- Teacher archived listings and modal UX beyond archive-specific behavior
- Student and supervisor archive consequences outside direct archive behavior

---

## User Story Acceptance Criteria

1. Each archive operation supports preview before execute.
2. Each archive cascade applies the correct descendants for its root entity type.
3. All entities archived in the same cascade share matching `archivedAt`, `archivedBy`, and stored `archivedReason` values.
4. Archive execution is teacher-only and idempotent.
5. The child tasks in this user story are complete and use a coherent HTTP contract.

---

## Child Tasks

1. [ARCH-task-006 — Business Archive: Preview and Execute with Cascade](ARCH-task-006-business-archive.md)
2. [ARCH-task-007 — Project Archive: Preview and Execute with Cascade](ARCH-task-007-project-archive.md)
3. [ARCH-task-008 — Task Archive: Preview and Execute with Cascade](ARCH-task-008-task-archive.md)

---

## Definition of Done

- All archive endpoints exist and match the agreed contract.
- Cascade behavior is correct for business, project, and task archive.
- Restore preselection can reliably identify same-cascade descendants from stored metadata.
- No archive flow depends on stale legacy delete or draft behavior.
