# PF-task-016a — Portfolio Item Review and Rating Display UI

**Phase**: 5 — Frontend Integration and UX Preservation  
**Epic**: Portfolio Frontend Integration  
**Priority**: 🔴 Critical  
**Type**: Functional Task (Frontend)  
**Spec references**: [Portfolio spec §3.5](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:145), [Phase 5 tasks](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:752)  
**Current-state references**: [`PortfolioItem`](../../../projojo_frontend/src/components/PortfolioItem.jsx:14), [`StudentPortfolio`](../../../projojo_frontend/src/components/StudentPortfolio.jsx:14)  
**Dependencies**: [PF-task-008](PF-task-008-review-creation-and-editing.md), [PF-task-014](PF-task-014-portfolio-service-layer-and-data-wiring.md), [PF-task-015](PF-task-015-authenticated-portfolio-ui-completed-only.md)

---

## Task Story

As a **portfolio viewer**,  
I want portfolio item cards to show permitted reviews and ratings,  
so that completed work includes credible feedback without exposing reviews hidden by backend visibility rules.

---

## Acceptance Criteria

### AC-1: Reviews and ratings render on expanded item

**Given** a portfolio item has reviews returned by the backend  
**When** the viewer expands the item card  
**Then** each visible review shows reviewer role/name where permitted, review text, rating if present, and review timestamp  
**And** reviews hidden by backend visibility rules are not rendered.

### AC-2: Items without reviews render cleanly

**Given** a portfolio item has no reviews visible to the current viewer  
**When** the item details render  
**Then** the UI shows an appropriate empty review state or omits the review section without broken spacing  
**And** it does not imply private reviews exist.

### AC-3: Rating display handles optional ratings

**Given** a review has no rating  
**When** the review renders  
**Then** the UI does not show an invalid or zero rating  
**And** rated reviews still show their one-through-five rating clearly.

### AC-4: Review display is accessible

**Given** reviews and ratings are rendered  
**When** accessed by keyboard or screen reader  
**Then** review sections have clear labels, rating text is announced meaningfully, and focus behavior remains usable.

---

## Implementation Notes

- Do not implement review creation or editing forms here; those are handled by [PF-task-021b](PF-task-021b-additional-review-creation-ui.md) and [PF-task-021c](PF-task-021c-review-editing-ui.md).
- Use backend-provided review visibility; do not reconstruct hidden review rules in the frontend.

---

## Ambiguities and Defaults

- **Ambiguity**: Exact reviewer identity fields may vary by viewer role.  
  **Default**: Render only fields returned by the authenticated portfolio response contract.

---

## Test Expectations

- Browser tests must cover visible review rendering, optional rating display, no-review state, and absence of reviews excluded by backend visibility.

