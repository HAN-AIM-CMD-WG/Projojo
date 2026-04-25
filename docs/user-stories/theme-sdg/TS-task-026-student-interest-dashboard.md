# TS-task-026 — Student Interest Summary on Dashboard

**Phase**: 3 — Enhancements  
**Priority**: 🟢 Low-Medium  
**Type**: Functional Task  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §2G](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §3.2](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: [TS-task-024](TS-task-024-student-interest-backend.md) (backend), [TS-task-025](TS-task-025-student-interest-selection.md) (selection UI)  

---

## Task Story

As a **student**,  
I want to see my selected theme interests on my dashboard,  
so that I'm reminded of my preferences and can quickly navigate to update them.

---

## Acceptance Criteria

### AC-1: Interest summary section visible

**Given** a student with interests in "Duurzaamheid" and "Klimaat & Milieu"  
**When** they visit their StudentDashboard  
**Then** a "Mijn interesses" section displays both themes as read-only pills

### AC-2: Theme pills match platform styling

**Given** the interest pills on the dashboard  
**When** rendered  
**Then** each pill shows the theme's color dot, name, and optionally the SDG badge ([TS-task-022](TS-task-022-sdg-badge-component.md))  
**And** the styling matches theme pills used elsewhere in the platform

### AC-3: Link to edit interests

**Given** the "Mijn interesses" section  
**When** the student views it  
**Then** a link or button is available to navigate to the profile page for editing interests

### AC-4: No interests — call to action

**Given** a student with no selected interests  
**When** they view the dashboard  
**Then** a message is shown: *"Je hebt nog geen interesses gekozen"*  
**And** a link to the profile page is offered: *"Kies je interesses"*

### AC-5: Dashboard does not allow editing

**Given** the interest summary on the dashboard  
**When** the student views the pills  
**Then** the pills are read-only (not clickable/toggleable)  
**And** editing is only possible via the profile page ([TS-task-025](TS-task-025-student-interest-selection.md))

---

## Technical Notes

- **File**: [`projojo_frontend/src/pages/StudentDashboard.jsx`](../../../projojo_frontend/src/pages/StudentDashboard.jsx) — currently has zero theme references
- **Service call**: `getStudentInterests(studentId)` (added in [TS-task-025](TS-task-025-student-interest-selection.md))
- **Component**: Use `<ThemePicker readOnly={true} initialSelected={interestIds}>` from [TS-task-014](TS-task-014-theme-picker-component.md), or render simple read-only pills
- **Position**: Place near the top of the dashboard or alongside the student's skill summary for a cohesive "my profile" overview
