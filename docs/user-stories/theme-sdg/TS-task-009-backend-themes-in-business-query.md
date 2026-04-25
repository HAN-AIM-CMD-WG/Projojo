# TS-task-009 — Add Theme Sub-query to getBusinessesComplete() Endpoint

**Phase**: 2 — UI Workflows  
**Priority**: 🔴 High (blocks multiple frontend tasks)  
**Type**: Technical Task  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §3B](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §2.4](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: None (Phase 1 fixes are backend-only and can be deployed independently)  

---

## Task Story

As a **developer**,  
I want project data returned by `getBusinessesComplete()` to include theme information,  
so that authenticated frontend views can display themes without additional API calls per project.

---

## Acceptance Criteria

### AC-1: Projects in response include themes array

**Given** a project linked to themes "Duurzaamheid" and "Innovatie & Technologie"  
**When** `GET /businesses/complete` is called  
**Then** each project object in the response includes a `themes` array  
**And** each theme object contains at minimum: `id`, `name`, `icon`, `color`

### AC-2: Projects with no themes return empty array

**Given** a project with no linked themes  
**When** `GET /businesses/complete` is called  
**Then** that project's `themes` field is an empty array `[]`

### AC-3: Theme data matches direct theme query

**Given** a project linked to "Duurzaamheid" (id: `theme-duurzaamheid`, color: `#4CAF50`, icon: `eco`)  
**When** comparing the theme data from `GET /businesses/complete` with `GET /themes/project/{id}`  
**Then** both return identical `id`, `name`, `icon`, and `color` values for that theme

### AC-4: Response shape backward-compatible

**Given** existing frontend code consuming `getBusinessesComplete()`  
**When** the enriched response is returned  
**Then** all existing fields (business data, projects, tasks, skills) remain unchanged  
**And** the `themes` array is a new addition that does not break existing consumers

### AC-5: Multiple themes per project correctly nested

**Given** a project linked to 3 themes  
**When** `GET /businesses/complete` is called  
**Then** the project's `themes` array contains exactly 3 theme objects  
**And** each is a distinct theme with correct data

---

## Technical Notes

- **File**: [`projojo_backend/domain/repositories/business_repository.py`](../../../projojo_backend/domain/repositories/business_repository.py) — the `getBusinessesComplete()` query
- **Pattern to follow**: The existing nested theme sub-query in [`get_public_projects()`](../../../projojo_backend/domain/repositories/project_repository.py:103) at lines 103-112 already fetches `id`, `name`, `icon`, `color` per project's themes via the `hasTheme` relation
- **TypeQL addition** to the business query:
  ```tql
  $hasTheme isa hasTheme(project: $project, theme: $theme);
  $theme has id $themeId, has name $themeName, has icon $themeIcon, has color $themeColor;
  ```
- This is the backend prerequisite for [TS-task-018](TS-task-018-projectcard-theme-badges.md), [TS-task-020](TS-task-020-overviewpage-theme-fix.md), and [TS-task-021](TS-task-021-supervisor-dashboard-themes.md)
