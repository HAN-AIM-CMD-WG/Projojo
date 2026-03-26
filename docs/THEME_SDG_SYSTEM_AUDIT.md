# Theme/SDG System Audit — Product, Architecture & Implementation Review

**Date**: 23 March 2026
**Branch**: `next-ui`
**Scope**: Full-stack audit of the Theme/SDG feature across TypeDB schema, backend (FastAPI/Python), and frontend (React)
**Method**: Code-backed analysis starting from existing business rules and branch analysis docs, then validating against the actual implementation across all layers

---

## Overall Verdict

**Verdict: The Theme/SDG System is a structurally sound but severely incomplete feature. It has a reasonable backend and schema, but the most important parts — the management UI and the project-linking UI — were never built. What exists is a read-only filtering system over seed data, presented as if it's a fully managed feature. There are also multiple confirmed authorization, integrity, and validation gaps in the backend that does exist.**

The system can best be described as **"backend-complete, frontend-readonly, workflow-absent."** Teachers cannot create, edit, or delete themes through the UI despite [`DOC-009`](USER_STORIES_DOCENT.md) marking this as ✅ Geïmplementeerd. Supervisors cannot link themes to projects through any UI despite [`GEBRUIKERSSCENARIOS_V1.md`](GEBRUIKERSSCENARIOS_V1.md) claiming "Thema's koppelen ✅ Geïmplementeerd." The six seed themes from [`seed.tql`](../projojo_backend/db/seed.tql:1664) and their hardcoded project-theme links are all that exist in practice.

The read-only part — theme-based filtering on the public discovery page, the overview page, and the landing page — works correctly for the data it receives. But this filtering only applies to **public** projects, creating a gap where authenticated users on the OverviewPage can only filter by theme on projects that happen to be public, not all projects they have access to.

The backend has real CRUD endpoints and a real project-theme linking API, but they suffer from: missing ownership enforcement on the link endpoint, no input validation on any theme field, no theme name uniqueness, a non-atomic link operation, and a confirmed orphan-relation bug during project hard deletion. The JWT middleware bypass for `/themes/*` is broad but not directly exploitable because route-level auth still applies where needed.

### Quality Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Product quality | 3/10 | Filtering works, but the core workflows (create/manage/link themes) have no UI at all. Docs overstate what is implemented. |
| Architecture quality | 6/10 | Clean entity model, separate repository, sensible relation design. The hasTheme relation per project-theme pair is correct. |
| Implementation quality | 4/10 | Backend CRUD and read logic works, but authorization, validation, atomicity, and cascade deletion are all deficient. |
| Business-rule coherence | 3/10 | The intended rules (teacher governs themes, supervisors link projects, public filters by theme) are reasonable but almost none are fully enforced or fully buildable through the UI. |

---

## Table of Contents

