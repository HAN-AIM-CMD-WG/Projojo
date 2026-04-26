# PF-task-003 — Authenticated Portfolio API Baseline and Public Slug Guard

**Phase**: 1 — Remove Stale Portfolio Backend and Establish New Schema  
**Epic**: Portfolio Backend Replacement  
**Priority**: 🔴 Critical  
**Type**: Functional Task (API)  
**Spec references**: [Portfolio spec §4.1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:255), [§4.2](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:265), [Phase 1 success criteria](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:616)  
**Current-state references**: [`student_router.get_student_portfolio()`](../../../projojo_backend/routes/student_router.py:160), [`App.jsx` has no portfolio slug route](../../../projojo_frontend/src/App.jsx:268), [`services.getStudentPortfolio()`](../../../projojo_frontend/src/services.js:873)  
**Dependencies**: [PF-task-001](PF-task-001-remove-stale-portfolio-backend.md), [PF-task-002a](PF-task-002a-canonical-portfolio-item-schema.md), [PF-task-002b](PF-task-002b-portfolio-review-schema-and-author-relations.md), [PF-task-002c](PF-task-002c-student-portfolio-settings-schema.md), [PF-task-002d](PF-task-002d-portfolio-seed-fixtures-and-reset-contract.md), [SF-task-001](../shared-foundation/SF-task-001-shared-authorization-contract.md)

---

## Task Story

As a **authenticated portfolio viewer**,  
I want a new portfolio API baseline with correct access control,  
so that later lifecycle, reviews, and visibility rules have a safe endpoint surface.

---

## Why This Must Change

- The existing portfolio route is under student routes and returns stale mixed data.
- The specification proposes replacing it with authenticated portfolio APIs and a separate world-public API.
- Public slug access must be private by default and must not leak data before world-public publishing is implemented.

---

## Acceptance Criteria

### AC-1: New authenticated portfolio endpoint exists

**Given** an authenticated caller is a student owner, teacher, or relationship-gated supervisor  
**When** they request [`GET /portfolios/students/{student_id}`](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:259) or the implemented equivalent  
**Then** the API returns a portfolio response based on canonical portfolio items  
**And** it does not use the stale student route response shape.

### AC-2: Student owner access is allowed

**Given** a student requests their own portfolio  
**When** the new authenticated endpoint is called  
**Then** the response succeeds  
**And** it includes non-retired, non-hidden canonical items according to the current phase's available read model.

### AC-3: Teacher access is allowed

**Given** a teacher requests any student's portfolio  
**When** the new authenticated endpoint is called  
**Then** the response succeeds  
**And** access does not depend on project or business ownership.

### AC-4: Related supervisor access is allowed at portfolio level

**Given** a supervisor passes the relationship gate defined in [Portfolio spec §3.6.2](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:177)  
**When** the new authenticated endpoint is called  
**Then** the request is authorized at portfolio level  
**And** item-level filtering may return an empty item list if no items pass authenticated-public rules.

### AC-5: Unrelated supervisor is denied

**Given** a supervisor has no relationship gate to the student  
**When** the new authenticated endpoint is called  
**Then** the response is denied  
**And** it does not reveal whether the student has portfolio items.

### AC-6: Unauthenticated access is denied for authenticated endpoint

**Given** no valid authentication is provided  
**When** the authenticated portfolio endpoint is called  
**Then** the request is rejected  
**And** callers must use the world-public slug route for unauthenticated access.

### AC-7: World-public slug route is private by default

**Given** a portfolio slug exists but the page is not world-public  
**When** an unauthenticated caller requests [`GET /portfolio/{slug}`](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:269) or the implemented equivalent  
**Then** the response returns not found or not public  
**And** it returns no portfolio item or review data.

### AC-8: Baseline response contract is documented by example

**Given** frontend and test work depend on the new portfolio response shape  
**When** the authenticated and private-by-default public endpoints are implemented  
**Then** the task documents Pydantic-compatible request/response field inventories or sample JSON for success and denial/not-public responses  
**And** the examples include viewer role, student identity fields allowed for the viewer, item collection shape, review collection shape, curation fields, visibility reason fields, archived-source metadata fields, and validation/error shape where applicable.

---

## Implementation Notes

- Endpoint naming may vary, but route names must be documented if they diverge from the specification's proposed paths.
- Keep this baseline minimal: empty or seeded canonical data is enough in Phase 1 as long as stale mixed data is gone.
- Later visibility details are implemented by [PF-task-007a](PF-task-007a-authenticated-portfolio-read-access-matrix.md), [PF-task-007b](PF-task-007b-supervisor-authenticated-public-item-filtering.md), [PF-task-007c](PF-task-007c-student-authenticated-public-retraction-api.md), and [PF-task-007d](PF-task-007d-authenticated-portfolio-response-contract-examples.md).
- The response examples do not require generated clients or a full OpenAPI redesign. They should match the current FastAPI/Pydantic style closely enough that backend, frontend, and BDD steps agree on field names.

---

## Ambiguities and Defaults

- **Ambiguity**: The final API response shape is not fully specified.  
  **Default**: Return explicit fields for viewer role, item visibility reasons, curation state, archived-source metadata, and reviews rather than requiring frontend inference.

---

## Test Expectations

- API tests must prove owner, teacher, related supervisor, unrelated supervisor, and unauthenticated behavior, matching [Portfolio spec Phase 1 gate](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:623).
- Contract-oriented tests or assertions must verify the documented baseline fields used by the frontend and BDD steps.
