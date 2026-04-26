# PF-task-021c — Review Editing UI

**Phase**: 5 — Frontend Integration and UX Preservation  
**Epic**: Portfolio Frontend Integration  
**Priority**: 🔴 Critical  
**Type**: Functional Task (Frontend / API Wiring)  
**Spec references**: [Portfolio spec §3.5](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:145), [§4.4](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:291), [Phase 5](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:748)  
**Current-state references**: [`PortfolioItem`](../../../projojo_frontend/src/components/PortfolioItem.jsx:14)  
**Dependencies**: [PF-task-008](PF-task-008-review-creation-and-editing.md), [PF-task-016a](PF-task-016a-portfolio-item-review-and-rating-display-ui.md), [PF-task-016b](PF-task-016b-portfolio-item-visibility-badges-and-explanations-ui.md)

---

## Task Story

As a **review author or teacher**,  
I want to edit review text or rating through permitted UI controls,  
so that review feedback can be corrected while keeping visibility rules accurate.

---

## Acceptance Criteria

### AC-1: Review editing controls follow permissions

**Given** a review author or teacher views an editable review  
**When** the review renders  
**Then** edit controls are available  
**And** unauthorized users do not see edit controls and cannot update the review through the UI.

### AC-2: Review edit form supports text and rating changes

**Given** an authorized reviewer edits a review  
**When** they change review text, rating, or both  
**Then** the UI calls the review editing service from [PF-task-008](PF-task-008-review-creation-and-editing.md)  
**And** successful changes update the review display from backend state.

### AC-3: Rating input handles optional one-through-five semantics

**Given** a reviewer enters a rating during review editing  
**When** the value is below 1, above 5, non-integer, or empty  
**Then** the UI and service handle it consistently with backend validation  
**And** optional empty rating remains distinct from invalid rating.

### AC-4: Rating changes refresh visibility explanation

**Given** a rating edit changes whether an item is visible to relationship-gated supervisors  
**When** the update succeeds  
**Then** the frontend refreshes or updates the item visibility reason  
**And** it does not rely on client-only rating calculations as the source of truth.

### AC-5: Edit validation and failure states are clear

**Given** a review edit request fails validation or authorization  
**When** the API returns an error  
**Then** the UI displays the error clearly  
**And** the previous review display is preserved unless the backend confirms a change.

---

## Implementation Notes

- Review edit history is not required by the current specification; the UI should display the latest backend state.
- Do not implement additional review creation here; that is handled by [PF-task-021b](PF-task-021b-additional-review-creation-ui.md).

---

## Ambiguities and Defaults

- **Ambiguity**: Exact edit control placement is not specified.  
  **Default**: Place edit controls alongside each review in expanded portfolio item details when permission allows.

---

## Test Expectations

- Browser tests must cover author edit, teacher edit, unauthorized edit control absence, rating validation, failed edit handling, and visibility refresh after rating edits.

