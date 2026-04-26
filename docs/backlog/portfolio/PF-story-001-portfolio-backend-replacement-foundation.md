# PF-story-001 — Portfolio Backend Replacement Foundation

**Priority**: 🔴 Critical  
**Type**: User Story  
**Dependencies**: [SF-task-001](../shared-foundation/SF-task-001-shared-authorization-contract.md), [SF-task-003](../shared-foundation/SF-task-003-archive-only-portfolio-contract.md), [SF-task-004](../shared-foundation/SF-task-004-schema-ownership-and-seed-contract.md), [SF-task-005](../shared-foundation/SF-task-005-cross-epic-automated-test-gate.md)  
**Child tasks**: [PF-task-001](PF-task-001-remove-stale-portfolio-backend.md), [PF-task-002a](PF-task-002a-canonical-portfolio-item-schema.md), [PF-task-002b](PF-task-002b-portfolio-review-schema-and-author-relations.md), [PF-task-002c](PF-task-002c-student-portfolio-settings-schema.md), [PF-task-002d](PF-task-002d-portfolio-seed-fixtures-and-reset-contract.md), [PF-task-003](PF-task-003-authenticated-portfolio-api-baseline.md), [PF-task-019](PF-task-019-portfolio-bdd-api-and-browser-coverage.md)

---

## User Story

As a **developer building the portfolio foundation**,  
I want stale snapshot and mixed active/completed portfolio behavior replaced with canonical schema and safe baseline endpoints,  
so that later lifecycle, visibility, and UI work can rely on a clean portfolio domain.

---

## Scope Included

- Removal or decommissioning of stale snapshot and active-work portfolio behavior
- Canonical portfolio item schema
- Portfolio review schema and review author relation design
- Student portfolio settings schema
- Deterministic portfolio seed fixtures and reset workflow
- New authenticated portfolio API baseline
- Private-by-default public slug guard
- Phase 1 automated coverage slice

## Scope Excluded

- Registration lifecycle state transitions
- Completion-time portfolio item creation
- Full authenticated-public item filtering
- Student curation workflows beyond schema support
- Frontend portfolio integration beyond API contract needs

---

## User Story Acceptance Criteria

1. Legacy snapshot and active-work portfolio behavior no longer returns successful target portfolio data.
2. Canonical portfolio item, review, student settings, and deterministic seed concepts exist as implementation-ready foundations.
3. New authenticated portfolio endpoint enforces owner, teacher, related supervisor, unrelated supervisor, and unauthenticated access rules at baseline level.
4. Public slug access is private by default and leaks no item or review data.
5. The child tasks in this user story provide a safe Phase 1 base for lifecycle, visibility, public sharing, and frontend work.

---

## Child Tasks

1. [PF-task-001 — Remove Stale Snapshot and Mixed Portfolio Backend](PF-task-001-remove-stale-portfolio-backend.md)
2. [PF-task-002a — Canonical Portfolio Item Schema](PF-task-002a-canonical-portfolio-item-schema.md)
3. [PF-task-002b — Portfolio Review Schema and Author Relations](PF-task-002b-portfolio-review-schema-and-author-relations.md)
4. [PF-task-002c — Student Portfolio Settings Schema](PF-task-002c-student-portfolio-settings-schema.md)
5. [PF-task-002d — Portfolio Seed Fixtures and Reset Contract](PF-task-002d-portfolio-seed-fixtures-and-reset-contract.md)
6. [PF-task-003 — Authenticated Portfolio API Baseline and Public Slug Guard](PF-task-003-authenticated-portfolio-api-baseline.md)
7. [PF-task-019 — Portfolio BDD API and Browser Coverage](PF-task-019-portfolio-bdd-api-and-browser-coverage.md) — Phase 1 coverage slice

---

## Definition of Done

- The stale portfolio backend is gone or unreachable for target behavior.
- The canonical schema and seed baseline can support the next portfolio phases.
- Baseline API and BDD coverage prove the new endpoint surface is safe enough for implementation to continue.

