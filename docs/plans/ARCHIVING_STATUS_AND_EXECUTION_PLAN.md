# Archiving Status and Execution Plan

> **Purpose:** Single kickoff document for all future Archiving work in Projojo.
> 
> Use this file instead of redoing backlog/spec/code analysis every time.

---

## 1. Source of truth

This plan consolidates:

- `docs/plans/ARCHIVING_SPECIFICATION.md`
- `docs/plans/ARCHIVING_REUSABLE_CODE.md`
- GitHub epic and task backlog for Archiving
- Current codebase inspection on `next-ui`

Primary GitHub epic:

- **#311 — Archiving System**

Related story issues:

- **#312 — ARCH-story-001 — Archiving Foundations**
- **#313 — ARCH-story-002 — Archive Operations**
- **#314 — ARCH-story-003 — Restore Operations**
- **#315 — ARCH-story-004 — Archive Management UX**
- **#316 — ARCH-story-005 — Role-Specific Archive Experience**
- **#317 — ARCH-story-006 — Archive Readiness and Verification**

---

## 2. Current status snapshot

### High-confidence assessment

- **ARCH-task-017** is **implemented, committed, pushed, and moved to AI Review**.
- **ARCH-task-019** is **verified and moved to AI Review**, but **not safely pushable as a standalone change yet**.
- **ARCH-task-002** has now been **advanced further locally** with new archive request/response models in `projojo_backend/domain/models/archive.py` and partial backend route contract wiring.
- Archiving as a whole is **partially scaffolded**, but the full target spec is **not yet complete**.

### Current task status overview

| Task | GitHub | Status | Short assessment |
|---|---:|---|---|
| ARCH-task-001 | #318 | Done-ish | Schema now uses archive metadata fields. |
| ARCH-task-002 | #319 | In progress | Archive model contract is upgraded and partially wired through backend route responses, but preview/restore flows and repository/list contract migration remain. |
| ARCH-task-003 | #320 | Partial | Draft business path seems removed, but legacy hard-delete/archive-adjacent remnants still need cleanup. |
| ARCH-task-004 | #321 | Partial | Many archive filters exist, but cleanup and consistency work remains. |
| ARCH-task-005 | #322 | Not done | No complete edit-locking/archive guard pass yet. |
| ARCH-task-006 | #323 | Partial | Business archive endpoint exists, but no preview/cascade/spec-complete execution. |
| ARCH-task-007 | #324 | Partial | Project archive exists, but still old semantics and permissions. |
| ARCH-task-008 | #325 | Partial | Task archive exists, but not preview-first/spec-complete. |
| ARCH-task-009 | #326 | Not done | Business restore preview/selective restore not implemented. |
| ARCH-task-010 | #327 | Not done | Project restore blocked-parent preview/execute not implemented. |
| ARCH-task-011 | #328 | Not done | Task restore blocked-parent preview/execute not implemented. |
| ARCH-task-012 | #329 | Partial | Archived listing endpoints exist, but missing full parent-context contract. |
| ARCH-task-013 | #330 | Partial | Teacher archived sections exist, but restore UX is still direct/non-preview. |
| ARCH-task-014 | #331 | Partial | Archive reason UI exists, but no real backend preview-driven modal flow yet. |
| ARCH-task-015 | #332 | Not done | Restore modal with selective descendants not implemented. |
| ARCH-task-016 | #333 | Not done | Student recently archived dashboard flow not complete. |
| ARCH-task-017 | #334 | AI Review | Implemented, isolated, committed, pushed, and moved to AI Review. |
| ARCH-task-018 | #335 | Not done | Multi-business supervisor switcher not found. |
| ARCH-task-019 | #336 | AI Review (not pushed) | Seed scenarios are present, but they are entangled with broader unstaged schema/backend work. |
| ARCH-task-020 | #337 | Not done | Final cleanup/verification gate not complete. |

### Current checkpoint summary

- **ARCH-task-017 / #334 — Supervisor Login Block for Fully Archived Accounts**
  - moved to **AI Review**
  - committed as:
    - `0973120` — `ARCH-017: block supervisor login without active businesses`
  - pushed to:
    - `origin/next-UI_Archive_Feature`

- **ARCH-task-019 / #336 — Seed Data for Archive Scenarios**
  - moved to **AI Review**
  - verified locally
  - **not committed/pushed separately yet** because it currently depends on broader unstaged schema/backend changes

