# PF-task-009 — Archived-Source Portfolio Context and Disabled Navigation

**Phase**: 3 — Authenticated Portfolio Read Model and Review Management  
**Epic**: Portfolio and Archiving Integration  
**Priority**: 🟠 Medium-High  
**Type**: Functional Task (API Integration)  
**Spec references**: [Portfolio spec §3.8](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:237), [Phase 3 tasks](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:672), [Phase 6](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:787)  
**Current-state references**: [`PortfolioItem` archived badge](../../../projojo_frontend/src/components/PortfolioItem.jsx:72), [`PortfolioList` archived/snapshot copy](../../../projojo_frontend/src/components/PortfolioList.jsx:220), [`ProjectDetailsPage` date heuristic](../../../projojo_frontend/src/pages/ProjectDetailsPage.jsx:69), [`ProjectCard` archive heuristic](../../../projojo_frontend/src/components/ProjectCard.jsx:103)  
**Dependencies**: [PF-task-007b](PF-task-007b-supervisor-authenticated-public-item-filtering.md), [PF-task-007d](PF-task-007d-authenticated-portfolio-response-contract-examples.md), [SF-task-003](../shared-foundation/SF-task-003-archive-only-portfolio-contract.md)

---

## Task Story

As a **portfolio viewer**,  
I want portfolio items to show when their source records are archived without losing the evidence,  
so that completed work remains understandable after operational records leave active workflows.

---

## Why This Must Change

- The specification says source archive does not hide or retire portfolio evidence.
- Current UI and backend behavior still use snapshot/deleted-source concepts and stale archive booleans or date heuristics.

---

## Acceptance Criteria

### AC-1: Archived source does not hide portfolio item

**Given** a visible portfolio item references a source project, task, or business that becomes archived  
**When** a permitted authenticated viewer requests the portfolio  
**Then** the portfolio item remains visible according to normal portfolio visibility rules  
**And** archived source state is represented as context, not item retirement.

### AC-2: API returns archived-source label data

**Given** one or more source records are archived  
**When** the portfolio item is returned  
**Then** the response includes explicit archived-source metadata naming which source level is archived  
**And** the frontend does not need to infer the label from live project queries.

### AC-3: Source navigation availability is explicit

**Given** a portfolio item has archived source records  
**When** the API returns link information  
**Then** it includes whether source navigation is enabled, disabled, or restricted  
**And** it includes a user-facing reason suitable for UI copy.

### AC-4: Snapshot/deleted-source copy is not used

**Given** a portfolio item has archived source records  
**When** the UI renders explanatory copy  
**Then** it must not say the original project was deleted or that the item is a deletion snapshot  
**And** it must explain that the source is archived while completed work remains visible.

### AC-5: Restore of source does not recreate or remove portfolio item

**Given** a source record is restored by Archiving behavior  
**When** the portfolio is requested after restore  
**Then** the same portfolio item remains the evidence record  
**And** only archived-source context and navigation availability may change.

---

## Implementation Notes

- This task depends on the Archiving implementation exposing reliable archive metadata; if Archiving is not complete, return stable placeholders only where tests can verify behavior.
- Existing archived badge styling in [`PortfolioItem`](../../../projojo_frontend/src/components/PortfolioItem.jsx:72) can be visually reused after semantics are corrected.

---

## Ambiguities and Defaults

- **Ambiguity**: Teacher-specific navigation to archived source is not specified.  
  **Default**: Disable navigation for all normal portfolio viewers unless the API explicitly marks it available for the current viewer.

---

## Test Expectations

- API tests must cover archived-source label and navigation flag, matching [Portfolio spec Phase 3 gate](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:701).
