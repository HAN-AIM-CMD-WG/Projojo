# Implementation-ready plan for automated testing infrastructure

## 1. Goals

1. Create a local-first executable-spec testing harness that matches the future direction implied by `8.4 Verification Strategy`.
2. Make the harness runnable through a single cross-platform root command via `Taskfile.yml`.
3. Prove the harness works through a very small set of neutral infrastructure scenarios.
4. Ensure deterministic execution through a dedicated minimal test dataset and repeatable reset flow.
5. Produce reviewer-visible evidence of passing runs without depending on CI.
6. Keep the first suite fast enough to be used habitually.

## 2. Non-goals

- Do not implement the full archiving scenario catalog yet.
- Do not decide detailed archive or restore scenarios before user stories exist.
- Do not design CI/CD enforcement now.
- Do not include accessibility, performance, security, or notification-delivery testing in phase one.
- Do not use full OAuth login flows as part of the initial harness proof.

## 3. Scope boundaries

### In scope now

- Qavajs-based BDD infrastructure.
- Playwright-backed browser execution.
- Memory-backed state sharing between steps.
- Small direct API proof coverage.
- Development-login shortcut usage.
- Dedicated deterministic dataset and reset process.
- Local Docker-stack execution.
- Root-level Task orchestration.
- Human-readable reporting and saved artifact output.

### Explicitly out of scope now

- Real archiving behavior coverage from `Required automated coverage includes`.
- Multi-browser execution.
- CI orchestration.
- Notification email validation via `@qavajs/steps-gmail`.
- Accessibility, performance, and security suites.

## 4. Success criteria

The first infrastructure phase is complete when all of the following are true:

1. A developer on Windows, macOS, or Linux can run one documented Task command from the repo root.
2. That command starts from a known deterministic database state.
3. The proof suite demonstrates:

  - local stack assumptions are valid
  - development login works
  - one browser flow works
  - one direct API assertion works
  - Qavajs memory-based state sharing works
  - deterministic seed-based assertions work
4. The suite completes in roughly 5 minutes or less on a normal developer machine.
5. The run produces a clear terminal summary and a saved report artifact.
6. The suite has no automatic retries by default.
7. The harness structure is ready for future user-story-driven feature files.

## 5. Recommended test strategy by layer

### Primary layer: Qavajs executable end-to-end specs

Use Qavajs as the main layer because that aligns with the project direction in `8.4 Verification Strategy` and with your preference for mostly E2E coverage.

Use this layer for phase-one proof scenarios such as:

- application is reachable
- public page renders expected deterministic content
- development login creates a usable authenticated browser session
- authenticated page renders correctly for the seeded test user
- browser and API steps can share remembered IDs or values

### Secondary layer: very small backend contract checks

Use only where they simplify the E2E suite materially.

Appropriate initial uses:

- assert a known endpoint is reachable and returns expected stable structure
- assert a test user or seeded record exists before browser flow begins
- assert reset succeeded against the dedicated dataset

Avoid building a broad API-test pyramid now. That would be overengineering relative to your stated goal.

## 6. Tooling recommendations

- Qavajs as the executable-spec runner.
- `@qavajs/steps-playwright` for browser-oriented steps.
- `@qavajs/steps-memory` for state sharing.
- One primary browser target only for phase one.
- Globally installed `@go-task/cli` with root `Taskfile.yml` as the command surface.
- Local Docker stack from `docker-compose.yml` as the execution environment.
- Reuse existing development auth shortcut in `/auth/test/login/{user_id}` for seeded-user session establishment.

## 7. Repository layout

Use a simple top-level test directory, not a separate workspace.

Recommended structure:

- `tests/`
- `tests/e2e/`
- `tests/e2e/features/`
- `tests/e2e/steps/`
- `tests/e2e/support/`
- `tests/e2e/fixtures/`
- `tests/e2e/reports/`
- `tests/e2e/config/`

Recommended supporting files:

- root `Taskfile.yml`
- a test-runner package manifest only if needed, preferably under `tests/e2e/package.json`
- dedicated data reset assets under something like `projojo_backend/db/test_seed.tql` or a nearby clearly named test-data path
- a short contributor guide such as `docs/TESTING_INFRASTRUCTURE.md`

## 8. Naming conventions

### Feature files

Use names that describe infrastructure capability, not product behavior yet.

Examples:

- `infrastructure_stack_health.feature`
- `infrastructure_dev_login.feature`
- `infrastructure_api_probe.feature`
- `infrastructure_memory_state.feature`

### Step files

Organize by concern:

- `app.steps.js`
- `auth.steps.js`
- `api.steps.js`
- `memory.steps.js`
- `seed.steps.js`

### Tagging

Use tags from day one so later story suites can grow cleanly.

Recommended initial tags:

- infrastructure
- smoke
- browser
- api
- auth
- memory
- deterministic-data

Do not introduce archiving-specific tags yet.

## 9. Fixture and factory strategy

For phase one, prefer fixed deterministic fixtures over factories.

### Why

- Your goal is infrastructure proof, not broad scenario composition.
- Fixed deterministic records are easier to debug and faster to reason about.

### Recommended approach

- Create a minimal dataset with exactly the records needed to prove the harness.
- Include stable IDs or clearly discoverable fields for:

  - one teacher-equivalent test user
  - one student-equivalent test user if needed
  - one supervisor-equivalent test user only if required for a neutral auth check
  - one public entity visible on the public page
  - one authenticated entity visible after login
- Keep assertions tied to this dataset only.

### Avoid in phase one

- Data factories with lots of optional fields.
- UI-created setup data.
- Dependency on the large shared seed in `projojo_backend/db/seed.tql`.

## 10. Environment strategy

### Primary environment

- Local Docker stack only, based on `docker-compose.yml`.
- One primary browser target only.
- No preview or production-like environment required in the initial phase.

### Environment assumptions to codify

- frontend reachable at the configured local host and port from `.env.example`
- backend reachable at the configured local host and port from `.env.example`
- TypeDB available through the local stack
- development endpoints enabled in local development

### Recommended rule

The proof suite should fail early with a clear message if the expected local stack is not up or if the backend is not in development mode.

## 11. Data lifecycle

### Lifecycle design

1. Reset database.
2. Load dedicated minimal test dataset.
3. Verify the expected seed markers exist.
4. Run the proof scenarios.
5. Save reports.
6. Leave cleanup optional unless the run mutates data outside the resettable scope.

### Reset philosophy

- Prefer full reset to known state before the suite.
- Do not depend on previous run residue.
- Do not let scenarios require a particular execution order unless the memory-sharing scenario is intentionally proving remembered state inside one flow.

### Verifiable reset check

Add one explicit preflight assertion that proves the dataset is the expected one before browser tests begin.

## 12. Mocking policy

### Default policy

Use real local app components and real local APIs wherever possible.

### Allowed faking

- Use the development login shortcut rather than external OAuth.
- Use deterministic seed data rather than dynamic external setup.
- Use memory steps for internal scenario state.

### Avoid

- Mocking frontend network calls inside the E2E suite.
- Mocking browser behavior.
- Mocking TypeDB behavior.
- Introducing fake external systems that are irrelevant to the infrastructure proof.

This follows the right-layer principle: full workflow tests should use minimal faking.

## 13. Authentication and setup approach

### Authentication choice

Use the existing development login shortcut in `auth_router.py`, not real OAuth.

### Why

- It directly matches your stated preference.
- It keeps the proof suite focused on harness reliability.
- It avoids turning identity-provider behavior into the bottleneck.

### Session setup recommendation

Provide one shared step that establishes an authenticated browser state for a known seeded user. Future story suites can reuse that instead of duplicating login mechanics.

## 14. Reporting and reviewer proof

The first suite should generate:

- a concise terminal summary suitable for local use and code-review discussion
- a saved HTML-like report artifact under something like `tests/e2e/reports/`
- optional screenshots or traces only on failure, not by default, to preserve speed