- **ARCH-task-002 / #319 — Domain Models and Datetime Serialization**
  - continued locally
  - `projojo_backend/domain/models/archive.py` was upgraded toward the target spec with:
    - grouped `RestoreSelection`
    - archive preview/restore preview response models
    - affected-entity models
    - archived listing item models
  - backend contract wiring now also includes:
    - archive model exports via `projojo_backend/domain/models/__init__.py`
    - typed archived-list route response models in business/project/task routers
    - typed archive/restore action response models in business/task restore flows and business/task archive flows
    - typed restore action response model for project restore

---

## 2.1 Work diary / handoff checkpoint

This file should now be treated as the **Archiving work diary**.

When a future Archiving task starts, I should:

1. read this file first
2. trust the latest checkpoint here over memory
3. continue from the **next task listed in the “Next recommended active tasks” section**
4. update this file again before stopping if the checkpoint changes

### Latest confirmed checkpoint

**Confirmed completed in this session:**

- created this reusable Archiving plan file
- verified GitHub board tooling works through **Git Bash**
- moved **#334** and **#336** to **AI Review**
- isolated, committed, and pushed **ARCH-017**
- started **ARCH-002** model-contract work in `projojo_backend/domain/models/archive.py`
- continued **ARCH-002** by wiring the new archive models into backend exports and several archive/list/restore route response contracts
- verified the touched backend files compile with `python -m py_compile`

**Confirmed not yet done in this session:**

- ARCH-019 is **not safely isolated for standalone push yet**
- ARCH-002 is **started but not finished**

### Next recommended active tasks

If a new task begins and no new instruction overrides this plan, the default next priorities are:

1. **ARCH-task-019 / #336**
   - isolate the minimum safe schema + seed slice
   - commit it cleanly
   - push it
   - keep board state aligned

2. **ARCH-task-002 / #319**
   - continue migrating routes/repositories to the new archive request/response model contract
   - remove remaining mismatches between placeholder models and spec-driven models

If both are possible, do them in that order:

```text
ARCH-019 isolation/push → ARCH-002 continuation
```

---

## 3. Current code references

### Backend files most relevant to Archiving

- `projojo_backend/db/schema.tql`
- `projojo_backend/db/seed.tql`
- `projojo_backend/domain/models/archive.py`
- `projojo_backend/domain/models/business.py`
- `projojo_backend/domain/models/project.py`
- `projojo_backend/domain/models/task.py`
- `projojo_backend/domain/repositories/archive_repository.py`
- `projojo_backend/domain/repositories/business_repository.py`
- `projojo_backend/domain/repositories/project_repository.py`
- `projojo_backend/domain/repositories/task_repository.py`
- `projojo_backend/domain/repositories/user_repository.py`
- `projojo_backend/domain/repositories/portfolio_repository.py` ← legacy/archive-adjacent risk area
- `projojo_backend/routes/business_router.py`
- `projojo_backend/routes/project_router.py`
- `projojo_backend/routes/task_router.py`
- `projojo_backend/service/auth_service.py`

### Frontend files most relevant to Archiving

- `projojo_frontend/src/services.js`
- `projojo_frontend/src/pages/TeacherPage.jsx`
- `projojo_frontend/src/auth/AuthCallback.jsx`
- `projojo_frontend/src/components/ProjectDetails.jsx`
- `projojo_frontend/src/components/Task.jsx`
- `projojo_frontend/src/components/ProjectActionModal.jsx` ← legacy/delete/archive mixed semantics risk
- `projojo_frontend/src/components/ProjectCard.jsx`
- `projojo_frontend/src/components/ProjectDashboard.jsx`
- `projojo_frontend/src/pages/PublicDiscoveryPage.jsx`
- Portfolio components using archive-related display state:
  - `projojo_frontend/src/components/PortfolioItem.jsx`
  - `projojo_frontend/src/components/PortfolioList.jsx`
  - `projojo_frontend/src/components/PortfolioRoadmap.jsx`

### Current implementation findings worth remembering

1. `archive_repository.py` currently archives/restores **root entities only**.
2. `archive.py` now contains a much stronger spec-oriented archive/restore model contract, but routes and repositories still need to migrate to it.
3. `TeacherPage.jsx` already has archived business/project/task sections.
4. `AuthCallback.jsx` already routes blocked supervisors to `/publiek`.
5. `auth_service.py` already checks `supervisor_has_active_business(...)`.
6. `seed.tql` already contains strong archive scenario coverage.
7. `portfolio_repository.py` still contains legacy archive concepts and must be treated carefully during cleanup.

---

## 4. GitHub backlog map

### Epic

- **#311 — Archiving System**

### Stories

- **#312 — ARCH-story-001 — Archiving Foundations**
- **#313 — ARCH-story-002 — Archive Operations**
- **#314 — ARCH-story-003 — Restore Operations**
- **#315 — ARCH-story-004 — Archive Management UX**
- **#316 — ARCH-story-005 — Role-Specific Archive Experience**
- **#317 — ARCH-story-006 — Archive Readiness and Verification**

