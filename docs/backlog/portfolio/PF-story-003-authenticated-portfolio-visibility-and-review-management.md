# PF-story-003 — Authenticated Portfolio Visibility and Review Management

**Priority**: 🔴 Critical  
**Type**: User Story  
**Dependencies**: [PF-story-002](PF-story-002-verified-completion-creates-trustworthy-portfolio-evidence.md), [SF-task-001](../shared-foundation/SF-task-001-shared-authorization-contract.md), [SF-task-003](../shared-foundation/SF-task-003-archive-only-portfolio-contract.md)  
**Child tasks**: [PF-task-007a](PF-task-007a-authenticated-portfolio-read-access-matrix.md), [PF-task-007b](PF-task-007b-supervisor-authenticated-public-item-filtering.md), [PF-task-007c](PF-task-007c-student-authenticated-public-retraction-api.md), [PF-task-007d](PF-task-007d-authenticated-portfolio-response-contract-examples.md), [PF-task-008](PF-task-008-review-creation-and-editing.md), [PF-task-009](PF-task-009-archived-source-context.md), [PF-task-019](PF-task-019-portfolio-bdd-api-and-browser-coverage.md)

---

## User Story

As a **student, teacher, or related supervisor**,  
I want authenticated portfolio views and review actions to follow explicit backend visibility rules,  
so that useful portfolio evidence is available without leaking hidden, retired, retracted, unrelated, or low-rated content.

---

## Scope Included

- Authenticated portfolio read access matrix
- Supervisor relationship gate
- Supervisor authenticated-public item filtering
- Rating-gated visibility behavior
- Student authenticated-public retraction API
- Authenticated response contract examples
- Additional review creation and review editing API
- Archived-source labels and navigation availability
- Phase 3 automated visibility, review, and archiving coverage slice

## Scope Excluded

- World-public portfolio page publishing
- Student item ordering, student hide/show, and item world-visible selection
- Frontend review display and curation controls
- Admin-only hidden or retired item review surface

---

## User Story Acceptance Criteria

1. Student and teacher private views show all non-retired, non-hidden items and reviews.
2. Related supervisors see only authenticated-public eligible items and reviews.
3. Unrelated supervisors are denied at portfolio level rather than receiving an empty successful view.
4. Rating changes immediately affect supervisor visibility according to the full rating-gated model.
5. Additional review creation and review editing follow author, teacher, and same-business supervisor permissions.
6. Archived-source labels and navigation availability are explicit in the authenticated read model.

---

## Child Tasks

1. [PF-task-007a — Authenticated Portfolio Read Access Matrix](PF-task-007a-authenticated-portfolio-read-access-matrix.md)
2. [PF-task-007b — Supervisor Authenticated-Public Item Filtering](PF-task-007b-supervisor-authenticated-public-item-filtering.md)
3. [PF-task-007c — Student Authenticated-Public Retraction API](PF-task-007c-student-authenticated-public-retraction-api.md)
4. [PF-task-007d — Authenticated Portfolio Response Contract Examples](PF-task-007d-authenticated-portfolio-response-contract-examples.md)
5. [PF-task-008 — Additional Review Creation and Review Editing](PF-task-008-review-creation-and-editing.md)
6. [PF-task-009 — Archived-Source Portfolio Context and Disabled Navigation](PF-task-009-archived-source-context.md)
7. [PF-task-019 — Portfolio BDD API and Browser Coverage](PF-task-019-portfolio-bdd-api-and-browser-coverage.md) — Phase 3 coverage slice

---

## Definition of Done

- Authenticated read behavior is enforced by backend policy, not frontend filtering.
- Review creation/editing and rating-gate recalculation are verified by automated tests.
- API response examples are stable enough for frontend and BDD work.

