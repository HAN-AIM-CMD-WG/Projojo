# Archiving Reusable Code Analysis

> **Source branch:** `Archive_Feature`
> **Target branch:** `next-ui`
> **Target specification:** [`ARCHIVING_SPECIFICATION.md`](ARCHIVING_SPECIFICATION.md)
> **Generated:** 2026-04-24
> **Purpose:** Complete map of every archive/restore code snippet in the current branch, assessed for reusability on `next-ui`

---

## How to Read This Document

Each snippet is categorized into one of three **reusability tiers**:

| Tier | Symbol | Meaning |
|------|--------|---------|
| **Directly Reusable** | 🟢 | Can be copied to `next-ui` as-is or with trivial cosmetic changes |
| **Reusable with Modifications** | 🟡 | The pattern and structure are sound, but specific changes are required — described for each |
| **Reference Only** | 🔴 | Useful to understand the prior approach, but should be rewritten. Explains why. |

### Assumptions

1. The `next-ui` branch uses the same TypeDB driver and `Db.read_transact` / `Db.write_transact` API. If the DB layer has been replaced, all TypeQL snippets need translation — but the query patterns themselves remain valid reference.
2. The `next-ui` frontend is a React SPA with the same `fetch`-based service layer pattern. If it has moved to a different data-fetching approach (e.g., TanStack Query, SWR), the service functions still document the correct endpoints.
3. The `next-ui` branch does not yet have archive preview or selective restore — those are net-new features documented in the spec.
4. Pydantic v2 is assumed on `next-ui`. The current branch uses `BaseModel` with `Config` inner class (Pydantic v1 style). Models may need `model_config` migration.

---

## 1. Schema and Data Model

### 1.1 Archive Attribute Declarations

**File:** [`projojo_backend/db/schema.tql`](../projojo_backend/db/schema.tql:152) (lines 152–155)

**Tier:** 🟡 Reusable with Modifications

```tql
attribute archivedAt value datetime-tz;
attribute archivedBy value string;
attribute archivedReason value string;
```

**What it does:** Declares the three archive attribute types. `archivedAt` and `archivedBy` are used throughout; `archivedReason` is declared but never owned by any entity — it is dead schema.

**Adaptation needed:** Per spec §2.4, add `owns archivedReason @card(0..1)` to all five archivable types. The attribute declarations themselves are directly reusable.

---

### 1.2 Entity Archive Ownership

**File:** [`projojo_backend/db/schema.tql`](../projojo_backend/db/schema.tql:10) (lines 10–14, 28–38, 40–51, 53–63, 112–120)

**Tier:** 🟡 Reusable with Modifications

```tql
entity supervisor sub user,
    owns archivedAt @card(0..1),
    owns archivedBy @card(0..1),
    plays manages:supervisor @card(1),        -- CHANGE: @card(1..) per spec §2.4
    plays creates:supervisor @card(0..);

entity business,
    owns archivedAt @card(0..1),
    owns archivedBy @card(0..1),
    -- ... other attributes ...

entity project,
    owns archivedAt @card(0..1),
    owns archivedBy @card(0..1),
    -- ... other attributes ...

entity task,
    owns archivedAt @card(0..1),
    owns archivedBy @card(0..1),
    -- ... other attributes ...

relation registersForTask,
    owns archivedAt @card(0..1),
    owns archivedBy @card(0..1),
    -- ... other attributes ...
```

**What it does:** Gives all five archivable types optional `archivedAt` and `archivedBy` attributes.

**Adaptation needed:**
1. Add `owns archivedReason @card(0..1)` to all five types (spec §2.1).
2. Change supervisor cardinality: `plays manages:supervisor @card(1..)` to support multi-business supervisors (spec §2.4, item 4).
3. Remove any `isArchived` boolean if `next-ui` still has one (spec §2.4, item 1).

---

## 2. Domain Models (Pydantic)

### 2.1 Business Model

**File:** [`projojo_backend/domain/models/business.py`](../projojo_backend/domain/models/business.py:1) (lines 1–18)

**Tier:** 🟡 Reusable with Modifications

```python
class Business(BaseModel):
    id: str | None = None
    name: str
    description: str
    image_path: str
    location: str
    projects: list[Project] | None = None
    archived_at: datetime | None = None
    archived_by: str | None = None

    class Config:
        from_attributes = True
```

**What it does:** Pydantic model for business entities, including optional archive fields.

**Adaptation needed:**
1. Add `archived_reason: str | None = None` (spec §2.1).
2. If `next-ui` uses Pydantic v2, replace `class Config` with `model_config = ConfigDict(from_attributes=True)`.
3. The spec prohibits a derived `is_archived` boolean (spec §6.5) — this model correctly avoids one.

---

### 2.2 Project Model

**File:** [`projojo_backend/domain/models/project.py`](../projojo_backend/domain/models/project.py:1) (lines 1–27)

**Tier:** 🟡 Reusable with Modifications

```python
class Project(BaseModel):
    id: str | None = None
    name: str
    description: str
    image_path: str
    created_at: Annotated[datetime, Field(examples=["2025-04-21T10:02:58"])]
    business_id: str | None = None
    location: str | None = None
    tasks: list[Task] | None = None
    archived_at: datetime | None = None
    archived_by: str | None = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.strftime("%Y-%m-%dT%H:%M:%S")
        }
```

**What it does:** Pydantic model for projects with archive fields.

**Adaptation needed:**
1. Add `archived_reason: str | None = None`.
2. The `json_encoders` with `strftime` drops timezone information. Spec §2.5 requires ISO 8601 with timezone. **This encoder must be removed or replaced** with a timezone-aware serializer.
3. Pydantic v2 migration if needed.

---

### 2.3 Task Model

**File:** [`projojo_backend/domain/models/task.py`](../projojo_backend/domain/models/task.py:1) (lines 1–21)

**Tier:** 🟡 Reusable with Modifications

```python
class Task(BaseModel):
    id: str | None = None
    name: str
    description: str
    total_needed: int
    created_at: datetime
    project_id: str | None = None
    skills: list[Skill] | None = None
    total_registered: int | None = None
    total_accepted: int | None = None
    archived_at: datetime | None = None
    archived_by: str | None = None
```

**Adaptation needed:** Add `archived_reason: str | None = None`. Same Pydantic v2 migration notes.

---

### 2.4 User/Supervisor Model

**File:** [`projojo_backend/domain/models/user.py`](../projojo_backend/domain/models/user.py:24) (lines 24–26)

**Tier:** 🔴 Reference Only