### Tasks

- **#318 — ARCH-task-001 — Schema Migration: Archive Attributes and Supervisor Cardinality**
- **#319 — ARCH-task-002 — Domain Models and Datetime Serialization**
- **#320 — ARCH-task-003 — Legacy Feature Removal: Draft Business, Hard-Delete, Portfolio Snapshot**
- **#321 — ARCH-task-004 — Active Query Archive Filtering and Count Accuracy**
- **#322 — ARCH-task-005 — Edit-Locking and Mutation Blocking for Archived Entities**
- **#323 — ARCH-task-006 — Business Archive: Preview and Execute with Cascade**
- **#324 — ARCH-task-007 — Project Archive: Preview and Execute with Cascade**
- **#325 — ARCH-task-008 — Task Archive: Preview and Execute with Cascade**
- **#326 — ARCH-task-009 — Business Restore: Preview, Selective Descendants, and Execute**
- **#327 — ARCH-task-010 — Project Restore: Preview, Blocked-Parent Check, and Execute**
- **#328 — ARCH-task-011 — Task Restore: Preview, Blocked-Parent Check, and Execute**
- **#329 — ARCH-task-012 — Archived Listing Endpoints with Parent Context**
- **#330 — ARCH-task-013 — Teacher Page: Archived Views for Businesses, Projects, and Tasks**
- **#331 — ARCH-task-014 — Archive Modal with Backend Preview**
- **#332 — ARCH-task-015 — Restore Modal with Selective Descendants**
- **#333 — ARCH-task-016 — Student Dashboard: Recently Archived Registrations**
- **#334 — ARCH-task-017 — Supervisor Login Block for Fully Archived Accounts**
- **#335 — ARCH-task-018 — Multi-Business Supervisor Switcher**
- **#336 — ARCH-task-019 — Seed Data for Archive Scenarios**
- **#337 — ARCH-task-020 — Verification and Final Cleanup**

---

## 5. Recommended implementation order

This is the preferred order for future Archiving work.

### Phase 1 — Foundations

1. **ARCH-task-002** — Domain Models and Datetime Serialization
2. **ARCH-task-003** — Legacy Feature Removal
3. **ARCH-task-004** — Active Query Archive Filtering and Count Accuracy
4. **ARCH-task-005** — Edit-Locking and Mutation Blocking

### Phase 2 — Archive backend

5. **ARCH-task-006** — Business Archive: Preview and Execute with Cascade
6. **ARCH-task-007** — Project Archive: Preview and Execute with Cascade
7. **ARCH-task-008** — Task Archive: Preview and Execute with Cascade

### Phase 3 — Restore backend

8. **ARCH-task-009** — Business Restore: Preview, Selective Descendants, and Execute
9. **ARCH-task-010** — Project Restore: Preview, Blocked-Parent Check, and Execute
10. **ARCH-task-011** — Task Restore: Preview, Blocked-Parent Check, and Execute

### Phase 4 — Teacher archive management UX

11. **ARCH-task-012** — Archived Listing Endpoints with Parent Context
12. **ARCH-task-013** — Teacher Page Archived Views
13. **ARCH-task-014** — Archive Modal with Backend Preview
14. **ARCH-task-015** — Restore Modal with Selective Descendants

### Phase 5 — Role-specific UX

15. **ARCH-task-016** — Student Dashboard Recently Archived
16. **ARCH-task-018** — Multi-Business Supervisor Switcher
17. **ARCH-task-017** — Final verification/push/board housekeeping if still needed

### Phase 6 — Release gate

18. **ARCH-task-020** — Verification and Final Cleanup

---

## 6. Workflow reminders for future Archiving tasks

## 6.1 Mandatory implementation workflow

For every Archiving task:

1. Confirm task scope against this file and the GitHub issue.
2. Inspect relevant files before editing.
3. Implement the task against the target spec, not against current partial behavior.
4. Run relevant checks/tests.
5. **Commit locally** with a task-specific message.
6. **Update the project board status** for the issue.
7. If implementation is ready, push and prepare PR/review handoff.

## 6.2 Git workflow reminder

Do **not** leave Archiving work uncommitted after a meaningful implementation step.

Preferred pattern:

```bash
git add <changed-files>
git commit -m "ARCH-XXX: short clear summary"
```

Examples:

```bash
git commit -m "ARCH-017: block supervisor login without active businesses"
git commit -m "ARCH-019: add archive seed scenarios for restore and collision cases"
git commit -m "ARCH-006: add business archive preview and cascade execution"
```

