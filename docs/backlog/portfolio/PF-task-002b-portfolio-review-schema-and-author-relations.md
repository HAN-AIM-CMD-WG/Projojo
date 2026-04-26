# PF-task-002b — Portfolio Review Schema and Author Relations

**Phase**: 1 — Remove Stale Portfolio Backend and Establish New Schema  
**Epic**: Portfolio Backend Replacement  
**Priority**: 🔴 Critical  
**Type**: Technical Task (Schema)  
**Spec references**: [Portfolio spec §3.5](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:145), [§5.1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:304), [§5.2](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:315), [§11](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:867)  
**Current-state references**: [`schema.tql` lacks portfolioReview](../../../projojo_backend/db/schema.tql:145)  
**Dependencies**: [PF-task-002a](PF-task-002a-canonical-portfolio-item-schema.md), [SF-task-004](../shared-foundation/SF-task-004-schema-ownership-and-seed-contract.md)

---

## Task Story

As a **developer building review persistence**,  
I want review and review-author concepts in the schema,  
so that completion reviews and additional reviews can be stored, edited, and filtered by permission rules.

---

## Why This Must Change

- The current portfolio model has no review entity.
- The specification requires reviews authored by teachers or supervisors, optional ratings, public notice acceptance, edit timestamps, and world-public review selection.

---

## Acceptance Criteria

### AC-1: Review entity supports required fields

**Given** the schema is applied  
**When** review concepts are inspected  
**Then** a review can store ID, review text, optional rating, created timestamp, updated timestamp, world-visible flag, and public notice accepted timestamp  
**And** rating can support integer values from 1 through 5 when present.

### AC-2: Review belongs to one portfolio item

**Given** a review is created for a portfolio item  
**When** the schema is inspected  
**Then** each review can be related to exactly one portfolio item  
**And** a portfolio item can have zero or more reviews.

### AC-3: Review author relation supports teacher and supervisor authors

**Given** reviews can be authored by either teachers or supervisors  
**When** the review schema is implemented  
**Then** the chosen author relation design supports both author types  
**And** tests can determine whether the current caller is the review author without relying on display names.

### AC-4: Review retirement can be represented

**Given** completion revert retires the portfolio item and its reviews  
**When** the schema is implemented  
**Then** reviews can be retired or otherwise excluded from normal read models when their item is retired  
**And** normal portfolio views do not need to hard-delete review records.

### AC-5: Author relation design is documented

**Given** the specification lists review author relation design as an open question  
**When** the schema approach is chosen  
**Then** the task documents how creation, editing authorization, and read-model display determine author identity  
**And** the documentation is sufficient for [PF-task-008](PF-task-008-review-creation-and-editing.md) to implement permissions.

---

## Implementation Notes

- Store enough state to support possible future admin retrieval of retired reviews, but exclude retired reviews from normal read models unless a later admin story adds that surface.
- Review creation and editing APIs are handled by [PF-task-008](PF-task-008-review-creation-and-editing.md).

---

## Ambiguities and Defaults

- **Ambiguity**: Whether retired reviews remain queryable through an admin-only endpoint is not specified.  
  **Default**: Preserve enough state for future admin retrieval but do not expose retired reviews in normal read models.

---

## Test Expectations

- Schema tests or API smoke tests must prove review entity availability, review-to-item relation availability, author lookup support, optional rating support, and public notice timestamp support.

