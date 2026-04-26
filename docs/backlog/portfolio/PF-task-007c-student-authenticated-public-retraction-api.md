# PF-task-007c — Student Authenticated-Public Retraction API

**Phase**: 3 — Authenticated Portfolio Read Model and Review Management  
**Epic**: Authenticated Portfolio Visibility  
**Priority**: 🔴 Critical  
**Type**: Functional Task (API / Curation)  
**Spec references**: [Portfolio spec §3.6.2](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:177), [§3.7](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:218), [§4.1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:255), [Phase 3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:668)  
**Current-state references**: [`delete_portfolio_item()` obsolete delete behavior](../../../projojo_backend/routes/student_router.py:214)  
**Dependencies**: [PF-task-007a](PF-task-007a-authenticated-portfolio-read-access-matrix.md), [PF-task-007b](PF-task-007b-supervisor-authenticated-public-item-filtering.md)

---

## Task Story

As a **student**,  
I want to retract or restore an item from authenticated-public supervisor visibility,  
so that I can control whether otherwise eligible completed work is shown to relationship-gated supervisors.

---

## Why This Must Change

- The visibility model distinguishes authenticated-public supervisor visibility from private owner/teacher views and world-public selection.
- Retraction is a student curation control that must be enforced by the backend, not by frontend filtering.

---

## Acceptance Criteria

### AC-1: Student can retract authenticated-public visibility

**Given** an item would otherwise pass supervisor authenticated-public rules  
**When** the student owner marks it retracted through [`PATCH /portfolios/me/items/{item_id}`](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:261) or the implemented equivalent  
**Then** related supervisors no longer see the item  
**And** student and teacher private views still include it unless hidden or retired.

### AC-2: Student can restore authenticated-public visibility

**Given** a student previously retracted an item from authenticated-public visibility  
**When** the student owner removes the retraction  
**Then** the item becomes supervisor-visible again only if it is not hidden, not retired, and rating rules pass.

### AC-3: Unauthorized retraction changes are denied

**Given** a teacher, supervisor, other student, or unauthenticated caller attempts to mutate an item's authenticated-public retraction state  
**When** the item mutation endpoint is called  
**Then** the request is denied  
**And** the item remains unchanged.

### AC-4: Retraction is independent from world-public selection

**Given** a student retracts an item from authenticated-public supervisor visibility  
**When** the same item has world-visible state  
**Then** the retraction does not by itself change world-visible state  
**And** world-public output remains governed by page, item, and review world-public rules.

---

## Implementation Notes

- Broader item curation such as display order, student hide/show, and item world-visible selection is handled by [PF-task-011a](PF-task-011a-student-item-ordering-hide-show-and-world-visible-selection.md).
- The item mutation endpoint may be shared with later curation fields, but this task only owns authenticated-public retraction behavior.

---

## Ambiguities and Defaults

- **Ambiguity**: Whether the endpoint returns the whole portfolio, updated item, or status only is not specified.  
  **Default**: Prefer returning the updated item plus visibility metadata so the frontend does not infer backend rules.

---

## Test Expectations

- API tests must cover retraction, restoration, unauthorized mutation denial, interaction with rating rules, and separation from world-public selection.

