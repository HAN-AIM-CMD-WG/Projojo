# PF-task-004 — Registration Lifecycle API Authorization and State Machine

**Phase**: 2 — Registration Lifecycle and Portfolio Item Creation  
**Epic**: Portfolio Lifecycle  
**Priority**: 🔴 Critical  
**Type**: Functional Task (API / State Machine)  
**Spec references**: [Portfolio spec §3.4](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:118), [§4.3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:273), [Phase 2](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:629)  
**Current-state references**: [`task_router.mark_registration_started()`](../../../projojo_backend/routes/task_router.py:414), [`task_router.mark_registration_completed()`](../../../projojo_backend/routes/task_router.py:445), [`task_router.get_registration_timeline()`](../../../projojo_backend/routes/task_router.py:477), [`TaskRepository.mark_registration_started()`](../../../projojo_backend/domain/repositories/task_repository.py:567), [`TaskRepository.mark_registration_completed()`](../../../projojo_backend/domain/repositories/task_repository.py:590)  
**Dependencies**: [PF-task-003](PF-task-003-authenticated-portfolio-api-baseline.md), [SF-task-002](../shared-foundation/SF-task-002-registration-lifecycle-contract.md)

---

## Task Story

As a **teacher or owning-business supervisor**,  
I want registration lifecycle actions to enforce strict state transitions and ownership,  
so that completion state can be trusted as the trigger for portfolio evidence.

---

## Why This Must Change

- The current start route allows students to mutate state, but the specification says students can view timelines and cannot mutate start or completion state.
- The current repository methods update timestamps without preventing duplicate or invalid transitions.
- Timeline access currently lacks relationship and owner checks.

---

## Acceptance Criteria

### AC-1: Start endpoint requires accepted registration

**Given** a registration is accepted and not started  
**When** a teacher or owning-business supervisor calls [`PATCH /tasks/{task_id}/registrations/{student_id}/start`](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:277) or the implemented equivalent  
**Then** the registration moves to started  
**And** a started timestamp is stored exactly once.

### AC-2: Start is rejected for invalid states

**Given** a registration is requested, rejected, already started, or already completed  
**When** start is requested  
**Then** the API rejects the request  
**And** no lifecycle timestamp is changed.

### AC-3: Completion requires started state

**Given** a registration is accepted but has no started timestamp  
**When** completion is requested  
**Then** the API rejects the request  
**And** no portfolio item or review is created.

### AC-4: Students cannot mutate lifecycle state

**Given** a student owns a registration  
**When** the student calls start, complete, revert-completion, or revert-start  
**Then** the API rejects the request  
**And** the student can still view their own timeline through the timeline endpoint.

### AC-5: Unrelated supervisor cannot mutate lifecycle state

**Given** a supervisor is not associated with the task-owning business  
**When** that supervisor calls any lifecycle mutation endpoint  
**Then** the API rejects the request  
**And** no lifecycle timestamp or portfolio data changes.

### AC-6: Teacher can mutate any registration lifecycle

**Given** a teacher requests a valid lifecycle transition for any task registration  
**When** the endpoint is called  
**Then** the transition succeeds according to state rules  
**And** business ownership is not required.

### AC-7: Timeline endpoint is relationship-gated

**Given** a timeline request is made  
**When** the caller is the student owner, a teacher, or owning-business supervisor  
**Then** the timeline response succeeds  
**And** unrelated supervisors and unauthenticated callers are denied.

---

## Implementation Notes

- Add explicit revert endpoints required by [Portfolio spec §4.3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:273) even if the frontend does not expose them yet.
- Use repository or service-layer validation so route handlers do not become the source of lifecycle truth.
- Handle TypeDB singleton timestamp updates safely; do not rely on repeated updates silently overwriting data.

---

## Ambiguities and Defaults

- **Ambiguity**: The exact representation of requested versus rejected registrations in lifecycle state is not fully specified.  
  **Default**: Treat lack of accepted state as not startable or completable.

---

## Test Expectations

- API scenarios must cover every allowed and denied transition listed in [Portfolio spec Phase 2 gate](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:662).

