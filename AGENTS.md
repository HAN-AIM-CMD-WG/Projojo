# Projojo - AI Coding Guidelines

## Project Context

Projojo is an educational project-management platform that connects businesses, students, supervisors, and teachers. Businesses publish projects and tasks, students register for tasks and build a skill portfolio, supervisors manage their company's work, and teachers oversee the whole picture.

User-facing language is **Dutch**. Code, comments, identifiers, and these guidelines are in English.

## Tech Stack

- **Frontend**: React 19 + Vite 6 + Tailwind CSS v4 (plain JavaScript/JSX, no TypeScript app code)
- **Backend**: FastAPI (Python 3.13), managed with `uv`
- **Database**: TypeDB 3.4 (driver `typedb-driver==3.4.0`)
- **Auth**: OAuth (Google, GitHub, Microsoft) via Authlib + JWT (HS256)
- **Email**: aiosmtplib + Jinja2 templates, MailHog locally
- **Tooling**: Docker Compose for all stacks, `Task` (Taskfile.yml) as the command surface
- **E2E tests**: Qavajs + Playwright (`tests/e2e/`)

## Repository Layout

```
projojo_frontend/   React + Vite frontend
projojo_backend/    FastAPI backend (domain-driven design)
tests/e2e/          Qavajs + Playwright E2E harness
docs/               Deployment, testing, business-rule, and planning docs
Taskfile.yml        Main command surface (docker:* and test:e2e:* tasks)
docker-compose*.yml base / dev / preview / test compose definitions
.env(.example)      Single repo-root env file shared by all services
```

See [`README.md`](README.md) for the full local setup, URLs, and deployment walkthrough. This file documents **how to write code**; the README documents **how to run the stack**.

## Common Commands

All day-to-day work runs in Docker via `Task`. You do not need host Python or Node for normal app development.

```bash
task docker:start    # start dev stack, open browser, stream logs
task docker:reset    # rebuild with volumes removed (full DB reset)
task docker:stop     # stop without removing volumes
task docker:logs     # stream backend + frontend logs
task test:e2e        # full isolated E2E workflow
```

Frontend lint: `npm run lint` (in `projojo_frontend/`). Backend tests: `uv run pytest` (in `projojo_backend/`). Env files live in the **repo root** and are shared by every service.

---

## Backend Guidelines (`projojo_backend/`)

### Architecture - Domain-Driven Layering

The intended flow is **route -> service -> repository -> `Db`**. The service layer is thin and applied inconsistently; many routes call repositories directly. For new code, prefer pushing non-trivial logic into a service.

| Layer        | Folder                                | Responsibility                                              |
| ------------ | ------------------------------------- | ----------------------------------------------------------- |
| Routes       | `routes/*_router.py`                  | FastAPI `APIRouter`s, one per resource. HTTP concerns only. |
| Services     | `service/*_service.py`                | Application/business logic, composition of repositories.    |
| Repositories | `domain/repositories/*_repository.py` | All TypeDB access, query strings, result mapping.           |
| Models       | `domain/models/*.py`                  | Pydantic models (domain entities + Create/Update variants). |
| Db           | `db/initDatabase.py`                  | Connection, transactions, query parameterization.           |
| Auth         | `auth/`                               | JWT, OAuth, the `@auth` decorator, ownership checks.        |
| Config       | `config/settings.py`                  | Env-var loading.                                            |
| Exceptions   | `exceptions/`                         | Custom exceptions + global handler.                         |

`main.py` is the composition root: it registers middleware, exception handlers, routers, and manages the TypeDB lifecycle via the `lifespan` context manager.

### Naming Conventions

- **Files**: `snake_case`; suffixes `*_router.py`, `*_service.py`, `*_repository.py`; models named after the singular entity (`business.py`).
- **Classes**: `PascalCase` (`BusinessRepository`, `AuthService`, `Business`).
- **Functions / methods**: `snake_case`; private helpers prefixed `_` (`_map_to_model`).
- **Pydantic fields**: `snake_case` (`image_path`, `is_archived`). Input variants suffixed `Create` / `Update`.
- **Routers**: the module-level variable is always named `router`; aliased on import in `main.py`.
- **TypeDB attributes**: `camelCase` (`imagePath`, `isArchived`). This mismatch with Python `snake_case` is bridged manually in each repository's `_map_to_model`.

