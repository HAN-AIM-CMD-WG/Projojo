# PF-task-018a — Portfolio Cross-Epic Regression Gate

**Phase**: 6 — Cross-Epic Regression and Readiness  
**Epic**: Portfolio Readiness  
**Priority**: 🔴 Critical  
**Type**: Non-functional Task (Regression)  
**Spec references**: [Portfolio spec Phase 6](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:787), [§9](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:825), [Risk register](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:853)  
**Current-state references**: [`ARCH-task-020` verification checklist](../archiving/ARCH-task-020-verification-cleanup.md:138), [`tests/e2e`](../../../tests/e2e:1)  
**Dependencies**: [PF-task-015](PF-task-015-authenticated-portfolio-ui-completed-only.md), [PF-task-016a](PF-task-016a-portfolio-item-review-and-rating-display-ui.md), [PF-task-016b](PF-task-016b-portfolio-item-visibility-badges-and-explanations-ui.md), [PF-task-016c](PF-task-016c-portfolio-item-owner-curation-controls-ui.md), [PF-task-016d](PF-task-016d-teacher-portfolio-item-hide-control-ui.md), [PF-task-017](PF-task-017-public-portfolio-page-ui.md), Archiving implementation aligned with [SF-task-003](../shared-foundation/SF-task-003-archive-only-portfolio-contract.md), Theme/SDG implementation aligned with [SF-task-004](../shared-foundation/SF-task-004-schema-ownership-and-seed-contract.md)

---

## Task Story

As a **product owner and release reviewer**,  
I want Portfolio, Archiving, and Theme/SDG regression checks to pass together,  
so that the portfolio system is ready to merge without breaking shared contracts.

---

## Acceptance Criteria

### AC-1: Full E2E suite passes

**Given** Portfolio frontend integration is complete  
**When** [`task test:e2e`](../../TESTING_INFRASTRUCTURE.md:93) is run against the seeded test stack  
**Then** portfolio auth, lifecycle, review, visibility, public, and archiving integration tests pass  
**And** existing public discovery and Theme/SDG tests remain green.

### AC-2: Hard-delete routes are absent

**Given** the codebase is audited  
**When** project, business, and task routes are inspected  
**Then** no hard-delete endpoint exists for those entities  
**And** verification remains compatible with the Archiving cleanup checklist.

### AC-3: Portfolio source archiving regression passes

**Given** a portfolio item exists for a completed registration  
**When** its source project, task, or business is archived  
**Then** the portfolio item remains visible with archived-source context  
**And** source navigation behavior matches the API contract.

### AC-4: Theme/SDG source display remains compatible

**Given** portfolio items copy source task, project, business, skill, and timeline fields  
**When** Theme/SDG changes are present  
**Then** portfolio source display and joins remain correct  
**And** Theme/SDG changes do not rewrite shared seed data in a way that breaks portfolio tests.

### AC-5: Regression gate is not started before dependencies are ready

**Given** frontend integration or aligned Archiving/Theme/SDG work is incomplete  
**When** this task is reviewed  
**Then** it remains blocked  
**And** incomplete upstream work is not hidden by partial regression results.

---

## Implementation Notes

- This task is the release-readiness regression gate and should not be started until Phase 5 UI work and aligned Archiving/Theme/SDG tasks are available.
- Documentation cleanup is handled separately by [PF-task-018b](PF-task-018b-portfolio-documentation-cleanup.md).

---

## Ambiguities and Defaults

- **Ambiguity**: Exact cross-epic conflict list may change as parallel streams land.  
  **Default**: Run the full suite and verify the explicit Phase 6 portfolio, archive, and Theme/SDG scenarios.

---

## Test Expectations

- Full E2E suite must pass and include Portfolio plus Archiving integration scenarios.

