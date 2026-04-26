# PF-task-007b — Supervisor Authenticated-Public Item Filtering

**Phase**: 3 — Authenticated Portfolio Read Model and Review Management  
**Epic**: Authenticated Portfolio Visibility  
**Priority**: 🔴 Critical  
**Type**: Functional Task (API / Security)  
**Spec references**: [Portfolio spec §3.6.2](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:177), [Phase 3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:668), [ADR-005](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:400)  
**Current-state references**: [`PortfolioRepository.get_student_portfolio()` mixed source](../../../projojo_backend/domain/repositories/portfolio_repository.py:307)  
**Dependencies**: [PF-task-007a](PF-task-007a-authenticated-portfolio-read-access-matrix.md), [PF-task-005](PF-task-005-completion-creates-portfolio-item-and-review.md), [PF-task-006](PF-task-006-revert-and-recompletion-behavior.md)

---

## Task Story

As a **relationship-gated supervisor**,  
I want authenticated portfolio results to include only items that are eligible for supervisor visibility,  
so that I can evaluate relevant completed work without seeing hidden, retired, retracted, or low-rated evidence.

---

## Why This Must Change

- The specification requires item-level authenticated-public rules after the supervisor relationship gate passes.
- Rating edits must dynamically remove or restore supervisor item visibility.

---

## Acceptance Criteria

### AC-1: Student and teacher private views include all normal items

**Given** a student or teacher requests an authenticated portfolio  
**When** items are non-retired and non-hidden  
**Then** those items and their reviews are returned  
**And** ratings and authenticated-public retraction do not filter the private view.

### AC-2: Related supervisor sees eligible items only

**Given** a supervisor passes the portfolio relationship gate  
**When** the supervisor requests the portfolio  
**Then** only items that are not retired, not hidden, not authenticated-public retracted, and not low-rated are returned  
**And** reviews are returned only for items visible to that supervisor.

### AC-3: Item with no ratings remains supervisor-visible

**Given** an item has no ratings  
**When** it is not hidden, not retired, and not retracted  
**Then** it is visible to a relationship-gated supervisor.

### AC-4: Rating below three removes supervisor visibility

**Given** an item has any rating below 3  
**When** a relationship-gated supervisor requests the portfolio  
**Then** that item is excluded immediately  
**And** the response does not reveal the hidden item's low-rating details.

### AC-5: Rating edits can restore supervisor visibility

**Given** an item was excluded because of a rating below 3  
**When** ratings are edited so every rating is 3 or higher  
**Then** the item returns to supervisor authenticated-public visibility  
**And** it remains excluded if the student has retracted authenticated-public visibility.

### AC-6: Hidden and retired items are excluded from normal views

**Given** an item is hidden or retired  
**When** student, teacher, or supervisor normal portfolio views are requested  
**Then** the item is excluded  
**And** hidden or retired visibility in a future admin context is not part of this task.

---

## Implementation Notes

- Keep low-rating exclusion API-level; do not rely on frontend filtering.
- Authenticated-public retraction mutation is handled by [PF-task-007c](PF-task-007c-student-authenticated-public-retraction-api.md). Review rating edits are handled by [PF-task-008](PF-task-008-review-creation-and-editing.md).

---

## Ambiguities and Defaults

- **Ambiguity**: The simplification option in [Portfolio spec §3.6.4](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:211) is not currently chosen.  
  **Default**: Implement the full rating-gated authenticated-public model until product confirms simplification.

---

## Test Expectations

- API tests must cover private student/teacher views, supervisor filtered view, no-rating visibility, low-rating exclusion, rating restoration, hidden item exclusion, and retired item exclusion.