```python
class Supervisor(User):
    business_association_id: str | None = None
    created_project_ids: list[str] = []
```

**Why reference only:** The `Supervisor` model has a single `business_association_id`. The target spec (§2.4, §4.5) requires multi-business supervisors. This field must become a list or the association model must change. The model also has no archive fields — supervisor archive state is queried from the DB, not stored on the model. This is a design decision worth preserving.

---

## 3. Archive Filtering in Active Queries

These are the TypeQL query patterns that exclude archived entities from normal read operations. They are the backbone of the "soft delete" behavior and are highly reusable.

### 3.1 Business Active Queries

**File:** [`projojo_backend/domain/repositories/business_repository.py`](../projojo_backend/domain/repositories/business_repository.py:13) (lines 13–35 for `get_by_id`, 37–56 for `get_all`)

**Tier:** 🟢 Directly Reusable

```tql
-- Pattern used in get_by_id and get_all:
not { $business has archivedAt $archivedAt; };
```

**What it does:** Simple single-level archive exclusion. Any business with an `archivedAt` attribute is hidden from active queries.

**Adaptation needed:** None. This pattern is exactly what the spec requires (§3.5).

---

### 3.2 Business Nested Query with Three-Level Filtering

**File:** [`projojo_backend/domain/repositories/business_repository.py`](../projojo_backend/domain/repositories/business_repository.py:113) (lines 113–177)

**Tier:** 🟡 Reusable with Modifications

```tql
match
    $business isa business;
not { $business has archivedAt $bArchived; };
fetch {
    -- ... business fields ...,
    "projects": [
        match
            ($business, $project) isa hasProjects;
            $project isa project;
        not { $project has archivedAt $pArchived; };
        fetch {
            -- ... project fields ...,
            "tasks": [
                match
                    ($project, $task) isa containsTask;
                    $task isa task;
                not { $task has archivedAt $tArchived; };
                fetch {
                    -- ... task fields ...,
                    "total_registered": (
                        match
                            $registration isa registersForTask (task: $task, student: $student);
                        not { $registration has isAccepted $any_value; };
                        return count;
                    ),
                    "total_accepted": (
                        match
                            $registration isa registersForTask (task: $task, student: $student),
                            has isAccepted true;
                        return count;
                    ),
                    -- ... skills ...
                };
            ]
        };
    ]
};
```

**What it does:** Three-level nested query with archive filtering at business, project, and task levels. Used for the complete business overview.

**Adaptation needed:**
1. **Missing registration archive filter** in the `total_registered` and `total_accepted` subqueries. The spec (§7.1) requires `not { $registration has archivedAt $regArchived; }` in these counts. This is bug RISK-09 from the business rules document. **Fix this when porting.**
2. The nested query pattern itself is excellent and should be reused.

---

### 3.3 Project Active Queries with Parent Business Filter

**File:** [`projojo_backend/domain/repositories/project_repository.py`](../projojo_backend/domain/repositories/project_repository.py:14) (lines 14–67 for `get_by_id` and `get_all`)

**Tier:** 🟢 Directly Reusable

```tql
-- Pattern used in all project active queries:
not { $project has archivedAt $archivedAt; };
not { $business has archivedAt $bArchived; };
```

**What it does:** Double filter — excludes projects that are directly archived AND projects whose parent business is archived. This is the correct behavior per spec §3.5.

**Adaptation needed:** None. This two-level filter pattern is exactly what the specification requires.

---

### 3.4 Task Active Queries with Registration Count Exclusion

**File:** [`projojo_backend/domain/repositories/task_repository.py`](../projojo_backend/domain/repositories/task_repository.py:12) (lines 12–49 for `get_by_id`)

**Tier:** 🟢 Directly Reusable

```tql
not { $task has archivedAt $archivedAt; };
-- And in registration count subqueries:
'total_registered': (
    match
        $registration isa registersForTask (task: $task, student: $student);
    not { $registration has archivedAt $regArchived; };
    not { $registration has isAccepted $any_value; };
    return count;
),
'total_accepted': (
    match
        $registration isa registersForTask (task: $task, student: $student),
        has isAccepted true;
    not { $registration has archivedAt $regArchived2; };
    return count;
)
```

**What it does:** Filters archived tasks AND excludes archived registrations from slot count calculations. This correctly implements spec §7.1.

**Adaptation needed:** None. This is the gold standard for archive-aware count queries. Copy directly.

---

### 3.5 Task-by-Project Query with Project+Task Filtering

**File:** [`projojo_backend/domain/repositories/task_repository.py`](../projojo_backend/domain/repositories/task_repository.py:86) (lines 86–127)

**Tier:** 🟢 Directly Reusable

```tql
not { $project has archivedAt $pArchived; };
not { $task has archivedAt $archivedAt; };
```

**What it does:** Two-level filter for tasks: excludes archived projects AND archived tasks within active projects.

**Adaptation needed:** None.

---

## 4. Archived Entity Listing Queries

### 4.1 Business Archived Listing

**File:** [`projojo_backend/domain/repositories/business_repository.py`](../projojo_backend/domain/repositories/business_repository.py:223) (lines 223–242)

**Tier:** 🟡 Reusable with Modifications

```python
def get_archived(self) -> list[Business]:
    query = """
        match
            $business isa business,
            has id $id, has name $name,
            has description $description,
            has imagePath $imagePath,
            has location $location;
        $business has archivedAt $archivedAt;
        fetch {
            'id': $id, 'name': $name,
            'description': $description,
            'imagePath': $imagePath,
            'location': $location
        };
    """
    results = Db.read_transact(query)
    return [self._map_to_model(result) for result in results]
```

**What it does:** Fetches all archived businesses.

**Adaptation needed:**
1. The query matches on `archivedAt` but does not **fetch** `archivedAt`, `archivedBy`, or `archivedReason`. The spec (§5.4, §6.1) requires returning this archive metadata for display. Add these to the fetch clause.
2. The `_map_to_model` method also ignores archive fields — it must be updated to map `archivedAt`, `archivedBy`, `archivedReason`.
3. Consider adding a dedicated `ArchivedBusinessResponse` Pydantic model per spec §5.5.

---

### 4.2 Project Archived Listing

**File:** [`projojo_backend/domain/repositories/project_repository.py`](../projojo_backend/domain/repositories/project_repository.py:125) (lines 125–147)

**Tier:** 🟡 Reusable with Modifications

