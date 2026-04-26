# ARCH-task-007 — Project Archive: Preview and Execute with Cascade

**User Story**: [ARCH-story-002 — Archive Operations](ARCH-story-002-archive-operations.md)  
**Priority**: 🔴 Critical  
**Type**: Functional Task  
**Spec references**: [§3.1](../../ARCHIVING_SPECIFICATION.md), [§3.2](../../ARCHIVING_SPECIFICATION.md), [§3.7](../../ARCHIVING_SPECIFICATION.md), [§4.2](../../ARCHIVING_SPECIFICATION.md), [§4.6](../../ARCHIVING_SPECIFICATION.md), [§5.1](../../ARCHIVING_SPECIFICATION.md), [§5.3](../../ARCHIVING_SPECIFICATION.md)  
**Dependencies**: [ARCH-task-002](ARCH-task-002-domain-models-datetime.md), [ARCH-task-004](ARCH-task-004-active-query-filtering.md)

---

## Task Story

As a **teacher**,  
I want to preview the impact of archiving a project and then execute it with a cascade to its tasks and registrations,  
so that I can safely archive individual projects without affecting the parent business or sibling projects.

---

## Context: What Must Change and Why

The current project archive implementation uses `isArchived` boolean and has no preview, no reason, no cascade to tasks or registrations. The specification requires a full three-step cascade (project → tasks → registrations) with preview dry-run.

The current [`project_router.py:292`](../../../projojo_backend/routes/project_router.py:292) checks `is_archived` before archiving, but uses a separate `is_archived()` method that queries `isArchived true`. The repository [`project_repository.py:644`](../../../projojo_backend/domain/repositories/project_repository.py:644) uses a delete-then-insert pattern for the boolean flag.

---

## Acceptance Criteria

### AC-1: Preview returns affected tasks and registrations

**Given** a teacher calls `PATCH /projects/{id}/archive` with `confirm=false` and a valid `archived_reason`  
**When** the backend processes the request  
**Then** the response contains a preview of:
- The project itself
- All tasks under the project  
- All registrations under those tasks

**And** no data is modified  
**And** the response matches the archive preview shape (spec §5.3, without supervisor section)

### AC-2: Execute cascades project → tasks → registrations

**Given** a teacher calls `PATCH /projects/{id}/archive` with `confirm=true` and a valid `archived_reason`  
**When** the backend processes the request  
**Then** the project receives `archivedAt` (UTC), `archivedBy` (teacher ID), and `archivedReason` (teacher-entered text)  
**And** all tasks under the project receive the same `archivedAt`, `archivedBy`, and stored `archivedReason` value as the root project  
**And** all registrations under those tasks receive the same cascade metadata  
**And** the entire cascade runs in a single transaction

### AC-2a: One shared stored archive reason across the cascade

**Given** a project archive cascade executes  
**When** root and descendant archive metadata are inspected  
**Then** the project, its tasks, and its registrations all store the same `archivedReason` value  
**And** restore preselection by exact metadata match can identify same-cascade descendants

### AC-3: No supervisor archiving in project cascade

**Given** a project archive cascade runs  
**When** the cascade reaches the end  
**Then** no supervisors are evaluated or archived (supervisors are only affected by business-level archiving)

### AC-4: Teacher-only permission

**Given** a non-teacher (supervisor or student) attempts to archive a project  
**When** the request reaches the backend  
**Then** the request is rejected with `403 Forbidden`

**Note**: This is a policy change from the current codebase where supervisors can archive their own projects. The spec (§3.1) restricts all archive operations to teachers only.

### AC-5: Archive reason validation

**Given** a teacher calls the endpoint without `archived_reason` or with an empty string  
**When** the body is validated  
**Then** the response is `422 Unprocessable Entity`

### AC-6: Entity not found returns 404

**Given** a non-existent project ID is used  
**When** the backend processes the request  
**Then** the response is `404 Not Found`

### AC-7: Idempotent execution on already-archived project

**Given** a project is already archived  
**When** a teacher calls archive with `confirm=true`  
**Then** the response is `200 OK` with no metadata overwrite

### AC-8: Cascade respects already-archived descendants

**Given** a project has one archived task and one active task  
**When** the project cascade archive executes  
**Then** the already-archived task retains its original metadata  
**And** the active task receives new cascade metadata

### AC-9: All cascade entities share identical timestamps

**Given** a project archive cascade runs  
**When** multiple entities are archived  
**Then** all entities have identical `archivedAt` and `archivedBy` values

---

## Technical Notes

### Reusable code from Archive_Feature branch

[`ARCHIVING_REUSABLE_CODE.md` §5.2](../../ARCHIVING_REUSABLE_CODE.md) provides the project cascade pattern (🟡 tier):

```python
def archive(self, project_id: str, archived_by: str) -> None:
    ts = datetime.now()  # FIX: use timezone.utc
    # Step 1: Archive project
    # Step 2: Archive tasks via ($p, $t) isa containsTask
    # Step 3: Archive registrations via task → registration
```

**Required adaptations:** Same as ARCH-task-006 — add `archivedReason`, timezone-aware timestamp, preview mode, atomicity.

For this task, that means the stored `archivedReason` value is shared across the full cascade rather than rewritten per descendant.

### Endpoint contract (spec §5.1)

```
PATCH /projects/{id}/archive
Auth: Teacher only
Body: { "confirm": boolean, "archived_reason": string }
```

### Risks

- **Policy change risk**: Supervisors currently have archive access for their own projects. Removing this access requires frontend changes and supervisor-facing communication.
- **Atomicity**: Same TypeDB transaction concerns as ARCH-task-006.

### Files likely affected

- [`projojo_backend/routes/project_router.py`](../../../projojo_backend/routes/project_router.py) — archive endpoint rewrite
- [`projojo_backend/domain/repositories/project_repository.py`](../../../projojo_backend/domain/repositories/project_repository.py) — cascade and preview
