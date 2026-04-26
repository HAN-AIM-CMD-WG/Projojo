# PF-task-012b — Reviewer Public-Use Notice Enforcement

**Phase**: 2–4 — Review and Public Publication Safety  
**Epic**: Public Review Publication  
**Priority**: 🔴 Critical  
**Type**: Functional Task (API / Privacy)  
**Spec references**: [Portfolio spec §3.5](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:145), [§3.6.3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:197), [§4.3 completion body](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:283), [Phase 4](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:707)  
**Current-state references**: [`PortfolioRepository` lacks review visibility](../../../projojo_backend/domain/repositories/portfolio_repository.py:1)  
**Dependencies**: [PF-task-002b](PF-task-002b-portfolio-review-schema-and-author-relations.md)

---

## Task Story

As a **teacher or supervisor submitting review text**,  
I want to see and explicitly accept a public-use notice before submission,  
so that reviewer-authored text can later be selected by the student for public display under the agreed notice rules.

---

## Acceptance Criteria

### AC-1: Notice is required when completion review text is submitted

**Given** a teacher or supervisor submits review text during completion  
**When** public-review notice acceptance is missing or false  
**Then** the API rejects the request  
**And** the review text is not persisted.

### AC-2: Notice is required for additional review creation

**Given** a teacher or same-business supervisor submits an additional review  
**When** public-review notice acceptance is missing or false  
**Then** the API rejects the request  
**And** no review is persisted.

### AC-3: Notice acceptance timestamp is persisted

**Given** a reviewer submits review text with notice accepted  
**When** the review is saved  
**Then** the review stores a public notice accepted timestamp  
**And** later student selection does not require reviewer re-consent.

### AC-4: Reviewer opt-out is not provided after accepted submission

**Given** a reviewer submitted a review after accepting notice  
**When** the student later selects that review for world-public display  
**Then** the reviewer has no later opt-out workflow in this specification  
**And** any future opt-out must be a separate product decision.

### AC-5: Notice copy is explicit and concise

**Given** a reviewer is about to submit review text  
**When** the notice is displayed in the UI  
**Then** it clearly states that the student may later publish the review on the student's public portfolio page  
**And** the reviewer must explicitly accept it before submission.

---

## Implementation Notes

- Completion endpoint integration is handled by [PF-task-005](PF-task-005-completion-creates-portfolio-item-and-review.md). Additional review endpoint integration is handled by [PF-task-008](PF-task-008-review-creation-and-editing.md). Frontend form display is handled by [PF-task-021a](PF-task-021a-lifecycle-completion-review-form-ui.md) and [PF-task-021b](PF-task-021b-additional-review-creation-ui.md).
- This task owns the notice rule and persisted acceptance requirement so it is not duplicated across review workflows.

---

## Ambiguities and Defaults

- **Ambiguity**: Exact reviewer notice copy is not specified.  
  **Default**: Use concise Dutch copy that says the review can later be shown on the student's public portfolio page.

---

## Test Expectations

- API and browser tests must prove notice acceptance is required when review text is submitted, persisted on saved reviews, and presented before reviewer submission.