```python
def get_archived(self) -> list[Project]:
    query = """
        match
            $project isa project, ...;
            $hp isa hasProjects(business: $business, project: $project);
            $business has id $business_id;
        $project has archivedAt $archivedAt;
        fetch { 'id': $id, 'name': $name, ..., 'business': $business_id };
    """
```

**What it does:** Fetches archived projects with their parent business ID.

**Adaptation needed:**
1. Fetch `archivedAt`, `archivedBy`, `archivedReason` values and include in response.
2. Spec §5.4 requires including parent business information needed for disabled restore explanations — this partially does that (includes `business_id`) but should also include business archive status so the frontend can determine if restore is blocked.
3. Needs dedicated response model.

---

### 4.3 Task Archived Listing

**File:** [`projojo_backend/domain/repositories/task_repository.py`](../projojo_backend/domain/repositories/task_repository.py:129) (lines 129–151)

**Tier:** 🟡 Reusable with Modifications

```python
def get_archived(self) -> list[Task]:
    query = """
        match
            $task isa task, ...;
            $task has archivedAt $archivedAt;
            $ct isa containsTask (project: $project, task: $task);
        fetch { 'id': $id, 'name': $name, ..., 'project_id': $project.id };
    """
```

**Adaptation needed:** Same as §4.2 — fetch archive metadata, include parent project and grandparent business archive status for blocked-restore UX (spec §5.4).

---

## 5. Archive Cascade Operations

### 5.1 Business Archive Cascade

**File:** [`projojo_backend/domain/repositories/business_repository.py`](../projojo_backend/domain/repositories/business_repository.py:244) (lines 244–315)

**Tier:** 🟡 Reusable with Modifications

```python
def archive(self, business_id: str, archived_by: str) -> None:
    from datetime import datetime
    ts = datetime.now()

    # Step 1: Archive business
    query = """
        match $b isa business, has id ~business_id;
        not { $b has archivedAt $x; };
        update
            $b has archivedAt ~ts;
            $b has archivedBy ~by;
    """
    Db.write_transact(query, {"business_id": business_id, "ts": ts, "by": archived_by})

    # Step 2: Archive projects
    query = """
        match $b isa business, has id ~business_id;
            ($b, $p) isa hasProjects; $p isa project;
        not { $p has archivedAt $x; };
        update $p has archivedAt ~ts; $p has archivedBy ~by;
    """
    Db.write_transact(query, {"business_id": business_id, "ts": ts, "by": archived_by})

    # Step 3: Archive tasks
    query = """
        match $b isa business, has id ~business_id;
            ($b, $p) isa hasProjects; ($p, $t) isa containsTask; $t isa task;
        not { $t has archivedAt $x; };
        update $t has archivedAt ~ts; $t has archivedBy ~by;
    """
    Db.write_transact(query, {"business_id": business_id, "ts": ts, "by": archived_by})

    # Step 4: Archive supervisors
    query = """
        match $b isa business, has id ~business_id;
            $m isa manages (supervisor: $s, business: $b); $s isa supervisor;
        not { $s has archivedAt $x; };
        update $s has archivedAt ~ts; $s has archivedBy ~by;
    """
    Db.write_transact(query, {"business_id": business_id, "ts": ts, "by": archived_by})

    # Step 5: Archive registrations
    query = """
        match $b isa business, has id ~business_id;
            ($b, $p) isa hasProjects; ($p, $t) isa containsTask;
            $r isa registersForTask (task: $t, student: $stu);
        not { $r has archivedAt $x; };
        update $r has archivedAt ~ts; $r has archivedBy ~by;
    """
    Db.write_transact(query, {"business_id": business_id, "ts": ts, "by": archived_by})
```

**What it does:** Five-step cascade archive: business → projects → tasks → supervisors → registrations. All share the same timestamp. Each step has an idempotent guard (`not { ... has archivedAt ... }`).

**What is good:**
- The idempotent guard pattern (spec §3.7) is correct and well-implemented.
- The shared timestamp across all cascade levels (spec §4.1) is correct.
- The TypeQL traversal patterns are correct.
- The cascade order is correct.

**Adaptation needed:**
1. **Add `archivedReason`:** Each step must also set `archivedReason`. The root entity uses teacher-entered text; descendants use auto-generated root-referencing text (spec §4.1).
2. **Multi-business supervisor check:** Step 4 currently archives ALL supervisors of the business unconditionally. The spec (§4.5) requires checking whether the supervisor has other active businesses first. Only supervisors with no remaining active businesses should be archived. This requires a conditional query like:
   ```tql
   not { $m2 isa manages (supervisor: $s, business: $b2);
         not { $b2 has archivedAt $x2; };
         not { $b2 has id ~business_id; }; };
   ```
3. **Atomicity:** The current implementation uses 5 separate `write_transact` calls. Spec §4.6 requires a single transaction. If TypeDB supports multi-statement transactions, wrap all steps. Otherwise, document the partial-failure risk.
4. **Preview mode:** The spec requires a dry-run preview (§3.2, §5.1). The current code has no preview. A new `archive_preview` method is needed that runs the same traversal patterns as read-only queries and returns affected entity lists. The traversal patterns from this cascade can be reused directly for the preview queries.
5. **Use timezone-aware datetime:** `datetime.now()` lacks timezone. Use `datetime.now(timezone.utc)` per spec §2.5.

---

### 5.2 Project Archive Cascade

**File:** [`projojo_backend/domain/repositories/project_repository.py`](../projojo_backend/domain/repositories/project_repository.py:274) (lines 274–316)

**Tier:** 🟡 Reusable with Modifications

```python
def archive(self, project_id: str, archived_by: str) -> None:
    from datetime import datetime
    ts = datetime.now()

    # Step 1: Archive project
    # Step 2: Archive tasks via ($p, $t) isa containsTask
    # Step 3: Archive registrations via ($p, $t) isa containsTask; $r isa registersForTask
```

**What it does:** Three-step cascade: project → tasks → registrations. Same idempotent guard pattern.

**Adaptation needed:** Same as §5.1 — add `archivedReason`, timezone-aware timestamp, preview mode, atomicity. No supervisor-specific changes needed here.

---

### 5.3 Task Archive Cascade

**File:** [`projojo_backend/domain/repositories/task_repository.py`](../projojo_backend/domain/repositories/task_repository.py:381) (lines 381–409)

**Tier:** 🟡 Reusable with Modifications

```python
def archive(self, task_id: str, archived_by: str) -> None:
    from datetime import datetime
    ts = datetime.now()

    # Step 1: Archive task
    # Step 2: Archive registrations via $r isa registersForTask (task: $t, student: $stu)
```