### Pydantic / Domain Models

- All models extend `pydantic.BaseModel` directly. There is no shared base model.
- Use `class Config: from_attributes = True` where appropriate.Expand commentComment on line R80Resolved
- User roles use inheritance: `User` base with `Supervisor`, `Student`, `Teacher` subclasses; `type` is auto-derived from the subclass name.
- Optional fields use `X | None = None`; lists default to `[]`.
- Re-export new models from `domain/models/__init__.py`.

### Repositories & TypeDB Access

- Repositories extend the generic `BaseRepository[T]` and override `create` / `update` / `delete` / `_map_to_model`.
- Never open a TypeDB transaction directly in a repository. Use the `Db` helpers:
  - `Db.read_transact(query, params=None)` - `READ`, returns `list[dict]`.
  - `Db.write_transact(query, params=None)` - `WRITE`, commits.
  - `Db.schema_transact(query)` - `SCHEMA`, for `.tql` definitions only.
- **Parameterization is a custom layer, not native TypeQL.** Use `~param_name` placeholders in the query string and pass a dict. `build_query` substitutes and validates them:
  - Every placeholder must appear exactly once; every param must map to a placeholder, or you get a `ValueError`.
  - Strings are escaped via `sanitize_string` to prevent injection - always go through `~param`, never f-string user input into a query.
  - **READ** queries may not receive `None` (TypeQL has no null). Use a negation pattern instead: `not { $x has attr $v; }`.
  - **WRITE** queries treat a `None` param as "omit this clause" - this is how optional attributes are left unset.

Read example (optional fields wrapped in `[ ]`):

```python
query = """
match
    $business isa business, has id ~id, has id $id, has name $name;
fetch {
    'id': $id,
    'name': $name,
    'sector': [ $business.sector ]
};
"""
results = Db.read_transact(query, {"id": id})
```

### TypeDB Specifics (3.x)

This codebase uses **TypeDB 3.x syntax**. Do not introduce 2.x patterns.

- Read with `fetch { 'key': $var }` projection blocks (not 2.x `match ... get`).
- Optional `@card(0..1)` attributes are wrapped in `[ ... ]` in `fetch` and come back as **lists**. Always unwrap:

```python
# Optional fields come back as arrays from TypeDB
sector_list = result.get("sector", [])
sector = sector_list[0] if sector_list else None
```

- Schema uses `entity X @abstract`, `sub`, `owns attr @card(...)`, `attribute X value <type>;`, and `datetime-tz` for timestamps.
- Updates use the first-class `update` stage; attribute deletes use `delete has $val of $entity;`.
- Inline aggregation via `( match ... return count; )` inside `fetch`.

### Database Schema - Be Cautious

Adding fields is generally OK, but watch the impact on business rules.

**Safe changes** (no coordination needed):

- Display-only optional fields: `owns sector @card(0..1)`
- No dependency on other entities, queries, or matching logic

```tql
entity business,
    owns sector @card(0..1),      # optional, display only
    owns companySize @card(0..1), # optional, display only
    owns website @card(0..1);     # optional, display only
```

**Risky changes (require written documentation)** - anything affecting:

- Filtering / search (field used in `match`/`fetch` queries)
- Matching logic (student-task/skill matching)
- Validation (required fields, constraints, `@card(1..)`)
- Relations (new relations between entities)
- Authorization (who may see/do what)

When making a risky change, document: which existing logic must change, new validations needed, backward-compatibility, data impact, and a migration strategy.

### Schema, Seeds & Reset

