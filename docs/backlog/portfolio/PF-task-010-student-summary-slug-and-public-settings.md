# PF-task-010 — Student Portfolio Summary, Slug, and World-Public Page Settings

**Phase**: 4 — Student Curation and World-Public Portfolio  
**Epic**: Student Portfolio Curation  
**Priority**: 🔴 Critical  
**Type**: Functional Task (API)  
**Spec references**: [Portfolio spec §3.6.3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:197), [§3.7](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:218), [§4.1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:255), [Phase 4](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:707)  
**Current-state references**: [`StudentPortfolio` lacks summary and slug controls](../../../projojo_frontend/src/components/StudentPortfolio.jsx:14), [`App.jsx` lacks world-public portfolio route](../../../projojo_frontend/src/App.jsx:268)  
**Dependencies**: [PF-task-002c](PF-task-002c-student-portfolio-settings-schema.md), [PF-task-003](PF-task-003-authenticated-portfolio-api-baseline.md), [PF-task-007a](PF-task-007a-authenticated-portfolio-read-access-matrix.md)

---

## Task Story

As a **student**,  
I want to edit my portfolio summary, vanity slug, and public page setting,  
so that I control how my portfolio is introduced and whether it is visible on the open web.

---

## Acceptance Criteria

### AC-1: Portfolio is world-private by default

**Given** a student account exists  
**When** portfolio settings are first read  
**Then** the world-public page setting is disabled  
**And** unauthenticated slug access returns no portfolio data.

### AC-2: Default unique slug exists or is generated

**Given** a student has no portfolio slug  
**When** portfolio settings are first initialized  
**Then** a default unique slug is generated  
**And** the generation timing is documented as either student creation or first portfolio access.

### AC-3: Student can update summary

**Given** a student submits summary text to [`PATCH /portfolios/me`](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:260) or the implemented equivalent  
**When** the text is valid  
**Then** the summary is saved  
**And** later authenticated and world-public responses use the saved summary where permitted.

### AC-4: Student can update slug to unused valid value

**Given** a student submits an unused valid slug  
**When** portfolio settings are updated  
**Then** the slug is saved  
**And** future world-public requests use the new slug.

### AC-5: Duplicate slug is rejected

**Given** another student already owns a slug  
**When** a student attempts to use that slug  
**Then** the API rejects the request  
**And** the student's previous slug remains unchanged.

### AC-6: Student can publish empty summary-only page

**Given** a student has a summary and no world-visible items  
**When** the student enables world-public page visibility  
**Then** the setting is saved  
**And** unauthenticated slug access can return the summary-only public page.

### AC-7: Only student owner can update settings

**Given** a teacher, supervisor, other student, or unauthenticated visitor attempts to update a student's portfolio settings  
**When** the update endpoint is called  
**Then** the request is denied  
**And** no settings are changed.

---

## Implementation Notes

- Slug format rules are not specified; define and document them before implementation.
- Summary length limits are not specified; choose a reasonable validation limit and return Dutch validation messages consistent with platform style.

---

## Ambiguities and Defaults

- **Ambiguity**: Slug generation timing is open in [Portfolio spec §11](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:867).  
  **Default**: Generate slug on first portfolio settings access to avoid migration work, unless account creation flow is already easier.

---

## Test Expectations

- API tests must cover private-by-default, slug uniqueness, summary update, owner-only update, and summary-only public page behavior.
