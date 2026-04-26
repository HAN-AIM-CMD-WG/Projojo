# PF-task-005 — Completion Creates Canonical Portfolio Item and Initial Review

**Phase**: 2 — Registration Lifecycle and Portfolio Item Creation  
**Epic**: Portfolio Lifecycle  
**Priority**: 🔴 Critical  
**Type**: Functional Task (API / Persistence)  
**Spec references**: [Portfolio spec §3.3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:98), [§3.5](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:145), [§4.3 completion body](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:283), [ADR-004](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:392), [Phase 2](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:629)  
**Current-state references**: [`mark_registration_completed()` route](../../../projojo_backend/routes/task_router.py:445), [`TaskRepository.mark_registration_completed()`](../../../projojo_backend/domain/repositories/task_repository.py:590), [`PortfolioRepository.get_live_portfolio_items()`](../../../projojo_backend/domain/repositories/portfolio_repository.py:133)  
**Dependencies**: [PF-task-002a](PF-task-002a-canonical-portfolio-item-schema.md), [PF-task-002b](PF-task-002b-portfolio-review-schema-and-author-relations.md), [PF-task-004](PF-task-004-registration-lifecycle-api-and-state-machine.md), [PF-task-012b](PF-task-012b-reviewer-public-use-notice-enforcement.md)

---

## Task Story

As a **student completing verified work**,  
I want a canonical portfolio item and completion review created when my registration is completed,  
so that my portfolio contains stable, credible evidence of completed work.

---

## Why This Must Change

- The current completion route only sets a completed timestamp and relies on live queries to derive portfolio content.
- The specification requires canonical portfolio items created at completion time and a required supervisor review.

---

## Acceptance Criteria

### AC-1: Successful completion creates canonical item

**Given** a registration is started and not completed  
**When** an authorized teacher or owning-business supervisor completes it  
**Then** a canonical portfolio item is created  
**And** the item stores source identifiers and copied display fields for student, registration, task, project, business, skills, and timeline.

### AC-2: Supervisor completion requires review text

**Given** an owning-business supervisor completes a started registration  
**When** the completion request omits review text or provides only whitespace  
**Then** the API rejects the request  
**And** no completed timestamp, portfolio item, or review is created.

### AC-3: Supervisor completion accepts optional rating

**Given** an owning-business supervisor provides non-empty review text  
**When** rating is omitted  
**Then** completion succeeds with a review that has no rating  
**And** the resulting item is not removed from authenticated-public visibility because of rating.

### AC-4: Rating must be between one and five

**Given** a completion request includes a rating  
**When** the rating is below 1, above 5, non-integer, or not parseable as an integer  
**Then** the API rejects the request  
**And** no completion side effects are committed.

### AC-5: Teacher completion review is optional

**Given** a teacher completes a started registration  
**When** review text is omitted  
**Then** completion succeeds  
**And** a portfolio item is created without an initial review unless review text is supplied.

### AC-6: Public review notice is required when review text is submitted

**Given** a completion request includes review text  
**When** public-review notice acceptance is missing or false  
**Then** the API rejects the request  
**And** the reviewer must not be able to submit text that could later be published publicly without notice.

### AC-7: Completion is atomic

**Given** completion creates a registration timestamp, portfolio item, and possibly review  
**When** any part of persistence fails  
**Then** none of the completion side effects remain partially committed  
**And** the registration can be retried safely.

---

## Implementation Notes

- Do not reuse [`PortfolioRepository.get_live_portfolio_items()`](../../../projojo_backend/domain/repositories/portfolio_repository.py:133) as the source of truth; it derives completed work from live registrations and conflicts with [ADR-001](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:368).
- The completion response should include the new portfolio item ID for traceability.
- If TypeDB transaction limitations complicate atomicity, document the chosen consistency strategy.

---

## Ambiguities and Defaults

- **Ambiguity**: The exact maximum length for review text is not specified.  
  **Default**: Use a reasonable backend validation limit consistent with platform text fields and document it in the API model.

---

## Test Expectations

- API tests must cover supervisor review-required behavior, teacher review-optional behavior, rating validation, notice acceptance, and item creation.
