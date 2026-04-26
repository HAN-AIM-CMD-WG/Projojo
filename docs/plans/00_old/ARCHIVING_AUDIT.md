# Archiving Functionality — Product, Architecture & Implementation Audit

**Date**: 23 March 2026  
**Branch**: `next-ui` at commit [`44bb8ae`](https://github.com/HAN-AIM-CMD-WG/Projojo/commit/44bb8ae72682c56dcb78ef3d585c5da02ee0f6af)  
**Scope**: Every archiving-related codepath across schema, backend, frontend, and cross-cutting concerns  
**Method**: Systematic source-code tracing of all files touching archive state, supplemented by [`NEXT-UI-BRANCH-ANALYSIS.md`](NEXT-UI-BRANCH-ANALYSIS.md) and [`BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md`](BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md)

---

## Table of Contents

- [Archiving Functionality — Product, Architecture \& Implementation Audit](#archiving-functionality--product-architecture--implementation-audit)
	- [Table of Contents](#table-of-contents)
	- [1. Archivable Entity Inventory](#1-archivable-entity-inventory)
		- [1.1 Business](#11-business)
		- [1.2 Project](#12-project)
		- [1.3 Non-archivable Entities](#13-non-archivable-entities)
	- [2. Cascade \& Visibility Analysis](#2-cascade--visibility-analysis)
		- [2.1 Business Archiving — Impact on Related Entities](#21-business-archiving--impact-on-related-entities)
		- [2.2 Project Archiving — Impact on Related Entities](#22-project-archiving--impact-on-related-entities)
		- [2.3 Project Hard-Delete — Cascade Behaviour](#23-project-hard-delete--cascade-behaviour)
		- [2.4 Visibility Matrix by User Role](#24-visibility-matrix-by-user-role)
			- [Business Archive Visibility](#business-archive-visibility)
			- [Project Archive Visibility](#project-archive-visibility)
		- [2.5 Ghost Data \& Broken References](#25-ghost-data--broken-references)
	- [3. Cross-Cutting Concerns](#3-cross-cutting-concerns)
		- [3.1 Search \& Filtering](#31-search--filtering)
		- [3.2 Pagination \& Counts](#32-pagination--counts)
		- [3.3 Unique Constraints \& Slug Collisions](#33-unique-constraints--slug-collisions)
		- [3.4 Notifications \& Emails](#34-notifications--emails)
		- [3.5 Reporting \& Analytics](#35-reporting--analytics)
		- [3.6 Caching \& Revalidation](#36-caching--revalidation)
		- [3.7 Audit Logging](#37-audit-logging)
		- [3.8 Scheduled Jobs \& Background Processes](#38-scheduled-jobs--background-processes)
		- [3.9 Race Conditions](#39-race-conditions)
		- [3.10 Database Indexes \& Performance](#310-database-indexes--performance)
	- [4. Product Design Completeness](#4-product-design-completeness)
		- [4.1 Active Workflow References](#41-active-workflow-references)
		- [4.2 Last-Entity-of-Type Problem](#42-last-entity-of-type-problem)
		- [4.3 Bulk Archiving](#43-bulk-archiving)
		- [4.4 UI Affordances Assessment](#44-ui-affordances-assessment)
	- [5. Implementation Robustness](#5-implementation-robustness)
		- [5.1 Archive-Filtering Consistency](#51-archive-filtering-consistency)
		- [5.2 Single Source of Truth](#52-single-source-of-truth)
		- [5.3 Codepaths That Forget to Filter](#53-codepaths-that-forget-to-filter)
		- [5.4 TypeScript / Type Awareness](#54-typescript--type-awareness)
		- [5.5 Test Coverage](#55-test-coverage)
	- [6. Severity-Ranked Issue Registry](#6-severity-ranked-issue-registry)
		- [Critical Issues](#critical-issues)
		- [High Issues](#high-issues)
		- [Medium Issues](#medium-issues)
		- [Low Issues](#low-issues)
	- [7. Overall Assessment](#7-overall-assessment)
		- [Design Maturity](#design-maturity)
		- [Implementation Quality](#implementation-quality)
		- [Production Readiness](#production-readiness)
		- [Estimated Effort to Remediate](#estimated-effort-to-remediate)

---

## 1. Archivable Entity Inventory

### 1.1 Business

| Aspect | Detail |
|---|---|
| **Schema declaration** | [`schema.tql:37`](projojo_backend/db/schema.tql:37) — `owns isArchived @card(0..1)` on `entity business` |
| **Mechanism** | Soft-delete boolean flag. Presence of `isArchived true` = archived. Absence of the attribute = not archived. |
| **Backend model** | [`business.py:16`](projojo_backend/domain/models/business.py:16) — `is_archived: bool = False` on `Business` Pydantic model |
| **Archive method** | [`business_repository.py:345–366`](projojo_backend/domain/repositories/business_repository.py:345) — delete existing `isArchived` attribute → insert `isArchived true` |
| **Restore method** | [`business_repository.py:368–382`](projojo_backend/domain/repositories/business_repository.py:368) — delete `isArchived` attribute; absence = not archived |
| **API routes** | `PATCH /businesses/{id}/archive` and `PATCH /businesses/{id}/restore` at [`business_router.py:154`](projojo_backend/routes/business_router.py:154) and [`business_router.py:181`](projojo_backend/routes/business_router.py:181) |
| **Who can archive** | **Teacher only** — role check at [`business_router.py:163`](projojo_backend/routes/business_router.py:163) |
| **Who can restore** | **Teacher only** — role check at [`business_router.py:189`](projojo_backend/routes/business_router.py:189) |
| **Reversible?** | **Yes** — restore removes the archive flag |
| **Draft creation** | Businesses can be created as archived (draft) via `as_draft=True` at [`business_repository.py:271–298`](projojo_backend/domain/repositories/business_repository.py:271), exposed at [`business_router.py:89`](projojo_backend/routes/business_router.py:89) |

### 1.2 Project

| Aspect | Detail |
|---|---|
| **Schema declaration** | [`schema.tql:49`](projojo_backend/db/schema.tql:49) — `owns isArchived @card(0..1)` on `entity project` |
| **Mechanism** | Same soft-delete boolean flag pattern as business |
| **Backend model** | [`project.py:8–28`](projojo_backend/domain/models/project.py:8) — ⚠️ **`is_archived` field is MISSING from the `Project` Pydantic model** |
| **Archive method** | [`project_repository.py:644–665`](projojo_backend/domain/repositories/project_repository.py:644) — delete existing `isArchived` → insert `isArchived true` |
| **Restore method** | [`project_repository.py:667–675`](projojo_backend/domain/repositories/project_repository.py:667) — delete `isArchived` attribute |
| **Is-archived check** | [`project_repository.py:768–778`](projojo_backend/domain/repositories/project_repository.py:768) — dedicated `is_archived()` query method |
| **API routes** | `PATCH /projects/{id}/archive` at [`project_router.py:228`](projojo_backend/routes/project_router.py:228), `PATCH /projects/{id}/restore` at [`project_router.py:346`](projojo_backend/routes/project_router.py:346) |
| **Who can archive** | **Supervisor** (own projects, ownership verified) or **Teacher** (any project) — [`project_router.py:246–253`](projojo_backend/routes/project_router.py:246) |
| **Who can restore** | Same as archive — [`project_router.py:360–367`](projojo_backend/routes/project_router.py:360) |
| **Reversible?** | **Yes** — restore endpoint removes the flag |
| **Confirm flow** | Two-step: first call with `confirm=false` returns affected students; second call with `confirm=true` executes the archive — [`project_router.py:262–267`](projojo_backend/routes/project_router.py:262) |
| **Hard delete** | `DELETE /projects/{id}` — teacher only. Creates portfolio snapshots before deletion — [`project_router.py:379–456`](projojo_backend/routes/project_router.py:379) |

### 1.3 Non-archivable Entities

The following entities do **not** have archive capabilities:

| Entity | Notes |
|---|---|
| `task` | No `isArchived` in schema. Tasks are deleted as part of project hard-delete cascade. |
| `student` / `supervisor` / `teacher` | No archive mechanism. Users cannot be archived. |
| `skill` | No archive, but has `isPending` approval state. |
| `theme` | No archive mechanism. |
| `registersForTask` (registration) | No archive. Can be cancelled by student or rejected by supervisor, but not soft-deleted. |
| `portfolioItem` | No archive. Can be hard-deleted (GDPR). |
| `inviteKey` | Has `isUsed` flag, but no archive. |

---

## 2. Cascade & Visibility Analysis

### 2.1 Business Archiving — Impact on Related Entities

| Related Entity | Relationship | What Happens on Business Archive | Issue? |
|---|---|---|---|
| **Projects** (via `hasProjects`) | Parent→child | **Nothing.** Projects remain fully active and visible. | ⚠️ **Ghost data**: archived business's projects are still discoverable via `GET /projects/`, `GET /projects/public`, and individual project pages |
| **Supervisors** (via `manages`) | Sibling | **Nothing.** Supervisor retains relationship, can still manage projects. | ⚠️ Supervisor can create new projects under an archived business |
| **Invite keys** (via `businessInvite`) | Child | **Nothing.** Existing invite keys remain active. | Minor — invite keys already lack consumption enforcement |

**Archive check before action?** No — [`business_router.py:154–178`](projojo_backend/routes/business_router.py:154) only checks if business exists, not whether it's already archived. Archiving an already-archived business silently re-writes the flag.

### 2.2 Project Archiving — Impact on Related Entities

| Related Entity | Relationship | What Happens on Project Archive | Issue? |
|---|---|---|---|
| **Tasks** (via `containsTask`) | Child | **Nothing.** Tasks remain intact and queryable. | ⚠️ Students can still view task details from archived projects |
| **Registrations** (via `registersForTask`) | Grandchild | **Nothing.** Active registrations persist unchanged. | 🔴 **Critical**: students remain "assigned" to tasks on archived projects with no workflow signal |
| **Skills** (via `requiresSkill`) | Association | **Nothing.** Skill links remain. | Students' skill-match calculations may still reference archived project tasks |
| **Themes** (via `hasTheme`) | Association | **Nothing.** | Themes remain linked |
| **Business** (via `hasProjects`) | Parent | **Not affected.** | Expected |
| **Supervisor** (via `creates`) | Creator | **Not affected.** | Expected |

### 2.3 Project Hard-Delete — Cascade Behaviour

Hard-delete at [`project_repository.py:677–766`](projojo_backend/domain/repositories/project_repository.py:677) performs a **seven-step manual cascade**:

1. Delete all `registersForTask` relations for the project's tasks
2. Delete all `requiresSkill` relations for the project's tasks
3. Delete `containsTask` relations
4. Delete `task` entities
5. Delete `creates` relation
6. Delete `hasProjects` relation
7. Delete the `project` entity

**Before deletion**, portfolio snapshots are created for completed tasks at [`project_router.py:413–445`](projojo_backend/routes/project_router.py:413).

**Missing from cascade**: `hasTheme` relations are **not deleted**, leaving orphaned theme links pointing to a non-existent project.

### 2.4 Visibility Matrix by User Role

#### Business Archive Visibility

| View / Query | Student | Supervisor | Teacher | Public/Unauthenticated |
|---|---|---|---|---|
| `GET /businesses/` ([`business_router.py:26`](projojo_backend/routes/business_router.py:26)) | ✅ Hidden (filtered in Python) | ✅ Hidden | ✅ Hidden | N/A (auth required) |
| `GET /businesses/basic` | ✅ Hidden | ✅ Hidden | ✅ Hidden | N/A |
| `GET /businesses/complete` | ✅ Hidden | ✅ Hidden | ✅ Hidden | N/A |
| `GET /businesses/archived` | ❌ 403 | ❌ 403 | ✅ Visible | N/A |
| `GET /businesses/{id}` | ⚠️ **VISIBLE** — no archive check | ⚠️ **VISIBLE** | ✅ Visible | N/A |
| `GET /businesses/{id}/projects` | ⚠️ **VISIBLE** — returns projects of archived business | ⚠️ **VISIBLE** | ✅ Visible | N/A |

#### Project Archive Visibility

| View / Query | Student | Supervisor | Teacher | Public |
|---|---|---|---|---|
| `GET /projects/public` ([`project_router.py:31`](projojo_backend/routes/project_router.py:31)) | N/A | N/A | N/A | ✅ Hidden (`not { $project has isArchived true; }` in TypeQL) |
| `GET /projects/` ([`project_router.py:56`](projojo_backend/routes/project_router.py:56)) | ⚠️ **VISIBLE** — no filter | ⚠️ **VISIBLE** | ⚠️ **VISIBLE** | N/A |
| `GET /projects/{id}` ([`project_router.py:65`](projojo_backend/routes/project_router.py:65)) | ⚠️ **VISIBLE** — no archive check | ⚠️ **VISIBLE** | ⚠️ **VISIBLE** | N/A |
| `GET /projects/{id}/complete` | ⚠️ **VISIBLE** | ⚠️ **VISIBLE** | ⚠️ **VISIBLE** | N/A |
| `GET /projects/{id}/tasks` | ⚠️ **VISIBLE** | ⚠️ **VISIBLE** | ⚠️ **VISIBLE** | N/A |
| Overview page (frontend) | ⚠️ Date-based heuristic only | ⚠️ Date-based heuristic | ⚠️ Date-based heuristic | N/A |

### 2.5 Ghost Data & Broken References

1. **Archived business → visible projects**: When a business is archived, all its projects are still returned by `GET /projects/`, `GET /businesses/{id}/projects`, and individual project pages. Students see projects from a "hidden" business.

2. **Archived project → active registrations**: Task registrations remain active. Students on the `StudentDashboard` and `SupervisorDashboard` still see active/pending registrations for archived projects with no indication that the project is archived.

3. **Archived project → visible in authenticated listings**: `GET /projects/` returns all projects including archived ones. The `OverviewPage` attempts to hide them using a client-side `end_date` heuristic ([`OverviewPage.jsx:286`](projojo_frontend/src/pages/OverviewPage.jsx:286)) which does not check the actual `isArchived` flag.

4. **Project hard-delete → orphaned theme links**: `hasTheme` relations are not included in the delete cascade at [`project_repository.py:677–766`](projojo_backend/domain/repositories/project_repository.py:677).

---

## 3. Cross-Cutting Concerns

### 3.1 Search & Filtering

**Backend filtering approaches (inconsistent)**:

| Query Method | Filter Location | Filter Mechanism |
|---|---|---|
| [`get_public_projects()`](projojo_backend/domain/repositories/project_repository.py:73) | TypeQL query | `not { $project has isArchived true; }` ✅ |
| [`business_repo.get_all()`](projojo_backend/domain/repositories/business_repository.py:41) | Python post-fetch | `[b for b in businesses if not b.is_archived]` ⚠️ |
| [`business_repo.get_all_with_full_nesting()`](projojo_backend/domain/repositories/business_repository.py:177) | Python post-fetch | list comprehension check ⚠️ |
| [`project_repo.get_all()`](projojo_backend/domain/repositories/project_repository.py:45) | **None** | 🔴 No filter at all |
| [`project_repo.get_by_id()`](projojo_backend/domain/repositories/project_repository.py:14) | **None** | 🔴 No filter, doesn't even fetch `isArchived` |
| [`project_repo.get_projects_by_business()`](projojo_backend/domain/repositories/project_repository.py:247) | **None** | 🔴 No filter, doesn't fetch `isArchived` |

**Frontend filtering** (inconsistent date-based heuristic):

| Location | Method | Uses `is_archived` flag? |
|---|---|---|
| [`ProjectCard.jsx:104`](projojo_frontend/src/components/ProjectCard.jsx:104) | `status === 'completed' \|\| end_date < now` | ❌ No |
| [`ProjectDashboard.jsx:4–8`](projojo_frontend/src/components/ProjectDashboard.jsx:4) | Same as above | ❌ No |
| [`OverviewPage.jsx:286`](projojo_frontend/src/pages/OverviewPage.jsx:286) | Same as above | ❌ No |
| [`ProjectDetailsPage.jsx:70`](projojo_frontend/src/pages/ProjectDetailsPage.jsx:70) | `is_archived \|\| status === 'completed' \|\| end_date` | ⚠️ Attempts to, but API never returns `is_archived` |
| [`ProjectDetails.jsx:253,268,571`](projojo_frontend/src/components/ProjectDetails.jsx:253) | `project.is_archived` | ⚠️ Reads it, but API never populates it |
| [`PortfolioList.jsx:37–41`](projojo_frontend/src/components/PortfolioList.jsx:37) | `item.is_archived` | ✅ Works — portfolio repository does populate this |

### 3.2 Pagination & Counts

Business archive filtering happens **after** fetching all records from the database (Python-side filtering in [`business_repository.py:71–72`](projojo_backend/domain/repositories/business_repository.py:71)). This means:

- **All businesses** are fetched from TypeDB on every listing call, even if only non-archived are needed.
- Pagination counts would be unreliable if pagination were added, since filtering happens post-query.
- Dashboard metric calculations in [`SupervisorDashboard.jsx`](projojo_frontend/src/pages/SupervisorDashboard.jsx) and [`PublicDiscoveryPage.jsx`](projojo_frontend/src/pages/PublicDiscoveryPage.jsx) operate on data that has already been filtered by the business listing endpoint but not by project archive state.

### 3.3 Unique Constraints & Slug Collisions

- **Business name uniqueness**: The schema uses `name @card(1)` (no longer `@key` after UUID migration). The `create` endpoint checks for key constraint violations at [`business_router.py:98`](projojo_backend/routes/business_router.py:98). An **archived business retains its name**, so creating a new business with the same name as an archived one may fail with a duplicate error — depending on whether `name @unique` is enforced. This is an untested edge case.
- **Project name uniqueness**: Checked per-business at [`project_repository.py:369–380`](projojo_backend/domain/repositories/project_repository.py:369) — `check_project_exists()` does **not** exclude archived projects, so you cannot create a new project with the same name as an archived one in the same business.

### 3.4 Notifications & Emails

The notification system is **completely non-operational**:

- [`notification_service.py:19`](projojo_backend/service/notification_service.py:19): `self.email_enabled = False` — all send methods short-circuit to console logging.
- [`project_router.py:272`](projojo_backend/routes/project_router.py:272): `# TODO: Send notifications to affected students and teacher` — the `NotificationService` is not even imported or called in the archive route.
- [`project_router.py:447`](projojo_backend/routes/project_router.py:447): same TODO in the delete route.
- The [`ProjectActionModal.jsx:89–93`](projojo_frontend/src/components/ProjectActionModal.jsx:89) UI tells users that "Deze studenten krijgen een notificatie" — this is **false**; no notifications are sent.

**Impact**: Students are never informed when a project they're registered for is archived or deleted.

### 3.5 Reporting & Analytics

No reporting or analytics system exists. Archive/restore actions are not tracked anywhere. There is no way to answer questions like "how many projects were archived last month" or "which teacher archived the most projects."

### 3.6 Caching & Revalidation

No caching layer exists in the backend. All queries go directly to TypeDB. The frontend performs no explicit cache management — it relies on React state and `useEffect` re-fetches. After an archive or restore action, `refreshData()` is called in [`ProjectDetails.jsx:162`](projojo_frontend/src/components/ProjectDetails.jsx:162) to trigger a re-fetch.

### 3.7 Audit Logging

**No audit logging exists** for any archive, restore, or delete operation. The only trace is console `print()` statements for errors. There is no record of:
- Who archived what, when
- Who restored what, when
- Who deleted what, when
- What the state was before the action

### 3.8 Scheduled Jobs & Background Processes

No scheduled jobs or background processes exist. There is no automatic archiving (e.g., "auto-archive projects past their end date"), no cleanup of old archived entities, and no periodic notification retry.

### 3.9 Race Conditions

The archive/restore implementation uses a **delete-then-insert** pattern in separate transactions:

```python
# archive_project() at project_repository.py:644-665
Db.write_transact(delete_query, ...)  # Transaction 1: delete old isArchived
Db.write_transact(insert_query, ...)  # Transaction 2: insert isArchived=true
```

**Race condition**: If two concurrent requests both archive the same project, the second delete may fail (no attribute to delete) and then both inserts execute, potentially causing TypeDB to have a duplicate `isArchived` attribute (violating `@card(0..1)`) or the second insert silently failing. The `try/except` in the delete step masks this.

Similarly, concurrent archive + restore operations could produce inconsistent state.

**Business archive** has the same pattern at [`business_repository.py:345–366`](projojo_backend/domain/repositories/business_repository.py:345).

### 3.10 Database Indexes & Performance

TypeDB uses a graph storage model where attribute ownership lookups are inherently indexed. However:

- **Python-side filtering** of businesses (fetching ALL then filtering in Python at [`business_repository.py:71–72`](projojo_backend/domain/repositories/business_repository.py:71)) effectively defeats any query-level optimisation as the dataset grows.
- The [`get_archived()`](projojo_backend/domain/repositories/business_repository.py:76) method also fetches ALL businesses and filters in Python to find archived ones.
- `get_public_projects()` correctly uses TypeQL-level `not { $project has isArchived true; }` which allows TypeDB to optimise.

At scale, the Python-side filtering on business will degrade. A TypeQL `not { $business has isArchived true; }` clause would be more efficient.

---

## 4. Product Design Completeness

### 4.1 Active Workflow References

**Unconsidered edge case**: Archiving a project that has students with **active, in-progress registrations** (accepted, started, but not completed). The confirm flow at [`project_router.py:260–267`](projojo_backend/routes/project_router.py:260) warns about affected students but:

- Does not differentiate between pending vs. accepted vs. in-progress registrations
- Does not cancel or freeze the registrations upon archive
- Does not prevent supervisors from continuing to accept/reject registrations on archived projects
- The student's `StudentWorkContext` still counts these as active work items

**Result**: A student can be "working on" a task whose parent project is archived, see it in their dashboard as active work, but the project is invisible in listings.

### 4.2 Last-Entity-of-Type Problem

- **Archiving the last active business**: No guard. Teachers can archive all businesses, leaving students with no available organisations.
- **Archiving the last project of a business**: No guard. A supervisor can archive all projects, making the business appear empty without archiving it.
- **Orphaned supervisors**: If all of a supervisor's businesses are archived, they have no context to operate in, but can still access the platform.

### 4.3 Bulk Archiving

No bulk archive functionality exists. Teachers must archive businesses one by one. There is no "archive all projects for business X" action. For businesses with many projects, this is tedious and error-prone.

### 4.4 UI Affordances Assessment

| Affordance | Business | Project |
|---|---|---|
| **Confirmation dialog** | ✅ Modal with warning text at [`TeacherPage.jsx:368–411`](projojo_frontend/src/pages/TeacherPage.jsx:368) | ✅ Two-step confirm flow with affected students list via [`ProjectActionModal.jsx`](projojo_frontend/src/components/ProjectActionModal.jsx:1) |
| **Visual differentiation** | ✅ Separate "Gearchiveerde Organisaties" section in teacher view ([`TeacherPage.jsx:238`](projojo_frontend/src/pages/TeacherPage.jsx:238)) | ⚠️ Partially — `ProjectCard` uses grayscale + opacity ([`ProjectCard.jsx:113`](projojo_frontend/src/components/ProjectCard.jsx:113)) but based on date heuristic, not actual archive flag |
| **Archive badge/indicator** | None visible on business cards | "Archief" badge on project cards ([`ProjectCard.jsx:142–147`](projojo_frontend/src/components/ProjectCard.jsx:142)), "Gearchiveerd" label on detail page ([`ProjectDetails.jsx:268–271`](projojo_frontend/src/components/ProjectDetails.jsx:268)) |
| **Restore capability** | ✅ Restore button in archived section ([`TeacherPage.jsx:289`](projojo_frontend/src/pages/TeacherPage.jsx:289)) | ✅ "Herstellen" button on detail page ([`ProjectDetails.jsx:571–582`](projojo_frontend/src/components/ProjectDetails.jsx:571)) |
| **Undo capability** | ❌ No undo — immediate action | ❌ No undo — immediate action |
| **Admin management view** | ✅ Collapsible archived section for teachers | ❌ No dedicated "archived projects" management view |
| **Feedback after action** | ⚠️ Page reload via counter increment | ✅ Success message displayed |
| **Loading state** | ✅ `isArchiving` spinner ([`TeacherPage.jsx:395–411`](projojo_frontend/src/pages/TeacherPage.jsx:395)) | ✅ `isActionLoading` state |

---

## 5. Implementation Robustness

### 5.1 Archive-Filtering Consistency

Archive checks are **scattered ad-hoc** across individual routes and repositories. There is **no centralised middleware or data-access layer check** that prevents archived entities from appearing in standard queries.

| Layer | Business Filtering | Project Filtering |
|---|---|---|
| Repository query | Python post-filter in `get_all()` | Only in `get_public_projects()` |
| Router-level guard | None (no "is this business archived?" check before serving) | Only `is_archived()` check in archive route itself |
| Auth middleware | None | None |
| Frontend | Relies on backend filtering | Relies on date-based heuristic |

### 5.2 Single Source of Truth

**There is NO single source of truth for archive-filtering logic.**

- Business: filtering duplicated across [`get_all()`](projojo_backend/domain/repositories/business_repository.py:71), [`get_all_with_full_nesting()`](projojo_backend/domain/repositories/business_repository.py:263), and [`get_archived()`](projojo_backend/domain/repositories/business_repository.py:76) — each with its own implementation.
- Project: `isArchived` is only tested in [`get_public_projects()`](projojo_backend/domain/repositories/project_repository.py:87) (TypeQL) and [`is_archived()`](projojo_backend/domain/repositories/project_repository.py:768) (standalone check). All other query methods ignore it completely.
- Frontend: three different "is archived?" formulas exist:
  1. `project.is_archived` (reads API field — but API never serves it)
  2. `status === 'completed'` (status-based)
  3. `end_date < now` (date-based heuristic)

### 5.3 Codepaths That Forget to Filter

| Codepath | Forgets to filter? | Impact |
|---|---|---|
| [`project_repo.get_all()`](projojo_backend/domain/repositories/project_repository.py:45) | 🔴 Yes — returns all including archived | Authenticated users see archived projects in `/projects/` |
| [`project_repo.get_by_id()`](projojo_backend/domain/repositories/project_repository.py:14) | 🔴 Yes — doesn't fetch or return `isArchived` | Frontend cannot know actual archive state; `project.is_archived` is always `undefined` |
| [`project_repo.get_projects_by_business()`](projojo_backend/domain/repositories/project_repository.py:247) | 🔴 Yes — returns archived projects for a business | Business page shows archived projects alongside active ones |
| [`project_repo._map_to_model()`](projojo_backend/domain/repositories/project_repository.py:310) | 🔴 Yes — `isArchived` never mapped | Even if the query fetched it, the model mapping would discard it |
| [`business_repo.get_by_id()`](projojo_backend/domain/repositories/business_repository.py:13) | ⚠️ Returns archived business without warning | Direct-link access shows archived business normally |
| `GET /businesses/{id}/projects` | 🔴 Yes — no archive check on business or projects | Returns all projects for any business regardless of archive state |

### 5.4 TypeScript / Type Awareness

The frontend uses **JavaScript (JSX)**, not TypeScript. There are no type definitions that model archive state. The `is_archived` field appears in component props and state without any type safety:

- No JSDoc annotations on `is_archived`
- No prop-type validation for archive state
- Components inconsistently expect `is_archived` (some check for it, some use date heuristics)
- The sole TypeScript file is [`lib/utils.ts`](projojo_frontend/src/lib/utils.ts) which is shadcn utility unrelated to archiving

The backend `Project` Pydantic model at [`project.py:8–28`](projojo_backend/domain/models/project.py:8) **does not include `is_archived`**, meaning even if the repository returned the field, Pydantic would strip it from serialised responses.

### 5.5 Test Coverage

**Zero test coverage** for archiving behaviour:

- No backend unit tests for `archive_project()`, `restore_project()`, `archive_business()`, or `restore_business()`
- No integration tests for the archive API routes
- No tests for the confirm flow with affected students
- No tests for cascade effects (or lack thereof)
- No tests for permission boundaries (student trying to archive)
- No frontend component tests for archive UI states
- The only tests in the project are Storybook stories (visual component demos) and a database init test ([`test_initDatabase.py`](projojo_backend/db/test_initDatabase.py))

---

## 6. Severity-Ranked Issue Registry

### Critical Issues

| # | Issue | Location | Recommendation |
|---|---|---|---|
| **C-1** | `Project` model lacks `is_archived` field — the API never returns archive state for individual projects | [`project.py:8–28`](projojo_backend/domain/models/project.py:8) | Add `is_archived: bool = False` to the `Project` model |
| **C-2** | `get_by_id()` does not fetch `isArchived` from TypeDB | [`project_repository.py:14–43`](projojo_backend/domain/repositories/project_repository.py:14) | Add `'is_archived': [$project.isArchived]` to the fetch clause; map it in `_map_to_model()` |
| **C-3** | Frontend archive/restore buttons on `ProjectDetails` depend on `project.is_archived` which is always `undefined` due to C-1 and C-2 | [`ProjectDetails.jsx:253,268,571`](projojo_frontend/src/components/ProjectDetails.jsx:571) | Blocked by C-1/C-2 fix. Once the API returns the field, these will work. |
| **C-4** | Duplicate route declarations: `archive_business` and `restore_business` each declared twice | [`business_router.py:154–178`](projojo_backend/routes/business_router.py:154) duplicated at [`business_router.py:208–232`](projojo_backend/routes/business_router.py:208) | Delete the duplicate declarations (lines 208–258) |
| **C-5** | Notifications promised in UI but never sent — `email_enabled = False` and archive route has TODO instead of calling `NotificationService` | [`notification_service.py:19`](projojo_backend/service/notification_service.py:19), [`project_router.py:272`](projojo_backend/routes/project_router.py:272) | Either implement notifications or remove the misleading "studenten krijgen een notificatie" text from [`ProjectActionModal.jsx:91`](projojo_frontend/src/components/ProjectActionModal.jsx:91) |

### High Issues

| # | Issue | Location | Recommendation |
|---|---|---|---|
| **H-1** | `get_all()` for projects returns archived projects to all authenticated users | [`project_repository.py:45–71`](projojo_backend/domain/repositories/project_repository.py:45) | Add `include_archived` parameter (defaulting to `False`) and filter in TypeQL: `not { $project has isArchived true; }` |
| **H-2** | `get_projects_by_business()` returns archived projects | [`project_repository.py:247–288`](projojo_backend/domain/repositories/project_repository.py:247) | Add archive filter to the TypeQL query |
| **H-3** | Archiving a project does not freeze or cancel active registrations | [`project_router.py:269–270`](projojo_backend/routes/project_router.py:269) | Either auto-cancel pending registrations on archive, or add a visible warning to students via `StudentWorkContext` |
| **H-4** | Archived business's projects remain visible and operational — no cascade | [`business_router.py:154–178`](projojo_backend/routes/business_router.py:154) | When archiving a business, either cascade-archive its projects or add a guard preventing creation/registration on projects belonging to archived businesses |
| **H-5** | `get_by_id()` for business returns archived business without any indicator to the frontend about access | [`business_repository.py:13–39`](projojo_backend/domain/repositories/business_repository.py:13) | Consider returning a warning or adding middleware that restricts access for non-teacher roles |
| **H-6** | Frontend archive detection uses date-based heuristic (`end_date < now`) instead of actual `isArchived` flag | [`ProjectCard.jsx:104`](projojo_frontend/src/components/ProjectCard.jsx:104), [`ProjectDashboard.jsx:4–8`](projojo_frontend/src/components/ProjectDashboard.jsx:4), [`OverviewPage.jsx:286`](projojo_frontend/src/pages/OverviewPage.jsx:286) | Once C-1/C-2 are fixed, refactor all "is archived?" checks to use the backend flag |
| **H-7** | `hasTheme` relations not deleted in project hard-delete cascade | [`project_repository.py:677–766`](projojo_backend/domain/repositories/project_repository.py:677) | Add a step to delete `hasTheme` relations before deleting the project |
| **H-8** | Business archive does not check if business is already archived (idempotency issue) | [`business_router.py:154–178`](projojo_backend/routes/business_router.py:154) | Add a pre-check similar to the project archive route's `is_archived()` check |

### Medium Issues

| # | Issue | Location | Recommendation |
|---|---|---|---|
| **M-1** | Race condition in delete-then-insert pattern for archive/restore | [`project_repository.py:644–665`](projojo_backend/domain/repositories/project_repository.py:644), [`business_repository.py:345–366`](projojo_backend/domain/repositories/business_repository.py:345) | Wrap in a single TypeDB transaction if the driver supports it, or add application-level locking |
| **M-2** | Python-side filtering of archived businesses fetches all records from TypeDB | [`business_repository.py:71–72`](projojo_backend/domain/repositories/business_repository.py:71), [`business_repository.py:263–267`](projojo_backend/domain/repositories/business_repository.py:263) | Move filter to TypeQL: `not { $business has isArchived true; }` |
| **M-3** | No audit logging for archive/restore/delete operations | All archive routes | Implement an audit log table/entity or at minimum structured logging with actor, action, target, and timestamp |
| **M-4** | Supervisor can still create projects and accept registrations under an archived business | [`project_router.py:98`](projojo_backend/routes/project_router.py:98), [`task_router.py`](projojo_backend/routes/task_router.py) | Add a pre-check: if the business is archived, reject project creation and registration mutations |
| **M-5** | `check_project_exists()` does not exclude archived projects — prevents reusing names | [`project_repository.py:369–380`](projojo_backend/domain/repositories/project_repository.py:369) | Either exclude archived projects from the uniqueness check or document this as intentional |
| **M-6** | (Portfolio) `PortfolioList` filter "archived" shows items from archived projects but `active` portfolio items from archived projects are silently included in the "all" view without differentiation | [`PortfolioList.jsx:36–41`](projojo_frontend/src/components/PortfolioList.jsx:36) | Ensure active items from archived projects are visually flagged |
| **M-7** | `_map_to_model()` for Project discards any extra fields from the TypeDB result — even if `isArchived` were added to the query, it would be lost | [`project_repository.py:310–367`](projojo_backend/domain/repositories/project_repository.py:310) | Map `is_archived` to the model (prerequisite: add field to `Project` model per C-1) |
| **M-8** | No teacher-facing "archived projects" management view (only business archive management exists) | [`TeacherPage.jsx`](projojo_frontend/src/pages/TeacherPage.jsx) | Build a dedicated archived projects view for teachers |

### Low Issues

| # | Issue | Location | Recommendation |
|---|---|---|---|
| **L-1** | No undo capability for archive actions — immediate execution | [`ProjectDetails.jsx:95–112`](projojo_frontend/src/components/ProjectDetails.jsx:95), [`TeacherPage.jsx:137–149`](projojo_frontend/src/pages/TeacherPage.jsx:137) | Consider a temporary "undo" toast/snackbar that delays the actual API call by a few seconds |
| **L-2** | No bulk archive functionality for teachers managing many businesses/projects | [`TeacherPage.jsx`](projojo_frontend/src/pages/TeacherPage.jsx) | Add bulk select + archive action |
| **L-3** | Business archive modal mentions hiding from "studenten en supervisors" but supervisors who manage the business can still see it via direct URL | [`TeacherPage.jsx:382–384`](projojo_frontend/src/pages/TeacherPage.jsx:382) | Align text with actual behavior, or enforce the restriction on `get_by_id()` |
| **L-4** | `PublicDiscoveryPage` has "active" vs. "completed" filter based on `end_date` heuristic, disconnected from actual archive state | [`PublicDiscoveryPage.jsx:68–78`](projojo_frontend/src/pages/PublicDiscoveryPage.jsx:68) | Align with backend archive state — public projects are already filtered correctly by the API, but the "completed" filter uses a client-side date check |
| **L-5** | `delete_project` cascade uses sequential `try/except` blocks that silently swallow errors — partial delete possible | [`project_repository.py:691–766`](projojo_backend/domain/repositories/project_repository.py:691) | Log errors instead of silently passing; consider wrapping in a single transaction |
| **L-6** | No confirmation dialog for business restore (only for archive) | [`TeacherPage.jsx:152–161`](projojo_frontend/src/pages/TeacherPage.jsx:152) | Add a quick confirmation for restore as well |

---

## 7. Overall Assessment

### Design Maturity

The archiving feature has been **partially designed**. The core idea — soft-delete via `isArchived` boolean, two-step confirmation flow for projects, portfolio snapshotting before hard deletes — is sound. However, the design was not followed through to its logical conclusion:

- **Business archiving** is a purely surface-level hide-from-listings operation with no cascade, no impact analysis, and no guards on child entity operations.
- **Project archiving** has a well-designed confirm flow but then fails to actually propagate the archive state to affected workstreams (registrations, tasks, student dashboards).
- **Notification promises** in the UI are completely unfulfilled.
- **Archive visibility** is a patchwork of backend query-level filtering (in one place), Python post-filtering (in another), and frontend date heuristics (in several more), with no single authoritative set of rules.

### Implementation Quality

The implementation has a **fundamental structural defect**: the `Project` model and its primary query methods (`get_by_id`, `get_all`, `get_projects_by_business`) are completely unaware of the `isArchived` attribute. This means the backend stores archive state in TypeDB but never communicates it to the frontend for individual projects. The frontend compensates with date-based heuristics that produce different results.

The business archiving implementation is more complete — the model, queries, and routes all handle `is_archived` — but suffers from duplicate route declarations and lack of cascade.

### Production Readiness

**Not production-ready.** The five critical issues (C-1 through C-5) must be resolved before the archiving feature can function as designed. The high issues (H-1 through H-8) represent data integrity and user experience gaps that would cause confusion in a live environment.

### Estimated Effort to Remediate

| Priority | Issue Count | Estimated Effort |
|---|---|---|
| Critical | 5 | 2–4 hours (primarily C-1/C-2/C-4 are mechanical fixes) |
| High | 8 | 1–2 days (H-3, H-4, H-6 require design decisions) |
| Medium | 8 | 2–3 days |
| Low | 6 | 1–2 days |
| **Total** | **27 issues** | **~1–2 weeks** |
