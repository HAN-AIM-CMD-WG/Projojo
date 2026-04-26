# PF-story-002 — Verified Completion Creates Trustworthy Portfolio Evidence

**Priority**: 🔴 Critical  
**Type**: User Story  
**Dependencies**: [PF-story-001](PF-story-001-portfolio-backend-replacement-foundation.md), [SF-task-002](../shared-foundation/SF-task-002-registration-lifecycle-contract.md)  
**Child tasks**: [PF-task-004](PF-task-004-registration-lifecycle-api-and-state-machine.md), [PF-task-005](PF-task-005-completion-creates-portfolio-item-and-review.md), [PF-task-006](PF-task-006-revert-and-recompletion-behavior.md), [PF-task-012b](PF-task-012b-reviewer-public-use-notice-enforcement.md), [PF-task-019](PF-task-019-portfolio-bdd-api-and-browser-coverage.md)

---

## User Story

As a **student completing verified work**,  
I want authorized completion to create stable portfolio evidence with required review rules,  
so that my portfolio reflects credible completed work rather than live task state.

---

## Scope Included

- Registration lifecycle authorization for start, complete, revert, and timeline endpoints
- Strict accepted → started → completed transition validation
- Completion-time canonical portfolio item creation
- Supervisor required review text and optional rating
- Teacher optional review text and optional rating
- Public-use notice enforcement for submitted review text
- Revert completion, revert start, and re-completion behavior
- Phase 2 automated lifecycle and review coverage slice

## Scope Excluded

- Additional post-completion reviews
- Authenticated supervisor item filtering beyond lifecycle-created data
- Student curation and world-public publication
- Frontend completion form implementation

---

## User Story Acceptance Criteria

1. Only teachers and owning-business supervisors can mutate lifecycle state, while students can only view their own timeline.
2. Completion requires a valid started registration and creates one canonical portfolio item.
3. Supervisor completion without non-empty review text is rejected, while teacher completion can succeed without review text.
4. Review ratings and public-use notice acceptance are validated when review text is submitted.
5. Reverting completion retires the portfolio item and reviews, and re-completion creates a new item rather than reusing retired evidence.

---

## Child Tasks

1. [PF-task-004 — Registration Lifecycle API Authorization and State Machine](PF-task-004-registration-lifecycle-api-and-state-machine.md)
2. [PF-task-005 — Completion Creates Canonical Portfolio Item and Initial Review](PF-task-005-completion-creates-portfolio-item-and-review.md)
3. [PF-task-006 — Revert Completion, Revert Start, and Re-completion Behavior](PF-task-006-revert-and-recompletion-behavior.md)
4. [PF-task-012b — Reviewer Public-Use Notice Enforcement](PF-task-012b-reviewer-public-use-notice-enforcement.md)
5. [PF-task-019 — Portfolio BDD API and Browser Coverage](PF-task-019-portfolio-bdd-api-and-browser-coverage.md) — Phase 2 coverage slice

---

## Definition of Done

- Completion state is trustworthy enough to create portfolio evidence.
- Completion, review validation, revert, and re-completion behavior are covered by automated API scenarios.
- No lifecycle transition depends on stale portfolio derivation or frontend-only validation.

