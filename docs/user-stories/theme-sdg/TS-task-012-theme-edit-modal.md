# TS-task-012 — Theme Edit Modal for Teachers

**Phase**: 2 — UI Workflows  
**Priority**: 🔴 Critical  
**Type**: Functional Task  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §2A](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §2.1](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: [TS-task-010](TS-task-010-theme-management-list.md), [TS-task-011](TS-task-011-theme-create-modal.md) (reuse form component), [TS-task-004](TS-task-004-theme-input-validation.md) (backend validation)  

---

## Task Story

As a **docent** (teacher),  
I want to edit existing themes,  
so that I can update theme information, fix errors, or refine the catalog over time.

---

## Acceptance Criteria

### AC-1: Edit modal opens pre-filled

**Given** the teacher clicks "Bewerken" on a theme row  
**When** the edit modal opens  
**Then** all fields are pre-filled with the theme's current values (name, description, SDG code(s), icon, color)

### AC-2: SDG multi-select pre-selects existing codes

**Given** a theme with `sdg_code = "SDG2,SDG12"`  
**When** the edit modal opens  
**Then** both SDG2 and SDG12 are pre-selected in the multi-select dropdown

### AC-3: Successful update

**Given** the teacher modifies the theme name from "Duurzaamheid" to "Duurzame Ontwikkeling"  
**When** they click "Opslaan"  
**Then** the theme list updates to show the new name  
**And** the modal closes  
**And** a success confirmation is shown

### AC-4: Partial update supported

**Given** the teacher only changes the color field  
**When** they submit  
**Then** only the color is updated  
**And** all other fields retain their previous values

### AC-5: Validation errors on edit

**Given** the teacher clears the name field and submits  
**When** the API returns a 400 error  
**Then** the validation error is displayed in the modal  
**And** the modal stays open for correction

### AC-6: Rename to existing name blocked

**Given** themes "Duurzaamheid" and "Klimaat & Milieu" both exist  
**When** the teacher renames "Klimaat & Milieu" to "Duurzaamheid"  
**Then** the error "Er bestaat al een thema met deze naam" is displayed

### AC-7: Self-rename (no actual name change) succeeds

**Given** the teacher opens edit for "Duurzaamheid" and only changes the description  
**When** they submit with the name still "Duurzaamheid"  
**Then** the update succeeds without a uniqueness error

### AC-8: Cancel discards changes

**Given** the teacher has modified fields in the edit modal  
**When** they click "Annuleren" or close the modal  
**Then** no changes are saved  
**And** the theme list shows original values

---

## Technical Notes

- **Service call**: [`updateTheme(themeId, theme)`](../../../projojo_frontend/src/services.js:283) — already defined, currently unused
- **Reuse**: Same form layout as [TS-task-011](TS-task-011-theme-create-modal.md) create modal — extract a shared `ThemeForm` sub-component
- **Backend**: [`PUT /themes/{theme_id}`](../../../projojo_backend/routes/theme_router.py:48) with [`ThemeUpdate`](../../../projojo_backend/domain/models) model supports partial updates (only changed fields are sent)
- The [`ThemeRepository.update()`](../../../projojo_backend/domain/repositories/theme_repository.py:107) method already handles partial updates via conditional clause building
