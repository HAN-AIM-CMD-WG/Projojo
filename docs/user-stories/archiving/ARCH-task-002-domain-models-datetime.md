# ARCH-task-002 — Domain Models and Datetime Serialization

**User Story**: [ARCH-story-001 — Archiving Foundations](ARCH-story-001-archiving-foundations.md)  
**Priority**: 🔴 Critical  
**Type**: Technical Task  
**Spec references**: [§2.1](../../ARCHIVING_SPECIFICATION.md), [§2.5](../../ARCHIVING_SPECIFICATION.md), [§5.5](../../ARCHIVING_SPECIFICATION.md), [§6.5](../../ARCHIVING_SPECIFICATION.md)  
**Dependencies**: [ARCH-task-001](ARCH-task-001-schema-migration.md) (schema must exist first)

---

## Task Story

As a **developer**,  
I want the Pydantic domain models and repository mappers to correctly represent archive state using `archived_at`, `archived_by`, and `archived_reason` with timezone-aware datetime serialization,  
so that archive metadata flows correctly between TypeDB, the API layer, and the frontend.

---

## Context: What Must Change and Why

The current codebase has two conflicting archive representations:

1. **Business model** ([`projojo_backend/domain/models/business.py`](../../../projojo_backend/domain/models/business.py:16)): Uses `is_archived: bool = False` — a derived boolean that the spec explicitly bans (§6.5).
2. **Project model** ([`projojo_backend/domain/models/project.py`](../../../projojo_backend/domain/models/project.py:1)): Has `json_encoders` with `strftime("%Y-%m-%dT%H:%M:%S")` — drops timezone info, violating spec §2.5.
3. **Business repository** ([`projojo_backend/domain/repositories/business_repository.py`](../../../projojo_backend/domain/repositories/business_repository.py:126)): Maps `isArchived` from TypeDB results to `is_archived` boolean on the model.
4. **No `archived_reason` field** exists on any model.
5. **No dedicated Pydantic request/response models** exist for archive operations (spec §5.5 requires explicit models).

The specification requires:
- `archived_at: datetime | None` (timezone-aware) as the only archive state indicator
- `archived_by: str | None` and `archived_reason: str | None` on all archivable models
- No `is_archived` boolean field on any API model
- ISO 8601 serialization with timezone information
- Explicit FastAPI request and response models for all archive/restore operations

For HTTP and Pydantic models, this codebase already leans on **snake_case** field names such as `access_token`, `full_name`, and `impact_summary` rather than camelCase payload aliases. This task standardizes the archive API on `archived_reason` in request/response bodies while TypeDB attributes remain `archivedAt`, `archivedBy`, and `archivedReason`.

---

## Acceptance Criteria

### AC-1: Business model uses archive timestamp fields

**Given** the Business Pydantic model is updated  
**When** a business entity with archive metadata is loaded from TypeDB  
**Then** the model has `archived_at: datetime | None = None`, `archived_by: str | None = None`, and `archived_reason: str | None = None`  
**And** the model does **not** have an `is_archived` boolean field

### AC-2: Project model uses archive timestamp fields

**Given** the Project Pydantic model is updated  
**When** a project entity with archive metadata is loaded from TypeDB  
**Then** the model has `archived_at`, `archived_by`, and `archived_reason` fields  
**And** the timezone-lossy `json_encoders` with `strftime` is removed or replaced with a timezone-aware serializer

### AC-3: Task model uses archive timestamp fields

**Given** the Task Pydantic model is updated  
**When** a task entity with archive metadata is loaded from TypeDB  
**Then** the model has `archived_at`, `archived_by`, and `archived_reason` fields

### AC-4: Supervisor model supports multi-business and archive state

**Given** the Supervisor Pydantic model is updated  
**When** a supervisor with multiple business associations is loaded  
**Then** the model can represent multiple business associations (not a single `business_association_id`)  
**And** the model has `archived_at`, `archived_by`, and `archived_reason` fields

### AC-5: Repository mappers extract archive metadata from TypeDB results

**Given** a TypeDB result containing `archivedAt`, `archivedBy`, and `archivedReason` values  
**When** the repository mapper processes the result  
**Then** all three archive fields are correctly mapped to the domain model  
**And** `archivedAt` is mapped as a timezone-aware Python `datetime` instance  
**And** absent archive attributes result in `None` values (not `False` or empty strings)

### AC-6: Datetime serialization preserves timezone

**Given** an API response contains a model with `archived_at` set  
**When** the response is serialized to JSON  
**Then** the `archived_at` field is an ISO 8601 string with timezone information (e.g., `"2026-04-23T14:30:00+00:00"`)  
**And** not a naive datetime string like `"2026-04-23T14:30:00"`

### AC-7: Archive API request models defined

**Given** the FastAPI archive endpoints need request validation  
**When** Pydantic request models are created  
**Then** an `ArchiveRequest` model exists with:
- `confirm: bool` (required)
- `archived_reason: str` (required, non-empty)

**And** a `RestoreRequest` model exists with:
- `confirm: bool` (required)
- `selected: dict | None = None` (required when `confirm=true` and descendants exist)

**And** the HTTP request model fields use snake_case names, including `archived_reason`

