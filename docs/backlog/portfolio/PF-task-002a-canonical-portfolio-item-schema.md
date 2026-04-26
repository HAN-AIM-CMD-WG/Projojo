# PF-task-002a — Canonical Portfolio Item Schema

**Phase**: 1 — Remove Stale Portfolio Backend and Establish New Schema  
**Epic**: Portfolio Backend Replacement  
**Priority**: 🔴 Critical  
**Type**: Technical Task (Schema)  
**Spec references**: [Portfolio spec §3.3](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:98), [§5.1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:304), [§5.2](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:315), [Phase 1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:592)  
**Current-state references**: [`portfolioItem` snapshot schema](../../../projojo_backend/db/schema.tql:145), [`registersForTask`](../../../projojo_backend/db/schema.tql:129)  
**Dependencies**: [PF-task-001](PF-task-001-remove-stale-portfolio-backend.md), [SF-task-004](../shared-foundation/SF-task-004-schema-ownership-and-seed-contract.md)

---

## Task Story

As a **developer building portfolio persistence**,  
I want a canonical portfolio item schema for completed-work evidence,  
so that portfolio presentation no longer depends on live task queries or deletion snapshots.

---

## Why This Must Change

- The current [`portfolioItem`](../../../projojo_backend/db/schema.tql:145) stores JSON snapshots only.
- The specification requires first-class portfolio items created at completion time with copied source display data, visibility state, curation state, and archived-source context.

---

## Acceptance Criteria

### AC-1: Canonical portfolio item replaces snapshot-only shape

**Given** the TypeDB schema is applied after Phase 1  
**When** portfolio item concepts are inspected  
**Then** a portfolio item can store item ID, created timestamp, completed timestamp, source registration/task/project/business identifiers, and copied display fields for task, project, business, skills, and timeline  
**And** deletion-time JSON snapshots are not the canonical source of portfolio presentation.

### AC-2: Student ownership relation exists

**Given** a portfolio item belongs to a student  
**When** the schema is inspected  
**Then** the schema supports an explicit relation from student to portfolio item  
**And** later APIs can query a student's canonical portfolio items without deriving them from active registrations.

### AC-3: Portfolio lifecycle state is stored explicitly

**Given** a portfolio item can be retired after completion revert  
**When** the schema is implemented  
**Then** the item stores retired state explicitly  
**And** normal read models can exclude retired items without inferring retirement from registration timestamps.

### AC-4: Item visibility and curation state is represented

**Given** students and teachers need curation and moderation state  
**When** the portfolio item schema is implemented  
**Then** it stores hidden state, hidden actor metadata, display order, authenticated-public retraction flag, and world-visible flag  
**And** it stores enough information to enforce teacher-hide precedence over student show.

### AC-5: Archived-source context can be stored or returned

**Given** a source project, task, or business can be archived after portfolio item creation  
**When** the item is returned through portfolio APIs  
**Then** the data model supports source archived status fields or archived label metadata  
**And** source archive does not require hiding or retiring the portfolio item.

### AC-6: Schema load is safe after reset

**Given** no production data must be preserved  
**When** the database is reset and schema is applied  
**Then** the canonical portfolio item schema loads without TypeDB cardinality or uniqueness violations  
**And** it can support repository/API smoke tests in later tasks.

---

## Implementation Notes

- Exact relation names may differ from [Portfolio spec §5.1](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:304), but the implemented schema must satisfy the required behavior.
- Do not preserve stale snapshot fields as the target presentation contract.
- Review schema is handled by [PF-task-002b](PF-task-002b-portfolio-review-schema-and-author-relations.md). Student settings schema is handled by [PF-task-002c](PF-task-002c-student-portfolio-settings-schema.md). Seed fixtures are handled by [PF-task-002d](PF-task-002d-portfolio-seed-fixtures-and-reset-contract.md).

---

## Ambiguities and Defaults

- **Ambiguity**: Exact TypeDB relation names are not final in the specification.  
  **Default**: Use names close to the proposed concepts unless the shared schema contract chooses alternatives.

---

## Test Expectations

- Schema tests or API smoke tests must prove schema load, ownership relation availability, lifecycle state availability, visibility state availability, and archived-source metadata support.

