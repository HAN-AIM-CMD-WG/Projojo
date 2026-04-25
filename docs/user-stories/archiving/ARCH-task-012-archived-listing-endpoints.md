# ARCH-task-012 — Archived Listing Endpoints with Parent Context

**User Story**: [ARCH-story-004 — Archive Management UX](ARCH-story-004-archive-management-ux.md)  
**Priority**: 🟡 High  
**Type**: Functional Task  
**Spec references**: [§5.4](../../ARCHIVING_SPECIFICATION.md), [§6.1](../../ARCHIVING_SPECIFICATION.md)  
**Dependencies**: [ARCH-task-002](ARCH-task-002-domain-models-datetime.md), [ARCH-task-004](ARCH-task-004-active-query-filtering.md)

---

## Task Story

As a **teacher**,  
I want to see lists of all archived businesses, projects, and tasks with their archive metadata and parent entity context,  
so that I can manage the archive inventory and understand which items can be restored and which are blocked.

---

## Context: What Must Change and Why

The current archived listing endpoints exist but are incomplete:

- [`business_router.py:58`](../../../projojo_backend/routes/business_router.py:58): Returns archived businesses but **without** `archivedAt`, `archivedBy`, or `archivedReason` metadata.
- The repository queries ([`business_repository.py:95`](../../../projojo_backend/domain/repositories/business_repository.py:95)) match on `isArchived` and use Python-side filtering.
- Project archived listing includes `business_id` but no parent business archive status.
- Task archived listing includes `project_id` but no parent project or grandparent business archive status.

The specification requires:
- Archive metadata displayed per item (spec §6.1)
- Parent context needed for disabled-restore explanations (spec §5.4)
- Dedicated response models (spec §5.5)

---

## Acceptance Criteria

### AC-1: GET /businesses/archived returns archive metadata

**Given** archived businesses exist in the database  
**When** a teacher calls `GET /businesses/archived`  
**Then** each item in the response includes:
- `id`, `name`, `location`, `image_path`
- `archived_at` (ISO 8601 with timezone)
- `archived_by`
- `archived_reason`

### AC-2: GET /projects/archived returns archive metadata and parent context

**Given** archived projects exist, some with archived parent businesses and some with active parents  
**When** a teacher calls `GET /projects/archived`  
**Then** each item includes:
- `id`, `name`, `business_id`, `business_name`
- `archived_at`, `archived_by`, `archived_reason`
- `parent_business_archived: boolean` (whether the parent business is currently archived)

**And** this parent context enables the frontend to determine if restore is blocked

### AC-3: GET /tasks/archived returns archive metadata and parent context

**Given** archived tasks exist with varying parent archive states  
**When** a teacher calls `GET /tasks/archived`  
**Then** each item includes:
- `id`, `name`, `project_id`, `project_name`, `business_id`, `business_name`
- `archived_at`, `archived_by`, `archived_reason`
- `parent_project_archived: boolean`
- `parent_business_archived: boolean`

### AC-4: Teacher-only access

**Given** a non-teacher user calls any archived listing endpoint  
**Then** the response is `403 Forbidden`

### AC-5: Empty lists return empty array

**Given** no archived entities of the requested type exist  
**When** the listing endpoint is called  
**Then** the response is an empty array `[]`, not an error

### AC-6: Responses use dedicated Pydantic models

**Given** the archived listing endpoints are implemented  
**When** reviewing the FastAPI route definitions  
**Then** each endpoint uses a dedicated response model (e.g., `ArchivedBusinessItem`, `ArchivedProjectItem`, `ArchivedTaskItem`)  
**And** the response model does **not** include a derived `is_archived` boolean

### AC-7: Archived items sorted by archive date then name

**Given** multiple archived entities exist
**When** the listing is returned
**Then** items are sorted by `archived_at` descending (most recently archived first) as the primary sort
**And** items with the same `archived_at` are sorted by `name` ascending as the secondary sort

---

## Technical Notes

### Reusable code from Archive_Feature branch

[`ARCHIVING_REUSABLE_CODE.md` §4.1–4.3](../../ARCHIVING_REUSABLE_CODE.md) provides listing query patterns (all 🟡 tier):

**Business archived listing** (§4.1) — must add archive metadata to fetch clause:
```tql
match
    $business isa business, has id $id, has name $name, ...;
    $business has archivedAt $archivedAt;
    $business has archivedBy $archivedBy;
fetch {
    'id': $id, 'name': $name, ...,
    'archived_at': $archivedAt,
    'archived_by': $archivedBy,
    'archived_reason': [ $business.archivedReason ]
};
```

**Project archived listing** (§4.2) — must add parent business archive status:
```tql
match
    $project isa project, ...;
    $hp isa hasProjects(business: $business, project: $project);
    $business has id $business_id, has name $business_name;
    $project has archivedAt $archivedAt;
fetch {
    ...,
    'business_id': $business_id,
    'business_name': $business_name,
    'archived_at': $archivedAt,
    'archived_by': [ $project.archivedBy ],
    'archived_reason': [ $project.archivedReason ],
    'parent_business_archived': [ $business.archivedAt ]
};
```

The `parent_business_archived` field can be derived from whether `$business.archivedAt` returns a value.

### Current endpoint paths

- Business: `GET /businesses/archived` — path matches spec ✓
- Project: currently `GET /projects/archived` — path matches spec ✓
- Task: currently `GET /tasks/archived` — path matches spec ✓

### Risks

- **Risk**: The parent context queries (especially for tasks which need both project and business archive status) add complexity to the TypeQL query. Performance should be tested with realistic data volumes.
- **Resolved**: Sort order is `archived_at` descending (primary), `name` ascending (secondary).

### Files likely affected

- [`projojo_backend/routes/business_router.py`](../../../projojo_backend/routes/business_router.py) — update response model
- [`projojo_backend/routes/project_router.py`](../../../projojo_backend/routes/project_router.py) — update response model + parent context
- [`projojo_backend/routes/task_router.py`](../../../projojo_backend/routes/task_router.py) — update response model + parent context
- Corresponding repository methods for all three
- New Pydantic response models (from ARCH-task-002)
