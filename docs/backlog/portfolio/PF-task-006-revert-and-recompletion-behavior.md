# PF-task-006 — Revert Completion, Revert Start, and Re-completion Behavior

**Phase**: 2 — Registration Lifecycle and Portfolio Item Creation  
**Epic**: Portfolio Lifecycle  
**Priority**: 🔴 Critical  
**Type**: Functional Task (API / Consistency)  
**Spec references**: [Portfolio spec §3.4](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:118), [§4.3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:273), [ADR-003](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:384), [Phase 2 success criteria](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:652)  
**Current-state references**: [`task_router.py` lifecycle endpoints](../../../projojo_backend/routes/task_router.py:414), [`TaskRepository` lifecycle methods](../../../projojo_backend/domain/repositories/task_repository.py:567)  
**Dependencies**: [PF-task-004](PF-task-004-registration-lifecycle-api-and-state-machine.md), [PF-task-005](PF-task-005-completion-creates-portfolio-item-and-review.md)

---

## Task Story

As a **teacher or owning-business supervisor correcting lifecycle mistakes**,  
I want to revert completion or start state safely,  
so that accidental completions do not leave misleading portfolio evidence.

---

## Why This Must Change

- The current code has no revert endpoints or portfolio retirement behavior.
- The specification requires completion revert to retire portfolio item and reviews, and re-completion to create a new item.

---

## Acceptance Criteria

### AC-1: Revert completion returns registration to started

**Given** a registration is completed and has an active portfolio item  
**When** an authorized teacher or owning-business supervisor calls [`PATCH /tasks/{task_id}/registrations/{student_id}/revert-completion`](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:279) or the implemented equivalent  
**Then** the completed state is removed or marked no longer active  
**And** the registration is again considered started.

### AC-2: Revert completion retires portfolio item and reviews

**Given** a completed registration has a portfolio item with reviews  
**When** completion is reverted  
**Then** the portfolio item is marked retired  
**And** its reviews are retired or excluded from normal read models  
**And** the retired item is not visible in student, teacher, supervisor, or world-public normal portfolio views.

### AC-3: Revert completion is rejected for non-completed registrations

**Given** a registration is requested, accepted, or started but not completed  
**When** revert completion is requested  
**Then** the API rejects the request  
**And** no portfolio item state changes.

### AC-4: Revert start returns registration to accepted

**Given** a registration is started and not completed  
**When** an authorized actor calls [`PATCH /tasks/{task_id}/registrations/{student_id}/revert-start`](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:280) or the implemented equivalent  
**Then** the started state is removed  
**And** the registration is again considered accepted.

### AC-5: Revert start is rejected after completion

**Given** a registration is completed  
**When** revert start is requested directly  
**Then** the API rejects the request  
**And** callers must revert completion first.

### AC-6: Re-completion creates a new portfolio item

**Given** completion was reverted and the previous portfolio item is retired  
**When** the registration is completed again through a valid completion request  
**Then** a new portfolio item is created with a different item ID  
**And** the previous retired item remains excluded from normal portfolio views.

### AC-7: Re-completion requires new supervisor review

**Given** a supervisor re-completes a reverted registration  
**When** review text is missing  
**Then** the request is rejected  
**And** the previous review cannot be reused as the new completion review.

---

## Implementation Notes

- Retire state should be explicit on portfolio items and reviews, not inferred from registration timestamps.
- Avoid hard-delete of retired portfolio records; the specification says retire, not delete.

---

## Ambiguities and Defaults

- **Ambiguity**: The specification does not define an admin UI for retired records.  
  **Default**: Store retired state for auditability but exclude retired records from normal API responses.

---

## Test Expectations

- API tests must prove revert and re-completion item identity behavior, matching [Portfolio spec Phase 2 gate](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:662).