### Reviewer-visible proof rule

Until CI exists, the team workflow should require visible evidence of a passing local run before merge. That evidence can be a saved report artifact and terminal summary attached to review discussion.

## 15. Coverage philosophy

### Phase one philosophy

Cover the harness, not the product.

That means the first proof scenarios should answer:

- can the executable-spec runner run?
- can it drive the browser?
- can it call the API?
- can it authenticate using the dev shortcut?
- can it share state across steps?
- can it assert deterministic seeded data?

### Phase two philosophy

When user stories exist, add archiving scenarios that map directly to the required behaviors in `Required automated coverage includes`.

## 16. Failure triage policy

When the suite fails, classify failures into one of these buckets:

1. environment boot failure
2. dataset reset failure
3. auth shortcut failure
4. browser-flow failure
5. API-contract failure
6. reporting or artifact failure
7. true app regression in the surface used by the proof suite

### Triage rule

Fix the narrowest broken layer first. Do not immediately rewrite scenarios when the real issue is reset, auth, or environment boot.

## 17. Flake prevention policy

- No automatic retries by default.
- One primary browser only.
- Deterministic dataset only.
- Fail fast on missing environment prerequisites.
- Keep scenarios small and singular.
- Avoid asserting volatile copy or incidental layout details.
- Prefer stable identifiers and observable behavior over timing-sensitive checks.
- Capture failure diagnostics only when necessary.

## 18. Rollout phases

### Phase 1: Harness foundation

- Add Qavajs-based BDD structure under `tests/e2e/`.
- Wire Playwright and memory steps.
- Add root Task integration in `Taskfile.yml`.
- Add local configuration and report output structure.

### Phase 2: Deterministic data foundation

- Create the dedicated minimal dataset.
- Create reset and preflight verification steps.
- Ensure the suite can always start from known data.

### Phase 3: Infrastructure proof scenarios

Add only the smallest scenario set needed to prove:

- local app availability
- development auth shortcut
- one browser flow
- one direct API check
- memory state sharing
- deterministic seed assertions

### Phase 4: Team workflow documentation

- Document install and run steps.
- Document the human-enforced pre-merge rule.
- Document where reports are generated and what reviewers should look for.

### Phase 5: Future feature expansion

When user stories exist, add real archiving executable specs aligned to `docs/ARCHIVING_SPECIFICATION.md`.

## 19. Risks and dependencies

### Dependencies

- Local Docker stack must remain reliable in `docker-compose.yml`.
- Development login shortcut must remain available in `auth_router.py`.
- The dedicated test dataset must stay intentionally small and maintained.
- Root Task orchestration via `Taskfile.yml` must remain cross-platform.

### Key risks

- The proof suite accidentally drifts into product verification before user stories exist.
- The dataset grows into an unmanageable second copy of the main seed.
- Cross-platform commands become shell-fragile if Task tasks rely on OS-specific scripting.
- Review enforcement becomes inconsistent because there is no CI.
- The initial neutral proof tests choose unstable app surfaces and become brittle for the wrong reasons.

### Mitigations

- Keep proof scenarios neutral and minimal.
- Keep the dataset tiny and purpose-built.
- Keep Task tasks thin and cross-platform.
- Document the local pre-merge expectation.
- Choose the most stable available public and authenticated surfaces.

## 20. ADR-style decisions

### ADR-001: Use Qavajs as the primary executable-spec framework

- Status: accepted for infrastructure phase
- Context: the spec explicitly calls for Qavajs-first coverage in `8.4 Verification Strategy`
- Decision: use Qavajs now, even though real archiving scenarios are deferred
- Consequence: future story-driven coverage can grow on the same foundation

### ADR-002: Build infrastructure before archiving scenario coverage

- Status: accepted
- Context: you do not want real archiving scenarios decided before user stories exist
- Decision: phase one proves the harness only
- Consequence: the project will not yet satisfy the full verification scope of `docs/ARCHIVING_SPECIFICATION.md`

### ADR-003: Use a simple top-level test directory, not a separate workspace