- Schema: `db/schema.tql` (single `define` block). Loaded on startup by `create_database_if_needed`.
- Dev seed: `db/seed.tql` (rich illustrative dataset). Test seed: `db/test_seed.tql` (minimal, deterministic, fixed UUIDs for E2E assertions - keep it deterministic).
- Full dev reset: `task docker:reset` (wipes the `typedb-data` volume) or the `RESET_DB` env flag.
- Test DB reset: `db/reset_test_database.py` (used by `task test:e2e:reset`).

### Authentication & Authorization

- **JWT**: HS256, 8-hour expiry, secret from `JWT_SECRET_KEY`. Payload carries `sub` (user id), `role`, `iss="projojo"`, and `businessId` for supervisors.
- **OAuth**: Authlib with `google`, `github`, `microsoft`. Flow is `/auth/login/{provider}` -> `/auth/callback/{provider}`. Provider redirect URIs must point to the **backend callback**, not the frontend.
- **Roles**: A JWT `role` field holds exactly one value: `student`, `supervisor`, or `teacher`. Keep this separate from the `@auth(role=...)` gate level, which sets the _minimum_ needed to pass:
  - `unauthenticated` - anyone.
  - `authenticated` - any of `student` / `supervisor` / `teacher`.
  - `student` - only `student`.
  - `supervisor` - `supervisor` **or** `teacher` (teachers pass the supervisor gate).
  - `teacher` - only `teacher`.
  - So the gate name is not always the JWT value: `@auth(role="supervisor")` also admits teachers, while `@auth(role="teacher")` admits only teachers. Students are never in the supervisor/teacher chain.
- **Preferred authorization**: stack the `@auth(role=...)` decorator under the route decorator. For owner-scoped resources use `@auth(role=..., owner_id_key="...")` - students may only touch their own resources; supervisors are validated against their company; teachers bypass ownership.
- Some legacy endpoints do manual `Depends(get_token_payload)` + `if payload.get("role")` checks. **For new endpoints, prefer `@auth`** and do not mix both styles in one handler.

### Error Handling

- Raise custom exceptions from `exceptions/exceptions.py` (`ItemRetrievalException`, `UnauthorizedException`, `GenericException`) in lower layers; they are formatted by the global handler.
- In routes, raise `HTTPException(status_code=..., detail="<Dutch user-facing message>")`. Detail messages shown to users are Dutch.
- Repositories raise `ItemRetrievalException(<Model>, "...")` when an item is not found.

### Config / Settings

- Settings load via **`environs`** (not `pydantic-settings`) in `config/settings.py` as typed module-level constants, e.g. `JWT_SECRET_KEY: str = env.str("JWT_SECRET_KEY")`.
- `env.read_env(".env", recurse=True, override=False)` so real environment variables (Docker/Dokploy) win over the `.env` file.
- `env.seal()` validates all required vars at import time. Import settings with `from config.settings import JWT_SECRET_KEY`.
- Derived flags: `IS_DEVELOPMENT` / `IS_PRODUCTION` from `ENVIRONMENT`.

### Testing

- `pytest` (run `uv run pytest`). Current tests are pure unit tests of the query helpers in `tests/test_initDatabase.py` (no DB connection, no fixtures).
- Test classes `class TestXxx:`, methods `test_<behavior>`, error assertions via `pytest.raises(..., match="...")`.

### Tooling & Style

- **Python 3.13**, dependencies pinned exactly in `pyproject.toml`, managed with `uv` (`uv sync`, `uv add`, `uv remove`).
- Static analysis is **Pyright** (`pyrightconfig.json`, `basic` mode). There is no ruff/black/flake8/mypy - match the existing style.
- **Logging is inconsistent**: most modules use `print()`, but `service/email_service.py` shows the preferred pattern (`logging.getLogger(__name__)` + leveled calls). Prefer the `logging` approach in new code.

### API / Backend Changes

- Keep changes minimal and backward compatible - add, don't break.
- Test locally before committing.

---

## Frontend Guidelines (`projojo_frontend/`)

### Language & Tooling

