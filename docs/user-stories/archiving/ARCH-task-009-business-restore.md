# ARCH-task-009 — Business Restore: Preview, Selective Descendants, and Execute

**User Story**: [ARCH-story-003 — Restore Operations](ARCH-story-003-restore-operations.md)  
**Priority**: 🔴 Critical  
**Type**: Functional Task  
**Spec references**: [§2.2](../../ARCHIVING_SPECIFICATION.md), [§3.3](../../ARCHIVING_SPECIFICATION.md), [§3.8](../../ARCHIVING_SPECIFICATION.md), [§4.4](../../ARCHIVING_SPECIFICATION.md), [§4.5](../../ARCHIVING_SPECIFICATION.md), [§4.6](../../ARCHIVING_SPECIFICATION.md), [§5.2](../../ARCHIVING_SPECIFICATION.md), [§5.3](../../ARCHIVING_SPECIFICATION.md), Decision F-2, F-4  
**Dependencies**: [ARCH-task-006](ARCH-task-006-business-archive.md)

---

## Task Story

As a **teacher**,  
I want to preview all archived descendants of a business before restoring it, with intelligent preselection of descendants that were archived as part of the same operation, and the ability to selectively restore a subset of descendants,  
so that I have precise control over what comes back and can restore in stages if needed.

---

## Context: What Must Change and Why

The current restore implementation ([`business_repository.py:368`](../../../projojo_backend/domain/repositories/business_repository.py:368)) blindly restores everything in 10 separate transactions with no preview, no selectivity, and no preselection logic. The [`ARCHIVING_REUSABLE_CODE.md` §6.1](../../ARCHIVING_REUSABLE_CODE.md) rates this as 🔴 Reference Only — the restore model is fundamentally different.

The specification introduces:
- **Always-on preview** before restore execution
- **Preselection based on exact metadata match** (`archivedAt` + `archivedBy` + `archivedReason`)
- **Selective descendants** — teacher can deselect descendants or select additional ones
- **Dependency-aware selection** — cannot select a child if its parent is unselected
- **Name collision handling** on restore
- **Downward-only** — never suggests restoring parents or siblings

---

## Acceptance Criteria

### AC-1: Preview returns root entity and all archived descendants

**Given** a teacher calls `PATCH /businesses/{id}/restore` with `confirm=false`  
**When** the backend processes the request  
**Then** the response contains:
- `root`: the business being restored with its archive metadata
- `candidates.projects`: all archived projects under this business
- `candidates.tasks`: all archived tasks under those projects
- `candidates.registrations`: all archived registrations under those tasks
- `candidates.supervisors`: all archived supervisors associated with this business

**And** no data is modified

### AC-2: Metadata-matching descendants are preselected

**Given** a business was archived and its cascade created descendants with matching `archivedAt`, `archivedBy`, and `archivedReason`  
**When** the restore preview is returned  
**Then** descendants whose archive metadata exactly matches the root's metadata have `preselected: true`  
**And** descendants with different metadata (archived separately or in a different cascade) have `preselected: false`

### AC-3: Differently-archived descendants are visible but not preselected

**Given** a project under the business was archived independently before the business was archived  
**When** the restore preview is returned  
**Then** that project appears in the candidates list with its own archive metadata  
**And** it has `preselected: false`  
**And** the teacher can still manually select it for restore

### AC-4: Execute restores root and selected descendants

**Given** a teacher calls `PATCH /businesses/{id}/restore` with `confirm=true` and a `selected` object listing chosen descendants  
**When** the backend processes the request  
**Then** the business has its `archivedAt`, `archivedBy`, and `archivedReason` attributes deleted  
**And** each selected descendant has its archive attributes deleted  
**And** non-selected descendants retain their archive attributes unchanged  
**And** the entire operation runs in a single transaction

### AC-5: Root entity always restored (non-deselectable)

**Given** the teacher confirms a restore  
**When** the execute request is processed  
**Then** the root business is always restored regardless of the `selected` contents  
**And** the root entity is not listed as a selectable candidate — it is implicit

### AC-6: Dependency-aware selection enforced

**Given** a restore preview shows a project and its child tasks  
**When** the teacher attempts to select a task for restore without selecting its parent project  
**Then** the backend rejects the selection  
**And** the error indicates the task cannot be restored while its parent project remains archived

### AC-7: Name collision handling on restore

