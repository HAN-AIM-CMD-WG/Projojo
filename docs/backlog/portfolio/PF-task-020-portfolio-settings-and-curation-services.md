# PF-task-020 — Frontend Portfolio Settings and Curation Services

**Phase**: 5 — Frontend Integration and UX Preservation  
**Epic**: Portfolio Frontend Integration  
**Priority**: 🔴 Critical  
**Type**: Technical Task (Frontend API Wiring)  
**Spec references**: [Portfolio spec Phase 5](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:748), [§4.1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:255), [§3.7](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:218)  
**Current-state references**: [`services.js`](../../../projojo_frontend/src/services.js:1), [`StudentPortfolio`](../../../projojo_frontend/src/components/StudentPortfolio.jsx:14), [`PortfolioItem`](../../../projojo_frontend/src/components/PortfolioItem.jsx:14)  
**Dependencies**: [PF-task-007c](PF-task-007c-student-authenticated-public-retraction-api.md), [PF-task-010](PF-task-010-student-summary-slug-and-public-settings.md), [PF-task-011a](PF-task-011a-student-item-ordering-hide-show-and-world-visible-selection.md), [PF-task-011b](PF-task-011b-teacher-portfolio-item-soft-hide-and-precedence.md), [PF-task-012a](PF-task-012a-student-review-world-public-selection-api.md), [PF-task-014](PF-task-014-portfolio-service-layer-and-data-wiring.md)

---

## Task Story

As a **frontend developer**,  
I want focused mutation services for portfolio settings and curation APIs,  
so that owner controls can save changes without mixing read-service logic, lifecycle completion, or review submission behavior.

---

## Acceptance Criteria

### AC-1: Portfolio settings service exists

**Given** the owner student updates summary, slug, or public page setting  
**When** the UI saves changes  
**Then** a service calls the portfolio settings endpoint from [PF-task-010](PF-task-010-student-summary-slug-and-public-settings.md)  
**And** validation errors for slug format, duplicate slug, summary length, and unauthorized access are propagated to the UI.

### AC-2: Item curation service exists

**Given** the owner student changes display order, hidden state, or world-visible item selection  
**When** the UI saves item changes  
**Then** a service calls the item curation endpoint from [PF-task-011a](PF-task-011a-student-item-ordering-hide-show-and-world-visible-selection.md)  
**And** the UI can refresh from the returned portfolio item state or handle optimistic update rollback.

### AC-3: Authenticated-public retraction service exists

**Given** authenticated-public retraction is implemented in [PF-task-007c](PF-task-007c-student-authenticated-public-retraction-api.md)  
**When** the owner student toggles supervisor visibility for an item  
**Then** a service calls the same item mutation endpoint or documented equivalent  
**And** the returned state distinguishes retracted, low-rated, hidden, and retired visibility reasons.

### AC-4: Review world-visibility service exists

**Given** the owner student selects or deselects a review for world-public display  
**When** the UI saves the change  
**Then** a service calls the review visibility endpoint from [PF-task-012a](PF-task-012a-student-review-world-public-selection-api.md)  
**And** unauthorized or validation errors are surfaced without changing local UI state incorrectly.

### AC-5: Teacher soft-hide service exists

**Given** a teacher hides a portfolio item for moderation or correction  
**When** the teacher hide control submits  
**Then** a service calls the teacher soft-hide endpoint from [PF-task-011b](PF-task-011b-teacher-portfolio-item-soft-hide-and-precedence.md)  
**And** the response updates hidden-state badges and removes the item from normal views where appropriate.

---

## Implementation Notes

- Keep these mutation services thin; backend APIs own visibility, authorization, validation, and state precedence.
- Do not add lifecycle completion review fields here. Completion and review submission services are handled by [PF-task-021a](PF-task-021a-lifecycle-completion-review-form-ui.md), [PF-task-021b](PF-task-021b-additional-review-creation-ui.md), and [PF-task-021c](PF-task-021c-review-editing-ui.md).
- Preserve documented field names from [PF-task-003](PF-task-003-authenticated-portfolio-api-baseline.md), [PF-task-007d](PF-task-007d-authenticated-portfolio-response-contract-examples.md), and [PF-task-013](PF-task-013-world-public-portfolio-api-and-route.md).

---

## Ambiguities and Defaults

- **Ambiguity**: Whether mutation endpoints return the whole portfolio, the updated item, or only status is not specified.  
  **Default**: Prefer returning the updated resource plus enough visibility metadata for the UI to refresh without reimplementing backend rules.

---

## Test Expectations

- Browser tests should verify these services through owner settings, item curation, review visibility, authenticated-public retraction, and teacher hide flows.
