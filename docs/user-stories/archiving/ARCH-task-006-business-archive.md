# ARCH-task-006 — Business Archive: Preview and Execute with Cascade

**User Story**: [ARCH-story-002 — Archive Operations](ARCH-story-002-archive-operations.md)  
**Priority**: 🔴 Critical  
**Type**: Functional Task  
**Spec references**: [§3.1](../../ARCHIVING_SPECIFICATION.md), [§3.2](../../ARCHIVING_SPECIFICATION.md), [§3.4](../../ARCHIVING_SPECIFICATION.md), [§3.7](../../ARCHIVING_SPECIFICATION.md), [§4.1](../../ARCHIVING_SPECIFICATION.md), [§4.5](../../ARCHIVING_SPECIFICATION.md), [§4.6](../../ARCHIVING_SPECIFICATION.md), [§5.1](../../ARCHIVING_SPECIFICATION.md), [§5.3](../../ARCHIVING_SPECIFICATION.md)  
**Dependencies**: [ARCH-task-002](ARCH-task-002-domain-models-datetime.md), [ARCH-task-004](ARCH-task-004-active-query-filtering.md)

---

## Task Story

As a **teacher**,  
I want to preview the full impact of archiving a business before confirming the action, and then execute the archive with a full downward cascade,  
so that I understand exactly which entities and users will be affected before committing to the operation.

---

## Context: What Must Change and Why

The current [`business_router.py:179`](../../../projojo_backend/routes/business_router.py:179) has a simple archive endpoint that:
- Accepts no request body (no reason, no confirm flag)
- Has no preview/dry-run capability
- Calls `business_repo.archive_business()` which only sets `isArchived true` on the business — **no cascade**
- Uses duplicate endpoint definitions (lines 179–203 and 233–264)

The specification requires a two-step preview-then-execute flow via a single `PATCH /businesses/{id}/archive` endpoint, distinguished by the `confirm` flag. The cascade must archive all descendant projects, tasks, registrations, and conditionally supervisors — atomically in a single transaction.

---

## Acceptance Criteria

### AC-1: Preview returns affected entities without mutations

**Given** a teacher calls `PATCH /businesses/{id}/archive` with `confirm=false` and a valid `archived_reason`  
**When** the backend processes the request  
**Then** the response contains a preview of all entities that would be affected:
- The business itself
- All projects owned by the business
- All tasks under those projects
- All registrations under those tasks
- All supervisors managing this business (with `will_be_archived` indicating whether they would actually be archived)

**And** no data is modified in the database  
**And** the response matches the archive preview shape from spec §5.3

### AC-2: Supervisor conditional archiving in preview

**Given** a business has two supervisors: one managing only this business, one managing this and another active business  
**When** the archive preview is requested  
**Then** the preview shows:
- Supervisor A (sole business): `will_be_archived: true`
- Supervisor B (multi-business): `will_be_archived: false`

### AC-3: Execute archives business and cascades atomically

**Given** a teacher calls `PATCH /businesses/{id}/archive` with `confirm=true` and a valid `archived_reason`  
**When** the backend processes the request  
**Then** the business receives `archivedAt` (UTC timestamp), `archivedBy` (teacher identifier), and `archivedReason` (teacher-entered text)  
**And** all descendant projects receive the same `archivedAt`, `archivedBy`, and stored `archivedReason` value as the root business  
**And** all descendant tasks receive the same archive metadata pattern  
**And** all descendant registrations receive the same archive metadata pattern  
**And** supervisors with no other active businesses receive the same archive metadata pattern  
**And** supervisors with other active businesses are NOT archived  
**And** the entire operation runs in a single TypeDB write transaction

### AC-4: One shared stored archive reason across the cascade

**Given** a business is archived with reason "Bedrijf is gestopt"  
**When** the cascade archives descendant entities  
**Then** each descendant stores the same `archivedReason` value as the root business  
**And** exact metadata matching on `archivedAt`, `archivedBy`, and `archivedReason` can identify descendants archived in the same cascade during restore preview

### AC-5: Teacher-only permission enforced

**Given** a non-teacher user (supervisor or student) attempts to call the archive endpoint  
**When** the request reaches the backend  
**Then** the request is rejected with `403 Forbidden`

### AC-6: Archive reason required and validated

**Given** a teacher calls the archive endpoint without `archived_reason` or with an empty string  
**When** the request body is validated  
**Then** the request is rejected with `422 Unprocessable Entity`  
**And** the error message indicates the reason is required

### AC-7: Entity not found returns 404

**Given** a teacher calls the archive endpoint with a non-existent business ID  
**When** the backend processes the request  
**Then** the response is `404 Not Found`

### AC-8: Archive execute is idempotent

