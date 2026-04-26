# PF-task-002d — Portfolio Seed Fixtures and Reset Contract

**Phase**: 1 — Remove Stale Portfolio Backend and Establish New Schema  
**Epic**: Portfolio Backend Replacement  
**Priority**: 🔴 Critical  
**Type**: Technical Task (Seed / Test Data)  
**Spec references**: [Portfolio spec §5.3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:348), [Phase 1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:592), [§9](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:825)  
**Current-state references**: [`test_seed.tql`](../../../projojo_backend/db/test_seed.tql:1), [`reset_test_database.py`](../../../projojo_backend/db/reset_test_database.py:1)  
**Dependencies**: [PF-task-002a](PF-task-002a-canonical-portfolio-item-schema.md), [PF-task-002b](PF-task-002b-portfolio-review-schema-and-author-relations.md), [PF-task-002c](PF-task-002c-student-portfolio-settings-schema.md), [SF-task-004](../shared-foundation/SF-task-004-schema-ownership-and-seed-contract.md)

---

## Task Story

As a **developer writing portfolio tests**,  
I want deterministic portfolio seed fixtures and a documented reset workflow,  
so that API and browser scenarios can verify visibility, reviews, curation, public sharing, and archived-source behavior reliably.

---

## Why This Must Change

- The portfolio specification requires automated tests as a gate for every phase.
- Those tests need stable students, supervisors, teachers, businesses, registrations, portfolio items, reviews, ratings, slugs, and archived-source states.

---

## Acceptance Criteria

### AC-1: Required portfolio fixtures exist

**Given** [`test_seed.tql`](../../../projojo_backend/db/test_seed.tql:1) is applied  
**When** portfolio tests run  
**Then** deterministic fixtures exist for one student with completed portfolio items, one related supervisor/business, one unrelated supervisor/business, one teacher, one item with no ratings, one item with all ratings 3 or higher, one item with a rating below 3, one hidden item, one retracted authenticated-public item, one world-public portfolio page with selected item and selected review, and one archived-source item.

### AC-2: Fixtures have stable aliases

**Given** later API and browser tests rely on deterministic seed records  
**When** seed data is updated  
**Then** each required fixture has a stable human-readable alias for student, teacher, related supervisor, unrelated supervisor, business, registration, portfolio item, review, rating state, public slug, and archived-source state  
**And** tests do not rely on generated IDs or execution order.

### AC-3: Development reset loads cleanly

**Given** the database is reset and reseeded  
**When** the backend starts  
**Then** schema and seed data load without TypeDB cardinality or uniqueness violations  
**And** seeded portfolio records can be fetched by API baseline tests.

### AC-4: Reset and verification commands are documented

**Given** developers need to run portfolio tests locally  
**When** the seed contract is updated  
**Then** the developer reset/reseed command and seed verification command are documented near the seed contract or test instructions  
**And** the instructions are compatible with the shared foundation test gate.

### AC-5: Seed data supports phase-gated BDD coverage

**Given** [PF-task-019](PF-task-019-portfolio-bdd-api-and-browser-coverage.md) adds phase-gated scenarios  
**When** each phase test slice runs  
**Then** required aliases and records exist before scenario execution  
**And** tests can switch roles and assert visibility without mutating unrelated seed assumptions.

---

## Implementation Notes

- Because no production data must be preserved, reset-and-reseed is acceptable.
- Keep fixture names stable even if schema details change during implementation.

---

## Ambiguities and Defaults

- **Ambiguity**: Exact test user IDs depend on seed implementation.  
  **Default**: Use deterministic aliases in feature files and resolve actual IDs in test helpers or seed lookup steps.

---

## Test Expectations

- Seed smoke tests must prove reset/reseed success, fixture availability, alias stability, slug uniqueness fixture behavior, hidden/retracted/low-rated states, and archived-source fixture availability.

