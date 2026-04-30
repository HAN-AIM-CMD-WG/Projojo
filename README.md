# Projojo

Projojo is an educational project platform that connects businesses, students, supervisors, and teachers.

This repository contains the full local development setup for the React frontend, FastAPI backend, TypeDB database, MailHog, and the isolated E2E test stack.

## What developers need first

- [`Docker Desktop`](docker-compose.yml)
- [`Task`](Taskfile.yml) CLI ([go-task.github.io](https://taskfile.dev/installation/)) install with npm, like this: `npm install -g @go-task/cli`\
  Also, consider installing [the VS Code extension](<[https://taskfile.dev/docs/integrations#visual-studio-code-extension](https://taskfile.dev/docs/integrations#visual-studio-code-extension)>) or [the IntelliJ plugin](<[https://plugins.jetbrains.com/plugin/17058-taskfile](https://plugins.jetbrains.com/plugin/17058-taskfile)>) for the Task tool
- [`Node.js 22+`](tests/e2e/package.json:4) only if you want to run the E2E suite from [`tests/e2e/`](tests/e2e/package.json)
- OAuth and app secrets configured in a local [`.env`](.env.example)

Everything in the normal app stack runs in Docker. You do **not** need a host Python or host Node install for day-to-day app development.

## Quick start

### 1. Create your local env file

```bash
cp .env.example .env
```

Then edit [`.env`](.env.example) and fill in the values you actually need.

Important variables to review immediately:

- [`ENVIRONMENT`](.env.example:14) should stay `development` locally
- OAuth client IDs and secrets near the bottom of [`.env.example`](.env.example:102)
- [`SESSIONS_SECRET_KEY`](.env.example:111) and [`JWT_SECRET_KEY`](.env.example:113)
- [`TYPEDB_NEW_PASSWORD`](.env.example:97)

### 2. Start the local development stack

```bash
task docker:start
```

This uses [`Taskfile.yml`](Taskfile.yml:9) to:

1. start the Docker Compose development stack
2. wait for services to initialize
3. open the frontend URL from [`.env`](.env.example:59)
4. stream frontend and backend logs

For a clean rebuild with volumes removed:

```bash
task docker:reset
```

Stop the stack without removing volumes:

```bash
task docker:stop
```

Stream logs again later:

```bash
task docker:logs
```

## Local URLs

Default local endpoints come from [`.env.example`](.env.example:36):

| Service              | URL                           | Notes                          |
| -------------------- | ----------------------------- | ------------------------------ |
| Frontend             | `http://localhost:10101`      | Main app                       |
| Backend              | `http://localhost:10102`      | FastAPI server                 |
| API docs             | `http://localhost:10102/docs` | Swagger UI                     |
| TypeDB               | `localhost:10103`             | Direct DB port                 |
| TypeDB Studio bridge | `localhost:10104`             | Used by external Studio client |
| MailHog              | `http://localhost:10106`      | Captured email UI              |

### TypeDB Studio

TypeDB Studio is not served from this repo directly. Use [studio.typedb.com](https://studio.typedb.com) and connect to:

- address: `localhost:10104`
- username: `admin`
- password: the value of [`TYPEDB_NEW_PASSWORD`](.env.example:97)

## Development workflow

### App development

The development stack uses [`docker-compose.yml`](docker-compose.yml) with shared definitions from [`docker-compose.base.yml`](docker-compose.base.yml) and mounts the source code into the containers for hot reload.

- frontend changes update through Vite HMR
- backend changes reload through the FastAPI/uvicorn dev setup in Docker
- config changes usually need a container restart

When in doubt:

```bash
docker compose restart frontend backend
```

### Frontend dependencies

Frontend dependencies live in [`projojo_frontend/package.json`](projojo_frontend/package.json:1).

If you change frontend dependencies, rebuild the frontend container:

```bash
docker compose build frontend
docker compose up -d frontend
```

Relevant scripts in [`projojo_frontend/package.json`](projojo_frontend/package.json:6):

- [`npm run dev`](projojo_frontend/package.json:7)
- [`npm run build`](projojo_frontend/package.json:8)
- [`npm run lint`](projojo_frontend/package.json:9)
- [`npm run preview`](projojo_frontend/package.json:10)

These are normally executed inside Docker for the app stack.

### Backend development

Backend dependencies live in [`projojo_backend/pyproject.toml`](projojo_backend/pyproject.toml:1) and are managed with `uv`.

For most day-to-day work, treat the backend as part of the full repo-level Docker stack. You only need local Python/uv if you want IDE support, focused backend debugging, or to manage backend dependencies outside Docker.

#### Optional: run the backend directly with Python

From [`projojo_backend/`](projojo_backend/):

```bash
uv sync
uv run python main.py
```

This local-only mode is optional and not the main documented workflow for the repo.

- API root: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- the normal Docker workflow still uses `http://localhost:10102`

Notes:

- the backend still expects the repo-root [`.env`](.env.example) file
- TypeDB and other dependent services still need to be available
- on Windows, local TypeDB driver compatibility may still be problematic; Docker or WSL2 remains the safer option

The direct Python entry point in [`projojo_backend/main.py`](projojo_backend/main.py:198) still runs uvicorn on port `8000`.

#### Backend dependency management

Useful local commands from [`projojo_backend/`](projojo_backend/):

```bash
uv sync
uv add <dependency>
uv remove <dependency>
uv run python --version
```

If you change backend dependencies locally, rebuild the backend container:

```bash
docker compose up --build backend
```

#### Authentication and development-only endpoints

OAuth login is handled through backend routes in [`projojo_backend/routes/auth_router.py`](projojo_backend/routes/auth_router.py):

- `/auth/login/{provider}`
- `/auth/callback/{provider}`

Provider setup instructions live in [`projojo_backend/auth/README.md`](projojo_backend/auth/README.md).

Important: provider redirect URIs must point to the **backend callback URL**, not directly to the frontend.

Development-only helpers:

- [`http://localhost:10102/typedb/status`](projojo_backend/main.py:128) is available only when `ENVIRONMENT=development`
- `/auth/test/login/{user_id}` in [`projojo_backend/routes/auth_router.py`](projojo_backend/routes/auth_router.py:108) provides a local shortcut login route for testing

<details>
<summary>Backend environment values to review</summary>

Important backend values in [`.env.example`](.env.example) include:

- `ENVIRONMENT`
- `FRONTEND_URL`
- `SESSIONS_SECRET_KEY`
- `JWT_SECRET_KEY`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET`
- `TYPEDB_*`
- `EMAIL_*`

</details>

<details>
<summary>Backend directory structure</summary>

- [`projojo_backend/auth/`](projojo_backend/auth/) - OAuth, JWT, and authorization helpers
- [`projojo_backend/config/`](projojo_backend/config/) - environment settings
- [`projojo_backend/db/`](projojo_backend/db/) - TypeDB bootstrap and query helpers
- [`projojo_backend/domain/`](projojo_backend/domain/) - models and repositories
- [`projojo_backend/routes/`](projojo_backend/routes/) - FastAPI routers
- [`projojo_backend/service/`](projojo_backend/service/) - application services
- [`projojo_backend/tests/`](projojo_backend/tests/) - backend-specific tests

</details>

### Useful checks while developing

```bash
# Show running services
docker compose ps

# Backend logs only
docker compose logs -f backend

# Frontend logs only
docker compose logs -f frontend

# Development-only TypeDB health endpoint
curl http://localhost:10102/typedb/status
```

The TypeDB health endpoint is development-only in [`projojo_backend/main.py`](projojo_backend/main.py:128).

## Testing

### E2E tests

The E2E workflow is separate from the normal dev stack.

It uses:

- [`docker-compose.test.yml`](docker-compose.test.yml)
- [`.env.test`](.env.test)
- [`tests/e2e/package.json`](tests/e2e/package.json:1)
- [`Taskfile.yml`](Taskfile.yml:63)

### E2E prerequisites

- Docker Desktop
- [`Task`](Taskfile.yml)
- local [`Node.js >=22`](tests/e2e/package.json:5)
- npm

### One-command E2E run

```bash
task test:e2e
```

This runs the full isolated workflow defined in [`Taskfile.yml`](Taskfile.yml:105):

1. rebuild the isolated E2E stack
2. install the E2E runner dependencies
3. install the Playwright browser
4. reset TypeDB with the deterministic test seed
5. run the preflight checks
6. run the neutral proof suite

### Individual E2E commands

```bash
task test:e2e:stack
task test:e2e:install
task test:e2e:browsers
task test:e2e:reset
task test:e2e:preflight
task test:e2e:run
task test:e2e:run:selective
task test:e2e:focus
task test:e2e:report
```

### Selective E2E runs

[`test:e2e:run:selective`](Taskfile.yml:100) uses the stable direct [`@qavajs/core`](tests/e2e/package.json:15) runner with the [`selective`](tests/e2e/qavajs.config.cjs:52) profile from [`tests/e2e/qavajs.config.cjs`](tests/e2e/qavajs.config.cjs:1).

That profile omits the default full-suite feature glob, so CLI filters can narrow the run correctly.

```bash
# one feature file on an already prepared stack
task test:e2e:run:selective -- --paths features/stack-health.feature

# one scenario inside one feature file
task test:e2e:run:selective -- --paths features/development-login.feature --name "Demo login creates a usable authenticated supervisor browser session"

# all smoke scenarios
task test:e2e:run:selective -- --tags @smoke

# scenarios tagged with both @api and @smoke
task test:e2e:run:selective -- --tags @api --tags @smoke
```

[`test:e2e:focus`](Taskfile.yml:106) performs the full deterministic setup and then applies the same selective filters:

```bash
task test:e2e:focus -- --paths features/api-memory.feature
```

Use documented examples rather than [`--help`](tests/e2e/node_modules/@qavajs/core/lib/cliOptions.js:5), because the direct core runner is not exposing a user-facing help screen.

Report output is written to [`tests/e2e/reports/report.html`](tests/e2e/reports/report.html).

More detail lives in [`docs/TESTING_INFRASTRUCTURE.md`](docs/TESTING_INFRASTRUCTURE.md).

## Deployment

### Current deployment model

The repo documents two active Docker Compose environments:

- development via [`docker-compose.yml`](docker-compose.yml)
- preview/staging via [`docker-compose.preview.yml`](docker-compose.preview.yml)

Shared service definitions live in [`docker-compose.base.yml`](docker-compose.base.yml).

### Preview / staging

Preview is designed for Dokploy + Traefik and uses the `preview` Docker build target documented in [`docs/DEPLOYMENT_INFRASTRUCTURE.md`](docs/DEPLOYMENT_INFRASTRUCTURE.md:285).

Key differences from development:

- no source volume mounts
- frontend is built into the image
- HTTPS is terminated by Traefik
- MailHog is not part of preview
- secrets are configured in Dokploy, not in a committed env file

Public preview URLs documented in [`docs/DEPLOYMENT_INFRASTRUCTURE.md`](docs/DEPLOYMENT_INFRASTRUCTURE.md:277):

- `https://preview.projojo.nl`
- `https://backend.preview.projojo.nl`
- `https://typedb.preview.projojo.nl`

### Deploy checklist

1. Make sure required secrets are set in Dokploy, especially OAuth, JWT, session, SMTP, and TypeDB password values documented in [`docs/DEPLOYMENT_INFRASTRUCTURE.md`](docs/DEPLOYMENT_INFRASTRUCTURE.md:300).
2. Ensure preview values use `ENVIRONMENT=preview` as shown in [`.env.example`](.env.example:15).
3. Confirm frontend/backend URLs are aligned with the preview values from [`docs/DEPLOYMENT_INFRASTRUCTURE.md`](docs/DEPLOYMENT_INFRASTRUCTURE.md:279).
4. Deploy with the preview compose setup used by Dokploy.

For the full infrastructure explanation, see [`docs/DEPLOYMENT_INFRASTRUCTURE.md`](docs/DEPLOYMENT_INFRASTRUCTURE.md).

## Repo map

- [`projojo_frontend/`](projojo_frontend/) - React + Vite frontend
- [`projojo_backend/`](projojo_backend/) - FastAPI backend
- [`tests/e2e/`](tests/e2e/) - Qavajs + Playwright E2E harness
- [`docs/`](docs/) - infrastructure, testing, business rules, and planning docs
- [`Taskfile.yml`](Taskfile.yml) - main command surface for local development and E2E

## Further reading

- [`docs/DEPLOYMENT_INFRASTRUCTURE.md`](docs/DEPLOYMENT_INFRASTRUCTURE.md)
- [`docs/TESTING_INFRASTRUCTURE.md`](docs/TESTING_INFRASTRUCTURE.md)
- [`projojo_backend/auth/README.md`](projojo_backend/auth/README.md)
