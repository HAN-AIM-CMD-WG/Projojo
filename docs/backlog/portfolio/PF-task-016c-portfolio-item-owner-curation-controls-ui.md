# PF-task-016c — Portfolio Item Owner Curation Controls UI

**Phase**: 5 — Frontend Integration and UX Preservation  
**Epic**: Portfolio Frontend Integration  
**Priority**: 🔴 Critical  
**Type**: Functional Task (Frontend)  
**Spec references**: [Portfolio spec §3.7](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:218), [Phase 5 tasks](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:752)  
**Current-state references**: [`PortfolioItem`](../../../projojo_frontend/src/components/PortfolioItem.jsx:14), [`StudentPortfolio`](../../../projojo_frontend/src/components/StudentPortfolio.jsx:14)  
**Dependencies**: [PF-task-011a](PF-task-011a-student-item-ordering-hide-show-and-world-visible-selection.md), [PF-task-012a](PF-task-012a-student-review-world-public-selection-api.md), [PF-task-015](PF-task-015-authenticated-portfolio-ui-completed-only.md), [PF-task-020](PF-task-020-portfolio-settings-and-curation-services.md)

---

## Task Story

As a **student curating portfolio evidence**,  
I want owner-only controls for item and review visibility,  
so that I can manage how each completed work item is presented without exposing controls to other viewers.

---

## Acceptance Criteria

### AC-1: Owner student can edit item curation controls

**Given** the logged-in user owns the portfolio  
**When** they view item controls  
**Then** they can change display order, hide/show state, authenticated-public retraction, and item world-visible selection  
**And** controls call the new service functions from [PF-task-020](PF-task-020-portfolio-settings-and-curation-services.md).

### AC-2: Owner student can select review world visibility

**Given** the owner views reviews on a non-hidden item  
**When** they toggle a review for world-public display  
**Then** the UI saves the selection  
**And** it makes clear that selected reviews are public only when the item and page are public.

### AC-3: Supervisor view has no unavailable controls

**Given** a relationship-gated supervisor views a portfolio  
**When** item cards render  
**Then** curation controls, world-public toggles, hide controls, and order controls are not shown  
**And** the view remains readable as a portfolio presentation.

### AC-4: Other non-owner viewers cannot use owner controls

**Given** a teacher, other student, or unauthenticated visitor views a portfolio surface where owner controls are not permitted  
**When** item cards render  
**Then** owner-only curation controls are not available  
**And** backend authorization errors are surfaced safely if a stale UI state attempts a forbidden save.

### AC-5: Curation controls are accessible and not cluttered

**Given** owner curation controls are added to item cards  
**When** operated by keyboard or screen reader  
**Then** labels, focus states, and error messages are usable  
**And** advanced controls are grouped to avoid overwhelming the card.

---

## Implementation Notes

- Do not implement teacher hide controls here; they are handled by [PF-task-016d](PF-task-016d-teacher-portfolio-item-hide-control-ui.md).
- Do not implement reviewer-facing submission forms here; they are handled by [PF-task-021a](PF-task-021a-lifecycle-completion-review-form-ui.md), [PF-task-021b](PF-task-021b-additional-review-creation-ui.md), and [PF-task-021c](PF-task-021c-review-editing-ui.md).

---

## Ambiguities and Defaults

- **Ambiguity**: Exact control placement is open.  
  **Default**: Place edit controls in expanded details and keep collapsed cards presentation-focused.

---

## Test Expectations

- Browser tests must cover owner item curation, review visibility toggles, supervisor read-only view, non-owner control absence, validation errors, and keyboard access.