## 6.3 Project board reminder

Use the project board workflow actively during implementation.

Preferred lifecycle:

```text
Backlog → Ready → In Progress → AI Review → Review → Done
```

Rules:

- Move to **In Progress** when implementation starts.
- Move to **AI Review** when code is implemented and locally validated.
- Move to **Review** when ready for human review.
- Move to **Done** only after final acceptance.

## 6.4 GitHub issue manager reminder

Use the bundled workflow script rather than ad-hoc GitHub mutations.

Canonical syntax:

```bash
bash .agents/skills/github-issue-manager/scripts/github-issue-manager.sh help
```

### Windows/Git Bash note

On this machine, the safe working path is:

```bash
C:\Progra~1\Git\git-bash.exe
```

The bundled issue-manager script currently has CRLF line endings, so the reliable invocation is:

```bash
C:\Progra~1\Git\git-bash.exe -lc "tr -d '\r' < .agents/skills/github-issue-manager/scripts/github-issue-manager.sh | bash -s -- help"
```

Status update example that is known to work:

```bash
C:\Progra~1\Git\git-bash.exe -lc "tr -d '\r' < .agents/skills/github-issue-manager/scripts/github-issue-manager.sh | bash -s -- update-status --issue-number 334 --status 'AI Review'"
```

This workaround should be preferred unless the script file is normalized to LF.

## 6.5 MCP git workflow reminder

When I need clean commit isolation, I should prefer the MCP git tools for staging/inspection:

- `git_status` to inspect working tree
- `git_diff_unstaged` / `git_diff_staged` to verify slices
- `git_add` to stage only the intended files
- `git_commit` to make a task-specific commit

This worked successfully for **ARCH-017**.

### Known-good ARCH-017 workflow used

1. inspect unstaged diff
2. stage only:
   - `projojo_backend/domain/repositories/user_repository.py`
   - `projojo_backend/service/auth_service.py`
   - `projojo_frontend/src/auth/AuthCallback.jsx`
3. commit via MCP git with message:
   - `ARCH-017: block supervisor login without active businesses`
4. push branch with:

```bash
git push origin next-UI_Archive_Feature
```

### Important reminder to myself

Before committing or pushing, I should always ask:

- Is this change isolated to one ARCH task?
- Does it depend on broader unstaged work?
- Can I safely stage only the intended files?

If **no**, do not push yet. Document the dependency in this file.

Update status examples:

```bash
bash .agents/skills/github-issue-manager/scripts/github-issue-manager.sh update-status --issue-number 334 --status "AI Review"
bash .agents/skills/github-issue-manager/scripts/github-issue-manager.sh update-status --issue-number 336 --status "AI Review"
```

### Important reminder to myself

When implementing Archiving tasks, I should:

- **commit after meaningful progress**
- **update the issue status on the project board**
- **keep the issue state aligned with reality**
- **not leave finished work sitting in In Progress**

### Immediate reminder

At the latest checkpoint:

- **ARCH-task-017 / #334** has already been committed, pushed, and moved to **AI Review**
- **ARCH-task-019 / #336** has already been moved to **AI Review**, but still needs safe change isolation before commit/push
- **ARCH-task-002 / #319** is the current active implementation task already started locally

That means the next implementation/release housekeeping step should be:

1. isolate and safely commit/push **ARCH-019** if possible
2. continue **ARCH-002** route/repository migration work
3. update this file again when the checkpoint changes

---

## 7. Task-by-task acceptance criteria and execution notes

The sections below intentionally copy the essential acceptance criteria into one place.

---

## ARCH-task-001 — #318
### Schema Migration: Archive Attributes and Supervisor Cardinality

**Status:** Done-ish

**Goal**

Replace boolean archive state with archive metadata fields in TypeDB schema and support multi-business supervisors.

**Relevant files**

- `projojo_backend/db/schema.tql`

**Acceptance criteria**

- Remove `isArchived` boolean from schema.
- Add `archivedAt`, `archivedBy`, `archivedReason` attribute declarations.
- Add archive ownership to all five archivable types:
  - `business`
  - `project`
  - `task`
  - `supervisor`
  - `registersForTask`
- Change supervisor `plays manages:supervisor` cardinality to `@card(1..)`.
- Schema loads successfully.
- Non-archivable types do not own archive attributes.

**Reminder**

Treat this as foundational; if schema changes drift, many downstream tasks break.

---

## ARCH-task-002 — #319
### Domain Models and Datetime Serialization

**Status:** In progress

**Goal**

Align Pydantic/API models and repository mappings with the archive metadata model.

**Relevant files**

