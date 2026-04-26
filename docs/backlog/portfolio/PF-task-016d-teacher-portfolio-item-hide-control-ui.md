# PF-task-016d — Teacher Portfolio Item Hide Control UI

**Phase**: 5 — Frontend Integration and UX Preservation  
**Epic**: Portfolio Frontend Integration  
**Priority**: 🔴 Critical  
**Type**: Functional Task (Frontend / Moderation)  
**Spec references**: [Portfolio spec §3.7](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:218), [Phase 5 tasks](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:752)  
**Current-state references**: [`PortfolioItem`](../../../projojo_frontend/src/components/PortfolioItem.jsx:14)  
**Dependencies**: [PF-task-011b](PF-task-011b-teacher-portfolio-item-soft-hide-and-precedence.md), [PF-task-015](PF-task-015-authenticated-portfolio-ui-completed-only.md), [PF-task-020](PF-task-020-portfolio-settings-and-curation-services.md)

---

## Task Story

As a **teacher moderating portfolio evidence**,  
I want a teacher-only hide control on portfolio items,  
so that I can remove problematic evidence from normal views without exposing moderation controls to students or supervisors.

---

## Acceptance Criteria

### AC-1: Teacher hide control is available only to teachers

**Given** a teacher views a student's authenticated portfolio  
**When** item moderation controls render  
**Then** the teacher can soft-hide an item  
**And** students and supervisors cannot see the teacher hide control.

### AC-2: Hide action calls teacher soft-hide service

**Given** a teacher triggers the hide control  
**When** the action is confirmed or submitted  
**Then** the UI calls the teacher soft-hide service from [PF-task-020](PF-task-020-portfolio-settings-and-curation-services.md)  
**And** the UI updates according to the backend response.

### AC-3: Hidden state is reflected after successful hide

**Given** the teacher hide request succeeds  
**When** the portfolio view refreshes or updates  
**Then** the item is removed from normal views or shown with appropriate teacher-only feedback if the API returns such state  
**And** no hard-delete success message is shown.

### AC-4: Hide failure is shown safely

**Given** the teacher hide request fails  
**When** the API returns an error  
**Then** the UI displays an error message  
**And** the item remains visible in the current view until the backend confirms a state change.

### AC-5: Moderation control is accessible

**Given** the teacher hide control is interactive  
**When** operated by keyboard or screen reader  
**Then** the action has clear labeling, visible focus state, and understandable confirmation/error copy.

---

## Implementation Notes

- Student owner curation controls are handled by [PF-task-016c](PF-task-016c-portfolio-item-owner-curation-controls-ui.md).
- Teacher-hide precedence is enforced by [PF-task-011b](PF-task-011b-teacher-portfolio-item-soft-hide-and-precedence.md); the frontend must not attempt to override it.

---

## Ambiguities and Defaults

- **Ambiguity**: Whether a teacher can see hidden items in a future admin context is not specified.  
  **Default**: This task only implements the normal portfolio hide action and post-action feedback.

---

## Test Expectations

- Browser tests must cover teacher-only control visibility, successful hide flow, no hard-delete copy, hide failure handling, and accessibility.

