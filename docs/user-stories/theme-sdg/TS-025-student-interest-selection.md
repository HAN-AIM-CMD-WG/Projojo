# TS-025 — Student Interest Selection UI on Profile

**Phase**: 3 — Enhancements  
**Priority**: 🟡 Medium  
**Type**: Functional Story  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §2G](../../THEME_SDG_SYSTEM_AUDIT.md), [GEBRUIKERSSCENARIOS_V2.md](../../GEBRUIKERSSCENARIOS_V2.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §3.2](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: [TS-024](TS-024-student-interest-backend.md) (backend must exist), [TS-014](TS-014-theme-picker-component.md) (reuse ThemePicker)  

---

## User Story

As a **student**,  
I want to select themes that interest me on my profile page,  
so that the platform can recommend matching projects and supervisors can see my thematic preferences.

---

## Acceptance Criteria

### AC-1: "Mijn interesses" section on profile page

**Given** a student navigates to their profile edit page  
**When** the page loads  
**Then** a "Mijn interesses" (My interests) section is visible  
**And** it contains the ThemePicker component

### AC-2: Current interests pre-selected

**Given** the student has previously selected "Duurzaamheid" and "Klimaat & Milieu"  
**When** the profile page loads  
**Then** those 2 themes are shown as selected in the ThemePicker

### AC-3: Soft limit hint shown

**Given** the ThemePicker is displayed in the interests section  
**When** the student views it  
**Then** a hint text says: *"Kies de thema's die je interessant vindt (aanbevolen: max 5)"*

### AC-4: More than 5 selections allowed

**Given** the student has already selected 5 themes  
**When** they select a 6th theme  
**Then** the 6th theme is selected without blocking  
**And** no error or hard limit is enforced

### AC-5: Save persists interests

**Given** the student modifies their theme selections  
**When** they save the profile  
**Then** the interests are saved via `PUT /students/{student_id}/interests`  
**And** a success confirmation is shown

### AC-6: No interests selected is valid

**Given** the student deselects all themes  
**When** they save  
**Then** all interests are cleared  
**And** no error is shown

### AC-7: Section only visible to students viewing own profile

**Given** a supervisor viewing a student's profile page  
**When** the page loads  
**Then** the "Mijn interesses" section is either hidden or shown in read-only mode  
**And** no edit capability is available

### AC-8: Loading state for interests

**Given** the student's current interests are being fetched  
**When** the API call is in progress  
**Then** the ThemePicker shows a loading state

---

## Technical Notes

- **File**: [`projojo_frontend/src/pages/update_student_page/update_student_page.jsx`](../../../projojo_frontend/src/pages/update_student_page/update_student_page.jsx)
- **Component**: Reuse `<ThemePicker initialSelected={interestIds} onChange={...}>` from [TS-014](TS-014-theme-picker-component.md)
- **New service functions** in [`projojo_frontend/src/services.js`](../../../projojo_frontend/src/services.js):
  ```javascript
  function getStudentInterests(studentId) {
      return fetchWithError(`${API_BASE_URL}students/${studentId}/interests`);
  }
  function updateStudentInterests(studentId, themeIds) {
      return fetchWithError(`${API_BASE_URL}students/${studentId}/interests`, {
          method: "PUT",
          body: JSON.stringify({ theme_ids: themeIds }),
      }, true);
  }
  ```
- The student profile page already handles skills and other profile data — interests are an additional section alongside existing content
