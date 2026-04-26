# SF-task-002 — Registration Lifecycle and Revert Contract

**Phase**: 0 — Shared Foundation Contract  
**Epic**: Shared Foundation — Registration Lifecycle  
**Priority**: 🔴 Critical  
**Type**: Technical Task (Contract)  
**Spec references**: [Portfolio spec §3.4](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:118), [§3.5](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:147), [§4.3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:273), [ADR-003](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:384), [ADR-004](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:404)  
**Current-state references**: [`registersForTask` timestamp attributes](../../../projojo_backend/db/schema.tql:129), [`mark_registration_started()` repository method](../../../projojo_backend/domain/repositories/task_repository.py:567), [`mark_registration_completed()` repository method](../../../projojo_backend/domain/repositories/task_repository.py:590), [`get_registration_timeline()` route](../../../projojo_backend/routes/task_router.py:477)  
**Dependencies**: [SF-task-001](SF-task-001-shared-authorization-contract.md)

---

## Task Story

As a **developer implementing task lifecycle and portfolio creation**,  
I want a strict shared registration state-machine contract,  
so that portfolio evidence is created only from trustworthy completed work.

---

## Why This Must Change

- The specification defines a strict linear lifecycle: requested to accepted to started to completed, with authorized reverts from completed to started and started to accepted.
- The current methods at [`TaskRepository.mark_registration_started()`](../../../projojo_backend/domain/repositories/task_repository.py:567) and [`TaskRepository.mark_registration_completed()`](../../../projojo_backend/domain/repositories/task_repository.py:590) set timestamps without preventing repeated transitions or completion before start.
- The current route at [`mark_registration_started()`](../../../projojo_backend/routes/task_router.py:414) allows students to start their own work, but the specification says students may view their own timeline and cannot mutate start or completion state.

---

## Acceptance Criteria

### AC-1: Lifecycle states are defined from stored registration fields

**Given** a registration has no accepted timestamp and no started or completed timestamp  
**When** lifecycle state is evaluated  
**Then** the contract identifies it as requested or pending according to existing acceptance semantics  
**And** no portfolio item may be created from that state.

### AC-2: Accepted-to-started transition rule is explicit

**Given** a registration has been accepted and has no started or completed timestamp  
**When** an authorized teacher or owning-business supervisor starts it  
**Then** the transition is valid and exactly one started timestamp is recorded  
**And** repeating start must be rejected rather than overwriting or duplicating the timestamp.

### AC-3: Started-to-completed transition rule is explicit

**Given** a registration has been accepted and started and has no completed timestamp  
**When** an authorized teacher or owning-business supervisor completes it with a valid completion payload  
**Then** the transition is valid and exactly one completed timestamp is recorded  
**And** the completion contract triggers canonical portfolio item creation.

### AC-4: Supervisor completion payload validation is explicit

**Given** an owning-business supervisor completes a started registration  
**When** the completion payload is evaluated  
**Then** non-empty review text is required  
**And** rating is optional but must be an integer from 1 through 5 when present  
**And** public review notice acceptance is required and persisted because supervisor review text may later be selected by the student for world-public display.

### AC-5: Teacher completion payload validation is explicit

**Given** a teacher completes a started registration  
**When** the completion payload is evaluated  
**Then** review text is optional  
**And** rating is optional but must be an integer from 1 through 5 when present  
**And** public review notice acceptance is required and persisted whenever review text is submitted.

### AC-6: Invalid review or rating payloads are rejected atomically

**Given** a completion request has missing required supervisor review text, invalid rating type, rating outside 1 through 5, or missing required public review notice acceptance  
**When** completion is requested  
**Then** the contract requires a validation error  
**And** no completed timestamp, portfolio item, review, rating, or public notice record is created.

### AC-7: Public notice integrity is defined

**Given** a completion review is created with review text  
**When** the review is stored  
**Then** the contract records that the reviewer accepted the submission-time notice that the student may publish the review publicly later  
**And** the contract states that reviewers do not receive a later opt-out right for reviews submitted under that notice.

### AC-8: Completion before start is rejected

**Given** a registration has been accepted but has no started timestamp  
**When** completion is requested  
**Then** the contract requires a validation error  
**And** no completed timestamp, portfolio item, or review is created.

### AC-9: Repeated or invalid transitions are rejected

**Given** a registration is already started or already completed  
**When** the same transition is requested again  
**Then** the contract requires a validation error  
**And** existing timestamps remain unchanged.

### AC-10: Completion revert semantics are defined

**Given** a registration is completed and has an associated active portfolio item  
**When** an authorized actor reverts completion  
**Then** the registration returns to started state  
**And** the current portfolio item and its reviews are retired rather than hard-deleted.

### AC-11: Start revert semantics are defined

**Given** a registration is started and not completed  
**When** an authorized actor reverts start  
**Then** the registration returns to accepted state  
**And** no portfolio item is created or affected.

### AC-12: Re-completion semantics are defined

**Given** a completion has been reverted and its portfolio item retired  
**When** the same registration is completed again after being started  
**Then** a new portfolio item is created with a new identity  
**And** a new completion review is required when the completing actor is a supervisor  
**And** completion payload validation and public notice rules apply as if this were a first completion.

### AC-13: Completion evidence is reviewable

**Given** this task is marked complete  
**When** a reviewer checks the submitted change  
**Then** they can identify the created or updated lifecycle contract artifact, state table or transition matrix, completion payload validation table, revert semantics, and linked source-spec references  
**And** the reviewer can derive tests for every allowed transition, invalid transition, role-specific review requirement, invalid rating, missing notice acceptance, revert, and re-completion case.

---

## Implementation Notes

- Existing timestamp fields in [`registersForTask`](../../../projojo_backend/db/schema.tql:129) may remain part of the operational lifecycle, but transition checks must be explicit and state-safe.
- TypeDB update behavior around singleton timestamp attributes must be handled deliberately, as highlighted in [Portfolio spec Phase 2 risks](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:647).
- The lifecycle contract must be stable before Portfolio item creation work begins.

---

## Ambiguities and Defaults

- **Ambiguity**: The exact error messages for invalid transitions are not specified.  
  **Default**: Use Dutch messages consistent with existing backend validation while making each failure reason specific enough for tests.

---

## Test Expectations

- Later API tests must cover every allowed and denied transition listed in [Portfolio spec Phase 2 automated gate](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:662).
- Later API tests must cover supervisor review-required, teacher review-optional, rating range validation, missing notice acceptance, and atomic failure behavior for invalid completion payloads.