- `projojo_backend/domain/models/archive.py`
- `projojo_backend/domain/models/business.py`
- `projojo_backend/domain/models/project.py`
- `projojo_backend/domain/models/task.py`
- `projojo_backend/domain/repositories/business_repository.py`
- `projojo_backend/domain/repositories/project_repository.py`
- `projojo_backend/domain/repositories/task_repository.py`
- `projojo_backend/domain/repositories/portfolio_repository.py`

**Acceptance criteria**

- Business, project, task, and supervisor models expose:
  - `archived_at`
  - `archived_by`
  - `archived_reason`
- No `is_archived` or `isArchived` field remains in API/domain models.
- Datetime serialization keeps timezone information.
- Repository mappers map all archive fields correctly.
- Define explicit request models for archive/restore calls.
- Define explicit preview/list response models for archive/restore/list endpoints.
- HTTP payload naming is consistent snake_case.

**Current gap**

This has now improved:

- `projojo_backend/domain/models/archive.py` was upgraded with:
  - `RestoreSelection`
  - `ArchivePreviewResponse`
  - `RestorePreviewResponse`
  - affected-entity models
  - archived listing item models
- `projojo_backend/domain/models/__init__.py` now exports the newer archive contract models
- archived business/project/task routes now declare dedicated archived-list response models
- several archive/restore routes now return explicit archive action response models instead of ad-hoc response dicts

Remaining gap:

- project archive still uses older warning/notification semantics instead of the spec-aligned preview contract
- restore preview/selective restore request/response flow is not wired yet
- repository methods still do not provide the full preview/list parent-context contract required by later archive UX tasks
- legacy `is_archived` / `isArchived` semantics still exist in adjacent non-archiving areas such as portfolio-related code

---

## ARCH-task-003 — #320
### Legacy Feature Removal: Draft Business, Hard-Delete, Portfolio Snapshot

**Status:** Partial

**Goal**

Remove legacy behaviors that conflict with the archiving specification.

**Relevant files**

- `projojo_backend/routes/business_router.py`
- `projojo_backend/domain/repositories/business_repository.py`
- `projojo_backend/domain/repositories/portfolio_repository.py`
- `projojo_frontend/src/pages/TeacherPage.jsx`
- `projojo_frontend/src/components/ProjectActionModal.jsx`
- `projojo_frontend/src/services.js`

**Acceptance criteria**

- Remove draft business creation from backend.
- Remove draft business creation UI from frontend.
- Remove draft/publication wording from UI.
- Remove hard-delete endpoints for archivable entities.
- Remove or narrow portfolio snapshotting if it only exists for hard-delete.
- Remove orphaned frontend references to removed features.
- Keep normal non-archive functionality working.

**Current gap**

Legacy delete/archive mixed behavior still appears in frontend and portfolio-related code.

---

## ARCH-task-004 — #321
### Active Query Archive Filtering and Count Accuracy

**Status:** Partial

**Goal**

Ensure archived data is filtered at the query layer and excluded from counts and active-use flows.

**Relevant files**

- `projojo_backend/domain/repositories/business_repository.py`
- `projojo_backend/domain/repositories/project_repository.py`
- `projojo_backend/domain/repositories/task_repository.py`
- `projojo_backend/domain/repositories/user_repository.py`
- `projojo_backend/domain/repositories/portfolio_repository.py`

**Acceptance criteria**

- Business queries filter archived businesses in TypeQL.
- Project queries filter archived projects and archived parent businesses.
- Task queries filter archived tasks, archived parent projects, and archived businesses.
- Registration counts exclude archived registrations.
- Student active registrations exclude archived registrations.
- Supervisor registration review excludes archived registrations.
- Duplicate registration checks exclude archived registrations.
- Skill-match calculations exclude archived entities.
- Public discovery excludes archived entities.
- `check_project_exists` excludes archived projects.

**Current gap**

There is good progress, but cleanup and cross-repository consistency are not yet guaranteed.

---

## ARCH-task-005 — #322
### Edit-Locking and Mutation Blocking for Archived Entities

**Status:** Not done

**Goal**

Block all mutations that touch archived entities or archived parent chains.

**Relevant files**

- all backend mutation routes
- likely new shared archive guard/service
- frontend mutation entry points

**Acceptance criteria**

- Cannot update archived businesses.
- Cannot create project under archived business.
- Cannot update archived projects or projects under archived businesses.
- Cannot set visibility/impact on archived project chains.
- Cannot create task under archived project chain.
- Cannot update archived task chains.
- Cannot create registration on archived task chain.
- Cannot cancel/accept/reject archived registration chains.
- Backend returns consistent `409 Conflict` with Dutch error messaging.
- Frontend disables or hides invalid actions.