- **JavaScript/JSX only.** App code is `.jsx`; there is no TypeScript for components. TS exists only for `src/lib/utils.ts` (the shadcn `cn()` helper) and path aliases. Use **JSDoc** for type hints (see `services.js`, `useFetch.js`).
- **No PropTypes** on components (the ESLint `prop-types` rule is off) - don't add them.
- Build: Vite 6 + `@vitejs/plugin-react-swc` + `@tailwindcss/vite`. Alias `@` -> `./src`. Env files are read from the **repo root** (`envDir: "../"`).
- Lint with `npm run lint`. Prettier is installed but unconfigured (editor-driven). Note `react-hooks/exhaustive-deps` and `react/prop-types` are disabled.
- **No** axios, react-query, Redux, zustand, form libraries, or i18n libraries. Don't add them without discussion.

### Directory Structure (`src/`)

```
App.jsx              root component: providers + all <Routes>
main.jsx             entry: createRoot + BrowserRouter + AuthProvider
index.css            Tailwind v4 + the full neumorphic design system
services.js          ALL backend API calls (single flat module)
useFetch.js          generic data-fetching hook (retry + cancellation)
auth/                AuthProvider, AuthCallback
context/             ThemeContext, StudentSkillsContext, StudentWorkContext  (note: singular "context")
hooks/               useBookmarks
utils/               dates.js, skills.js
lib/utils.ts         cn() helper
components/          flat PascalCase .jsx components (+ notifications/)
pages/               page components
tests/               Storybook *.stories.jsx (NOT unit tests)
```

