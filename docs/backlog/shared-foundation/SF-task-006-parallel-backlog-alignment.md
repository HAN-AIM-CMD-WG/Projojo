# SF-task-006 — Parallel Backlog Alignment for Archiving and Theme/SDG

**Phase**: 0 — Shared Foundation Contract  
**Epic**: Shared Foundation — Backlog Coordination  
**Priority**: 🔴 Critical  
**Type**: Documentation / Coordination Task  
**Spec references**: [Portfolio spec Phase 0 tasks](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:562), [ADR-007](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:416), [Phase 6](../../plans/PORTFOLIO_SYSTEM_SPECIFICATION_AND_IMPLEMENTATION_PLAN.md:787)  
**Current-state references**: [Archiving backlog index](../archiving/INDEX.md:1), [ARCH-task-003](../archiving/ARCH-task-003-legacy-feature-removal.md:1), [Theme/SDG backlog index](../theme-sdg/TS-EPIC.md:1), [TS-task-006](../theme-sdg/TS-task-006-jwt-middleware-narrowing.md:1)  
**Dependencies**: [SF-task-001](SF-task-001-shared-authorization-contract.md), [SF-task-002](SF-task-002-registration-lifecycle-contract.md), [SF-task-003](SF-task-003-archive-only-portfolio-contract.md), [SF-task-004](SF-task-004-schema-ownership-and-seed-contract.md), [SF-task-005](SF-task-005-cross-epic-automated-test-gate.md)

---

## Task Story

As a **product owner coordinating parallel implementation**,  
I want Archiving and Theme/SDG backlog tasks aligned with the shared Portfolio foundation,  
so that three developers can work in parallel without implementing incompatible contracts.

---

## Why This Must Change

- The specification explicitly requires Phase 0 updates to Archiving and Theme/SDG backlog tasks before implementation starts.
- The Archiving backlog already includes hard-delete and snapshot cleanup, but it must explicitly align with canonical portfolio items created at completion time.
- Theme/SDG work touches shared project, task, auth, schema, and seed data surfaces that Portfolio depends on for copied source display fields.

---

## Acceptance Criteria

### AC-1: Archiving backlog references the shared foundation

**Given** [ARCH-task-003](../archiving/ARCH-task-003-legacy-feature-removal.md:1) addresses hard-delete and portfolio snapshotting  
**When** this task is complete  
**Then** it references the shared archive-only portfolio contract  
**And** it states that portfolio evidence comes from canonical completion-time portfolio items, not deletion-time snapshots.

### AC-2: Archiving restore tasks respect portfolio evidence rules

**Given** Archiving restore tasks restore businesses, projects, or tasks  
**When** a source record is restored  
**Then** those tasks do not promise to create, delete, or resurrect portfolio items  
**And** they defer portfolio evidence state to Portfolio rules unless a future explicit integration story says otherwise.

### AC-3: Theme/SDG backlog avoids shared contract changes without coordination

**Given** Theme/SDG tasks modify project, task, business, auth, schema, or seed data  
**When** those changes affect portfolio source display fields or relationship-gate fixtures  
**Then** the task notes the dependency on the shared schema and seed contract  
**And** any conflicting change requires coordination before implementation.

### AC-4: Test-gate references are added where cross-epic behavior can regress

**Given** Archiving and Theme/SDG tasks can break Portfolio assumptions  
**When** backlog alignment is completed  
**Then** relevant tasks reference cross-epic regression testing for hard-delete removal, source archiving, source display joins, and authorization behavior.

### AC-5: No implementation starts before Phase 0 acceptance

**Given** Phase 0 is a prerequisite in the Portfolio specification  
**When** a developer selects a Portfolio Phase 1 or later task  
**Then** the task dependencies require the Phase 0 shared foundation tasks to be accepted first.

### AC-6: Completion evidence is reviewable

**Given** this task is marked complete  
**When** a reviewer checks the submitted change  
**Then** they can identify the Archiving backlog files updated, the Theme/SDG backlog files updated, the shared foundation dependencies added, and the cross-epic automated gates each aligned task points to  
**And** the reviewer can distinguish backlog alignment updates from implementation work.

---

## Implementation Notes

- This task may update existing backlog markdown files outside the new Portfolio backlog if needed.
- Keep the updates short and traceable; do not rewrite Archiving or Theme/SDG scope beyond the Portfolio specification's coordination needs.
- This task is intentionally documentation-focused but blocks implementation readiness.

---

## Ambiguities and Defaults

- **Ambiguity**: The exact wording to add to existing Archiving and Theme/SDG backlog files is not specified.  
  **Default**: Add concise “Shared Foundation Dependency” notes linking to the relevant SF tasks.

---

## Test Expectations

- No executable test is required for the markdown updates themselves.
- The aligned tasks must identify which automated gates later prove the shared contract remains intact.
