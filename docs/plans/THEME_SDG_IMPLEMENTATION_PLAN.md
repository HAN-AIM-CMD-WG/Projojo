# Theme/SDG System — Implementation Plan

**Based on**: [`THEME_SDG_SYSTEM_AUDIT.md`](THEME_SDG_SYSTEM_AUDIT.md)  
**Date**: 16 April 2026  
**Approach**: Phased — integrity first, then UI workflows, then enhancements  

---

## Executive Summary

Convert the Theme/SDG system from "backend-complete, frontend-readonly, workflow-absent" to a fully functional feature across all three layers. Phase 1 hardens the backend (auth, validation, integrity). Phase 2 builds the missing management and linking UIs. Phase 3 adds SDG display, student interest matching, and documentation corrections.

---

## Phase 1 — Backend & Data Integrity

**Goal**: Fix all security, validation, and data-integrity issues before building UI on top.  
**Prerequisite**: Database reset after schema changes (`docker-compose down && docker-compose up -d --build`).

### 1.1 Schema: Add `@unique` to theme name

**File**: [`projojo_backend/db/schema.tql:62`](../projojo_backend/db/schema.tql:62)  
**Change**: `owns name @card(1)` → `owns name @card(1) @unique`  
**Seed data**: Verified — all 6 theme names are unique (Duurzaamheid, Klimaat & Milieu, Innovatie & Technologie, Voedselzekerheid, Water & Biodiversiteit, Kennisdeling).  
**Risk**: Low — requires DB reset but no data migration.

### 1.2 Fix project deletion cascade

**File**: [`projojo_backend/domain/repositories/project_repository.py:677`](../projojo_backend/domain/repositories/project_repository.py:677)  
**Change**: Add a `hasTheme` relation deletion step **before** the project entity deletion (step 7). Insert as a new step between step 6 (hasProjects) and step 7 (project deletion):

```python
# Step 6.5: Delete hasTheme relations
delete_themes = """
    match
        $project isa project, has id ~project_id;
        $hasTheme isa hasTheme(project: $project);
    delete
        $hasTheme isa hasTheme;
"""
```

**Why**: Without this, project deletion fails when `hasTheme` relations exist (TypeDB prevents deleting a role-player entity), or leaves orphaned relations.

### 1.3 Ownership enforcement on link endpoint

**File**: [`projojo_backend/routes/theme_router.py:87-112`](../projojo_backend/routes/theme_router.py:87)  
**Current behavior**: Any supervisor can modify themes on any project.  
**New behavior**:  
- **Supervisors**: Can only link themes to projects belonging to their own business. Verify ownership by checking that the supervisor's business owns the project (match the pattern used by project update routes with `@auth(role="supervisor", owner_id_key="project_id")`).  
- **Teachers**: Can link themes to ANY project (admin override). Role check `role == "teacher"` bypasses ownership verification.  
- **Students**: Blocked (existing behavior, keep as-is).

**Implementation approach**:
1. If `role == "teacher"` → allow, skip ownership check
2. If `role == "supervisor"` → verify project belongs to supervisor's business
3. Otherwise → 403

### 1.4 Input validation on theme CRUD

**Files**: [`projojo_backend/routes/theme_router.py:40-61`](../projojo_backend/routes/theme_router.py:40)  
**Language**: Validation error messages in **Dutch** (consistent with existing backend).

| Field | Rule | Error message |
|-------|------|---------------|
| `name` | Required, 1–100 chars | `"Naam is verplicht en mag maximaal 100 tekens zijn"` |
| `name` | Case-insensitive unique check before create | `"Er bestaat al een thema met deze naam"` |
| `sdg_code` | Optional. If present: comma-separated values, each matching `SDG[1-9]` or `SDG1[0-7]` | `"Ongeldig SDG-code formaat. Gebruik bijv. 'SDG1' of 'SDG12,SDG4'"` |
| `color` | Optional. If present: must match `^#[0-9A-Fa-f]{6}$` | `"Ongeldige kleurcode. Gebruik hex-formaat zoals '#4CAF50'"` |
| `icon` | Optional. Max 50 chars | `"Icoon naam mag maximaal 50 tekens zijn"` |
| `description` | Optional. Max 500 chars | `"Beschrijving mag maximaal 500 tekens zijn"` |
| `display_order` | Optional. Non-negative integer (≥ 0) | `"Sorteervolgorde moet een positief geheel getal zijn"` |

