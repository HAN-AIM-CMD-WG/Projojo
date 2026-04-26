# ARCH-task-018 — Multi-Business Supervisor Switcher

**User Story**: [ARCH-story-005 — Role-Specific Archive Experience](ARCH-story-005-role-specific-archive-experience.md)  
**Priority**: 🟡 High  
**Type**: Functional Task  
**Spec references**: [§6.7](../../ARCHIVING_SPECIFICATION.md), [§4.5](../../ARCHIVING_SPECIFICATION.md), Open Questions table  
**Dependencies**: [ARCH-task-001](ARCH-task-001-schema-migration.md), [ARCH-task-017](ARCH-task-017-supervisor-login-block.md)

---

## Task Story

As a **supervisor managing multiple businesses**,  
I want a visible switcher in the UI that shows all my active businesses and lets me switch between them without re-logging in,  
so that I can manage multiple organizations in a single session.

---

## Context: What Must Change and Why

The current supervisor model uses a single `business_association_id` ([`user.py:24`](../../../projojo_backend/domain/models/user.py:24)), and the frontend [`SupervisorDashboard.jsx`](../../../projojo_frontend/src/pages/SupervisorDashboard.jsx) assumes a single business context. There is no business switcher component.

The specification (§6.7) requires a visible business switcher. The detailed interaction design is explicitly deferred to this task (spec Open Questions table).

---

## Acceptance Criteria

### AC-1: Backend returns all active businesses for supervisor

**Given** a supervisor is authenticated  
**When** the supervisor's dashboard data is fetched  
**Then** the API returns a list of all active (non-archived) businesses the supervisor manages  
**And** archived businesses are excluded from this list

### AC-2: Business switcher visible in supervisor UI

**Given** a supervisor manages two or more active businesses  
**When** the supervisor views their dashboard  
**Then** a business switcher element is visible (tabs, dropdown, or nav items)  
**And** all active businesses are listed with their names  
**And** the current business context is highlighted/selected

### AC-3: Switching business updates dashboard context

**Given** a supervisor is viewing Business A's context  
**When** the supervisor selects Business B in the switcher  
**Then** the dashboard updates to show Business B's projects, tasks, and registrations  
**And** no new login or authentication step is required

### AC-4: Single-business supervisors see no switcher

**Given** a supervisor manages only one active business  
**When** the supervisor views their dashboard  
**Then** no business switcher is shown (unnecessary UI noise)  
**And** the single business is the default context

### AC-5: Archived business disappears from switcher

**Given** a supervisor manages Business A (active) and Business B (recently archived)  
**When** the supervisor loads or refreshes the dashboard  
**Then** only Business A appears in the switcher  
**And** Business B is not shown

### AC-6: Last remaining business becomes sole context

**Given** a supervisor was managing two businesses and one is archived  
**When** the dashboard loads  
**Then** the switcher is hidden (single business remaining)  
**And** the active business becomes the automatic context

### AC-7: Switcher styling follows neumorphic conventions

**Given** the switcher is rendered  
**When** inspecting its styling  
**Then** it uses the project's neumorphic design system (`neu-flat`, `neu-pressed`, etc.)  
**And** the selected business has a visually distinct state (e.g., pressed/active indicator)  
**And** hover states follow the standard `transition-colors` pattern

---

## Technical Notes

### Backend changes

The supervisor needs a new or modified endpoint that returns all managed active businesses:

```python
@router.get("/supervisor/me/businesses")
@auth(role="supervisor")
async def get_supervisor_businesses(request: Request):
    supervisor_id = request.state.user_id
    # Query all manages relations for this supervisor, filter archived businesses
    return supervisor_repo.get_active_businesses(supervisor_id)
```

TypeQL query:
```tql
match
    $s isa supervisor, has id ~supervisor_id;
    $m isa manages (supervisor: $s, business: $b);
    $b has id $bid, has name $bname;
not { $b has archivedAt $x; };
fetch { 'id': $bid, 'name': $bname };
```

### Frontend component

The spec says "nav items, tabs, or a comparable always-visible switcher." Suggested approach:

- If ≤ 3 businesses: tabs in the dashboard header
- If > 3: dropdown selector
- Store active business context in React state or URL params

### Interaction with existing supervisor dashboard

The current [`SupervisorDashboard.jsx`](../../../projojo_frontend/src/pages/SupervisorDashboard.jsx) likely loads data for a single business. It must be refactored to:
1. Accept a `businessId` parameter
2. Fetch data for only the selected business
3. Re-fetch when the business context changes

### Risks

- **Risk**: This requires coordinated backend and frontend changes. The supervisor model (ARCH-task-002) must support multi-business first.
- **Ambiguity**: The spec deliberately defers detailed interaction design to this task. The acceptance criteria above define minimum requirements. Consider user testing for the optimal switcher pattern.
- **Resolved**: Switching business uses URL-based context (e.g., `/supervisor/dashboard?business=123`). URL-based context is more robust — bookmarkable, sharable, and survives page refresh.

### Files likely affected

- [`projojo_backend/domain/repositories/user_repository.py`](../../../projojo_backend/domain/repositories/user_repository.py) — new query for supervisor businesses
- [`projojo_backend/routes/supervisor_router.py`](../../../projojo_backend/routes/supervisor_router.py) — new endpoint
- [`projojo_frontend/src/pages/SupervisorDashboard.jsx`](../../../projojo_frontend/src/pages/SupervisorDashboard.jsx) — add switcher + business context
- New component: `projojo_frontend/src/components/BusinessSwitcher.jsx`
