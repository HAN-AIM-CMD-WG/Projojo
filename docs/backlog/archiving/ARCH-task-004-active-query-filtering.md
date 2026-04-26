# ARCH-task-004 — Active Query Archive Filtering and Count Accuracy

**User Story**: [ARCH-story-001 — Archiving Foundations](ARCH-story-001-archiving-foundations.md)  
**Priority**: 🔴 Critical  
**Type**: Technical Task  
**Spec references**: [§3.5](../../ARCHIVING_SPECIFICATION.md), [§7.1](../../ARCHIVING_SPECIFICATION.md), [§7.2](../../ARCHIVING_SPECIFICATION.md), [§7.3](../../ARCHIVING_SPECIFICATION.md)  
**Dependencies**: [ARCH-task-001](ARCH-task-001-schema-migration.md), [ARCH-task-002](ARCH-task-002-domain-models-datetime.md)

---

## Task Story

As a **developer**,  
I want all active-use queries to filter archived entities at the TypeQL level, and all count queries to exclude archived registrations,  
so that archived data never leaks into active views, counts, or calculations.

---

## Context: What Must Change and Why

The current codebase has a mixed approach to archive filtering:

1. **Some queries filter in TypeQL** — e.g., project queries use `not { $project has isArchived true; }` ([`project_repository.py:87`](../../../projojo_backend/domain/repositories/project_repository.py:87))
2. **Some queries filter in Python** — e.g., business `get_all` uses `businesses = [b for b in businesses if not b.is_archived]` ([`business_repository.py:72`](../../../projojo_backend/domain/repositories/business_repository.py:72))
3. **Many queries have no archive filtering at all** — e.g., registration queries, student dashboard queries, skill-match calculations

The specification (§3.5) requires **all** filtering to happen in TypeQL, not in Python post-processing. Python-side filtering is unreliable because:
- It still fetches archived data over the wire
- It's easy to forget when adding new queries
- It doesn't protect against subquery leakage (e.g., counting archived registrations inside an active task)

### Known bugs from ARCHIVING_REUSABLE_CODE.md

| Bug ID | Location | Issue |
|--------|----------|-------|
| RISK-03 | [`user_repository.py:404`](../../../projojo_backend/domain/repositories/user_repository.py:404) | `get_student_registrations` — no archive filter |
| RISK-04 | [`task_repository.py:228`](../../../projojo_backend/domain/repositories/task_repository.py:228) | `get_registrations` — no archive filter |
| RISK-05 | [`user_repository.py:349`](../../../projojo_backend/domain/repositories/user_repository.py:349) | `get_students_by_task_status` — no archive filter |
| RISK-09 | [`task_repository.py:341`](../../../projojo_backend/domain/repositories/task_repository.py:341) | Task update accepted count — no archive filter |
| RISK-02 | [`project_repository.py:174`](../../../projojo_backend/domain/repositories/project_repository.py:174) | `check_project_exists` — no archive filter |

---

## Acceptance Criteria

### AC-1: Business queries filter archived businesses in TypeQL

**Given** an archived business exists in the database  
**When** any active business query executes (`get_all`, `get_by_id`, `get_all_with_full_nesting`)  
**Then** the query includes `not { $business has archivedAt $bArchived; }` in TypeQL  
**And** the archived business is not returned  
**And** no Python-side filtering of businesses by archive state remains

### AC-2: Project queries filter at both project and parent business level

**Given** an archived project and a project whose parent business is archived both exist  
**When** any active project query executes  
**Then** the query includes both `not { $project has archivedAt $pArchived; }` and `not { $business has archivedAt $bArchived; }` in TypeQL  
**And** neither project appears in results

### AC-3: Task queries filter at task, project, and business levels

**Given** archived tasks exist at various levels of the hierarchy  
**When** any active task query executes  
**Then** the query filters archived tasks, archived parent projects, and archived grandparent businesses in TypeQL  
**And** no tasks under archived ancestors appear in results

### AC-4: Registration count queries exclude archived registrations

**Given** a task has both active and archived registrations  
**When** the `total_registered` and `total_accepted` counts are calculated  
**Then** archived registrations are excluded from both counts  
**And** the count queries include `not { $registration has archivedAt $regArchived; }` in TypeQL

