# TS-001 — Enforce Theme Name Uniqueness

**Phase**: 1 — Backend & Data Integrity  
**Priority**: 🔴 High  
**Type**: Technical Story  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §4.2](../../THEME_SDG_SYSTEM_AUDIT.md), [§6 Weakness A](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §1.1](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: None  

---

## User Story

As a **docent** (teacher),  
I want the platform to prevent duplicate theme names,  
so that the theme catalog remains clean and filtering is reliable.

---

## Acceptance Criteria

### AC-1: Schema-level uniqueness constraint

**Given** the TypeDB schema definition for the `theme` entity  
**When** the schema is applied  
**Then** the `name` attribute on `theme` must have the `@unique` constraint (`owns name @card(1) @unique`)

### AC-2: Seed data remains valid

**Given** the 6 seed themes in [`seed.tql`](../../../projojo_backend/db/seed.tql:1664)  
**When** the database is reset and re-seeded  
**Then** all 6 themes are created without constraint violations (names verified unique: Duurzaamheid, Klimaat & Milieu, Innovatie & Technologie, Voedselzekerheid, Water & Biodiversiteit, Kennisdeling)

### AC-3: Duplicate name rejected on create

**Given** the theme "Duurzaamheid" already exists  
**When** a teacher tries to create a new theme with name "Duurzaamheid"  
**Then** the API returns HTTP 400 with message `"Er bestaat al een thema met deze naam"`  
**And** no duplicate theme is persisted

### AC-4: Case-insensitive duplicate detection

**Given** the theme "Duurzaamheid" already exists  
**When** a teacher tries to create a theme with name "duurzaamheid" or "DUURZAAMHEID"  
**Then** the API returns HTTP 400 with message `"Er bestaat al een thema met deze naam"`

### AC-5: Duplicate name rejected on update

**Given** themes "Duurzaamheid" and "Klimaat & Milieu" both exist  
**When** a teacher tries to rename "Klimaat & Milieu" to "Duurzaamheid"  
**Then** the API returns HTTP 400 with message `"Er bestaat al een thema met deze naam"`  
**And** the original name is preserved

### AC-6: Self-rename allowed

**Given** the theme "Duurzaamheid" exists  
**When** a teacher updates that same theme keeping name "Duurzaamheid" (no name change)  
**Then** the update succeeds without a uniqueness violation

---

## Technical Notes

- **Schema file**: [`projojo_backend/db/schema.tql:62`](../../../projojo_backend/db/schema.tql:62) — change `owns name @card(1)` to `owns name @card(1) @unique`
- **Application-level check**: Add case-insensitive duplicate check in [`ThemeRepository.create()`](../../../projojo_backend/domain/repositories/theme_repository.py:73) following the pattern in [`SkillRepository.get_by_name_case_insensitive()`](../../../projojo_backend/domain/repositories/skill_repository.py:51)
- **Requires DB reset**: `docker-compose down && docker-compose up -d --build`
- Compare with `skill` entity at [`schema.tql:84`](../../../projojo_backend/db/schema.tql:84) which already has `@unique`
