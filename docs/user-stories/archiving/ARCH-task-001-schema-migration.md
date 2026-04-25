# ARCH-task-001 — Schema Migration: Archive Attributes and Supervisor Cardinality

**User Story**: [ARCH-story-001 — Archiving Foundations](ARCH-story-001-archiving-foundations.md)  
**Priority**: 🔴 Critical  
**Type**: Technical Task  
**Spec references**: [§2.1](../../ARCHIVING_SPECIFICATION.md), [§2.3](../../ARCHIVING_SPECIFICATION.md), [§2.4](../../ARCHIVING_SPECIFICATION.md), [§8.1](../../ARCHIVING_SPECIFICATION.md)  
**Dependencies**: None (first story in the dependency chain)

---

## Task Story

As a **developer**,  
I want the TypeDB schema to use timestamp-based archive attributes instead of the boolean `isArchived` flag, and to support multi-business supervisors,  
so that the data model correctly represents archive state as defined in the specification and enables all downstream archiving features.

---

## Context: What Must Change and Why

The current `next-ui` codebase uses `attribute isArchived value boolean` owned by `business` and `project` entities. The specification (§2.1, §2.4) explicitly replaces this with three new attributes (`archivedAt`, `archivedBy`, `archivedReason`) owned by five entity/relation types (business, project, task, supervisor, registersForTask). The `isArchived` boolean must be removed entirely — it is not an archive-state source of truth in the target system.

Additionally, the current schema constrains supervisors to exactly one business (`plays manages:supervisor @card(1)`). The specification (§2.4 item 4, §4.5) requires multi-business supervisors (`@card(1..)`).

**Current state** (from [`projojo_backend/domain/repositories/business_repository.py`](../../../projojo_backend/domain/repositories/business_repository.py:33) and [`project_repository.py`](../../../projojo_backend/domain/repositories/project_repository.py:87)):
- `isArchived` boolean on `business` and `project` only
- Single-business supervisor constraint
- No `archivedAt`, `archivedBy`, or `archivedReason` attributes
- No archive support on `task`, `supervisor`, or `registersForTask`

---

## Acceptance Criteria

### AC-1: `isArchived` boolean attribute removed from schema

**Given** the TypeDB schema file is updated  
**When** the schema is loaded into TypeDB  
**Then** the `attribute isArchived value boolean` declaration no longer exists  
**And** no entity or relation type contains `owns isArchived`

### AC-2: Three archive attributes declared

**Given** the TypeDB schema file is updated  
**When** the schema is loaded into TypeDB  
**Then** the following attribute declarations exist:
- `attribute archivedAt value datetime-tz`
- `attribute archivedBy value string`
- `attribute archivedReason value string`

### AC-3: Archive attributes owned by all five archivable types

**Given** the three archive attributes are declared  
**When** reviewing the schema for each archivable type  
**Then** each of the following types owns all three attributes with `@card(0..1)`:
- `entity business`
- `entity project`
- `entity task`
- `entity supervisor`
- `relation registersForTask`

### AC-4: Supervisor multi-business cardinality

**Given** the schema is updated  
**When** a supervisor entity is inspected  
**Then** the `plays manages:supervisor` constraint is `@card(1..)` (not `@card(1)`)  
**And** a single supervisor instance can participate in multiple `manages` relations with different businesses

### AC-5: Schema loads without errors

**Given** the updated schema file  
**When** the TypeDB database is reset and the schema is applied  
**Then** the schema loads without errors  
**And** the application starts successfully against the new schema

### AC-6: No other entity types own archive attributes

**Given** the updated schema  
**When** inspecting non-archivable types (`student`, `teacher`, `skill`, `theme`, `inviteKey`, `oauthProvider`, `oauthAuthentication`, `creates`, `manages`, `hasProjects`, `containsTask`, `requiresSkill`, `hasSkill`, `businessInvite`, `portfolioItem`)  
**Then** none of them owns `archivedAt`, `archivedBy`, or `archivedReason`

---

## Technical Notes

### Reusable code from Archive_Feature branch

The [`ARCHIVING_REUSABLE_CODE.md` §1.1](../../ARCHIVING_REUSABLE_CODE.md) provides the attribute declarations (🟡 tier — reusable with modification):

```tql
attribute archivedAt value datetime-tz;
attribute archivedBy value string;
attribute archivedReason value string;
```

The attribute declarations themselves are directly reusable. The `archivedReason` attribute was declared in the Archive_Feature branch but never owned by any entity — this task adds the required `owns` declarations.

[`ARCHIVING_REUSABLE_CODE.md` §1.2](../../ARCHIVING_REUSABLE_CODE.md) shows the entity ownership pattern (🟡 tier):

```tql
entity supervisor sub user,
    owns archivedAt @card(0..1),
    owns archivedBy @card(0..1),
    -- ADD: owns archivedReason @card(0..1),
    plays manages:supervisor @card(1..);  -- CHANGED from @card(1)
```

### Migration strategy

Per spec §8.1, this assumes a **clean database reset**. Steps:
1. Update the schema `.tql` file
2. Run `docker-compose down && docker-compose up -d --build`
3. Verify schema loads and app starts

### Risks and ambiguities

- **Risk**: Removing `isArchived` will break every query and mapper that references it. This is intentional — ARCH-task-002 and ARCH-task-004 handle the downstream model and query updates. This task only covers the schema itself.
- **Risk**: The `manages` relation must remain structurally the same per instance (spec §2.4 item 5) — the change is only the cardinality on the supervisor role player side.
- **No ambiguity**: The spec is explicit about which types are archivable and which are not (§2.3 table).

### Files likely affected

- [`projojo_backend/db/schema.tql`](../../../projojo_backend/db/schema.tql) — primary change target