**Implementation**: Add a `validate_theme()` function in [`validation_service.py`](../projojo_backend/service/validation_service.py:28) following the existing `is_valid_length()` pattern. Call from both create and update routes.

### 1.5 Atomic project-theme linking

**File**: [`projojo_backend/domain/repositories/theme_repository.py:183-210`](../projojo_backend/domain/repositories/theme_repository.py:183)  
**Current behavior**: Deletes all existing links in one transaction, then inserts new links one-by-one in separate transactions.  
**New behavior**: Combine delete-all + insert-all into a **single write transaction**.  

```python
# Single transaction: delete old links, insert new links
combined_query = """
    match
        $project isa project, has id ~project_id;
    delete
        $hasTheme isa hasTheme(project: $project);
    insert
        ... (new hasTheme instances)
"""
```

If TypeDB doesn't support combined delete+insert in one query, wrap both operations in a single transaction context (begin → delete → insert → commit).

### 1.6 Narrow JWT middleware exclusion

**File**: [`projojo_backend/auth/jwt_middleware.py:25-26`](../projojo_backend/auth/jwt_middleware.py:25)  
**Current**: `/themes` and `/themes/*` exempt all methods.  
**New**: Only exempt `GET` requests to theme paths. Implementation options:
- Add method check in the middleware: if path matches `/themes*` AND method is not `GET`, do NOT skip middleware.
- Or replace wildcard with explicit public paths only.

### 1.7 Replace silent exception swallowing with logging

**Files**:
- [`theme_repository.py:150-153`](../projojo_backend/domain/repositories/theme_repository.py:150) (`delete()` method)
- [`theme_repository.py:193-196`](../projojo_backend/domain/repositories/theme_repository.py:193) (`link_project_to_themes()` method)

**Change**: Replace `except Exception: pass` with:
```python
except Exception as e:
    logger.warning(f"Theme operation warning: {e}")
```

Distinguish between "no relations to delete" (expected, debug-level) and actual failures (warning-level) where possible.

### 1.8 Validate theme/project existence in link endpoint

**File**: [`theme_repository.py:199-210`](../projojo_backend/domain/repositories/theme_repository.py:199)  
**Change**: Before returning success:
1. Verify `project_id` exists — return 404 if not
2. Verify all `theme_ids` exist — return 400 with list of invalid IDs if any don't exist
3. Return accurate count of actually linked themes

---

## Phase 2 — UI Workflows

**Goal**: Build the missing management UI, linking UI, and theme visibility across all views.  
**Prerequisite**: Phase 1 backend fixes must be deployed first.

### 2.1 Theme Management UI — `ThemeManagement.jsx`

**New component**: `projojo_frontend/src/components/ThemeManagement.jsx`  
**Embedded in**: [`TeacherPage.jsx`](../projojo_frontend/src/pages/TeacherPage.jsx) as a new section alongside `NewSkillsManagement`.

#### Layout: Sortable list/table
- Each row shows: color swatch, icon, theme name, SDG code(s), description (truncated), action buttons
- Action buttons per row: **Bewerken** (opens edit modal), **Verwijderen** (opens delete confirmation)
- **"+ Nieuw thema"** button above the list opens create modal

#### Create/Edit Modal form fields

| Field | Input type | Required | Notes |
|-------|-----------|----------|-------|
| Naam | Text input | ✅ Yes | Max 100 chars |
| Beschrijving | Textarea | No | Max 500 chars, char counter shown |
| SDG Code(s) | Multi-select dropdown | No | Options: SDG1–SDG17 with labels (e.g. "SDG1 — Geen armoede"). Stored as comma-separated string |
| Icoon | Predefined dropdown | No | ~90 relevant Material Symbols icons. Dropdown shows icon preview + name. Curated list of education/sustainability/nature/tech relevant icons |
| Kleur | Color picker | No | HTML `<input type="color">` with hex display |

