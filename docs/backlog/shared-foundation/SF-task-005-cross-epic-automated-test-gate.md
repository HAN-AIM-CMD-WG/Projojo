# SF-task-005 — Cross-Epic Automated Test Gate Baseline

**Phase**: 0 — Shared Foundation Contract  
**Epic**: Shared Foundation — Verification  
**Priority**: 🔴 Critical  
**Type**: Technical Task (Testing)  
**Spec references**: [Portfolio spec §1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:24), [Phase 0 automated gate](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:588), [ADR-008](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:424), [§9](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:825)  
**Current-state references**: [`TESTING_INFRASTRUCTURE.md`](../../TESTING_INFRASTRUCTURE.md:1), [`task test:e2e`](../../TESTING_INFRASTRUCTURE.md:93), [`infrastructure.steps.cjs` API patterns](../../../tests/e2e/steps/infrastructure.steps.cjs:104), [`tests/e2e/features`](../../../tests/e2e/features:1)  
**Dependencies**: [SF-task-004](SF-task-004-schema-ownership-and-seed-contract.md)

---

## Task Story

As a **developer or reviewer**,  
I want a shared automated test gate before Portfolio implementation begins,  
so that each phase can prove API and browser behavior instead of relying on manual verification.

---

## Why This Must Change

- The specification makes automated API and E2E tests a gate for every phase.
- The current E2E infrastructure already has API request and response assertions in [`infrastructure.steps.cjs`](../../../tests/e2e/steps/infrastructure.steps.cjs:104), but no portfolio-specific feature coverage exists yet.
- Without a shared baseline, Portfolio, Archiving, and Theme/SDG can each add tests that assume incompatible seed data or conflicting route contracts.

---

## Acceptance Criteria

### AC-1: Phase 0 test gate runs successfully

**Given** the repository is reset to the agreed test seed state  
**When** [`task test:e2e`](../../TESTING_INFRASTRUCTURE.md:93) is run  
**Then** the E2E runner loads successfully  
**And** existing stack-health and API-memory features continue to pass.

### AC-2: Portfolio test feature placeholders are tracked

**Given** the Portfolio backlog is created  
**When** developers plan test work  
**Then** tasks reference the required feature coverage for portfolio auth, lifecycle, reviews, visibility, public portfolio, and archiving integration  
**And** the required feature names trace to [Portfolio spec §9](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:829).

### AC-3: Shared API step strategy is documented

**Given** Portfolio tests require authenticated API calls  
**When** step definitions are extended  
**Then** the contract identifies whether to extend [`infrastructure.steps.cjs`](../../../tests/e2e/steps/infrastructure.steps.cjs:104) or add dedicated portfolio step files  
**And** it preserves existing response status and memory patterns.

### AC-4: Seed reset path is part of the gate

**Given** deterministic seed data is required  
**When** the test gate is executed  
**Then** the reset path for the isolated test stack is verified with [`task test:e2e:reset`](../../TESTING_INFRASTRUCTURE.md:106) or the full [`task test:e2e`](../../TESTING_INFRASTRUCTURE.md:93) workflow before portfolio tests rely on seeded identities, slugs, ratings, reviews, or archive metadata  
**And** the verification identifies [`projojo_backend/db/test_seed.tql`](../../../projojo_backend/db/test_seed.tql:1) as the authoritative deterministic E2E seed  
**And** preflight verification through [`task test:e2e:preflight`](../../TESTING_INFRASTRUCTURE.md:106) or the full workflow proves the seeded stack is reachable before feature scenarios run.

### AC-5: Cross-epic regression categories are listed

**Given** Portfolio, Archiving, and Theme/SDG are worked in parallel  
**When** phase gates are defined  
**Then** the test contract includes route removal for stale portfolio and hard-delete endpoints, archive-only behavior, source archiving with portfolio evidence survival, and Theme/SDG source display joins.

### AC-6: Completion evidence is reviewable

**Given** this task is marked complete  
**When** a reviewer checks the submitted change  
**Then** they can identify the created or updated test-gate artifact, the exact reset and preflight command references, the named portfolio feature placeholders, the cross-epic regression categories, and the expected report artifact at [`tests/e2e/reports/report.html`](../../../tests/e2e/reports/report.html)  
**And** the reviewer can confirm which command output or report proves that the E2E runner, seed reset path, and existing stack-health and API-memory features still pass.

---

## Implementation Notes

- This is not a substitute for detailed feature tests. It creates the baseline and naming convention that later tasks must satisfy.
- Prefer API-level tests for authorization and visibility matrices before adding browser tests for UI integration.
- Keep each acceptance criterion specific enough that a developer can derive a small set of Qavajs scenarios without embedding full executable scenario text in the task.

---

## Ambiguities and Defaults

- **Ambiguity**: The final split between shared and portfolio-specific step files is not specified.  
  **Default**: Keep generic API helpers in shared infrastructure and add portfolio-specific step files only when domain language becomes too specialized.

---

## Test Expectations

- The gate must be lightweight in Phase 0 but must prevent merging changes that break the E2E runner, preflight check, or seed reset path.
- Review evidence must include the command or commands run and either successful terminal output or the saved Qavajs report artifact.