**What it does:** Two-step cascade: task → registrations.

**Adaptation needed:** Same as above — add `archivedReason`, timezone-aware timestamp, preview mode, atomicity.

---

## 6. Restore (Unarchive) Operations

### 6.1 Business Unarchive Cascade

**File:** [`projojo_backend/domain/repositories/business_repository.py`](../projojo_backend/domain/repositories/business_repository.py:317) (lines 317–420)

**Tier:** 🔴 Reference Only

```python
def unarchive(self, business_id: str) -> None:
    # Business: delete archivedAt, delete archivedBy (2 transactions)
    # Projects: delete archivedAt, delete archivedBy (2 transactions)
    # Tasks: delete archivedAt, delete archivedBy (2 transactions)
    # Supervisors: delete archivedAt, delete archivedBy (2 transactions)
    # Registrations: delete archivedAt, delete archivedBy (2 transactions)
    # Total: 10 separate write transactions
```

**Why reference only:** The target spec fundamentally changes how restore works:
1. **Selective restore with preview** (spec §3.3): The current code blindly restores everything. The new system requires a preview step where the teacher selects which descendants to restore.
2. **Preselection based on metadata matching** (spec §2.2): Descendants whose `archivedAt`/`archivedBy`/`archivedReason` match the root are preselected.
3. **Dependency-aware selection** (spec §4.4): Children cannot be restored if their parent remains archived.
4. **Downward-only** (spec §3.3): Never suggests restoring parents.
5. **Must also delete `archivedReason`** — the current code only deletes `archivedAt` and `archivedBy` (since `archivedReason` was never written).
6. **Name collision handling** (spec §3.8) on restore is not implemented.

**What is salvageable as reference:** The TypeQL `delete has $ts of $entity` pattern for removing attributes is correct and will be needed. The traversal patterns for finding descendants are the same as the archive cascade and are reusable.

---

### 6.2 Project Unarchive Cascade

**File:** [`projojo_backend/domain/repositories/project_repository.py`](../projojo_backend/domain/repositories/project_repository.py:318) (lines 318–376)

**Tier:** 🔴 Reference Only

Same reasoning as §6.1. Additionally, the current code does **not check whether the parent business is active** before restoring a project. The spec (§3.3) requires this check — restoring a project while its parent business is archived must return `409`.

---

### 6.3 Task Unarchive Cascade

**File:** [`projojo_backend/domain/repositories/task_repository.py`](../projojo_backend/domain/repositories/task_repository.py:411) (lines 411–447)

**Tier:** 🔴 Reference Only

Same reasoning. No parent-project active check exists.

---

## 7. Supervisor Login Block

### 7.1 Auth Service — Supervisor Archived Check

**File:** [`projojo_backend/service/auth_service.py`](../projojo_backend/service/auth_service.py:32) (lines 32–43)

**Tier:** 🟡 Reusable with Modifications

```python
# Block archived supervisors from logging in
try:
    user_type = getattr(final_user, "type", None) or (
        final_user.get("type") if isinstance(final_user, dict) else None
    )
    user_id = getattr(final_user, "id", None) or (
        final_user.get("id") if isinstance(final_user, dict) else None
    )

    if user_type == "supervisor" and user_id:
        if self.user_repo.is_supervisor_archived(user_id):
            raise ValueError("Supervisor account is archived")
except Exception as e:
    raise ValueError(
        "Je account is gearchiveerd. Neem contact op met een docent."
    ) from e
```

**What it does:** During OAuth callback, checks if an authenticating supervisor is archived and blocks login with a Dutch error message.

**Adaptation needed:**
1. **Multi-business model** (spec §6.6): The current check is binary — supervisor is or is not archived. In the new system, a supervisor with multiple businesses might have some archived and some active. The check must become: "does this supervisor have at least one active business?" If yes, allow login. If no, block.
2. The error handling structure (raising `ValueError` that the router catches and converts to a redirect) is a good pattern and reusable.
3. The Dutch user-facing message is correct per spec §6.6.

---

### 7.2 User Repository — is_supervisor_archived

**File:** [`projojo_backend/domain/repositories/user_repository.py`](../projojo_backend/domain/repositories/user_repository.py:705) (lines 705–716)

**Tier:** 🟡 Reusable with Modifications

```python
def is_supervisor_archived(self, supervisor_id: str) -> bool:
    query = """
        match
            $s isa supervisor, has id ~id;
            $s has archivedAt $ts;
        fetch { 'archived': true };
    """
    results = Db.read_transact(query, {"id": supervisor_id})
    return len(results) > 0
```

**Adaptation needed:** For multi-business supervisors, replace this with a query that checks whether the supervisor has any active (non-archived) businesses:

```tql
match
    $s isa supervisor, has id ~id;
    $m isa manages (supervisor: $s, business: $b);
not { $b has archivedAt $x; };
fetch { 'has_active_business': true };
```

If this returns no results, the supervisor has no active businesses and should be blocked.

---

### 7.3 Auth Router — Error Redirect

**File:** [`projojo_backend/routes/auth_router.py`](../projojo_backend/routes/auth_router.py:95) (lines 95–100)

**Tier:** 🟢 Directly Reusable

```python
except ValueError as e:
    request.session.clear()
    return RedirectResponse(
        url=f"{frontend_url}/auth/callback?error=auth_failed&message="
        + URL_safe(str(e)) + invite_token_query
    )
```

**What it does:** Catches the `ValueError` from the archived-supervisor check and redirects to the frontend with an error message in the URL.

**Adaptation needed:** None. The redirect pattern works as-is.

---

### 7.4 Frontend AuthCallback — Error Handling

**File:** [`projojo_frontend/src/auth/AuthCallback.jsx`](../projojo_frontend/src/auth/AuthCallback.jsx:16) (lines 16–37)

**Tier:** 🟢 Directly Reusable

```jsx
if (error) {
    let errorMessage = message || "Authenticatie mislukt. Probeer het opnieuw.";
    // ... error type mapping ...
    notification.error(errorMessage);
    if (inviteToken) {
        navigate(`/invite/${inviteToken}`, { replace: true });
    } else {
        navigate('/', { replace: true });
    }
    return;
}
```

**What it does:** Displays the archived-supervisor error message and redirects to login.

**Adaptation needed:** The spec (§6.6) additionally requires offering guest continuation to the public discovery page. Currently it just redirects to `/`. Add an option to navigate to the public discovery page.

---

## 8. Permission Checks