**Given** an archived business named "Acme Corp" exists and a currently active business is also named "Acme Corp"  
**When** the archived business is restored  
**Then** the restored business is renamed with the lowest available sequence number (e.g., "Acme Corp (1)")  
**And** the restore succeeds without a uniqueness constraint violation

### AC-8: Restore blocked if entity is already active

**Given** a business that is not archived  
**When** a teacher calls restore with `confirm=true`  
**Then** the response is `409 Conflict`  
**And** the error message indicates the entity is already active

### AC-9: Teacher-only permission

**Given** a non-teacher user attempts to call the restore endpoint  
**Then** the response is `403 Forbidden`

### AC-10: Entity not found returns 404

**Given** a non-existent business ID is used  
**Then** the response is `404 Not Found`

### AC-11: Transaction failure rolls back all changes

**Given** the restore execution is in progress  
**When** an error occurs partway through  
**Then** the entire transaction rolls back  
**And** no entities are left in an inconsistent state

### AC-12: Supervisor restore follows multi-business logic

**Given** a supervisor was archived because all their businesses were archived  
**When** the business is restored and the supervisor is selected for restore  
**Then** the supervisor's archive attributes are deleted  
**And** the supervisor regains login access to the restored business

---

## Technical Notes

### Reusable code from Archive_Feature branch

[`ARCHIVING_REUSABLE_CODE.md` §6.1](../../ARCHIVING_REUSABLE_CODE.md) is 🔴 Reference Only but the **TypeQL attribute deletion pattern** is salvageable:

```tql
match $b isa business, has id ~business_id, has archivedAt $ts;
delete $b has $ts;
-- Repeat for archivedBy and archivedReason
```

The traversal patterns for finding descendants (same as archive cascade) are directly reusable for the preview query.

### Endpoint contract (spec §5.2)

```
PATCH /businesses/{id}/restore
Auth: Teacher only
Body: { "confirm": boolean, "selected": { "projects": [...], "tasks": [...], "registrations": [...], "supervisors": [...] } }
```

- `confirm=false`: preview (ignores `selected`)
- `confirm=true`: execute restore with specified selections

### Restore preview response shape (spec §5.3)

```json
{
  "preview": true,
  "operation": "restore",
  "entity_type": "business",
  "entity_id": "...",
  "root": {
    "id": "...", "name": "...",
    "archived_at": "...", "archived_by": "...", "archived_reason": "..."
  },
  "candidates": {
    "projects": [
      {
        "id": "...", "name": "...",
        "archived_at": "...", "archived_by": "...", "archived_reason": "...",
        "preselected": true,
        "blocked": false, "blocked_reason": null
      }
    ],
    "tasks": [...],
    "registrations": [...],
    "supervisors": [...]
  }
}
```

### Preselection metadata match logic

Per spec §2.2 and Decision F-2, preselection uses exact match on all three metadata fields. This assumes the archive cascade persisted one shared stored `archivedReason` value across the root and its descendants, rather than rewriting descendant reasons:

```python
def is_preselected(descendant, root):
    return (
        descendant.archived_at == root.archived_at
        and descendant.archived_by == root.archived_by
        and descendant.archived_reason == root.archived_reason
    )
```

### Documented risk: Metadata collision (Decision F-4)

Two separate archive operations could theoretically produce identical `archivedAt` + `archivedBy` + `archivedReason` and be incorrectly preselected together. This is accepted as unlikely for now but must be documented in code comments and tested with an explicit edge-case scenario.

### Risks

- **Complexity**: This is the most complex backend story. The combination of preview + preselection + dependency validation + name collision + selective execution requires careful testing.
- **Name collision**: The append-sequence-number logic (spec §3.8) must handle edge cases: what if "Acme Corp (1)" also already exists? It should find the lowest available number.
- **Resolved**: The `selected` body groups by entity type with ID arrays: `{ "projects": ["id1", "id2"], "tasks": ["id3"], "registrations": ["id4"], "supervisors": ["id5"] }`.

### Files likely affected

- [`projojo_backend/routes/business_router.py`](../../../projojo_backend/routes/business_router.py) — restore endpoint rewrite
- [`projojo_backend/domain/repositories/business_repository.py`](../../../projojo_backend/domain/repositories/business_repository.py) — preview and selective restore logic
- New or updated Pydantic restore models (from ARCH-task-002)
