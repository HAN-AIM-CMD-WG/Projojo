# PF-task-002c — Student Portfolio Settings Schema

**Phase**: 1 — Remove Stale Portfolio Backend and Establish New Schema  
**Epic**: Portfolio Backend Replacement  
**Priority**: 🔴 Critical  
**Type**: Technical Task (Schema)  
**Spec references**: [Portfolio spec §3.6.3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:197), [§3.7](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:218), [§5.2](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:315)  
**Current-state references**: [`schema.tql`](../../../projojo_backend/db/schema.tql:1)  
**Dependencies**: [PF-task-002a](PF-task-002a-canonical-portfolio-item-schema.md), [SF-task-004](../shared-foundation/SF-task-004-schema-ownership-and-seed-contract.md)

---

## Task Story

As a **student curating my portfolio**,  
I want portfolio settings to be represented on my student record,  
so that summary, slug, and public page state can be persisted independently from portfolio items.

---

## Why This Must Change

- The specification requires student-level portfolio summary, generated editable slug, and world-public page toggle.
- These settings belong to the student's portfolio page, not to individual portfolio items.

---

## Acceptance Criteria

### AC-1: Student summary field exists

**Given** the schema is applied  
**When** student concepts are inspected  
**Then** a student can store portfolio summary text  
**And** the field can be omitted or empty before the student curates their portfolio.

### AC-2: Student slug field exists and is unique

**Given** the schema is applied  
**When** student portfolio slug concepts are inspected  
**Then** a student can store a portfolio slug  
**And** slug uniqueness is enforceable across all students.

### AC-3: World-public page setting exists

**Given** the schema is applied  
**When** student concepts are inspected  
**Then** a student can store whether their portfolio page is world-public  
**And** the default state supports world-private behavior.

### AC-4: Settings can be queried independently of item visibility

**Given** a student has no portfolio items  
**When** portfolio settings are read  
**Then** summary, slug, and world-public page state can still be returned  
**And** this supports summary-only public pages in later tasks.

---

## Implementation Notes

- Slug generation and settings API behavior are handled by [PF-task-010](PF-task-010-student-summary-slug-and-public-settings.md).
- Do not place portfolio page settings on individual portfolio items.

---

## Ambiguities and Defaults

- **Ambiguity**: Slug generation timing is open in [Portfolio spec §11](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:867).  
  **Default**: This schema task only ensures storage and uniqueness support; generation timing is decided in [PF-task-010](PF-task-010-student-summary-slug-and-public-settings.md).

---

## Test Expectations

- Schema tests or API smoke tests must prove summary storage, slug uniqueness, and world-public page state availability.

