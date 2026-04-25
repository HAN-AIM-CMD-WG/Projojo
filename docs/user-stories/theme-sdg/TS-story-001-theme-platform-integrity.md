# TS-story-001 — Theme Platform Integrity

**Priority**: 🔴 High  
**Type**: User Story  
**Dependencies**: None  
**Child tasks**: [TS-task-001](TS-task-001-theme-name-uniqueness.md), [TS-task-002](TS-task-002-project-deletion-cascade.md), [TS-task-003](TS-task-003-link-ownership-enforcement.md), [TS-task-004](TS-task-004-theme-input-validation.md), [TS-task-005](TS-task-005-atomic-theme-linking.md), [TS-task-006](TS-task-006-jwt-middleware-narrowing.md), [TS-task-007](TS-task-007-exception-logging.md), [TS-task-008](TS-task-008-link-existence-validation.md)

---

## User Story

As a **platform owner**,  
I want the theme system to be reliable, secure, and data-safe at the backend level,  
so that theme management and project-theme linking can be built on a stable foundation.

---

## Scope Included

- Theme name uniqueness and CRUD validation
- Correct deletion cascade behavior for theme links
- Ownership and authorization enforcement on theme linking
- Atomic project-theme linking behavior
- Safer JWT middleware scope for theme endpoints
- Exception logging and invalid-ID handling for backend theme flows

## Scope Excluded

- Teacher theme management UI
- Project create/edit theme selection UI
- SDG badge rendering
- Student interest features

---

## User Story Acceptance Criteria

1. Theme data integrity is enforced consistently at backend level.
2. Unauthorized users cannot modify theme links on projects they do not own.
3. Theme-link writes either fully succeed or fully fail.
4. Theme-related backend failures are observable rather than silently swallowed.
5. The child tasks in this user story are complete and provide a safe base for UI work.

---

## Child Tasks

1. [TS-task-001 — Enforce Theme Name Uniqueness](TS-task-001-theme-name-uniqueness.md)
2. [TS-task-002 — Fix Project Deletion Cascade for hasTheme](TS-task-002-project-deletion-cascade.md)
3. [TS-task-003 — Enforce Ownership on Project-Theme Linking](TS-task-003-link-ownership-enforcement.md)
4. [TS-task-004 — Add Input Validation on Theme CRUD](TS-task-004-theme-input-validation.md)
5. [TS-task-005 — Make Project-Theme Linking Atomic](TS-task-005-atomic-theme-linking.md)
6. [TS-task-006 — Narrow JWT Middleware Exclusion for Themes](TS-task-006-jwt-middleware-narrowing.md)
7. [TS-task-007 — Replace Silent Exception Swallowing with Logging](TS-task-007-exception-logging.md)
8. [TS-task-008 — Validate Theme/Project Existence in Link Endpoint](TS-task-008-link-existence-validation.md)

---

## Definition of Done

- The backend theme/linking model is safe against common integrity and authorization failures.
- UI stories no longer depend on undefined or unsafe backend behavior.
- Known audit issues in backend/data-integrity scope are addressed by completed child tasks.
