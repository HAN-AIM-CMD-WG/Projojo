# PF-task-015 — Authenticated Portfolio UI Shows Completed Work Only

**Phase**: 5 — Frontend Integration and UX Preservation  
**Epic**: Portfolio Frontend Integration  
**Priority**: 🔴 Critical  
**Type**: Functional Task (Frontend)  
**Spec references**: [Portfolio spec §3.2](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:92), [Phase 5](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:748)  
**Current-state references**: [`StudentPortfolio`](../../../projojo_frontend/src/components/StudentPortfolio.jsx:14), [`PortfolioList`](../../../projojo_frontend/src/components/PortfolioList.jsx:15), [`PortfolioRoadmap`](../../../projojo_frontend/src/components/PortfolioRoadmap.jsx:13), [`PortfolioList` stale filters](../../../projojo_frontend/src/components/PortfolioList.jsx:21), [`StudentPortfolio` active count footer](../../../projojo_frontend/src/components/StudentPortfolio.jsx:145)  
**Dependencies**: [PF-task-014](PF-task-014-portfolio-service-layer-and-data-wiring.md), [PF-task-007a](PF-task-007a-authenticated-portfolio-read-access-matrix.md), [PF-task-007b](PF-task-007b-supervisor-authenticated-public-item-filtering.md), [PF-task-009](PF-task-009-archived-source-context.md)

---

## Task Story

As a **student or authenticated portfolio viewer**,  
I want the portfolio UI to show completed work only while preserving the existing visual language,  
so that the portfolio is trustworthy evidence rather than a mixed task dashboard.

---

## Why This Must Change

- Current backend includes active items, while UI copy claims completed work.
- The specification says portfolio means completed work only and active accepted work belongs in dashboards.
- Existing list, timeline, card, and tab concepts are considered useful UI ideas and should be preserved where suitable.

---

## Acceptance Criteria

### AC-1: StudentPortfolio consumes new completed-only data

**Given** [`StudentPortfolio`](../../../projojo_frontend/src/components/StudentPortfolio.jsx:14) renders for a student  
**When** the data loads  
**Then** it uses the new authenticated portfolio service  
**And** it does not display active accepted work as portfolio evidence.

### AC-2: Active count and active legend are removed

**Given** the current UI shows active counts and active timeline legend  
**When** Phase 5 UI is implemented  
**Then** active portfolio counts and active portfolio filters are removed  
**And** active task tracking remains outside the portfolio component.

### AC-3: Filters match target states

**Given** a viewer uses the portfolio list filters  
**When** filtering options are shown  
**Then** available filters match target states: all, visible to supervisors, hidden where allowed, archived-source, and world-visible where relevant  
**And** stale live/snapshot filters are removed.

### AC-4: Archived-source copy replaces snapshot copy

**Given** an item has archived source context  
**When** portfolio explanatory copy is shown  
**Then** it explains that the source is archived but completed work remains visible  
**And** it does not say the original project was deleted or saved as a hard-delete snapshot.

### AC-5: Roadmap uses correct timeline semantics

**Given** a completed portfolio item has accepted, started, and completed timestamps  
**When** [`PortfolioRoadmap`](../../../projojo_frontend/src/components/PortfolioRoadmap.jsx:13) calculates work bars  
**Then** started date is used where the UI says started  
**And** completed date is used for completion, not accepted date unless started date is genuinely unavailable and documented as fallback.

### AC-6: Existing neumorphic design is preserved

**Given** the portfolio UI is updated  
**When** compared with the current portfolio list, timeline, card, and tab concepts  
**Then** the visual styling and information architecture remain recognizable  
**And** changes are limited to specification-driven semantics and controls.

### AC-7: Accessibility is maintained

**Given** portfolio tabs, filters, item expansion, and controls are interactive  
**When** operated by keyboard or screen reader  
**Then** focus states, labels, roles, and reduced-motion-safe interactions meet platform accessibility requirements.

---

## Implementation Notes

- Existing UI is not trusted for semantics, but its styling and interaction patterns are indicative of the desired end state.
- Avoid frontend-only filtering as the primary security mechanism; the backend must enforce visibility.

---

## Ambiguities and Defaults

- **Ambiguity**: Exact placement of curation controls is open in [Portfolio spec §11](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:867).  
  **Default**: Preserve list and detail layout, grouping advanced curation controls in expanded item details.

---

## Test Expectations

- Browser tests must prove active work is not shown in portfolio, owner and supervisor views differ correctly, and keyboard access remains intact.
