# PF-task-001 — Remove Stale Snapshot and Mixed Portfolio Backend

**Phase**: 1 — Remove Stale Portfolio Backend and Establish New Schema  
**Epic**: Portfolio Backend Replacement  
**Priority**: 🔴 Critical  
**Type**: Technical Task  
**Spec references**: [Portfolio spec §1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:11), [§2.1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:33), [§3.2](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:92), [Phase 1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:592), [ADR-001](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:368), [ADR-002](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:376)  
**Current-state references**: [`PortfolioRepository.create_snapshot()`](../../../projojo_backend/domain/repositories/portfolio_repository.py:10), [`PortfolioRepository.get_active_portfolio_items()`](../../../projojo_backend/domain/repositories/portfolio_repository.py:220), [`PortfolioRepository.get_student_portfolio()`](../../../projojo_backend/domain/repositories/portfolio_repository.py:307), [`student_router.get_student_portfolio()`](../../../projojo_backend/routes/student_router.py:160), [`delete_portfolio_item()`](../../../projojo_backend/routes/student_router.py:214), [`delete_project()` snapshot trigger](../../../projojo_backend/routes/project_router.py:450)  
**Dependencies**: [SF-task-001](../shared-foundation/SF-task-001-shared-authorization-contract.md), [SF-task-003](../shared-foundation/SF-task-003-archive-only-portfolio-contract.md)

---

## Task Story

As a **student and portfolio viewer**,  
I want the old snapshot and active-work portfolio backend removed,  
so that portfolio data represents completed work only and is no longer tied to hard-delete behavior.

---

## Why This Must Change

- The authoritative specification says the current portfolio implementation is stale and superseded.
- The current repository mixes active accepted work, completed live work, and deletion-time snapshots in [`PortfolioRepository.get_student_portfolio()`](../../../projojo_backend/domain/repositories/portfolio_repository.py:307).
- Portfolio must mean completed work only, so [`get_active_portfolio_items()`](../../../projojo_backend/domain/repositories/portfolio_repository.py:220) must not remain part of the portfolio domain.
- Snapshot creation through [`PortfolioRepository.create_snapshot()`](../../../projojo_backend/domain/repositories/portfolio_repository.py:10) is hard-delete-oriented and conflicts with archive-only target behavior.

---

## Acceptance Criteria

### AC-1: Active work is removed from portfolio backend contract

**Given** a student has an accepted or started task that is not completed  
**When** any portfolio API reads portfolio evidence  
**Then** that task is not returned as a portfolio item  
**And** active work remains available only through dashboard or work-tracking contexts.

### AC-2: Snapshot-driven portfolio retrieval is decommissioned

**Given** the current snapshot fields exist in stale code  
**When** the new portfolio backend baseline is implemented  
**Then** portfolio retrieval no longer reads deletion-time JSON snapshots as canonical portfolio evidence  
**And** any remaining temporary migration logic is documented as non-authoritative and scheduled for removal.

### AC-3: Old student portfolio route no longer returns stale portfolio data

**Given** a request calls the legacy [`GET /students/{student_id}/portfolio`](../../../projojo_backend/routes/student_router.py:160) route  
**When** Phase 1 is complete  
**Then** the route is removed, deprecated with a non-success response, or redirected only if it cannot return mixed active/live/snapshot data  
**And** it must not return `active_count`, `snapshot_count`, or `source_type` values from the stale contract.

### AC-4: Snapshot delete endpoint is removed or made unreachable

**Given** a request calls the legacy [`DELETE /students/{student_id}/portfolio/{portfolio_id}`](../../../projojo_backend/routes/student_router.py:214) route  
**When** Phase 1 is complete  
**Then** it must not successfully delete portfolio evidence  
**And** student/teacher soft-hide or curation behavior is handled only by later target portfolio APIs.

### AC-5: Hard-delete snapshot trigger is removed

**Given** project hard-delete is removed by the archive-only contract  
**When** the route and repository code are audited  
**Then** no portfolio snapshot is created as a side effect of project deletion  
**And** the old loop around [`PortfolioRepository.create_snapshot()`](../../../projojo_backend/domain/repositories/portfolio_repository.py:10) in [`delete_project()`](../../../projojo_backend/routes/project_router.py:450) is removed or unreachable.

### AC-6: Existing portfolio code is not reused without explicit vetting

**Given** existing backend portfolio methods are considered for reuse  
**When** implementation begins  
**Then** the developer documents why each reused method complies with the specification  
**And** unvetted snapshot or active-work behavior is removed rather than adapted silently.

---

## Implementation Notes

- Removing old endpoints may temporarily break current frontend portfolio UI until later tasks wire new APIs. This is allowed by [Portfolio spec Phase 1 risks](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:611).
- This task is backend decommissioning; new canonical schema and routes are handled by [PF-task-002a](PF-task-002a-canonical-portfolio-item-schema.md), [PF-task-002b](PF-task-002b-portfolio-review-schema-and-author-relations.md), [PF-task-002c](PF-task-002c-student-portfolio-settings-schema.md), [PF-task-002d](PF-task-002d-portfolio-seed-fixtures-and-reset-contract.md), and [PF-task-003](PF-task-003-authenticated-portfolio-api-baseline.md).

---

## Ambiguities and Defaults

- **Ambiguity**: Whether the legacy route should return 404, 410, or be removed from routing is not specified.  
  **Default**: Prefer route removal; if removal is disruptive, return a non-success response and update tests accordingly.

---

## Test Expectations

- API tests must prove old endpoint paths no longer return successful stale portfolio data, matching [Portfolio spec Phase 1 gate](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:623).