### AC-8: Archive API response models defined

**Given** the FastAPI archive endpoints need structured responses
**When** Pydantic response models are created
**Then** response models exist for:
- `ArchivePreviewResponse` — archive preview (spec §5.3)
- `RestorePreviewResponse` — restore preview with candidate preselection (spec §5.3)
- `ArchivedBusinessItem`, `ArchivedProjectItem`, `ArchivedTaskItem` — listing items with parent context (spec §5.4)
- `AffectedProject`, `AffectedTask`, `AffectedRegistration`, `AffectedSupervisor` — sub-models for preview affected entities
- `RestoreCandidate` — sub-model for restore preview candidate items with preselection flag

These names follow the project conventions: auth operations use `{Action}Request`/`{Action}Response` (see `LoginRequest`, `LoginResponse`), entity models use `{Entity}` (e.g., `Business`, `Task`), and operation-specific models use `{Entity}{Action}` (e.g., `TaskCreate`, `ThemeUpdate`).

### AC-9: No derived `is_archived` boolean on any API model

**Given** all domain and API models are updated  
**When** reviewing the codebase  
**Then** no Pydantic model exposes a field named `is_archived` or `isArchived`  
**And** archive state is determined solely by `archived_at` presence

---

## Technical Notes

### Reusable code from Archive_Feature branch

[`ARCHIVING_REUSABLE_CODE.md` §2.1–2.3](../../ARCHIVING_REUSABLE_CODE.md) provides model patterns (🟡 tier):

```python
# Business model — add archived_reason, remove is_archived
class Business(BaseModel):
    id: str | None = None
    name: str
    description: str
    image_path: str
    location: str
    projects: list[Project] | None = None
    archived_at: datetime | None = None
    archived_by: str | None = None
    archived_reason: str | None = None  # NEW — spec §2.1

    model_config = ConfigDict(from_attributes=True)  # Pydantic v2
```

```python
# Project model — add archived_reason, FIX timezone-lossy encoder
class Project(BaseModel):
    # ... existing fields ...
    archived_at: datetime | None = None
    archived_by: str | None = None
    archived_reason: str | None = None  # NEW

    model_config = ConfigDict(from_attributes=True)
    # REMOVED: json_encoders with strftime that drops timezone
```

[`ARCHIVING_REUSABLE_CODE.md` §2.4](../../ARCHIVING_REUSABLE_CODE.md) notes the Supervisor model is 🔴 Reference Only because `business_association_id: str | None` must become multi-business.

### Datetime handling

Per spec §2.5:
- Backend is authoritative for archive timestamps
- Use `datetime.now(timezone.utc)` when setting `archivedAt`
- TypeDB `datetime-tz` maps to Python timezone-aware `datetime`
- Student 30-day window is computed from backend time, not browser time

### Request/Response model structure (spec §5.3)

HTTP/Pydantic field naming for this feature uses snake_case to match existing API conventions. Mapping to TypeDB camelCase attributes happens inside repository or mapper code.

```python
class ArchivePreviewResponse(BaseModel):
    preview: bool = True
    operation: str = "archive"
    entity_type: str
    entity_id: str
    affected: dict  # keys vary by entity type

class RestorePreviewResponse(BaseModel):
    preview: bool = True
    operation: str = "restore"
    entity_type: str
    entity_id: str
    root: dict
    candidates: dict
```

### Risks and ambiguities

- **Risk**: The current business repository mapper at [`business_repository.py:126`](../../../projojo_backend/domain/repositories/business_repository.py:126) reads `isArchived` from TypeDB results. This will break immediately after schema migration. This mapper must be updated in this task to read `archivedAt` instead.
- **Risk**: The `portfolio_repository.py` also reads `isArchived` from project data ([`portfolio_repository.py:164`](../../../projojo_backend/domain/repositories/portfolio_repository.py:164)). This integration point needs updating.
- **Resolved**: Pydantic model names follow existing project conventions (`{Action}Request`/`{Action}Response` for operations, `{Entity}{Action}` for entity-specific models). See AC-7 and AC-8 for the full list.

### Files likely affected

- [`projojo_backend/domain/models/business.py`](../../../projojo_backend/domain/models/business.py)
- [`projojo_backend/domain/models/project.py`](../../../projojo_backend/domain/models/project.py)
- [`projojo_backend/domain/models/task.py`](../../../projojo_backend/domain/models/task.py)
- [`projojo_backend/domain/models/user.py`](../../../projojo_backend/domain/models/user.py)
- [`projojo_backend/domain/repositories/business_repository.py`](../../../projojo_backend/domain/repositories/business_repository.py) — mapper
- [`projojo_backend/domain/repositories/project_repository.py`](../../../projojo_backend/domain/repositories/project_repository.py) — mapper
- [`projojo_backend/domain/repositories/task_repository.py`](../../../projojo_backend/domain/repositories/task_repository.py) — mapper
- [`projojo_backend/domain/repositories/portfolio_repository.py`](../../../projojo_backend/domain/repositories/portfolio_repository.py) — `isArchived` reference
- New file(s) for archive request/response models (e.g., `projojo_backend/domain/models/archive.py`)