### 8.1 Auth Decorator

**File:** [`projojo_backend/auth/permissions.py`](../projojo_backend/auth/permissions.py:17) (lines 17–104)

**Tier:** 🟡 Reusable with Modifications

```python
def auth(role: str, owner_id_key: str | None = None):
    # ... validates role hierarchy and ownership ...
    # Role hierarchy: teacher > supervisor > student > unauthenticated
    # If owner_id_key provided and user is not teacher, checks resource ownership
```

**What it does:** Comprehensive role-based auth decorator with ownership validation. Teachers bypass ownership checks.

**Adaptation needed for archive endpoints specifically:**
- The current archive endpoints use `@auth(role="supervisor", owner_id_key="business_id")` which allows both supervisors (with ownership check) and teachers.
- The spec (§3.1) changes this to **teacher-only** for all archive and restore. So archive endpoints should use `@auth(role="teacher")` — which is simpler.
- The decorator itself is perfectly reusable; only the calling endpoints need the role parameter changed.

---

### 8.2 Supervisor Ownership Check

**File:** [`projojo_backend/auth/permissions.py`](../projojo_backend/auth/permissions.py:212) (lines 212–267)

**Tier:** 🟢 Directly Reusable (for non-archive endpoints)

The `_check_supervisor_ownership` function is not needed for archive/restore endpoints in the new system (since those are teacher-only), but it remains correct and useful for other supervisor-gated endpoints like project creation and task management.

---

## 9. Route Handlers

### 9.1 Business Archive Endpoint

**File:** [`projojo_backend/routes/business_router.py`](../projojo_backend/routes/business_router.py:167) (lines 167–185)

**Tier:** 🟡 Reusable with Modifications

```python
@router.post("/{business_id}/archive")
@auth(role="supervisor", owner_id_key="business_id")
async def archive_business(
    request: Request,
    business_id: str = Path(..., description="Business ID")
):
    try:
        business_repo.archive(business_id, request.state.user_id)
        return {"message": "Bedrijf succesvol gearchiveerd"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="...")
```

**Adaptation needed:**
1. Change `POST` to `PATCH` (spec §5.1).
2. Change auth to `@auth(role="teacher")` (spec §3.1).
3. Add request body: `{ "confirm": boolean, "archivedReason": string }` (spec §5.1).
4. When `confirm=false`, call preview instead of execute.
5. Return structured preview response (spec §5.3) or execution response.
6. Add explicit Pydantic request/response models (spec §5.5).

---

### 9.2 Business Unarchive Endpoint

**File:** [`projojo_backend/routes/business_router.py`](../projojo_backend/routes/business_router.py:187) (lines 187–204)

**Tier:** 🟡 Reusable with Modifications

```python
@router.post("/{business_id}/unarchive")
@auth(role="teacher")
async def unarchive_business(business_id: str = Path(...)):
    try:
        business_repo.unarchive(business_id)
        return {"message": "Bedrijf succesvol hersteld"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="...")
```

**Adaptation needed:**
1. Change `POST` to `PATCH`, path from `/unarchive` to `/restore` (spec §5.2).
2. Add request body: `{ "confirm": boolean, "selected": { ... } }`.
3. When `confirm=false`, return restore preview with preselection.
4. When `confirm=true`, execute selective restore.
5. Add Pydantic models.
6. The `@auth(role="teacher")` is already correct.

---

### 9.3 Project and Task Archive/Unarchive Endpoints

**Files:**
- [`projojo_backend/routes/project_router.py`](../projojo_backend/routes/project_router.py:130) (lines 130–167)
- [`projojo_backend/routes/task_router.py`](../projojo_backend/routes/task_router.py:33) (lines 33–62)

**Tier:** 🟡 Reusable with Modifications

Same structural pattern and same adaptation needed as §9.1 and §9.2.

---

### 9.4 Archived Listing Endpoints

**Files:**
- [`projojo_backend/routes/business_router.py`](../projojo_backend/routes/business_router.py:159) (lines 159–165)
- [`projojo_backend/routes/project_router.py`](../projojo_backend/routes/project_router.py:25) (lines 25–31)
- [`projojo_backend/routes/task_router.py`](../projojo_backend/routes/task_router.py:25) (lines 25–31)

**Tier:** 🟡 Reusable with Modifications

```python
@router.get("/archived/basic", response_model=list[Business])
@auth(role="teacher")
async def get_archived_businesses_basic():
    return business_repo.get_archived()
```

**Adaptation needed:**
1. Spec §5.4 changes the path pattern: `/businesses/archived`, `/projects/archived`, `/tasks/archived`.
2. The response must include archive metadata and parent context for blocked-restore explanations.
3. The `@auth(role="teacher")` is already correct.

---

## 10. Frontend API Service Functions

### 10.1 Archive Service Functions

**File:** [`projojo_frontend/src/services.js`](../projojo_frontend/src/services.js:182) (lines 182–186, 261–265, 527–531)

**Tier:** 🟡 Reusable with Modifications

```javascript
export function archiveProject(projectId) {
    return fetchWithError(`${API_BASE_URL}projects/${projectId}/archive`, {
        method: "POST",
    }, true);
}

export function archiveTask(taskId) {
    return fetchWithError(`${API_BASE_URL}tasks/${taskId}/archive`, {
        method: "POST",
    }, true);
}

export function archiveBusiness(businessId) {
    return fetchWithError(`${API_BASE_URL}businesses/${businessId}/archive`, {
        method: "POST",
    }, true);
}
```

**Adaptation needed:**
1. Change `POST` to `PATCH`.
2. Add `body: JSON.stringify({ confirm, archivedReason })` parameter.
3. Split into preview and execute variants, or handle the `confirm` flag.
4. Preview calls should return JSON (remove `returnsVoid = true` for preview).

---

### 10.2 Unarchive Service Functions

**File:** [`projojo_frontend/src/services.js`](../projojo_frontend/src/services.js:192) (lines 192–196, 271–275, 538–541)

**Tier:** 🟡 Reusable with Modifications

```javascript
export function unarchiveProject(projectId) {
    return fetchWithError(`${API_BASE_URL}projects/${projectId}/unarchive`, {
        method: "POST",
    }, true);
}

export function unarchiveTask(taskId) {
    return fetchWithError(`${API_BASE_URL}tasks/${taskId}/unarchive`, {
        method: "POST",
    }, true);
}

export function unarchiveBusiness(businessId) {
    return fetchWithError(`${API_BASE_URL}businesses/${businessId}/unarchive`, {
        method: "POST",
    }, true);
}
```