- Status: accepted
- Context: you asked for a simpler structure
- Decision: place the harness under `tests/e2e/`
- Consequence: setup is lighter, but dependency boundaries must be kept disciplined

### ADR-004: Use root Task orchestration with globally installed `@go-task/cli`

- Status: accepted
- Context: commands must work across Windows, macOS, and Linux
- Decision: root `Taskfile.yml` is the main command surface
- Consequence: Task tasks must avoid OS-specific shell assumptions

### ADR-005: Use development auth shortcuts, not full OAuth

- Status: accepted
- Context: the goal is harness proof, not identity-provider testing
- Decision: rely on the development auth surface in `auth_router.py`
- Consequence: OAuth integration remains outside this suite’s initial scope

### ADR-006: Use a dedicated minimal dataset with reset before runs

- Status: accepted
- Context: the main seed in `projojo_backend/db/seed.tql` is too broad and unstable for this purpose
- Decision: create and maintain a small purpose-built test dataset
- Consequence: there is an additional data artifact to maintain, but determinism improves substantially

### ADR-007: Keep the initial suite fast and strict

- Status: accepted
- Context: local human-enforced pre-merge checks only work if developers actually run them
- Decision: target about 5 minutes or less, with no automatic retries by default
- Consequence: the suite must stay small and focused

## 21. Minimal proof-scenario set

These are not product-behavior scenarios. They are infrastructure proofs.

1. Stack health scenario

- proves frontend and backend are reachable
- proves the dedicated dataset marker is present

1. Development-auth browser scenario

- proves a seeded user can obtain usable authenticated browser state through the development login path
- proves an authenticated page renders expected deterministic content

1. Direct API scenario

- proves Qavajs can call a stable backend endpoint and assert deterministic seeded data

1. Memory-state scenario

- proves one step can capture a seeded identifier or value and a later step can reuse it correctly

These four scenarios are enough to prove the harness without pretending to verify archiving behavior yet.

## 22. CI pipeline design

You asked not to design CI now, but you also requested this section.

### Honest recommendation

Treat CI as deferred, not ignored.

### Immediate position

- no CI implementation in phase one
- local Task-based execution is the operational truth
- reviewer-visible proof is the enforcement mechanism

### Future-ready CI shape

When CI is introduced later, it should do the minimum possible:

- boot the same Docker stack
- run the same root Task command
- publish the same report artifact
- avoid a second “CI-only” path

That future design should reuse the local workflow, not fork it.

## 23. Concrete next steps in execution order

1. Add root `Taskfile.yml` and define the cross-platform task names for setup, reset, run, and report viewing.
2. Create the top-level test structure under `tests/e2e/`.
3. Add the minimal Qavajs runtime configuration and reporting configuration.
4. Wire Playwright integration and memory-step support.
5. Create the dedicated minimal test dataset separate from `projojo_backend/db/seed.tql`.
6. Implement a deterministic reset flow against the local Docker stack and TypeDB.
7. Add a preflight dataset-verification step so failures are obvious before browser work starts.
8. Implement shared development-auth setup steps based on `auth_router.py`.
9. Implement the first four infrastructure-proof feature files and corresponding step definitions.
10. Configure saved report artifacts under `tests/e2e/reports/`.
11. Document the root command workflow and the reviewer-proof expectation in a short guide such as `docs/TESTING_INFRASTRUCTURE.md`.
12. Validate runtime on at least one Windows environment and one Unix-like environment before calling the foundation complete.
13. Only after that, begin drafting user-story-driven archiving feature files that map to the required behaviors in `docs/ARCHIVING_SPECIFICATION.md`.

## Bottom line

The right first move is not to write archiving tests yet. It is to create a small, deterministic, cross-platform Qavajs BDD harness under `tests/e2e/`, runnable through root `Taskfile.yml` tasks, proven by four neutral infrastructure scenarios, and intentionally designed so later user stories can expand it into the full verification model required by `docs/ARCHIVING_SPECIFICATION.md`. This plan is implementation-ready for the infrastructure phase.