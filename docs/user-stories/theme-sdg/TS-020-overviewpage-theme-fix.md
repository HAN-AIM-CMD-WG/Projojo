# TS-020 — Fix OverviewPage Public-Only Theme Limitation

**Phase**: 2 — UI Workflows  
**Priority**: 🟠 Medium-High  
**Type**: Functional Story (Bug Fix)  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §3B](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §2.3C](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: [TS-009](TS-009-backend-themes-in-business-query.md) (theme data must be in getBusinessesComplete response)  

---

## User Story

As an **authenticated user** (student, supervisor, or teacher),  
I want the OverviewPage theme filter to work for all projects I have access to,  
so that non-public projects with themes are not excluded from theme-based filtering.

---

## Acceptance Criteria

### AC-1: Non-public projects show themes

**Given** a project with `isPublic = false` linked to theme "Duurzaamheid"  
**When** an authenticated user views the OverviewPage  
**Then** that project shows the "Duurzaamheid" theme badge  
**And** it appears when filtering by "Duurzaamheid"

### AC-2: Theme filter includes all accessible projects

**Given** 10 projects total: 6 public and 4 non-public, all with various themes  
**When** the user selects a theme filter  
**Then** projects from both public and non-public sets are shown if they match the selected theme

### AC-3: Themes sourced from business data, not public projects

**Given** the OverviewPage loads  
**When** theme data is being resolved  
**Then** themes come from the enriched `getBusinessesComplete()` response ([TS-009](TS-009-backend-themes-in-business-query.md))  
**And** the `getPublicProjects()` call used solely for theme mapping is no longer needed

### AC-4: Theme pill counts are accurate

**Given** theme "Innovatie & Technologie" applies to 3 public and 2 non-public projects  
**When** the theme filter pills are displayed  
**Then** the "Innovatie & Technologie" pill shows a count of 5 (not 3)

### AC-5: Themes with zero matching accessible projects are hidden

**Given** a theme that only applies to projects the user cannot see  
**When** the theme filter renders  
**Then** that theme pill is hidden (zero-count filtering, matching existing behavior)

### AC-6: Existing filter behavior preserved

**Given** the OverviewPage currently supports skill filtering, search, and theme filtering  
**When** the theme data source is changed  
**Then** skill filtering, search, and all other filters continue to work identically

---

## Technical Notes

- **File**: [`projojo_frontend/src/pages/OverviewPage.jsx`](../../../projojo_frontend/src/pages/OverviewPage.jsx:24)
- **Current bug**: Themes are mapped from [`getPublicProjects()`](../../../projojo_frontend/src/pages/OverviewPage.jsx:41) at lines 41-44 via `projectThemesMap`. Non-public projects have no theme data.
- **Fix**: 
  1. Remove the `getPublicProjects()` call used for theme mapping
  2. Read themes directly from the enriched `getBusinessesComplete()` response (each project now has a `themes` array per [TS-009](TS-009-backend-themes-in-business-query.md))
  3. Update the `projectThemesMap` construction to use business data instead of public project data
- The [`Filter.jsx`](../../../projojo_frontend/src/components/Filter.jsx:146) component is not affected — it receives themes as a prop and works correctly with whatever data the parent provides