**Adaptation needed:**
1. Change method to `PATCH`, path from `/unarchive` to `/restore`.
2. Add request body for both preview and execute.
3. Preview calls need to return JSON for the restore preview UI.

---

### 10.3 Archived Listing Service Functions

**File:** [`projojo_frontend/src/services.js`](../projojo_frontend/src/services.js:174) (lines 174–176, 215–217, 253–255)

**Tier:** 🟡 Reusable with Modifications

```javascript
export function getArchivedProjects() {
    return fetchWithError(`${API_BASE_URL}projects/archived`);
}

export function getArchivedBusinessesBasic() {
    return fetchWithError(`${API_BASE_URL}businesses/archived/basic`);
}

export function getArchivedTasks() {
    return fetchWithError(`${API_BASE_URL}tasks/archived`);
}
```

**Adaptation needed:** Update URL paths if they change. These are straightforward GET calls and essentially reusable.

---

### 10.4 fetchWithError Utility

**File:** [`projojo_frontend/src/services.js`](../projojo_frontend/src/services.js:51) (lines 51–154)

**Tier:** 🟢 Directly Reusable

The base HTTP utility with auth header injection, error parsing, and Dutch error messages is fully reusable for all archive/restore API calls.

---

## 11. Frontend UI Components

### 11.1 Business Archive Modal

**File:** [`projojo_frontend/src/components/BusinessCard.jsx`](../projojo_frontend/src/components/BusinessCard.jsx:68) (lines 68–98 for handlers, 231–253 for modal)

**Tier:** 🟡 Reusable with Modifications

```jsx
// Handler
const handleConfirmArchive = () => {
    setIsArchiveLoading(true);
    setArchiveError(null);
    archiveBusiness(businessId)
        .then(() => {
            setIsArchiveModalOpen(false);
            if (onChanged) onChanged();
        })
        .catch(err => setArchiveError(err.message))
        .finally(() => setIsArchiveLoading(false));
}

// Modal
<Modal modalHeader="Bedrijf archiveren" isModalOpen={isArchiveModalOpen} setIsModalOpen={setIsArchiveModalOpen}>
    <div className="p-4">
        {isArchiveLoading ? (
            <div className="flex flex-col items-center gap-4">
                <p className="font-semibold">Aan het archiveren...</p>
                <Loading size="48px" />
            </div>
        ) : (
            <>
                {archiveError && <p className="text-red-600 ...">{archiveError}</p>}
                <p className="mb-4">Weet je zeker dat je "{name}" wilt archiveren? Dit verbergt het bedrijf, alle projecten, taken en supervisor-accounts. Supervisoren kunnen dan niet meer inloggen.</p>
                <div className="flex gap-2">
                    <button className="btn-secondary flex-1" onClick={() => setIsArchiveModalOpen(false)}>Annuleren</button>
                    <button className="btn-primary bg-red-600 hover:bg-red-700 flex-1" onClick={handleConfirmArchive}>Bevestig archiveren</button>
                </div>
            </>
        )}
    </div>
</Modal>
```

**What is good:** The loading state management, error display, cancel/confirm UX pattern, and Dutch copy are solid.

**Adaptation needed (spec §6.2):**
1. Add a **reason input field** — `archivedReason` is required before confirmation.
2. Add a **preview step**: After opening the modal, call the archive preview endpoint first and show the affected entities before the teacher confirms.
3. The warning text should be dynamically generated from the preview response, not hardcoded.
4. This component currently allows supervisors to archive. In the new system, only teachers can — the archive button visibility logic must change.

---

### 11.2 Project Archive Modal

**File:** [`projojo_frontend/src/components/ProjectDetails.jsx`](../projojo_frontend/src/components/ProjectDetails.jsx:23) (lines 23–56 for state/handler, 221–248 for modal)

**Tier:** 🟡 Reusable with Modifications

Same pattern as business archive modal. Same adaptation needed: add reason input, preview step, teacher-only visibility.

**Additional note:** The `isOwner` check on line 18 (`authData.type === "supervisor" && authData.businessId === businessId`) controls archive button visibility. Per spec §3.1, this should become `authData.type === "teacher"`.

---

### 11.3 Task Archive Modal

**File:** [`projojo_frontend/src/components/Task.jsx`](../projojo_frontend/src/components/Task.jsx:27) (lines 27–30 for state, 129–139 for handler, 234–259 for modal)

**Tier:** 🟡 Reusable with Modifications

Same pattern and same adaptations. The `isOwner` check on line 32 includes both supervisors and teachers — needs to become teacher-only for archive.

---

### 11.4 Business Unarchive Button

**File:** [`projojo_frontend/src/components/BusinessCard.jsx`](../projojo_frontend/src/components/BusinessCard.jsx:87) (lines 87–98 for handler, 160–167 for button)

**Tier:** 🔴 Reference Only

```jsx
const handleUnarchive = () => {
    setIsArchiveLoading(true);
    unarchiveBusiness(businessId)
        .then(() => { if (onChanged) onChanged(); })
        .catch(err => setArchiveError(err.message))
        .finally(() => setIsArchiveLoading(false));
}

{(isArchived && authData.type === "teacher") && (
    <button className="btn-primary bg-green-600 hover:bg-green-700 ..." onClick={handleUnarchive} disabled={isArchiveLoading}>
        <p>Herstel bedrijf</p>
    </button>
)}
```

**Why reference only:** The spec requires an entirely different restore UX with a preview modal, descendant selection, and dependency-aware checkboxes (spec §6.3). A simple button click will not suffice. However, the teacher-only visibility check and the green button styling convention for restore actions are worth carrying forward as design patterns.

---

### 11.5 TeacherPage Archived Sections

**File:** [`projojo_frontend/src/pages/TeacherPage.jsx`](../projojo_frontend/src/pages/TeacherPage.jsx:14) (lines 14–218)

**Tier:** 🟡 Reusable with Modifications

**What it does:** Fetches active businesses, archived businesses, archived projects, and archived tasks in parallel on page load. Renders collapsible sections for each with counts. Archived project/task items have inline "Herstel" buttons.

**What is good:**
- The `Promise.allSettled()` pattern for fetching all four lists in parallel is excellent.
- The collapsible section pattern with counts (`Gearchiveerde bedrijven ({archivedBusinesses.length})`) is directly reusable.
- Error handling per section with graceful degradation is solid.

