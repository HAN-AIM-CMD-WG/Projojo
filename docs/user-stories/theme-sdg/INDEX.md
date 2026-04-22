# Theme/SDG System — User Story Backlog

**Source**: [`THEME_SDG_SYSTEM_AUDIT.md`](../../THEME_SDG_SYSTEM_AUDIT.md) → [`THEME_SDG_IMPLEMENTATION_PLAN.md`](../../THEME_SDG_IMPLEMENTATION_PLAN.md) → This backlog  
**Date created**: 16 April 2026  
**Total stories**: 27  

---

## Master Backlog Table

| ID | Title | Phase | Priority | Type | Dependencies |
|----|-------|-------|----------|------|-------------|
| [TS-001](TS-001-theme-name-uniqueness.md) | Enforce Theme Name Uniqueness | 1 — Backend | 🔴 High | Technical | — |
| [TS-002](TS-002-project-deletion-cascade.md) | Fix Project Deletion Cascade for hasTheme | 1 — Backend | 🔴 High | Technical (Bug) | — |
| [TS-003](TS-003-link-ownership-enforcement.md) | Enforce Ownership on Project-Theme Linking | 1 — Backend | 🔴 High | Security | — |
| [TS-004](TS-004-theme-input-validation.md) | Add Input Validation on Theme CRUD | 1 — Backend | 🟠 Medium-High | Data Quality | TS-001 |
| [TS-005](TS-005-atomic-theme-linking.md) | Make Project-Theme Linking Atomic | 1 — Backend | 🟠 Medium-High | Technical | — |
| [TS-006](TS-006-jwt-middleware-narrowing.md) | Narrow JWT Middleware Exclusion for Themes | 1 — Backend | 🟡 Medium | Security | — |
| [TS-007](TS-007-exception-logging.md) | Replace Silent Exception Swallowing with Logging | 1 — Backend | 🟡 Medium | Observability | — |
| [TS-008](TS-008-link-existence-validation.md) | Validate Theme/Project Existence in Link Endpoint | 1 — Backend | 🟡 Medium | Data Quality | TS-005 |
| [TS-009](TS-009-backend-themes-in-business-query.md) | Add Themes to getBusinessesComplete() | 2 — UI | 🔴 High | Technical | — |
| [TS-010](TS-010-theme-management-list.md) | Theme Management List on TeacherPage | 2 — UI | 🔴 Critical | Functional | — |
| [TS-011](TS-011-theme-create-modal.md) | Theme Create Modal for Teachers | 2 — UI | 🔴 Critical | Functional | TS-010, TS-001, TS-004 |
| [TS-012](TS-012-theme-edit-modal.md) | Theme Edit Modal for Teachers | 2 — UI | 🔴 Critical | Functional | TS-010, TS-011, TS-004 |
| [TS-013](TS-013-theme-delete-confirmation.md) | Theme Delete with Confirmation Dialog | 2 — UI | 🔴 Critical | Functional | TS-010, TS-002 |
| [TS-014](TS-014-theme-picker-component.md) | Reusable ThemePicker Component | 2 — UI | 🔴 Critical | Functional | — |
| [TS-015](TS-015-theme-on-project-create.md) | Theme Selection on Project Creation | 2 — UI | 🔴 Critical | Functional | TS-014, TS-003, TS-005, TS-008 |
| [TS-016](TS-016-theme-on-project-edit.md) | Theme Selection on Project Edit | 2 — UI | 🔴 Critical | Functional | TS-014, TS-003, TS-005 |
| [TS-017](TS-017-theme-inline-edit-details.md) | Inline Theme Editing on ProjectDetailsPage | 2 — UI | 🟠 Medium-High | Functional | TS-014, TS-019 |
| [TS-018](TS-018-projectcard-theme-badges.md) | Theme Badges on Authenticated ProjectCard | 2 — UI | 🟠 Medium-High | Functional | TS-009 |
| [TS-019](TS-019-project-details-theme-display.md) | Theme Display on ProjectDetailsPage | 2 — UI | 🟠 Medium-High | Functional | — |
| [TS-020](TS-020-overviewpage-theme-fix.md) | Fix OverviewPage Public-Only Theme Limitation | 2 — UI | 🟠 Medium-High | Functional (Bug) | TS-009 |
| [TS-021](TS-021-supervisor-dashboard-themes.md) | Theme Display on Supervisor Dashboard | 2 — UI | 🟡 Medium | Functional | TS-009 |
| [TS-022](TS-022-sdg-badge-component.md) | SDG Badge Component with UN Colors | 3 — Enhance | 🟡 Medium | Functional | — |
| [TS-023](TS-023-sdg-display-integration.md) | SDG Badge Integration Across Theme Views | 3 — Enhance | 🟡 Medium | Functional | TS-022, TS-010, TS-014, TS-019 |
| [TS-024](TS-024-student-interest-backend.md) | Student Interest Schema and Backend | 3 — Enhance | 🟡 Medium | Technical | TS-001, TS-005 |
| [TS-025](TS-025-student-interest-selection.md) | Student Interest Selection UI on Profile | 3 — Enhance | 🟡 Medium | Functional | TS-024, TS-014 |
| [TS-026](TS-026-student-interest-dashboard.md) | Student Interest Summary on Dashboard | 3 — Enhance | 🟢 Low-Medium | Functional | TS-024, TS-025 |
| [TS-027](TS-027-documentation-corrections.md) | Correct Documentation for Theme Feature Status | 3 — Enhance | 🟡 Medium | Documentation | All Phase 2 |

---

## Dependency Graph

