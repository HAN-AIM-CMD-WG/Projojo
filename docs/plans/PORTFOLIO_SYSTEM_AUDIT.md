# Portfolio System Audit — Product, Architecture & Implementation Review

**Date**: 23 March 2026
**Branch**: `next-ui`
**Scope**: Full-stack audit of the portfolio feature across TypeDB schema, backend (FastAPI/Python), and frontend (React)
**Method**: Code-backed analysis using the existing business rules docs as starting point, then validating against actual implementation

---

## Overall Verdict

**Verdict: weak-to-moderate concept, partial implementation, inconsistent product design, and several serious integrity/authorization gaps.**

The portfolio system is **not a fake feature**: it does have a real backend model, real retrieval API, real UI surfaces, and a real preservation mechanism for completed work during project deletion. The strongest part is the basic "completed work survives project deletion" idea implemented through [`PortfolioRepository.create_snapshot()`](../projojo_backend/domain/repositories/portfolio_repository.py:10) and the unified retrieval endpoint in [`get_student_portfolio()`](../projojo_backend/routes/student_router.py:160).

But as a **product feature**, it is still immature. It behaves more like a timeline/reporting layer over task registrations than a well-thought-through portfolio domain. Important portfolio expectations from the docs and from normal user expectations are either absent or only half-implemented: no public portfolio, no privacy controls, no review system, no endorsements, no export/portability, no curation, no evidence attachments, no portfolio-specific summaries, and no user-facing delete flow for snapshots despite a backend delete endpoint.

As an **architecture**, it is workable for an MVP, but the feature is built on top of registration timestamps instead of a clear portfolio lifecycle model. That creates semantic leakage between task execution, project archiving, and portfolio presentation.

As an **implementation**, there are some good ideas, but also multiple confirmed problems:
- supervisors can complete or start registrations **without ownership enforcement** in [`mark_registration_completed()`](../projojo_backend/routes/task_router.py:391) and [`mark_registration_started()`](../projojo_backend/routes/task_router.py:360)
- supervisors can view **any** student portfolio, despite comments claiming scope limitation, in [`get_student_portfolio()`](../projojo_backend/routes/student_router.py:160)
- project deletion is likely **internally inconsistent** because [`delete_project()`](../projojo_backend/domain/repositories/project_repository.py:677) deletes [`containsTask`](../projojo_backend/db/schema.tql:116) relations before trying to delete tasks
- portfolio sorting is probably wrong for active items because [`get_student_portfolio()`](../projojo_backend/domain/repositories/portfolio_repository.py:349) sorts with `reverse=True` while active items use priority tuple `(0, date)` and completed items use `(1, date)`
- frontend labels and filters conflict with actual source types in [`PortfolioList`](../projojo_frontend/src/components/PortfolioList.jsx:36) and [`StudentPortfolio`](../projojo_frontend/src/components/StudentPortfolio.jsx:141)
- the UI exposes portfolio as "voltooide taken", while the backend intentionally includes **active** items too in [`PortfolioRepository.get_student_portfolio()`](../projojo_backend/domain/repositories/portfolio_repository.py:307)

### Quality Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Product quality | 5/10 | Meaningful first step, but not yet a convincing "portfolio system" for this app's stated ambition |
| Architecture quality | 6/10 | Reasonable MVP layering, but portfolio is too coupled to registration lifecycle and under-modeled as a domain |
| Implementation quality | 4/10 | Several good UI ideas and a real backend, but multiple high-severity correctness/security gaps |
| Business-rule coherence | 4/10 | The core rule "completed work survives deletion" is coherent; the broader rule set is not fully thought through |

---

## Table of Contents

