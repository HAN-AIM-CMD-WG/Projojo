# TS-task-008 — Validate Theme and Project Existence in Link Endpoint

**Phase**: 1 — Backend & Data Integrity  
**Priority**: 🟡 Medium  
**Type**: Non-functional Task (Data Quality)  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §5 Robustness A, B](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §1.8](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: [TS-task-005](TS-task-005-atomic-theme-linking.md) (atomic linking must be in place first)  

---

## Task Story

As a **begeleider** (supervisor),  
I want clear error feedback when I try to link invalid theme or project IDs,  
so that I know why the operation failed instead of getting a silent false success.

---

## Acceptance Criteria

### AC-1: Invalid project ID returns 404

**Given** a project ID that does not exist in the database  
**When** `PUT /themes/project/{nonexistent_project_id}` is called  
**Then** the API returns HTTP 404 with message `"Project niet gevonden"`  
**And** no theme links are created or modified

### AC-2: Single invalid theme ID returns 400

**Given** a valid project ID  
**And** `theme_ids` includes `"nonexistent-theme"`  
**When** the linking endpoint is called  
**Then** the API returns HTTP 400 with a message listing the invalid theme ID(s)  
**And** no theme links are modified (including valid theme IDs in the same request)

### AC-3: Multiple invalid theme IDs listed in error

**Given** a valid project ID  
**And** `theme_ids` = `["nonexistent-1", "theme-duurzaamheid", "nonexistent-2"]`  
**When** the linking endpoint is called  
**Then** the API returns HTTP 400 with message identifying both `"nonexistent-1"` and `"nonexistent-2"` as invalid  
**And** no theme links are modified

### AC-4: All valid theme IDs succeed with accurate count

**Given** a valid project ID  
**And** `theme_ids` = `["theme-duurzaamheid", "theme-klimaat"]` (both exist)  
**When** the linking endpoint is called  
**Then** the API returns HTTP 200 with message `"Project gekoppeld aan 2 thema's"`  
**And** exactly 2 hasTheme relations exist for the project

### AC-5: Empty theme_ids array is allowed

**Given** a valid project ID  
**And** `theme_ids` = `[]`  
**When** the linking endpoint is called  
**Then** all existing theme links are removed  
**And** the response confirms success (allowed behavior per [decision D17](../../THEME_SDG_IMPLEMENTATION_PLAN.md))

---

## Technical Notes

- **File**: [`projojo_backend/routes/theme_router.py:107-111`](../../../projojo_backend/routes/theme_router.py:107) and [`theme_repository.py:183-210`](../../../projojo_backend/domain/repositories/theme_repository.py:183)
- **Current behavior**: 
  - Non-existent theme IDs: TypeQL `match` returns no results, `insert` is a no-op — returns misleading success at [line 109](../../../projojo_backend/routes/theme_router.py:109)
  - Non-existent project ID: delete phase is no-op, insert phases are no-ops — returns misleading success
- **Implementation**: 
  1. Before linking, verify project exists via a simple match query
  2. Verify all theme_ids exist by fetching themes and comparing against the provided list
  3. Return clear error responses with the specific invalid IDs
- This task depends on [TS-task-005](TS-task-005-atomic-theme-linking.md) because existence validation should happen before the atomic write transaction
