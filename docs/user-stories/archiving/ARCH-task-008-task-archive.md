# ARCH-task-008 — Task Archive: Preview and Execute with Cascade

**User Story**: [ARCH-story-002 — Archive Operations](ARCH-story-002-archive-operations.md)  
**Priority**: 🟡 High  
**Type**: Functional Task  
**Spec references**: [§3.1](../../ARCHIVING_SPECIFICATION.md), [§3.2](../../ARCHIVING_SPECIFICATION.md), [§3.7](../../ARCHIVING_SPECIFICATION.md), [§4.3](../../ARCHIVING_SPECIFICATION.md), [§4.6](../../ARCHIVING_SPECIFICATION.md), [§5.1](../../ARCHIVING_SPECIFICATION.md), [§5.3](../../ARCHIVING_SPECIFICATION.md)  
**Dependencies**: [ARCH-task-002](ARCH-task-002-domain-models-datetime.md), [ARCH-task-004](ARCH-task-004-active-query-filtering.md)

---

## Task Story

As a **teacher**,  
I want to preview the impact of archiving a task and then execute it with a cascade to its registrations,  
so that I can archive individual tasks and their associated student registrations.

---

## Context: What Must Change and Why

The current codebase has no task-specific archive endpoint on the `next-ui` branch. The specification requires a two-step task cascade (task → registrations) with preview.

---

## Acceptance Criteria

### AC-1: Preview returns affected registrations

**Given** a teacher calls `PATCH /tasks/{id}/archive` with `confirm=false` and a valid `archived_reason`  
**When** the backend processes the request  
**Then** the response contains a preview of:
- The task itself
- All registrations for the task (with student names)

**And** no data is modified  
**And** the response matches the archive preview shape (spec §5.3)

### AC-2: Execute cascades task → registrations

**Given** a teacher calls `PATCH /tasks/{id}/archive` with `confirm=true` and a valid `archived_reason`  
**When** the backend processes the request  
**Then** the task receives `archivedAt` (UTC), `archivedBy`, and `archivedReason` (teacher text)  
**And** all registrations receive the same `archivedAt`, `archivedBy`, and stored `archivedReason` value as the root task  
**And** the cascade runs in a single transaction

### AC-2a: One shared stored archive reason across the cascade

**Given** a task archive cascade executes  
**When** root and descendant archive metadata are inspected  
**Then** the task and its registrations all store the same `archivedReason` value  
**And** restore preselection by exact metadata match can identify same-cascade descendants

### AC-3: Teacher-only permission

**Given** a non-teacher attempts to archive a task  
**When** the request reaches the backend  
**Then** the request is rejected with `403 Forbidden`

### AC-4: Archive reason validation

**Given** a teacher calls without `archived_reason` or with an empty string  
**Then** the response is `422 Unprocessable Entity`

### AC-5: Entity not found returns 404

**Given** a non-existent task ID is used  
**Then** the response is `404 Not Found`

### AC-6: Idempotent execution

**Given** a task is already archived  
**When** archive is called with `confirm=true`  
**Then** the response is `200 OK` with no metadata overwrite

### AC-7: Cascade respects already-archived registrations

**Given** a task has one archived and one active registration  
**When** the task cascade executes  
**Then** the already-archived registration retains its original metadata  
**And** the active registration receives new cascade metadata

### AC-8: All cascade entities share identical timestamps

**Given** a task archive cascade runs  
**Then** the task and all newly-archived registrations have identical `archivedAt` and `archivedBy`

---

## Technical Notes

### Reusable code from Archive_Feature branch

[`ARCHIVING_REUSABLE_CODE.md` §5.3](../../ARCHIVING_REUSABLE_CODE.md) provides the task cascade pattern (🟡 tier):

```python
def archive(self, task_id: str, archived_by: str) -> None:
    ts = datetime.now()  # FIX: use timezone.utc
    # Step 1: Archive task
    # Step 2: Archive registrations via $r isa registersForTask (task: $t, student: $stu)
```

**Required adaptations:** Add `archivedReason`, timezone-aware timestamp, preview mode, atomicity.

For this task, that means the stored `archivedReason` value is shared across the task and its registrations rather than rewritten per descendant.

### Endpoint contract (spec §5.1)

```
PATCH /tasks/{id}/archive
Auth: Teacher only
Body: { "confirm": boolean, "archived_reason": string }
```

### Risks

- **Net-new endpoint**: No task archive route currently exists on `next-ui`. This must be created from scratch in [`task_router.py`](../../../projojo_backend/routes/task_router.py).

### Files likely affected

- [`projojo_backend/routes/task_router.py`](../../../projojo_backend/routes/task_router.py) — new archive endpoint
- [`projojo_backend/domain/repositories/task_repository.py`](../../../projojo_backend/domain/repositories/task_repository.py) — cascade and preview logic
