# PF-task-008 — Additional Review Creation and Review Editing

**Phase**: 3 — Authenticated Portfolio Read Model and Review Management  
**Epic**: Portfolio Reviews  
**Priority**: 🔴 Critical  
**Type**: Functional Task (API)  
**Spec references**: [Portfolio spec §3.5](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:145), [§4.4](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:291), [Phase 3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:668)  
**Current-state references**: [`PortfolioRepository` lacks review model](../../../projojo_backend/domain/repositories/portfolio_repository.py:1), [`schema.tql` lacks portfolioReview](../../../projojo_backend/db/schema.tql:145)  
**Dependencies**: [PF-task-005](PF-task-005-completion-creates-portfolio-item-and-review.md), [PF-task-007b](PF-task-007b-supervisor-authenticated-public-item-filtering.md), [PF-task-012b](PF-task-012b-reviewer-public-use-notice-enforcement.md)

---

## Task Story

As a **teacher or same-business supervisor**,  
I want to add and edit portfolio reviews within permission rules,  
so that completed work can collect credible feedback after initial completion.

---

## Why This Must Change

- The current portfolio model has no review entity or review editing rules.
- The specification requires additional authenticated reviews, author editing, teacher editing, rating validation, and visibility recalculation after rating edits.

---

## Acceptance Criteria

### AC-1: Teacher can add additional review

**Given** a portfolio item is non-retired and not hidden  
**When** a teacher calls [`POST /portfolio-items/{item_id}/reviews`](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:295) or the implemented equivalent with review text  
**Then** the review is created  
**And** it is associated with the portfolio item and teacher author.

### AC-2: Same-business supervisor can add additional review

**Given** a supervisor is associated with the same business as the portfolio item's source business  
**When** the supervisor submits a valid review  
**Then** the review is created  
**And** unrelated supervisors are denied.

### AC-3: Review text is required for additional reviews

**Given** an additional review request  
**When** review text is missing or whitespace-only  
**Then** the API rejects the request  
**And** no review is persisted.

### AC-4: Rating validation applies to review creation

**Given** an additional review request includes a rating  
**When** the rating is outside integer 1 through 5  
**Then** the API rejects the request  
**And** no review is persisted.

### AC-5: Public review notice is required

**Given** a reviewer submits review text  
**When** public-review notice acceptance is missing or false  
**Then** the API rejects the request  
**And** the persisted review must include notice acceptance timestamp when accepted.

### AC-6: Review author can edit own review

**Given** a review author is authenticated  
**When** they call [`PATCH /portfolio-reviews/{review_id}`](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:296) or the implemented equivalent with valid changes  
**Then** the review text and/or rating is updated  
**And** updated timestamp is changed.

### AC-7: Teacher can edit any review

**Given** a teacher is authenticated  
**When** they edit any portfolio review  
**Then** the update succeeds if validation passes  
**And** the response identifies that teacher-level edit permission was used if audit fields are available.

### AC-8: Unauthorized review edit is denied

**Given** a supervisor who is not the review author and not a teacher  
**When** they attempt to edit a review  
**Then** the API rejects the request  
**And** the review remains unchanged.

### AC-9: Rating edits trigger visibility recalculation

**Given** a review rating is added, removed, or changed  
**When** the item's ratings now include any rating below 3 or all ratings are 3 or higher  
**Then** authenticated-public visibility is recalculated immediately according to [Portfolio spec §3.6.2](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:177).

---

## Implementation Notes

- Review edit history is not required by the current specification; store latest text/rating unless product confirms history.
- Review world-public selection is handled by [PF-task-012a](PF-task-012a-student-review-world-public-selection-api.md).

---

## Ambiguities and Defaults

- **Ambiguity**: Review edit history is listed as an open question.  
  **Default**: Store only latest review text/rating plus updated timestamp.

---

## Test Expectations

- API tests must cover additional review creation permissions, edit permissions, invalid ratings, public notice persistence, and rating-gate recalculation.
