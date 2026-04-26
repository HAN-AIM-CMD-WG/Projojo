# PF-task-012a — Student Review World-Public Selection API

**Phase**: 4 — Student Curation and World-Public Portfolio  
**Epic**: Public Review Publication  
**Priority**: 🔴 Critical  
**Type**: Functional Task (API / Privacy)  
**Spec references**: [Portfolio spec §3.5](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:145), [§3.6.3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:197), [§3.7](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:218), [§4.1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:255)  
**Current-state references**: [`PortfolioRepository` lacks review visibility](../../../projojo_backend/domain/repositories/portfolio_repository.py:1)  
**Dependencies**: [PF-task-008](PF-task-008-review-creation-and-editing.md), [PF-task-011a](PF-task-011a-student-item-ordering-hide-show-and-world-visible-selection.md), [PF-task-012b](PF-task-012b-reviewer-public-use-notice-enforcement.md)

---

## Task Story

As a **student**,  
I want to choose which submitted reviews are visible on my world-public portfolio,  
so that I can share reviewer text intentionally while publishing only selected review content.

---

## Acceptance Criteria

### AC-1: Student can mark review world-visible

**Given** a review belongs to a portfolio item owned by the student  
**When** the student calls [`PATCH /portfolios/me/items/{item_id}/reviews/{review_id}`](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:262) or the implemented equivalent to set the review world-visible  
**Then** the review becomes eligible for world-public output  
**And** it appears publicly only when the associated item and page are also world-public.

### AC-2: Student can retract review from world-public visibility

**Given** a review is currently world-visible  
**When** the student clears the review world-visible flag  
**Then** the review no longer appears in world-public responses  
**And** authenticated views are unaffected.

### AC-3: Review cannot be public without associated public item

**Given** a review is marked world-visible  
**When** the associated item is not world-visible or is hidden or retired  
**Then** the world-public API does not return the review  
**And** no orphaned public review appears.

### AC-4: Unauthorized review visibility updates are denied

**Given** anyone other than the student owner attempts to change a review's world-visible flag  
**When** the endpoint is called  
**Then** the request is denied  
**And** the review visibility flag remains unchanged.

### AC-5: Review selection does not bypass reviewer notice rules

**Given** a review lacks persisted public notice acceptance  
**When** the student attempts to mark it world-visible  
**Then** the API must not allow public exposure unless the review was created under the notice contract  
**And** the outcome is documented as either denial or migration-safe exclusion.

---

## Implementation Notes

- Reviewer notice enforcement is handled by [PF-task-012b](PF-task-012b-reviewer-public-use-notice-enforcement.md).
- World-public API output is handled by [PF-task-013](PF-task-013-world-public-portfolio-api-and-route.md).

---

## Ambiguities and Defaults

- **Ambiguity**: Existing reviews without notice acceptance should not exist in the target seed data, but implementation may encounter them during development.  
  **Default**: Do not expose review text publicly unless notice acceptance is persisted.

---

## Test Expectations

- API tests must prove selected review visibility, retraction, associated item dependency, unauthorized update denial, and notice-aware public eligibility.

