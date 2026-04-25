# TS-task-024 — Student Interest Schema and Backend Endpoints

**Phase**: 3 — Enhancements  
**Priority**: 🟡 Medium  
**Type**: Technical Task  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §2G](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §3.2](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: [TS-task-001](TS-task-001-theme-name-uniqueness.md) (schema must include @unique before adding new relation), [TS-task-005](TS-task-005-atomic-theme-linking.md) (atomic linking pattern to reuse)  

---

## Task Story

As a **student**,  
I want the platform to store my theme interests,  
so that I can later receive project recommendations matching my thematic preferences.

---

## Acceptance Criteria

### AC-1: Schema includes hasInterest relation

**Given** the TypeDB schema  
**When** the schema is applied  
**Then** a `hasInterest` relation exists with roles `student @card(1)` and `theme @card(1)`  
**And** the `student` entity plays `hasInterest:student @card(0..)`  
**And** the `theme` entity plays `hasInterest:theme @card(0..)`

### AC-2: GET endpoint returns student interests

**Given** a student with interests in "Duurzaamheid" and "Klimaat & Milieu"  
**When** `GET /students/{student_id}/interests` is called  
**Then** the response contains an array of 2 theme objects (id, name, icon, color, sdg_code)

### AC-3: GET endpoint returns empty array for no interests

**Given** a student with no selected interests  
**When** `GET /students/{student_id}/interests` is called  
**Then** the response is an empty array `[]`

### AC-4: PUT endpoint replaces all interests

**Given** a student currently interested in themes A and B  
**When** `PUT /students/{student_id}/interests` is called with `{"theme_ids": ["theme-c", "theme-d"]}`  
**Then** the student is now interested in C and D only  
**And** interests A and B are removed

### AC-5: PUT endpoint with empty array clears interests

**Given** a student with interests  
**When** `PUT /students/{student_id}/interests` is called with `{"theme_ids": []}`  
**Then** all interests are removed

### AC-6: PUT validates theme IDs exist

**Given** `theme_ids` includes a non-existent ID  
**When** the PUT endpoint is called  
**Then** the API returns HTTP 400 listing the invalid ID(s)  
**And** no interests are modified

### AC-7: Only student themselves can update interests

**Given** student A  
**When** student B calls `PUT /students/{student_A_id}/interests`  
**Then** the API returns HTTP 403

### AC-8: Supervisors and teachers can view interests

**Given** any authenticated user  
**When** they call `GET /students/{student_id}/interests`  
**Then** the interests are returned (reading interests is not restricted)

### AC-9: Atomic linking

**Given** the interest update operation  
**When** delete-old + insert-new happens  
**Then** it uses a single transaction (matching [TS-task-005](TS-task-005-atomic-theme-linking.md) pattern)

### AC-10: No hard limit on interests

**Given** a student selecting 7 themes  
**When** the PUT endpoint is called with 7 theme IDs  
**Then** all 7 interests are saved (soft limit of 5 is UI-only)

---

## Technical Notes

- **Schema changes** in [`projojo_backend/db/schema.tql`](../../../projojo_backend/db/schema.tql):
  ```tql
  relation hasInterest,
      relates student @card(1),
      relates theme @card(1);
  ```
  Add to student entity: `plays hasInterest:student @card(0..);`  
  Add to theme entity: `plays hasInterest:theme @card(0..);`
- **New endpoints**: Add to [`projojo_backend/routes/student_router.py`](../../../projojo_backend/routes/student_router.py) or create new routes in theme_router.py:
  - `GET /students/{student_id}/interests`
  - `PUT /students/{student_id}/interests`
- **Repository**: Create `get_student_interests()` and `update_student_interests()` methods, reusing the atomic linking pattern from [`ThemeRepository.link_project_to_themes()`](../../../projojo_backend/domain/repositories/theme_repository.py:183) (after [TS-task-005](TS-task-005-atomic-theme-linking.md) fixes)
- **Auth**: PUT requires `student` role with self-ownership check (student_id in JWT must match URL student_id)
- **Requires DB reset** for schema change