**Reminder**

This must be systematic, not one-off.

---

## ARCH-task-006 — #323
### Business Archive: Preview and Execute with Cascade

**Status:** Partial

**Goal**

Add preview-first business archive with full cascade.

**Relevant files**

- `projojo_backend/routes/business_router.py`
- `projojo_backend/domain/repositories/archive_repository.py`

**Acceptance criteria**

- `PATCH /businesses/{id}/archive` supports preview with `confirm=false`.
- Preview returns impacted projects, tasks, registrations, supervisors.
- Preview does not mutate data.
- Execute archives business and descendants atomically.
- Cascade applies shared `archivedAt`, `archivedBy`, `archivedReason`.
- Supervisor preview marks `will_be_archived` correctly.
- Teacher-only permission.
- Reason required and validated.
- 404 for missing entity.
- Idempotent execute.
- Preview on archived entity still behaves safely.
- Transaction rollback on failure.

**Current gap**

Current repository logic only archives the root business.

---

## ARCH-task-007 — #324
### Project Archive: Preview and Execute with Cascade

**Status:** Partial

**Goal**

Add preview-first project archive with cascade to tasks and registrations.

**Relevant files**

- `projojo_backend/routes/project_router.py`
- `projojo_backend/domain/repositories/archive_repository.py`
- `projojo_backend/domain/repositories/project_repository.py`

**Acceptance criteria**

- Preview returns impacted tasks and registrations.
- Execute archives project, tasks, registrations atomically.
- Shared archive metadata across cascade.
- No supervisor archiving in project cascade.
- Teacher-only permission.
- Reason required.
- 404 when missing.
- Idempotent execute.
- Already archived descendants are skipped safely.

**Current gap**

Current route still reflects older project-warning semantics and supervisor access.

---

## ARCH-task-008 — #325
### Task Archive: Preview and Execute with Cascade

**Status:** Partial

**Goal**

Add preview-first task archive with cascade to registrations.

**Relevant files**

- `projojo_backend/routes/task_router.py`
- `projojo_backend/domain/repositories/archive_repository.py`
- `projojo_backend/domain/repositories/task_repository.py`

**Acceptance criteria**

- Preview returns impacted registrations.
- Execute archives task and registrations atomically.
- Shared archive metadata across cascade.
- Teacher-only permission.
- Reason required.
- 404 when missing.
- Idempotent execute.
- Already archived registrations are skipped safely.

**Current gap**

Task archive exists, but not with the target preview/cascade contract.

---

## ARCH-task-009 — #326
### Business Restore: Preview, Selective Descendants, and Execute

**Status:** Not done

**Goal**

Implement business restore preview with metadata-based preselection and selective descendant restore.

**Relevant files**

- `projojo_backend/routes/business_router.py`
- `projojo_backend/domain/repositories/archive_repository.py`

**Acceptance criteria**

- `PATCH /businesses/{id}/restore` supports preview.
- Preview returns root plus archived descendants.
- Matching descendants are preselected by exact metadata match.
- Different metadata descendants remain visible but unselected.
- Execute restores root and selected descendants only.
- Root is always restored and not deselectable.
- Dependency-aware selection enforced.
- Name collisions are resolved.
- `409` if entity already active.
- Teacher-only permission.
- 404 when missing.
- Transaction rollback on failure.

---

## ARCH-task-010 — #327
### Project Restore: Preview, Blocked-Parent Check, and Execute

**Status:** Not done

**Goal**

Implement project restore with preview and parent-business blocking rules.

**Relevant files**

- `projojo_backend/routes/project_router.py`
- `projojo_backend/domain/repositories/project_repository.py`

**Acceptance criteria**

- Restore blocked if parent business is archived.
- Preview also indicates blocked state.
- Preview returns archived tasks and registrations only.
- Matching descendants are preselected.
- Execute restores project and selected descendants.
- Dependency-aware selection enforced.
- Name collision handling on restore.
- `409` for already active.
- Teacher-only permission.
- 404 when missing.

---

## ARCH-task-011 — #328
### Task Restore: Preview, Blocked-Parent Check, and Execute

**Status:** Not done

**Goal**

Implement task restore with preview and blocked parent-chain rules.

**Relevant files**

- `projojo_backend/routes/task_router.py`
- `projojo_backend/domain/repositories/task_repository.py`

**Acceptance criteria**

- Restore blocked if parent project is archived.
- Restore blocked if grandparent business is archived.
- Preview returns archived registrations only.
- Matching registrations are preselected.
- Execute restores task and selected registrations.
- Name collision handling.
- Standard `409` / `404` / `403` error behavior.

---

