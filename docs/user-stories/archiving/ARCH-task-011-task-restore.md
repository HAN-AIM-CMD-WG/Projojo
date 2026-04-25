# ARCH-task-011 — Task Restore: Preview, Blocked-Parent Check, and Execute

**User Story**: [ARCH-story-003 — Restore Operations](ARCH-story-003-restore-operations.md)  
**Priority**: 🟡 High  
**Type**: Functional Task  
**Spec references**: [§2.2](../../ARCHIVING_SPECIFICATION.md), [§3.3](../../ARCHIVING_SPECIFICATION.md), [§3.4](../../ARCHIVING_SPECIFICATION.md), [§3.8](../../ARCHIVING_SPECIFICATION.md), [§4.4](../../ARCHIVING_SPECIFICATION.md), [§4.6](../../ARCHIVING_SPECIFICATION.md), [§5.2](../../ARCHIVING_SPECIFICATION.md), [§5.3](../../ARCHIVING_SPECIFICATION.md), Decision R-5, R-6  
**Dependencies**: [ARCH-task-008](ARCH-task-008-task-archive.md), [ARCH-task-010](ARCH-task-010-project-restore.md)

---

## Task Story

As a **teacher**,  
I want to restore an archived task with a preview of its archived registrations, while being blocked from restoring tasks whose parent project is still archived,  
so that student registrations can be selectively recovered without creating orphaned data.

---

## Context: What Must Change and Why

The current task restore ([`task_repository.py:411`](../../../projojo_backend/domain/repositories/task_repository.py:411)) blindly restores and does not check the parent project's archive state. The specification requires blocked-parent checks and selective registration restore.

---

## Acceptance Criteria

### AC-1: Restore blocked when parent project is archived

**Given** a task is archived and its parent project is also archived  
**When** a teacher calls `PATCH /tasks/{id}/restore` with `confirm=true`  
**Then** the response is `409 Conflict`  
**And** the error message explains the parent project must be restored first (Dutch text)

### AC-2: Restore blocked when grandparent business is archived

**Given** a task is archived, its parent project is active, but the grandparent business is archived  
**When** a teacher calls `PATCH /tasks/{id}/restore`  
**Then** the response is `409 Conflict`  
**And** the error references the archived business

### AC-3: Preview returns archived registrations

**Given** a task's parent project is active and the task is archived  
**When** a teacher calls `PATCH /tasks/{id}/restore` with `confirm=false`  
**Then** the response contains:
- `root`: the task with its archive metadata
- `candidates.registrations`: all archived registrations for this task

**And** no parent project, business, or sibling tasks appear in candidates

### AC-4: Metadata-matching registrations are preselected

**Given** registrations were archived as part of the same cascade as the task  
**When** the restore preview is returned  
**Then** those registrations have `preselected: true`

### AC-5: Execute restores task and selected registrations

**Given** a teacher calls `PATCH /tasks/{id}/restore` with `confirm=true` and selections  
**When** the backend processes the request  
**Then** the task's archive attributes are deleted  
**And** selected registrations' archive attributes are deleted  
**And** non-selected registrations retain their archive state

### AC-6: Name collision handling

**Given** an archived task has the same name as an active task under the same project  
**When** the task is restored  
**Then** it is renamed with the lowest available sequence number

### AC-7: Standard error handling

**Given** the task is already active → `409 Conflict`  
**Given** the task does not exist → `404 Not Found`  
**Given** the caller is not a teacher → `403 Forbidden`

---

## Technical Notes

### Endpoint contract (spec §5.2)

```
PATCH /tasks/{id}/restore
Auth: Teacher only
Body: { "confirm": boolean, "selected": { "registrations": [...] } }
```

### Parent chain check

Task restore must check **both** parent project and grandparent business:

```tql
match
    ($project, $task) isa containsTask;
    $task has id ~task_id;
    { $project has archivedAt $pArchived; } or {
        ($business, $project) isa hasProjects;
        $business has archivedAt $bArchived;
    };
fetch { 'parent_archived': true };
```

### Reusable patterns

The TypeQL attribute deletion pattern from [`ARCHIVING_REUSABLE_CODE.md` §6.3](../../ARCHIVING_REUSABLE_CODE.md) is reference material. The traversal path (task → registrations) is reusable from the archive cascade.

Exact-match preselection in this task assumes the archive cascade stored one shared `archivedReason` value across the task and its registrations.

### Files likely affected

- [`projojo_backend/routes/task_router.py`](../../../projojo_backend/routes/task_router.py) — restore endpoint (new)
- [`projojo_backend/domain/repositories/task_repository.py`](../../../projojo_backend/domain/repositories/task_repository.py) — preview and selective restore
