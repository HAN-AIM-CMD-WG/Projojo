# TS-task-018 — Theme Badges on Authenticated ProjectCard

**Phase**: 2 — UI Workflows  
**Priority**: 🟠 Medium-High  
**Type**: Functional Task  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §2C](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §2.3A](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: [TS-task-009](TS-task-009-backend-themes-in-business-query.md) (theme data must be in getBusinessesComplete response)  

---

## Task Story

As an **authenticated user** (student, supervisor, or teacher),  
I want to see theme badges on project cards in authenticated views,  
so that I can visually identify project themes while browsing.

---

## Acceptance Criteria

### AC-1: First theme shown as colored badge

**Given** a project linked to themes "Duurzaamheid" (color: #4CAF50, icon: eco) and "Innovatie & Technologie"  
**When** an authenticated user views the project card on the OverviewPage or BusinessPage  
**Then** the first theme is displayed as a colored badge with the theme icon and name

### AC-2: Additional themes shown as "+N" count

**Given** a project linked to 3 themes  
**When** the project card renders  
**Then** the first theme is shown as a badge  
**And** a "+2" label indicates 2 additional themes

### AC-3: Projects without themes show no badge

**Given** a project with no linked themes  
**When** the project card renders  
**Then** no theme badge or "+0" label is displayed  
**And** the card layout adjusts gracefully

### AC-4: Badge styling matches public card pattern

**Given** the theme badge on the authenticated ProjectCard  
**When** compared to [`PublicProjectCard.jsx:56-68`](../../../projojo_frontend/src/components/PublicProjectCard.jsx:56)  
**Then** the badge uses the same visual pattern: theme color background, white or dark icon/text, compact sizing

### AC-5: Theme data from enriched business query

**Given** the project data comes from `getBusinessesComplete()`  
**When** the ProjectCard component receives a project object  
**Then** it reads from `project.themes` array (added by [TS-task-009](TS-task-009-backend-themes-in-business-query.md))  
**And** does not make additional API calls for theme data

---

## Technical Notes

- **File**: [`projojo_frontend/src/components/ProjectCard.jsx`](../../../projojo_frontend/src/components/ProjectCard.jsx) — currently has zero theme references
- **Pattern to match**: [`PublicProjectCard.jsx:56-68`](../../../projojo_frontend/src/components/PublicProjectCard.jsx:56) which renders theme badges with:
  ```jsx
  {project.themes && project.themes.length > 0 && (
      // first theme as colored badge
      // +N for additional themes
  )}
  ```
- **Data source**: `project.themes` array provided by parent component via enriched `getBusinessesComplete()` response ([TS-task-009](TS-task-009-backend-themes-in-business-query.md))
- **Neumorphic styling**: Use theme color as badge background with appropriate text contrast