```
Phase 1 (all can start in parallel)
TS-001 ─────────────────────────────┐
TS-002 ─────────────────────────────┤
TS-003 ─────────────────────────────┤
TS-004 ← TS-001                     ├── Phase 1 Gate
TS-005 ─────────────────────────────┤
TS-006 ─────────────────────────────┤
TS-007 ─────────────────────────────┤
TS-008 ← TS-005                     ┘

Phase 2 (after Phase 1 gate)
TS-009 ─────────────────────────────┐ (backend, do first)
TS-010 ─────────────────────────────┤
TS-014 ─────────────────────────────┤ (reusable component, do early)
                                    │
TS-011 ← TS-010, TS-001, TS-004    │
TS-012 ← TS-010, TS-011, TS-004    │
TS-013 ← TS-010, TS-002            │
                                    │
TS-015 ← TS-014, TS-003, TS-005    │
TS-016 ← TS-014, TS-003, TS-005    │
                                    │
TS-019 ─────────────────────────────┤ (read-only, no deps)
TS-017 ← TS-014, TS-019            │
                                    │
TS-018 ← TS-009                     │
TS-020 ← TS-009                     │
TS-021 ← TS-009                     ┘

Phase 3 (after Phase 2 verified)
TS-022 ─────────────────────────────┐
TS-023 ← TS-022, TS-010, TS-014    │
                                    │
TS-024 ← TS-001, TS-005            │
TS-025 ← TS-024, TS-014            │
TS-026 ← TS-024, TS-025            │
                                    │
TS-027 ← All Phase 2               ┘
```

---

## Phase Summary

| Phase | Stories | Critical | High | Medium-High | Medium | Low-Medium |
|-------|---------|----------|------|-------------|--------|------------|
| 1 — Backend & Data Integrity | 8 | — | 3 | 2 | 3 | — |
| 2 — UI Workflows | 13 | 7 | 1 | 4 | 1 | — |
| 3 — Enhancements | 6 | — | — | — | 5 | 1 |
| **Total** | **27** | **7** | **4** | **6** | **9** | **1** |

---

## Suggested Sprint Allocation

### Sprint 1: Backend Hardening (Phase 1)
| Story | Points (est.) |
|-------|---------------|
| TS-001 | 2 |
| TS-002 | 1 |
| TS-003 | 3 |
| TS-004 | 3 |
| TS-005 | 2 |
| TS-006 | 1 |
| TS-007 | 1 |
| TS-008 | 2 |
| **Total** | **15** |

### Sprint 2: Core UI — Teacher Management + ThemePicker
| Story | Points (est.) |
|-------|---------------|
| TS-009 | 3 |
| TS-010 | 3 |
| TS-011 | 5 |
| TS-012 | 3 |
| TS-013 | 3 |
| TS-014 | 5 |
| **Total** | **22** |

### Sprint 3: Project-Theme Linking + Visibility
| Story | Points (est.) |
|-------|---------------|
| TS-015 | 3 |
| TS-016 | 3 |
| TS-017 | 5 |
| TS-018 | 2 |
| TS-019 | 3 |
| TS-020 | 3 |
| TS-021 | 2 |
| **Total** | **21** |

### Sprint 4: Enhancements (Phase 3)
| Story | Points (est.) |
|-------|---------------|
| TS-022 | 3 |
| TS-023 | 3 |
| TS-024 | 5 |
| TS-025 | 3 |
| TS-026 | 2 |
| TS-027 | 1 |
| **Total** | **17** |

---

## Traceability Matrix

| Audit Finding | Severity | Covered by |
|--------------|----------|------------|
| No theme management UI for teachers (§2A) | 🔴 Critical | TS-010, TS-011, TS-012, TS-013 |
| No project-theme linking UI (§2B) | 🔴 Critical | TS-014, TS-015, TS-016, TS-017 |
| No theme display in authenticated views (§2C) | 🟠 Medium-High | TS-018, TS-019, TS-020, TS-021 |
| No per-project theme display (§2D) | 🟠 Medium-High | TS-019, TS-017 |
| No student interest/theme selection (§2G) | 🟡 Medium | TS-024, TS-025, TS-026 |
| No SDG information display (§2I) | 🟢 Low-Medium | TS-022, TS-023 |
| Project deletion cascade bug (§3A) | 🔴 High | TS-002 |
| OverviewPage public-only themes (§3B) | 🟠 Medium-High | TS-009, TS-020 |
| Missing ownership enforcement (§4.1) | 🔴 High | TS-003 |
| No theme name uniqueness (§4.2) | 🔴 High | TS-001 |
| No input validation (§4.3) | 🟠 Medium-High | TS-004 |
| Non-atomic linking (§4.4) | 🟠 Medium-High | TS-005 |
| JWT middleware too broad (§4.5) | 🟡 Medium | TS-006 |
| Silent exception swallowing (§4.6) | 🟡 Medium | TS-007 |
| Invalid IDs silently ignored (§5A, §5B) | 🟡 Medium | TS-008 |
| Documentation mismatches (§7) | 🟡 Medium | TS-027 |

---

## Out of Scope (Deferred)

These items from the audit are explicitly excluded from this backlog:

| Item | Reason | Audit ref |
|------|--------|-----------|
| Theme proposal workflow (supervisor → teacher approval) | Too complex for current scope | §2F |
| Theme statistics/reporting | No user story priority | §2H |
| Student-theme matching algorithm | Requires matching system redesign; data layer deferred to TS-024 | §2E |
| Theme-based filtering on dashboards | Beyond theme scope; requires dashboard refactor | §3D (partial) |
| Error leak fix (`str(e)` → generic message) | Low risk in development | §5C |

---

*All 27 stories are individually filed in [`docs/user-stories/theme-sdg/`](.) with full acceptance criteria, technical notes, and dependency chains.*
