# ARCH-task-016 — Student Dashboard: Recently Archived Registrations

**User Story**: [ARCH-story-005 — Role-Specific Archive Experience](ARCH-story-005-role-specific-archive-experience.md)  
**Priority**: 🟡 High  
**Type**: Functional Task  
**Spec references**: [§3.5](../../ARCHIVING_SPECIFICATION.md), [§6.4](../../ARCHIVING_SPECIFICATION.md), [§2.5](../../ARCHIVING_SPECIFICATION.md)  
**Dependencies**: [ARCH-task-004](ARCH-task-004-active-query-filtering.md)

---

## Task Story

As a **student**,  
I want to see registrations that were recently archived (within the last 30 days) in a read-only section on my dashboard,  
so that I am aware of registrations I lost and can contact a teacher if needed.

---

## Context: What Must Change and Why

The current [`StudentDashboard.jsx`](../../../projojo_frontend/src/pages/StudentDashboard.jsx) has **no archive-related UI**. The spec §6.4 requires a new "Recent gearchiveerd" section.

This also requires a new backend endpoint or query to fetch the student's recently-archived registrations, since no such endpoint exists.

---

## Acceptance Criteria

### AC-1: New backend endpoint for recently archived registrations

**Given** a student has registrations that were archived within the last 30 days  
**When** the student's dashboard data is fetched  
**Then** the API returns a list of recently-archived registrations containing:
- Task name
- Project name
- `archived_at` (ISO 8601 with timezone)
- `archived_reason`

### AC-2: 30-day window calculated from backend time

**Given** the 30-day recently-archived window  
**When** the query determines which registrations to include  
**Then** the cutoff is calculated from backend server time (UTC), not browser local time  
**And** registrations archived more than 30 days ago are excluded

### AC-3: Student sees only their own archived registrations

**Given** a student is logged in  
**When** the recently-archived section loads  
**Then** only registrations belonging to the current student are shown  
**And** registrations of other students are never visible

### AC-4: "Recent gearchiveerd" section on student dashboard

**Given** the student has recently-archived registrations  
**When** the student dashboard loads  
**Then** a "Recent gearchiveerd" section is visible  
**And** each item shows: task name, project name, archive date, archive reason

### AC-5: Section is read-only

**Given** the student views recently-archived registrations  
**When** the section renders  
**Then** there are no action buttons (no restore, no delete, no re-register)  
**And** the section is purely informational

### AC-6: Empty state when no recent archives

**Given** the student has no registrations archived within the last 30 days  
**When** the dashboard loads  
**Then** the "Recent gearchiveerd" section either:
- Shows "Geen recent gearchiveerde inschrijvingen" message, or
- Is hidden entirely (either approach is acceptable)

### AC-7: Section styling matches dashboard conventions

**Given** the student dashboard has existing section styling  
**When** the recently-archived section renders  
**Then** the styling matches the existing dashboard sections  
**And** archived items are visually distinct (e.g., muted colors, archive icon)

### AC-8: Archived registrations excluded from active registration list

**Given** a student has both active and archived registrations  
**When** the active registration section loads  
**Then** archived registrations do not appear in the active list (covered by ARCH-task-004, but verified here from the student's perspective)

---

## Technical Notes

### Backend query (spec §3.5)

The TypeQL query for recently-archived registrations:

```tql
match
    $r isa registersForTask (task: $t, student: $s);
    $s has id ~student_id;
    $r has archivedAt $rArchived;
    $rArchived > ~thirty_days_ago;
    ($p, $t) isa containsTask;
    $t has name $taskName;
    $p has name $projectName;
    $r has archivedReason $reason;
fetch {
    'task_name': $taskName,
    'project_name': $projectName,
    'archived_at': $rArchived,
    'archived_reason': $reason
};
```

The `~thirty_days_ago` parameter must be computed as `datetime.now(timezone.utc) - timedelta(days=30)` in Python.

### API endpoint

This needs a new endpoint, likely:
```
GET /students/me/recently-archived-registrations
Auth: Student (own data only)
```

Or it could be included as a field in existing student dashboard data fetches.

### Risks

- **Risk**: This requires both a new backend endpoint and a new frontend section. Coordinate frontend and backend work.
- **Resolved**: The 30-day window is hard-coded as a named constant (e.g., `RECENTLY_ARCHIVED_DAYS = 30`) that can be easily changed later. No runtime configurability needed.
- **Ambiguity**: The spec says "recently archived registrations" — it is unclear whether this means only registrations where the `registersForTask` relation itself was archived, or also registrations for tasks whose parent was archived (cascaded). Since the cascade archives the registration relation directly (it gets its own `archivedAt`), querying on `$r has archivedAt` captures both cases.

### Files likely affected

- New endpoint in [`projojo_backend/routes/student_router.py`](../../../projojo_backend/routes/student_router.py) or similar
- New repository method in [`projojo_backend/domain/repositories/user_repository.py`](../../../projojo_backend/domain/repositories/user_repository.py)
- [`projojo_frontend/src/pages/StudentDashboard.jsx`](../../../projojo_frontend/src/pages/StudentDashboard.jsx) — new section
- [`projojo_frontend/src/services.js`](../../../projojo_frontend/src/services.js) — new service function