There is no `services/` folder (it's the single `src/services.js`) and no `api/` folder.

### API Calls

- All backend calls are named exported functions in `src/services.js` over the native `fetch` API. There is no axios instance.
- Base URL is computed at runtime from `VITE_BACKEND_HOST` / `VITE_BACKEND_PORT` (`API_BASE_URL`, `IMAGE_BASE_URL`, `PDF_BASE_URL`).
- Route calls through the `fetchWithError` wrapper: it sets JSON headers (skipped for `FormData` uploads), attaches `Authorization: Bearer <token>` from `localStorage["token"]`, parses FastAPI `detail` errors, and throws a custom `HttpError` carrying `statusCode`.
- Errors surface globally: `App.jsx` listens for `unhandledrejection` and turns `HttpError` into a `notification.error(...)` toast, so service calls often don't need local try/catch.
- Add a new endpoint as a documented (JSDoc) exported function that goes through `fetchWithError`.

### State Management & Auth

- **React Context only.** Providers: `ThemeProvider`, `StudentSkillsProvider`, `StudentWorkProvider` (in `App.jsx`), wrapped by `AuthProvider` (in `main.jsx`). Plus the `useFetch` hook for data fetching.
- Auth: JWT stored in `localStorage["token"]`, decoded client-side with `jwt-decode`. `authData = { type, userId, businessId, isLoading }` where `type ∈ "none"|"student"|"supervisor"|"teacher"`. Consume via `useAuth()`.
- OAuth: backend redirects to `/auth/callback?access_token=...`; `AuthCallback.jsx` stores the token and navigates to `/home`. Login links point at `${API_BASE_URL}auth/login/{provider}`.

### Routing

- `react-router-dom` v7, `BrowserRouter`, routes declared centrally in `App.jsx` with nested `<Route>` elements. Dutch slugs are used (`/ontdek`, `/publiek`).
- There is no `<ProtectedRoute>` component; role gating happens inside page components (e.g. `HomePage` renders supervisor vs student dashboard from `authData.type`).
- Public/chrome-less pages (no navbar/footer) are determined by `isPublicPage` in `App.jsx`.

### Component Conventions

- Functional components, default-exported, props destructured with inline defaults: `export default function ProjectCard({ project, index = 0 }) {`.
- PascalCase component file names. (Two legacy snake_case spots exist: `components/paged_component/`, `pages/update_student_page/` - follow PascalCase for new files.)
- Icons: both Material Symbols (`<span className="material-symbols-outlined">name</span>`) and `lucide-react` are used.
- Global toasts via the `notification` singleton: `notification.success/.error/.info(...)`.
- Rich text via `RichTextViewer` (tiptap + marked + dompurify).

### Styling - Neumorphic Design System

Defined entirely in `src/index.css` (Tailwind v4, CSS-first via `@theme`, no `tailwind.config.js`). See also `src/DESIGN_SYSTEM.md` and the root `DESIGN.md`.

**Principles**

- **Accessibility first**: high contrast, keyboard navigation, screen-reader support
- **Functional beauty**: aesthetics support function
- **Consistent interactions**: predictable hover/focus/active states
- **Professional appearance**: suitable for education/business

**Colors / tokens**

- Primary: `#FF7F50` (Coral, `--primary-color`)
- Background: `#EFEEEE` (`--neu-bg`)
- Shadows: light `#FFFFFF`, dark `#D1D9E6`
- Text: `--text-primary` `#2D3748`, `--text-secondary`
- Light, `.dark`, and `.high-contrast` variants are all defined; tokens bridge to Tailwind utilities (`bg-neu-bg`, `text-text-primary`).

**Key component classes**

- Cards: `.neu-flat`, `.neu-flat-xl`, `.neu-flat-interactive`, `.neu-stat-card`
- Inset: `.neu-pressed`, `.neu-pressed-deep`
- Buttons: `.neu-btn`, `.neu-btn-primary`, `.neu-btn-outline`, `.neu-btn-text`, `.neu-icon-btn`
- Inputs: `.neu-input`
- Badges/pills: `.skill-badge*`, `.neu-badge-*`, `.status-badge-*`, `.neu-pill*`
- Tabs/segments: `.neu-tabs`/`.neu-tab`, `.neu-segment-*`

Use `cn()` from `src/lib/utils.ts` for conditional class composition.

### Internationalization

There is **no i18n framework**. All user-facing strings are hardcoded **Dutch** literals inline in JSX. Dates use `nl-NL` (`utils/dates.js`). `<html lang="nl">`. Write new user-facing strings in Dutch, inline.

---

## Accessibility Requirements

**NON-NEGOTIABLE** (and genuinely implemented across the frontend)

- WCAG 2.1 AA minimum
- Keyboard navigation for all interactive elements
- Screen-reader compatibility (skip link `#main-content`, `aria-live` announcements in `ThemeContext`)
- Respect `prefers-reduced-motion` and `prefers-contrast`
- Visible focus indicators (3px primary-color rings; high-contrast mode forces outlines)
- Semantic HTML; decorative icons get `aria-hidden="true"`; meaningful `alt`/`title` text

## Animation Guidelines

**Allowed**: subtle hover elevations (~2-6px translateY), soft pulse (scale 1.0-1.1), gentle fades, ambient activity indicators (2-4s).

**Constraints**:

- Duration: ~0.2s for interactions, 2-4s for ambient
- Performance: animate only `transform` and `opacity`
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)`

---

## Testing

- **E2E** (`tests/e2e/`): Qavajs + Playwright on an isolated Docker stack with a deterministic seed. Run `task test:e2e` (full) or `task test:e2e:run:selective -- --tags @smoke` (filtered). See `docs/TESTING_INFRASTRUCTURE.md`.
- **Backend unit**: `uv run pytest` in `projojo_backend/`.
- **Frontend**: no unit-test runner; `src/tests/` holds Storybook stories. Storybook: `npm run storybook`.

## Do's and Don'ts

### Never Do

- Break neumorphic design consistency or use flashy/unprofessional animations
- Ignore accessibility
- Change backend business logic or DB relations without coordination/documentation
- Introduce TypeScript components, axios, react-query, Redux, or an i18n library on the frontend without discussion
- Use 2.x TypeQL syntax, or f-string user input directly into a query (always use `~param`)
- Pass `None` to a READ query (use negation patterns)

### Always Do

- Follow existing design and layering patterns
- Test responsive behavior and validate accessibility
- Coordinate on backend changes; keep them additive and backward compatible
- Use optional `@card(0..1)` for new display-only data, and unwrap list results
- Prefer the `@auth` decorator for new endpoints
- Write user-facing strings in Dutch, code/comments in English
