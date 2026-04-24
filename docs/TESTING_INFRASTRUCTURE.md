# Automated testing infrastructure foundation

This document describes the first local executable-spec foundation for Projojo.

The infrastructure is operational in its current CommonJS-based form and is executed through the [`@qavajs/core`](../tests/e2e/node_modules/@qavajs/core/bin/qavajs.js:1) runner entrypoint configured in [`tests/e2e/package.json`](../tests/e2e/package.json) and [`Taskfile.yml`](../Taskfile.yml).

## Scope of this phase

This phase only establishes the infrastructure needed for future Qavajs-first automated verification.

Included now:

- a dedicated `[Taskfile.yml](../Taskfile.yml)` command surface
- a dedicated isolated test stack in `[docker-compose.test.yml](../docker-compose.test.yml)`
- a committed local test environment file in `[../.env.test](../.env.test)`
- a top-level `[tests/e2e/](../tests/e2e/)` Qavajs + Playwright harness
- a dedicated deterministic seed in `[projojo_backend/db/test_seed.tql](../projojo_backend/db/test_seed.tql)`
- a reset entry point in `[projojo_backend/db/reset_test_database.py](../projojo_backend/db/reset_test_database.py)`
- a neutral proof suite for reachability, dev login, API checks, and memory sharing
- saved HTML reporting under `[tests/e2e/reports/](../tests/e2e/reports/)`

Explicitly deferred:

- real archiving scenarios from `[docs/ARCHIVING_SPECIFICATION.md](./ARCHIVING_SPECIFICATION.md)`
- accessibility, performance, and security suites
- CI orchestration
- multi-browser execution

## Files and structure

- `[Taskfile.yml](../Taskfile.yml)`
- `[docker-compose.test.yml](../docker-compose.test.yml)`
- `[../.env.test](../.env.test)`
- `[tests/e2e/package.json](../tests/e2e/package.json)`
- `[tests/e2e/qavajs.config.cjs](../tests/e2e/qavajs.config.cjs)`
- `[tests/e2e/features/](../tests/e2e/features/)`
- `[tests/e2e/steps/](../tests/e2e/steps/)`
- `[tests/e2e/support/](../tests/e2e/support/)`
- `[tests/e2e/scripts/preflight.cjs](../tests/e2e/scripts/preflight.cjs)`
- `[tests/e2e/reports/report.html](../tests/e2e/reports/report.html)`
- `[projojo_backend/db/test_seed.tql](../projojo_backend/db/test_seed.tql)`

Removed stale ESM/CJS-transition leftovers:

- `[tests/e2e/scripts/preflight.mjs](../tests/e2e/scripts/preflight.mjs)`
- `[tests/e2e/support/test-data.js](../tests/e2e/support/test-data.js)`
- `[tests/e2e/support/page-object.js](../tests/e2e/support/page-object.js)`
- `[tests/e2e/steps/infrastructure.steps.js](../tests/e2e/steps/infrastructure.steps.js)`
- `[tests/e2e/qavajs.config.js](../tests/e2e/qavajs.config.js)`

## Local prerequisites

- Docker / Docker Desktop
- global Task CLI (`@go-task/cli`)
- local Node.js 22+ and npm for the dedicated test runner package in `[tests/e2e/package.json](../tests/e2e/package.json)`

The application stack still runs in Docker, but the E2E workflow now uses the isolated test stack defined in `[docker-compose.test.yml](../docker-compose.test.yml)` with settings from `[../.env.test](../.env.test)`. The Qavajs runner itself still runs locally from `[tests/e2e/](../tests/e2e/)`.

## Isolated test stack

The test workflow intentionally does **not** reuse the normal development stack from `[docker-compose.yml](../docker-compose.yml)`.

It uses:

- `[docker-compose.base.yml](../docker-compose.base.yml)`
- `[docker-compose.test.yml](../docker-compose.test.yml)`
- `[../.env.test](../.env.test)`

This keeps the E2E workflow isolated with:

- separate exposed ports in the `1012x` range
- separate container names
- a separate Docker network
- a separate TypeDB volume

Default host ports for the isolated test stack:

- frontend: `10121`
- backend: `10122`
- TypeDB: `10123`
- TypeDB Studio: `10124`
- MailHog SMTP: `10125`
- MailHog web UI: `10126`

This allows the normal development stack and the test stack to run at the same time without host-port conflicts.

## Root Task workflow

### One-command full workflow

```bash
task test:e2e
```

That command performs:

1. tear down any previous isolated test stack and rebuild it from scratch
2. install the dedicated E2E runner dependencies
3. install the primary Playwright browser
4. reset TypeDB with the deterministic E2E seed
5. run a preflight check
6. run the neutral proof suite with [`node ./node_modules/@qavajs/core/bin/qavajs.js run --config ./qavajs.config.cjs`](../tests/e2e/package.json:9)

### Individual commands

```bash
task test:e2e:stack
task test:e2e:install
task test:e2e:browsers
task test:e2e:reset
task test:e2e:preflight
task test:e2e:run
task test:e2e:report
```

## What the current suite proves

The neutral proof scenarios currently verify:

- backend and frontend endpoint reachability
- development-only TypeDB status access
- deterministic seed visibility through the public projects API
- development login shortcut usage through the browser UI on `[projojo_frontend/src/components/TestUserSelector.jsx](../projojo_frontend/src/components/TestUserSelector.jsx)`
- one authenticated supervisor browser flow
- one direct API assertion path
- memory-backed state sharing across steps

The current harness uses:

- CommonJS config and support files: [`tests/e2e/qavajs.config.cjs`](../tests/e2e/qavajs.config.cjs), [`tests/e2e/steps/infrastructure.steps.cjs`](../tests/e2e/steps/infrastructure.steps.cjs), [`tests/e2e/support/page-object.cjs`](../tests/e2e/support/page-object.cjs), and [`tests/e2e/support/test-data.cjs`](../tests/e2e/support/test-data.cjs)
- qava built-in Playwright and memory steps loaded through [`require`](../tests/e2e/qavajs.config.cjs:14)
- the [`@qavajs/core`](../tests/e2e/node_modules/@qavajs/core/bin/qavajs.js:1) binary rather than [`@qavajs/cli`](../tests/e2e/node_modules/@qavajs/cli/lib/run.js:102), because the latter produced broken step invocation in this project setup

## Report output

The saved reviewer-facing artifact is written to:

- `[tests/e2e/reports/report.html](../tests/e2e/reports/report.html)`

## Important limitations

1. The test runner dependencies are intentionally isolated under `[tests/e2e/package.json](../tests/e2e/package.json)`, but that means the harness currently needs local Node.js in addition to Docker.
2. The isolated test stack depends on committed test-only values in `[../.env.test](../.env.test)`. These are intentionally non-production and should not be reused outside local test automation.
3. The E2E package lockfile is not committed yet, so dependency exactness is not fully pinned in this first foundation pass.
4. The seed is intentionally minimal and only supports the neutral proof scenarios in this phase.

## Next phase boundary

The next step after this foundation is to add real story-driven executable specs for archiving behavior on top of this harness, not to expand this seed into a broad product fixture.
