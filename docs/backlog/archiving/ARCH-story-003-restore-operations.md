# ARCH-story-003 — Restore Operations

**Priority**: 🔴 Critical  
**Type**: User Story  
**Dependencies**: [ARCH-story-002](ARCH-story-002-archive-operations.md)  
**Child tasks**: [ARCH-task-009](ARCH-task-009-business-restore.md), [ARCH-task-010](ARCH-task-010-project-restore.md), [ARCH-task-011](ARCH-task-011-task-restore.md)

---

## User Story

As a **teacher**,  
I want to preview and selectively restore archived entities and descendants,  
so that I can restore only the intended scope without creating orphaned or inconsistent data.

---

## Scope Included

- Always-on restore preview before execution
- Exact-metadata preselection for same-cascade descendants
- Selective descendant restore
- Blocked child restore when parent remains archived
- Name collision handling on restore
- Atomic restore execution requirements

## Scope Excluded

- Archive execution itself
- Teacher page list and modal rendering details
- Seed data and final verification gate

---

## User Story Acceptance Criteria

1. Restore is preview-first and downward-only.
2. Same-cascade descendants are preselected by exact metadata match.
3. Child restore is blocked while required parent entities remain archived.
4. Restore executes only for the root and valid selected descendants.
5. The child tasks in this user story are complete and consistent with the archive metadata model.

---

## Child Tasks

1. [ARCH-task-009 — Business Restore: Preview, Selective Descendants, and Execute](ARCH-task-009-business-restore.md)
2. [ARCH-task-010 — Project Restore: Preview, Blocked-Parent Check, and Execute](ARCH-task-010-project-restore.md)
3. [ARCH-task-011 — Task Restore: Preview, Blocked-Parent Check, and Execute](ARCH-task-011-task-restore.md)

---

## Definition of Done

- All restore endpoints exist and use a preview-first contract.
- Preselection, dependency validation, and blocked-parent behavior are coherent across entity types.
- Restore does not reintroduce active-name conflicts or orphaned descendants.
- The restore model is ready to support the teacher-facing UI flows.
