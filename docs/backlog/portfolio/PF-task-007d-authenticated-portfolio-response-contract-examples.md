# PF-task-007d — Authenticated Portfolio Response Contract Examples

**Phase**: 3 — Authenticated Portfolio Read Model and Review Management  
**Epic**: Authenticated Portfolio Visibility  
**Priority**: 🔴 Critical  
**Type**: Technical Task (API Contract)  
**Spec references**: [Portfolio spec §4.1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:255), [Risk register](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:853), [Phase 3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:668)  
**Current-state references**: [`services.getStudentPortfolio()`](../../../projojo_frontend/src/services.js:873)  
**Dependencies**: [PF-task-007a](PF-task-007a-authenticated-portfolio-read-access-matrix.md), [PF-task-007b](PF-task-007b-supervisor-authenticated-public-item-filtering.md), [PF-task-007c](PF-task-007c-student-authenticated-public-retraction-api.md), [PF-task-009](PF-task-009-archived-source-context.md)

---

## Task Story

As a **frontend developer and test author**,  
I want documented authenticated portfolio response examples for each viewer role,  
so that UI components and BDD tests use one explicit contract instead of inferring visibility state.

---

## Why This Must Change

- The visibility model is complex and the specification calls out frontend inference bugs as a risk.
- Backend responses need stable fields for viewer role, visibility reasons, curation state, archived-source metadata, reviews, and redaction rules.

---

## Acceptance Criteria

### AC-1: Student owner response example is documented

**Given** a student owner views their authenticated portfolio  
**When** response examples are documented  
**Then** the example includes viewer role, portfolio settings, item fields, reviews, visibility reasons, curation fields, archived-source metadata, and validation/error shape where applicable.

### AC-2: Teacher response example is documented

**Given** a teacher views a student's authenticated portfolio  
**When** response examples are documented  
**Then** the example shows teacher-permitted fields, item/review data, archived-source data, and any teacher moderation fields returned by the API.

### AC-3: Related supervisor response example is documented

**Given** a relationship-gated supervisor views a portfolio  
**When** response examples are documented  
**Then** the example shows only supervisor-visible item and review fields  
**And** it makes clear which private fields, hidden items, retired items, low-rated items, and retracted items are omitted or redacted.

### AC-4: Denial and not-authorized examples are documented

**Given** an unrelated supervisor, other student, or unauthenticated caller requests authenticated portfolio data  
**When** response examples are documented  
**Then** denial examples show safe error shapes  
**And** they do not reveal whether the student has portfolio items.

### AC-5: Contract examples align with service and BDD needs

**Given** [PF-task-014](PF-task-014-portfolio-service-layer-and-data-wiring.md) and [PF-task-019](PF-task-019-portfolio-bdd-api-and-browser-coverage.md) depend on response fields  
**When** contract examples are finished  
**Then** field names are stable enough for frontend services and BDD assertions  
**And** any endpoint-name divergence from the specification is documented.

---

## Implementation Notes

- The examples can live near Pydantic models, endpoint documentation, or task implementation notes as long as backend, frontend, and tests share the same field names.
- The examples do not require generated clients or a full OpenAPI redesign.

---

## Ambiguities and Defaults

- **Ambiguity**: Final API response shape is not fully specified.  
  **Default**: Return explicit fields for viewer role, item visibility reasons, curation state, archived-source metadata, navigation state, and reviews rather than requiring frontend inference.

---

## Test Expectations

- Contract-oriented tests or assertions must verify documented fields used by frontend services and BDD steps for owner, teacher, supervisor, and denial responses.

