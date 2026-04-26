# SF-task-004 — Schema Ownership and Deterministic Seed Contract

**Phase**: 0 — Shared Foundation Contract  
**Epic**: Shared Foundation — Schema and Seed Data  
**Priority**: 🔴 Critical  
**Type**: Technical Task (Data Contract)  
**Spec references**: [Portfolio spec §5](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:300), [§5.3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:348), [Phase 0 tasks](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:562), [ADR-007](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:416)  
**Current-state references**: [`portfolioItem` snapshot schema](../../../projojo_backend/db/schema.tql:145), [`test_seed.tql`](../../../projojo_backend/db/test_seed.tql:1), [`hasTheme` relation](../../../projojo_backend/db/schema.tql:157), [`registersForTask` relation](../../../projojo_backend/db/schema.tql:129)  
**Dependencies**: [SF-task-001](SF-task-001-shared-authorization-contract.md), [SF-task-002](SF-task-002-registration-lifecycle-contract.md), [SF-task-003](SF-task-003-archive-only-portfolio-contract.md)

---

## Task Story

As a **backend developer working in parallel feature streams**,  
I want schema ownership boundaries and deterministic seed fixtures agreed before implementation,  
so that Portfolio, Archiving, and Theme/SDG work can proceed without conflicting TypeDB changes.

---

## Why This Must Change

- The current [`portfolioItem`](../../../projojo_backend/db/schema.tql:145) schema is snapshot-only and cannot represent canonical completed-work evidence, reviews, curation, visibility, or archived-source metadata.
- The Portfolio specification requires replacing or heavily expanding the portfolio schema while Archiving and Theme/SDG also touch shared concepts.
- Without deterministic seed data, the required visibility matrix, rating gate, relationship gate, archived-source, and public slug tests cannot be automated reliably.

---

## Acceptance Criteria

### AC-1: Schema ownership boundaries are documented

**Given** Phase 0 is accepted  
**When** developers modify TypeDB schema  
**Then** the contract identifies which epic owns portfolio item concepts, review concepts, archive metadata concepts, theme concepts, registration lifecycle fields, and student portfolio fields  
**And** it identifies which files or sections require coordination before change.

### AC-2: Portfolio schema replacement is acknowledged

**Given** the current schema has snapshot fields on [`portfolioItem`](../../../projojo_backend/db/schema.tql:145)  
**When** Portfolio Phase 1 starts  
**Then** the shared contract says this shape is stale and superseded  
**And** developers must not preserve snapshot-only attributes as the primary portfolio model unless a specific story justifies temporary migration compatibility.

### AC-3: Required portfolio seed fixtures are listed

**Given** the test seed contract is complete  
**When** [`test_seed.tql`](../../../projojo_backend/db/test_seed.tql:1) is updated  
**Then** it includes deterministic fixtures for one student with completed portfolio items, a related supervisor business, an unrelated supervisor business, one teacher, no-rating item, all-ratings-three-or-higher item, low-rating item, hidden item, authenticated-public retracted item, world-public portfolio page, selected world-visible item, selected world-visible review, and archived-source item.

### AC-4: Relationship-gate seed data is deterministic

**Given** supervisor portfolio access tests run  
**When** related and unrelated supervisors are authenticated  
**Then** the seed data creates predictable outcomes for current open application access and historical accepted relationship access  
**And** unrelated supervisor denial does not depend on test ordering.

### AC-5: Slug uniqueness seed cases are deterministic

**Given** world-public portfolio tests run  
**When** a student attempts to change a slug  
**Then** seed data includes at least one existing slug that can be used to prove uniqueness rejection  
**And** at least one unused slug can be used to prove successful update.

### AC-6: Cross-epic fixture conflicts are prevented

**Given** Theme/SDG or Archiving tasks update seed data  
**When** they touch projects, tasks, registrations, businesses, or students used by Portfolio tests  
**Then** the task must either preserve the Portfolio fixture contract or document the coordinated replacement fixture.

### AC-7: Completion evidence is reviewable

**Given** this task is marked complete  
**When** a reviewer checks the submitted change  
**Then** they can identify the created or updated schema ownership artifact, the deterministic fixture inventory, the coordinated seed-data surfaces, and the linked source-spec references  
**And** the reviewer can map each fixture category to at least one later automated test category without relying on test execution order.

---

## Implementation Notes

- Because there is no production data to preserve, the specification allows schema reset and reseed during implementation.
- The contract should call out that optional display-only fields are lower risk, while fields used in authorization, matching, filtering, visibility, or lifecycle transitions require coordination.
- This task should avoid over-designing exact relation names beyond what [Portfolio spec §5.1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:304) already proposes; later implementation can refine exact TypeDB relation design.

---

## Ambiguities and Defaults

- **Ambiguity**: Exact relation design for linking review author to either teacher or supervisor remains open in [Portfolio spec §11](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:867).  
  **Default**: Reserve ownership of the concept for Portfolio and require a documented backend decision before implementation.

---

## Test Expectations

- Seed reset must support automated Qavajs API and browser tests without manual database setup.
- The seed contract must support every feature file listed in [Portfolio spec §9](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:825).
