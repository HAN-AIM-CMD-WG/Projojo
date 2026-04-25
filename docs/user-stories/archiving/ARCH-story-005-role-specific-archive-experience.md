# ARCH-story-005 — Role-Specific Archive Experience

**Priority**: 🟡 High  
**Type**: User Story  
**Dependencies**: [ARCH-story-001](ARCH-story-001-archiving-foundations.md), [ARCH-story-004](ARCH-story-004-archive-management-ux.md)  
**Child tasks**: [ARCH-task-016](ARCH-task-016-student-recently-archived.md), [ARCH-task-017](ARCH-task-017-supervisor-login-block.md), [ARCH-task-018](ARCH-task-018-supervisor-business-switcher.md)

---

## User Story

As a **student or supervisor**,  
I want archive-related behavior to reflect my role and current access context,  
so that I understand what changed, keep valid access where appropriate, and am blocked clearly when access should end.

---

## Scope Included

- Student read-only visibility of recently archived registrations
- Supervisor login blocking when no active businesses remain
- Multi-business supervisor switching across active businesses

## Scope Excluded

- Teacher archive-management workflows
- Backend archive/restore endpoint behavior not directly tied to student or supervisor outcomes
- Final verification gate

---

## User Story Acceptance Criteria

1. Students can see recently archived registrations in a read-only experience.
2. Supervisors retain access when at least one active business remains.
3. Supervisors are blocked clearly when no active business remains.
4. Multi-business supervisors can switch active business context without re-authenticating.
5. The child tasks in this user story are complete and consistent with the underlying archive rules.

---

## Child Tasks

1. [ARCH-task-016 — Student Dashboard: Recently Archived Registrations](ARCH-task-016-student-recently-archived.md)
2. [ARCH-task-017 — Supervisor Login Block for Fully Archived Accounts](ARCH-task-017-supervisor-login-block.md)
3. [ARCH-task-018 — Multi-Business Supervisor Switcher](ARCH-task-018-supervisor-business-switcher.md)

---

## Definition of Done

- Student and supervisor archive consequences are visible, consistent, and role-appropriate.
- Multi-business supervisor behavior matches the updated supervisor model.
- No role receives misleading access, messaging, or archive-state behavior.