**Adaptation needed:**
1. Each archived item needs to display `archivedAt`, `archivedBy`, and `archivedReason` (spec §6.1).
2. Restore buttons must open a restore preview modal instead of directly calling unarchive (spec §6.3).
3. Items where restore is blocked (parent archived) must show a disabled button with explanation (spec §6.1).
4. **Bug:** Line 11 has a duplicate import (`import { createNewBusiness, getBusinessesBasic } from "../services";`) that will cause build issues.

---

### 11.6 isArchived Prop Chain: BusinessesOverview → BusinessProjectDashboard → BusinessCard

**Files:**
- [`projojo_frontend/src/components/BusinessesOverview.jsx`](../projojo_frontend/src/components/BusinessesOverview.jsx:3) (line 3)
- [`projojo_frontend/src/components/BusinessProjectDashboard.jsx`](../projojo_frontend/src/components/BusinessProjectDashboard.jsx:4) (line 4)
- [`projojo_frontend/src/components/BusinessCard.jsx`](../projojo_frontend/src/components/BusinessCard.jsx:13) (line 13)

**Tier:** 🟢 Directly Reusable

```jsx
// BusinessesOverview passes isArchived through to BusinessCard via BusinessProjectDashboard
<BusinessProjectDashboard isArchived={isArchived} onChanged={onChanged} ... />
```

**What it does:** Propagates archive state as a boolean prop through the component hierarchy to control button visibility.

**Important note:** The spec (§6.5) says the frontend must use `archived_at` presence for archive state — not a derived boolean. However, using a boolean prop to distinguish which *list* a component was rendered from (active vs. archived section) is fine and does not violate this rule. The boolean should not be derived from end_date or an API field named `is_archived`.

---

## 12. Identified Gaps: Code That Needs to Exist But Does Not

These are features required by the specification that have no corresponding code in the current branch. They are net-new work.

| Feature | Spec Section | Notes |
|---------|-------------|-------|
| Archive preview dry-run endpoints | §5.1 | Brand new — no preview logic exists |
| Restore preview with preselection | §5.2, §5.3 | Brand new — restore is currently blind cascade |
| Selective descendant restore | §4.4 | Brand new |
| Parent-archived check blocking child restore | §3.3 | Not implemented — current code silently restores orphaned children |
| `archivedReason` write/read anywhere | §2.1 | Attribute declared but never used |
| Name collision handling on restore | §3.8 | Not implemented |
| Student recently-archived registrations view | §6.4 | No student-facing archive UI exists |
| Multi-business supervisor switcher | §6.7 | Not implemented |
| Edit-locking for archived entities | §3.6 | No mutation blocking based on archive state |
| Pydantic request/response models for archive API | §5.5 | Current endpoints use no request models |
| Seed data with archive scenarios | §8.2 | Current seed has no archived entities |

---

## 13. Architecture Decisions

### ADR-01: Why Unarchive Code is Reference Only

The current unarchive (restore) implementation is categorized as 🔴 Reference Only despite having working TypeQL patterns. The reason: the specification introduces a fundamentally different restore model (preview + selective descendants + dependency checks). Adapting the current blind cascade would require gutting it to the point where starting fresh is cleaner. However, the TypeQL `delete has $attr of $entity` pattern and the traversal paths are the same and should be reused in the new implementation.

### ADR-02: Why the Permission Model Changes Affect Many Components

The current branch allows supervisors to archive their own entities. The spec restricts archive/restore to teachers only. This affects every frontend component that checks `isOwner` for archive button visibility and every backend route that uses `@auth(role="supervisor")` for archive endpoints. This is a deliberately broad change that simplifies the permission model.

### ADR-03: Why Query Patterns Are High-Value Reuse Targets

The TypeQL archive filter patterns (`not { $entity has archivedAt ... }`) are the single most valuable thing to port. They represent tested query logic against a real TypeDB schema, and getting these wrong causes subtle data leakage bugs. These patterns are directly reusable regardless of how the archive API contract changes.

### ADR-04: Why the Frontend Modal Pattern Is Reusable Despite Needing Changes

The three archive modals (business, project, task) all follow the same state machine: idle → loading → success/error. This pattern should be extracted into a shared `ArchiveModal` component that takes the entity type and preview data as props, rather than being duplicated three times with slight variations.

---

## 14. Summary Table

