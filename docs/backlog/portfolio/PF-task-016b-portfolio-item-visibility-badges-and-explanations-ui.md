# PF-task-016b — Portfolio Item Visibility Badges and Explanations UI

**Phase**: 5 — Frontend Integration and UX Preservation  
**Epic**: Portfolio Frontend Integration  
**Priority**: 🔴 Critical  
**Type**: Functional Task (Frontend)  
**Spec references**: [Portfolio spec §3.6](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:168), [§3.8](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:237), [Phase 5 tasks](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:752)  
**Current-state references**: [`PortfolioItem`](../../../projojo_frontend/src/components/PortfolioItem.jsx:14), [`PortfolioList`](../../../projojo_frontend/src/components/PortfolioList.jsx:15)  
**Dependencies**: [PF-task-007d](PF-task-007d-authenticated-portfolio-response-contract-examples.md), [PF-task-009](PF-task-009-archived-source-context.md), [PF-task-015](PF-task-015-authenticated-portfolio-ui-completed-only.md)

---

## Task Story

As a **student or authenticated portfolio viewer**,  
I want clear badges and explanations for portfolio item visibility states,  
so that I understand whether completed work is supervisor-visible, retracted, low-rated, hidden, archived-source, or world-visible.

---

## Acceptance Criteria

### AC-1: Visibility badges are shown consistently

**Given** an item is supervisor-visible, authenticated-public retracted, world-visible, hidden where allowed, or archived-source  
**When** the item renders  
**Then** clear badges indicate the relevant state  
**And** badge copy aligns with the specification rather than old live/snapshot terminology.

### AC-2: Rating gate status is explained to student owner

**Given** an owner views an item with a rating below 3  
**When** the item details render  
**Then** the UI explains that the item is not currently visible to relationship-gated supervisors because of rating rules  
**And** this explanation is not shown to unauthorized viewers.

### AC-3: Archived-source labels use archive terminology

**Given** an item has archived-source context  
**When** badges and explanatory copy render  
**Then** the UI explains that the source is archived while completed work remains visible  
**And** it does not say the original project was deleted or saved as a hard-delete snapshot.

### AC-4: Supervisor view avoids unavailable internal badges

**Given** a relationship-gated supervisor views a portfolio item  
**When** item badges render  
**Then** badges shown to the supervisor are readable as portfolio presentation  
**And** private owner-only visibility explanations are not exposed.

### AC-5: Badge treatment is accessible

**Given** badges use color and iconography  
**When** viewed with keyboard or screen reader  
**Then** each state has text or an accessible label  
**And** color is not the only way to identify the state.

---

## Implementation Notes

- Use explicit backend visibility fields from [PF-task-007d](PF-task-007d-authenticated-portfolio-response-contract-examples.md).
- Group badges to avoid the frontend clutter risk identified in the specification.

---

## Ambiguities and Defaults

- **Ambiguity**: Exact badge placement is open.  
  **Default**: Place summary badges in the collapsed card header and detailed explanations in expanded item details.

---

## Test Expectations

- Browser tests must cover state badges, low-rating owner explanation, archived-source copy, supervisor-safe rendering, and accessible labels.

