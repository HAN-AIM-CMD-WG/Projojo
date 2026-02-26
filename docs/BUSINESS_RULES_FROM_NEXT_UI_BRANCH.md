# Projojo Business Rules – Full Stack Analysis

## Table of Contents
- [Projojo Business Rules – Full Stack Analysis](#projojo-business-rules--full-stack-analysis)
  - [Table of Contents](#table-of-contents)
  - [Scope \& Method](#scope--method)
  - [Authoritative Domain Model (TypeDB)](#authoritative-domain-model-typedb)
  - [1) Constraints](#1-constraints)
    - [C-001 Skill identity and mandatory attributes](#c-001-skill-identity-and-mandatory-attributes)
    - [C-002 Registration relation cardinality and required content](#c-002-registration-relation-cardinality-and-required-content)
    - [C-003 Role-based authorization and ownership gating](#c-003-role-based-authorization-and-ownership-gating)
    - [C-004 JWT protection boundary with public route exceptions](#c-004-jwt-protection-boundary-with-public-route-exceptions)
    - [C-005 Task capacity (no overbooking)](#c-005-task-capacity-no-overbooking)
    - [C-006 Duplicate registration prevention](#c-006-duplicate-registration-prevention)
    - [C-007 Task-skill mutation lock when registrations exist](#c-007-task-skill-mutation-lock-when-registrations-exist)
    - [C-008 Project archive/delete impact confirmation](#c-008-project-archivedelete-impact-confirmation)
    - [C-009 Project hard-delete restricted to teacher and portfolio snapshotting](#c-009-project-hard-delete-restricted-to-teacher-and-portfolio-snapshotting)
    - [C-010 Image/file safety constraints](#c-010-imagefile-safety-constraints)
  - [2) Derivations \& Inferences](#2-derivations--inferences)
    - [D-001 Project lifecycle status inference](#d-001-project-lifecycle-status-inference)
    - [D-002 Registration status/timeline inference](#d-002-registration-statustimeline-inference)
    - [D-003 Student active/pending work-set inference](#d-003-student-activepending-work-set-inference)
    - [D-004 Skill-match inference (student vs task/project)](#d-004-skill-match-inference-student-vs-taskproject)
    - [D-005 Top-skill inference for organizations/projects](#d-005-top-skill-inference-for-organizationsprojects)
    - [D-006 Dashboard metric inference](#d-006-dashboard-metric-inference)
    - [D-007 Theme and accessibility preference inference](#d-007-theme-and-accessibility-preference-inference)
  - [3) Operations](#3-operations)
    - [O-001 OAuth login and user provisioning](#o-001-oauth-login-and-user-provisioning)
    - [O-002 Business lifecycle operations](#o-002-business-lifecycle-operations)
    - [O-003 Project lifecycle operations](#o-003-project-lifecycle-operations)
    - [O-004 Task lifecycle operations](#o-004-task-lifecycle-operations)
    - [O-005 Registration lifecycle operations](#o-005-registration-lifecycle-operations)
    - [O-006 Student profile and portfolio operations](#o-006-student-profile-and-portfolio-operations)
    - [O-007 Skill and theme governance operations](#o-007-skill-and-theme-governance-operations)
    - [O-008 Invite key operations](#o-008-invite-key-operations)
  - [4) Actions \& Integrations](#4-actions--integrations)
    - [A-001 SMTP + templated email sending](#a-001-smtp--templated-email-sending)
    - [A-002 Notification service integration (partial)](#a-002-notification-service-integration-partial)
    - [A-003 OAuth provider integrations](#a-003-oauth-provider-integrations)
    - [A-004 Remote image retrieval integration](#a-004-remote-image-retrieval-integration)
    - [A-005 Local browser integrations](#a-005-local-browser-integrations)
    - [A-006 Public map/location presentation integration](#a-006-public-maplocation-presentation-integration)
  - [5) Audit Verdict Update (2026-02-26)](#5-audit-verdict-update-2026-02-26)
    - [Business-rule verdicts (31 rules)](#business-rule-verdicts-31-rules)
      - [Constraints](#constraints)
      - [Derivations \& inferences](#derivations--inferences)
      - [Operations](#operations)
      - [Actions \& integrations](#actions--integrations)
    - [Cross-layer inconsistency claims (I-001..I-005)](#cross-layer-inconsistency-claims-i-001i-005)
    - [High-impact discrepancies (explicit)](#high-impact-discrepancies-explicit)
    - [Test-evidence note](#test-evidence-note)
  - [Cross-Layer Inconsistencies / Partial / Implicit Rules](#cross-layer-inconsistencies--partial--implicit-rules)
    - [I-001 Archive/completion semantics differ across layers](#i-001-archivecompletion-semantics-differ-across-layers)
    - [I-002 Duplicate route declarations in business router](#i-002-duplicate-route-declarations-in-business-router)
    - [I-003 Frontend duplicate-registration precheck appears structurally incorrect](#i-003-frontend-duplicate-registration-precheck-appears-structurally-incorrect)
    - [I-004 Notification pipeline is partially implemented](#i-004-notification-pipeline-is-partially-implemented)
    - [I-005 Theme/skill governance endpoints appear less protected than core domain operations](#i-005-themeskill-governance-endpoints-appear-less-protected-than-core-domain-operations)
  - [Summary Statistics](#summary-statistics)
  - [Risk \& Technical Debt Assessment + Recommendations](#risk--technical-debt-assessment--recommendations)
    - [High priority](#high-priority)
    - [Medium priority](#medium-priority)
    - [Low priority](#low-priority)

---

## Scope & Method

This analysis used the TypeDB schema as the source of domain truth and mapped business rules to backend enforcement and frontend behavior.

Primary code surfaces:
- TypeDB schema: `projojo_backend/db/schema.tql`
- Backend: routes, repositories, auth, middleware, services
- Frontend: services, pages, components, contexts, hooks

---

## Authoritative Domain Model (TypeDB)

Authoritative entities include: `user` (abstract), `student`, `supervisor`, `teacher`, `business`, `project`, `task`, `skill`, `theme`, `inviteKey`, `portfolioItem`.

Authoritative relations include: `manages`, `hasProjects`, `containsTask`, `requiresSkill`, `hasSkill`, `registersForTask`, `hasPortfolio`, `hasTheme`, `oauthAuthentication`.

Critical schema facts leveraged by rules below:
- Skills are unique by name and required fields are constrained.
- Task registration relation carries lifecycle timestamps and acceptance state.
- Relation roles/cardinalities constrain valid graph states.

---

## 1) Constraints

### C-001 Skill identity and mandatory attributes
**Purpose**: Keep skill taxonomy consistent and deduplicated.

**Stakeholder benefit**:
- Students: predictable matching and profile clarity
- Supervisors/teachers: cleaner analytics and filtering

**Rule description (TypeDB-grounded)**:
- `skill` must own unique `name` and required flags (`isPending`, `createdAt`).

**Code references**:
- Schema: `projojo_backend/db/schema.tql`
- Skill model/router/repository:
  - `projojo_backend/domain/models/skill.py`
  - `projojo_backend/routes/skill_router.py`
  - `projojo_backend/domain/repositories/skill_repository.py`

**Cross refs**: Supports [D-004](#d-004-skill-match-inference-student-vs-taskproject), [O-007](#o-007-skill-and-theme-governance-operations)

---

### C-002 Registration relation cardinality and required content
**Purpose**: Ensure a valid student↔task registration unit and timeline record.

**Stakeholder benefit**:
- Students/supervisors: clear workflow state
- Admin/teacher: auditable lifecycle

**Rule description (TypeDB-grounded)**:
- `registersForTask` enforces one `student`, one `task`, and mandatory `description`; lifecycle fields are optional but structured.

**Code references**:
- Schema: `projojo_backend/db/schema.tql`
- Registration operations:
  - `projojo_backend/routes/task_router.py`
  - `projojo_backend/domain/repositories/task_repository.py`

**Cross refs**: Feeds [D-002](#d-002-registration-statustimeline-inference), [O-005](#o-005-registration-lifecycle-operations)

---

### C-003 Role-based authorization and ownership gating
**Purpose**: Restrict data/action access to proper actor roles and owners.

**Stakeholder benefit**:
- All users: safer access boundaries
- Businesses: ownership-isolation for supervisor actions

**Rule description**:
- Role checks (`student/supervisor/teacher/authenticated`) plus optional ownership verification (`owner_id_key`) gate route execution.

**Code references**:
- `projojo_backend/auth/permissions.py` (auth decorator, role checks, ownership validation)
- Ownership helper dependencies in user/project repositories:
  - `projojo_backend/domain/repositories/user_repository.py`
  - `projojo_backend/domain/repositories/project_repository.py`

**Cross refs**: Constrains [O-002](#o-002-business-lifecycle-operations), [O-003](#o-003-project-lifecycle-operations), [O-005](#o-005-registration-lifecycle-operations)

---

### C-004 JWT protection boundary with public route exceptions
**Purpose**: Enforce authentication for protected API surface.

**Stakeholder benefit**:
- Platform-wide security and consistent request identity context.

**Rule description**:
- Middleware validates bearer token except configured public routes; request state receives user payload.

**Code references**:
- `projojo_backend/auth/jwt_middleware.py`
- `projojo_backend/auth/jwt_utils.py`
- App wiring: `projojo_backend/main.py`

**Cross refs**: Prerequisite for [C-003](#c-003-role-based-authorization-and-ownership-gating), [O-001](#o-001-oauth-login-and-user-provisioning)

---

### C-005 Task capacity (no overbooking)
**Purpose**: Prevent acceptance beyond `task.total_needed`.

**Stakeholder benefit**:
- Students: fair, predictable seat availability
- Supervisors: staffing control

**Rule description**:
- Registration acceptance blocked when accepted count reaches capacity.
- Task update rejects `total_needed < accepted_count`.

**Code references**:
- Route-level checks: `projojo_backend/routes/task_router.py`
- Repository checks: `projojo_backend/domain/repositories/task_repository.py`
- Frontend UX handling:
  - `projojo_frontend/src/components/Task.jsx`
  - `projojo_frontend/src/services.js`

**Cross refs**: Governs [O-005](#o-005-registration-lifecycle-operations)

---

### C-006 Duplicate registration prevention
**Purpose**: Ensure one active registration intent per student-task pair.

**Stakeholder benefit**:
- Students: avoids accidental duplicate applications
- Supervisors: cleaner candidate queue

**Rule description**:
- Duplicate task registrations are rejected in backend flow; frontend attempts pre-emptive guard.

**Code references**:
- Backend: `projojo_backend/routes/task_router.py`, `projojo_backend/domain/repositories/task_repository.py`
- Frontend: `projojo_frontend/src/components/Task.jsx`, `projojo_frontend/src/components/ProjectTasks.jsx`

**Cross refs**: See inconsistency I-003 in inconsistency section.

---

### C-007 Task-skill mutation lock when registrations exist
**Purpose**: Avoid changing required skills after students have registered.

**Stakeholder benefit**:
- Students: protects fairness of accepted criteria
- Supervisors: avoids retroactive requirement shifts

**Rule description**:
- Task skill updates can be locked when registrations exist.

**Code references**:
- `projojo_backend/domain/repositories/skill_repository.py` (`has_task_registrations`, `update_task_skills`)
- `projojo_backend/routes/task_router.py` (update task skills endpoint)

**Cross refs**: Supports [O-004](#o-004-task-lifecycle-operations)

---

### C-008 Project archive/delete impact confirmation
**Purpose**: Prevent destructive actions without explicit acknowledgment of student impact.

**Stakeholder benefit**:
- Students: reduces sudden workflow loss
- Supervisors/teachers: explicit risk acceptance step

**Rule description**:
- Archive/delete endpoints can return warning when affected students exist; client must re-submit with `confirm=true`.

**Code references**:
- Backend: `projojo_backend/routes/project_router.py`
- Frontend orchestration:
  - `projojo_frontend/src/components/ProjectDetails.jsx`
  - `projojo_frontend/src/components/ProjectActionModal.jsx`
  - `projojo_frontend/src/services.js`

**Cross refs**: Preconditions [O-003](#o-003-project-lifecycle-operations)

---

### C-009 Project hard-delete restricted to teacher and portfolio snapshotting
**Purpose**: Control destructive operations and preserve completed student evidence.

**Stakeholder benefit**:
- Teachers/admins: controlled irreversible deletion
- Students: retain portfolio evidence from completed tasks

**Rule description**:
- Only teacher can hard-delete project.
- Completed task outcomes are snapshotted to portfolio before deletion.

**Code references**:
- Route: `projojo_backend/routes/project_router.py`
- Repository + portfolio:
  - `projojo_backend/domain/repositories/project_repository.py`
  - `projojo_backend/domain/repositories/portfolio_repository.py`

**Cross refs**: Depends on [C-003](#c-003-role-based-authorization-and-ownership-gating), [C-008](#c-008-project-archivedelete-impact-confirmation)

---

### C-010 Image/file safety constraints
**Purpose**: Prevent unsafe uploads/remote fetches (size/type/domain).

**Stakeholder benefit**:
- Platform security and storage integrity

**Rule description**:
- Validate extension/content-type/header bytes, max size, safe host/IP for URL retrieval.

**Code references**:
- `projojo_backend/service/image_service.py`
- Upload usage in routers:
  - `projojo_backend/routes/business_router.py`
  - `projojo_backend/routes/project_router.py`
  - `projojo_backend/routes/student_router.py`
- Frontend validation entry points:
  - `projojo_frontend/src/components/AddProjectForm.jsx`
  - `projojo_frontend/src/components/DragDrop.jsx`

**Cross refs**: Used by [A-004](#a-004-remote-image-retrieval-integration)

---

## 2) Derivations & Inferences

### D-001 Project lifecycle status inference
**Purpose**: Determine active/completed/archived display state.

**Stakeholder benefit**:
- All users: coherent status communication

**Rule description**:
- Status inferred from `is_archived`, explicit status value, and/or `end_date < now` depending on view.

**Code references**:
- Backend public/project shaping: `projojo_backend/domain/repositories/project_repository.py`
- Frontend status derivations:
  - `projojo_frontend/src/pages/ProjectDetailsPage.jsx`
  - `projojo_frontend/src/components/ProjectCard.jsx`
  - `projojo_frontend/src/components/PublicProjectCard.jsx`
  - `projojo_frontend/src/pages/PublicDiscoveryPage.jsx`

**Cross refs**: See inconsistency I-001.

---

### D-002 Registration status/timeline inference
**Purpose**: Express candidate workflow states from relation attributes.

**Stakeholder benefit**:
- Students/supervisors: transparent application progression

**Rule description**:
- `is_accepted` (null/true/false) + timeline fields (`requested_at`, `accepted_at`, `started_at`, `completed_at`) derive pending/accepted/rejected/in-progress/completed interpretation.

**Code references**:
- Backend:
  - `projojo_backend/domain/repositories/task_repository.py`
  - `projojo_backend/routes/task_router.py`
- Frontend:
  - `projojo_frontend/src/context/StudentWorkContext.jsx`
  - `projojo_frontend/src/pages/StudentDashboard.jsx`
  - `projojo_frontend/src/pages/SupervisorDashboard.jsx`

**Cross refs**: Powers [O-005](#o-005-registration-lifecycle-operations)

---

### D-003 Student active/pending work-set inference
**Purpose**: Build fast lookup sets for “working at/on” and “pending at/on”.

**Stakeholder benefit**:
- Students: reduced duplicate actions in discovery/task views

**Rule description**:
- From registration list, infer sets of business/project/task IDs for active and pending participation.

**Code references**:
- `projojo_frontend/src/context/StudentWorkContext.jsx`
- Consumers:
  - `projojo_frontend/src/pages/OverviewPage.jsx`
  - `projojo_frontend/src/components/Task.jsx`

**Cross refs**: Supports [C-006](#c-006-duplicate-registration-prevention)

---

### D-004 Skill-match inference (student vs task/project)
**Purpose**: Determine relevance and communicate match quality.

**Stakeholder benefit**:
- Students: prioritize fitting tasks
- Supervisors: better candidate fit expectations

**Rule description**:
- Compare student skill IDs with task-required skill IDs to infer match badges/counts.

**Code references**:
- Data normalization:
  - `projojo_frontend/src/utils/skills.js`
  - `projojo_frontend/src/context/StudentSkillsContext.jsx`
- Match calculations/UI:
  - `projojo_frontend/src/pages/OverviewPage.jsx`
  - `projojo_frontend/src/pages/StudentDashboard.jsx`

**Cross refs**: Depends on [C-001](#c-001-skill-identity-and-mandatory-attributes)

---

### D-005 Top-skill inference for organizations/projects
**Purpose**: Highlight dominant demand signals.

**Stakeholder benefit**:
- Students: quick understanding of organization demand profile
- Teachers/admins: portfolio of demand trends

**Rule description**:
- Aggregate normalized task skills and rank by frequency (top-N).

**Code references**:
- `projojo_frontend/src/pages/OverviewPage.jsx`
- `projojo_frontend/src/pages/BusinessPage.jsx`
- `projojo_frontend/src/pages/ProjectDetailsPage.jsx`

**Cross refs**: Uses [D-004](#d-004-skill-match-inference-student-vs-taskproject)

---

### D-006 Dashboard metric inference
**Purpose**: Condense operational state into KPI counts.

**Stakeholder benefit**:
- Supervisors/teachers/students: quick situational awareness

**Rule description**:
- Counts for pending registrations, active students, projects/tasks, open positions inferred from datasets.

**Code references**:
- Backend dashboard feed: `projojo_backend/routes/supervisor_router.py`, `projojo_backend/domain/repositories/task_repository.py`
- Frontend metric rendering:
  - `projojo_frontend/src/pages/SupervisorDashboard.jsx`
  - `projojo_frontend/src/pages/StudentDashboard.jsx`
  - `projojo_frontend/src/pages/PublicDiscoveryPage.jsx`

---

### D-007 Theme and accessibility preference inference
**Purpose**: Respect user/system visual accessibility preferences.

**Stakeholder benefit**:
- All users, especially accessibility users (contrast/theme)

**Rule description**:
- Theme and high-contrast inferred from localStorage fallback to system media queries.

**Code references**:
- `projojo_frontend/src/context/ThemeContext.jsx`

---

## 3) Operations

### O-001 OAuth login and user provisioning
**Purpose**: Authenticate users through external providers and issue platform JWT.

**Stakeholder benefit**:
- Students/supervisors/teachers: low-friction onboarding/login

**Rule description**:
- OAuth login redirect + callback; provider user profile extraction; create-or-get user; emit JWT with role/business claims.

**Code references**:
- `projojo_backend/routes/auth_router.py`
- `projojo_backend/service/auth_service.py`
- `projojo_backend/auth/oauth_config.py`
- `projojo_backend/auth/jwt_utils.py`
- Frontend callback handling: `projojo_frontend/src/auth/AuthCallback.jsx`, `projojo_frontend/src/auth/AuthProvider.jsx`

**Cross refs**: Bound by [C-003](#c-003-role-based-authorization-and-ownership-gating), [C-004](#c-004-jwt-protection-boundary-with-public-route-exceptions)

---

### O-002 Business lifecycle operations
**Purpose**: Create/manage business records and publication state.

**Stakeholder benefit**:
- Teachers/supervisors: organization administration

**Rule description**:
- Create (incl. draft/archive flag), update metadata/image, archive/restore.

**Code references**:
- Backend: `projojo_backend/routes/business_router.py`, `projojo_backend/domain/repositories/business_repository.py`
- Frontend: `projojo_frontend/src/pages/TeacherPage.jsx`, `projojo_frontend/src/services.js`, `projojo_frontend/src/pages/UpdateBusinessPage.jsx`

**Cross refs**: constrained by [C-003](#c-003-role-based-authorization-and-ownership-gating)

---

### O-003 Project lifecycle operations
**Purpose**: Full project lifecycle and visibility management.

**Stakeholder benefit**:
- Supervisors/teachers: govern project publishing, archival and finalization
- Students: stable project availability signals

**Rule description**:
- Create/update project, set visibility, set impact summary, archive/restore, delete.

**Code references**:
- Backend: `projojo_backend/routes/project_router.py`, `projojo_backend/domain/repositories/project_repository.py`
- Frontend: `projojo_frontend/src/components/ProjectDetails.jsx`, `projojo_frontend/src/services.js`, `projojo_frontend/src/components/ProjectActionModal.jsx`

**Cross refs**: enforced by [C-008](#c-008-project-archivedelete-impact-confirmation), [C-009](#c-009-project-hard-delete-restricted-to-teacher-and-portfolio-snapshotting)

---

### O-004 Task lifecycle operations
**Purpose**: Manage project tasks and required skills.

**Stakeholder benefit**:
- Supervisors: define executable work units
- Students: clear task boundaries and requirements

**Rule description**:
- Create/update tasks, set dates/capacity, attach/remove required skills.

**Code references**:
- Backend: `projojo_backend/routes/task_router.py`, `projojo_backend/domain/repositories/task_repository.py`, `projojo_backend/domain/repositories/skill_repository.py`
- Frontend: `projojo_frontend/src/components/Task.jsx`, `projojo_frontend/src/services.js`, `projojo_frontend/src/pages/UpdateTaskPage.jsx`

**Cross refs**: [C-005](#c-005-task-capacity-no-overbooking), [C-007](#c-007-task-skill-mutation-lock-when-registrations-exist)

---

### O-005 Registration lifecycle operations
**Purpose**: Manage student candidacy from application to completion.

**Stakeholder benefit**:
- Students: explicit journey through request/accept/start/complete
- Supervisors: structured candidate control

**Rule description**:
- Create registration; supervisor accepts/rejects; student/supervisor progress start/complete; student can cancel pending registration.

**Code references**:
- Backend: `projojo_backend/routes/task_router.py`, `projojo_backend/domain/repositories/task_repository.py`
- Frontend: `projojo_frontend/src/components/Task.jsx`, `projojo_frontend/src/pages/StudentDashboard.jsx`, `projojo_frontend/src/pages/SupervisorDashboard.jsx`, `projojo_frontend/src/services.js`

**Cross refs**: constrained by [C-005](#c-005-task-capacity-no-overbooking), [C-006](#c-006-duplicate-registration-prevention), [D-002](#d-002-registration-statustimeline-inference)

---

### O-006 Student profile and portfolio operations
**Purpose**: Maintain student profile data, skills, and historical evidence.

**Stakeholder benefit**:
- Students: profile growth and reusable portfolio artifacts
- Supervisors/teachers: better candidate visibility

**Rule description**:
- Update student profile fields/media; update skill assignments/descriptions; retrieve/delete portfolio entries.

**Code references**:
- Backend: `projojo_backend/routes/student_router.py`, `projojo_backend/domain/repositories/user_repository.py`, `projojo_backend/domain/repositories/portfolio_repository.py`, `projojo_backend/domain/repositories/skill_repository.py`
- Frontend: `projojo_frontend/src/pages/ProfilePage.jsx`, `projojo_frontend/src/components/StudentProfileSkills.jsx`, `projojo_frontend/src/components/StudentPortfolio.jsx`, `projojo_frontend/src/services.js`

---

### O-007 Skill and theme governance operations
**Purpose**: Curate controlled vocabularies for matching/discovery.

**Stakeholder benefit**:
- Teachers/admins: governance over semantic quality
- Students/supervisors: cleaner filtering and communication

**Rule description**:
- Skills: create/list/rename/acceptance state.
- Themes: CRUD + project-theme linking.

**Code references**:
- Backend:
  - `projojo_backend/routes/skill_router.py`
  - `projojo_backend/domain/repositories/skill_repository.py`
  - `projojo_backend/routes/theme_router.py`
  - `projojo_backend/domain/repositories/theme_repository.py`
- Frontend:
  - `projojo_frontend/src/services.js`
  - `projojo_frontend/src/pages/TeacherPage.jsx`
  - `projojo_frontend/src/pages/PublicDiscoveryPage.jsx`

---

### O-008 Invite key operations
**Purpose**: Controlled onboarding link generation for privileged roles.

**Stakeholder benefit**:
- Teachers/admins: manageable invite flow for staff/supervisors

**Rule description**:
- Generate teacher/supervisor invite keys and surface link/expiry semantics in UI.

**Code references**:
- Backend: `projojo_backend/routes/invite_router.py`, `projojo_backend/domain/repositories/invite_repository.py`
- Frontend: `projojo_frontend/src/pages/TeacherPage.jsx`, `projojo_frontend/src/services.js`

---

## 4) Actions & Integrations

### A-001 SMTP + templated email sending
**Purpose**: Outbound communication via provider SMTP with templates/attachments.

**Stakeholder benefit**:
- Students/supervisors/teachers: notification and invite communications

**Code references**:
- `projojo_backend/service/email_service.py`
- Templates:
  - `projojo_backend/templates/email/base.html`
  - `projojo_backend/templates/email/invitation.html`
  - `projojo_backend/templates/email/notification.html`

---

### A-002 Notification service integration (partial)
**Purpose**: Event-driven notifications for archive/delete impacts.

**Stakeholder benefit**:
- Students/teachers: better operational communication (intended)

**Current state**:
- Service has method scaffolding but email sending is effectively disabled (`email_enabled=False`), making this rule partially implemented.

**Code references**:
- `projojo_backend/service/notification_service.py`

---

### A-003 OAuth provider integrations
**Purpose**: Integrate external identity providers (Google/GitHub/Microsoft).

**Code references**:
- `projojo_backend/auth/oauth_config.py`
- `projojo_backend/service/auth_service.py`

---

### A-004 Remote image retrieval integration
**Purpose**: Fetch and store profile images from provider/URL safely.

**Code references**:
- `projojo_backend/service/auth_service.py` (Microsoft picture fetch)
- `projojo_backend/service/image_service.py`

---

### A-005 Local browser integrations
**Purpose**: Persist user convenience state and sharing actions.

**Code references**:
- Bookmarks localStorage: `projojo_frontend/src/hooks/useBookmarks.js`
- Theme/high-contrast localStorage + media queries: `projojo_frontend/src/context/ThemeContext.jsx`
- Clipboard share/invite links:
  - `projojo_frontend/src/pages/TeacherPage.jsx`
  - `projojo_frontend/src/components/ProjectDetails.jsx`

---

### A-006 Public map/location presentation integration
**Purpose**: Visual geospatial discovery in public view.

**Code references**:
- `projojo_frontend/src/pages/PublicDiscoveryPage.jsx`
- `projojo_frontend/src/components/LocationMap.jsx`
- `projojo_frontend/src/components/OverviewMap.jsx`

---

## 5) Audit Verdict Update (2026-02-26)

### Business-rule verdicts (31 rules)

#### Constraints
- **C-001 — Fully consistent**: schema enforces unique skill name + required attributes in `schema.tql`, implemented through `skill_router.py`.
- **C-002 — Fully consistent**: registration relation shape/timeline persisted in `schema.tql` and write flow in `task_repository.py`.
- **C-003 — Partially consistent**: strong base in `auth()`, but ownership is explicitly not fully enforced in `link_project_themes()`, and timeline/progress routes are role-checked without owner scoping in `task_router.py`.
- **C-004 — Partially consistent**: JWT boundary exists in `JWTMiddleware`, but exclusion surface is broad in `EXCLUDED_ENDPOINTS`.
- **C-005 — Fully consistent**: overbooking blocked in `create_registration()`, `update_registration()`, and task-capacity downsize blocked in `update()`.
- **C-006 — Partially consistent**: backend duplicate guard exists in `create_registration()`, but frontend precheck is structurally wrong in `ProjectTasks.jsx`.
- **C-007 — Fully consistent**: skill mutation lock enforced in `update_task_skills()` and handled in UI flow in `Task.jsx`.
- **C-008 — Fully consistent**: confirm flow implemented in `archive_project()` and `delete_project()`, consumed by `ProjectActionModal.jsx`.
- **C-009 — Fully consistent**: teacher-only hard delete in `delete_project()`, snapshot creation via `create_snapshot()`.
- **C-010 — Fully consistent**: MIME/ext/magic-size/domain checks in `image_service.py`, plus frontend pre-validation in `DragDrop.jsx`.

#### Derivations & inferences
- **D-001 — Partially consistent**: status inference exists but diverges by layer (date-derived archived/completed in `ProjectDetailsPage.jsx`, `ProjectCard.jsx`, `PublicProjectCard.jsx`, versus explicit archive filtering in `get_public_projects()`).
- **D-002 — Partially consistent**: full timeline is stored/retrievable in `task_repository.py`, but student dashboard inference uses limited fields from `get_student_registrations()` and `StudentDashboard.jsx`.
- **D-003 — Fully consistent**: active/pending working sets are properly derived in `StudentWorkContext.jsx`.
- **D-004 — Fully consistent**: skill-match derivation implemented in `OverviewPage.jsx` and `ProjectCard.jsx`.
- **D-005 — Fully consistent**: top-skill aggregation implemented in `OverviewPage.jsx`, `BusinessPage.jsx`, `ProjectDetailsPage.jsx`.
- **D-006 — Fully consistent**: dashboard metrics computed in `get_supervisor_dashboard()`, rendered in `SupervisorDashboard.jsx`, `StudentDashboard.jsx`, `PublicDiscoveryPage.jsx`.
- **D-007 — Fully consistent**: theme/high-contrast/system inference in `ThemeContext.jsx`.

#### Operations
- **O-001 — Inconsistent**: OAuth callback issues JWT without role/business claims in `handle_oauth_callback()`, while frontend auth parsing expects them in `processToken()` and middleware enforces supervisor business claim in `dispatch()`.
- **O-002 — Partially consistent**: lifecycle endpoints exist in `business_router.py`, but archive/restore routes are duplicated in the same file.
- **O-003 — Fully consistent**: project lifecycle (create/update/visibility/impact/archive/restore/delete) is complete across `project_router.py` and `services.js`.
- **O-004 — Fully consistent**: task lifecycle (create/update/skills/date bounds) implemented in `task_router.py` + `Task.jsx`.
- **O-005 — Partially consistent**: registration lifecycle exists in `task_router.py`, but ownership enforcement gaps remain on start/complete/timeline routes.
- **O-006 — Partially consistent**: profile/portfolio operations exist in `student_router.py`, but supervisor portfolio access scope is not constrained to owned resources in `get_student_portfolio()`.
- **O-007 — Partially consistent**: governance exists in `skill_router.py` and `theme_router.py`, but theme project-linking lacks ownership verification in `link_project_themes()`.
- **O-008 — Partially consistent**: invite-key generation exists in `invite_router.py` and `save_invite_key()`, but no consumption/expiry enforcement is implemented while UI communicates validity/one-time semantics in `TeacherPage.jsx`.

#### Actions & integrations
- **A-001 — Fully consistent**: SMTP + templates fully implemented in `send_email()` and `send_templated_email()`.
- **A-002 — Partially consistent**: notification scaffold exists in `NotificationService`, but sending is disabled by `email_enabled = False` and routes still have TODO hooks in `project_router.py`.
- **A-003 — Fully consistent**: provider integrations configured in `setup_oauth()` and handled in `AuthService`.
- **A-004 — Fully consistent**: remote image retrieval integrated via `save_image_from_url()` and OAuth user provisioning in `create_user()`.
- **A-005 — Fully consistent**: local browser integrations in `useBookmarks()`, `ThemeProvider`, and clipboard usage in `TeacherPage.jsx` / `ProjectDetails.jsx`.
- **A-006 — Fully consistent**: public location/map integration in `PublicDiscoveryPage.jsx`, `OverviewMap.jsx`, `LocationMap.jsx`.

### Cross-layer inconsistency claims (I-001..I-005)
- **I-001 — Fully consistent (issue confirmed)**: status/archive semantic drift confirmed between `project_repository.py` and frontend derivations in `OverviewPage.jsx`.
- **I-002 — Fully consistent (issue confirmed)**: duplicate business routes confirmed in `business_router.py`.
- **I-003 — Fully consistent (issue confirmed)**: duplicate-registration precheck bug confirmed in `ProjectTasks.jsx`.
- **I-004 — Fully consistent (issue confirmed)**: notification pipeline partiality confirmed via `notification_service.py` and TODO markers in `project_router.py`.
- **I-005 — Partially consistent**: theme/link auth concern is confirmed in `theme_router.py`, while skill/invite routes do have meaningful role controls in `skill_router.py` and `invite_router.py`.

### High-impact discrepancies (explicit)
- **OAuth JWT claim mismatch (critical)**: token issued without role/business in `auth_service.py`, conflicting with `AuthProvider.jsx` and supervisor check in `jwt_middleware.py`.
- **Duplicate business archive/restore route declarations** in `business_router.py`.
- **Frontend duplicate registration precheck bug** in `ProjectTasks.jsx`, while backend correctly blocks duplicates in `task_router.py`.
- **Ownership enforcement gaps** for theme-project linking and registration progress/timeline in `theme_router.py` and `task_router.py`.
- **Invite lifecycle mismatch**: UI indicates validity/one-time behavior in `TeacherPage.jsx`, but backend only creates keys in `invite_repository.py` without consumption/expiry enforcement.
- **Notification integration still non-operational**: `notification_service.py` + TODOs in `project_router.py`.
- **Archive/completion semantic drift across views** in `ProjectDetailsPage.jsx`, `ProjectCard.jsx`, `PublicProjectCard.jsx`, `PublicDiscoveryPage.jsx`, and `OverviewPage.jsx`.

### Test-evidence note
- No dedicated policy tests were found for these business-rule checks; current tests are query utility tests in `test_initDatabase.py`.

---

## Cross-Layer Inconsistencies / Partial / Implicit Rules

### I-001 Archive/completion semantics differ across layers
**Audit verdict**: Fully consistent (issue confirmed)

- Backend has explicit archive (`isArchived`) and status fields.
- Several frontend screens infer archived/completed from `end_date < now` alone.
- Risk: project may appear archived/completed in some views without true backend archive action.

Evidence:
- Backend archive methods: `projojo_backend/domain/repositories/project_repository.py`
- Frontend derivations:
  - `projojo_frontend/src/pages/ProjectDetailsPage.jsx`
  - `projojo_frontend/src/pages/PublicDiscoveryPage.jsx`
  - `projojo_frontend/src/pages/OverviewPage.jsx`

---

### I-002 Duplicate route declarations in business router
**Audit verdict**: Fully consistent (issue confirmed)

- `archive` and `restore` endpoints for business appear declared twice in one router file.
- Risk: maintenance ambiguity / override confusion.

Evidence:
- `projojo_backend/routes/business_router.py`

---

### I-003 Frontend duplicate-registration precheck appears structurally incorrect
**Audit verdict**: Fully consistent (issue confirmed)

- `ProjectTasks` passes `studentAlreadyRegistered={currentRegistrations.includes(task.id)}`.
- `currentRegistrations` is set from registration objects, so `includes(task.id)` likely fails unless shape is array of IDs.
- Backend still enforces duplicate prevention, but UX guard likely inconsistent.

Evidence:
- `projojo_frontend/src/components/ProjectTasks.jsx`
- `projojo_frontend/src/components/Task.jsx`
- Backend guard: `projojo_backend/routes/task_router.py`, `projojo_backend/domain/repositories/task_repository.py`

---

### I-004 Notification pipeline is partially implemented
**Audit verdict**: Fully consistent (issue confirmed)

- Notification service methods exist, but effective send path is off by configuration flag.
- Risk: stakeholders assume notifications while nothing is delivered.

Evidence:
- `projojo_backend/service/notification_service.py`

---

### I-005 Theme/skill governance endpoints appear less protected than core domain operations
**Audit verdict**: Partially consistent

- Theme and invite routes need explicit review for intended authorization model relative to stricter project/task routes.
- Risk: permission drift.

Evidence:
- `projojo_backend/routes/theme_router.py`
- `projojo_backend/routes/invite_router.py`
- Compared with auth patterns in `projojo_backend/auth/permissions.py`

---

## Summary Statistics

- Total cataloged business rules: **31**
  - Constraints: **10**
  - Derivations & Inferences: **7**
  - Operations: **8**
  - Actions & Integrations: **6**
- Verdict distribution across 31 business rules:
  - **Fully consistent: 19**
  - **Partially consistent: 11**
  - **Inconsistent: 1**
- Cross-layer inconsistencies/partial/implicit findings: **5**
  - **Fully consistent (issue confirmed): 4**
  - **Partially consistent: 1**

Coverage notes:
- TypeDB-driven domain constraints are strongly represented for skill/task/registration semantics.
- Most critical lifecycle rules have backend enforcement and frontend UX traces.
- A subset of behavior remains implicit in UI derivations rather than explicit backend states.
- Dedicated policy/regression tests for these rule IDs are currently missing.

---

## Risk & Technical Debt Assessment + Recommendations

### High priority
1. **Fix OAuth JWT claim mismatch (critical)**
   - Ensure `handle_oauth_callback()` emits JWTs with required role/business claims expected by frontend auth parsing and middleware authorization.
2. **Close ownership-enforcement gaps**
   - Add owner scoping where role checks alone are currently used (`link_project_themes()`, registration progress/timeline routes).
3. **Unify archive/completion semantics**
   - Establish one canonical project-state contract (e.g., explicit backend `status` + `is_archived`) and update all frontend derivations.
4. **Resolve duplicated business routes**
   - Remove duplicate archive/restore endpoint declarations in business router to avoid route ambiguity.
5. **Fix frontend duplicate-registration precheck**
   - Normalize registration IDs before inclusion checks to align with backend duplicate guard.

### Medium priority
6. **Implement invite-key consumption and expiry enforcement**
   - Align backend lifecycle behavior with UI semantics (validity window and one-time usage).
7. **Promote notification service to explicit feature-flagged behavior**
   - Either enable with tested SMTP path or clearly disable and communicate non-operational status in UX/API docs.
8. **Harden route-level authorization consistency**
   - Audit theme/invite/public operations against a role + ownership policy matrix.

### Low priority
9. **Formalize rule IDs in code comments/docs**
   - Add rule tags (`C-005`, `O-005`, etc.) in route/repository methods to improve traceability.
10. **Add automated policy tests**
   - Role/ownership tests, registration capacity tests, and state transition tests to prevent regression.
