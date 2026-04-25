# TS-task-011 — Theme Create Modal for Teachers

**Phase**: 2 — UI Workflows  
**Priority**: 🔴 Critical  
**Type**: Functional Task  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §2A](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §2.1](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: [TS-task-010](TS-task-010-theme-management-list.md) (theme list must exist), [TS-task-001](TS-task-001-theme-name-uniqueness.md) + [TS-task-004](TS-task-004-theme-input-validation.md) (backend validation)  

---

## Task Story

As a **docent** (teacher),  
I want to create new themes via a form on my teacher page,  
so that I can expand the theme catalog beyond the initial seed data.

---

## Acceptance Criteria

### AC-1: Modal opens from "Nieuw thema" button

**Given** the teacher is viewing the "Thema's" section on TeacherPage  
**When** they click the "Nieuw thema" button  
**Then** a modal form opens with empty fields

### AC-2: Form contains correct fields

**Given** the create modal is open  
**When** the teacher views the form  
**Then** the following fields are visible:
- **Naam** — text input (required, indicated with *)
- **Beschrijving** — textarea with character counter (optional, max 500)
- **SDG Code(s)** — multi-select dropdown with SDG1–SDG17 options, each labeled (e.g. "SDG1 — Geen armoede")
- **Icoon** — dropdown of ~90 predefined Material Symbols icons with icon preview + name
- **Kleur** — color picker input with hex display

### AC-3: displayOrder auto-assigned

**Given** the teacher fills in the create form  
**When** they submit the form  
**Then** the `display_order` is automatically set to `max(existing displayOrder) + 1`  
**And** no display_order field is shown to the teacher

### AC-4: Successful creation

**Given** the teacher fills in at least the "Naam" field with valid data  
**When** they click "Opslaan" (Save)  
**Then** the new theme appears in the theme list  
**And** the modal closes  
**And** a success message is briefly shown

### AC-5: Validation errors displayed inline

**Given** the teacher submits with an empty name  
**When** the API returns a 400 error  
**Then** the error message is shown in the modal (e.g. "Naam is verplicht en mag maximaal 100 tekens zijn")  
**And** the modal stays open for correction

### AC-6: Duplicate name error

**Given** the teacher enters a name that already exists (e.g. "Duurzaamheid")  
**When** they submit  
**Then** the error "Er bestaat al een thema met deze naam" is displayed  
**And** the modal stays open

### AC-7: Cancel closes without saving

**Given** the teacher has partially filled in the create form  
**When** they click "Annuleren" (Cancel) or close the modal  
**Then** no theme is created  
**And** the form data is discarded

### AC-8: SDG multi-select stores comma-separated

**Given** the teacher selects SDG2 and SDG12 in the multi-select  
**When** they submit  
**Then** the `sdg_code` field is stored as `"SDG2,SDG12"`

### AC-9: Icon dropdown shows preview

**Given** the icon dropdown is open  
**When** the teacher scrolls through options  
**Then** each option shows the Material Symbols icon rendered alongside its name (e.g. 🌿 eco, 💡 lightbulb)

### AC-10: Color picker defaults and interaction

**Given** the color picker is displayed  
**When** the teacher interacts with it  
**Then** it uses an HTML `<input type="color">` or equivalent  
**And** the selected hex value (e.g. `#4CAF50`) is displayed alongside the picker

---

## Technical Notes

- **Component**: Part of `ThemeManagement.jsx` (from [TS-task-010](TS-task-010-theme-management-list.md)), using the existing [`Modal`](../../../projojo_frontend/src/components/Modal.jsx) component
- **Service call**: [`createTheme(theme)`](../../../projojo_frontend/src/services.js:270) — already defined, currently unused
- **Icon list**: Curate a list of ~90 relevant Material Symbols icons (sustainability, nature, education, technology, etc.). Store as a constant array
- **SDG options**: Static array of SDG1–SDG17 with Dutch labels
- Pattern matches existing create modals on TeacherPage (business creation modal at [TeacherPage.jsx:34](../../../projojo_frontend/src/pages/TeacherPage.jsx:34))
