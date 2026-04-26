# PF-task-013 — World-Public Portfolio API and Minimal Frontend Route Shell

**Phase**: 4 — Student Curation and World-Public Portfolio  
**Epic**: World-Public Portfolio  
**Priority**: 🔴 Critical  
**Type**: Functional Task (API / Routing)  
**Spec references**: [Portfolio spec §3.6.3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:197), [§4.2](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:265), [Phase 4](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:707)  
**Current-state references**: [`App.jsx` public route list](../../../projojo_frontend/src/App.jsx:214), [`/publiek` routes](../../../projojo_frontend/src/App.jsx:268), [`PublicDiscoveryPage`](../../../projojo_frontend/src/pages/PublicDiscoveryPage.jsx:18)  
**Dependencies**: [PF-task-010](PF-task-010-student-summary-slug-and-public-settings.md), [PF-task-011a](PF-task-011a-student-item-ordering-hide-show-and-world-visible-selection.md), [PF-task-011b](PF-task-011b-teacher-portfolio-item-soft-hide-and-precedence.md), [PF-task-012a](PF-task-012a-student-review-world-public-selection-api.md)

---

## Task Story

As a **unauthenticated public visitor**,  
I want to view a student's published portfolio by vanity slug,  
so that I can see only the work and reviews the student intentionally made public.

---

## Acceptance Criteria

### AC-1: Public slug API returns no data when page is private

**Given** a portfolio slug exists but the student has not enabled world-public page visibility  
**When** an unauthenticated visitor calls [`GET /portfolio/{slug}`](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:269) or the implemented equivalent  
**Then** the response is not found or not public  
**And** no summary, item, or review data is returned.

### AC-2: Public slug API returns summary-only page

**Given** a student enabled world-public page visibility and has no world-visible items  
**When** an unauthenticated visitor requests the slug  
**Then** the response succeeds  
**And** it returns student-safe public identity fields and portfolio summary only.

### AC-3: Public slug API returns selected items only

**Given** a student has enabled the public page and selected some items as world-visible  
**When** the slug is requested  
**Then** only selected, non-hidden, non-retired items are returned  
**And** authenticated-public rating rules do not remove selected items from world-public output.

### AC-4: Public slug API returns selected reviews only

**Given** selected public items have multiple reviews  
**When** the slug is requested  
**Then** only reviews explicitly selected as world-visible are returned  
**And** reviews on non-public items are not returned even if the review flag is true.

### AC-5: Unknown slug returns no data

**Given** no student owns a slug  
**When** an unauthenticated visitor requests that slug  
**Then** the response is not found  
**And** no information about existing students or slug suggestions is leaked.

### AC-6: Frontend route is treated as public chrome

**Given** a visitor navigates to `/portfolio/{slug}`  
**When** the React app renders the route  
**Then** it does not require authentication  
**And** it uses a minimal public route shell or smoke page without authenticated navbar/footer, matching the route behavior described in [Portfolio spec §4.2](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:271).

### AC-7: Public response contract is documented by example

**Given** the final public page UI depends on a safe unauthenticated response shape  
**When** the world-public API is implemented  
**Then** Pydantic-compatible field inventories or sample JSON document published summary-only, selected-item, selected-review, private-slug, and unknown-slug responses  
**And** the examples identify which authenticated-only fields must never appear in public responses.

---

## Implementation Notes

- Do not reuse [`PublicDiscoveryPage`](../../../projojo_frontend/src/pages/PublicDiscoveryPage.jsx:18) unless the resulting UI remains clearly portfolio-focused and does not confuse portfolios with project discovery.
- The route must be added to [`App.jsx`](../../../projojo_frontend/src/App.jsx:236) and included in the public page detection at [`App.jsx`](../../../projojo_frontend/src/App.jsx:214).
- This task owns the API contract and minimal unauthenticated route shell needed for Phase 4 smoke testing. Final public page layout, styling, empty states, accessibility, and content rendering are owned by [PF-task-017](PF-task-017-public-portfolio-page-ui.md).

---

## Ambiguities and Defaults

- **Ambiguity**: Exact public student identity fields are not specified.  
  **Default**: Return only display name and summary unless product confirms additional public fields.

---

## Test Expectations

- API tests must cover private-by-default, summary-only public page, selected item visibility, selected review visibility, and unknown slug behavior.
- Browser smoke tests must verify the public vanity route renders without authentication. Full public page rendering tests are covered by [PF-task-017](PF-task-017-public-portfolio-page-ui.md).
