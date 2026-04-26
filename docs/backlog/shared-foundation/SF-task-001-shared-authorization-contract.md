# SF-task-001 — Shared Authorization Contract for Portfolio, Archiving, and Theme/SDG

**Phase**: 0 — Shared Foundation Contract  
**Epic**: Shared Foundation — Authorization and Access Policy  
**Priority**: 🔴 Critical  
**Type**: Non-functional Task (Security / Contract)  
**Spec references**: [Portfolio spec §3.4](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:118), [§3.5](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:147), [§3.6](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:168), [§4.1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:255), [§4.3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:273), [§4.4](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:301), [ADR-004](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:404), [ADR-005](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:412), [ADR-007](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:416)  
**Current-state references**: [`auth()` owner checks](../../../projojo_backend/auth/permissions.py:17), [`get_student_portfolio()` broad supervisor access](../../../projojo_backend/routes/student_router.py:160), [`mark_registration_started()` raw role checks](../../../projojo_backend/routes/task_router.py:414), [`get_registration_timeline()` missing relationship gate](../../../projojo_backend/routes/task_router.py:477)  
**Dependencies**: None

---

## Task Story

As a **developer working on Portfolio, Archiving, or Theme/SDG**,  
I want one shared authorization contract for students, teachers, supervisors, and unauthenticated visitors,  
so that parallel implementation does not create contradictory access rules.

---

## Why This Must Change

- The specification requires relationship-gated supervisor portfolio access, teacher oversight, student owner-only curation, owning-business registration lifecycle mutation, and unauthenticated world-public portfolio access.
- The current portfolio endpoint at [`get_student_portfolio()`](../../../projojo_backend/routes/student_router.py:160) only blocks students from viewing other students and does not enforce the supervisor relationship gate required by [Portfolio spec §3.6.2](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:177).
- The current start and complete routes at [`mark_registration_started()`](../../../projojo_backend/routes/task_router.py:414) and [`mark_registration_completed()`](../../../projojo_backend/routes/task_router.py:445) trust role payloads too broadly and must be replaced by policy that verifies teacher role or owning-business supervisor relationship.
- The current [`auth()` decorator](../../../projojo_backend/auth/permissions.py:17) can validate simple owner IDs but cannot express the full portfolio relationship gate by itself.

---

## Acceptance Criteria

### AC-1: Role matrix is documented and authoritative

**Given** Phase 0 is completed  
**When** a developer starts work on Portfolio, Archiving, or Theme/SDG  
**Then** they can find a documented authorization matrix covering student owner, teacher, owning-business supervisor, same-business supervisor, unrelated supervisor, and unauthenticated visitor access  
**And** the matrix explicitly traces each rule to [Portfolio spec §3.4](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:132), [§3.6](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:168), or [§4](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:251).

### AC-2: Portfolio owner and teacher access is unambiguous

**Given** an authenticated portfolio item is non-retired and non-hidden  
**When** the student owner or any teacher requests the authenticated portfolio view  
**Then** the contract says the item and all reviews are visible  
**And** it explicitly excludes retired and hidden items from normal authenticated read models unless a later administrative context is added.

### AC-3: Supervisor portfolio relationship gate is defined

**Given** a supervisor requests a student's authenticated portfolio  
**When** the student has a currently open application for a task with the supervisor's business or has ever been accepted for a task by that business  
**Then** the supervisor passes the relationship gate  
**And** the item-level authenticated-public rules still determine which items are returned.

### AC-4: Unrelated supervisor denial is defined

**Given** a supervisor has no currently open application and no historical acceptance relationship with the student through the supervisor's business  
**When** that supervisor requests the student's authenticated portfolio  
**Then** the contract requires a denial response rather than an empty successful portfolio  
**And** the denial must not reveal item counts, review counts, hidden-item existence, or rating information.

### AC-5: Authenticated-public item visibility rule is defined

**Given** a relationship-gated supervisor has passed the portfolio-level gate  
**When** authenticated-public item visibility is evaluated  
**Then** the contract requires each returned item to be non-retired, non-hidden, not retracted from authenticated-public visibility, and either unrated or rated only with ratings of 3 or higher  
**And** the contract states that a new or edited rating below 3 immediately removes the item from supervisor authenticated-public visibility until all ratings are 3 or higher again and the student has not retracted the item.

### AC-6: Registration lifecycle mutation access is defined

**Given** a registration belongs to a task owned by a business  
**When** start, complete, revert-completion, or revert-start is requested  
**Then** only a teacher or a supervisor of the task-owning business may mutate the state  
**And** students must be allowed to view their own timeline but must not mutate start or completion state.

### AC-7: World-public access is separated from authenticated access

**Given** an unauthenticated visitor requests a portfolio by slug  
**When** the portfolio page is enabled and slug exists  
**Then** only selected world-visible items and selected world-visible reviews may be returned  
**And** authenticated-public rating rules must not be reused as the world-public rule.

### AC-8: Shared policy names are agreed before implementation

**Given** the authorization contract is accepted  
**When** developers implement backend routes  
**Then** they use agreed policy names or documented equivalents for: portfolio owner view, teacher portfolio view, supervisor relationship-gated portfolio view, owning-business lifecycle mutation, same-business review creation, review author edit, teacher review edit, and unauthenticated public portfolio view.

### AC-9: Review and rating authorization rules are defined

**Given** review creation or review editing is requested  
**When** the actor is a completing supervisor, completing teacher, additional same-business supervisor, additional teacher, review author, or non-authorized actor  
**Then** the contract defines who may create an initial completion review, who may create an additional review, who may edit review text or rating, and who must be denied  
**And** the contract states that rating edits trigger authenticated-public visibility recalculation  
**And** the contract states that review submission flows must require and persist the public-use notice acceptance whenever review text is submitted.

### AC-10: Completion evidence is reviewable

**Given** this task is marked complete  
**When** a reviewer checks the submitted change  
**Then** they can identify the created or updated authorization contract artifact, the role matrix section, the authenticated-public item-rule section, the review-permission section, and the linked source-spec references  
**And** the reviewer can derive denied-case tests for unrelated supervisors, unauthorized review authors, unauthorized lifecycle mutators, and unauthenticated authenticated-portfolio access from that artifact.

---

## Implementation Notes

- This task should create or update a shared contract document before feature implementation begins. The exact file is flexible, but it must be referenced by the later Portfolio, Archiving, and Theme/SDG tasks.
- Do not treat existing broad supervisor access in [`student_router.py`](../../../projojo_backend/routes/student_router.py:160) as reusable. It conflicts with the specification and must be replaced.
- Reuse of [`auth()`](../../../projojo_backend/auth/permissions.py:17) is acceptable only for simple owner checks; relationship-gated portfolio access needs explicit policy code.

---

## Ambiguities and Defaults

- **Ambiguity**: The exact helper/module location for complex policy code is not specified.  
  **Default**: Create a dedicated authorization policy module and keep route handlers thin; confirm final file placement with the backend owner.
- **Ambiguity**: The response shape for denial cases is not specified.  
  **Default**: Use existing platform error conventions while preventing data leakage.

---

## Test Expectations

- The contract must define testable role matrix cases for owner student, teacher, related supervisor, unrelated supervisor, and unauthenticated visitor.
- The contract must define testable item-visibility cases for unrated, all-ratings-three-or-higher, low-rated, hidden, retired, and authenticated-public retracted items.
- The contract must define testable review-permission cases for completion reviews, additional reviews, review-author edits, teacher edits, unauthorized edits, and rating-change visibility recalculation.
- Later API tests must be able to derive expected allowed and denied outcomes directly from this contract.
