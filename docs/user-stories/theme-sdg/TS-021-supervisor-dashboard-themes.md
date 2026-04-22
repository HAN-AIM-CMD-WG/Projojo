# TS-021 — Theme Display on Supervisor Dashboard

**Phase**: 2 — UI Workflows  
**Priority**: 🟡 Medium  
**Type**: Functional Story  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §3D](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §2.3D](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: [TS-009](TS-009-backend-themes-in-business-query.md) (theme data in project responses)  

---

## User Story

As a **begeleider** (supervisor),  
I want to see theme badges on my projects within the supervisor dashboard,  
so that I have thematic context when managing my active projects and tasks.

---

## Acceptance Criteria

### AC-1: Theme pills shown on project items

**Given** the supervisor's project "SmartFarm Sensor Network" is linked to "Duurzaamheid" and "Innovatie & Technologie"  
**When** the supervisor views their dashboard  
**Then** the project entry shows theme pills for both themes

### AC-2: Theme pill styling compact

**Given** theme pills on the dashboard  
**When** rendered alongside other project information (registrations, tasks)  
**Then** the pills are compact (small size, matching skill badge sizing)  
**And** they show the theme color dot and name

### AC-3: Projects without themes show no pills

**Given** a project with no linked themes  
**When** shown on the dashboard  
**Then** no theme pills or empty placeholder is displayed  
**And** the layout adjusts cleanly

### AC-4: Multiple themes truncated

**Given** a project with 5 linked themes  
**When** displayed on the dashboard  
**Then** at most 2-3 theme pills are shown  
**And** a "+N" label indicates additional themes (matching the pattern used in project cards)

### AC-5: Theme data from existing data source

**Given** the supervisor dashboard loads project data  
**When** the data includes themes (from enriched backend response)  
**Then** theme pills are rendered from the project's `themes` array  
**And** no additional API calls are needed for theme data

---

## Technical Notes

- **File**: [`projojo_frontend/src/pages/SupervisorDashboard.jsx`](../../../projojo_frontend/src/pages/SupervisorDashboard.jsx) — currently has zero theme references
- **Data source**: The supervisor dashboard already loads project data. After [TS-009](TS-009-backend-themes-in-business-query.md), each project object will include a `themes` array.
- **Styling**: Match the compact badge pattern used by [`PublicProjectCard.jsx:56-68`](../../../projojo_frontend/src/components/PublicProjectCard.jsx:56) but at a smaller scale appropriate for dashboard density
- **Accessibility**: Color contrast must meet WCAG AA on pill backgrounds; include `aria-label` on pills with theme name
