# ARCH-task-020 — Verification and Final Cleanup

**User Story**: [ARCH-story-006 — Archive Readiness and Verification](ARCH-story-006-archive-readiness-and-verification.md)  
**Priority**: 🟡 High  
**Type**: Non-functional Task  
**Spec references**: [§8.4](../../ARCHIVING_SPECIFICATION.md), [§7.4](../../ARCHIVING_SPECIFICATION.md), Decision I-2  
**Dependencies**: All previous tasks

---

## Task Story

As a **team lead**,  
I want a comprehensive verification pass confirming that every aspect of the archiving specification is implemented, that all legacy code is removed, and that Qavajs E2E coverage exists for the critical paths,  
so that the archiving feature can be considered complete and shippable.

---

## Context: What Must Change and Why

The specification (§8.4) explicitly states: "This change is too cross-cutting to ship without automated verification." Decision I-2 requires a Qavajs-first E2E test strategy. This task is the final verification gate.

---

## Acceptance Criteria

### AC-1: No `isArchived` boolean remains in codebase

**Given** the full codebase is searched  
**When** searching for `isArchived`, `is_archived`, and any boolean archive flag  
**Then** zero results are found in:
- TypeDB schema
- Python domain models
- Repository mappers
- API response shapes
- Frontend logic

### AC-2: No hard-delete endpoints remain

**Given** the backend route files are audited  
**When** searching for destructive endpoints on project, business, and task resources  
**Then** the existing project hard-delete endpoint is gone  
**And** no hard-delete endpoint exists for business or task resources  
**And** no frontend code calls such endpoints

### AC-3: No draft business creation path remains

**Given** the full codebase is searched  
**When** searching for `as_draft`, `createAsDraft`, or draft-related business creation  
**Then** zero results are found

### AC-4: No `end_date` used for archive state

**Given** the frontend codebase is searched  
**When** reviewing any logic that determines whether an entity is archived  
**Then** no code uses `end_date` or date comparison to derive archive visibility  
**And** only `archived_at` presence is used

### AC-5: Qavajs E2E coverage for archive preview

**Given** the E2E test suite runs  
**Then** tests exist and pass for:
- Business archive preview shows correct affected entities
- Project archive preview shows correct affected tasks and registrations
- Task archive preview shows correct affected registrations

### AC-6: Qavajs E2E coverage for archive execute

**Given** the E2E test suite runs  
**Then** tests exist and pass for:
- Business archive execution cascades to all descendants
- Project archive execution cascades to tasks and registrations
- Task archive execution cascades to registrations

### AC-7: Qavajs E2E coverage for restore with matching and non-matching metadata

**Given** the E2E test suite runs  
**Then** tests exist and pass for:
- Restore preview showing preselected matching descendants
- Restore preview showing non-preselected independently-archived descendants
- Selective restore executing only for selected descendants

### AC-8: Qavajs E2E coverage for blocked child restore

**Given** the E2E test suite runs  
**Then** tests exist and pass for:
- Project restore blocked while parent business is archived
- Task restore blocked while parent project is archived
- Disabled restore buttons visible with explanation in teacher UI

### AC-9: Qavajs E2E coverage for student recently archived

**Given** the E2E test suite runs  
**Then** tests exist and pass for:
- Student dashboard showing registrations archived within 30 days
- Registrations older than 30 days not appearing

### AC-10: Qavajs E2E coverage for supervisor archive outcomes

**Given** the E2E test suite runs  
**Then** tests exist and pass for:
- Multi-business supervisor retains login when one business archived
- Supervisor login blocked when all businesses archived

### AC-11: Qavajs E2E coverage for public discovery filtering

**Given** the E2E test suite runs  
**Then** tests exist and pass for:
- Archived businesses not appearing on public discovery page
- Archived projects not appearing on public discovery page
- Registration count queries showing correct (non-archived) numbers

### AC-12: All UI copy is honest about notifications

**Given** all archive and restore modals and sections are reviewed  
**When** examining the text copy  
**Then** no text claims students will be automatically notified (since notifications are deferred)

### AC-13: Stale UI copy removed

**Given** all views mentioning archiving, drafts, or publication are reviewed  
**When** examining button labels, tooltips, and helper text  
**Then** no legacy "draft", "publish", or "publiceren" language remains in the archiving context  
**And** all archive/restore copy is in Dutch and matches the specified behavior

### AC-14: Archive API payload naming is consistent

**Given** archive request and response models, route signatures, and frontend service calls are reviewed  
**When** examining the HTTP contract  
**Then** archive API payload fields use snake_case naming such as `archived_reason`  
**And** TypeDB camelCase attribute names remain internal to schema/query/mapping code  
**And** no archive endpoint contract mixes `archivedReason` and `archived_reason` for the same HTTP field

---

## Technical Notes

### Verification checklist for developers

Before marking this task as complete, the developer should run:

1. `grep -r "isArchived\|is_archived" projojo_backend/ projojo_frontend/` → zero results
2. `grep -r "as_draft\|createAsDraft" projojo_backend/ projojo_frontend/` → zero results
3. Audit project/business/task route files for destructive endpoints → the existing project hard-delete route is gone and no business/task hard-delete route exists
4. Review every `.feature` file to confirm Qavajs scenarios cover the required paths from spec §8.4
5. Run full E2E test suite → all archiving scenarios pass

### Qavajs test structure (spec §8.4)

Required coverage categories (from spec):

| Category | Covered by |
|----------|-----------|
| Archive preview (business, project, task) | AC-5 |
| Archive execute (business, project, task) | AC-6 |
| Restore preview with matching/non-matching metadata | AC-7 |
| Blocked child restore | AC-8 |
| Disabled restore with explanation in UI | AC-8 |
| Student recently-archived visibility window | AC-9 |
| Multi-business supervisor outcomes | AC-10 |
| Supervisor login block | AC-10 |
| Public discovery filtering | AC-11 |
| Count-query correctness | AC-11 |

### Deferred items (do NOT verify yet)

- Student notifications on archive (deferred until email service exists — spec §7.5)
- Gmail-based Qavajs steps (deferred — spec §8.4)
- Audit log beyond archive metadata (not included — spec §10)

### Risks

- **Risk**: This task can only be completed after all other stories are done. It is the integration gate.
- **Risk**: Grep-based verification may miss renamed or obfuscated references. Manual code review is recommended in addition to automated search.

### Files likely affected

- Qavajs feature files in `tests/e2e/features/`
- Qavajs step definitions in `tests/e2e/steps/`
- No production code changes expected in this task (other than copy fixes found during review)