- `displayOrder`: **Hidden from UI**. Auto-assigned: new themes get `max(existing displayOrder) + 1`.
- Edit modal pre-fills current values.
- Create modal starts empty.

#### Delete confirmation dialog
- Modal with warning: *"Weet je zeker dat je het thema '{name}' wilt verwijderen? Dit thema is gekoppeld aan {N} project(en). Deze koppelingen worden ook verwijderd."*
- Requires fetching linked project count before showing the dialog.
- Calls [`deleteTheme()`](../projojo_frontend/src/services.js:255).

#### Service wiring
- Wire up: [`createTheme()`](../projojo_frontend/src/services.js:230), [`updateTheme()`](../projojo_frontend/src/services.js:243), [`deleteTheme()`](../projojo_frontend/src/services.js:255), [`getThemes()`](../projojo_frontend/src/services.js:196).
- **New service needed**: `getThemeProjectCount(themeId)` — or extend `getThemes()` response to include project count per theme. Decide during implementation which is simpler.

### 2.2 Project-Theme Linking UI — `ThemePicker.jsx`

**New component**: `projojo_frontend/src/components/ThemePicker.jsx`  
**Reused in**: ProjectsAddPage, UpdateProjectPage, ProjectDetailsPage.

#### Interaction pattern: Chip/pill multi-select
- Fetch all themes via [`getThemes()`](../projojo_frontend/src/services.js:196)
- Display as clickable pills (similar to existing theme pills on [`PublicDiscoveryPage`](../projojo_frontend/src/pages/PublicDiscoveryPage.jsx:82))
- Each pill shows: color dot + theme name
- Selected pills are visually highlighted (filled background with theme color)
- No limit on number of themes per project
- On save: calls [`linkProjectThemes(projectId, themeIds)`](../projojo_frontend/src/services.js:267)

#### Integration points

**A. [`ProjectsAddPage.jsx`](../projojo_frontend/src/pages/ProjectsAddPage.jsx)**  
- Add `<ThemePicker>` section to the project creation form
- Selected themes are submitted after project creation (project must exist first for linking)
- Flow: create project → get project ID → link themes

**B. [`UpdateProjectPage.jsx`](../projojo_frontend/src/pages/UpdateProjectPage.jsx)**  
- Add `<ThemePicker>` section to the project edit form
- Pre-load current themes via [`getProjectThemes(projectId)`](../projojo_frontend/src/services.js:213)
- On save: link themes alongside other project updates

