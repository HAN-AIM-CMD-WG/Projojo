# Projojo Backend

FastAPI backend service for Projojo.

For most day-to-day work, treat this backend as part of the full repo-level Docker development stack rather than a standalone app.

## Quick facts

- Main local backend URL in the Docker dev stack: `http://localhost:10102`
- Swagger UI: `http://localhost:10102/docs`
- Repo-level startup command: `task docker:start` from the project root
- Optional local-only Python run: `uv run python main.py` from [`projojo_backend/`](./)

## Recommended workflow

The current project-standard workflow lives at the repo root and is driven by [`../Taskfile.yml`](../Taskfile.yml).

From the project root:

```bash
cp .env.example .env
task docker:start
```

That starts the full development stack defined by [`../docker-compose.yml`](../docker-compose.yml):

- frontend
- backend
- TypeDB
- MailHog

Use this backend README when you need backend-specific details. Use the root [`../README.md`](../README.md) for full-stack onboarding.

## Prerequisites

Required for normal backend development:

1. Docker Desktop
2. Task CLI
3. A repo-root [`.env`](../.env.example) created from [`../.env.example`](../.env.example)
4. OAuth client credentials configured via [`./auth/README.md`](./auth/README.md)

Optional:

- Python 3.13+
- `uv`

Local Python and `uv` are only needed if you want IDE dependency syncing or to run the backend outside Docker.

## Required environment configuration

The backend reads settings from [`config/settings.py`](config/settings.py), which loads the repo-root `.env` file.

Important required values include:

- `ENVIRONMENT`
- `FRONTEND_URL`
- `SESSIONS_SECRET_KEY`
- `JWT_SECRET_KEY`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET`
- `TYPEDB_*`
- `EMAIL_*`

See [`../.env.example`](../.env.example) for the full template.

## Backend URLs

### In the normal Docker development stack

These are the URLs most developers should use:

- API root: `http://localhost:10102`
- Swagger UI: `http://localhost:10102/docs`
- TypeDB status endpoint: `http://localhost:10102/typedb/status`

Those values come from [`../.env.example`](../.env.example) and [`../docker-compose.base.yml`](../docker-compose.base.yml).

### When running the backend directly with Python

[`uvicorn.run()`](main.py:199) in [`main.py`](main.py) still starts the backend on port `8000`.

So if you run:

```bash
cd projojo_backend
uv run python main.py
```

your local URLs become:

- API root: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`

That local-only mode is optional and not the main documented workflow for the repo.

## Running the backend in Docker

From the repo root, use the shared task workflow:

```bash
task docker:start
task docker:logs
task docker:stop
task docker:reset
```

If you only need to restart the backend after config changes:

```bash
docker compose restart backend
```

If you changed environment variables that also affect frontend auth flows, restart both:

```bash
docker compose restart backend frontend
```

## Running the backend locally with Python

This is useful for IDE integration or focused backend debugging, but it assumes you already understand the repo-level Docker setup.

From [`projojo_backend/`](./):

```bash
uv sync
uv run python main.py
```

Notes:

- the backend still expects the repo-root `.env` file loaded by [`config/settings.py`](config/settings.py:10)
- TypeDB and other dependent services still need to be available
- on Windows, local TypeDB driver compatibility may still be problematic; Docker or WSL2 remains the safer option

## Dependency management

Backend dependencies are defined in [`pyproject.toml`](pyproject.toml) and locked in [`uv.lock`](uv.lock).

Useful local commands from [`projojo_backend/`](./):

```bash
uv sync
uv add <dependency>
uv remove <dependency>
uv run python --version
```

After changing backend dependencies, rebuild or restart the backend container from the repo root:

```bash
docker compose up --build backend
```

## Authentication and OAuth

OAuth login is handled through backend routes defined in [`routes/auth_router.py`](routes/auth_router.py):

- `/auth/login/{provider}`
- `/auth/callback/{provider}`

Provider setup instructions live in [`./auth/README.md`](./auth/README.md).

Important: provider redirect URIs must point to the **backend callback URL**, not directly to the frontend.

## Development-only endpoints

[`typedb_status()`](main.py:128) is available only when `ENVIRONMENT=development`.

There is also a development-only shortcut login route at [`/auth/test/login/{user_id}`](routes/auth_router.py:108) for local testing.

## Testing

The main actively documented automated testing workflow for this repo is the isolated E2E stack at:

- [`../tests/e2e/`](../tests/e2e/)
- [`../docs/TESTING_INFRASTRUCTURE.md`](../docs/TESTING_INFRASTRUCTURE.md)
- [`../Taskfile.yml`](../Taskfile.yml)

Run it from the repo root with:

```bash
task test:e2e
```

## Backend structure

- [`auth/`](auth/) - OAuth, JWT, and authorization helpers
- [`config/`](config/) - environment settings
- [`db/`](db/) - TypeDB bootstrap and query helpers
- [`domain/`](domain/) - models and repositories
- [`routes/`](routes/) - FastAPI routers
- [`service/`](service/) - application services
- [`tests/`](tests/) - backend-specific tests

## Related docs

- [`../README.md`](../README.md)
- [`./auth/README.md`](./auth/README.md)
- [`../docs/DEPLOYMENT_INFRASTRUCTURE.md`](../docs/DEPLOYMENT_INFRASTRUCTURE.md)
- [`../docs/TESTING_INFRASTRUCTURE.md`](../docs/TESTING_INFRASTRUCTURE.md)