**Given** a business is already archived  
**When** a teacher calls the archive endpoint with `confirm=true`  
**Then** the response is `200 OK`  
**And** the existing archive metadata is not overwritten  
**And** no error is raised

### AC-9: Archive preview on already-archived entity succeeds

**Given** a business is already archived  
**When** a teacher calls the archive endpoint with `confirm=false`  
**Then** the response is `200 OK`  
**And** the response may indicate the entity is already archived

### AC-10: Cascade uses idempotent guards on each descendant

**Given** some descendants are already individually archived (from a previous direct archive)  
**When** the business cascade archive executes  
**Then** already-archived descendants are skipped without overwriting their existing archive metadata  
**And** un-archived descendants are newly archived with the cascade metadata

### AC-11: All cascade entities share the same timestamp

**Given** a business archive is executed  
**When** the cascade archives multiple entities  
**Then** all entities in the cascade (business, projects, tasks, registrations, supervisors) have identical `archivedAt` values  
**And** all have identical `archivedBy` values

### AC-12: Transaction failure rolls back everything

**Given** the archive cascade is executing  
**When** an error occurs partway through the transaction  
**Then** the entire transaction rolls back  
**And** no entities are left in a partially-archived state

---

## Technical Notes

### Reusable code from Archive_Feature branch

[`ARCHIVING_REUSABLE_CODE.md` §5.1](../../ARCHIVING_REUSABLE_CODE.md) provides the business cascade pattern (🟡 tier):

```python
def archive(self, business_id: str, archived_by: str) -> None:
    ts = datetime.now()  # FIX: datetime.now(timezone.utc)

    # Step 1: Archive business
    # Step 2: Archive projects via ($b, $p) isa hasProjects
    # Step 3: Archive tasks via ($b, $p) isa hasProjects; ($p, $t) isa containsTask
    # Step 4: Archive supervisors  # FIX: add multi-business check
    # Step 5: Archive registrations
```

**Required adaptations:**
1. Persist one shared stored `archivedReason` value across the root business and all descendants in the cascade so restore preselection by exact metadata match remains coherent
2. Fix supervisor step with multi-business conditional:
   ```tql
   not { $m2 isa manages (supervisor: $s, business: $b2);
         not { $b2 has archivedAt $x2; };
         not { $b2 has id ~business_id; }; };
   ```
3. Use `datetime.now(timezone.utc)` instead of naive `datetime.now()`
4. Wrap all steps in a single transaction (spec §4.6) — currently uses 5 separate `write_transact` calls
5. Add preview mode that runs the same traversal as read-only queries

### Endpoint contract (spec §5.1)

```
PATCH /businesses/{id}/archive
Auth: Teacher only
Body: { "confirm": boolean, "archived_reason": string }
```

**Current endpoint** ([`business_router.py:179`](../../../projojo_backend/routes/business_router.py:179)):
- Already uses `PATCH` method ✓
- Already uses `/archive` path ✓
- Missing request body with `confirm` and `archived_reason` ✗
- Missing preview mode ✗
- Has duplicate endpoint definitions (lines 179 and 233) — remove duplicate ✗
- Uses manual `payload.get("role")` check instead of `@auth(role="teacher")` — should use decorator ✗

### Preview response shape (spec §5.3)

```json
{
  "preview": true,
  "operation": "archive",
  "entity_type": "business",
  "entity_id": "...",
  "affected": {
    "projects": [{ "id": "...", "name": "..." }],
    "tasks": [{ "id": "...", "name": "..." }],
    "registrations": [{ "id": "...", "student_name": "..." }],
    "supervisors": [
      { "id": "...", "name": "...", "will_be_archived": true }
    ]
  }
}
```

### Risks

- **Risk (Atomicity)**: TypeDB may not support multi-statement write transactions the same way relational databases do. If `Db.write_transact` creates a new transaction per call, the cascade cannot be atomic. In that case, document the partial-failure risk and use the idempotent guards as a mitigation.
- **Risk (Supervisor multi-business check)**: The TypeQL conditional for supervisor multi-business archiving is complex. Test with edge cases: supervisor with exactly 2 businesses, supervisor with 1 business, supervisor with 3+ businesses where some are already archived.
- **Resolved**: Descendants do not store a different auto-generated cascade reason. If explanatory copy is desired in preview/UI, generate it there rather than persisting a different `archivedReason` value.

### Files likely affected

- [`projojo_backend/routes/business_router.py`](../../../projojo_backend/routes/business_router.py) — archive endpoint rewrite
- [`projojo_backend/domain/repositories/business_repository.py`](../../../projojo_backend/domain/repositories/business_repository.py) — cascade and preview logic
- New or updated archive Pydantic models (from ARCH-task-002)