**C. [`ProjectDetailsPage.jsx`](../projojo_frontend/src/pages/ProjectDetailsPage.jsx)**  
- Show current themes as read-only pills (for all users)
- For project owners (supervisor of the project's business, or teacher): show inline edit button
- Inline edit: toggle `<ThemePicker>` into edit mode with save/cancel buttons
- Frontend confirmation when removing the last theme: *"Alle thema's worden verwijderd van dit project. Weet je het zeker?"*

### 2.3 Theme Visibility — Authenticated Views

#### A. [`ProjectCard.jsx`](../projojo_frontend/src/components/ProjectCard.jsx) — Add theme badges
- Match the pattern from [`PublicProjectCard.jsx:56-68`](../projojo_frontend/src/components/PublicProjectCard.jsx:56): show first theme as colored badge with icon, "+N" for additional themes.
- Theme data comes from the project object (provided by parent via `getBusinessesComplete()` after Phase 2.5 backend change).

#### B. [`ProjectDetailsPage.jsx`](../projojo_frontend/src/pages/ProjectDetailsPage.jsx) — Show themes section
- Display all themes as colored pills with icons
- Fetch via [`getProjectThemes(projectId)`](../projojo_frontend/src/services.js:213)
- Inline editable for owners (see 2.2C above)

#### C. Fix [`OverviewPage.jsx`](../projojo_frontend/src/pages/OverviewPage.jsx) — Remove public-only theme limitation
- **Current**: themes mapped from `getPublicProjects()` only via [`projectThemesMap`](../projojo_frontend/src/pages/OverviewPage.jsx:41)
- **New**: themes come directly from the enriched `getBusinessesComplete()` response (after Phase 2.5 backend change)
- Remove the `getPublicProjects()` call used solely for theme mapping
- Update theme filter logic to use themes from the business data directly

#### D. [`SupervisorDashboard.jsx`](../projojo_frontend/src/pages/SupervisorDashboard.jsx) — Add theme context
- Show theme pills on project cards/lists within the supervisor dashboard
- Theme data comes from whatever data source the dashboard already uses for projects

### 2.4 Backend: Add theme sub-query to `getBusinessesComplete()`

**File**: [`projojo_backend/domain/repositories/business_repository.py`](../projojo_backend/domain/repositories/business_repository.py)  
**Change**: Add a nested `hasTheme` sub-query to the `getBusinessesComplete()` query, matching the pattern already used in [`get_public_projects()`](../projojo_backend/domain/repositories/project_repository.py:103):

```tql
$hasTheme isa hasTheme(project: $project, theme: $theme);
$theme has id $themeId, has name $themeName, has icon $themeIcon, has color $themeColor;
```

Fetch `id`, `name`, `icon`, `color` per project-theme pair. Map into project response objects.

**Why combination approach**: `getBusinessesComplete()` for bulk views (OverviewPage, BusinessPage) — efficient, one call. `getProjectThemes()` for ProjectDetailsPage — precise, per-project.

---

## Phase 3 — Enhancements

**Goal**: Add SDG display, student interest matching, and correct documentation.  
**Prerequisite**: Phase 2 must be complete.

### 3.1 SDG Information Display

**Scope**: Wherever themes are displayed, show associated SDG information.

#### SDG Badge Component — `SdgBadge.jsx`

**New component**: `projojo_frontend/src/components/SdgBadge.jsx`

- Displays SDG number in a colored badge using the **official UN SDG color scheme**:

  | SDG | Color | Name (NL) |
  |-----|-------|-----------|
  | SDG1 | `#E5243B` | Geen armoede |
  | SDG2 | `#DDA63A` | Geen honger |
  | SDG3 | `#4C9F38` | Goede gezondheid en welzijn |
  | SDG4 | `#C5192D` | Kwaliteitsonderwijs |
  | SDG5 | `#FF3A21` | Gendergelijkheid |
  | SDG6 | `#26BDE2` | Schoon water en sanitair |
  | SDG7 | `#FCC30B` | Betaalbare en duurzame energie |
  | SDG8 | `#A21942` | Waardig werk en economische groei |
  | SDG9 | `#FD6925` | Industrie, innovatie en infrastructuur |
  | SDG10 | `#DD1367` | Ongelijkheid verminderen |
  | SDG11 | `#FD9D24` | Duurzame steden en gemeenschappen |
  | SDG12 | `#BF8B2E` | Verantwoorde consumptie en productie |
  | SDG13 | `#3F7E44` | Klimaatactie |
  | SDG14 | `#0A97D9` | Leven in het water |
  | SDG15 | `#56C02B` | Leven op het land |
  | SDG16 | `#00689D` | Vrede, justitie en sterke instellingen |
  | SDG17 | `#19486A` | Partnerschap om doelstellingen te bereiken |

- Badge shows: SDG number (e.g. "12") in the UN color
- Tooltip/hover: full SDG name in Dutch
- Click: links to `https://sdgs.un.org/goals/goal{N}` in new tab
- Supports compound codes (e.g. `SDG12,SDG4` → renders two badges)

#### Integration points
- Theme management list on TeacherPage: show SDG badges next to theme name
- ThemePicker: show SDG badge(s) inside theme pills
- PublicProjectCard / ProjectCard: show SDG badges alongside theme badges (optional, if space allows)
- ProjectDetailsPage: show SDG badges in theme section
- SDG multi-select in theme create/edit modal: show UN color preview per option

### 3.2 Student Theme/Interest Selection

#### Schema change

**File**: [`projojo_backend/db/schema.tql`](../projojo_backend/db/schema.tql)

Add new relation:
```tql
relation hasInterest,
    relates student @card(1),
    relates theme @card(1);
```

Update `student` entity to play the role:
```tql
entity student,
    ...existing attributes...,
    plays hasInterest:student @card(0..);
```

Update `theme` entity to play the role:
```tql
entity theme,
    ...existing attributes...,
    plays hasInterest:theme @card(0..);
```

#### Backend endpoints

**File**: New routes in student_router.py or theme_router.py

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/students/{student_id}/interests` | GET | Authenticated | Get student's theme interests |
| `/students/{student_id}/interests` | PUT | Student (self only) | Replace all interests with new list |

- PUT accepts `{ "theme_ids": ["theme-id-1", "theme-id-2"] }`
- Apply same atomic linking pattern as project-theme linking (single transaction)
- Validate all theme IDs exist before linking
- **Soft limit**: UI suggests max 5, but backend does not enforce a hard limit

#### Frontend: Interest selection on profile

**File**: [`projojo_frontend/src/pages/update_student_page/update_student_page.jsx`](../projojo_frontend/src/pages/update_student_page/update_student_page.jsx)

- Add a "Mijn interesses" section
- Reuse `<ThemePicker>` component from Phase 2.2
- Show UI hint: *"Kies de thema's die je interessant vindt (aanbevolen: max 5)"*
- On save: call new `/students/{id}/interests` PUT endpoint

#### Frontend: Interest summary on dashboard

**File**: [`projojo_frontend/src/pages/StudentDashboard.jsx`](../projojo_frontend/src/pages/StudentDashboard.jsx)

- Show selected interests as read-only theme pills in a "Mijn interesses" section
- Link to profile page to edit

#### Service functions

**File**: [`projojo_frontend/src/services.js`](../projojo_frontend/src/services.js)

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

### 3.3 Documentation Corrections

**Files to update**:
- [`docs/USER_STORIES_DOCENT.md`](USER_STORIES_DOCENT.md) — DOC-009: Update status from "✅ Geïmplementeerd" to "✅ Geïmplementeerd" (after Phase 2 completion), or to "⚠️ Backend API alleen — UI in ontwikkeling" during Phase 1/2.
- [`docs/GEBRUIKERSSCENARIOS_V1.md`](GEBRUIKERSSCENARIOS_V1.md) — "Thema's koppelen": same treatment.
- [`docs/ROADMAP.md`](ROADMAP.md) — "Thema's beheren": same treatment.
- After Phase 2 is fully deployed, all three can be marked as genuinely ✅ Geïmplementeerd.

---

## Explicitly Out of Scope

| Item | Reason |
|------|--------|
| Theme proposal workflow (supervisor proposes → teacher approves) | Feature complexity too high for current scope. Direct teacher CRUD is sufficient. |
| Theme statistics/reporting | Nice-to-have, no user story priority. |
| Error leak fix (`str(e)` → generic message) | Low risk in development context. |
| Student-theme matching algorithm integration | Requires matching system redesign. Student interest selection (3.2) is the prerequisite data layer. |
| Theme-based filtering on supervisor/student dashboards | Depends on dashboard-level filtering refactor beyond theme scope. |

---

## Execution Order & Dependencies

```
Phase 1 (Backend - can be done in parallel internally)
├── 1.1 Schema @unique ──────────────┐
├── 1.2 Delete cascade fix           │
├── 1.3 Auth ownership enforcement   ├── Requires DB reset after 1.1
├── 1.4 Input validation             │
├── 1.5 Atomic linking               │
├── 1.6 JWT middleware narrowing      │
├── 1.7 Exception logging            │
└── 1.8 Existence validation         ┘

Phase 2 (UI - sequential dependencies)
├── 2.4 Backend: themes in getBusinessesComplete() ← do first
├── 2.1 ThemeManagement component (TeacherPage)
├── 2.2 ThemePicker component (reusable)
│   ├── 2.2A ProjectsAddPage integration
│   ├── 2.2B UpdateProjectPage integration
│   └── 2.2C ProjectDetailsPage inline edit
└── 2.3 Theme visibility
    ├── 2.3A ProjectCard badges
    ├── 2.3B ProjectDetailsPage display
    ├── 2.3C OverviewPage fix
    └── 2.3D SupervisorDashboard

Phase 3 (Enhancements - after Phase 2 verified)
├── 3.1 SdgBadge component + integration
├── 3.2 Student interest selection (schema + backend + frontend)
└── 3.3 Documentation corrections
```

---

## Decision Log

| # | Decision | Options Considered | Chosen | Rationale |
|---|----------|--------------------|--------|-----------|
| D1 | Theme name uniqueness | Schema `@unique` / app-level check / both | Schema `@unique` + DB reset | Dev environment, regular resets. Seed data verified compliant. |
| D2 | Link endpoint authorization | Any supervisor / own projects only / two-tier | Supervisors own projects only, teachers any project | Matches project update pattern, prevents cross-business tampering. |
| D3 | Validation rules | Strict / moderate / minimal | Moderate with adjusted limits | sdgCode allows compound (SDG1,SDG7), description max 500, displayOrder 0-based. |
| D4 | Atomic linking | Separate transactions / single transaction | Single transaction | Prevents partial state on failure. |
| D5 | JWT middleware | Keep broad / narrow to GET / remove | Narrow to GET only | Reduces attack surface without breaking public reads. |
| D6 | Silent exceptions | Keep silent / log warning / raise error | Log warning | Visibility without disruption. |
| D7 | Theme management UI pattern | Cards / table-list / collapsible | Table/list + modal | Matches existing TeacherPage business management pattern. |
| D8 | Theme form fields | All fields / simplified / minimal | Simplified: hide displayOrder (auto-assign), predefined icon dropdown (~90 icons) | Reduces teacher cognitive load while maintaining flexibility. |
| D9 | Theme picker UX | Dropdown / chips / cards | Chip/pill multi-select, no limit | Visual, fast, matches existing theme pill design. |
| D10 | Where to link themes | Edit only / create+edit / create+edit+details | All three: create, edit, inline on details | Maximum flexibility for supervisors. |
| D11 | Theme visibility scope | Minimal / moderate / full | Full: ProjectCard, Details, OverviewPage fix, supervisor dashboard | Themes should be a first-class cross-cutting concept. |
| D12 | Backend data strategy | Sub-query everywhere / per-project everywhere / combination | Combination: sub-query for bulk, per-project for details | Efficiency for lists, precision for single views. |
| D13 | SDG display | Minimal text / badges / full UN style | Full UN style: colors, numbers, links | Educational platform should showcase SDG awareness. |
| D14 | Student interest selection | Separate entity / reuse theme / none | Reuse theme entity with `hasInterest` relation, soft limit 5 | Enables future matching, keeps schema simple. |
| D15 | Student interest UI placement | Profile only / dashboard only / both | Both: selection on profile, summary on dashboard | Edit where you manage, view where you work. |
| D16 | Delete confirmation | Simple / with project count / none | With project count warning | Prevents accidental data loss. |
| D17 | Empty theme array behavior | Allow / block | Allow, with frontend confirmation when removing last theme | Valid use case to clear all themes. |
| D18 | Validation message language | Dutch / English | Dutch | Consistent with existing backend. |
| D19 | Error leak fix | Fix now / defer | Defer (nice-to-have) | Low risk in development. |

---

*This plan is based on the [`THEME_SDG_SYSTEM_AUDIT.md`](THEME_SDG_SYSTEM_AUDIT.md) findings and discovery interview decisions recorded on 16 April 2026.*
