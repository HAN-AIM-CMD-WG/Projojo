# PF-task-021b — Additional Review Creation UI

**Phase**: 5 — Frontend Integration and UX Preservation  
**Epic**: Portfolio Frontend Integration  
**Priority**: 🔴 Critical  
**Type**: Functional Task (Frontend / API Wiring)  
**Spec references**: [Portfolio spec §3.5](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:145), [§4.4](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:291), [Phase 5](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:748)  
**Current-state references**: [`PortfolioItem`](../../../projojo_frontend/src/components/PortfolioItem.jsx:14), [`StudentPortfolio`](../../../projojo_frontend/src/components/StudentPortfolio.jsx:14)  
**Dependencies**: [PF-task-008](PF-task-008-review-creation-and-editing.md), [PF-task-012b](PF-task-012b-reviewer-public-use-notice-enforcement.md), [PF-task-016a](PF-task-016a-portfolio-item-review-and-rating-display-ui.md)

---

## Task Story

As a **teacher or same-business supervisor**,  
I want to add an additional review from a permitted portfolio item view,  
so that completed work can collect credible feedback after initial completion.

---

## Acceptance Criteria

### AC-1: Additional review creation UI is available to allowed reviewers

**Given** a teacher or same-business supervisor views a non-retired, non-hidden portfolio item  
**When** they have permission to add an additional review  
**Then** the UI shows a review creation form with review text, optional rating, and notice acceptance  
**And** unauthorized users do not see unavailable review creation controls.

### AC-2: Review text is required

**Given** an allowed reviewer opens the additional review form  
**When** they attempt to submit missing or whitespace-only review text  
**Then** the UI blocks submission or displays the backend validation error  
**And** no optimistic success state is shown.

### AC-3: Rating input handles optional one-through-five semantics

**Given** a reviewer enters a rating during additional review creation  
**When** the value is below 1, above 5, non-integer, or empty  
**Then** the UI and service handle it consistently with backend validation  
**And** optional empty rating remains distinct from invalid rating.

### AC-4: Public-review notice is displayed and explicitly accepted

**Given** a reviewer submits additional review text  
**When** the form is displayed  
**Then** it includes concise Dutch copy explaining that the student may later publish the review on a public portfolio page  
**And** the reviewer must explicitly accept the notice before submission.

### AC-5: Successful review creation refreshes item reviews

**Given** an allowed reviewer submits a valid additional review  
**When** the API confirms creation  
**Then** the item review display refreshes or updates from backend state  
**And** any visibility metadata affected by the new rating is refreshed from the backend.

---

## Implementation Notes

- Place additional-review controls in expanded portfolio item details where permission allows.
- Do not expose student-only curation controls to reviewers.

---

## Ambiguities and Defaults

- **Ambiguity**: Exact location of additional review forms is not specified.  
  **Default**: Place additional-review controls in expanded portfolio item details.

---

## Test Expectations

- Browser tests must cover allowed reviewer controls, unauthorized control absence, required text, rating validation, notice acceptance, successful creation, and visibility refresh.

