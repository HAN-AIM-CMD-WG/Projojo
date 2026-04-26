# PF-task-011a — Student Item Ordering, Hide/Show, and World-Visible Selection

**Phase**: 4 — Student Curation and World-Public Portfolio  
**Epic**: Student Portfolio Curation  
**Priority**: 🔴 Critical  
**Type**: Functional Task (API)  
**Spec references**: [Portfolio spec §3.7](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:218), [§4.1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:255), [Phase 4](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:707)  
**Current-state references**: [`delete_portfolio_item()` obsolete delete behavior](../../../projojo_backend/routes/student_router.py:214), [`PortfolioItem` lacks curation controls](../../../projojo_frontend/src/components/PortfolioItem.jsx:14)  
**Dependencies**: [PF-task-007b](PF-task-007b-supervisor-authenticated-public-item-filtering.md), [PF-task-007c](PF-task-007c-student-authenticated-public-retraction-api.md), [PF-task-010](PF-task-010-student-summary-slug-and-public-settings.md)

---

## Task Story

As a **student curating my portfolio**,  
I want to order, hide or show, and select my portfolio items for world-public visibility,  
so that I control how completed work is presented to authenticated and public audiences.

---

## Acceptance Criteria

### AC-1: Student can update display order

**Given** a student owns multiple non-retired portfolio items  
**When** the student updates an item's display order through [`PATCH /portfolios/me/items/{item_id}`](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:261) or the implemented equivalent  
**Then** the order is saved  
**And** portfolio responses return items in the student's configured order where applicable.

### AC-2: Student can hide own item

**Given** a student owns a portfolio item  
**When** the student sets hidden state  
**Then** the item is excluded from normal portfolio views for student, teacher, supervisor, and world-public viewers  
**And** the old delete endpoint is not used for normal curation.

### AC-3: Student can show own student-hidden item

**Given** a student previously hid their own portfolio item  
**When** the student clears the student-hidden state  
**Then** showing the item restores normal visibility according to other rules  
**And** it does not override teacher-hidden state from [PF-task-011b](PF-task-011b-teacher-portfolio-item-soft-hide-and-precedence.md).

### AC-4: Student can set item world-visible flag

**Given** the student owns a non-retired, non-hidden item  
**When** the student marks it world-visible  
**Then** the item becomes eligible for world-public page output  
**And** it appears publicly only when the portfolio page itself is world-public.

### AC-5: Unauthorized item curation is denied

**Given** a supervisor, unrelated student, teacher acting outside teacher-hide behavior, or unauthenticated visitor attempts to update student-owned item curation  
**When** the curation endpoint is called  
**Then** the request is denied  
**And** the item remains unchanged.

---

## Implementation Notes

- Replace delete behavior with soft-hide and visibility controls; do not preserve [`delete_portfolio_item()`](../../../projojo_backend/routes/student_router.py:214) as normal curation.
- Authenticated-public retraction is owned by [PF-task-007c](PF-task-007c-student-authenticated-public-retraction-api.md). Teacher hide is owned by [PF-task-011b](PF-task-011b-teacher-portfolio-item-soft-hide-and-precedence.md).

---

## Ambiguities and Defaults

- **Ambiguity**: Exact order conflict handling is not specified.  
  **Default**: Persist explicit display order and return deterministic ordering for ties.

---

## Test Expectations

- API tests must cover owner ordering, owner hide/show, world-visible item eligibility, unauthorized update denial, and inability to override teacher-hidden state.