- [1. Implemented Feature Set](#1-implemented-feature-set)
- [2. Business Rules vs Implementation](#2-business-rules-vs-implementation)
- [3. Feature Completeness — Expected but Missing](#3-feature-completeness--expected-but-missing)
- [4. Interactions with Existing App Functionality](#4-interactions-with-existing-app-functionality)
- [5. Implementation Correctness](#5-implementation-correctness)
- [6. Implementation Robustness](#6-implementation-robustness)
- [7. Database and Schema Integration](#7-database-and-schema-integration)
- [8. Documentation vs Implementation Mismatches](#8-documentation-vs-implementation-mismatches)
- [9. Confirmed, Likely, and Open Questions](#9-confirmed-likely-and-open-questions)
- [10. Recommendations](#10-recommendations)

---

## 1. Implemented Feature Set

### A. Unified portfolio endpoint

The backend returns a merged portfolio from three sources:
- active accepted tasks via [`get_active_portfolio_items()`](../projojo_backend/domain/repositories/portfolio_repository.py:220)
- completed live tasks via [`get_live_portfolio_items()`](../projojo_backend/domain/repositories/portfolio_repository.py:133)
- deletion snapshots via [`get_snapshots_by_student()`](../projojo_backend/domain/repositories/portfolio_repository.py:84)

These are merged by [`get_student_portfolio()`](../projojo_backend/domain/repositories/portfolio_repository.py:307). The route is [`GET /students/{student_id}/portfolio`](../projojo_backend/routes/student_router.py:160).

### B. Snapshot preservation on hard delete

Teacher-only hard delete in [`delete_project()`](../projojo_backend/routes/project_router.py:379) creates portfolio snapshots for completed task registrations via [`get_completed_tasks_by_project()`](../projojo_backend/domain/repositories/project_repository.py:564) and [`create_snapshot()`](../projojo_backend/domain/repositories/portfolio_repository.py:10).

### C. Profile-integrated portfolio UI

Portfolio is shown on the student profile page in [`ProfilePage`](../projojo_frontend/src/pages/ProfilePage.jsx:76) through [`StudentPortfolio`](../projojo_frontend/src/components/StudentPortfolio.jsx:14).

### D. Dashboard-integrated portfolio UI

Student dashboard also embeds [`StudentPortfolio`](../projojo_frontend/src/pages/StudentDashboard.jsx:135), so the same feature appears both on dashboard and profile.

### E. Two portfolio visualizations

- List view via [`PortfolioList`](../projojo_frontend/src/components/PortfolioList.jsx:15)
- Roadmap/timeline view via [`PortfolioRoadmap`](../projojo_frontend/src/components/PortfolioRoadmap.jsx:13)

### F. Per-item details and navigation

[`PortfolioItem`](../projojo_frontend/src/components/PortfolioItem.jsx:14) shows business, project, task, skills, and timeline. Live non-archived items can link back to the project via [`Link`](../projojo_frontend/src/components/PortfolioItem.jsx:178). The roadmap also navigates to projects via [`handleItemClick()`](../projojo_frontend/src/components/PortfolioRoadmap.jsx:302).

### G. Registration timeline as source of portfolio state

Task lifecycle timestamps are stored on [`registersForTask`](../projojo_backend/db/schema.tql:129): `requestedAt`, `acceptedAt`, `startedAt`, `completedAt`.

### H. Task progress transitions that feed portfolio

- Start transition via [`PATCH /tasks/{task_id}/registrations/{student_id}/start`](../projojo_backend/routes/task_router.py:360)
- Complete transition via [`PATCH /tasks/{task_id}/registrations/{student_id}/complete`](../projojo_backend/routes/task_router.py:391)
- Timeline read via [`GET /tasks/{task_id}/registrations/{student_id}/timeline`](../projojo_backend/routes/task_router.py:423)

### I. Snapshot deletion endpoint

Backend supports deleting snapshots only in [`DELETE /students/{student_id}/portfolio/{portfolio_id}`](../projojo_backend/routes/student_router.py:214), backed by [`delete_snapshot()`](../projojo_backend/domain/repositories/portfolio_repository.py:353).

---

## 2. Business Rules vs Implementation

### Rule: Completed work should survive project deletion

**Status:** ✅ Confirmed and substantially implemented

**Evidence:**
- docs claim snapshot preservation in [C-009](BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md#c-009-project-hard-delete-restricted-to-teacher-and-portfolio-snapshotting)
- teacher-only hard delete in [`delete_project()`](../projojo_backend/routes/project_router.py:396)
- snapshot creation loop in [`delete_project()`](../projojo_backend/routes/project_router.py:417)
- snapshot schema in [`portfolioItem`](../projojo_backend/db/schema.tql:145) and [`hasPortfolio`](../projojo_backend/db/schema.tql:153)

**Assessment:** This is the strongest rule in the system. It is real, coherent, and user-meaningful.

**Caveat:** The preservation only covers a thin JSON snapshot of project/task/skill/timeline fields in [`create_snapshot()`](../projojo_backend/domain/repositories/portfolio_repository.py:35). There is no immutable verification object, no review, no assessor identity, and no source-of-truth reference beyond copied strings and IDs.

---

### Rule: Portfolio should represent verified student work

**Status:** ⚠️ Only partially implemented and semantically weak

The product language suggests "verified work portfolio" in [`ECOSYSTEEM_STRATEGIE.md`](ECOSYSTEEM_STRATEGIE.md), but implementation equates "portfolio-worthy" with "registration has `completedAt`".

**Evidence:**
- completion is set directly in [`mark_registration_completed()`](../projojo_backend/domain/repositories/task_repository.py:575)
- no review entity in current schema despite docs expecting it in [`USER_STORIES_PORTFOLIO.md`](USER_STORIES_PORTFOLIO.md)
- no endorsement model in schema or frontend

**Why it matters:**
- User-facing impact: a portfolio item looks like verified evidence, but it is really just "someone with the right role marked the registration completed."
- Technical impact: portfolio truth is not separated from operational task state.

**Recommendation:** Add an explicit portfolio verification model or completion review model rather than deriving portfolio value solely from `completedAt`.

---

### Rule: Only authorized actors should see/manage a portfolio

**Status:** 🔴 Partially implemented, with confirmed authorization defects

#### Confirmed problem: Supervisors can view portfolios too broadly

The route comment says supervisors should only access portfolios of students working on their projects, but the code does not enforce that.

**Evidence:**
- comment in [`get_student_portfolio()`](../projojo_backend/routes/student_router.py:178)
- actual checks only block students from viewing others and otherwise allow any non-student role in [`get_student_portfolio()`](../projojo_backend/routes/student_router.py:183)

**Severity:** 🔴 High

**Recommendation:** Use [`@auth()`](../projojo_backend/auth/permissions.py:17) with ownership logic, or explicitly check supervisor access against project/task associations before returning the portfolio.

#### Confirmed problem: Supervisors can mark completion without ownership checks

[`mark_registration_completed()`](../projojo_backend/routes/task_router.py:391) uses `Depends(get_token_payload)`, not `@auth(role="supervisor", owner_id_key="task_id")`, and performs **no project/business ownership validation**.

Same issue for [`mark_registration_started()`](../projojo_backend/routes/task_router.py:360) and [`get_registration_timeline()`](../projojo_backend/routes/task_router.py:423).

**Severity:** 🔴 Critical

**Why it matters:**
- User-facing impact: one supervisor may be able to mark another company's student-task relation started/completed.
- Technical impact: portfolio integrity becomes untrustworthy because unauthorized actors may create portfolio-visible state.

**Recommendation:** Apply `@auth(role="supervisor", owner_id_key="task_id")` or an equivalent explicit ownership check on all registration progression endpoints.

---

## 3. Feature Completeness — Expected but Missing

### What is good enough for an MVP

- portfolio data exists in backend and schema
- completed work can appear in UI
- deleted project work can survive as a snapshot
- archived and deleted contexts are distinguished
- timeline view is richer than a trivial list

### Expected-but-missing subfeatures

| # | Subfeature | Severity | Evidence |
|---|-----------|----------|----------|
| A | **No public portfolio** | 🔴 High product gap | Docs explicitly expect public sharing in [`US-004`](USER_STORIES_PORTFOLIO.md) and [`STU-006`](USER_STORIES_STUDENT.md). No `/portfolio/{student_id}` route exists in [`App.jsx`](../projojo_frontend/src/App.jsx:235). |
| B | **No privacy/visibility controls** | 🔴 High product/privacy gap | Docs expect a privacy toggle in [`US-004`](USER_STORIES_PORTFOLIO.md). No schema field, no route, and no UI control for portfolio visibility. |
| C | **No reviews** | 🔴 High | Docs expect review flow in [`ROADMAP.md`](ROADMAP.md) and [`USER_STORIES_PORTFOLIO.md`](USER_STORIES_PORTFOLIO.md). No `review` entity exists in [`schema.tql`](../projojo_backend/db/schema.tql), and no frontend review UI exists. |
| D | **No endorsements or verified skills** | 🟠 Medium-High | Strategy docs mention endorsements and verified skills in [`ECOSYSTEEM_STRATEGIE.md`](ECOSYSTEEM_STRATEGIE.md). No portfolio-linked endorsement implementation. |
| E | **No portfolio curation** | 🟡 Medium | No title override, reflection, attachments, highlights, evidence links, tags, custom ordering, or hide/show per item. |
| F | **No export/portability** | 🟡 Medium | Strategy docs mention portability in [`ECOSYSTEEM_STRATEGIE.md`](ECOSYSTEEM_STRATEGIE.md). No export endpoint or UI. |
| G | **No user-facing snapshot deletion flow** | 🟡 Medium | Backend supports deleting snapshots in [`delete_portfolio_item()`](../projojo_backend/routes/student_router.py:214), but frontend has no delete action in any portfolio component. |

---

## 4. Interactions with Existing App Functionality

### Coherent interactions

| Interaction | Assessment |
|-------------|------------|
| Project hard deletion → snapshot preservation | Coherent and product-valuable. [`delete_project()`](../projojo_backend/routes/project_router.py:379) queries affected students and snapshots before deleting. |
| Student profile → portfolio section | [`ProfilePage`](../projojo_frontend/src/pages/ProfilePage.jsx:76) embeds [`StudentPortfolio`](../projojo_frontend/src/components/StudentPortfolio.jsx:14). Sensible. |
| Student dashboard → portfolio overview | [`StudentDashboard`](../projojo_frontend/src/pages/StudentDashboard.jsx:135) embeds `StudentPortfolio`. |

### Weak or conflicting interactions

#### A. Portfolio duplicates dashboard work-state concepts

The portfolio backend intentionally mixes active and completed items in [`get_student_portfolio()`](../projojo_backend/domain/repositories/portfolio_repository.py:307), while the UI copy frames the portfolio as completed work.

**Evidence:**
- active items are returned by [`get_active_portfolio_items()`](../projojo_backend/domain/repositories/portfolio_repository.py:220)
- empty state says "voltooide taken" in [`StudentPortfolio`](../projojo_frontend/src/components/StudentPortfolio.jsx:67)
- header says "Portfolio" with counts that include active items

**Severity:** 🟡 Medium

**Recommendation:** Either make portfolio completed-only and move active items to dashboard/workflow views, or formally rename the feature to something like "Werkoverzicht & portfolio".

#### B. Archive semantics conflict with project discovery semantics

The app treats projects as archived based on end date in [`ProjectDetailsPage`](../projojo_frontend/src/pages/ProjectDetailsPage.jsx:70), but portfolio uses explicit `isArchived` from backend for live items. This can distort portfolio labels.

**Severity:** 🟡 Medium

#### C. Project navigation from portfolio snapshots is inconsistent

Snapshot items preserve `source_project_id`, but if the project is deleted, handling is inconsistent:
- item detail hides the "Bekijk" button for snapshots in [`PortfolioItem`](../projojo_frontend/src/components/PortfolioItem.jsx:178)
- roadmap still shows a button if `project_id` exists in [`PortfolioRoadmap`](../projojo_frontend/src/components/PortfolioRoadmap.jsx:621)

**Severity:** 🟡 Medium

**Recommendation:** Use an explicit `can_navigate_to_project` flag from backend rather than inferring from IDs.

---

## 5. Implementation Correctness

### 5.1 🔴 Critical — Missing ownership enforcement on start/complete/timeline

**Evidence:**
- [`mark_registration_started()`](../projojo_backend/routes/task_router.py:360)
- [`mark_registration_completed()`](../projojo_backend/routes/task_router.py:391)
- [`get_registration_timeline()`](../projojo_backend/routes/task_router.py:423)

These use raw token payload and role checks only. They do not verify the acting supervisor owns the task or business.

**Why it matters:** This can directly corrupt portfolio-visible truth.

**Recommendation:** Protect them with `@auth()` and `owner_id_key="task_id"`, or explicitly check task ownership before state mutation.

### 5.2 🔴 High — Supervisor portfolio access scope is broader than documented

**Evidence:** The route docstring claims supervisor scoping in [`student_router.py`](../projojo_backend/routes/student_router.py:178), but the implementation only blocks students from viewing others.

**Recommendation:** Align code to docs or rewrite docs to match intentional policy.

### 5.3 🔴 High — Likely broken task deletion during project hard delete

In [`delete_project()`](../projojo_backend/domain/repositories/project_repository.py:710), `containsTask` relations are deleted before the code tries to delete tasks through those same relations.

**Why it matters:** Tasks may survive as orphaned entities after project deletion.

**Recommendation:** Delete tasks before deleting `containsTask`, or match tasks directly by IDs collected earlier.

### 5.4 🔴 High — Portfolio ordering logic appears inverted

[`get_student_portfolio()`](../projojo_backend/domain/repositories/portfolio_repository.py:324) intends active items first, but sort tuples use `(0, date)` for active and `(1, date)` for completed, then call `sort(..., reverse=True)`.

That likely places completed items before active ones.

**Recommendation:** Either remove `reverse=True` and invert date values, or use a clearer two-key comparator.

### 5.5 🟡 Medium — Portfolio counts and labels are semantically inconsistent

`completed_count` in [`student_router.py`](../projojo_backend/routes/student_router.py:206) counts only `source_type == "live"`, excluding snapshots. But from a user perspective, snapshots are also completed work.

[`PortfolioList`](../projojo_frontend/src/components/PortfolioList.jsx:108) says "voltooide taken" while the underlying item set can include `active` items.

**Recommendation:** Return separate counts such as `active_count`, `completed_live_count`, `completed_snapshot_count`, `completed_total_count`.

### 5.6 🟡 Medium — Roadmap labels accepted date as "Gestart"

In tooltip rendering, [`PortfolioRoadmap`](../projojo_frontend/src/components/PortfolioRoadmap.jsx:558) labels `accepted_at` as "Gestart", even though a real `started_at` exists.

**User-facing impact:** Timeline lies about when work started.

### 5.7 🟡 Medium — List filter labels do not match source types

In [`PortfolioList`](../projojo_frontend/src/components/PortfolioList.jsx:36), filter `live` shows non-archived live items, but the button label is "Actief". That is wrong: live completed items are not active tasks.

**Recommendation:** Rename filters to something like "Alles / Voltooid / Gearchiveerd / Archiefsnapshots" or include a true `active` filter.

### 5.8 🟡 Medium — Student-facing portfolio delete is backend-only

[`delete_portfolio_item()`](../projojo_backend/routes/student_router.py:214) exists, but no delete UI exists. Documented GDPR/privacy delete capability is not exposed as a workflow.

---

## 6. Implementation Robustness

### Null and empty-state handling

**Mostly decent in UI:**
- [`StudentPortfolio`](../projojo_frontend/src/components/StudentPortfolio.jsx:47) handles empty state
- [`PortfolioList`](../projojo_frontend/src/components/PortfolioList.jsx:196) handles no-results state
- [`PortfolioRepository.get_snapshots_by_student()`](../projojo_backend/domain/repositories/portfolio_repository.py:128) skips malformed snapshot JSON

### Robustness issues

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| A | **Snapshot deletion can delete someone else's snapshot if caller is teacher** | 🔴 High | [`delete_portfolio_item()`](../projojo_backend/routes/student_router.py:214) does not verify the snapshot belongs to the `student_id` path param before deleting. |
| B | **Start/complete transitions are not idempotent-safe or transition-safe** | 🔴 High | [`mark_registration_started()`](../projojo_backend/domain/repositories/task_repository.py:552) and [`mark_registration_completed()`](../projojo_backend/domain/repositories/task_repository.py:575) simply write timestamps for any accepted registration. Missing checks: already started, already completed, completed before started, rejected registration, task outside valid date window. |
| C | **Completion does not require prior start** | 🟠 Medium-High | The completion query only requires `has isAccepted true`; it does not require `startedAt`. |
| D | **Response/reason fields are unused in portfolio semantics** | 🟢 Low | Students and supervisors can exchange acceptance/rejection reasoning, but portfolio ignores all qualitative context. |
| E | **Notification promises are misleading** | 🟡 Medium | Both archive and delete flows present notification language in [`ProjectActionModal`](../projojo_frontend/src/components/ProjectActionModal.jsx:89), but backend has TODO/no-op in [`project_router.py`](../projojo_backend/routes/project_router.py:272) and [`notification_service.py`](../projojo_backend/service/notification_service.py:19) has `email_enabled = False`. |
| F | **Potential duplicate snapshot creation on retry** | 🟡 Medium | No deduplication logic in [`create_snapshot()`](../projojo_backend/domain/repositories/portfolio_repository.py:10). |

---

## 7. Database and Schema Integration

### Strengths

- Portfolio is represented explicitly in schema via [`portfolioItem`](../projojo_backend/db/schema.tql:145) and [`hasPortfolio`](../projojo_backend/db/schema.tql:153)
- Registration relation timeline fields are a reasonable source for MVP history
- Archived/public/date fields on projects support better portfolio context

### Weaknesses

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| A | **Snapshot payload is denormalized JSON blobs** | 🟡 Medium | `portfolioItem` stores `projectSnapshot`, `taskSnapshot`, `skillsSnapshot`, and `timelineSnapshot` as strings. No field-level validation, no queryability over snapshot subfields, weak migration story. |
| B | **No snapshot versioning** | 🟡 Medium | There is no `snapshotVersion` field. |
| C | **No review/verification structure in schema** | 🔴 High product-model gap | Given the stated product vision, portfolio lacks first-class domain concepts for review, verification, endorsements, or evidence. |
| D | **Performance is acceptable now, but query fan-out will grow** | 🟢 Low-Medium | Both live and active portfolio queries join student → registration → task → project → business and nested skills fetches. |
| E | **Migration risk** | 🟡 Medium | The portfolio feature depends on several schema additions. Partial deployment or stale data could produce inconsistent UI. |

---

## 8. Documentation vs Implementation Mismatches

| # | Mismatch | Docs say | Code does |
|---|----------|----------|-----------|
| A | Portfolio implementation status | Docs such as [`ROADMAP.md`](ROADMAP.md) describe "voltooide taken op profiel" as not yet implemented | Current branch has [`StudentPortfolio`](../projojo_frontend/src/components/StudentPortfolio.jsx:14) integrated in [`ProfilePage`](../projojo_frontend/src/pages/ProfilePage.jsx:76) |
| B | Supervisor-scoped access | [`BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md`](BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md) documents scope limitation | Code does not enforce per-business scoping in [`get_student_portfolio()`](../projojo_backend/routes/student_router.py:160) |
| C | Notifications around archive/delete | Modal copy in [`ProjectActionModal`](../projojo_frontend/src/components/ProjectActionModal.jsx:89) promises notifications | Backend has TODO/disabled notifications in [`project_router.py`](../projojo_backend/routes/project_router.py:272) and [`notification_service.py`](../projojo_backend/service/notification_service.py:19) |
| D | Public portfolio and privacy toggle | [`USER_STORIES_PORTFOLIO.md`](USER_STORIES_PORTFOLIO.md) expects public URL and privacy controls | Routes in [`App.jsx`](../projojo_frontend/src/App.jsx:235) have no public portfolio route |
| E | Portfolio is completed work | Docs treat portfolio as completed work | Backend intentionally includes active items via [`get_active_portfolio_items()`](../projojo_backend/domain/repositories/portfolio_repository.py:220) |

---

## 9. Confirmed, Likely, and Open Questions

### Confirmed problems

| Severity | Problem | Evidence |
|----------|---------|----------|
| 🔴 Critical | Missing supervisor ownership checks on start/complete/timeline endpoints | [`task_router.py`](../projojo_backend/routes/task_router.py:360) |
| 🔴 High | Supervisors can view portfolios too broadly | [`student_router.py`](../projojo_backend/routes/student_router.py:160) |
| 🔴 High | Likely broken hard-delete task cleanup order | [`project_repository.py`](../projojo_backend/domain/repositories/project_repository.py:677) |
| 🔴 High | Snapshot delete does not verify student-item linkage | [`student_router.py`](../projojo_backend/routes/student_router.py:214) |
| 🔴 High | No public portfolio despite explicit product requirement | [`USER_STORIES_PORTFOLIO.md`](USER_STORIES_PORTFOLIO.md) |
| 🟡 Medium | Portfolio/list labeling inconsistent with returned data | [`PortfolioList`](../projojo_frontend/src/components/PortfolioList.jsx:21) |
| 🟡 Medium | Roadmap tooltip uses accepted date as started date | [`PortfolioRoadmap`](../projojo_frontend/src/components/PortfolioRoadmap.jsx:558) |
| 🟡 Medium | Notification UX promises exceed real delivery | [`ProjectActionModal`](../projojo_frontend/src/components/ProjectActionModal.jsx:89) |
| 🟡 Medium | Backend delete endpoint for snapshots has no frontend workflow | [`student_router.py`](../projojo_backend/routes/student_router.py:214) |

### Likely problems

- duplicate snapshots on retry/failure race around deletion
- orphaned tasks after hard delete if TypeDB delete ordering behaves strictly as queried
- confusing portfolio ordering because sort logic appears inverted
- user misunderstanding caused by mixing active work into portfolio while all copy says completed work

### Open questions

- whether TypeDB `update` semantics replace or append repeated `startedAt`/`completedAt` values in all cases
- whether frontend uses [`markTaskStarted()`](../projojo_frontend/src/services.js:846) or [`markTaskCompleted()`](../projojo_frontend/src/services.js:858) anywhere in UI components (no evidence surfaced)
- whether project delete failure after snapshot creation is rolled back by infrastructure; code itself does not show transactionality across the full multi-step flow

---

## 10. Recommendations

### Highest priority

1. **Lock down authorization**
   - Apply ownership checks to [`mark_registration_started()`](../projojo_backend/routes/task_router.py:360), [`mark_registration_completed()`](../projojo_backend/routes/task_router.py:391), and [`get_registration_timeline()`](../projojo_backend/routes/task_router.py:423).

2. **Fix supervisor portfolio visibility**
   - Implement the policy claimed in [`student_router.py`](../projojo_backend/routes/student_router.py:178) or reduce access to student self + teacher only.

3. **Fix hard-delete cleanup order**
   - Rework [`delete_project()`](../projojo_backend/domain/repositories/project_repository.py:677) to avoid orphan tasks.

4. **Fix portfolio semantics**
   - Decide whether portfolio includes only completed items or also active work; then align backend counts, UI copy, filters, and stats.

5. **Fix timeline correctness**
   - Use `started_at` where the UI says "Gestart", not `accepted_at`.

### Next priority

6. **Add snapshot ownership validation**
   - Ensure `portfolio_id` belongs to `student_id` before deletion.

7. **Expose or remove snapshot delete flow**
   - Add a deliberate UI for privacy deletion, or remove the endpoint until the workflow is defined.

8. **Add explicit transition validation**
   - Prevent invalid start/complete operations in [`TaskRepository`](../projojo_backend/domain/repositories/task_repository.py:552).

9. **Version snapshot payloads**
   - Add schema/version info to future-proof [`portfolioItem`](../projojo_backend/db/schema.tql:145).

### Product roadmap priority

10. **Implement real portfolio features**
    - public portfolio route
    - privacy controls
    - review/verification system
    - endorsements/verified skills
    - export/shareability
    - optional reflection/evidence attachments

---

*This audit is based on direct code evidence from the `next-ui` branch and the referenced documentation, with confirmed findings grounded in the cited source files.*
