# PF-task-011b — Teacher Portfolio Item Soft-Hide and Precedence

**Phase**: 4 — Student Curation and World-Public Portfolio  
**Epic**: Student Portfolio Curation  
**Priority**: 🔴 Critical  
**Type**: Functional Task (API / Moderation)  
**Spec references**: [Portfolio spec §3.7](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:218), [§4.1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:255), [Phase 4](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:707)  
**Current-state references**: [`delete_portfolio_item()` obsolete delete behavior](../../../projojo_backend/routes/student_router.py:214)  
**Dependencies**: [PF-task-002a](PF-task-002a-canonical-portfolio-item-schema.md), [PF-task-007b](PF-task-007b-supervisor-authenticated-public-item-filtering.md), [PF-task-011a](PF-task-011a-student-item-ordering-hide-show-and-world-visible-selection.md)

---

## Task Story

As a **teacher moderating portfolio evidence**,  
I want to soft-hide portfolio items for correction or administrative reasons,  
so that questionable items are removed from normal views without deleting completed-work evidence.

---

## Acceptance Criteria

### AC-1: Teacher can soft-hide portfolio item

**Given** a teacher identifies an item that requires moderation or correction  
**When** the teacher calls [`PATCH /portfolios/students/{student_id}/items/{item_id}/hide`](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:263) or the implemented equivalent  
**Then** the item becomes hidden  
**And** hidden state records who hid it and when.

### AC-2: Teacher-hidden item is excluded from normal views

**Given** a portfolio item is teacher-hidden  
**When** student, teacher, supervisor, or world-public normal portfolio views are requested  
**Then** the item is excluded  
**And** a future administrative context for hidden item review remains outside this task.

### AC-3: Student cannot unhide teacher-hidden item

**Given** a teacher has hidden an item  
**When** the student owner attempts to show the item through student curation  
**Then** the request is denied or leaves teacher-hidden state in effect  
**And** teacher-hide precedence is preserved.

### AC-4: Unauthorized teacher-hide is denied

**Given** a student, supervisor, or unauthenticated visitor attempts teacher-hide behavior  
**When** the teacher hide endpoint is called  
**Then** the request is denied  
**And** the item hidden state remains unchanged.

### AC-5: Teacher hide does not hard-delete evidence

**Given** a teacher soft-hides a portfolio item  
**When** storage is inspected  
**Then** the portfolio item remains stored  
**And** the item is excluded by visibility rules rather than removed from the database.

---

## Implementation Notes

- Teacher soft-hide should record enough metadata for future administrative review, but this task only requires normal visibility exclusion.
- Student hide/show is handled by [PF-task-011a](PF-task-011a-student-item-ordering-hide-show-and-world-visible-selection.md).

---

## Ambiguities and Defaults

- **Ambiguity**: Conflict rules between teacher hide and student show are not fully specified.  
  **Default**: Teacher hide takes precedence; student cannot unhide a teacher-hidden item without teacher action.

---

## Test Expectations

- API tests must cover teacher soft-hide, metadata persistence, normal view exclusion, student unhide denial, unauthorized update denial, and no hard-delete side effects.

