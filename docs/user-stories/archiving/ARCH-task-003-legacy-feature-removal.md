# ARCH-task-003 — Legacy Feature Removal: Draft Business, Hard-Delete, Portfolio Snapshot

**User Story**: [ARCH-story-001 — Archiving Foundations](ARCH-story-001-archiving-foundations.md)  
**Priority**: 🔴 Critical  
**Type**: Technical Task  
**Spec references**: [§1](../../ARCHIVING_SPECIFICATION.md), [§7.4](../../ARCHIVING_SPECIFICATION.md), Decision Log R-7, R-8, I-1  
**Dependencies**: [ARCH-task-001](ARCH-task-001-schema-migration.md) (schema must be migrated first)

---

## Task Story

As a **developer**,  
I want draft business creation, hard-delete endpoints, and hard-delete-only portfolio snapshotting removed from the codebase,  
so that legacy code paths that conflict with the archiving specification are eliminated before new archive features are built on top.

---

## Context: What Must Change and Why

The current `next-ui` codebase contains three legacy features that the specification explicitly removes:

### 1. Draft business creation (spec §7.4, Decision R-8)

The current [`business_router.py:90`](../../../projojo_backend/routes/business_router.py:90) accepts `as_draft: bool = Body(False)` which creates businesses with `isArchived true` as a "draft" mechanism. The [`business_repository.py:271`](../../../projojo_backend/domain/repositories/business_repository.py:271) has a separate `as_draft` code path that inserts `isArchived true`. The frontend [`TeacherPage.jsx:21`](../../../projojo_frontend/src/pages/TeacherPage.jsx:21) has a `createAsDraft` state variable and checkbox.

**Why remove**: The archiving system is for archiving active entities, not for draft workflows. Conflating "not yet published" with "archived" creates confusing state semantics.

### 2. Hard-delete (spec §7.4, Decision R-7)

The specification's intent is clear: hard-delete is being removed from the product. In the current codebase, the confirmed hard-delete surface is the teacher-only project delete flow. This task removes that destructive path and verifies that no business/task hard-delete endpoint remains or is introduced as part of the archiving work.

**Why remove**: Archiving replaces deletion. Hard-delete bypasses the archive audit trail and makes restore impossible.

### 3. Portfolio snapshotting tied to hard-delete (spec §7.4)

The [`portfolio_repository.py`](../../../projojo_backend/domain/repositories/portfolio_repository.py:115) contains snapshot logic that may only exist to preserve data before hard-delete. If this snapshotting has no legitimate use outside the hard-delete flow, it should be removed.

**Why conditionally remove**: The spec says "remove portfolio snapshotting if it only exists to support hard-delete." This requires an audit before removal — if portfolio snapshots serve other purposes (e.g., student portfolio exports), they must be preserved.

---

## Acceptance Criteria

### AC-1: Draft business creation removed from backend

**Given** the business creation endpoint is updated  
**When** a POST request is made to `/businesses/`  
**Then** the `as_draft` parameter is not accepted  
**And** all newly created businesses are active (no archive attributes set)  
**And** the `as_draft` code path in the business repository is removed

### AC-2: Draft business creation removed from frontend

**Given** the TeacherPage business creation modal is updated  
**When** a teacher creates a new business  
**Then** there is no "create as draft" checkbox or option  
**And** the `createAsDraft` state variable is removed  
**And** the service call does not pass an `as_draft` parameter

### AC-3: Draft/publication wording removed from UI

**Given** the TeacherPage and any business-related UI components are reviewed  
**When** examining button labels, tooltips, and helper text  
**Then** no wording references "draft", "publish", or "publiceren" in the context of business creation  
**And** the archived section restore button title no longer says "Publiceren" (currently [`TeacherPage.jsx:239`](../../../projojo_frontend/src/pages/TeacherPage.jsx:239))

### AC-4: Hard-delete endpoints removed for archivable entities

**Given** the route files are audited  
**When** checking for destructive endpoints on project, business, and task resources  
**Then** the current project hard-delete endpoint is removed  
**And** no hard-delete endpoint exists for business or task resources  
**And** any frontend code that calls such delete endpoints is also removed

### AC-5: Portfolio snapshotting removed

**Given** the project hard-delete flow is removed from the codebase
**When** the portfolio snapshot creation code is audited
**Then** snapshot creation that exists only to support hard-delete is removed
**And** any legitimate non-delete snapshot-reading functionality is preserved
**And** if the audit finds another active product use for snapshot creation, that use is documented and the hard-delete trigger is removed without deleting the still-valid behavior

### AC-6: No orphaned frontend references to removed features

**Given** all legacy features are removed from the backend  
**When** searching the frontend codebase for references to removed endpoints or parameters  
**Then** no service functions call deleted endpoints  
**And** no components reference `as_draft`, `createAsDraft`, or hard-delete actions  
**And** no dead imports remain

### AC-7: Existing non-archive functionality unaffected

**Given** legacy archive-adjacent features are removed  
**When** running the application  
**Then** business creation (without draft) works normally  
**And** business, project, and task viewing works normally  
**And** no unrelated features are broken

---

## Technical Notes

### Current code locations to remove/modify

**Backend — draft business:**
- [`projojo_backend/routes/business_router.py:90`](../../../projojo_backend/routes/business_router.py:90): Remove `as_draft` parameter from `create_business`
- [`projojo_backend/domain/repositories/business_repository.py:271`](../../../projojo_backend/domain/repositories/business_repository.py:271): Remove `as_draft` branch in `create()` method

**Frontend — draft business:**
- [`projojo_frontend/src/pages/TeacherPage.jsx:21`](../../../projojo_frontend/src/pages/TeacherPage.jsx:21): Remove `createAsDraft` state
- [`projojo_frontend/src/pages/TeacherPage.jsx:35`](../../../projojo_frontend/src/pages/TeacherPage.jsx:35): Remove `createAsDraft` from `onCreateNewBusiness`
- [`projojo_frontend/src/services.js`](../../../projojo_frontend/src/services.js): Remove `asDraft` parameter from `createNewBusiness` function

**Frontend — draft/publication wording:**
- [`projojo_frontend/src/pages/TeacherPage.jsx:239`](../../../projojo_frontend/src/pages/TeacherPage.jsx:239): Change restore button title from "Publiceren" to "Herstellen"

**Backend — hard-delete:**
- Audit all route files for `@router.delete` endpoints on businesses, projects, tasks
- Audit `student_router.py` for any portfolio-snapshot-then-delete flows

**Portfolio snapshotting:**
- [`projojo_backend/domain/repositories/portfolio_repository.py`](../../../projojo_backend/domain/repositories/portfolio_repository.py): Audit snapshot creation trigger

### Risks

- **Risk**: Removing hard-delete may affect admin/maintenance tooling. If any internal tooling depends on DELETE endpoints, document the removal and provide an alternative (archive instead).
- **Risk**: Portfolio snapshot audit is conditional — the developer must make a judgment call based on code analysis and document the decision.

### Resolved decisions

- **Portfolio snapshotting scope**: Keep the spec's conditional rule. Remove snapshot creation only where it exists to support hard-delete. Do not delete legitimate snapshot behavior without evidence that it is hard-delete-only.
