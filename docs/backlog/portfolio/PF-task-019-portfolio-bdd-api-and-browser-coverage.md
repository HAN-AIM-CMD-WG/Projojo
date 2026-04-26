# PF-task-019 — Portfolio BDD API and Browser Coverage

**Phase**: All Portfolio Phases — Automated Gate Support  
**Epic**: Portfolio Readiness  
**Priority**: 🔴 Critical  
**Type**: Technical Task (BDD / E2E Testing)  
**Spec references**: [Portfolio spec §9](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:825), [ADR-008](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:424), [Phase gates](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:623)  
**Current-state references**: [`tests/e2e/features`](../../../tests/e2e/features:1), [`infrastructure.steps.cjs`](../../../tests/e2e/steps/infrastructure.steps.cjs:104), [`qavajs.config.cjs`](../../../tests/e2e/qavajs.config.cjs:1), [`api-memory.feature`](../../../tests/e2e/features/api-memory.feature:1)  
**Dependencies**: [SF-task-005](../shared-foundation/SF-task-005-cross-epic-automated-test-gate.md), staged dependencies on each Portfolio implementation task

---

## Task Story

As a **developer implementing Portfolio**,  
I want BDD-friendly API and browser tests for every portfolio phase,  
so that security, lifecycle, visibility, and public sharing behavior cannot regress silently.

---

## Acceptance Criteria

### AC-1: Required feature files exist

**Given** Portfolio testing work is complete  
**When** the feature directory is inspected  
**Then** feature coverage exists for portfolio auth, lifecycle, reviews, visibility, public portfolio, and portfolio-archiving integration  
**And** the coverage maps to the required feature list in [Portfolio spec §9](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:829).

### AC-2: Authorization denial cases are covered

**Given** the E2E test suite runs  
**When** portfolio authorization tests execute  
**Then** they cover student owner access, other-student denial, teacher access, related supervisor access, unrelated supervisor denial, and unauthenticated denial for authenticated endpoints.

### AC-3: Lifecycle transition cases are covered

**Given** the E2E test suite runs  
**When** lifecycle tests execute  
**Then** they cover valid start, invalid start, valid completion, completion before start rejection, repeated transition rejection, student mutation denial, supervisor ownership denial, revert completion, revert start, and re-completion new item identity.

### AC-4: Review and rating cases are covered

**Given** the E2E test suite runs  
**When** review tests execute  
**Then** they cover supervisor completion review required, teacher review optional, additional review permissions, review edit permissions, rating validation, notice acceptance, and rating-gate recalculation.

### AC-5: Visibility and curation cases are covered

**Given** the E2E test suite runs  
**When** visibility tests execute  
**Then** they cover student/teacher private view, supervisor authenticated-public view, hidden item exclusion, retired item exclusion, authenticated-public retraction, low-rating exclusion, and rating restoration behavior.

### AC-6: World-public cases are covered

**Given** the E2E test suite runs  
**When** public portfolio tests execute  
**Then** they cover private-by-default slug, duplicate slug rejection, summary-only public page, selected item visibility, selected review visibility, non-selected review exclusion, unknown slug, and browser rendering of the public vanity route.

### AC-7: Archiving integration cases are covered

**Given** the E2E test suite runs  
**When** portfolio-archiving integration tests execute  
**Then** they prove source archiving does not remove portfolio evidence  
**And** hard-delete and hard-delete-only snapshot routes do not return successful target behavior.

### AC-8: Step definitions remain declarative

**Given** portfolio step definitions are added  
**When** feature files are reviewed  
**Then** steps use business language and avoid brittle implementation details  
**And** API helper steps reuse response status and memory patterns from [`infrastructure.steps.cjs`](../../../tests/e2e/steps/infrastructure.steps.cjs:104).

### AC-9: Coverage is delivered as phase gates, not one final test dump

**Given** Portfolio implementation is split across Phases 1 through 6  
**When** a phase implementation task is marked complete  
**Then** the matching BDD/API/browser scenarios for that phase are already added and passing  
**And** this task tracks which feature files and tags belong to each phase gate.

---

## Phase-Gated Coverage Slices

| Phase | Minimum coverage before phase is complete | Primary feature files |
| --- | --- | --- |
| 1 — Backend/schema baseline | stale endpoint removal, authenticated portfolio access matrix, private-by-default public slug, schema/seed fixture availability | `portfolio-auth.feature`, `portfolio-public.feature` |
| 2 — Lifecycle and item creation | valid/invalid start and completion, role denial, review-required rules, atomic completion side effects, revert, re-completion new item identity | `portfolio-lifecycle.feature`, `portfolio-reviews.feature` |
| 3 — Authenticated read/reviews | student/teacher private view, related supervisor filtered view, unrelated supervisor denial, rating gate, rating restoration, authenticated-public retraction mutation, additional review creation, review editing, archived-source metadata | `portfolio-visibility.feature`, `portfolio-reviews.feature`, `portfolio-archiving-integration.feature` |
| 4 — World-public curation/API | slug uniqueness, summary update, private-by-default, summary-only public page, item world-visible selection, review world-visible selection, reviewer notice enforcement, minimal public route smoke | `portfolio-public.feature`, `portfolio-reviews.feature` |
| 5 — Frontend integration | completed-only authenticated UI, owner curation controls, reviewer forms and notice UI, supervisor read-only view, public portfolio page rendering, keyboard accessibility smoke checks | `portfolio-visibility.feature`, `portfolio-public.feature` |
| 6 — Cross-epic readiness | full suite, hard-delete absence, source archiving survival, Theme/SDG source display compatibility, stale snapshot documentation cleanup evidence | `portfolio-archiving-integration.feature` plus full `task test:e2e` suite |

Each implementation task should reference the applicable slice above or include equivalent test expectations in its own `Test Expectations` section.

---

## Implementation Notes

- This task supports all phases and should be implemented incrementally: each phase adds the scenarios needed for that phase's gate.
- Do not write tests that encode stale current behavior when it conflicts with the specification.
- Keep acceptance criteria in task files precise, but developers own the final executable BDD scenario wording.

---

## Ambiguities and Defaults

- **Ambiguity**: Exact test user IDs and fixture names depend on seed implementation.  
  **Default**: Use deterministic aliases from the seed contract rather than hardcoding generated IDs in feature files.

---

## Test Expectations

- This task is complete only when the feature coverage provides phase gates and can be run through [`task test:e2e`](../../TESTING_INFRASTRUCTURE.md:93).
