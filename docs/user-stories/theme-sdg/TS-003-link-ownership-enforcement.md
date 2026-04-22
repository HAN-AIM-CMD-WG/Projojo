# TS-003 — Enforce Ownership on Project-Theme Linking

**Phase**: 1 — Backend & Data Integrity  
**Priority**: 🔴 High  
**Type**: Non-functional Story (Security)  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §4.1](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §1.3](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: None  

---

## User Story

As a **platform administrator**,  
I want only authorized users to modify theme links on a project,  
so that supervisors from one organization cannot tamper with another organization's project themes.

---

## Acceptance Criteria

### AC-1: Supervisor can link themes to own project

**Given** a supervisor who owns project "SmartFarm Sensor Network" through their business  
**When** the supervisor calls `PUT /themes/project/{project_id}` with valid theme IDs  
**Then** the theme links are updated successfully  
**And** the response confirms the linking

### AC-2: Supervisor blocked from linking themes to another business's project

**Given** supervisor A belonging to Business "SmartFarm BV"  
**And** project "City Deal Urban Analytics" belonging to Business "City Deal"  
**When** supervisor A calls `PUT /themes/project/{city_deal_project_id}` with theme IDs  
**Then** the API returns HTTP 403 with message `"Onvoldoende rechten"`  
**And** no theme links are modified

### AC-3: Teacher can link themes to any project

**Given** a teacher  
**And** a project belonging to any business  
**When** the teacher calls `PUT /themes/project/{project_id}` with valid theme IDs  
**Then** the theme links are updated successfully regardless of project ownership

### AC-4: Student remains blocked

**Given** a student  
**When** the student calls `PUT /themes/project/{project_id}`  
**Then** the API returns HTTP 403 with message `"Studenten kunnen geen thema's koppelen"`

### AC-5: Unauthenticated user blocked

**Given** a request without a valid JWT token  
**When** the request calls `PUT /themes/project/{project_id}`  
**Then** the API returns HTTP 401 or 403

---

## Technical Notes

- **File**: [`projojo_backend/routes/theme_router.py:87-112`](../../../projojo_backend/routes/theme_router.py:87)
- **Current code comment** at line 102 explicitly acknowledges the gap: *"Note: For full authorization, we'd need to check project ownership / For now, allow all supervisors and teachers."*
- **Implementation approach**:
  1. If `role == "teacher"` → allow, skip ownership check
  2. If `role == "supervisor"` → verify project belongs to supervisor's business using the same ownership pattern as project update routes (`@auth(role="supervisor", owner_id_key="project_id")`)
  3. All other roles → 403
- Match the authorization pattern used in project CRUD endpoints that use [`@auth(role="supervisor", owner_id_key="project_id")`](../../../projojo_backend/auth/permissions.py)
- The [`get_token_payload`](../../../projojo_backend/auth/jwt_utils.py) dependency already extracts user role and ID from the JWT
