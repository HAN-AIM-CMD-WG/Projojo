# PF-task-018b — Portfolio Documentation Cleanup for Snapshot and Hard-Delete Assumptions

**Phase**: 6 — Cross-Epic Regression and Readiness  
**Epic**: Portfolio Readiness  
**Priority**: 🔴 Critical  
**Type**: Non-functional Task (Documentation)  
**Spec references**: [Portfolio spec Phase 6](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:787), [Risk register](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:853), [ADR-001](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:368), [ADR-006](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:408)  
**Current-state references**: [`PORTFOLIO_SYSTEM_AUDIT.md` snapshot findings](../../plans/PORTFOLIO_SYSTEM_AUDIT.md:65)  
**Dependencies**: [PF-task-018a](PF-task-018a-portfolio-cross-epic-regression-gate.md)

---

## Task Story

As a **developer or product owner**,  
I want current documentation to reflect canonical completion-time portfolio items and archive-only source behavior,  
so that stakeholders are not misled by stale snapshot-on-hard-delete assumptions.

---

## Acceptance Criteria

### AC-1: Stale snapshot documentation is corrected

**Given** documentation still describes snapshot-on-hard-delete as target behavior  
**When** Phase 6 cleanup is performed  
**Then** those references are updated to describe canonical completion-time portfolio items and archive-only source behavior  
**And** historical audit documents may remain historical if clearly marked as superseded.

### AC-2: Hard-delete target language is removed from current docs

**Given** current product or implementation docs mention hard-delete as target portfolio behavior  
**When** documentation cleanup is complete  
**Then** those references are removed or corrected  
**And** they align with the Archiving archive-only contract.

### AC-3: Deferred notification debt is documented

**Given** notification copy currently over-promises in archive/delete-related UI  
**When** readiness is reviewed  
**Then** any remaining notification copy conflict is documented as deferred debt  
**And** it is not allowed to contradict portfolio evidence or hard-delete removal.

### AC-4: Current target docs remain distinct from historical audits

**Given** audit files may preserve historical findings  
**When** documentation is updated  
**Then** historical audit content is not rewritten as if it were target behavior  
**And** any retained historical snapshot findings are clearly superseded by the portfolio specification.

---

## Implementation Notes

- Search for hard-delete, snapshot, portfolio snapshot, and deleted project preservation language across docs.
- Update current product docs and implementation docs; leave old audit folders only if marked historical or superseded.

---

## Ambiguities and Defaults

- **Ambiguity**: The exact list of stale docs is not specified.  
  **Default**: Search broadly and update current product docs; preserve historical audits only when their status is clear.

---

## Test Expectations

- Documentation cleanup evidence should be referenced by the Phase 6 readiness review, and grep-style verification from Archiving cleanup should remain valid for hard-delete removal.

