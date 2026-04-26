# PF-story-007 — Release Readiness, Cross-Epic Regression, and Documentation Alignment

**Priority**: 🔴 Critical  
**Type**: User Story  
**Dependencies**: [PF-story-005](PF-story-005-public-portfolio-viewing.md), [PF-story-006](PF-story-006-authenticated-portfolio-frontend-integration.md), Archiving implementation aligned with [SF-task-003](../shared-foundation/SF-task-003-archive-only-portfolio-contract.md), Theme/SDG implementation aligned with [SF-task-004](../shared-foundation/SF-task-004-schema-ownership-and-seed-contract.md)  
**Child tasks**: [PF-task-018a](PF-task-018a-portfolio-cross-epic-regression-gate.md), [PF-task-018b](PF-task-018b-portfolio-documentation-cleanup.md), [PF-task-019](PF-task-019-portfolio-bdd-api-and-browser-coverage.md)

---

## User Story

As a **product owner and release reviewer**,  
I want Portfolio, Archiving, Theme/SDG, tests, and documentation to agree,  
so that the portfolio system can merge without stale snapshot or hard-delete assumptions.

---

## Scope Included

- Full E2E suite verification
- Portfolio plus Archiving regression scenarios
- Hard-delete absence verification
- Portfolio source archiving survival
- Theme/SDG source display compatibility
- Current documentation cleanup for snapshot and hard-delete assumptions
- Deferred notification copy debt documentation

## Scope Excluded

- New portfolio feature implementation
- Notification system implementation
- Performance targets beyond correctness-oriented tests
- Admin-only hidden/retired portfolio management

---

## User Story Acceptance Criteria

1. Full E2E suite passes against the seeded test stack.
2. Hard-delete behavior is absent from target project, business, and task routes and verification checks.
3. Portfolio evidence survives source archiving with correct archived-source context.
4. Theme/SDG source display remains compatible with copied portfolio source fields.
5. Current target documentation no longer describes snapshot-on-hard-delete as target behavior.
6. Remaining notification copy conflicts are documented as deferred debt and do not contradict portfolio evidence or hard-delete removal.

---

## Child Tasks

1. [PF-task-018a — Portfolio Cross-Epic Regression Gate](PF-task-018a-portfolio-cross-epic-regression-gate.md)
2. [PF-task-018b — Portfolio Documentation Cleanup for Snapshot and Hard-Delete Assumptions](PF-task-018b-portfolio-documentation-cleanup.md)
3. [PF-task-019 — Portfolio BDD API and Browser Coverage](PF-task-019-portfolio-bdd-api-and-browser-coverage.md) — Phase 6 readiness slice

---

## Definition of Done

- Portfolio, Archiving, and Theme/SDG behavior pass together through the shared test gate.
- Current documentation matches the accepted target portfolio model.
- Release reviewers can evaluate readiness without relying on stale snapshot or hard-delete assumptions.

