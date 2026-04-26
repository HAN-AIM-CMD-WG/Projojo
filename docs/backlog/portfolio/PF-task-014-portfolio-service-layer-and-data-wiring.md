# PF-task-014 — Frontend Portfolio Read Service Layer for New APIs

**Phase**: 5 — Frontend Integration and UX Preservation  
**Epic**: Portfolio Frontend Integration  
**Priority**: 🔴 Critical  
**Type**: Technical Task (Frontend API Wiring)  
**Spec references**: [Portfolio spec Phase 5](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:748), [§4](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:251)  
**Current-state references**: [`services.getStudentPortfolio()`](../../../projojo_frontend/src/services.js:873), [`StudentPortfolio`](../../../projojo_frontend/src/components/StudentPortfolio.jsx:14)  
**Dependencies**: [PF-task-003](PF-task-003-authenticated-portfolio-api-baseline.md), [PF-task-013](PF-task-013-world-public-portfolio-api-and-route.md)

---

## Task Story

As a **frontend developer**,  
I want read-only portfolio service functions that call the new backend contracts,  
so that UI components stop depending on stale student portfolio endpoints before mutation services are added in focused follow-up tasks.

---

## Acceptance Criteria

### AC-1: Legacy portfolio service is replaced

**Given** [`getStudentPortfolio()`](../../../projojo_frontend/src/services.js:873) calls the stale student route  
**When** frontend integration begins  
**Then** it is removed, renamed, or rewritten to call the new authenticated portfolio endpoint  
**And** no component depends on the stale response shape.

### AC-2: Authenticated portfolio read service exists

**Given** a component needs an authenticated portfolio view  
**When** it calls the service layer  
**Then** the service calls the new authenticated portfolio endpoint  
**And** it returns the API response without client-side reconstruction from tasks or registrations.

### AC-3: Public portfolio read service exists

**Given** the public portfolio page route renders  
**When** it needs data for a slug  
**Then** a service calls the world-public portfolio API without requiring authentication  
**And** private or unknown slugs produce an appropriate public error state.

### AC-4: Read service contracts follow documented DTO examples

**Given** authenticated and public portfolio endpoints document Pydantic-compatible response examples  
**When** frontend read services normalize errors or pass through data  
**Then** they preserve documented field names for viewer role, portfolio summary, item fields, review fields, visibility reasons, archived-source metadata, and public-safe error states  
**And** they do not reconstruct portfolio state from tasks, registrations, or stale snapshot data.

### AC-5: Mutation service ownership is split into focused tasks

**Given** portfolio settings, item curation, review visibility, lifecycle completion, and review editing require separate backend APIs and UI flows  
**When** this read-service task is completed  
**Then** it does not implement those mutation services  
**And** it references [PF-task-020](PF-task-020-portfolio-settings-and-curation-services.md) for owner curation services and [PF-task-021a](PF-task-021a-lifecycle-completion-review-form-ui.md), [PF-task-021b](PF-task-021b-additional-review-creation-ui.md), and [PF-task-021c](PF-task-021c-review-editing-ui.md) for lifecycle/review submission services.

---

## Implementation Notes

- Keep service functions thin; do not reimplement visibility logic in frontend services.
- Existing lifecycle service functions must be updated in [PF-task-021a](PF-task-021a-lifecycle-completion-review-form-ui.md) to include review text, rating, and notice acceptance where completion UI is implemented.

---

## Ambiguities and Defaults

- **Ambiguity**: Exact function names are not specified.  
  **Default**: Use descriptive names that mirror endpoint purposes and avoid old mixed portfolio semantics.

---

## Test Expectations

- Browser tests should use the UI, but read-service changes should be simple enough to verify through integration flows and existing lint/build checks.