## ARCH-task-012 — #329
### Archived Listing Endpoints with Parent Context

**Status:** Partial

**Goal**

Provide archive inventory endpoints that support teacher archive management UX.

**Relevant files**

- `projojo_backend/routes/business_router.py`
- `projojo_backend/routes/project_router.py`
- `projojo_backend/routes/task_router.py`
- repository methods behind them

**Acceptance criteria**

- `GET /businesses/archived` returns archive metadata.
- `GET /projects/archived` returns archive metadata + parent business context.
- `GET /tasks/archived` returns archive metadata + parent project/business context.
- Teacher-only access.
- Empty lists return empty arrays.
- Dedicated Pydantic response models are used.
- Sorted by archive date descending, then name ascending.

**Current gap**

Endpoints exist, but parent-blocking context is not yet complete.

---

## ARCH-task-013 — #330
### Teacher Page: Archived Views for Businesses, Projects, and Tasks

**Status:** Partial

**Goal**

Finish teacher archive inventory UI.

**Relevant files**

- `projojo_frontend/src/pages/TeacherPage.jsx`
- `projojo_frontend/src/services.js`

**Acceptance criteria**

- Archived businesses section shows metadata.
- Archived projects section shows metadata.
- Archived tasks section shows metadata.
- Blocked restore shows disabled button with explanation.
- Blocked restore for tasks reflects parent/project/business archive state.
- Restore action opens preview modal rather than executing directly.
- Archive state uses `archived_at` presence only.
- Preserve current styling patterns.
- Support loading/error/empty states.

**Current gap**

Sections exist, but restore is still direct and blocked-state logic is missing.

---

## ARCH-task-014 — #331
### Archive Modal with Backend Preview

**Status:** Partial

**Goal**

Replace hardcoded archive confirmations with preview-driven modal UX.

**Relevant files**

- `projojo_frontend/src/pages/TeacherPage.jsx`
- `projojo_frontend/src/components/ProjectDetails.jsx`
- `projojo_frontend/src/components/Task.jsx`
- new `ArchiveModal` component likely needed
- `projojo_frontend/src/services.js`

**Acceptance criteria**

- Archive action visible only to teachers.
- Opening modal fetches backend preview.
- Preview shows affected entities from backend response.
- Reason field required before confirmation.
- Confirm executes archive with `confirm=true` and `archived_reason`.
- Errors render inside modal without closing it.
- Preview failure disables confirmation.
- Cancel closes without side effects.
- No dishonest notification claims.
- Prefer one reusable modal component.

**Current gap**

Reason fields exist in places, but real preview-driven flow does not.

---

## ARCH-task-015 — #332
### Restore Modal with Selective Descendants

**Status:** Not done

**Goal**

Build restore preview UI with intelligent preselection and dependency-aware descendant selection.

**Relevant files**

- `projojo_frontend/src/pages/TeacherPage.jsx`
- likely new `RestoreModal.jsx`
- `projojo_frontend/src/services.js`

**Acceptance criteria**

- Modal opens and fetches restore preview.
- Root entity is shown as always restored.
- Preselected descendants start checked.
- Non-preselected descendants start unchecked.
- Dependency enforcement prevents invalid selections.
- Re-selecting parents re-enables children.
- Blocked descendants show disabled state and reason.
- Confirm executes selective restore.
- Descendants grouped by type.
- Empty descendant state handled.
- Errors handled without closing modal.
- Cancel resets cleanly.
- No dishonest notification claims.

---

## ARCH-task-016 — #333
### Student Dashboard: Recently Archived Registrations

**Status:** Not done

**Goal**

Expose recently archived registrations to students as read-only context.

**Relevant files**

- likely student route/repository files
- `projojo_frontend/src/pages/StudentDashboard.jsx`
- `projojo_frontend/src/services.js`

**Acceptance criteria**

- Backend returns recently archived registrations for current student.
- 30-day window computed from backend time.
- Student sees only own archived registrations.
- Dashboard shows “Recent gearchiveerd” section.
- Section is read-only.
- Empty state handled.
- Styling matches dashboard conventions.
- Archived registrations remain excluded from active registration lists.

---

## ARCH-task-017 — #334
### Supervisor Login Block for Fully Archived Accounts

**Status:** AI Review / pushed

**Relevant files**

- `projojo_backend/service/auth_service.py`
- `projojo_backend/domain/repositories/user_repository.py`
- `projojo_frontend/src/auth/AuthCallback.jsx`

**Acceptance criteria**

- Login succeeds if supervisor has at least one active business.
- Login blocked if all businesses are archived.
- Login blocked if supervisor has no businesses.
- Frontend shows error and offers discovery page continuation.
- No session created for blocked supervisors.
- Check is efficient.

