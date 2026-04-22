# TS-004 — Add Input Validation on Theme CRUD

**Phase**: 1 — Backend & Data Integrity  
**Priority**: 🟠 Medium-High  
**Type**: Non-functional Story (Data Quality)  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §4.3](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §1.4](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: [TS-001](TS-001-theme-name-uniqueness.md) (name uniqueness check is part of validation)  

---

## User Story

As a **docent** (teacher),  
I want the platform to validate theme data before saving,  
so that invalid data cannot corrupt the theme catalog or break the UI.

---

## Acceptance Criteria

### AC-1: Name — required, 1–100 chars

**Given** a teacher creating or updating a theme  
**When** the name field is empty or exceeds 100 characters  
**Then** the API returns HTTP 400 with message `"Naam is verplicht en mag maximaal 100 tekens zijn"`

### AC-2: Name — whitespace-only rejected

**Given** a teacher creating a theme  
**When** the name field contains only whitespace (e.g. `"   "`)  
**Then** the API returns HTTP 400 with message `"Naam is verplicht en mag maximaal 100 tekens zijn"`

### AC-3: SDG code — valid format accepted

**Given** a teacher creating a theme with `sdg_code` = `"SDG12"`  
**When** the request is submitted  
**Then** the theme is created successfully with the sdg_code stored

### AC-4: SDG code — compound codes accepted

**Given** a teacher creating a theme with `sdg_code` = `"SDG1,SDG7"`  
**When** the request is submitted  
**Then** the theme is created with both SDG codes stored as a comma-separated string

### AC-5: SDG code — invalid format rejected

**Given** a teacher creating a theme with `sdg_code` = `"BANANA"` or `"SDG0"` or `"SDG18"`  
**When** the request is submitted  
**Then** the API returns HTTP 400 with message `"Ongeldig SDG-code formaat. Gebruik bijv. 'SDG1' of 'SDG12,SDG4'"`

### AC-6: SDG code — null/omitted accepted

**Given** a teacher creating a theme without specifying `sdg_code`  
**When** the request is submitted  
**Then** the theme is created with `sdg_code` = `null`

### AC-7: Color — valid hex accepted

**Given** a teacher setting color to `"#4CAF50"`  
**When** the request is submitted  
**Then** the theme is saved with the color value

### AC-8: Color — invalid format rejected

**Given** a teacher setting color to `"notacolor"` or `"#GGG"` or `"4CAF50"` (missing `#`)  
**When** the request is submitted  
**Then** the API returns HTTP 400 with message `"Ongeldige kleurcode. Gebruik hex-formaat zoals '#4CAF50'"`

### AC-9: Icon — max 50 chars

**Given** a teacher setting icon to a string longer than 50 characters  
**When** the request is submitted  
**Then** the API returns HTTP 400 with message `"Icoon naam mag maximaal 50 tekens zijn"`

### AC-10: Description — max 500 chars

**Given** a teacher setting description to a string longer than 500 characters  
**When** the request is submitted  
**Then** the API returns HTTP 400 with message `"Beschrijving mag maximaal 500 tekens zijn"`

### AC-11: Display order — non-negative integer

**Given** a teacher setting `display_order` to `-1`  
**When** the request is submitted  
**Then** the API returns HTTP 400 with message `"Sorteervolgorde moet een positief geheel getal zijn"`

### AC-12: Display order — zero accepted

**Given** a teacher setting `display_order` to `0`  
**When** the request is submitted  
**Then** the theme is saved with `display_order` = `0`

### AC-13: Validation applies to both create and update

**Given** the validation rules above  
**When** applied to both `POST /themes/` and `PUT /themes/{theme_id}`  
**Then** the same validation logic executes for both endpoints

### AC-14: All error messages in Dutch

**Given** any validation failure on any theme field  
**When** the error response is returned  
**Then** the error message is in Dutch (consistent with existing backend messages)

---

## Technical Notes

- **Validation function**: Create `validate_theme()` in [`projojo_backend/service/validation_service.py`](../../../projojo_backend/service/validation_service.py:28) following the existing [`is_valid_length()`](../../../projojo_backend/service/validation_service.py:28) pattern
- **SDG regex**: Each code must match `^SDG([1-9]|1[0-7])$`; compound codes must match `^SDG([1-9]|1[0-7])(,SDG([1-9]|1[0-7]))*$`
- **Color regex**: `^#[0-9A-Fa-f]{6}$`
- **Call from**: [`theme_router.py:40`](../../../projojo_backend/routes/theme_router.py:40) (create) and [`theme_router.py:50`](../../../projojo_backend/routes/theme_router.py:50) (update)
- Currently zero validation exists — compare with project/business/task routes that already call `is_valid_length()`
