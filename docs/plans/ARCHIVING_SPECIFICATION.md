# Archiving Specification and Implementation Plan

> **Date:** 2026-04-23
> **Status:** Draft — revised after skeptical review
> **Scope:** Unified archiving specification synthesised from `BUSINESS_RULES_ARCHIVING.md` and `ARCHIVING_AUDIT.md`, then validated against the current `next-ui` codebase
> **Starting point:** Current `next-ui` branch codebase
> **Policy changes in this spec:** teacher-only archive and restore, removal of hard-delete, removal of draft business creation, support for multi-business supervisors

---

## Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. Data Model](#2-data-model)
  - [2.1 Archive Attributes](#21-archive-attributes)
  - [2.2 Restore Preselection Metadata](#22-restore-preselection-metadata)
  - [2.3 Archivable Entity Types](#23-archivable-entity-types)
  - [2.4 Schema Changes Required](#24-schema-changes-required)
  - [2.5 Date and Serialization Rules](#25-date-and-serialization-rules)
- [3. Business Rules](#3-business-rules)
  - [3.1 Permission Model](#31-permission-model)
  - [3.2 Archive Operations](#32-archive-operations)
  - [3.3 Restore Operations](#33-restore-operations)
  - [3.4 Error Semantics](#34-error-semantics)
  - [3.5 Visibility and Filtering](#35-visibility-and-filtering)
  - [3.6 Edit-Locking and Mutation Inventory](#36-edit-locking-and-mutation-inventory)
  - [3.7 Idempotency and Frontend Behavior](#37-idempotency-and-frontend-behavior)
  - [3.8 Name Uniqueness](#38-name-uniqueness)
- [4. Cascade Specifications](#4-cascade-specifications)
  - [4.1 Business Archive Cascade](#41-business-archive-cascade)
  - [4.2 Project Archive Cascade](#42-project-archive-cascade)
  - [4.3 Task Archive Cascade](#43-task-archive-cascade)
  - [4.4 Restore Preview and Execution Rules](#44-restore-preview-and-execution-rules)
  - [4.5 Supervisor Archiving in a Multi-Business Model](#45-supervisor-archiving-in-a-multi-business-model)
  - [4.6 Cascade Atomicity](#46-cascade-atomicity)
- [5. API Contract](#5-api-contract)
  - [5.1 Archive Endpoints](#51-archive-endpoints)
  - [5.2 Restore Endpoints](#52-restore-endpoints)
  - [5.3 Preview Response Shapes](#53-preview-response-shapes)
  - [5.4 Archived Listing Endpoints](#54-archived-listing-endpoints)
  - [5.5 API Modeling Notes](#55-api-modeling-notes)
- [6. Frontend Specifications](#6-frontend-specifications)
  - [6.1 Teacher Page Archived Views](#61-teacher-page-archived-views)
  - [6.2 Archive Modal and Preview UX](#62-archive-modal-and-preview-ux)
  - [6.3 Restore Modal and Preview UX](#63-restore-modal-and-preview-ux)
  - [6.4 Student Dashboard Recently Archived](#64-student-dashboard-recently-archived)
  - [6.5 Archive State Detection](#65-archive-state-detection)
  - [6.6 Supervisor Login Block](#66-supervisor-login-block)
  - [6.7 Multi-Business Supervisor Switcher](#67-multi-business-supervisor-switcher)
- [7. Cross-Cutting Concerns](#7-cross-cutting-concerns)
  - [7.1 Registration Count Accuracy](#71-registration-count-accuracy)
  - [7.2 Skill-Match Calculations](#72-skill-match-calculations)
  - [7.3 Public Discovery Page](#73-public-discovery-page)
  - [7.4 Legacy Feature Removal](#74-legacy-feature-removal)
  - [7.5 Notifications Deferred](#75-notifications-deferred)
- [8. Implementation Plan](#8-implementation-plan)
  - [8.1 Migration Strategy](#81-migration-strategy)
  - [8.2 Seed Data Requirements](#82-seed-data-requirements)
  - [8.3 Implementation Phases](#83-implementation-phases)
  - [8.4 Verification Strategy](#84-verification-strategy)
- [9. Decision Log](#9-decision-log)
- [10. Open Questions and Deferred Items](#10-open-questions-and-deferred-items)

---

## 1. Executive Summary

This specification defines the target archiving system for Projojo. It replaces the current partial and inconsistent archive behavior with a stricter, more explicit model.

The target system introduces:

- **Timestamp-based archive state** using `archivedAt`, `archivedBy`, and `archivedReason`
- **Five archivable types**: `business`, `project`, `task`, `supervisor`, and `registersForTask`
- **Teacher-only archive and restore** as an explicit policy change from the current branch
- **Backend archive preview dry-runs** so the UI can show the exact affected entities before execution
- **Always-on restore preview** with selectable descendants before restore executes
- **Downward-only restore semantics** to avoid upward and sideways restore complexity
- **Multi-business supervisors** with conditional supervisor archiving based on whether any active businesses remain
- **Backend edit-locking** for archived entities and children of archived entities
- **No derived boolean archive state** in API or frontend logic

The target system also explicitly removes legacy functionality:

- **Hard-delete is removed from the codebase** for these entities
- **Draft business creation is removed from the codebase and UI**
- **Portfolio snapshotting tied only to hard-delete should be removed if it has no other legitimate use**

Notifications remain specified but deferred until the email service is operational.

---

## 2. Data Model

### 2.1 Archive Attributes

| Attribute | Value Type | Purpose |
|---|---|---|
| `archivedAt` | `datetime-tz` | Archive timestamp. Presence means archived. Absence means active. This is the only archive-state source of truth. |
| `archivedBy` | `string` | Identifier of the teacher who triggered the archive operation. |
| `archivedReason` | `string` | Reason for archiving. Root entities use teacher-entered text. Cascade-archived descendants use auto-generated root-referencing text. |

All three attributes use `@card(0..1)`.

**There is no `isArchived` boolean in the target system.**

### 2.2 Restore Preselection Metadata

Restore preview preselection uses an **exact metadata match** on:

- `archivedAt`
- `archivedBy`
- `archivedReason`

This is a deliberate compromise. It avoids adding a dedicated archive-operation identifier now, but it is not perfect.

**This version does not add `archiveEventId` or any equivalent archive-operation field.**

**Explicit risk:** two separate archive operations could theoretically produce identical metadata and therefore be preselected together incorrectly. This is considered unlikely enough to accept for now, but the risk must be documented and not hidden.

### 2.3 Archivable Entity Types

| TypeDB Type | Kind | Owns archivedAt | Owns archivedBy | Owns archivedReason |
|---|---|---|---|---|
| `business` | entity | `@card(0..1)` | `@card(0..1)` | `@card(0..1)` |
| `project` | entity | `@card(0..1)` | `@card(0..1)` | `@card(0..1)` |
| `task` | entity | `@card(0..1)` | `@card(0..1)` | `@card(0..1)` |
| `supervisor` | entity | `@card(0..1)` | `@card(0..1)` | `@card(0..1)` |
| `registersForTask` | relation | `@card(0..1)` | `@card(0..1)` | `@card(0..1)` |

Not archivable: `student`, `teacher`, `skill`, `theme`, `inviteKey`, `oauthProvider`, `oauthAuthentication`, `creates`, `manages`, `hasProjects`, `containsTask`, `requiresSkill`, `hasSkill`, `businessInvite`, `portfolioItem`.

### 2.4 Schema Changes Required

Starting from the current `next-ui` schema:

1. **Remove** `attribute isArchived value boolean;` and every `owns isArchived` declaration.
2. **Add**:

   ```tql
   attribute archivedAt value datetime-tz;
   attribute archivedBy value string;
   attribute archivedReason value string;
   ```

3. **Add** `owns archivedAt @card(0..1)`, `owns archivedBy @card(0..1)`, and `owns archivedReason @card(0..1)` to:
   - `entity business`
   - `entity project`
   - `entity task`
   - `entity supervisor`
   - `relation registersForTask`
4. **Change supervisor cardinality** so one supervisor can manage multiple businesses:

   ```tql
   entity supervisor sub user,
       plays manages:supervisor @card(1..),
       plays creates:supervisor @card(0..);
   ```

5. Keep `relation manages` structurally the same per relation instance.

### 2.5 Date and Serialization Rules

- The backend is authoritative for archive timestamps.
- `archivedAt` values are stored and compared as timezone-aware instants.
- API datetime fields are serialized as ISO 8601 datetimes with timezone information.
- The frontend must parse these as instants, not as naive local strings.
- The student 30-day recently-archived window is computed from backend time, not browser time.
- Any existing code paths relying on naive datetime comparison must be updated.

---

## 3. Business Rules

### 3.1 Permission Model

**All archive and restore operations are restricted to teachers.** This is a policy change from the current `next-ui` behavior where some project-level archive actions are available to supervisors.

| Operation | Permitted Role | Notes |
|---|---|---|
| Archive any entity | Teacher only | Explicit governance decision |
| Restore any entity | Teacher only | Explicit governance decision |
| View archived lists | Teacher only | Management view |
| View recently archived registrations | Student, own only | Read-only |

Frontend actions must align with backend permissions. The frontend should avoid sending invalid requests wherever it can do so safely.

### 3.2 Archive Operations

Archive always uses a **two-step flow**:

1. **Preview dry-run**: the backend returns what would be archived and who would lose access.
2. **Execution**: the teacher confirms and the backend performs the archive transaction.

#### Archive a Business

- **Trigger:** `PATCH /businesses/{business_id}/archive`
- **Required body fields:** `confirm`, `archivedReason`
- **Preview dry-run:** returns affected projects, tasks, registrations, and supervisors
- **Execute:** archives the business and applies the full business cascade

#### Archive a Project

- **Trigger:** `PATCH /projects/{project_id}/archive`
- **Required body fields:** `confirm`, `archivedReason`
- **Preview dry-run:** returns affected tasks and registrations
- **Execute:** archives the project and applies the project cascade

#### Archive a Task

- **Trigger:** `PATCH /tasks/{task_id}/archive`
- **Required body fields:** `confirm`, `archivedReason`
- **Preview dry-run:** returns affected registrations
- **Execute:** archives the task and applies the task cascade

### 3.3 Restore Operations

Restore always uses an **always-on preview and selection flow**.

#### Core restore rules

1. Restore is **downward-only**.
2. Restore never suggests restoring parents or siblings.
3. If a parent is still archived, child restore is blocked.
4. The root entity being restored is always restored if the request is valid.
5. Archived descendants appear in the restore preview with their archive metadata.
6. Descendants whose metadata exactly matches the root metadata are preselected.
7. Descendants with different metadata are visible but not preselected.
8. The teacher may select additional descendants, but only if doing so does not violate parent-child dependencies.

#### Blocked child restore behavior

- Restoring a `project` is rejected while its parent `business` is archived.
- Restoring a `task` is rejected while its parent `project` is archived.
- The UI must keep these archived children visible, but disable the restore action and explain why.

### 3.4 Error Semantics

| Situation | Status | Notes |
|---|---|---|
| Entity not found | `404` | Applies to preview and execute |
| Archive reason missing or invalid | `422` | Validation error |
| Restore child while parent archived | `409` | Prevents orphaning |
| Restore entity that is already active | `409` | Not a valid restore target |
| Archive execute on already archived entity | `200` | Idempotent no-op allowed |
| Archive preview on already archived entity | `200` | Response may indicate already archived |
| Unexpected transaction failure | `500` | Entire transaction rolls back |

The frontend should not rely on these errors for normal operation. It should avoid sending obviously invalid requests by disabling or hiding actions where appropriate.

### 3.5 Visibility and Filtering

All active-use queries must filter archived data at the TypeQL level.

| Query Context | Required Filters |
|---|---|
| Business queries | `not { $business has archivedAt $bArchived; }` |
| Project queries | `not { $project has archivedAt $pArchived; }` and `not { $business has archivedAt $bArchived; }` |
| Task queries | `not { $task has archivedAt $tArchived; }` and parent filters |
| Registration queries | `not { $registration has archivedAt $rArchived; }` |
| Nested queries | Business, project, and task filters |
| Public discovery | Project, business, and task filters |

Student recently-archived query:

```tql
$r isa registersForTask (task: $t, student: $s);
$s has id $studentId; $studentId = <current_user_id>;
$r has archivedAt $rArchived;
$rArchived > <30_days_ago>;
```

### 3.6 Edit-Locking and Mutation Inventory

Archived entities are read-only. Children of archived entities are also read-only where the mutation depends on an active parent chain.

| Mutation Surface | Block Condition |
|---|---|
| Update business details | Business archived |
| Create project under business | Business archived |
| Update project details | Project archived or parent business archived |
| Set project visibility | Project archived or parent business archived |
| Set project impact summary | Project archived or parent business archived |
| Create task under project | Project archived or parent business archived |
| Update task details | Task archived or archived ancestor |
| Update task skills | Task archived or archived ancestor |
| Create registration | Task archived or archived ancestor |
| Cancel registration | Registration archived or archived ancestor |
| Accept or reject registration | Registration archived or archived ancestor |

This list is not allowed to stay conceptual. The implementation must audit actual route handlers and repositories against this matrix.

### 3.7 Idempotency and Frontend Behavior

Archive execute queries include a TypeQL guard so already archived entities are skipped without corrupting archive metadata.

Implications:

- Archive execution is idempotent.
- The UI should not show archive actions on entities already known to be archived.
- Even though archive execution is idempotent, the frontend should still avoid duplicate submissions and show loading states.

### 3.8 Name Uniqueness

- Archived entities keep their names.
- Archived entities are excluded from active uniqueness checks.
- Restore checks for active name collisions.
- If needed, restore appends the lowest available sequence number.

---

## 4. Cascade Specifications

### 4.1 Business Archive Cascade

**Trigger:** teacher archives a business.

| Step | Target | Traversal | `archivedReason` |
|---|---|---|---|
| 1 | `business` | direct by business id | teacher-entered reason |
| 2 | `project` | `($b, $p) isa hasProjects` | root-referencing auto-text |
| 3 | `task` | `($b, $p) isa hasProjects; ($p, $t) isa containsTask` | root-referencing auto-text |
| 4 | `registersForTask` | project → task → registration | root-referencing auto-text |
| 5 | `supervisor` | supervisors managing this business, but only if they have no other active businesses | root-referencing auto-text |

All entities in the same archive cascade receive the same `archivedAt` and `archivedBy`.

### 4.2 Project Archive Cascade

**Trigger:** teacher archives a project.

| Step | Target | Traversal | `archivedReason` |
|---|---|---|---|
| 1 | `project` | direct by project id | teacher-entered reason |
| 2 | `task` | `($p, $t) isa containsTask` | root-referencing auto-text |
| 3 | `registersForTask` | project → task → registration | root-referencing auto-text |

### 4.3 Task Archive Cascade

**Trigger:** teacher archives a task.

| Step | Target | Traversal | `archivedReason` |
|---|---|---|---|
| 1 | `task` | direct by task id | teacher-entered reason |
| 2 | `registersForTask` | task → registration | root-referencing auto-text |

### 4.4 Restore Preview and Execution Rules

Restore preview is always required before restore execution.

#### Business restore

- Root business must be archived.
- Preview returns archived descendant projects, tasks, registrations, and supervisors.
- Exact metadata matches are preselected.
- Differently archived descendants are visible but unselected.
- Teacher may restore only a subset of descendants, provided parent-child dependencies remain valid.

#### Project restore

- Parent business must already be active.
- Preview returns archived child tasks and registrations.
- Exact metadata matches are preselected.
- Project restore does not offer parent-business restore.

#### Task restore

- Parent project must already be active.
- Preview returns archived child registrations.
- Exact metadata matches are preselected.
- Task restore does not offer parent-project or business restore.

#### Dependency rules inside restore preview

- A child cannot be selected if its archived parent remains archived and unselected.
- If parent selection changes, child availability must update accordingly.
- The preview contract must expose enough information for the frontend to disable invalid selections and explain why.

### 4.5 Supervisor Archiving in a Multi-Business Model

Because supervisors may manage multiple businesses in the target system:

- Archiving one business does **not** automatically archive a supervisor who still has at least one other active business.
- Such supervisors remain able to log in.
- The archive preview must clearly show whether each affected supervisor would actually lose access.

### 4.6 Cascade Atomicity

All archive and restore execution steps run inside a single TypeDB write transaction.

- Any failure rolls back the entire execution.
- Preview calls are read-only and non-mutating.
- Preview logic and execute logic must use the same selection criteria so preview does not drift from execution.

---

## 5. API Contract

### 5.1 Archive Endpoints

| Method | Path | Auth | Body |
|---|---|---|---|
| `PATCH` | `/businesses/{id}/archive` | Teacher | `{ "confirm": boolean, "archivedReason": string }` |
| `PATCH` | `/projects/{id}/archive` | Teacher | `{ "confirm": boolean, "archivedReason": string }` |
| `PATCH` | `/tasks/{id}/archive` | Teacher | `{ "confirm": boolean, "archivedReason": string }` |

Rules:

- `confirm=false` means preview dry-run only.
- `confirm=true` means execute archive.
- `archivedReason` is required in both preview and execute so preview and execute are evaluated with the same intended action.

### 5.2 Restore Endpoints

| Method | Path | Auth | Body |
|---|---|---|---|
| `PATCH` | `/businesses/{id}/restore` | Teacher | `{ "confirm": boolean, "selected": { ... } }` |
| `PATCH` | `/projects/{id}/restore` | Teacher | `{ "confirm": boolean, "selected": { ... } }` |
| `PATCH` | `/tasks/{id}/restore` | Teacher | `{ "confirm": boolean, "selected": { ... } }` |

Rules:

- `confirm=false` means restore preview.
- `confirm=true` means execute restore.
- `selected` is ignored during preview and required during execute when descendants are available.
- The root entity being restored is implicit and not user-deselectable.

### 5.3 Preview Response Shapes

#### Archive preview response

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
      {
        "id": "...",
        "name": "...",
        "will_be_archived": true
      }
    ]
  }
}
```

#### Restore preview response

```json
{
  "preview": true,
  "operation": "restore",
  "entity_type": "business",
  "entity_id": "...",
  "root": {
    "id": "...",
    "name": "...",
    "archived_at": "...",
    "archived_by": "...",
    "archived_reason": "..."
  },
  "candidates": {
    "projects": [
      {
        "id": "...",
        "name": "...",
        "archived_at": "...",
        "archived_by": "...",
        "archived_reason": "...",
        "preselected": true,
        "blocked": false,
        "blocked_reason": null
      }
    ]
  }
}
```

### 5.4 Archived Listing Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| `GET` | `/businesses/archived` | Teacher | Returns archive metadata |
| `GET` | `/projects/archived` | Teacher | Includes parent business info needed for disabled restore explanations |
| `GET` | `/tasks/archived` | Teacher | Includes parent project and business info needed for disabled restore explanations |

### 5.5 API Modeling Notes

- These endpoints must be defined with explicit FastAPI request and response models.
- Archive preview, archive execute, restore preview, restore execute, and archived list items must all have Pydantic models.
- The API must **not** expose a derived `is_archived` boolean as a primary field. Consumers must use `archived_at` presence.

---

## 6. Frontend Specifications

### 6.1 Teacher Page Archived Views

The teacher page shows archived businesses, projects, and tasks in separate archived sections.

Each archived item shows:

- entity name and basic context
- `archivedAt`
- `archivedReason`
- restore action

If restore is blocked because a parent is still archived:

- the child remains visible
- the restore action is disabled, not hidden
- the UI explains why, for example with tooltip or inline helper text

### 6.2 Archive Modal and Preview UX

Archive modal flow:

1. Teacher opens archive action.
2. Frontend requests backend preview.
3. Preview shows the affected entities.
4. Teacher supplies or confirms the archive reason.
5. Teacher confirms execution.

The preview exists to show **real backend-calculated impact**, not a generic warning guess.

### 6.3 Restore Modal and Preview UX

Restore modal flow:

1. Teacher opens restore action.
2. Frontend requests backend restore preview.
3. Preview shows archived descendants and their metadata.
4. Matching descendants are preselected.
5. Teacher can adjust allowed selections.
6. Frontend prevents invalid descendant selection combinations.
7. Teacher confirms execution.

### 6.4 Student Dashboard Recently Archived

Student dashboard gets a read-only `Recent gearchiveerd` section showing registrations archived within the last 30 days.

Each item displays:

- task name
- project name
- `archivedAt`
- `archivedReason`

### 6.5 Archive State Detection

The frontend must use `archived_at` presence for archive state.

- `end_date` remains a timeline field only.
- `end_date` must not drive archive visibility.
- Do not derive or persist a frontend-only `isArchived` source of truth.
- A boolean convenience field is explicitly banned from being treated as the primary archive contract.

### 6.6 Supervisor Login Block

If a supervisor authenticates and has no remaining active businesses:

1. show Dutch error text
2. do not create a session
3. offer guest continuation to the public discovery page

If the supervisor still has at least one active business, login remains allowed.

### 6.7 Multi-Business Supervisor Switcher

Supervisors need a visible business switcher in the UI.

Minimum requirement:

- show all active businesses the supervisor can currently access
- present them as nav items, tabs, or a comparable always-visible switcher
- highlight the current business context
- switching business updates the dashboard context without requiring a new login
- if one business becomes archived while others remain active, the supervisor keeps access to the remaining business contexts

Detailed interaction design belongs to follow-up user stories, but the existence of a visible switcher is part of this spec.

---

## 7. Cross-Cutting Concerns

### 7.1 Registration Count Accuracy

All count queries must exclude archived registrations.

Known high-risk areas include:

- task aggregate counts
- duplicate registration checks
- supervisor registration review lists
- student dashboard registration lists
- email recipient queries

### 7.2 Skill-Match Calculations

Archived tasks and archived projects are excluded from skill-match calculations.

### 7.3 Public Discovery Page

Public discovery must filter archived businesses, projects, and tasks at the backend.

### 7.4 Legacy Feature Removal

The implementation must remove legacy archive-adjacent functionality that conflicts with this spec:

- remove project hard-delete endpoints and UI
- remove draft business creation endpoint behavior and UI
- remove any teacher-page wording that still describes draft/publication behavior for businesses
- remove portfolio snapshotting if it only exists to support hard-delete

### 7.5 Notifications Deferred

Notifications remain specified but deferred.

Until they are implemented:

- do not claim students will be notified automatically
- keep UI copy honest

---

## 8. Implementation Plan

### 8.1 Migration Strategy

This plan assumes a clean database reset for the target environment.

Steps:

1. update schema
2. update models and mappers
3. update seed data
4. rebuild the stack
5. verify app startup against the new schema

### 8.2 Seed Data Requirements

Seed data must include:

- an archived business with archived descendants
- an active business with mixed archived and active descendants
- a multi-business supervisor with one archived and one active business
- a fully archived supervisor with no remaining active businesses
- a student with active and recently archived registrations
- restore-preview cases where descendant metadata matches and where it differs
- name collision restore cases

### 8.3 Implementation Phases

#### Phase A — Schema, Models, and Legacy Removal Foundations

- remove `isArchived`
- add archive attributes
- change supervisor multi-business cardinality
- remove draft-business creation path from backend and frontend
- remove hard-delete path from backend and frontend
- remove portfolio snapshotting if it is only tied to the deleted hard-delete flow
- update Pydantic models and repository mappers
- add datetime serialization and timezone-safe handling

#### Phase B — Query Hardening and Mutation Lock Audit

- move all archive filtering into TypeQL queries
- fix registration count queries
- fix public discovery filtering
- fix skill-match filtering
- audit all mutation surfaces against the lock matrix
- remove Python-side archive post-filtering

#### Phase C — Backend Archive Preview and Execute

- add FastAPI request and response models for archive preview and execution
- implement preview dry-runs for business, project, and task archive
- implement atomic archive execution for business, project, and task
- implement conditional supervisor archiving for multi-business supervisors
- implement archived listing endpoints with parent-context fields

#### Phase D — Backend Restore Preview and Execute

- add FastAPI request and response models for restore preview and execution
- implement downward-only restore preview
- implement descendant preselection based on exact archive metadata match
- implement dependency-aware restore execution
- block project restore while business is archived
- block task restore while project is archived
- implement name collision handling on restore
- document and retain the metadata-collision edge-case risk explicitly

#### Phase E — Frontend Archive and Restore UX

- wire frontend to archive preview and archive execute
- wire frontend to restore preview and restore execute
- show disabled restore actions with explanation for blocked child restore
- update teacher archived views for businesses, projects, and tasks
- remove archive heuristics based on end dates
- update supervisor auth flow for login blocking
- add multi-business supervisor switcher

#### Phase F — Verification and Cleanup

- remove stale legacy copy in UI
- verify hard-delete and draft-business paths are gone
- verify no boolean archive contract remains in API or frontend logic
- run the required Qavajs coverage before implementation is considered complete

### 8.4 Verification Strategy

This change is too cross-cutting to ship without automated verification.

**Primary testing strategy:** Qavajs-first end-to-end coverage.

Most archiving verification should be implemented as Qavajs E2E tests using:

- Playwright-based steps for UI flows
- API-oriented steps for backend contract checks and setup or teardown
- memory steps to persist IDs and selected entities across scenarios
- Gmail-oriented steps later when notification delivery is implemented

Required automated coverage includes:

- archive preview for business, project, and task
- archive execute for business, project, and task
- restore preview with matching and non-matching descendant metadata
- blocked child restore when parent is still archived
- disabled restore actions with explanation in teacher UI
- recently archived student dashboard visibility window
- multi-business supervisor archive outcomes
- supervisor login retained when another active business exists
- supervisor login blocked when all businesses are archived
- public discovery and count-query filtering correctness

Because notifications are deferred, Gmail-based tests are also deferred until the email path becomes real.

Where available, the Qavajs setup should use [`@qavajs/steps-playwright`](docs/ARCHIVING_SPECIFICATION.md:719), [`@qavajs/steps-memory`](docs/ARCHIVING_SPECIFICATION.md:719), and later [`@qavajs/steps-gmail`](docs/ARCHIVING_SPECIFICATION.md:719) as the primary shared step libraries for this test suite.

---

## 9. Decision Log

| ID | Topic | Decision |
|---|---|---|
| F-1 | Archive state representation | `archivedAt` + `archivedBy` + `archivedReason`. No boolean source of truth. |
| F-2 | Restore preselection | Use exact match on `archivedAt` + `archivedBy` + `archivedReason`. |
| F-3 | Restore operation identifier | Do not add `archiveEventId` in this version. |
| F-4 | Restore risk posture | Accept the metadata-collision edge-case risk and document it explicitly. |
| F-5 | Supervisor associations | Supervisors may manage multiple businesses. |
| R-1 | Archive permissions | Teacher-only policy. |
| R-2 | Restore permissions | Teacher-only policy. |
| R-3 | Archive preview | Always use backend dry-run preview before archive execution. |
| R-4 | Restore preview | Always use backend restore preview before restore execution. |
| R-5 | Restore direction | Restore is downward-only. No parent or sibling suggestions. |
| R-6 | Child restore blocking | Backend blocks restoring children of archived parents. UI disables restore and explains why. |
| R-7 | Hard-delete | Remove from codebase for these entities. |
| R-8 | Draft businesses | Remove from codebase and UI. |
| R-9 | Frontend archive detection | Use `archived_at` only. `end_date` is not archive state. |
| I-1 | Legacy cleanup | Remove hard-delete-adjacent and draft-business-adjacent flows. |
| I-2 | Verification | Qavajs-first E2E strategy is required. |

---

## 10. Open Questions and Deferred Items

| Item | Status | Notes |
|---|---|---|
| Student notifications on archive | Deferred | Implement after email service is real |
| Detailed UX layout for the multi-business supervisor switcher | Deferred to user-story stage | Spec requires a visible switcher, not final layout details |
| Detailed teacher-page visual structure for archived sections | Deferred to user-story stage | Functional requirements are specified here |
| Audit log beyond current archive metadata | Not included | Could be revisited later if stronger historical traceability is needed |
| Dutch copy review for auto-generated archive reasons and helper text | Needs follow-up | Functional behavior is specified, copy can still be refined |