| # | File | Snippet | Tier | Description |
|---|------|---------|------|-------------|
| 1 | `projojo_backend/db/schema.tql:152-155` | Archive attribute declarations | 🟡 Modify | Three attribute types; `archivedReason` needs entity ownership |
| 2 | `projojo_backend/db/schema.tql:10-14,28-63,112-120` | Entity archive ownership | 🟡 Modify | Add `archivedReason` ownership; change supervisor cardinality |
| 3 | `projojo_backend/domain/models/business.py:7-18` | Business Pydantic model | 🟡 Modify | Add `archived_reason` field |
| 4 | `projojo_backend/domain/models/project.py:8-27` | Project Pydantic model | 🟡 Modify | Add `archived_reason`; fix timezone-lossy datetime encoder |
| 5 | `projojo_backend/domain/models/task.py:7-21` | Task Pydantic model | 🟡 Modify | Add `archived_reason` field |
| 6 | `projojo_backend/domain/models/user.py:24-26` | Supervisor model | 🔴 Reference | Single `business_association_id` must become multi-business |
| 7 | `projojo_backend/domain/repositories/business_repository.py:13-35` | Business `get_by_id` archive filter | 🟢 Reuse | Single-level `not { ... has archivedAt ... }` |
| 8 | `projojo_backend/domain/repositories/business_repository.py:37-56` | Business `get_all` archive filter | 🟢 Reuse | Same pattern |
| 9 | `projojo_backend/domain/repositories/business_repository.py:113-177` | Business nested query 3-level filter | 🟡 Modify | Missing registration archive filter in counts |
| 10 | `projojo_backend/domain/repositories/project_repository.py:14-41` | Project `get_by_id` double filter | 🟢 Reuse | Project + parent business filter |
| 11 | `projojo_backend/domain/repositories/project_repository.py:43-67` | Project `get_all` double filter | 🟢 Reuse | Same pattern |
| 12 | `projojo_backend/domain/repositories/project_repository.py:69-101` | Projects by business double filter | 🟢 Reuse | Same pattern |
| 13 | `projojo_backend/domain/repositories/project_repository.py:103-123` | Business by project double filter | 🟢 Reuse | Same pattern |
| 14 | `projojo_backend/domain/repositories/task_repository.py:12-49` | Task `get_by_id` with reg count exclusion | 🟢 Reuse | Archive-aware registration counts |
| 15 | `projojo_backend/domain/repositories/task_repository.py:51-84` | Task `get_all` with reg count exclusion | 🟢 Reuse | Same pattern |
| 16 | `projojo_backend/domain/repositories/task_repository.py:86-127` | Tasks by project with filter | 🟢 Reuse | Project + task + registration filters |
| 17 | `projojo_backend/domain/repositories/business_repository.py:223-242` | Business `get_archived` | 🟡 Modify | Must fetch archive metadata fields |
| 18 | `projojo_backend/domain/repositories/project_repository.py:125-147` | Project `get_archived` | 🟡 Modify | Must fetch metadata + parent context |
| 19 | `projojo_backend/domain/repositories/task_repository.py:129-151` | Task `get_archived` | 🟡 Modify | Must fetch metadata + parent context |
| 20 | `projojo_backend/domain/repositories/business_repository.py:244-315` | Business archive cascade | 🟡 Modify | Add reason, multi-biz supervisor check, preview, atomicity |
| 21 | `projojo_backend/domain/repositories/project_repository.py:274-316` | Project archive cascade | 🟡 Modify | Add reason, preview, atomicity |
| 22 | `projojo_backend/domain/repositories/task_repository.py:381-409` | Task archive cascade | 🟡 Modify | Add reason, preview, atomicity |
| 23 | `projojo_backend/domain/repositories/business_repository.py:317-420` | Business unarchive cascade | 🔴 Reference | Entirely different restore model in spec |
| 24 | `projojo_backend/domain/repositories/project_repository.py:318-376` | Project unarchive cascade | 🔴 Reference | Same — selective restore needed |
| 25 | `projojo_backend/domain/repositories/task_repository.py:411-447` | Task unarchive cascade | 🔴 Reference | Same — selective restore needed |
| 26 | `projojo_backend/service/auth_service.py:32-43` | Supervisor login block | 🟡 Modify | Multi-business check needed |
| 27 | `projojo_backend/domain/repositories/user_repository.py:705-716` | `is_supervisor_archived` query | 🟡 Modify | Rewrite as has-active-business check |
| 28 | `projojo_backend/routes/auth_router.py:95-100` | Auth error redirect pattern | 🟢 Reuse | ValueError → redirect with message |
| 29 | `projojo_backend/auth/permissions.py:17-104` | `auth()` decorator | 🟢 Reuse | Role hierarchy + ownership; archive endpoints just use simpler role |
| 30 | `projojo_backend/routes/business_router.py:167-185` | Business archive endpoint | 🟡 Modify | POST→PATCH, add body, preview mode, teacher-only |
| 31 | `projojo_backend/routes/business_router.py:187-204` | Business unarchive endpoint | 🟡 Modify | POST→PATCH, path rename, selective restore body |
| 32 | `projojo_backend/routes/project_router.py:130-167` | Project archive/unarchive endpoints | 🟡 Modify | Same changes as business |
| 33 | `projojo_backend/routes/task_router.py:33-62` | Task archive/unarchive endpoints | 🟡 Modify | Same changes as business |
| 34 | `projojo_backend/routes/business_router.py:159-165` | Business archived listing | 🟡 Modify | Return archive metadata |
| 35 | `projojo_backend/routes/project_router.py:25-31` | Project archived listing | 🟡 Modify | Return metadata + parent context |
| 36 | `projojo_backend/routes/task_router.py:25-31` | Task archived listing | 🟡 Modify | Return metadata + parent context |
| 37 | `projojo_frontend/src/services.js:182-186,261-265,527-531` | Archive service functions | 🟡 Modify | POST→PATCH, add request body |
| 38 | `projojo_frontend/src/services.js:192-196,271-275,538-541` | Unarchive service functions | 🟡 Modify | POST→PATCH, path rename, add restore body |
| 39 | `projojo_frontend/src/services.js:174-176,215-217,253-255` | Archived listing service functions | 🟡 Modify | Update URL paths if changed |
| 40 | `projojo_frontend/src/services.js:51-154` | `fetchWithError` utility | 🟢 Reuse | HTTP utility with auth and error parsing |
| 41 | `projojo_frontend/src/components/BusinessCard.jsx:68-98,231-253` | Business archive modal | 🟡 Modify | Add reason input and preview step |
| 42 | `projojo_frontend/src/components/ProjectDetails.jsx:23-56,221-248` | Project archive modal | 🟡 Modify | Add reason input and preview step |
| 43 | `projojo_frontend/src/components/Task.jsx:27-30,129-139,234-259` | Task archive modal | 🟡 Modify | Add reason input and preview step |
| 44 | `projojo_frontend/src/components/BusinessCard.jsx:87-98,160-167` | Business unarchive button | 🔴 Reference | Spec requires restore preview modal, not simple button |
| 45 | `projojo_frontend/src/pages/TeacherPage.jsx:14-218` | Teacher page archived sections | 🟡 Modify | Add metadata display, restore preview, blocked-restore UX |
| 46 | `projojo_frontend/src/components/BusinessesOverview.jsx:3` | `isArchived` prop chain | 🟢 Reuse | Passes archive context through component tree |
| 47 | `projojo_frontend/src/components/BusinessProjectDashboard.jsx:4` | `isArchived` prop passthrough | 🟢 Reuse | Same |
| 48 | `projojo_frontend/src/auth/AuthCallback.jsx:16-37` | Auth error handling | 🟢 Reuse | Displays archived-supervisor error; needs discovery page link |
| 49 | `projojo_backend/domain/repositories/user_repository.py:404-423` | `get_student_registrations` | 🔴 Reference | Missing archive filter — known bug RISK-03 |
| 50 | `projojo_backend/domain/repositories/task_repository.py:228-259` | `get_registrations` | 🔴 Reference | Missing archive filter — known bug RISK-04 |
| 51 | `projojo_backend/domain/repositories/user_repository.py:349-402` | `get_students_by_task_status` | 🔴 Reference | Missing archive filter — known bug RISK-05 |
| 52 | `projojo_backend/domain/repositories/project_repository.py:174-185` | `check_project_exists` | 🔴 Reference | Missing archive filter — known bug RISK-02 |
| 53 | `projojo_backend/domain/repositories/task_repository.py:341-354` | Task update accepted count | 🔴 Reference | Missing archive filter — known bug RISK-09 |

**Tier totals:** 🟢 Directly Reusable: 14 | 🟡 Reusable with Modifications: 27 | 🔴 Reference Only: 12