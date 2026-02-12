# next-ui Branch Analysis Report

**Date**: 12 Feb 2026
**Based on**: Commit [`44bb8ae`](https://github.com/HAN-AIM-CMD-WG/Projojo/commit/44bb8ae72682c56dcb78ef3d585c5da02ee0f6af) (9 Feb 2026)
**Compared**: `main` → `next-ui` ([full diff](https://github.com/HAN-AIM-CMD-WG/Projojo/compare/a2233942c30cfa4d4b7f8167677f26e0398fc530...44bb8ae72682c56dcb78ef3d585c5da02ee0f6af))
**Purpose**: Identify which changes are purely visual/styling vs. business logic/features, to enable a safe partial merge of UI-only changes first.

---

## Executive Summary

The `next-ui` branch contains **massive changes** across both frontend and backend. It is NOT a simple UI refresh — it introduces several entirely new feature systems (themes/SDGs, portfolio, tasks, notifications, discovery/landing page, map integration) alongside genuine styling improvements. The changes are deeply intertwined in many files, making a clean split challenging but not impossible.

**Recommendation**: Cherry-pick or manually extract the pure CSS/styling changes and component visual updates. Do NOT merge the branch wholesale if you only want styling.

---

## 🎨 CATEGORY 1: Pure Styling / UI Changes (Safe to Merge)

These changes are purely visual and have no impact on business logic or data flow. **Verified by source code review.**

### CSS / Design System

| File                                                          | Change                                                                                                                            | Risk    |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `projojo_frontend/src/index.css`                              | Major neumorphic design system overhaul — new CSS variables, shadow definitions, button styles, animation classes, dark mode prep | ✅ Safe |
| `projojo_frontend/src/DESIGN_SYSTEM.md`                       | New documentation file for design system                                                                                          | ✅ Safe |
| `design-planning/technical-specs/neumorphic-design-system.md` | Design spec documentation                                                                                                         | ✅ Safe |
| `.prettierrc`                                                 | Code formatting config                                                                                                            | ✅ Safe |

### Visual-Only Component Updates

These components received **styling-only** changes (CSS classes, layout, visual presentation) without new data dependencies:

| File                                                 | Nature of Change                   | Risk    |
| ---------------------------------------------------- | ---------------------------------- | ------- |
| `projojo_frontend/src/components/Alert.jsx`          | Styling update                     | ✅ Safe |
| `projojo_frontend/src/components/DragDrop.jsx`       | Visual refinement                  | ✅ Safe |
| `projojo_frontend/src/components/Footer.jsx`         | New component, visual only         | ✅ Safe |
| `projojo_frontend/src/components/LoadingSpinner.jsx` | New loading animation component    | ✅ Safe |
| `projojo_frontend/src/components/Breadcrumb.jsx`     | New navigation breadcrumb (visual) | ✅ Safe |

### Context Providers (No Backend Dependencies)

| File                                                  | What it does                                                                                                                                                                                                                        | Risk    |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `projojo_frontend/src/context/ThemeContext.jsx` (NEW) | **Dark mode / accessibility theme provider.** Uses only `localStorage` and `window.matchMedia`. Zero API calls. Provides `theme`, `toggleDarkMode()`, `isHighContrast`, etc. **Note: this is NOT the SDG themes — confusing name.** | ✅ Safe |

### Documentation (Non-Code)

| File                                       | Description          |
| ------------------------------------------ | -------------------- |
| `docs/ECOSYSTEEM_STRATEGIE.md`             | Strategy doc         |
| `docs/GEBRUIKERSSCENARIOS_V1.md` / `V2.md` | User scenarios       |
| `docs/ROADMAP.md`                          | Roadmap              |
| `docs/USER_STORIES_*.md` (6 files)         | User stories         |
| `AGENTS.md`                                | AI coding guidelines |
| `README.md`                                | Updated readme       |

### Frontend Dependencies (Safe)

| Dependency                        | Purpose                       | Risk                             |
| --------------------------------- | ----------------------------- | -------------------------------- |
| `leaflet` (NEW)                   | Map library for OpenStreetMap | ✅ Safe — see Map analysis below |
| `react-leaflet` (NEW)             | React wrapper for Leaflet     | ✅ Safe                          |
| `react-leaflet-cluster` (NEW)     | Map marker clustering         | ✅ Safe                          |
| `@types/node` (REMOVED)           | TypeScript types cleanup      | ✅ Safe                          |
| `prettier` (REMOVED from devDeps) | Moved to project root         | ✅ Safe                          |

> **Leaflet verdict**: The map components (`LocationMap.jsx`, `OverviewMap.jsx`) use the **existing `location` field** on businesses (already in `main` branch). Geocoding is done client-side via the free Nominatim/OpenStreetMap API. **No new backend endpoints or schema fields needed.** These dependencies are safe for the UI-only merge.

---

## ⚠️ CATEGORY 2: Needs Review Before Merge (Frontend-Only, But Verify)

These files are **frontend-only** and don't require new backend endpoints to function, OR they gracefully handle missing endpoints. They should be reviewed to confirm they work correctly with the existing `main` backend.

### New Pages (Frontend-Only or Gracefully Degrading)

| File                                | What it does                                                        | Backend dependency                                                                                                                                                                                                        | Verdict                                                                                      |
| ----------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **`LandingPage.jsx`** (NEW)         | Public landing page, replaces `/` route. Embeds `DiscoverySection`. | The page itself has **zero API calls**. However, it embeds `DiscoverySection` which calls `GET /projects/public` and `GET /themes/` — both are **new endpoints**. On failure, DiscoverySection returns `null` (graceful). | ⚠️ **Review**: Page works but discovery section will be empty without backend. Acceptable? |
| **`StudentDashboard.jsx`** (NEW)    | Role-based student dashboard at `/home`                             | Calls `GET /users/{userId}` and `GET /projects/` — both **exist on main**. Also uses `StudentSkillsContext` and `StudentWorkContext`.                                                                                     | ⚠️ **Review**: Uses existing endpoints but contexts may reference new response fields      |
| **`SupervisorDashboard.jsx`** (NEW) | Role-based supervisor dashboard at `/home`                          | Calls `GET /users/{userId}` and `GET /projects/` — both **exist on main**.                                                                                                                                                | ⚠️ **Review**: Uses existing endpoints, check for new field references                     |
| **`DesignDemoPage.jsx`** (NEW)      | Design system showcase/demo page                                    | **Zero API calls.** Purely visual demo of CSS classes and components.                                                                                                                                                     | ✅ Safe to merge after quick visual check                                                    |
| **`PublicDiscoveryPage.jsx`** (NEW) | Public project discovery page                                       | Wraps `DiscoverySection` which calls **new endpoints** (`GET /projects/public`, `GET /themes/`). Gracefully handles errors.                                                                                               | ⚠️ **Review**: Will show empty/error state without backend                                 |

### New Components (Frontend-Only or Gracefully Degrading)

| File                                         | What it does                                   | Backend dependency                                                                                                                                                              | Verdict                                                                                                    |
| -------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **`DiscoverySection.jsx`** (NEW, +383 lines) | Project discovery with search/filter by themes | Calls `GET /projects/public` and `GET /themes/` — both **new endpoints**. On error, returns `null`.                                                                             | ⚠️ **Review**: Gracefully fails, but will be non-functional without backend. Worth merging as dead code? |
| **`Map/LocationMap.jsx`** (NEW)              | Single-location map using Leaflet              | Uses **existing `location` field** from businesses. Geocodes via Nominatim (client-side). **No new backend needed.**                                                            | ✅ Safe after visual check                                                                                 |
| **`Map/OverviewMap.jsx`** (NEW)              | Multi-marker clustered map                     | Same as LocationMap — uses **existing data**. Client-side geocoding.                                                                                                            | ✅ Safe after visual check                                                                                 |
| **`FilterChip.jsx`** (NEW)                   | Visual filter chip component                   | Pure presentational component, no API calls.                                                                                                                                    | ✅ Safe                                                                                                    |
| **`NewSkillsManagement.jsx`** (NEW)          | Skills management CRUD interface               | Calls `GET /skills/`, `POST /skills/`, `PUT /skills/{id}`, `DELETE /skills/{id}` — these endpoints **already exist on `main`** via `skill_router.py`. Uses existing skill CRUD. | ⚠️ **Review**: Uses existing endpoints but verify the request/response format hasn't changed             |

### Context Providers & Hooks (With Backend Dependencies)

| File                                 | API Endpoints Called  | Exists on main?     | Failure behavior                                          | Verdict                                                                               |
| ------------------------------------ | --------------------- | ------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **`StudentSkillsContext.jsx`** (NEW) | `GET /users/{userId}` | ✅ Yes              | Graceful — sets empty skills array on error               | ⚠️ **Review**: May expect new fields in user response (e.g., `skills` array format) |
| **`StudentWorkContext.jsx`** (NEW)   | `GET /projects/`      | ✅ Yes              | Graceful — sets empty arrays on error                     | ⚠️ **Review**: May expect new fields in project response                            |
| **`useThemes.js`** (NEW)             | `GET /themes/`        | ❌ **New endpoint** | Graceful — returns empty array on error, `loading: false` | ⚠️ **Review**: Will return no data without backend, but won't crash                 |

### Routing Changes (`App.jsx`, +250 lines)

| Change                                                                                              | Impact                                   | Verdict                                                                                         |
| --------------------------------------------------------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `/` → `LandingPage` instead of `LoginPage`                                                          | UX change — users see landing page first | ⚠️ **Review**: Is this the desired UX for main?                                               |
| `/login` → `LoginPage` (new explicit route)                                                         | Login moved to dedicated route           | ⚠️ **Review**: All login links must point to `/login` now                                     |
| `/home` → `HomePage` (role-based: StudentDashboard or SupervisorDashboard)                          | Replaces `OverviewPage` at `/home`       | ⚠️ **Review**: Verify dashboards work with existing backend                                   |
| `/ontdek` → `OverviewPage`                                                                          | Old `/home` content moved here           | ⚠️ **Review**: Route rename                                                                   |
| `/discovery` → `PublicDiscoveryPage`                                                                | New public route                         | ⚠️ **Review**: Works but empty without new backend                                            |
| `/design-demo` → `DesignDemoPage`                                                                   | New demo route                           | ✅ Safe — visual only                                                                           |
| `InvitePage` removed                                                                                | Feature removal                          | ⚠️ **Review**: Is invite feature still needed?                                                |
| New context providers wrapping app: `ThemeProvider`, `StudentSkillsProvider`, `StudentWorkProvider` | State architecture change                | ⚠️ **Review**: ThemeProvider is safe. Skills/Work providers call existing endpoints on mount. |

### Existing Components with Mixed Changes

| File                                       | Styling Changes          | Logic Changes                                     | Verdict                                                          |
| ------------------------------------------ | ------------------------ | ------------------------------------------------- | ---------------------------------------------------------------- |
| `BusinessCard.jsx` (+358 lines)            | Neumorphic card redesign | Displays map (existing data), may show new fields | ⚠️ **Review**: Check for new field references                  |
| `Filter.jsx` (+568 lines)                  | Visual overhaul          | New filter logic, possibly theme-based filtering  | ⚠️ **Review**: Check if new filters depend on new backend data |
| `AddProjectForm.jsx` (+187 lines)          | Form styling             | Possibly new form fields (themes/SDGs?)           | ⚠️ **Review**: Check for new fields that need backend support  |
| `CreateBusinessEmail.jsx` (+46 lines)      | Styling                  | Possible logic changes                            | ⚠️ **Review**                                                  |
| `BusinessProjectDashboard.jsx` (+39 lines) | Layout changes           | Dashboard logic                                   | ⚠️ **Review**                                                  |
| `Navbar.jsx`                               | Visual redesign          | New navigation links to new pages                 | ⚠️ **Review**: Ensure links point to valid routes              |
| `ProjectCard.jsx`                          | Card styling             | New data fields displayed                         | ⚠️ **Review**                                                  |
| `SkillTag.jsx`                             | Visual update            | Possible new skill data handling                  | ⚠️ **Review**                                                  |
| `OverviewPage.jsx`                         | Layout/visual refresh    | Possibly new data fetching                        | ⚠️ **Review**                                                  |
| `ProjectsAddPage.jsx`                      | Form styling             | New fields (themes?)                              | ⚠️ **Review**                                                  |
| `UpdateBusinessPage.jsx`                   | Form styling             | New fields                                        | ⚠️ **Review**                                                  |
| `TeacherPage.jsx`                          | Page styling             | New management features                           | ⚠️ **Review**                                                  |
| `StudentPage.jsx`                          | Profile styling          | New data display                                  | ⚠️ **Review**                                                  |

---

## 🔴 CATEGORY 3: Backend / Infrastructure Changes (Do NOT Merge for UI-only)

These changes affect the backend, database schema, authentication, or infrastructure. They must NOT be included in a UI-only merge.

### New Backend Features

| Area                     | Files                                                                                                    | Feature                                          | Impact                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------- |
| **Theme/SDG System**     | `theme.py`, `theme_repository.py`, `theme_router.py`                                                     | Full CRUD for themes/SDGs, project-theme linking | 🔴 New entity, new schema, new routes |
| **Portfolio System**     | `portfolio_repository.py` (NEW, +401 lines)                                                              | Student portfolio management                     | 🔴 New feature                        |
| **Task System**          | `task.py` (NEW), `task_repository.py` (NEW, +437), `task_router.py` (NEW, +354), `task_service.py` (NEW) | Full task management with status tracking        | 🔴 New feature                        |
| **Notification Service** | `notification_service.py` (NEW, +276)                                                                    | Notification system                              | 🔴 New feature                        |
| **Email Service**        | `email_service.py` (NEW)                                                                                 | Email sending capability                         | 🔴 New feature                        |
| **Image Service**        | `image_service.py` (NEW)                                                                                 | Image upload/management                          | 🔴 New feature                        |

### Backend Schema Changes (`schema.tql`, `seed.tql`)

| Change                                     | Impact                      |
| ------------------------------------------ | --------------------------- |
| New `theme` entity with SDG fields         | 🔴 Schema migration needed |
| New `task` entity                          | 🔴 Schema migration needed |
| New relations for themes, tasks, portfolio | 🔴 Schema migration needed |
| Modified seed data                         | 🔴 Data changes            |

### Backend Model/Repository Changes

| File                                          | Impact                  |
| --------------------------------------------- | ----------------------- |
| `project.py` model — new fields               | 🔴 API contract change |
| `business.py` model — new fields              | 🔴 API contract change |
| `user.py` model — changes                     | 🔴 API contract change |
| `skill.py` model — rewritten                  | 🔴 API contract change |
| `project_repository.py` (+532 lines)          | 🔴 Major query changes |
| `business_repository.py` (+212 lines)         | 🔴 Query changes       |
| `skill_repository.py` (+167 lines, rewritten) | 🔴 Breaking changes    |
| `user_repository.py` (+162 lines, rewritten)  | 🔴 Breaking changes    |
| `invite_repository.py` — changes              | 🔴 Logic changes       |

### Backend Auth/Config Changes

| File                           | Impact                  |
| ------------------------------ | ----------------------- |
| `permissions.py` — modified    | 🔴 Authorization logic |
| `jwt_utils.py` — modified      | 🔴 Auth token handling |
| `jwt_middleware.py` — modified | 🔴 Auth middleware     |
| `oauth_config.py` — modified   | 🔴 OAuth settings      |
| `config/settings.py` — DELETED | 🔴 Config restructure  |

### Infrastructure Changes

| File                                         | Impact                     |
| -------------------------------------------- | -------------------------- |
| `docker-compose.yml` — modified              | 🔴 Container config       |
| `projojo_backend/Dockerfile` — modified      | 🔴 Build changes          |
| `projojo_frontend/Dockerfile` — modified     | 🔴 Build changes          |
| `docker-compose.base.yml` — DELETED          | 🔴 Infra restructure      |
| `docker-compose.preview.yml` — DELETED       | 🔴 Infra restructure      |
| `.env.example` — moved to `projojo_backend/` | 🔴 Config location change |

---

## 📋 Recommended Merge Strategy

### Phase 1: Safe to merge now (UI/Styling only) — No review needed

1. `projojo_frontend/src/index.css` — Design system CSS
2. `projojo_frontend/src/DESIGN_SYSTEM.md` — Documentation
3. `design-planning/technical-specs/neumorphic-design-system.md` — Spec docs
4. `.prettierrc` — Formatting config
5. `AGENTS.md` — AI guidelines
6. All `docs/*.md` files — Documentation
7. `projojo_frontend/src/components/LoadingSpinner.jsx` — Visual component
8. `projojo_frontend/src/components/Footer.jsx` — Visual component
9. `projojo_frontend/src/components/Breadcrumb.jsx` — Visual component
10. `projojo_frontend/src/components/Alert.jsx` — Styling fix
11. `projojo_frontend/src/components/DragDrop.jsx` — Visual refinement
12. `projojo_frontend/src/context/ThemeContext.jsx` — Dark mode provider (no API calls)
13. `projojo_frontend/src/components/FilterChip.jsx` — Pure presentational
14. Leaflet dependencies in `package.json` — No backend needed
15. `projojo_frontend/src/components/Map/LocationMap.jsx` — Uses existing data
16. `projojo_frontend/src/components/Map/OverviewMap.jsx` — Uses existing data

### Phase 2: Frontend changes that need a quick review

These are frontend-only changes that should work with the existing backend, but need verification:

- **New pages**: `DesignDemoPage`, `StudentDashboard`, `SupervisorDashboard`, `LandingPage`
- **New components**: `DiscoverySection` (gracefully fails without new backend), `NewSkillsManagement` (uses existing skill endpoints)
- **Context providers**: `StudentSkillsContext`, `StudentWorkContext` (use existing endpoints, graceful error handling)
- **Hook**: `useThemes.js` (calls new endpoint but gracefully returns empty)
- **Routing changes in `App.jsx`**: Verify all routes point to valid pages, check UX flow
- **Mixed components**: BusinessCard, Filter, Navbar, ProjectCard, etc. — extract styling vs. logic

### Phase 3: Backend & infrastructure (requires full team review)

- All backend changes (routes, models, repositories, services)
- Database schema changes
- Auth/config changes
- Docker/infrastructure changes

---

## ⚠️ Key Risks

1. **Deeply intertwined changes**: Many components have styling AND logic changes in the same lines
2. **Backend breaking changes**: Repositories are rewritten, not just extended
3. **Schema migrations**: New entities require database reset/migration
4. **Route restructuring**: The entire navigation flow has changed (but frontend-only)
5. **Removed features**: `InvitePage` is deleted, config files removed
6. **Auth changes**: JWT and permissions modified — high risk area
7. **Naming confusion**: `ThemeContext` = dark mode (safe), `useThemes` = SDG themes (needs new backend endpoint)
