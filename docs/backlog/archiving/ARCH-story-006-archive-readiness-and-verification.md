# ARCH-story-006 — Archive Readiness and Verification

**Priority**: 🟡 High  
**Type**: User Story  
**Dependencies**: [ARCH-story-001](ARCH-story-001-archiving-foundations.md), [ARCH-story-002](ARCH-story-002-archive-operations.md), [ARCH-story-003](ARCH-story-003-restore-operations.md), [ARCH-story-004](ARCH-story-004-archive-management-ux.md), [ARCH-story-005](ARCH-story-005-role-specific-archive-experience.md)  
**Child tasks**: [ARCH-task-019](ARCH-task-019-seed-data.md), [ARCH-task-020](ARCH-task-020-verification-cleanup.md)

---

## User Story

As a **team lead**,  
I want representative archive seed data and a final verification gate,  
so that the archiving capability is demonstrably complete, testable, and safe to ship.

---

## Scope Included

- Seed data for key archive and restore scenarios
- Verification that legacy behavior is removed
- Verification that archive/restore flows are covered by Qavajs tests
- Final cleanup of stale copy and inconsistent API-contract usage

## Scope Excluded

- Net-new archive or restore product behavior
- Teacher/student/supervisor feature design beyond verification needs

---

## User Story Acceptance Criteria

1. Seed data covers the key archive, restore, collision, and role-based scenarios.
2. Verification confirms removal of obsolete archive contracts and legacy behaviors.
3. Automated end-to-end coverage exists for the critical archive and restore paths.
4. HTTP naming and archive metadata usage are consistent across the delivered feature.
5. The child tasks in this user story are complete and provide a credible release gate.

---

## Child Tasks

1. [ARCH-task-019 — Seed Data for Archive Scenarios](ARCH-task-019-seed-data.md)
2. [ARCH-task-020 — Verification and Final Cleanup](ARCH-task-020-verification-cleanup.md)

---

## Definition of Done

- Seed data supports manual and automated verification.
- Verification catches regressions in archive behavior, restore behavior, and legacy cleanup.
- The archiving backlog has an explicit completion gate rather than implicit trust.
