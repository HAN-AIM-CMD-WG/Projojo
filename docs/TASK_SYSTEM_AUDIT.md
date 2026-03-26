# Task System Audit — Product, Architecture & Implementation Review

**Date**: 23 March 2026
**Branch**: `next-ui`
**Scope**: Full-stack audit of the task system across TypeDB schema, backend (FastAPI/Python), and frontend (React)
**Method**: Code-backed analysis using existing business rules docs from both branches as starting point, then validating against actual implementation

---

## Overall Verdict

**The task system documented in [`NEXT-UI-BRANCH-ANALYSIS.md`](NEXT-UI-BRANCH-ANALYSIS.md) as "new" is not actually new. Tasks already existed in the main branch. What happened in `next-ui` is a significant *evolution* — not a creation — of the existing task system, adding lifecycle tracking, timeline management, progress states, dashboards, and portfolio integration on top of the original CRUD + registration accept/reject system.**

The original system in `main` (documented in [`BUSINESS_RULES_FROM_MAIN_BRANCH.md`](BUSINESS_RULES_FROM_MAIN_BRANCH.md)) already had: task entity with `containsTask` relation, `registersForTask` relation with `isAccepted`/`response`/`description` fields, task CRUD with name uniqueness per project, registration create/accept/reject flow, required-skills management, capacity constraints, and aggregate counts for pending/accepted registrations.

The `next-ui` branch added: registration lifecycle timestamps (`requestedAt`, `acceptedAt`, `startedAt`, `completedAt`), start/complete state transitions, task date support (`startDate`, `endDate`) with project-date validation, registration cancellation by students, full-timeline registration queries, supervisor/student dashboards with live registration management, `StudentWorkContext` for tracking active/pending work, portfolio integration from completed registrations, and project-delete cascade with portfolio snapshotting.

The evolved system is **functionally deeper** than the original, but it has **multiple confirmed correctness and authorization gaps**, **several missing validations that the original system's simpler endpoints didn't need but the new lifecycle endpoints do**, and **product-level omissions** that leave user-facing workflows incomplete.

### Quality Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Product quality | 6/10 | The lifecycle progression is a meaningful improvement, but key user expectations remain unmet (no notifications, no task deletion, no explicit status field, status inferred inconsistently) |
| Architecture quality | 7/10 | Reasonable entity model, clean separation of task_repository/task_router/task_service. Registration-as-lifecycle is a workable pattern. Date validation logic is well-placed in router. |
| Implementation quality | 5/10 | Core CRUD is solid, but lifecycle endpoints lack ownership enforcement, transition validation, and are not idempotent-safe. Frontend duplicate-check is broken. Accept timestamp uses a separate transaction with swallowed errors. |
| Business-rule coherence | 5/10 | Most original constraints (capacity, uniqueness, skills lock) are well-preserved. New lifecycle rules are underspecified and inconsistently enforced across backend and frontend. |

---

## Table of Contents