- [1. Implemented Feature Set](#1-implemented-feature-set)
- [2. Feature Completeness — Expected but Missing](#2-feature-completeness--expected-but-missing)
- [3. Interactions with Existing App Functionality](#3-interactions-with-existing-app-functionality)
- [4. Implementation Correctness](#4-implementation-correctness)
- [5. Implementation Robustness](#5-implementation-robustness)
- [6. Database and Schema Integration](#6-database-and-schema-integration)
- [7. Documentation vs Implementation Mismatches](#7-documentation-vs-implementation-mismatches)
- [8. Confirmed, Likely, and Open Questions](#8-confirmed-likely-and-open-questions)
- [9. Recommendations](#9-recommendations)

---

## 1. Implemented Feature Set

### A. Theme entity and schema

The `theme` entity is defined in [`schema.tql:60-68`](../projojo_backend/db/schema.tql:60):

```tql
entity theme,
    owns id @key,
    owns name @card(1),
    owns sdgCode @card(0..1),
    owns icon @card(0..1),
    owns themeDescription @card(0..1),
    owns color @card(0..1),
    owns displayOrder @card(0..1),
    plays hasTheme:theme @card(0..);
```

The `hasTheme` relation is defined at [`schema.tql:158-160`](../projojo_backend/db/schema.tql:158):

```tql
relation hasTheme,
    relates project @card(1),
    relates theme @card(1);
```

### B. Seed data: 6 themes with 22 project-theme links

Six themes are seeded in [`seed.tql:1664-1716`](../projojo_backend/db/seed.tql:1664): Duurzaamheid (SDG12), Klimaat & Milieu (SDG13), Innovatie & Technologie (SDG9), Voedselzekerheid (SDG2), Water & Biodiversiteit (SDG14), and Kennisdeling (SDG4). Each has an id, name, sdgCode, icon, description, color, and displayOrder.

Twenty-two `hasTheme` relations link these themes to projects across [`seed.tql:1718-1731`](../projojo_backend/db/seed.tql:1718), [`seed.tql:1880-1885`](../projojo_backend/db/seed.tql:1880), and [`seed.tql:2035-2041`](../projojo_backend/db/seed.tql:2035).

### C. Backend CRUD (complete, teacher-only for writes)

[`theme_router.py`](../projojo_backend/routes/theme_router.py:10) provides:
- `GET /themes/` — public, returns all themes sorted by [`display_order` and `name`](../projojo_backend/domain/repositories/theme_repository.py:54)
- `GET /themes/{theme_id}` — public, returns single theme
- `POST /themes/` — teacher-only via [`@auth(role="teacher")`](../projojo_backend/routes/theme_router.py:39)
- `PUT /themes/{theme_id}` — teacher-only via [`@auth(role="teacher")`](../projojo_backend/routes/theme_router.py:49)
- `DELETE /themes/{theme_id}` — teacher-only, cascades by [first deleting `hasTheme` relations](../projojo_backend/domain/repositories/theme_repository.py:141)

### D. Project-theme linking endpoint (exists, unprotected)

[`PUT /themes/project/{project_id}`](../projojo_backend/routes/theme_router.py:87) replaces all theme links for a project. Uses [`Depends(get_token_payload)`](../projojo_backend/routes/theme_router.py:91) with manual role check — blocks students, allows supervisors and teachers. The code comment at [`theme_router.py:102`](../projojo_backend/routes/theme_router.py:102) explicitly acknowledges: *"Note: For full authorization, we'd need to check project ownership / For now, allow all supervisors and teachers."*

### E. Public projects include themes

[`get_public_projects()`](../projojo_backend/domain/repositories/project_repository.py:73) includes a nested theme sub-query at [`project_repository.py:103-112`](../projojo_backend/domain/repositories/project_repository.py:103) that fetches `id`, `name`, `icon`, and `color` for each project's themes.

### F. Frontend: read-only theme filtering (3 pages)

Themes are consumed for **read-only filtering** in:
- [`PublicDiscoveryPage.jsx`](../projojo_frontend/src/pages/PublicDiscoveryPage.jsx:44) — calls [`getThemes()`](../projojo_frontend/src/services.js:196) and [`getPublicProjects()`](../projojo_frontend/src/services.js:180), renders theme pills for filtering
- [`OverviewPage.jsx`](../projojo_frontend/src/pages/OverviewPage.jsx:24) — calls both `getBusinessesComplete()` AND `getPublicProjects()`, maps themes from public projects onto the authenticated business data via [`projectThemesMap`](../projojo_frontend/src/pages/OverviewPage.jsx:41)
- [`DiscoverySection.jsx`](../projojo_frontend/src/components/DiscoverySection.jsx:26) (embedded in LandingPage) — same pattern as PublicDiscoveryPage

### G. Theme display on project cards

[`PublicProjectCard.jsx:56-68`](../projojo_frontend/src/components/PublicProjectCard.jsx:56) shows the first theme as a colored badge with icon on the project card, plus a `+N` count for additional themes.

### H. Frontend service functions (complete but mostly unused)

[`services.js`](../projojo_frontend/src/services.js:192) defines:
- `getThemes()` — **used** (3 pages)
- `getProjectThemes(projectId)` — **never called** from any component
- `createTheme(theme)` — **never called**
- `updateTheme(themeId, theme)` — **never called**
- `deleteTheme(themeId)` — **never called**
- `linkProjectThemes(projectId, themeIds)` — **never called**

---

## 2. Feature Completeness — Expected but Missing

### What a reasonable user would expect from a Theme/SDG System

A Theme/SDG System in an educational project management platform should allow: teachers to govern the theme catalog, supervisors to tag their projects with themes, students and public visitors to discover projects by theme, and the platform to use themes for matching and reporting.

### Expected-but-missing subfeatures

| # | Missing Feature | Severity | Evidence / Reasoning |
|---|----------------|----------|---------------------|
| A | **No theme management UI for teachers** | 🔴 Critical product gap | [`createTheme()`](../projojo_frontend/src/services.js:230), [`updateTheme()`](../projojo_frontend/src/services.js:243), [`deleteTheme()`](../projojo_frontend/src/services.js:255) are defined but never called. [`TeacherPage.jsx`](../projojo_frontend/src/pages/TeacherPage.jsx) has no theme section — only business management, invite links, and (via other components) skills management. |
| B | **No project-theme linking UI for supervisors** | 🔴 Critical product gap | [`linkProjectThemes()`](../projojo_frontend/src/services.js:267) is defined but never called. [`ProjectDetailsPage.jsx`](../projojo_frontend/src/pages/ProjectDetailsPage.jsx), [`ProjectsAddPage.jsx`](../projojo_frontend/src/pages/ProjectsAddPage.jsx), [`UpdateProjectPage.jsx`](../projojo_frontend/src/pages/UpdateProjectPage.jsx) contain zero theme references. Supervisors have no way to attach or modify themes on their projects. |
| C | **No theme display in authenticated project views** | 🟠 Medium-High | [`ProjectCard.jsx`](../projojo_frontend/src/components/ProjectCard.jsx) has zero theme references. Projects in the supervisor dashboard, project details page, and business page show no theme information at all. Themes are only visible on the public discovery views. |
| D | **No per-project theme display on project details** | 🟠 Medium-High | Neither [`ProjectDetailsPage.jsx`](../projojo_frontend/src/pages/ProjectDetailsPage.jsx) nor any project detail component shows which themes a project belongs to. [`getProjectThemes()`](../projojo_frontend/src/services.js:213) exists in services but is never called. |
| E | **No theme-based student matching or recommendations** | 🟡 Medium | Skills have a matching algorithm ([`GEBRUIKERSSCENARIOS_V2.md`](GEBRUIKERSSCENARIOS_V2.md) distinguishes skills as "hard filter" and themes/interests as "soft filter"), but themes have no matching integration at all. |
| F | **No theme suggestion/proposal workflow from supervisors** | 🟡 Medium | [`DOC-009`](USER_STORIES_DOCENT.md) acceptatiecriteria includes "Thema voorstellen van organisaties goedkeuren" (approve theme proposals from organizations), but there is no proposal flow — only direct teacher CRUD. |
| G | **No student interest/theme selection** | 🟡 Medium | [`GEBRUIKERSSCENARIOS_V2.md`](GEBRUIKERSSCENARIOS_V2.md) describes students choosing up to 5 themes/interests, with the note "Interesses/thema's kies je zelf (max 5)." No such feature exists in the student profile or schema. |
| H | **No theme statistics or reporting** | 🟢 Low-Medium | No dashboard shows theme distribution, popular themes, or theme-based analytics. |
| I | **No SDG information display** | 🟢 Low-Medium | The `sdgCode` field exists in the schema and seed data, but no frontend view displays SDG codes, SDG names, or links to SDG goals. The SDG dimension is invisible to users. |

---

## 3. Interactions with Existing App Functionality

### Coherent interactions

| Interaction | Assessment |
|-------------|------------|
| Public discovery → theme filtering | ✅ Well-implemented. [`PublicDiscoveryPage.jsx`](../projojo_frontend/src/pages/PublicDiscoveryPage.jsx:82) filters `p.themes?.some(t => t.id === selectedTheme)` correctly. Theme pills show counts of matching projects. Zero-count themes are hidden. |
| Public project cards → theme badges | ✅ Working. [`PublicProjectCard.jsx:56-68`](../projojo_frontend/src/components/PublicProjectCard.jsx:56) renders first theme with color and icon, with "+N" for additional themes. |
| Theme deletion → cascade cleanup | ✅ Present. [`ThemeRepository.delete()`](../projojo_backend/domain/repositories/theme_repository.py:141) removes all `hasTheme` relations before deleting the theme. |
| Landing page → discovery section themes | ✅ Working. [`DiscoverySection.jsx:26`](../projojo_frontend/src/components/DiscoverySection.jsx:26) loads themes alongside public projects. |

### Weak or conflicting interactions

#### A. 🔴 Project hard deletion does NOT clean up hasTheme relations

The [`delete_project()`](../projojo_backend/domain/repositories/project_repository.py:677) method has 7 deletion steps: registrations → requiresSkill → containsTask → tasks → creates → hasProjects → project. **`hasTheme` relations are not deleted in any step.**

**Evidence:** Full method at [`project_repository.py:677-766`](../projojo_backend/domain/repositories/project_repository.py:677) — no mention of `hasTheme` anywhere.

**Why it matters:**
- *Technical impact:* The project deletion will likely **fail** at step 7 because TypeDB may prevent deleting an entity that is still a role player in a `hasTheme` relation. If TypeDB allows the deletion anyway, orphaned `hasTheme` instances pointing to a non-existent project remain in the database.
- *User-facing impact:* Teachers attempting to hard-delete a project with theme links will get an error.

**Severity:** 🔴 High

**Recommendation:** Add a step before the final project deletion:
```python
delete_themes = """
    match
        $project isa project, has id ~project_id;
        $hasTheme isa hasTheme(project: $project);
    delete
        $hasTheme isa hasTheme;
"""
```

#### B. 🟠 OverviewPage themes only work for public projects

[`OverviewPage.jsx:24`](../projojo_frontend/src/pages/OverviewPage.jsx:24) fetches three data sources: `getBusinessesComplete()`, `getThemes()`, and `getPublicProjects()`. Themes are only available via public projects. The mapping at [`OverviewPage.jsx:41-44`](../projojo_frontend/src/pages/OverviewPage.jsx:41) builds `projectThemesMap` from public projects only.

**Why it matters:**
- *User-facing impact:* If a project has themes but is NOT public (`isPublic = false`), authenticated users see **no themes** on that project in the overview. The theme filter excludes these projects even though the user has full access.
- *Technical impact:* The `getBusinessesComplete()` endpoint in [`business_repository.py`](../projojo_backend/domain/repositories/business_repository.py) does not include `hasTheme` sub-queries — confirmed by zero hits searching for `theme` in that file.

**Severity:** 🟠 Medium-High

**Recommendation:** Either add theme sub-queries to `getBusinessesComplete()` or fetch themes per-project independently.

#### C. 🟡 Filter component receives themes externally but has no self-fetching

[`Filter.jsx:146`](../projojo_frontend/src/components/Filter.jsx:146) receives `themes` as a prop. The filter works correctly for theme pills, counts, and selection callbacks. But it depends entirely on the parent page to provide theme data, and the parent pages only source themes from public projects data.

**Severity:** 🟢 Low — reasonable component design, but limited by parent data sourcing.

#### D. 🟡 Theme filtering not available on supervisor or student dashboards

Neither [`SupervisorDashboard.jsx`](../projojo_frontend/src/pages/SupervisorDashboard.jsx) nor [`StudentDashboard.jsx`](../projojo_frontend/src/pages/StudentDashboard.jsx) reference themes at all. Dashboards show no theme context for active tasks or projects.

**Severity:** 🟡 Medium — reduces the cross-cutting value of themes.

---

## 4. Implementation Correctness

### 4.1 🔴 High — Missing ownership enforcement on project-theme linking

**Evidence:** [`link_project_themes()`](../projojo_backend/routes/theme_router.py:87) at lines 97-105:

```python
role = payload.get("role")
if role == "student":
    raise HTTPException(status_code=403, detail="Studenten kunnen geen thema's koppelen")
# Note: For full authorization, we'd need to check project ownership
# For now, allow all supervisors and teachers
if role not in ["supervisor", "teacher"]:
    raise HTTPException(status_code=403, detail="Onvoldoende rechten")
```

Any authenticated supervisor can modify themes on **any** project across **any** business. Contrast this with project update endpoints that use `@auth(role="supervisor", owner_id_key="project_id")` for ownership verification.

**Why it matters:**
- *User-facing impact:* Supervisor from Business A can change theme tags on Business B's project, distorting discovery and filtering.
- *Technical impact:* No audit trail of who changed theme links.

**Recommendation:** Use `@auth(role="supervisor", owner_id_key="project_id")` or explicitly verify the acting supervisor owns the project's business.

### 4.2 🔴 High — No theme name uniqueness enforcement

**Evidence:** The schema at [`schema.tql:62`](../projojo_backend/db/schema.tql:62) declares `name @card(1)` but **NOT** `@unique`. Compare with skill entity at [`schema.tql:84`](../projojo_backend/db/schema.tql:84) which has `name @card(1) @unique`. The [`ThemeRepository.create()`](../projojo_backend/domain/repositories/theme_repository.py:73) method has no duplicate-name check before insertion.

**Why it matters:**
- *User-facing impact:* Two themes named "Duurzaamheid" can coexist, making filtering unreliable and the theme catalog messy.
- *Technical impact:* No enforcement at schema or application level.

**Recommendation:** Either add `@unique` to the schema's `name` attribute on `theme`, or add a case-insensitive name check in `create()` matching the pattern used by [`SkillRepository.get_by_name_case_insensitive()`](../projojo_backend/domain/repositories/skill_repository.py:51).

### 4.3 🟠 Medium-High — No input validation on any theme field

**Evidence:** [`theme_router.py:40-45`](../projojo_backend/routes/theme_router.py:40) (create) and [`theme_router.py:50-61`](../projojo_backend/routes/theme_router.py:50) (update) pass the request body directly to the repository with no validation. Compare with project/business/task routes that call [`is_valid_length()`](../projojo_backend/service/validation_service.py:28).

Missing validations:
- **Theme name:** No length limit (could be empty string, 10000 chars, etc.)
- **SDG code:** No format constraint (`sdg_code` should be "SDG1" to "SDG17" or null, but accepts any string like "BANANA")
- **Color:** No hex-color format validation (accepts any string like "notacolor")
- **Icon:** No validation against valid Material Symbols icon names
- **Description:** No length limit
- **Display order:** No range validation (negative numbers, extreme values accepted)

**Why it matters:**
- *User-facing impact:* Invalid data can break UI rendering (bad colors, bad icons) and corrupt the theme catalog.
- *Technical impact:* No defense against malformed data.

**Recommendation:** Add validation matching other entities: `is_valid_length(name, 100)`, `is_valid_length(description, 2000)`, and optionally validate sdgCode format and color hex pattern.

### 4.4 🟠 Medium-High — Non-atomic project-theme linking

**Evidence:** [`link_project_to_themes()`](../projojo_backend/domain/repositories/theme_repository.py:183) first deletes all existing links in one transaction, then inserts new links **one-by-one** in separate transactions:

```python
# First remove existing theme links (one transaction)
Db.write_transact(delete_query, {"project_id": project_id})
# Then add new theme links (N separate transactions)
for theme_id in theme_ids:
    Db.write_transact(insert_query, {...})
```

**Why it matters:**
- *Technical impact:* If the process fails after deleting old links but before inserting all new ones, the project is left in a partially linked state with some or no themes. The original theme links are already destroyed.
- *User-facing impact:* A transient error could silently remove themes from a project.

**Recommendation:** Combine delete and insert into a single write transaction, or at minimum catch errors and report partial failure.

### 4.5 🟡 Medium — JWT middleware bypass for all /themes/* paths is overly broad

**Evidence:** [`jwt_middleware.py:25-26`](../projojo_backend/auth/jwt_middleware.py:25):
```python
"/themes",  # List all themes (public)
"/themes/*",  # Get specific theme (public for GET)
```

This exempts ALL paths under `/themes/` from JWT validation, including write endpoints (`POST /themes/`, `PUT /themes/{id}`, `DELETE /themes/{id}`) and the linking endpoint (`PUT /themes/project/{project_id}`).

**Mitigating factor:** The `@auth(role="teacher")` decorator on CRUD routes and `Depends(get_token_payload)` on the link route both independently validate the JWT token. So requests without valid tokens still fail at the route level.

**Why it matters:**
- *Technical impact:* The middleware's role is to set `request.state.user_role`, `request.state.user_id`, etc. When bypassed, these are `None`. The `@auth` decorator handles this by doing its own token validation, but relying on two independent validation paths is fragile and creates inconsistency with how other protected routes work.

**Recommendation:** Narrow the exclusion to only `GET` methods, or remove the wildcard and list only the specific public GET paths (`"/themes"`, `"/themes/project/*"` for GET only).

### 4.6 🟡 Medium — Delete errors silently swallowed in multiple places

**Evidence:**
- [`ThemeRepository.delete()`](../projojo_backend/domain/repositories/theme_repository.py:150): `except Exception: pass` — if deleting hasTheme relations fails, it proceeds to delete the theme, potentially leaving orphan relations or failing.
- [`link_project_to_themes()`](../projojo_backend/domain/repositories/theme_repository.py:193): `except Exception: pass` — if deleting old links fails, new links are added on top, potentially creating duplicates.

**Recommendation:** Log exceptions at minimum, and consider whether silent failure is the intended behavior. In `delete()`, the "no relations to delete" case is legitimate, but other failures should be surfaced.

---

## 5. Implementation Robustness

### Null and empty-state handling

| Area | Assessment |
|------|------------|
| Theme with no optional fields | ✅ Handled — [`_map_to_model()`](../projojo_backend/domain/repositories/theme_repository.py:56) uses `list[0] if list else None` for all optional fields. |
| Public projects with no themes | ✅ Handled — [`PublicProjectCard.jsx:56`](../projojo_frontend/src/components/PublicProjectCard.jsx:56) conditionally renders `project.themes && project.themes.length > 0`. |
| Theme filter with no matching projects | ✅ Handled — [`PublicDiscoveryPage.jsx:291`](../projojo_frontend/src/pages/PublicDiscoveryPage.jsx:291) hides theme pills with zero count. |
| Empty theme list | ✅ Handled — [`OverviewPage.jsx:35`](../projojo_frontend/src/pages/OverviewPage.jsx:35) gracefully defaults to `[]`. |
| Create theme with all-null optional fields | ⚠️ Potentially problematic — [`ThemeRepository.create()`](../projojo_backend/domain/repositories/theme_repository.py:76) inserts `None` values directly via `write_transact()`. The `build_query()` function with `allow_none=True` removes clauses for `None` params, which is correct, but this depends on the implementation of `build_query()`. |

### Robustness issues

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| A | **No theme ID validation in link endpoint** | 🟡 Medium | [`link_project_to_themes()`](../projojo_backend/domain/repositories/theme_repository.py:199) inserts links by matching theme IDs. If a non-existent theme ID is passed, the TypeQL `match` clause returns no results and the `insert` is a no-op — but no error is returned. The caller receives a success message `"Project gekoppeld aan N thema's"` even if some theme IDs were invalid. |
| B | **No project existence check in link endpoint** | 🟡 Medium | [`link_project_themes()`](../projojo_backend/routes/theme_router.py:107) catches all exceptions as `400` errors. If the project ID doesn't exist, the delete phase is a no-op and the insert phases are no-ops, resulting in a misleading success response. |
| C | **Error message leaks exception details** | 🟢 Low | [`theme_router.py:111`](../projojo_backend/routes/theme_router.py:111): `detail=str(e)` — internal exception messages are returned to the client verbatim. |
| D | **Empty theme_ids array silently removes all links** | 🟡 Medium | Calling `PUT /themes/project/{project_id}` with `theme_ids=[]` will execute the delete query (removing all existing links) and then loop zero times (adding nothing). This silently unlinks all themes from a project. This may be intentional "clear all themes" behavior, but there's no confirmation or doc. |

---

## 6. Database and Schema Integration

### Strengths

- Theme entity has a clean `id @key` with UUID-based IDs
- Optional fields use `@card(0..1)` correctly
- `hasTheme` relation is properly structured with `project @card(1)` and `theme @card(1)`, supporting many-to-many through multiple instances
- Theme can participate in unlimited relations via `plays hasTheme:theme @card(0..)`
- Seed data is comprehensive: 6 themes with SDG codes, icons, colors, descriptions, and display ordering
- Seed data links themes to projects across different businesses (SmartFarm, City Deal, Arnhem datasets)

### Weaknesses

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| A | **No `@unique` constraint on theme name** | 🔴 High | Unlike [`skill` at `schema.tql:84`](../projojo_backend/db/schema.tql:84) which has `name @card(1) @unique`, the `theme` entity has only `name @card(1)`. Duplicate theme names can be created at the database level. |
| B | **No attribute type reuse for name/description** | 🟢 Low | Theme uses `themeDescription` as a distinct attribute type ([`schema.tql:208`](../projojo_backend/db/schema.tql:208)) instead of reusing `description`. This is a naming inconsistency rather than a functional issue, but it means `attribute description value string` and `attribute themeDescription value string` are separate types. |
| C | **`displayOrder` is globally unique attribute type** | 🟢 Low | [`attribute displayOrder value integer`](../projojo_backend/db/schema.tql:210) is only used by themes. If another entity needs display ordering in the future, the attribute can be shared, but the name suggests theme-specific semantics. |
| D | **Seed theme IDs are human-readable strings, not UUIDs** | 🟢 Low | Themes use `"theme-duurzaamheid"` style IDs in seed data, while the [`create()` method](../projojo_backend/domain/repositories/theme_repository.py:74) uses `generate_uuid()` for new themes. Mixed ID formats may cause confusion. |
| E | **No migration concern for existing databases** | 🟢 Low | Since themes are a new entity type, they don't conflict with existing data. A database reset/reseed is required to introduce theme seed data but no field migrations are needed. |

### Performance considerations

The `get_public_projects()` query at [`project_repository.py:75-115`](../projojo_backend/domain/repositories/project_repository.py:75) includes a nested theme sub-query per project. With a small theme catalog (6 themes) and moderate project count, this is acceptable. If the theme catalog or project count grows significantly, the nested query pattern could become a bottleneck.

---

## 7. Documentation vs Implementation Mismatches

| # | Mismatch | Docs say | Code does |
|---|----------|----------|-----------|
| A | **Theme management is "Geïmplementeerd"** | [`DOC-009`](USER_STORIES_DOCENT.md) (Thema's beheren): acceptatiecriteria marked ✅ for "Thema's aanmaken", "Thema's bewerken", "Thema's verwijderen". Status: **Geïmplementeerd**. | Backend API exists. **No UI exists.** Teachers have no way to create, edit, or delete themes through the application. [`TeacherPage.jsx`](../projojo_frontend/src/pages/TeacherPage.jsx) has zero theme management code. |
| B | **Theme linking documented as "Geïmplementeerd"** | [`GEBRUIKERSSCENARIOS_V1.md`](GEBRUIKERSSCENARIOS_V1.md) Feature Matrix: "Thema's koppelen ✅" for Organisatie. [`ROADMAP.md`](ROADMAP.md): "Thema's beheren (aanmaken, bewerken, koppelen aan SDG's) ✅". | Backend API exists. **No UI exists.** No project form contains theme selection. [`linkProjectThemes()`](../projojo_frontend/src/services.js:267) is never called. |
| C | **O-007 describes theme governance as "partially consistent"** | [`BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md`](BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md) O-007: "governance exists in ... theme_router.py, but theme project-linking lacks ownership verification" | Correct assessment of the backend state, but understates the severity: there is NO frontend for any write operation, not just a missing ownership check. |
| D | **I-005 flags theme endpoints as "less protected"** | [`BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md`](BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md) I-005: "Theme/skill governance endpoints appear less protected than core domain operations" | Partially correct. Theme CRUD is teacher-only (`@auth(role="teacher")`), which matches skill protection. But `link_project_themes` has no ownership enforcement, which is worse than skill routes. |
| E | **NEXT-UI-BRANCH-ANALYSIS lists themes as "Full CRUD"** | [`NEXT-UI-BRANCH-ANALYSIS.md:147`](NEXT-UI-BRANCH-ANALYSIS.md): "Full CRUD for themes/SDGs, project-theme linking" | Backend is full CRUD. Frontend is read-only. The description is accurate for backend but misleads about the full-stack state. |
| F | **User stories expect theme proposals from organizations** | [`DOC-009`](USER_STORIES_DOCENT.md) acceptatiecriteria: "Thema voorstellen van organisaties goedkeuren" | No proposal/review workflow exists. Only direct teacher CRUD via API. |
| G | **User scenarios expect student theme/interest selection** | [`GEBRUIKERSSCENARIOS_V2.md`](GEBRUIKERSSCENARIOS_V2.md): "Interesses/thema's kies je zelf (max 5)" | No student-theme relationship exists in schema. No UI for student theme selection. |

---

## 8. Confirmed, Likely, and Open Questions

### Confirmed problems

| Severity | Problem | Evidence |
|----------|---------|----------|
| 🔴 Critical product gap | Theme management UI does not exist — teachers cannot create, edit, or delete themes | Zero calls to `createTheme()`, `updateTheme()`, `deleteTheme()` in any `.jsx` file |
| 🔴 Critical product gap | Project-theme linking UI does not exist — supervisors cannot assign themes to projects | Zero calls to `linkProjectThemes()` in any `.jsx` file; zero theme references in `ProjectDetailsPage.jsx`, `ProjectsAddPage.jsx`, `UpdateProjectPage.jsx` |
| 🔴 High integrity bug | Project hard deletion does not clean up `hasTheme` relations | [`delete_project()`](../projojo_backend/domain/repositories/project_repository.py:677) — no hasTheme deletion in 7-step cascade |
| 🔴 High auth gap | Any supervisor can link themes to any project (no ownership check) | [`theme_router.py:102`](../projojo_backend/routes/theme_router.py:102) — explicit code comment acknowledges the gap |
| 🔴 High data quality | No theme name uniqueness at schema or application level | [`schema.tql:62`](../projojo_backend/db/schema.tql:62) — `name @card(1)` without `@unique`; no duplicate check in `create()` |
| 🟠 Medium-High | Themes only available for public projects in authenticated views | [`OverviewPage.jsx:41-44`](../projojo_frontend/src/pages/OverviewPage.jsx:41) — themes mapped from `getPublicProjects()` only |
| 🟠 Medium-High | No input validation on any theme field | [`theme_router.py:40-61`](../projojo_backend/routes/theme_router.py:40) — no `is_valid_length()` or format checks |
| 🟠 Medium-High | Non-atomic project-theme linking (delete-then-insert in separate transactions) | [`theme_repository.py:183-210`](../projojo_backend/domain/repositories/theme_repository.py:183) |
| 🟡 Medium | JWT middleware bypass for `/themes/*` applies to all methods | [`jwt_middleware.py:25-26`](../projojo_backend/auth/jwt_middleware.py:25) — mitigated by route-level auth |
| 🟡 Medium | Documentation marks theme features as ✅ Implemented despite no UI | [`DOC-009`](USER_STORIES_DOCENT.md), [`GEBRUIKERSSCENARIOS_V1.md`](GEBRUIKERSSCENARIOS_V1.md), [`ROADMAP.md`](ROADMAP.md) |
| 🟡 Medium | Error silently swallowed in delete and link operations | [`theme_repository.py:150-153`](../projojo_backend/domain/repositories/theme_repository.py:150) and [`theme_repository.py:193-196`](../projojo_backend/domain/repositories/theme_repository.py:193) |
| 🟡 Medium | Empty `theme_ids` array silently removes all project themes | [`theme_repository.py:185-196`](../projojo_backend/domain/repositories/theme_repository.py:185) |
| 🟡 Medium | Invalid theme IDs silently ignored during linking | [`theme_repository.py:199-210`](../projojo_backend/domain/repositories/theme_repository.py:199) — returns success even if theme IDs don't exist |

### Likely problems

- Project deletion fails when the project has theme links, because the `hasTheme` relation's `project @card(1)` constraint prevents deletion of the entity while it's a role player
- After partial `link_project_to_themes` failure, a project may have no themes (old ones deleted but new ones not inserted)
- `getProjectThemes()` in services.js exists but is dead code that will never be cleared unless someone explicitly removes it

### Open questions

- Whether TypeDB 3.x allows deleting an entity that is a role player in a relation with `@card(1)` constraint, or whether it raises an error — this determines whether hasTheme orphans or deletion failures are the result
- Whether the intent is for themes to eventually apply to non-public projects, or whether themes are intentionally a public-discovery-only concept
- Whether the six seed themes are meant to be the complete set or merely starting data for a teacher-managed catalog
- Whether the `displayOrder` field is meant to be globally unique (no two themes with the same order) or merely a sort hint

---

## 9. Recommendations

### Highest priority (blocking product functionality)

1. **Build the theme management UI on TeacherPage**
   - Add a "Thema's" section to [`TeacherPage.jsx`](../projojo_frontend/src/pages/TeacherPage.jsx) with create/edit/delete capabilities, matching the existing skill management pattern.
   - Wire up [`createTheme()`](../projojo_frontend/src/services.js:230), [`updateTheme()`](../projojo_frontend/src/services.js:243), [`deleteTheme()`](../projojo_frontend/src/services.js:255) to the new UI.

2. **Build the project-theme linking UI**
   - Add theme selection to project create/edit forms in [`ProjectsAddPage.jsx`](../projojo_frontend/src/pages/ProjectsAddPage.jsx) and [`UpdateProjectPage.jsx`](../projojo_frontend/src/pages/UpdateProjectPage.jsx).
   - Show current themes on [`ProjectDetailsPage.jsx`](../projojo_frontend/src/pages/ProjectDetailsPage.jsx) with edit capability for owners.
   - Wire up [`linkProjectThemes()`](../projojo_frontend/src/services.js:267) and [`getProjectThemes()`](../projojo_frontend/src/services.js:213).

3. **Fix project deletion cascade to include hasTheme cleanup**
   - Add `hasTheme` relation deletion in [`delete_project()`](../projojo_backend/domain/repositories/project_repository.py:677) before the project entity deletion step.

### High priority (security and data integrity)

4. **Add ownership enforcement on link endpoint**
   - Replace the manual role check in [`link_project_themes()`](../projojo_backend/routes/theme_router.py:87) with `@auth(role="supervisor", owner_id_key="project_id")` or an explicit ownership check matching the pattern used by project update routes.

5. **Add theme name uniqueness**
   - Add `@unique` to `name` on the `theme` entity in [`schema.tql`](../projojo_backend/db/schema.tql:62), or add a case-insensitive duplicate check in [`create()`](../projojo_backend/domain/repositories/theme_repository.py:73).

6. **Add input validation on theme CRUD**
   - Validate `name` length (1–100 chars), `description` length (0–2000 chars), `sdg_code` format (optional, must match `/^SDG[1-9][0-7]?$/`), `color` format (optional, must be valid hex like `#RRGGBB`), and `display_order` range (optional, must be positive integer).

### Medium priority (correctness and consistency)

7. **Make link operation atomic**
   - Combine the delete-all and insert-all in [`link_project_to_themes()`](../projojo_backend/domain/repositories/theme_repository.py:183) into a single write transaction.

8. **Validate theme and project existence in link endpoint**
   - Before confirming success, check that all `theme_ids` exist and that `project_id` exists. Return clear error messages for invalid IDs.

9. **Include themes in authenticated project data**
   - Add theme sub-queries to the `getBusinessesComplete()` endpoint, or add a separate theme-fetching step for project details, so that themes appear in authenticated views and non-public projects.

10. **Narrow JWT middleware theme exclusion**
    - Replace the broad `/themes/*` exclusion with specific public paths: `"/themes"` (GET list), `"/themes/project/*"` (GET project themes). Or handle method-level exclusion in the middleware.

### Lower priority (docs, cleanup, product enhancements)

11. **Correct documentation**
    - Update [`DOC-009`](USER_STORIES_DOCENT.md), [`GEBRUIKERSSCENARIOS_V1.md`](GEBRUIKERSSCENARIOS_V1.md), and [`ROADMAP.md`](ROADMAP.md) to mark theme management and linking as "Backend API alleen — UI mist" rather than ✅ Geïmplementeerd.

12. **Log or surface swallowed exceptions**
    - Replace `except Exception: pass` in [`theme_repository.py`](../projojo_backend/domain/repositories/theme_repository.py:150) with at least a `logger.warning()` call.

13. **Consider SDG display**
    - Show SDG codes and descriptions in theme-related UI to convey the SDG dimension, which is currently invisible despite being stored.

14. **Consider student theme/interest matching**
    - Add a `hasInterest` relation between students and themes to enable theme-based matching and recommendations, as described in [`GEBRUIKERSSCENARIOS_V2.md`](GEBRUIKERSSCENARIOS_V2.md).

---

*This audit is based on direct code evidence from the `next-ui` branch and the referenced documentation, with confirmed findings grounded in the cited source files.*