**This fixes known bug RISK-09 from the business nested query** ([`ARCHIVING_REUSABLE_CODE.md` §3.2](../../ARCHIVING_REUSABLE_CODE.md)) where the business overview nested query is missing registration archive filters in count subqueries.

### AC-5: Student registration queries exclude archived registrations

**Given** a student has both active and archived registrations  
**When** the student dashboard registration list is fetched  
**Then** archived registrations are not shown in the active registration list  
**And** the query includes `not { $registration has archivedAt $rArchived; }` in TypeQL

**This fixes known bugs RISK-03 and RISK-05.**

### AC-6: Supervisor registration review excludes archived registrations

**Given** a supervisor reviews pending registrations for their tasks  
**When** the registration list is fetched  
**Then** archived registrations are excluded  
**And** the registration query includes the archive filter

**This fixes known bug RISK-04.**

### AC-7: Duplicate registration checks exclude archived registrations

**Given** a student has an archived registration for a task  
**When** the student tries to register for the same task  
**Then** the duplicate-check query excludes archived registrations  
**And** the student is allowed to re-register

### AC-8: Skill-match calculations exclude archived entities

**Given** archived tasks and archived projects exist with skill requirements  
**When** skill-match calculations run for student recommendations  
**Then** archived tasks and projects are excluded from the match calculations  
**And** the queries filter `archivedAt` at task and project levels

### AC-9: Public discovery page filters all archived entities

**Given** archived businesses, projects, and tasks exist  
**When** the public discovery page loads  
**Then** the backend queries exclude archived businesses, projects, and tasks  
**And** no archived entity appears on the public page

### AC-10: `check_project_exists` excludes archived projects

**Given** an archived project exists  
**When** the project existence check runs (e.g., before creating a task under it)  
**Then** the check uses `not { $project has archivedAt $pArchived; }` and treats the archived project as non-existent for active operations

**This fixes known bug RISK-02.**

---

## Technical Notes

### Reusable code from Archive_Feature branch

The following patterns from [`ARCHIVING_REUSABLE_CODE.md`](../../ARCHIVING_REUSABLE_CODE.md) are 🟢 Directly Reusable:

**Single-level business filter** (§3.1):
```tql
not { $business has archivedAt $archivedAt; };
```

**Double-level project filter** (§3.3):
```tql
not { $project has archivedAt $archivedAt; };
not { $business has archivedAt $bArchived; };
```

**Task registration count with archive exclusion** (§3.4 — gold standard):
```tql
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

The nested business query (§3.2, 🟡 tier) is reusable but **must have the registration archive filter added** to its count subqueries.

### Audit approach

The developer should:
1. List every TypeQL query in every repository file
2. Check each query against the filtering matrix in spec §3.5
3. Add missing `not { ... has archivedAt ... }` filters
4. Remove any Python-side `if not is_archived` filtering
5. Test each query with seed data containing archived entities

### Risks

- **Risk**: This is a wide-impact change touching many repository files. Each query must be individually reviewed.
- **Risk**: Adding filters to deeply nested queries (3+ levels) can affect TypeDB performance. Monitor query execution times.
- **Risk**: Some queries may not have an obvious join path to the parent entity needed for the filter. The developer may need to add explicit traversals.

### Files likely affected

- [`projojo_backend/domain/repositories/business_repository.py`](../../../projojo_backend/domain/repositories/business_repository.py) — all active queries
- [`projojo_backend/domain/repositories/project_repository.py`](../../../projojo_backend/domain/repositories/project_repository.py) — all active queries
- [`projojo_backend/domain/repositories/task_repository.py`](../../../projojo_backend/domain/repositories/task_repository.py) — all active queries + count subqueries
- [`projojo_backend/domain/repositories/user_repository.py`](../../../projojo_backend/domain/repositories/user_repository.py) — student and supervisor queries
- [`projojo_backend/domain/repositories/portfolio_repository.py`](../../../projojo_backend/domain/repositories/portfolio_repository.py) — live portfolio items
- Any repository serving the public discovery page
- Any repository performing skill-match calculations