**Current state note**

- `auth_service.py` now checks `supervisor_has_active_business(existing_user.id)`.
- `AuthCallback.jsx` routes blocked users to `/publiek`.
- `user_repository.py` now provides `supervisor_has_active_business(...)`.
- committed as:
  - `0973120` — `ARCH-017: block supervisor login without active businesses`
- pushed to `origin/next-UI_Archive_Feature`
- issue **#334** moved to **AI Review**

---

## ARCH-task-018 — #335
### Multi-Business Supervisor Switcher

**Status:** Not done

**Goal**

Support visible switching between active businesses for supervisors.

**Relevant files**

- supervisor dashboard frontend
- relevant supervisor endpoint/repository backend

**Acceptance criteria**

- Backend returns all active businesses for supervisor.
- Visible switcher shown for 2+ active businesses.
- Switching updates dashboard context without re-login.
- Single-business supervisors see no unnecessary switcher.
- Archived businesses disappear from switcher.
- Styling follows neumorphic conventions.

---

## ARCH-task-019 — #336
### Seed Data for Archive Scenarios

**Status:** AI Review / verified locally / not yet pushed separately

**Relevant files**

- `projojo_backend/db/schema.tql`
- `projojo_backend/db/seed.tql`

**Acceptance criteria**

- Archived business with archived descendants exists.
- Active business with mixed archived/active descendants exists.
- Multi-business supervisor with one active and one archived business exists.
- Fully archived supervisor exists.
- Student with active and recently archived registrations exists.
- Restore preview cases include matching and non-matching metadata.
- Name collision restore case exists.
- Seed data loads correctly.
- Seed scenarios are documented/stable.

**Current state note**

- `seed.tql` already contains archived metadata, independent archive seeds, recent/older archived registrations, and collision scenarios.
- schema changes for archive metadata ownership are also present in `schema.tql`.
- issue **#336** has been moved to **AI Review**.

**Important push note**

Do **not** assume ARCH-019 is ready for standalone push just because the seed data looks complete.

Current blocker:

- ARCH-019 currently sits inside a broader unstaged archive-change set including schema, repositories, routes, frontend, and new files.
- It must be isolated before commit/push.

Default next move:

1. inspect `schema.tql` + `seed.tql` dependency boundaries
2. determine whether ARCH-019 can be committed as a clean schema+seed slice
3. if yes, commit and push
4. if no, document the dependency and continue ARCH-002

---

## ARCH-task-020 — #337
### Verification and Final Cleanup

**Status:** Not done

**Goal**

Provide the release gate proving Archiving is complete and coherent.

**Relevant files**

- all archiving code paths
- `tests/e2e/`
- portfolio/archive crossover code

**Acceptance criteria**

- No `isArchived` boolean remains in codebase for archiving contract.
- No hard-delete endpoints remain.
- No draft business creation path remains.
- No `end_date` used as archive state source.
- E2E coverage for archive preview.
- E2E coverage for archive execute.
- E2E coverage for restore preview/selective restore.
- E2E coverage for blocked child restore.
- E2E coverage for student recently archived.
- E2E coverage for supervisor archive outcomes.
- E2E coverage for public discovery/count filtering.
- UI copy is honest about notifications.
- Stale draft/publication wording removed.
- HTTP archive payload naming is consistent.

---

## 8. How to start the next Archiving task

When starting a future Archiving task, use this checklist:

1. Open this file first.
2. Identify the task section.
3. Confirm:
   - current status
   - relevant files
   - acceptance criteria
   - prerequisite dependencies
4. Inspect current code before editing.
5. Implement against the spec, not current partial behavior.
6. Run local verification.
7. Commit with `ARCH-XXX` message.
8. Update project board status.
9. Push when ready.
10. Update this file with the latest checkpoint before stopping.

Suggested kickoff prompt:

> “Use `docs/plans/ARCHIVING_STATUS_AND_EXECUTION_PLAN.md` as the Archiving work diary and kickoff doc. Continue from the latest checkpoint, prioritize ARCH-019 isolation/push and then ARCH-002 continuation unless I explicitly say otherwise, and update the file again before you stop.”

---

## 9. Final reminder to myself

For Archiving work, I should not just implement code. I should also:

- keep the GitHub task status current
- commit meaningful steps locally
- push ready work instead of letting it sit
- align implementation with the exact acceptance criteria in this file
- treat this file as the default Archiving handoff reference
- treat this file as the canonical **work diary** for where Archiving work was left off
- assume the next default tasks are **ARCH-019 first**, then **ARCH-002**, unless the user overrides that
