# PF-story-005 — Public Portfolio Viewing

**Priority**: 🔴 Critical  
**Type**: User Story  
**Dependencies**: [PF-story-004](PF-story-004-student-curation-and-controlled-world-public-publishing.md)  
**Child tasks**: [PF-task-013](PF-task-013-world-public-portfolio-api-and-route.md), [PF-task-017](PF-task-017-public-portfolio-page-ui.md), [PF-task-019](PF-task-019-portfolio-bdd-api-and-browser-coverage.md)

---

## User Story

As an **unauthenticated public visitor**,  
I want to view a student's published portfolio by vanity slug,  
so that I can see only the work and reviews the student intentionally made public.

---

## Scope Included

- World-public portfolio API
- Private and unknown slug safe responses
- Summary-only public portfolio response
- Selected item and selected review public output
- Minimal unauthenticated frontend route shell
- Final public portfolio page UI
- Public route browser coverage

## Scope Excluded

- Authenticated portfolio views
- Student curation API implementation
- Reviewer submission and review editing flows
- Public discovery page reuse unless portfolio semantics remain clear

---

## User Story Acceptance Criteria

1. Private or unknown slugs return public-safe not-found or unavailable behavior without revealing student existence.
2. Published summary-only portfolios render without implying hidden or private content exists.
3. Public API returns selected, non-hidden, non-retired items only.
4. Public API returns selected reviews only when the associated item and page are public.
5. Public frontend route does not require authentication and does not use authenticated chrome.
6. Public page preserves suitable portfolio visual language without exposing authenticated-only controls or fields.

---

## Child Tasks

1. [PF-task-013 — World-Public Portfolio API and Minimal Frontend Route Shell](PF-task-013-world-public-portfolio-api-and-route.md)
2. [PF-task-017 — Public Portfolio Page UI](PF-task-017-public-portfolio-page-ui.md)
3. [PF-task-019 — Portfolio BDD API and Browser Coverage](PF-task-019-portfolio-bdd-api-and-browser-coverage.md) — public API and browser coverage slices

---

## Definition of Done

- Public visitors can access only intentionally published portfolio data.
- Private, unknown, unselected, hidden, and retired data is not leaked.
- Public route and public page rendering are covered by API and browser tests.

