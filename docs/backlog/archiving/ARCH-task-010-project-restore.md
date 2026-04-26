# ARCH-task-010 — Project Restore: Preview, Blocked-Parent Check, and Execute

**User Story**: [ARCH-story-003 — Restore Operations](ARCH-story-003-restore-operations.md)  
**Priority**: 🔴 Critical  
**Type**: Functional Task  
**Spec references**: [§2.2](../../ARCHIVING_SPECIFICATION.md), [§3.3](../../ARCHIVING_SPECIFICATION.md), [§3.4](../../ARCHIVING_SPECIFICATION.md), [§3.8](../../ARCHIVING_SPECIFICATION.md), [§4.4](../../ARCHIVING_SPECIFICATION.md), [§4.6](../../ARCHIVING_SPECIFICATION.md), [§5.2](../../ARCHIVING_SPECIFICATION.md), [§5.3](../../ARCHIVING_SPECIFICATION.md), Decision R-5, R-6  
**Dependencies**: [ARCH-task-007](ARCH-task-007-project-archive.md), [ARCH-task-009](ARCH-task-009-business-restore.md)

---

## Task Story

As a **teacher**,  
I want to restore an archived project with a preview of its archived tasks and registrations, while being blocked from restoring projects whose parent business is still archived,  
so that I never create orphaned child entities and can selectively restore project descendants.

---

## Context: What Must Change and Why

The current project restore ([`project_repository.py:318`](../../../projojo_backend/domain/repositories/project_repository.py:318)) blindly restores everything and does **not check whether the parent business is active**. The [`ARCHIVING_REUSABLE_CODE.md` §6.2](../../ARCHIVING_REUSABLE_CODE.md) rates this as 🔴 Reference Only.

The specification introduces **blocked child restore**: restoring a project while its parent business is archived is rejected with `409 Conflict`. This is the key differentiator from business restore.

---

## Acceptance Criteria

### AC-1: Restore blocked when parent business is archived

**Given** a project is archived and its parent business is also archived  
**When** a teacher calls `PATCH /projects/{id}/restore` with `confirm=true`  
**Then** the response is `409 Conflict`  
**And** the error message explains that the parent business must be restored first  
**And** the response is in Dutch (e.g., "Het bovenliggende bedrijf is nog gearchiveerd. Herstel eerst het bedrijf.")

### AC-2: Restore blocked on preview too when parent is archived

**Given** a project is archived and its parent business is also archived  
**When** a teacher calls `PATCH /projects/{id}/restore` with `confirm=false`  
**Then** the response indicates the project's restore is blocked  
**And** the reason references the parent business being archived  
**And** the preview still returns candidate data for informational purposes

### AC-3: Preview returns archived tasks and registrations

**Given** a project's parent business is active and the project is archived  
**When** a teacher calls `PATCH /projects/{id}/restore` with `confirm=false`  
**Then** the response contains:
- `root`: the project with its archive metadata
- `candidates.tasks`: all archived tasks under this project
- `candidates.registrations`: all archived registrations under those tasks

**And** no parent business or sibling projects appear in the candidates (restore is downward-only)

### AC-4: Metadata-matching descendants are preselected

**Given** tasks were archived as part of the same cascade as the project  
**When** the restore preview is returned  
**Then** those tasks have `preselected: true`  
**And** tasks archived independently have `preselected: false`

### AC-5: Execute restores project and selected descendants

**Given** a teacher calls `PATCH /projects/{id}/restore` with `confirm=true` and selections  
**When** the backend processes the request  
**Then** the project has its archive attributes deleted  
**And** selected tasks and registrations have their archive attributes deleted  
**And** non-selected descendants retain their archive state  
**And** the operation runs in a single transaction

### AC-6: Dependency-aware selection

**Given** a restore preview shows tasks with child registrations  
**When** the teacher selects a registration but not its parent task  
**Then** the backend rejects the selection  
**And** the error explains the registration cannot be restored while its task is still archived

### AC-7: Name collision handling on restore

**Given** an archived project has the same name as a currently active project under the same business  
**When** the project is restored  
**Then** the restored project is renamed with the lowest available sequence number

### AC-8: Restore blocked if project is already active

**Given** a project is not archived  
**When** a teacher calls restore  
**Then** the response is `409 Conflict`

### AC-9: Teacher-only permission

**Given** a non-teacher attempts to call the restore endpoint  
**Then** the response is `403 Forbidden`

### AC-10: Entity not found returns 404

**Given** a non-existent project ID is used  
**Then** the response is `404 Not Found`

---

## Technical Notes

### Reusable code

The TypeQL traversal patterns and attribute deletion patterns from the Archive_Feature branch ([`ARCHIVING_REUSABLE_CODE.md` §6.2](../../ARCHIVING_REUSABLE_CODE.md)) are reference material. The traversal paths (`($p, $t) isa containsTask` → registrations) are the same as the archive cascade and are reusable.

Exact-match preselection in this task assumes the archive cascade stored one shared `archivedReason` value across the project and its descendants.

### Endpoint contract (spec §5.2)

```
PATCH /projects/{id}/restore
Auth: Teacher only
Body: { "confirm": boolean, "selected": { "tasks": [...], "registrations": [...] } }
```

### Parent check implementation

Before any restore preview or execute, the endpoint must query the parent business:

```tql
match
    ($business, $project) isa hasProjects;
    $project has id ~project_id;
    $business has archivedAt $bArchived;
fetch { 'business_archived': true };
```

If this returns results, the parent is archived and restore must be blocked.

### Risks

- **Risk**: The parent check must happen synchronously before the preview or execute logic. If the parent check uses a separate read transaction from the execute write transaction, there is a tiny race condition. Acceptable for now.

### Files likely affected

- [`projojo_backend/routes/project_router.py`](../../../projojo_backend/routes/project_router.py) — restore endpoint rewrite
- [`projojo_backend/domain/repositories/project_repository.py`](../../../projojo_backend/domain/repositories/project_repository.py) — preview and selective restore
