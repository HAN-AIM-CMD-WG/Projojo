# ARCH-story-001 — Archiving Foundations

**Priority**: 🔴 Critical  
**Type**: User Story  
**Dependencies**: None  
**Child tasks**: [ARCH-task-001](ARCH-task-001-schema-migration.md), [ARCH-task-002](ARCH-task-002-domain-models-datetime.md), [ARCH-task-003](ARCH-task-003-legacy-feature-removal.md), [ARCH-task-004](ARCH-task-004-active-query-filtering.md), [ARCH-task-005](ARCH-task-005-edit-locking.md)

---

## User Story

As a **teacher**,  
I want archive state to be modeled and enforced consistently across the platform,  
so that archived entities are represented correctly, hidden from active workflows, and protected from invalid changes.

---

## Scope Included

- Schema migration from `isArchived` to `archivedAt`, `archivedBy`, and `archivedReason`
- Pydantic/domain model and mapper changes
- Standardized archive API naming for HTTP/Pydantic models
- Removal of conflicting legacy draft and hard-delete behavior
- TypeQL-level filtering for active-use queries and counts
- Mutation blocking for archived entities and descendants

## Scope Excluded

- Archive preview/execute endpoints
- Restore preview/execute endpoints
- Teacher archive-management UI flows beyond lock affordances already covered by child tasks
- Seed data and end-to-end verification gates

---

## User Story Acceptance Criteria

1. Archive state is represented only by archive metadata fields across all archivable types.
2. Active-use queries and derived counts exclude archived entities consistently.
3. Mutations that depend on an active parent chain are blocked when the entity or an ancestor is archived.
4. Conflicting legacy draft and hard-delete flows are removed or retired according to specification.
5. The child tasks in this user story are complete and consistent with one another.

---

## Child Tasks

1. [ARCH-task-001 — Schema Migration: Archive Attributes and Supervisor Cardinality](ARCH-task-001-schema-migration.md)
2. [ARCH-task-002 — Domain Models and Datetime Serialization](ARCH-task-002-domain-models-datetime.md)
3. [ARCH-task-003 — Legacy Feature Removal: Draft Business, Hard-Delete, Portfolio Snapshot](ARCH-task-003-legacy-feature-removal.md)
4. [ARCH-task-004 — Active Query Archive Filtering and Count Accuracy](ARCH-task-004-active-query-filtering.md)
5. [ARCH-task-005 — Edit-Locking and Mutation Blocking for Archived Entities](ARCH-task-005-edit-locking.md)

---

## Definition of Done

- All child tasks are complete.
- No remaining active workflow depends on `isArchived` or Python-side archive filtering.
- Legacy archive-adjacent flows no longer conflict with the target archive model.
- Archive behavior is a stable base for archive and restore operations.
