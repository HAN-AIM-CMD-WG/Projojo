# SF-task-003 — Archive-Only and Portfolio Evidence Contract

**Phase**: 0 — Shared Foundation Contract  
**Epic**: Shared Foundation — Archive and Portfolio Boundary  
**Priority**: 🔴 Critical  
**Type**: Technical Task (Cross-epic Contract)  
**Spec references**: [Portfolio spec §3.8](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:237), [§6 ADR-006](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:408), [Phase 0 tasks](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:562), [Phase 6](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:787), [Archiving spec §7.4](../../plans/ARCHIVING_SPECIFICATION.md:611)  
**Current-state references**: [`delete_project()` hard-delete route](../../../projojo_backend/routes/project_router.py:416), [`PortfolioRepository.create_snapshot()`](../../../projojo_backend/domain/repositories/portfolio_repository.py:10), [`ProjectActionModal` delete copy](../../../projojo_frontend/src/components/ProjectActionModal.jsx:50), [`PortfolioList` snapshot copy](../../../projojo_frontend/src/components/PortfolioList.jsx:220)  
**Dependencies**: [SF-task-001](SF-task-001-shared-authorization-contract.md), [SF-task-002](SF-task-002-registration-lifecycle-contract.md)

---

## Task Story

As a **developer working across Portfolio and Archiving**,  
I want a shared archive-only contract that explains how archived sources affect portfolio evidence,  
so that archiving does not destroy or silently hide completed-work records.

---

## Why This Must Change

- The target specification removes hard-delete and hard-delete-only portfolio snapshotting.
- The current route at [`delete_project()`](../../../projojo_backend/routes/project_router.py:416) permanently deletes projects and creates portfolio snapshots through [`PortfolioRepository.create_snapshot()`](../../../projojo_backend/domain/repositories/portfolio_repository.py:10), which conflicts with [ADR-006](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:408).
- The current frontend still exposes permanent delete behavior and snapshot explanations in [`ProjectActionModal`](../../../projojo_frontend/src/components/ProjectActionModal.jsx:50) and [`PortfolioList`](../../../projojo_frontend/src/components/PortfolioList.jsx:220).

---

## Acceptance Criteria

### AC-1: Hard-delete removal rule is documented

**Given** Phase 0 is accepted  
**When** a developer reviews archive-related work  
**Then** the contract states that hard-delete for project, business, and task entities is not part of the target product  
**And** project hard-delete snapshotting must not be reused as portfolio preservation behavior.

### AC-2: Portfolio evidence survives archived source records

**Given** a portfolio item exists for completed work  
**When** its source project, task, or business becomes archived  
**Then** the item remains visible according to portfolio visibility rules  
**And** the source archive must not hide, retire, delete, or mutate the portfolio evidence.

### AC-3: Archived-source label contract is explicit

**Given** a visible portfolio item has an archived source project, task, or business  
**When** it is returned by the portfolio API  
**Then** the response includes explicit archived-source label data  
**And** the frontend does not infer archived source state from stale boolean fields or date heuristics.

### AC-4: Source navigation policy is explicit

**Given** a portfolio item references archived source records  
**When** the item is rendered  
**Then** navigation to archived source records is disabled or restricted  
**And** the response includes enough information for the UI to explain why navigation is unavailable.

### AC-5: Snapshot copy is superseded

**Given** current UI copy describes portfolio items saved because the original project was deleted  
**When** Portfolio work implements the new target  
**Then** that copy is replaced with archived-source language  
**And** no story may preserve hard-delete wording unless it documents a specification-driven exception.

### AC-6: Archiving backlog alignment is explicit

**Given** [ARCH-task-003](../archiving/ARCH-task-003-legacy-feature-removal.md:1) already addresses hard-delete and snapshot removal  
**When** this shared contract is accepted  
**Then** the Archiving backlog must reference the Portfolio target that canonical portfolio items are created at completion time, not at deletion time.

### AC-7: Completion evidence is reviewable

**Given** this task is marked complete  
**When** a reviewer checks the submitted change  
**Then** they can identify the created or updated archive-only contract artifact, the hard-delete removal rule, the portfolio evidence survival rule, archived-source label and navigation fields, and the linked Archiving backlog updates  
**And** the reviewer can derive cross-epic regression tests for hard-delete removal, source archiving, archived-source labels, and portfolio evidence survival.

---

## Implementation Notes

- This task does not implement archiving itself; it locks the cross-epic rule that portfolio evidence is independent from source archive state.
- Existing UI design treatment for archived labels may be reused visually from [`PortfolioItem`](../../../projojo_frontend/src/components/PortfolioItem.jsx:72), but the semantics must change from snapshot/deleted-source preservation to archived-source context.
- Do not reuse [`PortfolioRepository.create_snapshot()`](../../../projojo_backend/domain/repositories/portfolio_repository.py:10) without explicitly proving a non-delete, specification-compatible use. The current analysis found it tied to hard-delete.

---

## Ambiguities and Defaults

- **Ambiguity**: The specification does not decide whether teachers can navigate to archived source records from portfolio items.  
  **Default**: Return explicit navigation availability and reason fields; allow frontend behavior to differ by role only after confirmation.

---

## Test Expectations

- Cross-epic regression tests must prove that source archiving does not remove portfolio evidence and that hard-delete routes do not exist, matching [Portfolio spec Phase 6 gate](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:817).