- [1. What Changed: Main vs Next-UI](#1-what-changed-main-vs-next-ui)
- [2. Implemented Feature Set](#2-implemented-feature-set)
- [3. Feature Completeness — Expected but Missing](#3-feature-completeness--expected-but-missing)
- [4. Interactions with Existing App Functionality](#4-interactions-with-existing-app-functionality)
- [5. Implementation Correctness](#5-implementation-correctness)
- [6. Implementation Robustness](#6-implementation-robustness)
- [7. Database and Schema Integration](#7-database-and-schema-integration)
- [8. Documentation vs Implementation Mismatches](#8-documentation-vs-implementation-mismatches)
- [9. Confirmed, Likely, and Open Questions](#9-confirmed-likely-and-open-questions)
- [10. Recommendations](#10-recommendations)

---

## 1. What Changed: Main vs Next-UI

### What main already had (task system was NOT new)

| Capability | Evidence |
|-----------|----------|
| `task` entity with `id`, `name`, `description`, `totalNeeded`, `createdAt` | [`schema.tql:70-80`](../projojo_backend/db/schema.tql:70) (task entity is in both branches) |
| `containsTask` relation linking tasks to projects | [`schema.tql:116-118`](../projojo_backend/db/schema.tql:116) |
| `registersForTask` relation with `description`, `isAccepted`, `response`, `createdAt` | Documented in [`BUSINESS_RULES_FROM_MAIN_BRANCH.md`](BUSINESS_RULES_FROM_MAIN_BRANCH.md) C-REG-01 through C-REG-04 |
| `requiresSkill` relation linking tasks to skills | [`schema.tql:120-122`](../projojo_backend/db/schema.tql:120) |
| Task CRUD (create with project validation, update with uniqueness check, capacity protection) | Documented in [`BUSINESS_RULES_FROM_MAIN_BRANCH.md`](BUSINESS_RULES_FROM_MAIN_BRANCH.md) OP-TASK-01, OP-TASK-02, OP-TASK-03 |
| Registration create/accept/reject | Documented in [`BUSINESS_RULES_FROM_MAIN_BRANCH.md`](BUSINESS_RULES_FROM_MAIN_BRANCH.md) OP-REG-01, OP-REG-02, OP-REG-03 |
| `total_registered` and `total_accepted` aggregate counts | Documented in [`BUSINESS_RULES_FROM_MAIN_BRANCH.md`](BUSINESS_RULES_FROM_MAIN_BRANCH.md) D-01, D-02 |
| Task name uniqueness within project | Documented in [`BUSINESS_RULES_FROM_MAIN_BRANCH.md`](BUSINESS_RULES_FROM_MAIN_BRANCH.md) C-UNIQ-03 |
| Task skill mutation lock when registrations exist | Documented in [`BUSINESS_RULES_FROM_MAIN_BRANCH.md`](BUSINESS_RULES_FROM_MAIN_BRANCH.md) — but the documented implementation differs: main was set-based add/remove; next-ui adds the `has_task_registrations` check |

### What next-ui added

| Addition | Evidence |
|----------|----------|
| Registration timeline fields: `requestedAt`, `acceptedAt`, `startedAt`, `completedAt` | [`schema.tql:136-139`](../projojo_backend/db/schema.tql:136) |
| Task date fields: `startDate`, `endDate` | [`schema.tql:76-77`](../projojo_backend/db/schema.tql:76) |
| `mark_registration_started()` endpoint | [`task_router.py:360`](../projojo_backend/routes/task_router.py:360) |
| `mark_registration_completed()` endpoint | [`task_router.py:391`](../projojo_backend/routes/task_router.py:391) |
| `get_registration_timeline()` endpoint | [`task_router.py:423`](../projojo_backend/routes/task_router.py:423) |
| `get_all_registrations()` — pending + accepted with full timeline | [`task_router.py:132`](../projojo_backend/routes/task_router.py:132), [`task_repository.py:272`](../projojo_backend/domain/repositories/task_repository.py:272) |
| `delete_registration()` — student cancellation of pending | [`task_router.py:207`](../projojo_backend/routes/task_router.py:207), [`task_repository.py:439`](../projojo_backend/domain/repositories/task_repository.py:439) |
| Task date validation (dates within project period) | [`task_router.py:257-271`](../projojo_backend/routes/task_router.py:257) |
| `total_started` and `total_completed` aggregate counts | [`task_repository.py:42-53`](../projojo_backend/domain/repositories/task_repository.py:42) |
| Dashboard endpoints: `get_pending_registrations_by_business()`, `get_active_students_by_business()` | [`task_repository.py:482`](../projojo_backend/domain/repositories/task_repository.py:482), [`task_repository.py:523`](../projojo_backend/domain/repositories/task_repository.py:523) |
| Supervisor dashboard endpoint aggregating projects, registrations, students | [`supervisor_router.py:22`](../projojo_backend/routes/supervisor_router.py:22) |
| Frontend: `StudentDashboard`, `SupervisorDashboard`, `StudentWorkContext`, `TaskCard`, enhanced `Task` component | Multiple files in [`projojo_frontend/src/`](../projojo_frontend/src/) |
| Portfolio integration (completed registrations become portfolio items) | [`project_router.py:413-445`](../projojo_backend/routes/project_router.py:413), [`portfolio_repository.py`](../projojo_backend/domain/repositories/portfolio_repository.py) |

### What NEXT-UI-BRANCH-ANALYSIS.md got wrong

The branch analysis at line 149 lists `task.py (NEW), task_repository.py (NEW, +437), task_router.py (NEW, +354), task_service.py (NEW)` as a "NEW feature" with impact "🔴 New feature". **This is misleading.** The main branch already had corresponding files. What happened is these files were substantially *rewritten and extended*, not created from nothing. The diff shows +437 and +354 lines because the files grew, not because they were created. This mischaracterization matters because it obscures the fact that the real changes are *lifecycle additions to an existing system*, not a greenfield build.

---

## 2. Implemented Feature Set

### A. Task CRUD

Full create/read/update lifecycle for tasks within projects.

- **Create**: [`POST /tasks/{project_id}`](../projojo_backend/routes/task_router.py:234) — validates project exists, task name unique within project, dates within project period, generates UUID and timestamp.
- **Read (single)**: [`GET /tasks/{task_id}`](../projojo_backend/routes/task_router.py:70) — returns task with aggregate counts (`total_registered`, `total_accepted`, `total_started`, `total_completed`), project_id, and optional dates.
- **Read (all)**: [`GET /tasks/`](../projojo_backend/routes/task_router.py:27) — debugging endpoint returning all tasks.
- **Read (by project)**: via [`task_service.get_tasks_with_skills_by_project()`](../projojo_backend/service/task_service.py:17) called from project routes.
- **Update**: [`PUT /tasks/{task_id}`](../projojo_backend/routes/task_router.py:292) — validates name uniqueness, capacity ≥ accepted, dates within project period.
- **Delete**: ❌ **No standalone task delete endpoint exists.**

### B. Task skills management

- **Read**: [`GET /tasks/{task_id}/skills`](../projojo_backend/routes/task_router.py:79) — returns task with skills via [`task_service.get_task_with_skills()`](../projojo_backend/service/task_service.py:8).
- **Update**: [`PUT /tasks/{task_id}/skills`](../projojo_backend/routes/task_router.py:88) — set-based update with skill mutation lock when registrations exist.

### C. Registration lifecycle

- **Create**: [`POST /tasks/{task_id}/registrations`](../projojo_backend/routes/task_router.py:145) — student-only, validates capacity and no duplicate, sets `createdAt` and `requestedAt`.
- **Accept/Reject**: [`PUT /tasks/{task_id}/registrations/{student_id}`](../projojo_backend/routes/task_router.py:182) — supervisor with ownership, sets `isAccepted` + `response`, and `acceptedAt` on accept.
- **Cancel**: [`DELETE /tasks/{task_id}/registrations`](../projojo_backend/routes/task_router.py:207) — student-only, deletes only pending (not accepted/rejected) registrations.
- **Start**: [`PATCH /tasks/{task_id}/registrations/{student_id}/start`](../projojo_backend/routes/task_router.py:360) — sets `startedAt`. Can be called by student (own only), supervisor, or teacher.
- **Complete**: [`PATCH /tasks/{task_id}/registrations/{student_id}/complete`](../projojo_backend/routes/task_router.py:391) — sets `completedAt`. Supervisor or teacher only.
- **Timeline**: [`GET /tasks/{task_id}/registrations/{student_id}/timeline`](../projojo_backend/routes/task_router.py:423) — returns all four timestamps.

### D. Registration queries

- **Open registrations**: [`GET /tasks/{task_id}/registrations`](../projojo_backend/routes/task_router.py:123) — pending only, with student details and skills (supervisor ownership required).
- **All registrations**: [`GET /tasks/{task_id}/registrations/all`](../projojo_backend/routes/task_router.py:132) — pending + accepted with full timeline (supervisor ownership required).
- **Student's own registrations**: [`GET /students/registrations`](../projojo_backend/routes/student_router.py:85) — includes task details, business info, acceptance status.
- **Email retrieval**: [`GET /tasks/{task_id}/student-emails`](../projojo_backend/routes/task_router.py:46) and [`GET /tasks/{task_id}/emails/colleagues`](../projojo_backend/routes/task_router.py:37).

### E. Dashboard integrations

- **Supervisor dashboard**: [`GET /supervisors/dashboard`](../projojo_backend/routes/supervisor_router.py:22) — aggregates projects, pending registrations, active students, and stats for the supervisor's business.
- **Student dashboard**: Built from [`getStudentRegistrations()`](../projojo_frontend/src/services.js:406) in [`StudentDashboard.jsx`](../projojo_frontend/src/pages/StudentDashboard.jsx:19), separating active/pending/rejected/completed tasks.
- **Student work context**: [`StudentWorkContext.jsx`](../projojo_frontend/src/context/StudentWorkContext.jsx) computes `workingBusinessIds`, `workingProjectIds`, `workingTaskIds`, and corresponding pending sets for efficient status checks across the UI.

### F. Frontend task UIs

- **Task card** (compact display): [`TaskCard.jsx`](../projojo_frontend/src/components/TaskCard.jsx:12) — progress bar, spots, deadline countdown, status badge.
- **Task detail** (full interactive): [`Task.jsx`](../projojo_frontend/src/components/Task.jsx:19) — tabs for Details and Team, inline editing for owners, registration submission for students, accept/reject/start/complete for supervisors.
- **Project tasks listing**: [`ProjectTasks.jsx`](../projojo_frontend/src/components/ProjectTasks.jsx:13) — lists tasks within a project with duplicate-registration prevention (buggy, see §5).

---

## 3. Feature Completeness — Expected but Missing

### What a reasonable user would expect but is absent

| # | Missing feature | Severity | Evidence / Reasoning |
|---|----------------|----------|---------------------|
| A | **No task deletion endpoint** | 🔴 High | Tasks can only be created/updated. No `DELETE /tasks/{task_id}` exists. If a supervisor creates a task by mistake, it can only be removed when the entire project is deleted (teacher-only). This is noted as R-12 in [`BUSINESS_RULES_FROM_MAIN_BRANCH.md`](BUSINESS_RULES_FROM_MAIN_BRANCH.md). |
| B | **No explicit task status field** | 🟠 Medium-High | [`TaskCard.jsx`](../projojo_frontend/src/components/TaskCard.jsx:6) renders status labels (`completed`, `in_progress`, `open`, `pending`), but there is no `status` attribute on the task entity in [`schema.tql`](../projojo_backend/db/schema.tql:70). Status is inferred client-side from dates and registration counts. This means tasks appear in different states to different viewers depending on their UI logic. Docs [`USER_STORIES_PORTFOLIO.md`](USER_STORIES_PORTFOLIO.md) and [`USER_STORIES_ORGANISATIE.md`](USER_STORIES_ORGANISATIE.md) explicitly call for a `status` field on task. |
| C | **No notifications on registration state changes** | 🔴 High | When a supervisor accepts/rejects a registration, the student receives no notification. When start/complete transitions happen, no notifications. The notification service exists ([`notification_service.py`](../projojo_backend/service/notification_service.py:13)) but is disabled (`email_enabled = False`) and only has scaffolding for archive/delete notifications, not registration lifecycle notifications. The UI says "Je ontvangt bericht zodra de organisatie reageert" in [`Task.jsx:88`](../projojo_frontend/src/components/Task.jsx:88), which is a lie. |
| D | **No task-level progress percentage or completion tracking** | 🟡 Medium | The system tracks `total_started` and `total_completed` counts but doesn't expose a meaningful progress indicator. A user looking at a task cannot see "3 of 5 students have completed" in the main task views. |
| E | **No task comments or messaging** | 🟡 Medium | There is no way for students and supervisors to communicate about a task within the platform beyond the initial motivation text and accept/reject response. |
| F | **No task search or filtering independent of projects** | 🟡 Medium | Students can only find tasks by browsing projects. There is no `GET /tasks?skill=python&location=Gelderland` endpoint or UI for task-level discovery. |
| G | **No "subtask" or "deeltaak" system despite docs describing it** | 🟠 Medium-High | [`GEBRUIKERSSCENARIOS_V1.md`](GEBRUIKERSSCENARIOS_V1.md) extensively describes a deeltaken (subtask) system with WAT/WAAROM/HOE/CRITERIA structure, templates, and student claiming. The [`ROADMAP.md`](ROADMAP.md) marks "Deeltaken systeem" as ✅ Geïmplementeerd. **No subtask entity, relation, or endpoint exists in the code.** The feature is completely absent despite being documented as implemented. |
| H | **No task deadline reminders** | 🟢 Low-Medium | The UI shows countdown text for deadlines in [`Task.jsx:63-73`](../projojo_frontend/src/components/Task.jsx:63), but there are no backend or push notifications for approaching deadlines. |
| I | **No task archival** | 🟡 Medium | Projects can be archived, but there is no way to archive individual tasks. A supervisor cannot indicate "this task is no longer accepting registrations" without modifying `totalNeeded` to equal current accepted count. |
| J | **No undo for accept/reject decisions** | 🟡 Medium | Once a registration is accepted or rejected, the `update_registration` endpoint can actually be called again to change the decision (TypeDB `update` replaces the value), but there is no UI for reversing a decision, and the UX implications of un-accepting a student are not addressed. |

---

## 4. Interactions with Existing App Functionality

### Coherent interactions

| Interaction | Assessment |
|-------------|------------|
| Task → Project containment | Clean. `containsTask` relation properly enforced. Task CRUD respects project existence and ownership. |
| Task → Skills | Clean. `requiresSkill` relation with proper add/remove with lock when registrations exist. |
| Task → Registration → Student | Core flow works: student registers, supervisor accepts/rejects, student can cancel pending. |
| Task dates → Project dates | Well-implemented. [`task_router.py:257-271`](../projojo_backend/routes/task_router.py:257) validates task dates fall within project period. |
| Task → Supervisor Dashboard | Properly integrated. [`supervisor_router.py:22`](../projojo_backend/routes/supervisor_router.py:22) aggregates task data for the supervisor's business. |
| Task → Student Work Context | [`StudentWorkContext.jsx`](../projojo_frontend/src/context/StudentWorkContext.jsx) properly derives active/pending sets from registrations for cross-UI status display. |
| Task → Project Delete cascade | Teacher-only delete creates portfolio snapshots for completed task registrations before deletion. Reasonable flow. |

### Weak or conflicting interactions

#### A. Task status is frontend-inferred, conflicting with backend model

The backend returns `total_registered`, `total_accepted`, `total_started`, `total_completed`, dates, etc., but no canonical `status`. [`TaskCard.jsx:16-17`](../projojo_frontend/src/components/TaskCard.jsx:16) uses `task.status || 'open'`, but this field is never populated by the backend. It only works if some intermediate layer (not found in the code) sets it. [`ProjectCard.jsx:10-39`](../projojo_frontend/src/components/ProjectCard.jsx:10) defines a richer status map with `active`, `in_progress`, `planning`, `pending`, `review`, `completed`, `default` — but these do not correspond to any backend-emitted value.

**Severity:** 🟠 Medium-High — UI shows random/default status badges.

#### B. StudentDashboard vs StudentWorkContext: parallel data fetching

[`StudentDashboard.jsx:50`](../projojo_frontend/src/pages/StudentDashboard.jsx:50) calls `getStudentRegistrations()` directly, while [`StudentWorkContext.jsx:33`](../projojo_frontend/src/context/StudentWorkContext.jsx:33) also calls `getStudentRegistrations()` on mount. This means the same endpoint is called twice on dashboard load. They also apply slightly different filtering logic: the dashboard separates by `is_accepted === true && !completed_at` vs `is_accepted === null`, while the context derives Sets for business/project/task IDs.

**Severity:** 🟡 Medium — redundant API calls, potential for inconsistent state if one updates and the other doesn't.

#### C. Archive semantics affect task visibility inconsistently

When a project is archived, its tasks still exist in the database but the project is filtered from certain views. However, task-level queries (`GET /tasks/`, `GET /tasks/{id}`) do not check the parent project's archive status. A student could theoretically still see and interact with tasks from archived projects.

**Severity:** 🟡 Medium — already flagged as I-001 in [`BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md`](BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md).

#### D. Portfolio interaction depends on registration `completedAt`, not a formal "task done" status

The portfolio system (documented in [`PORTFOLIO_SYSTEM_AUDIT.md`](PORTFOLIO_SYSTEM_AUDIT.md)) builds portfolio items from registrations with `completedAt` set. But there is no distinct "task completion" event — it's just a supervisor or teacher calling `mark_registration_completed()` on individual student-task pairs. A task with 5 positions could have 3 completed and 2 still active, and there's no collective "task is done" state.

**Severity:** 🟡 Medium — acceptable for MVP, but creates semantic confusion between "individual student completed their part" and "the task as a whole is finished."

---

## 5. Implementation Correctness

### 5.1 🔴 Critical — Missing ownership enforcement on lifecycle endpoints

**Evidence:**
- [`mark_registration_started()`](../projojo_backend/routes/task_router.py:360) uses `Depends(get_token_payload)` with manual role check, **not** `@auth(role="supervisor", owner_id_key="task_id")`.
- [`mark_registration_completed()`](../projojo_backend/routes/task_router.py:391) — same issue.
- [`get_registration_timeline()`](../projojo_backend/routes/task_router.py:423) — same issue, and even any authenticated user can access it since there's no role check at all (the function just checks existence).

**Why it matters:**
- A supervisor from business A can mark students at business B's tasks as started or completed.
- This directly corrupts portfolio integrity because completion feeds portfolio data.
- The comment at [`task_router.py:370`](../projojo_backend/routes/task_router.py:370) even says "A supervisor (for their business's tasks)" but does not enforce it.

**Recommendation:** Apply `@auth(role="supervisor", owner_id_key="task_id")` or explicitly verify task ownership before mutation.

---

### 5.2 🔴 High — Frontend duplicate-registration precheck is structurally broken

**Evidence:**
- [`ProjectTasks.jsx:108`](../projojo_frontend/src/components/ProjectTasks.jsx:108): `studentAlreadyRegistered={currentRegistrations.includes(task.id)}`
- [`get_student_registrations()`](../projojo_backend/domain/repositories/user_repository.py:422) returns a list of dict objects like `{id: "task-uuid", name: "...", ...}`.
- JavaScript `Array.includes()` checks strict equality. `currentRegistrations` contains objects; `task.id` is a string. `[{id: "abc"}].includes("abc")` is always `false`.

**Why it matters:** The UI never correctly detects that a student is already registered for a task. The "register" button always appears, and the student can attempt to register again — only to be blocked by the backend with an error message.

**Recommendation:** Change to `currentRegistrations.some(r => r.id === task.id)` or convert the registration list to an ID set.

---

### 5.3 🔴 High — Accept timestamp set in separate transaction with swallowed error

**Evidence:**
- [`task_repository.py:420-437`](../projojo_backend/domain/repositories/task_repository.py:420): After updating `isAccepted` and `response` in one write transaction, the code performs a *second* write transaction for `acceptedAt`.
- [`task_repository.py:436`](../projojo_backend/domain/repositories/task_repository.py:436): `except Exception: pass` — if the timestamp update fails, the error is silently swallowed.

**Why it matters:**
- A registration can be `isAccepted = true` without an `acceptedAt` timestamp, which breaks timeline integrity.
- The portfolio system relies on these timestamps for display and sorting.
- Two separate transactions are not atomic — if the process crashes between them, the data is inconsistent.

**Recommendation:** Combine both updates into a single write transaction, or at minimum log the error and surface it to the caller.

---

### 5.4 🟠 Medium-High — No transition validation for start/complete

**Evidence:**
- [`mark_registration_started()`](../projojo_backend/domain/repositories/task_repository.py:552): Only matches `has isAccepted true`. Does not check whether `startedAt` is already set or `completedAt` is already set.
- [`mark_registration_completed()`](../projojo_backend/domain/repositories/task_repository.py:575): Only matches `has isAccepted true`. Does not check whether `startedAt` has been set first or `completedAt` is already set.

**Why it matters:**
- A registration can be marked completed without being started (skipping a lifecycle step).
- Calling complete twice overwrites `completedAt`, potentially corrupting portfolio timeline data.
- Starting a completed registration re-stamps `startedAt` without clearing `completedAt`, creating contradictory state.

**Recommendation:** Add explicit guards: `completed` requires `startedAt`; reject if already completed; reject start if already started or completed.

---

### 5.5 🟠 Medium-High — No `@auth` decorator on cancel registration endpoint

**Evidence:** [`task_router.py:207-232`](../projojo_backend/routes/task_router.py:207) — the `DELETE /{task_id}/registrations` endpoint uses `Depends(get_token_payload)` with a manual `if payload["role"] != "student"` check instead of the standard `@auth(role="student")` decorator used elsewhere.

**Why it matters:** This bypasses the standard authorization middleware pipeline, including any logging, ownership checking, or error formatting that `@auth()` provides. It also means the JWT middleware's unauthenticated-route bypass logic (checking `auth_role` attribute) does not apply to this endpoint.

**Recommendation:** Use `@auth(role="student")` decorator.

---

### 5.6 🟡 Medium — Task name and description validation missing

**Evidence:**
- [`task_router.py:234-290`](../projojo_backend/routes/task_router.py:234) (create) and [`task_router.py:292-357`](../projojo_backend/routes/task_router.py:292) (update) do not call `is_valid_length()` from [`validation_service.py`](../projojo_backend/service/validation_service.py).
- Compare with [`project_router.py:71`](../projojo_backend/routes/project_router.py:71) and [`business_router.py:81`](../projojo_backend/routes/business_router.py:81) which validate name (1–100 chars) and description (1–4000 chars after markdown stripping).

**Why it matters:** Tasks can have arbitrarily long names or descriptions, or empty ones, bypassing the validation applied to every other entity.

**Recommendation:** Add validation matching other entities: `is_valid_length(name, 100)` and `is_valid_length(description, 4000, strip_md=True)`.

---

### 5.7 🟡 Medium — `total_needed` has no minimum validation

**Evidence:**
- [`task_router.py:273-278`](../projojo_backend/routes/task_router.py:273): `total_needed` from `TaskCreate` model is used directly.
- [`task.py:11`](../projojo_backend/domain/models/task.py:11): `total_needed: int` — no `ge=1` or `gt=0` constraint.
- Already flagged as C-VAL-05 in [`BUSINESS_RULES_FROM_MAIN_BRANCH.md`](BUSINESS_RULES_FROM_MAIN_BRANCH.md).

**Why it matters:** A task can be created with `total_needed = 0` or negative, making registration impossible or semantically meaningless.

**Recommendation:** Add `total_needed: int = Field(..., ge=1)` to the Pydantic model or validate in the router.

---

### 5.8 🟡 Medium — Race condition on capacity check during registration

**Evidence:** [`task_router.py:162-177`](../projojo_backend/routes/task_router.py:162):
1. Reads `task.total_accepted` (read transaction)
2. Compares against `task.total_needed`
3. Creates registration in a separate write transaction

Between steps 1 and 3, another registration could be accepted, violating capacity. TypeDB does not provide row-level locking within this pattern.

**Why it matters:** In concurrent use, more registrations could be accepted than `total_needed` allows.

**Recommendation:** Move the capacity check into the write transaction or implement an optimistic concurrency check.

---

## 6. Implementation Robustness

### Null and empty-state handling

| Area | Assessment |
|------|------------|
| Task with no skills | ✅ Handled — UI shows "Geen specifieke skills vereist" in [`Task.jsx:415`](../projojo_frontend/src/components/Task.jsx:415) |
| Task with no dates | ✅ Handled — `field_validator` in [`task.py:23-28`](../projojo_backend/domain/models/task.py:23) extracts from arrays; UI conditionally renders dates |
| Empty registrations | ✅ Handled — Empty state UI in both dashboards |
| Optional `isAccepted` field | ⚠️ Partially handled — TypeDB returns optional fields as arrays; `StudentDashboard.jsx:99-103` checks `=== null` and `=== undefined` but if TypeDB returns `[]`, the comparison may fail |
| Optional `completedAt` field | ⚠️ Same concern — `StudentDashboard.jsx:101` checks `!t.completed_at` but if the backend returns `[]` instead of `null`, this could be truthy |

### Robustness issues

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| A | **`is_accepted` field may be an array in student registrations** | 🟡 Medium | [`user_repository.py:448`](../projojo_backend/domain/repositories/user_repository.py:448) fetches `'is_accepted': $registration.isAccepted` — TypeDB may return this as an array for an optional `@card(0..1)` attribute. [`StudentDashboard.jsx:99-103`](../projojo_frontend/src/pages/StudentDashboard.jsx:99) compares with `=== true`, `=== null`, `=== false` which would all fail if the value is `[true]`. However, `completed_at` returns `$registration.completedAt` which is also optional. If the `Db.read_transact()` function unwraps single-element arrays, this may be fine — but the pattern is inconsistent with other queries that explicitly use `[$registration.field]` array wrapping. |
| B | **Dashboard data can become stale after registration actions** | 🟡 Medium | The `Task.jsx` component calls `refetchRegistrations()` after accept/reject/start/complete, but this only refreshes the local task's registration data, not the parent dashboard's counts or the `StudentWorkContext`. |
| C | **No error boundary around lifecycle transitions** | 🟡 Medium | [`Task.jsx:146-168`](../projojo_frontend/src/components/Task.jsx:146) catches errors from `markTaskStarted`/`markTaskCompleted` and shows them in the registration error array, but the error display may not be visible if the user is on the "details" tab instead of the "team" tab. |
| D | **Registration duplicate check fetches entire registration list** | 🟢 Low-Medium | [`task_router.py:170-172`](../projojo_backend/routes/task_router.py:170): calls `user_repo.get_student_registrations(student_id)` which fetches *all* registrations with full task/project/business details just to check if one task_id is in the list. A targeted existence check would be more efficient. |

---

## 7. Database and Schema Integration

### Strengths

- Task entity has clean required attributes: `id @key`, `name @card(1)`, `description @card(1)`, `totalNeeded @card(1)`, `createdAt @card(1)`
- Optional dates use `@card(0..1)` correctly: `startDate`, `endDate`
- `containsTask` relation properly enforces `task @card(1)` (each task belongs to exactly one project)
- Registration timeline fields are all optional `@card(0..1)`, allowing progressive population
- Aggregate sub-queries for counts are computed server-side in TypeQL, avoiding client-side aggregation

### Weaknesses

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| A | **No task `status` attribute despite UI expecting it** | 🟠 Medium-High | The schema has no status field on `task`. Status is derived, but inconsistently across frontend components. A canonical `status` attribute would simplify queries and ensure consistent filtering. |
| B | **No index or constraint preventing orphaned tasks** | 🟡 Medium | `containsTask` at `task @card(1)` should prevent orphaned tasks at the schema level, but delete operations in `project_repository.delete_project()` may delete `containsTask` relations before deleting tasks, as flagged in the [`PORTFOLIO_SYSTEM_AUDIT.md`](PORTFOLIO_SYSTEM_AUDIT.md) §5.3. |
| C | **Registration `createdAt` and `requestedAt` are redundant** | 🟢 Low | [`task_repository.py:373-393`](../projojo_backend/domain/repositories/task_repository.py:373): Both are set to `datetime.now()` at creation time. `createdAt` is the original main-branch field; `requestedAt` was added in next-ui. Only one is needed. |
| D | **No schema enforcement of lifecycle ordering** | 🟢 Low | TypeDB cannot enforce that `acceptedAt` is set only after `requestedAt`, or `completedAt` only after `startedAt`. This must be enforced in application code, which currently does not do so (see §5.4). |
| E | **No `isArchived` on task entity** | 🟡 Medium | Projects have `isArchived @card(0..1)`, but tasks do not. There is no way to archive a task independently of its project. |
| F | **50+ seed tasks create heavy development environment** | 🟢 Low | Seed data in [`seed.tql`](../projojo_backend/db/seed.tql) contains 60+ tasks across many projects. Useful for demo but makes development iteration slower. |

---

## 8. Documentation vs Implementation Mismatches

| # | Mismatch | Docs say | Code does |
|---|----------|----------|-----------|
| A | **Task system is "new"** | [`NEXT-UI-BRANCH-ANALYSIS.md:149`](NEXT-UI-BRANCH-ANALYSIS.md) — "Full task management with status tracking" listed as 🔴 New feature | Tasks already existed in main. Next-ui *extended* the system with lifecycle tracking, dates, and frontend UIs. |
| B | **Subtask/deeltaak system is implemented** | [`GEBRUIKERSSCENARIOS_V1.md`](GEBRUIKERSSCENARIOS_V1.md) marks "Deeltaken systeem" with ✅ and describes WAT/WAAROM/HOE/CRITERIA structure. [`ROADMAP.md`](ROADMAP.md) also marks it ✅. | **No subtask entity, relation, endpoint, or UI component exists anywhere in the codebase.** |
| C | **Task status field exists** | [`USER_STORIES_PORTFOLIO.md`](USER_STORIES_PORTFOLIO.md) technical requirements table specifies "`Task` model — `status` veld toevoegen (`pending` / `active` / `completed`)" | No `status` attribute on task entity in schema. [`TaskCard.jsx`](../projojo_frontend/src/components/TaskCard.jsx:54) references `task.status` which is always undefined from the backend. |
| D | **Notification on registration changes** | [`Task.jsx:88`](../projojo_frontend/src/components/Task.jsx:88) says "Je ontvangt bericht zodra de organisatie reageert" | No notification is sent on accept/reject. Notification service is disabled. |
| E | **Registration cancellation marked as missing in main** | [`BUSINESS_RULES_FROM_MAIN_BRANCH.md`](BUSINESS_RULES_FROM_MAIN_BRANCH.md) R-11 flags "Registrations Cannot Be Withdrawn" as Medium severity missing feature | ✅ Fixed in next-ui: [`DELETE /tasks/{task_id}/registrations`](../projojo_backend/routes/task_router.py:207) with [`cancelRegistration()`](../projojo_frontend/src/services.js:511) in frontend. |
| F | **Templates for tasks** | [`GEBRUIKERSSCENARIOS_V1.md`](GEBRUIKERSSCENARIOS_V1.md) mentions task templates ("Jan kan ook templates maken voor hergebruik") and marks it ✅ | No template system exists. |
| G | **"Taak afronden" user story** | [`ROADMAP.md`](ROADMAP.md) lists "Taak als afgerond markeren" as ❌ not implemented | Actually partially implemented via `mark_registration_completed()` — but this marks individual student-task registrations, not the task itself. |

---

## 9. Confirmed, Likely, and Open Questions

### Confirmed problems

| Severity | Problem | Evidence |
|----------|---------|----------|
| 🔴 Critical | Missing supervisor ownership checks on start/complete/timeline endpoints | [`task_router.py:360,391,423`](../projojo_backend/routes/task_router.py:360) — uses `Depends(get_token_payload)` without ownership verification |
| 🔴 High | Frontend duplicate-registration precheck always fails | [`ProjectTasks.jsx:108`](../projojo_frontend/src/components/ProjectTasks.jsx:108) — `Array.includes()` comparing string against objects |
| 🔴 High | Accept timestamp in separate transaction with swallowed error | [`task_repository.py:420-437`](../projojo_backend/domain/repositories/task_repository.py:420) |
| 🔴 High | Subtask system documented as implemented but completely absent | [`GEBRUIKERSSCENARIOS_V1.md`](GEBRUIKERSSCENARIOS_V1.md) and [`ROADMAP.md`](ROADMAP.md) vs codebase |
| 🟠 Medium-High | No transition validation on start/complete (can complete without start, can re-complete) | [`task_repository.py:552,575`](../projojo_backend/domain/repositories/task_repository.py:552) |
| 🟠 Medium-High | No task deletion endpoint | Full codebase review — no `DELETE /tasks/{task_id}` route |
| 🟠 Medium-High | Cancel endpoint lacks `@auth` decorator | [`task_router.py:207`](../projojo_backend/routes/task_router.py:207) |
| 🟡 Medium | Task name/description length not validated | [`task_router.py:234,292`](../projojo_backend/routes/task_router.py:234) — no `is_valid_length()` calls |
| 🟡 Medium | `total_needed` accepts 0 or negative | [`task.py:11`](../projojo_backend/domain/models/task.py:11) — no minimum constraint |
| 🟡 Medium | `task.status` referenced in TaskCard but never populated by backend | [`TaskCard.jsx:54`](../projojo_frontend/src/components/TaskCard.jsx:54) |
| 🟡 Medium | Race condition on capacity check | [`task_router.py:162-177`](../projojo_backend/routes/task_router.py:162) |
| 🟡 Medium | Notification promise in UI is a lie | [`Task.jsx:88`](../projojo_frontend/src/components/Task.jsx:88) |

### Likely problems

- Stale dashboard data after registration state changes (context not refreshed)
- `is_accepted` field could be returned as an array from TypeDB in registration queries, breaking strict equality checks
- Double API call for student registrations on dashboard load (dashboard + context)
- Tasks from archived projects still accessible via direct task endpoints

### Open questions

- Whether TypeDB's `update` for `startedAt`/`completedAt` replaces or appends when the attribute already exists
- Whether the frontend uses `markTaskStarted()` or `markTaskCompleted()` from any page other than the Task component (no other usage found)
- Whether the `TaskCard.jsx` `status` field is ever populated by any intermediary code not found in the review
- How the system should handle a student who is accepted but whose task's project gets archived while they are working

---

## 10. Recommendations

### Highest priority (correctness/security)

1. **Lock down lifecycle endpoints** — Apply `@auth(role="supervisor", owner_id_key="task_id")` to [`mark_registration_started()`](../projojo_backend/routes/task_router.py:360), [`mark_registration_completed()`](../projojo_backend/routes/task_router.py:391), and protect [`get_registration_timeline()`](../projojo_backend/routes/task_router.py:423) with at least an `@auth(role="authenticated")` and appropriate scoping.

2. **Fix frontend duplicate-registration check** — In [`ProjectTasks.jsx:108`](../projojo_frontend/src/components/ProjectTasks.jsx:108), change `currentRegistrations.includes(task.id)` to `currentRegistrations.some(r => r.id === task.id)`.

3. **Merge accept timestamp into single transaction** — Combine `isAccepted`, `response`, and `acceptedAt` into one write transaction in [`task_repository.py:395-437`](../projojo_backend/domain/repositories/task_repository.py:395). Remove the `except Exception: pass`.

4. **Add `@auth(role="student")` to cancel endpoint** — Replace raw `Depends(get_token_payload)` at [`task_router.py:207`](../projojo_backend/routes/task_router.py:207).

### High priority (data integrity)

5. **Add transition validation** — In [`mark_registration_started()`](../projojo_backend/domain/repositories/task_repository.py:552), require that `startedAt` is not already set and `completedAt` is not set. In [`mark_registration_completed()`](../projojo_backend/domain/repositories/task_repository.py:575), require that `startedAt` is set and `completedAt` is not already set.

6. **Add task name/description validation** — Call `is_valid_length()` in create and update task endpoints to match project/business validation standards.

7. **Add `total_needed >= 1` validation** — In the [`TaskCreate`](../projojo_backend/domain/models/task.py:50) model or in the create/update endpoints.

### Medium priority (product quality)

8. **Add task delete endpoint** — `DELETE /tasks/{task_id}` for supervisors (owned tasks only) and teachers, with cascade deletion of registrations and appropriate warnings.

9. **Remove or update false notification promises** — Either implement registration-lifecycle notifications or remove the "Je ontvangt bericht zodra de organisatie reageert" text from [`Task.jsx:88`](../projojo_frontend/src/components/Task.jsx:88).

10. **Correct documentation mismatches** — Update [`ROADMAP.md`](ROADMAP.md) and [`GEBRUIKERSSCENARIOS_V1.md`](GEBRUIKERSSCENARIOS_V1.md) to mark the subtask system as ❌ not implemented. Update [`NEXT-UI-BRANCH-ANALYSIS.md`](NEXT-UI-BRANCH-ANALYSIS.md) to characterize the task changes as an evolution, not a new feature.

11. **Address `TaskCard.jsx` status rendering** — Either add a backend-computed `status` field to the task response, or remove the status rendering from [`TaskCard.jsx`](../projojo_frontend/src/components/TaskCard.jsx:6) since it currently shows stale/default values.

### Lower priority (architecture improvement)

12. **Eliminate redundant `createdAt`/`requestedAt` on registration** — Use only one timestamp for registration creation.

13. **Add task-level archive capability** — Add an `isArchived` optional attribute to the task entity for independent task lifecycle management.

14. **Optimize duplicate-registration check** — Replace the full `get_student_registrations()` call in registration creation with a targeted existence check query.

15. **Deduplicate registration fetching** — Have `StudentDashboard` use `StudentWorkContext` data instead of independently calling `getStudentRegistrations()`.

---

*This audit is based on direct code evidence from the `next-ui` branch and the referenced documentation, with confirmed findings grounded in the cited source files.*
