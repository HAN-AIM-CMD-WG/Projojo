# PF-task-007a — Authenticated Portfolio Read Access Matrix

**Phase**: 3 — Authenticated Portfolio Read Model and Review Management  
**Epic**: Authenticated Portfolio Visibility  
**Priority**: 🔴 Critical  
**Type**: Functional Task (API / Security)  
**Spec references**: [Portfolio spec §3.6.1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:172), [§3.6.2](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:177), [§4.1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:255), [Phase 3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:668)  
**Current-state references**: [`student_router.get_student_portfolio()` weak gate](../../../projojo_backend/routes/student_router.py:160), [`PortfolioRepository.get_student_portfolio()` mixed source](../../../projojo_backend/domain/repositories/portfolio_repository.py:307)  
**Dependencies**: [PF-task-003](PF-task-003-authenticated-portfolio-api-baseline.md), [PF-task-005](PF-task-005-completion-creates-portfolio-item-and-review.md), [PF-task-006](PF-task-006-revert-and-recompletion-behavior.md), [SF-task-001](../shared-foundation/SF-task-001-shared-authorization-contract.md)

---

## Task Story

As a **student, teacher, or related supervisor**,  
I want authenticated portfolio access to follow explicit role and relationship rules,  
so that portfolio data is available to permitted viewers without exposing student portfolios to unrelated supervisors or unauthenticated callers.

---

## Why This Must Change

- The current route allows supervisors too broadly and does not enforce the relationship gate.
- The target model separates owner/teacher private views from relationship-gated supervisor access.

---

## Acceptance Criteria

### AC-1: Student owner can read own authenticated portfolio

**Given** a student requests their own portfolio  
**When** the authenticated portfolio endpoint is called  
**Then** the request succeeds  
**And** the response uses canonical portfolio items rather than stale active/live/snapshot data.

### AC-2: Other students are denied

**Given** one student requests another student's portfolio  
**When** the authenticated portfolio endpoint is called  
**Then** the request is denied  
**And** the response does not reveal whether the other student has portfolio items.

### AC-3: Teacher can read any student portfolio

**Given** a teacher requests any student's authenticated portfolio  
**When** the endpoint is called  
**Then** the request succeeds  
**And** access does not depend on project or business ownership.

### AC-4: Related supervisor can pass portfolio-level gate

**Given** a supervisor is associated with a business where the student has a currently open application or has ever been accepted  
**When** the supervisor requests the student's portfolio  
**Then** the request is authorized at portfolio level  
**And** item-level filtering is handled by [PF-task-007b](PF-task-007b-supervisor-authenticated-public-item-filtering.md).

### AC-5: Unrelated supervisor is denied at portfolio level

**Given** a supervisor has no relationship gate to the student  
**When** the supervisor requests the portfolio  
**Then** the API returns a denial rather than an empty successful view  
**And** it does not reveal whether the student has portfolio items.

### AC-6: Unauthenticated access is denied for authenticated endpoint

**Given** no valid authentication is provided  
**When** the authenticated portfolio endpoint is called  
**Then** the request is rejected  
**And** unauthenticated callers must use the world-public slug route.

---

## Implementation Notes

- Relationship-gated access is not expressible as a simple owner-id check in the current auth decorator, so explicit policy code is expected.
- This task owns portfolio-level access. Item filtering, retraction, and response contract examples are split into [PF-task-007b](PF-task-007b-supervisor-authenticated-public-item-filtering.md), [PF-task-007c](PF-task-007c-student-authenticated-public-retraction-api.md), and [PF-task-007d](PF-task-007d-authenticated-portfolio-response-contract-examples.md).

---

## Ambiguities and Defaults

- **Ambiguity**: Exact authorization helper structure is not specified.  
  **Default**: Implement a clear portfolio policy function rather than embedding relationship logic directly in route handlers.

---

## Test Expectations

- API visibility matrix tests must cover student owner, other student, teacher, related supervisor, unrelated supervisor, and unauthenticated access.

