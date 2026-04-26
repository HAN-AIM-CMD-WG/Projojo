# PF-task-021a — Lifecycle Completion Review Form UI

**Phase**: 5 — Frontend Integration and UX Preservation  
**Epic**: Portfolio Frontend Integration  
**Priority**: 🔴 Critical  
**Type**: Functional Task (Frontend / API Wiring)  
**Spec references**: [Portfolio spec §3.4](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:118), [§3.5](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:145), [§4.3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:273), [Phase 5](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:748)  
**Current-state references**: [`markTaskCompleted()`](../../../projojo_frontend/src/services.js:899), [`markTaskStarted()`](../../../projojo_frontend/src/services.js:887)  
**Dependencies**: [PF-task-004](PF-task-004-registration-lifecycle-api-and-state-machine.md), [PF-task-005](PF-task-005-completion-creates-portfolio-item-and-review.md), [PF-task-012b](PF-task-012b-reviewer-public-use-notice-enforcement.md), [PF-task-014](PF-task-014-portfolio-service-layer-and-data-wiring.md)

---

## Task Story

As a **teacher or owning-business supervisor completing a registration**,  
I want the completion UI to collect required review fields, optional rating, and public-use notice acceptance,  
so that completion creates portfolio evidence safely and with clear reviewer consent.

---

## Acceptance Criteria

### AC-1: Completion service accepts review payload fields

**Given** a teacher or owning-business supervisor completes a started registration  
**When** the frontend calls the completion endpoint  
**Then** the service can send `reviewText`, optional `rating`, and `publicReviewNoticeAccepted` according to [PF-task-005](PF-task-005-completion-creates-portfolio-item-and-review.md)  
**And** validation errors from missing supervisor review text, invalid rating, or missing notice acceptance are shown to the reviewer.

### AC-2: Supervisor completion form requires review text

**Given** an owning-business supervisor opens the completion form  
**When** they attempt to complete without non-empty review text  
**Then** the UI blocks submission or displays the backend validation error clearly  
**And** no misleading portfolio item success state is shown.

### AC-3: Teacher completion form supports optional review text

**Given** a teacher opens the completion form  
**When** they complete without review text  
**Then** the UI allows submission  
**And** review notice acceptance is required only when review text is submitted.

### AC-4: Rating input handles optional one-through-five semantics

**Given** a reviewer enters a rating during completion  
**When** the value is below 1, above 5, non-integer, or empty  
**Then** the UI and service handle it consistently with backend validation  
**And** optional empty rating remains distinct from invalid rating.

### AC-5: Public-review notice is displayed and explicitly accepted when needed

**Given** a reviewer submits review text during completion  
**When** the form is displayed  
**Then** it includes concise Dutch copy explaining that the student may later publish the review on a public portfolio page  
**And** the reviewer must explicitly accept the notice before the review text is submitted.

### AC-6: Completion form is accessible

**Given** the completion review form is interactive  
**When** operated by keyboard or screen reader  
**Then** labels, validation errors, focus states, and submission feedback are usable.

---

## Implementation Notes

- Add completion review fields to the existing lifecycle completion surface.
- Additional review creation and review editing UI are handled by [PF-task-021b](PF-task-021b-additional-review-creation-ui.md) and [PF-task-021c](PF-task-021c-review-editing-ui.md).

---

## Ambiguities and Defaults

- **Ambiguity**: Exact location of completion forms in the existing UI is not specified.  
  **Default**: Add completion review fields to the existing lifecycle completion surface where completion is currently triggered.

---

## Test Expectations

- Browser tests must cover supervisor completion review-required behavior, teacher review-optional behavior, rating validation, notice acceptance, backend validation errors, and accessible operation.

