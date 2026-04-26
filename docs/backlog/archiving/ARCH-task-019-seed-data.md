# ARCH-task-019 — Seed Data for Archive Scenarios

**User Story**: [ARCH-story-006 — Archive Readiness and Verification](ARCH-story-006-archive-readiness-and-verification.md)  
**Priority**: 🟡 High  
**Type**: Technical Task  
**Spec references**: [§8.2](../../ARCHIVING_SPECIFICATION.md)  
**Dependencies**: [ARCH-task-001](ARCH-task-001-schema-migration.md), [ARCH-task-002](ARCH-task-002-domain-models-datetime.md)

---

## Task Story

As a **developer or tester**,  
I want seed data that covers all archive-related scenarios including edge cases,  
so that I can manually verify archive/restore flows and E2E tests have realistic test fixtures.

---

## Context: What Must Change and Why

The current seed data has no archived entities. The specification (§8.2) defines specific seed data requirements that must be present for development, manual testing, and E2E test scenarios.

---

## Acceptance Criteria

### AC-1: Archived business with archived descendants

**Given** the seed data is loaded  
**Then** there exists at least one fully-archived business with:
- Archived projects under it
- Archived tasks under those projects
- Archived registrations under those tasks
- An archived supervisor with no other active businesses

**And** all cascade entities share matching `archivedAt`, `archivedBy`, and `archivedReason` metadata, including one shared stored `archivedReason` value across the full cascade

### AC-2: Active business with mixed archived and active descendants

**Given** the seed data is loaded  
**Then** there exists at least one active business with:
- At least one active project and one archived project
- The archived project has archived tasks
- The active project has at least one active task and one archived task
- Active tasks have both active and archived registrations

### AC-3: Multi-business supervisor with one archived and one active business

**Given** the seed data is loaded  
**Then** there exists a supervisor who manages:
- One active business (can still log in)
- One archived business
- Supervisor entity itself is NOT archived (has remaining active business)

### AC-4: Fully archived supervisor

**Given** the seed data is loaded  
**Then** there exists a supervisor who manages only archived businesses  
**And** the supervisor entity itself is archived  
**And** this supervisor cannot log in

### AC-5: Student with active and recently archived registrations

**Given** the seed data is loaded  
**Then** there exists a student with:
- At least one active registration
- At least one registration archived within the last 30 days (for "Recent gearchiveerd")
- At least one registration archived more than 30 days ago (should NOT appear in recently archived)

### AC-6: Restore preview test cases with matching and non-matching metadata

**Given** the seed data is loaded  
**Then** there exists an archived entity hierarchy where:
- Some descendants were archived in the same cascade (matching metadata → should be preselected)
- Some descendants were archived in a separate operation (different metadata → should NOT be preselected)

### AC-7: Name collision restore case

**Given** the seed data is loaded  
**Then** there exists:
- An active business named "Test Bedrijf"
- An archived business also named "Test Bedrijf"
- This enables testing the name-collision rename logic on restore

### AC-8: Seed data loads without errors

**Given** the updated seed data script  
**When** the database is reset and seeded  
**Then** all seed data loads successfully  
**And** the application starts and all pages render without errors

### AC-9: Seed data is documented

**Given** the seed data is created  
**Then** a comment block or documentation section describes each test scenario and what it covers  
**And** entity IDs are stable (not randomly generated) so tests can reference them

---

## Technical Notes

### Seed data structure

The seed data should create entities with specific, predictable IDs for test stability. Example structure:

```
Active Business "TechStart BV" (id: seed-biz-active-1)
├── Active Project "Web Platform" (id: seed-proj-active-1)
│   ├── Active Task "Frontend" (id: seed-task-active-1)
│   │   ├── Active Registration (student: seed-student-1)
│   │   └── Archived Registration (student: seed-student-1, archivedAt: 10 days ago)
│   └── Archived Task "Legacy API" (id: seed-task-archived-1)
│       └── Archived Registration (student: seed-student-1)
└── Archived Project "Old Dashboard" (id: seed-proj-archived-1, independent archive)
    └── Archived Task "Old Search" (id: seed-task-archived-2, different archivedReason)

Archived Business "OudBedrijf BV" (id: seed-biz-archived-1)
├── Archived Project "Project X" (matching cascade metadata, including same stored archivedReason)
│   └── Archived Task "Task X" (matching cascade metadata, including same stored archivedReason)
└── Supervisor "Archived Supervisor" (id: seed-sup-archived, no active businesses)

Multi-Biz Supervisor "Jan Multi" (id: seed-sup-multi)
├── manages: seed-biz-active-1 (active)
└── manages: seed-biz-archived-1 (archived) → supervisor NOT archived

Name Collision: Active "Test Bedrijf" (id: seed-biz-collision-active)
             + Archived "Test Bedrijf" (id: seed-biz-collision-archived)

Student "Lisa Student" (id: seed-student-1)
├── Active registration for seed-task-active-1
├── Archived registration (10 days ago) — shows in "Recent gearchiveerd"
└── Archived registration (45 days ago) — does NOT show in "Recent gearchiveerd"
```

### Integration with E2E tests

The seed data IDs should be importable by the E2E test infrastructure. The Qavajs steps can reference these known IDs for setup and assertion.

### Risks

- **Risk**: Seed data with fixed timestamps (e.g., "10 days ago") will drift over time. Use relative timestamps computed at seed time.
- **Risk**: The seed data script must handle the new `archivedAt`/`archivedBy`/`archivedReason` attributes correctly with TypeDB `datetime-tz` format.

### Files likely affected

- Seed data script/file (location TBD — check existing seed infrastructure)
- E2E test data constants (if applicable)
