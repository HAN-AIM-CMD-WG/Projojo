# TS-027 — Correct Documentation for Theme/SDG Feature Status

**Phase**: 3 — Enhancements  
**Priority**: 🟡 Medium  
**Type**: Non-functional Story (Documentation)  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §7](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §3.3](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: All Phase 2 stories ([TS-009](TS-009-backend-themes-in-business-query.md) through [TS-021](TS-021-supervisor-dashboard-themes.md)) must be completed before marking as ✅  

---

## User Story

As a **developer or product owner**,  
I want the documentation to accurately reflect the implementation status of theme features,  
so that stakeholders are not misled about what is actually available in the platform.

---

## Acceptance Criteria

### AC-1: DOC-009 status corrected

**Given** [`docs/USER_STORIES_DOCENT.md`](../../USER_STORIES_DOCENT.md) — DOC-009 (Thema's beheren)  
**When** Phase 1 and 2 are incomplete  
**Then** status is marked as: *"⚠️ Backend API alleen — UI in ontwikkeling"*

**When** Phase 2 is completed and verified  
**Then** status can be updated to: *"✅ Geïmplementeerd"*

### AC-2: GEBRUIKERSSCENARIOS_V1 feature matrix corrected

**Given** [`docs/GEBRUIKERSSCENARIOS_V1.md`](../../GEBRUIKERSSCENARIOS_V1.md) — "Thema's koppelen" row  
**When** Phase 2 is incomplete  
**Then** status reads: *"⚠️ Backend API alleen — UI in ontwikkeling"*

**When** Phase 2 is completed  
**Then** status can be updated to: *"✅ Geïmplementeerd"*

### AC-3: ROADMAP updated

**Given** [`docs/ROADMAP.md`](../../ROADMAP.md) — "Thema's beheren" line item  
**When** Phase 2 is incomplete  
**Then** status reads: *"⚠️ Backend API alleen — UI in ontwikkeling"*

**When** Phase 2 is completed  
**Then** status can be updated to: *"✅ Geïmplementeerd"*

### AC-4: Audit document referenced

**Given** the documentation updates  
**When** the status is changed  
**Then** a note references the [`THEME_SDG_SYSTEM_AUDIT.md`](../../THEME_SDG_SYSTEM_AUDIT.md) for the rationale behind the status correction

### AC-5: New capabilities documented

**Given** Phase 2 is complete  
**When** documentation is finalized  
**Then** the feature matrix includes the newly built capabilities:
- Theme management UI (teacher)
- Project-theme linking UI (supervisor)
- Theme display across authenticated views
- Theme filtering on all accessible projects (not just public)

### AC-6: Out-of-scope items noted

**Given** the documentation update  
**When** features marked as "implemented" are reviewed  
**Then** explicitly note remaining gaps:
- Theme proposal workflow (supervisor → teacher approval) — not implemented
- Theme statistics/reporting — not implemented
- Student-theme matching algorithm — not implemented (data layer in Phase 3, algorithm deferred)

---

## Technical Notes

- **Files to update**:
  1. [`docs/USER_STORIES_DOCENT.md`](../../USER_STORIES_DOCENT.md) — DOC-009 status
  2. [`docs/GEBRUIKERSSCENARIOS_V1.md`](../../GEBRUIKERSSCENARIOS_V1.md) — feature matrix "Thema's koppelen" row
  3. [`docs/ROADMAP.md`](../../ROADMAP.md) — "Thema's beheren" line item
- **Timing**: 
  - Immediate (during Phase 1): change statuses to "⚠️ Backend API alleen — UI in ontwikkeling"
  - After Phase 2 verified: change to "✅ Geïmplementeerd" with implementation date
- This is a documentation-only change — no code changes required
- These mismatches were explicitly identified in [THEME_SDG_SYSTEM_AUDIT.md §7](../../THEME_SDG_SYSTEM_AUDIT.md) items A, B, E, F
