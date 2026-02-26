# Projojo — Business Rules Catalog

> **Generated:** 2026-02-12 (updated 2026-02-12 — audit fixes applied)
> **Scope:** Full-stack analysis of frontend, backend, database schema, middleware, configuration, and seed data.  
> **Authoritative domain model:** TypeDB schema at [`schema.tql`](../projojo_backend/db/schema.tql)

---

## Table of Contents

1. [Domain Model Summary](#1-domain-model-summary)
2. [Constraints](#2-constraints)
   - [C-AUTH: Authentication & Session Constraints](#c-auth-authentication--session-constraints)
   - [C-RBAC: Role-Based Access Control](#c-rbac-role-based-access-control)
   - [C-OWN: Ownership & Resource Scoping](#c-own-ownership--resource-scoping)
   - [C-VAL: Data Validation Constraints](#c-val-data-validation-constraints)
   - [C-UNIQ: Uniqueness Constraints](#c-uniq-uniqueness-constraints)
   - [C-REF: Referential Integrity](#c-ref-referential-integrity)
   - [C-CARD: Cardinality Constraints](#c-card-cardinality-constraints)
   - [C-FILE: File Upload Constraints](#c-file-file-upload-constraints)
   - [C-INVITE: Invitation Constraints](#c-invite-invitation-constraints)
   - [C-REG: Task Registration Constraints](#c-reg-task-registration-constraints)
   - [C-ENV: Environment-Gated Constraints](#c-env-environment-gated-constraints)
3. [Derivations and Inferences](#3-derivations-and-inferences)
4. [Operations](#4-operations)
   - [OP-AUTH: Authentication Operations](#op-auth-authentication-operations)
   - [OP-BIZ: Business Operations](#op-biz-business-operations)
   - [OP-PROJ: Project Operations](#op-proj-project-operations)
   - [OP-TASK: Task Operations](#op-task-task-operations)
   - [OP-REG: Registration Operations](#op-reg-registration-operations)
   - [OP-SKILL: Skill Operations](#op-skill-skill-operations)
   - [OP-STUDENT: Student Profile Operations](#op-student-student-profile-operations)
   - [OP-INVITE: Invitation Operations](#op-invite-invitation-operations)
5. [Actions and Integrations](#5-actions-and-integrations)
6. [Risks, Technical Debt & Observations](#6-risks-technical-debt--observations)
7. [Summary Statistics](#7-summary-statistics)

---

## 1. Domain Model Summary

The TypeDB schema ([`schema.tql`](../projojo_backend/db/schema.tql)) defines the following core types:

### Entity Types

| Entity | Description | Key Attribute |
|--------|-------------|---------------|
| `user` | Abstract base; cannot be instantiated directly | `id @key` |
| `supervisor` | Sub-type of `user`; manages a `business` | `id @key` (inherited) |
| `student` | Sub-type of `user`; registers for tasks, owns skills | `id @key` (inherited) |
| `teacher` | Sub-type of `user`; highest-privilege role | `id @key` (inherited) |
| `oauthProvider` | Third-party auth provider (Microsoft, Google, GitHub) | `name @key` |
| `business` | Organization offering projects | `id @key` |
| `project` | A project within a business | `id @key` |
| `task` | A work item within a project | `id @key` |
| `skill` | A competency tag (may be pending approval) | `id @key`, `name @unique` |
| `inviteKey` | A time-limited token for supervisor onboarding | `key @key` |

### Relation Types

| Relation | Roles | Purpose |
|----------|-------|---------|
| `oauthAuthentication` | `user`, `provider` | Links a user to an OAuth provider via `oauthSub` |
| `creates` | `supervisor` (`@card(1)`), `project` (`@card(0..)`) | Records which supervisor created which project (with `createdAt`) |
| `manages` | `supervisor`, `business` | Associates a supervisor with their business (with `location`) |
| `hasProjects` | `business`, `project` | Associates a project with its owning business |
| `containsTask` | `project`, `task` | Associates a task with its parent project |
| `requiresSkill` | `task`, `skill` | Declares a skill requirement for a task |
| `hasSkill` | `student`, `skill` | Records a student's claimed skill (with optional `description`) |
| `registersForTask` | `student`, `task` | A student's application for a task (with `description`, optional `isAccepted`, `response`) |
| `businessInvite` | `business`, `key` | Links an invite key to a business |

---

## 2. Constraints

### C-AUTH: Authentication & Session Constraints

#### C-AUTH-01 — JWT Required for Protected Endpoints

- **Purpose:** Ensures that only authenticated users can access application data, protecting the integrity of student-organization interactions.
- **Stakeholder Benefit:**
  - *Students:* Their profile and registration data is protected from anonymous access.
  - *Supervisors:* Their business data and project information is protected.
  - *Teachers:* System-wide administrative actions require verified identity.
  - *Administrators:* Authentication creates an auditable access trail.
- **Rule Description:** Every HTTP request except those in the [`EXCLUDED_ENDPOINTS`](../projojo_backend/auth/jwt_middleware.py#L10) list must include a valid `Authorization: Bearer <token>` header. The JWT is validated by [`JWTMiddleware`](../projojo_backend/auth/jwt_middleware.py#L26). If missing or invalid, a `401` response is returned. CORS preflight (`OPTIONS`) requests bypass JWT validation. **Exception:** Routes decorated with `@auth(role="unauthenticated")` silently ignore JWT validation errors (the middleware inspects the route's `auth_role` attribute at [`jwt_middleware.py:50`](../projojo_backend/auth/jwt_middleware.py#L50) and suppresses errors at [`jwt_middleware.py:68-73`](../projojo_backend/auth/jwt_middleware.py#L68)), allowing unauthenticated-only endpoints like login/callback to function without a token.
- **Code References:**
  - Backend middleware: [`jwt_middleware.py → JWTMiddleware.dispatch()`](../projojo_backend/auth/jwt_middleware.py#L27)
  - Unauthenticated route bypass: [`jwt_middleware.py:50, 68-73`](../projojo_backend/auth/jwt_middleware.py#L50)
  - Token validation: [`jwt_utils.py → get_token_payload()`](../projojo_backend/auth/jwt_utils.py#L41)
  - Frontend token injection: [`services.js → fetchWithError()`](../projojo_frontend/src/services.js#L74) — reads `localStorage.getItem("token")`

#### C-AUTH-02 — JWT Expiration (8 Hours)

- **Purpose:** Limits the window of a compromised token, balancing security with user convenience for a full work day.
- **Stakeholder Benefit:**
  - *All users:* Sessions expire automatically, reducing risk of unauthorized access from shared devices.
- **Rule Description:** JWT tokens expire after 480 minutes (8 hours). The constant [`JWT_EXPIRATION_TIME_MINUTES`](../projojo_backend/auth/jwt_utils.py#L12) is set to `60 * 8`. Expired tokens receive a `401` with message "Je sessie is verlopen. Log opnieuw in."
- **Code References:**
  - Backend: [`jwt_utils.py:12`](../projojo_backend/auth/jwt_utils.py), [`jwt_utils.py:54-55`](../projojo_backend/auth/jwt_utils.py#L54)

#### C-AUTH-03 — Supervisor JWT Must Contain `businessId`

- **Purpose:** Ensures that every authenticated supervisor session is bound to a specific business, enabling ownership checks without extra database queries.
- **Stakeholder Benefit:**
  - *Supervisors:* Can only interact with their own business's resources.
  - *Students/Teachers:* Protected from mistakes or misuse by supervisors operating outside their scope.
- **Rule Description:** During JWT validation in [`JWTMiddleware`](../projojo_backend/auth/jwt_middleware.py#L56), if `payload.role == "supervisor"` and `businessId` is absent from the payload, a `401` is raised: "Je sessie is ongeldig. Log opnieuw in." The `businessId` is included in the JWT at creation time in [`create_jwt_token()`](../projojo_backend/auth/jwt_utils.py#L34) only when `role == "supervisor"`.
- **Code References:**
  - Backend middleware: [`jwt_middleware.py:56-61`](../projojo_backend/auth/jwt_middleware.py#L56)
  - Token creation: [`jwt_utils.py:34-35`](../projojo_backend/auth/jwt_utils.py#L34)
  - Auth service: [`auth_service.py:34-44`](../projojo_backend/service/auth_service.py#L34)

#### C-AUTH-04 — JWT Secret Key Must Be Non-Empty

- **Purpose:** Prevents the application from starting with an insecure or missing JWT secret.
- **Stakeholder Benefit:**
  - *Administrators:* The system will not run in an insecure configuration.
- **Rule Description:** At module load time, if [`JWT_SECRET_KEY`](../projojo_backend/auth/jwt_utils.py#L14) is falsy or whitespace-only, an `Exception` is raised, preventing the application from starting.
- **Code References:**
  - Backend: [`jwt_utils.py:14-15`](../projojo_backend/auth/jwt_utils.py#L14)

#### C-AUTH-05 — Existing Users Cannot Use Invite Tokens

- **Purpose:** Prevents duplicate account creation and ensures the invite flow is only for new supervisor onboarding.
- **Stakeholder Benefit:**
  - *Supervisors:* Prevents confusion from accidentally creating a second account.
  - *Administrators:* Maintains clean user data integrity.
- **Rule Description:** In [`AuthService._get_or_create_user()`](../projojo_backend/service/auth_service.py#L174), if a user already exists (matched by OAuth sub + provider) and an `invite_token` is provided, a `ValueError` is raised: "Je hebt al een account. Log in zonder uitnodiging."
- **Code References:**
  - Backend: [`auth_service.py:193-194`](../projojo_backend/service/auth_service.py#L193)

#### C-AUTH-06 — New Users Without Invite Are Rejected

- **Purpose:** Enforces that all non-student users can only join via explicit invitation, maintaining organizational trust boundaries.
- **Stakeholder Benefit:**
  - *Organizations:* Only authorized individuals become supervisors.
  - *Administrators:* Prevents unauthorized supervisor account creation.
- **Rule Description:** In [`AuthService._get_or_create_user()`](../projojo_backend/service/auth_service.py#L214), if a new user (no matching OAuth sub) logs in without an invite token using Google, Microsoft, or GitHub, a `ValueError` is raised: "Registratie als supervisor vereist een uitnodiging. Studenten moeten inloggen met hun HAN-account."
- **Code References:**
  - Backend: [`auth_service.py:214-216`](../projojo_backend/service/auth_service.py#L214)
  - ⚠️ **Note:** The current code raises this error for *all* OAuth providers (Google/Microsoft/GitHub), effectively meaning *no* new user can register without an invite token. See [Risk R-02](#r-02--student-registration-path-is-unreachable).

---

### C-RBAC: Role-Based Access Control

#### C-RBAC-01 — Role Hierarchy

- **Purpose:** Establishes a clear permission hierarchy ensuring each user type can only perform actions appropriate to their role in the student-organization ecosystem.
- **Stakeholder Benefit:**
  - *Students:* Can manage their own profiles and registrations.
  - *Supervisors:* Can manage their business, projects, tasks, and review registrations.
  - *Teachers:* Have full oversight and can perform any supervisor action plus teacher-only actions.
- **Rule Description:** The [`auth()`](../projojo_backend/auth/permissions.py#L17) decorator enforces role checks via [`_check_role_permitted()`](../projojo_backend/auth/permissions.py#L107):
  - `"unauthenticated"` → Only `None` role (not logged in)
  - `"authenticated"` → Any of `student`, `supervisor`, `teacher`
  - `"student"` → Only `student`
  - `"supervisor"` → `supervisor` OR `teacher` (teachers inherit supervisor permissions)
  - `"teacher"` → Only `teacher`
- **Code References:**
  - Backend: [`permissions.py → _check_role_permitted()`](../projojo_backend/auth/permissions.py#L107)
  - Frontend role parsing: [`AuthProvider.jsx → processToken()`](../projojo_frontend/src/auth/AuthProvider.jsx#L15)

#### C-RBAC-02 — Teacher-Only: Business Creation

- **Purpose:** Only teachers (representing the educational institution) can create new businesses, maintaining quality control over which organizations participate.
- **Stakeholder Benefit:**
  - *Teachers:* Control which organizations enter the system.
  - *Students:* Assured that listed organizations are vetted.
- **Rule Description:** The `POST /businesses/` endpoint is decorated with `@auth(role="teacher")`.
- **Code References:**
  - Backend: [`business_router.py:76`](../projojo_backend/routes/business_router.py#L76)

#### C-RBAC-03 — Teacher-Only: Skill Acceptance/Rejection

- **Purpose:** Teachers act as gatekeepers for the skill taxonomy, ensuring only valid, well-named skills become available system-wide.
- **Stakeholder Benefit:**
  - *Teachers:* Maintain a clean, standardized skill catalog.
  - *Students:* Benefit from a curated skill taxonomy relevant to their field.
  - *Supervisors:* Can rely on skill names to accurately represent competencies.
- **Rule Description:** The `PATCH /skills/{skill_id}/acceptance` and `PATCH /skills/{skill_id}/name` endpoints are decorated with `@auth(role="teacher")`.
- **Code References:**
  - Backend: [`skill_router.py:54`](../projojo_backend/routes/skill_router.py#L54), [`skill_router.py:93`](../projojo_backend/routes/skill_router.py#L93)

#### C-RBAC-04 — Student-Only: Task Registration Creation

- **Purpose:** Only students can register for tasks, as they are the ones performing the work.
- **Stakeholder Benefit:**
  - *Students:* The registration represents their personal commitment.
  - *Supervisors:* Registrations always come from verified student accounts.
- **Rule Description:** The `POST /tasks/{task_id}/registrations` endpoint is decorated with `@auth(role="student")`. The `student_id` is extracted from `request.state.user_id`, not from the request body.
- **Code References:**
  - Backend: [`task_router.py:134-135`](../projojo_backend/routes/task_router.py#L134)

#### C-RBAC-05 — Student-Only: Profile Self-Update

- **Purpose:** Students can only modify their own profile data, preventing impersonation.
- **Stakeholder Benefit:**
  - *Students:* Full control over their own profile presentation.
- **Rule Description:** The `PUT /students/{student_id}` and `PUT /students/{student_id}/skills` endpoints use `@auth(role="student", owner_id_key="student_id")`, requiring both the `student` role and matching user ID.
- **Code References:**
  - Backend: [`student_router.py:94-95`](../projojo_backend/routes/student_router.py#L94), [`student_router.py:37-38`](../projojo_backend/routes/student_router.py#L37)

---

### C-OWN: Ownership & Resource Scoping

#### C-OWN-01 — Students Own Only Their Own Resources

- **Purpose:** Prevents students from accessing or modifying other students' profiles.
- **Stakeholder Benefit:**
  - *Students:* Privacy of personal data (CV, skills, descriptions) is assured.
- **Rule Description:** In [`_validate_ownership()`](../projojo_backend/auth/permissions.py#L167), when `user_role == "student"`, the function checks that `resource_id == user_id` for `owner_key` values `"user_id"` or `"student_id"`. All other resource types return `False` for students.
- **Code References:**
  - Backend: [`permissions.py:191-197`](../projojo_backend/auth/permissions.py#L191)

#### C-OWN-02 — Supervisors Own Only Resources Within Their Business

- **Purpose:** Ensures supervisors can only manage projects, tasks, and colleagues within their assigned business.
- **Stakeholder Benefit:**
  - *Organizations:* Business data is isolated between companies.
  - *Supervisors:* Can efficiently manage their own business without accessing competitors' data.
- **Rule Description:** In [`_check_supervisor_ownership()`](../projojo_backend/auth/permissions.py#L212), the system uses [`UserRepository.get_supervisor_accessible_resources_with_id()`](../projojo_backend/domain/repositories/user_repository.py#L649) to query TypeDB for projects, tasks, and users belonging to the supervisor's `business_id`. For `company_id`/`business_id` resource keys, a direct comparison against the JWT `businessId` is performed.
- **Code References:**
  - Backend: [`permissions.py:212-266`](../projojo_backend/auth/permissions.py#L212)
  - Repository: [`user_repository.py:649-703`](../projojo_backend/domain/repositories/user_repository.py#L649)

#### C-OWN-03 — Teachers Bypass Ownership Checks

- **Purpose:** Teachers have institution-wide oversight, so resource ownership does not restrict them.
- **Stakeholder Benefit:**
  - *Teachers:* Can review and manage any business, project, or task for academic quality oversight.
- **Rule Description:** In the [`auth()`](../projojo_backend/auth/permissions.py#L74) decorator, ownership validation is skipped when `user_role == "teacher"`.
- **Code References:**
  - Backend: [`permissions.py:74`](../projojo_backend/auth/permissions.py#L74)

#### C-OWN-04 — Skills Are Global (Not Business-Scoped)

- **Purpose:** Skills are shared across the entire platform, not owned by any specific business.
- **Stakeholder Benefit:**
  - *All users:* A unified skill taxonomy promotes consistency and interoperability.
- **Rule Description:** In [`_check_supervisor_ownership()`](../projojo_backend/auth/permissions.py#L238), `resource_key == "skill_id"` always returns `False` for supervisors, meaning supervisors cannot "own" skills. All authenticated users can read skills (`@auth(role="authenticated")`), and supervisors can create skills (`@auth(role="supervisor")`).
- **Code References:**
  - Backend: [`permissions.py:238-239`](../projojo_backend/auth/permissions.py#L238)
  - Skill creation: [`skill_router.py:31-32`](../projojo_backend/routes/skill_router.py#L31)

---

### C-VAL: Data Validation Constraints

#### C-VAL-01 — Name Field Length (1–100 characters)

- **Purpose:** Prevents empty or excessively long entity names that would degrade UI presentation and data quality.
- **Stakeholder Benefit:**
  - *All users:* Consistent, readable names throughout the interface.
- **Rule Description:** Entity names for `business`, `project`, and `task` are validated with [`is_valid_length(name, 100)`](../projojo_backend/service/validation_service.py#L28). The text must be 1–100 characters after stripping whitespace. This is enforced only on the backend; there is no corresponding frontend validation.
- **Code References:**
  - Backend validation service: [`validation_service.py:28-43`](../projojo_backend/service/validation_service.py#L28)
  - Business router: [`business_router.py:81`](../projojo_backend/routes/business_router.py#L81), [`business_router.py:119`](../projojo_backend/routes/business_router.py#L119)
  - Project router: [`project_router.py:71`](../projojo_backend/routes/project_router.py#L71), [`project_router.py:134`](../projojo_backend/routes/project_router.py#L134)
  - Task router: [`task_router.py:202`](../projojo_backend/routes/task_router.py#L202), [`task_router.py:243`](../projojo_backend/routes/task_router.py#L243)

#### C-VAL-02 — Description Field Length (1–4000 characters, markdown-stripped)

- **Purpose:** Allows rich-text descriptions while preventing storage of excessively large content.
- **Stakeholder Benefit:**
  - *Supervisors:* Can write detailed project/task descriptions.
  - *Students:* Can read meaningful descriptions to decide on task applications.
- **Rule Description:** Descriptions for `business`, `project`, and `task` are validated with [`is_valid_length(description, 4000, strip_md=True)`](../projojo_backend/service/validation_service.py#L28). Before length checking, markdown syntax is stripped via [`strip_markdown()`](../projojo_backend/service/validation_service.py#L3). The following elements are removed: code blocks, images, links (link text is kept), headers, blockquotes, list markers (unordered and ordered), bold/italic/code/strikethrough markers. Additionally, multiple consecutive newlines are collapsed to a single newline to match visual length.
- **Code References:**
  - Backend: [`validation_service.py:3-26`](../projojo_backend/service/validation_service.py#L3), [`validation_service.py:28-43`](../projojo_backend/service/validation_service.py#L28)
  - Business router: [`business_router.py:131`](../projojo_backend/routes/business_router.py#L131)
  - Project router: [`project_router.py:83`](../projojo_backend/routes/project_router.py#L83), [`project_router.py:146`](../projojo_backend/routes/project_router.py#L146)
  - Task router: [`task_router.py:208`](../projojo_backend/routes/task_router.py#L208), [`task_router.py:249`](../projojo_backend/routes/task_router.py#L249)

#### C-VAL-03 — Location Field Length (1–255 characters)

- **Purpose:** Keeps location strings at a reasonable length for display.
- **Stakeholder Benefit:**
  - *Students:* Can see at a glance where a business or project is located.
- **Rule Description:** Location fields for `business` and `project` are validated with [`is_valid_length(location, 255)`](../projojo_backend/service/validation_service.py#L28).
- **Code References:**
  - Business router: [`business_router.py:125`](../projojo_backend/routes/business_router.py#L125)
  - Project router: [`project_router.py:77`](../projojo_backend/routes/project_router.py#L77), [`project_router.py:140`](../projojo_backend/routes/project_router.py#L140)

#### C-VAL-04 — Skill Name Must Be Non-Empty

- **Purpose:** Prevents creation of nameless skills that would be meaningless in the taxonomy.
- **Stakeholder Benefit:**
  - *All users:* Every skill has a meaningful, displayable name.
- **Rule Description:** In [`skill_router.py → create_skill()`](../projojo_backend/routes/skill_router.py#L33), the skill `name` is stripped and checked for emptiness. An empty name results in a `400` error.
- **Code References:**
  - Backend: [`skill_router.py:38-40`](../projojo_backend/routes/skill_router.py#L38)

---

### C-UNIQ: Uniqueness Constraints

#### C-UNIQ-01 — Skill Name Uniqueness (Case-Insensitive)

- **Purpose:** Prevents duplicate skill entries that would fragment the taxonomy (e.g. "Python" vs "python").
- **Stakeholder Benefit:**
  - *All users:* Clean, deduplicated skill catalog.
- **Rule Description:** Before creating a skill, [`SkillRepository.get_by_name_case_insensitive()`](../projojo_backend/domain/repositories/skill_repository.py#L51) uses a TypeQL `like` query with pattern `(?i)^{name}$` to check for existing skills. If found, a `409` is returned. The TypeDB schema also declares `name @unique` on the `skill` entity. If the existing skill is pending, the error message specifies it's awaiting review.
- **Code References:**
  - Backend router: [`skill_router.py:43-47`](../projojo_backend/routes/skill_router.py#L43)
  - Repository: [`skill_repository.py:51-74`](../projojo_backend/domain/repositories/skill_repository.py#L51)
  - Schema: [`schema.tql:59`](../projojo_backend/db/schema.tql#L59) — `owns name @card(1) @unique`

#### C-UNIQ-02 — Project Name Uniqueness Within a Business

- **Purpose:** Prevents naming confusion when a business has multiple projects.
- **Stakeholder Benefit:**
  - *Supervisors:* Project names are unambiguous within their business.
  - *Students:* Can clearly distinguish between projects at the same organization.
- **Rule Description:** Before creating a project, [`ProjectRepository.check_project_exists()`](../projojo_backend/domain/repositories/project_repository.py#L142) queries for a project with the same `name` linked to the same `business` via `hasProjects`. If found, a `400` is returned: "Project met de naam '{name}' bestaat al binnen dit bedrijf."
- **Code References:**
  - Backend router: [`project_router.py:96-100`](../projojo_backend/routes/project_router.py#L96)
  - Repository: [`project_repository.py:142-153`](../projojo_backend/domain/repositories/project_repository.py#L142)

#### C-UNIQ-03 — Task Name Uniqueness Within a Project

- **Purpose:** Prevents naming confusion when a project has multiple tasks.
- **Stakeholder Benefit:**
  - *Supervisors:* Task names are unambiguous within a project.
  - *Students:* Can clearly identify individual tasks.
- **Rule Description:** During task creation in [`TaskRepository.create()`](../projojo_backend/domain/repositories/task_repository.py#L134) and update in [`TaskRepository.update()`](../projojo_backend/domain/repositories/task_repository.py#L272), a validation query checks for existing tasks with the same name in the same project via the `containsTask` relation. On update, the current task's own ID is excluded from the conflict check.
- **Code References:**
  - Repository create: [`task_repository.py:142-167`](../projojo_backend/domain/repositories/task_repository.py#L142)
  - Repository update: [`task_repository.py:273-305`](../projojo_backend/domain/repositories/task_repository.py#L273)

#### C-UNIQ-04 — Entity IDs Are Globally Unique (UUID v4)

- **Purpose:** Ensures every entity has a globally unique identifier, preventing collisions.
- **Stakeholder Benefit:**
  - *Administrators:* Data integrity is maintained across all entities.
- **Rule Description:** All entity IDs are generated via [`generate_uuid()`](../projojo_backend/service/uuid_service.py) using Python's `uuid.uuid4()`. The TypeDB schema enforces `id @key` on all entities.
- **Code References:**
  - Backend: [`uuid_service.py`](../projojo_backend/service/uuid_service.py)
  - Schema: [`schema.tql:4`](../projojo_backend/db/schema.tql#L4) — `owns id @key`

---

### C-CARD: Cardinality Constraints

#### C-CARD-01 — Schema-Level Cardinality

- **Purpose:** TypeDB schema cardinality annotations enforce structural constraints at the database level.
- **Stakeholder Benefit:**
  - *Administrators:* Data consistency is enforced at the lowest level, preventing orphaned or malformed records.
- **Rule Description:** Key cardinality constraints from [`schema.tql`](../projojo_backend/db/schema.tql):
  - `user` owns `email @card(1)`, `fullName @card(1)`, `imagePath @card(1)` — always exactly one
  - `user` plays `oauthAuthentication:user @card(1..10)` — 1 to 10 OAuth links
  - `student` owns `description @card(0..1)`, `cvPath @card(0..1)` — optional, at most one
  - `business` owns `name @card(1)`, `description @card(1)`, `imagePath @card(1)`, `location @card(1)`
  - `project` owns `location @card(0..1)` — location is optional for projects
  - `project` plays `hasProjects:project @card(1)` — every project belongs to exactly 1 business
  - `task` plays `containsTask:task @card(1)` — every task belongs to exactly 1 project
  - `manages` relates `supervisor @card(1)` and `business @card(1)`, owns `location @card(1..)` — 1:1 per relation, with at least one location
  - `registersForTask` owns `isAccepted @card(0..1)` — accepted status is optional (pending state)
  - `inviteKey` owns `usedAt @card(0..1)` — a key is either unused or has a single used timestamp
- **Code References:**
  - Schema: [`schema.tql`](../projojo_backend/db/schema.tql) (entire file)

---

### C-FILE: File Upload Constraints

#### C-FILE-01 — Maximum File Size (5 MB)

- **Purpose:** Prevents excessively large uploads that could degrade storage and performance.
- **Stakeholder Benefit:**
  - *All users:* Fast upload and download of images and CVs.
  - *Administrators:* Bounded storage usage.
- **Rule Description:** The constant [`MAX_FILE_SIZE`](../projojo_backend/service/image_service.py#L31) is set to `5 * 1024 * 1024` (5 MB). File size is checked via `file.file.seek(0, 2)` and `file.file.tell()` in [`save_image()`](../projojo_backend/service/image_service.py#L151). Oversized files result in a `400` error.
- **Code References:**
  - Backend: [`image_service.py:31`](../projojo_backend/service/image_service.py#L31), [`image_service.py:171-179`](../projojo_backend/service/image_service.py#L171)

#### C-FILE-02 — Allowed Image MIME Types

- **Purpose:** Restricts uploaded images to common, safe formats.
- **Stakeholder Benefit:**
  - *All users:* Consistent, renderable image formats.
  - *Administrators:* Prevents malicious file uploads disguised as images.
- **Rule Description:** Only `image/jpeg`, `image/jpg`, `image/png`, and `image/webp` are accepted for image uploads. Only `application/pdf` is accepted for CV uploads. Defined in [`ALLOWED_IMAGE_MIMETYPES`](../projojo_backend/service/image_service.py#L18) and [`ALLOWED_PDF_MIMETYPES`](../projojo_backend/service/image_service.py#L26).
- **Code References:**
  - Backend: [`image_service.py:18-28`](../projojo_backend/service/image_service.py#L18)

#### C-FILE-03 — Magic Byte Validation

- **Purpose:** Ensures the actual file content matches the declared MIME type, preventing spoofing.
- **Stakeholder Benefit:**
  - *Administrators:* Defense against malicious file content.
- **Rule Description:** [`validate_header_bytes()`](../projojo_backend/service/image_service.py#L34) checks the first 12 bytes of the file against known magic numbers: PNG (starts with `\x89PNG`), JPEG (starts with `\xff\xd8`), WebP (starts with `RIFF` + `WEBP`), PDF (starts with `%PDF`).
- **Code References:**
  - Backend: [`image_service.py:34-66`](../projojo_backend/service/image_service.py#L34)

#### C-FILE-04 — Image URL Domain Whitelist

- **Purpose:** When downloading profile pictures from OAuth providers, only trusted domains are allowed.
- **Stakeholder Benefit:**
  - *Administrators:* Prevents SSRF (Server-Side Request Forgery) attacks.
- **Rule Description:** [`is_safe_url()`](../projojo_backend/service/image_service.py#L117) validates that external image URLs use HTTPS and that the hostname is in [`ALLOWED_IMAGE_DOMAINS`](../projojo_backend/service/image_service.py#L12): `avatars.githubusercontent.com` and `lh3.googleusercontent.com`.
- **Code References:**
  - Backend: [`image_service.py:12-15`](../projojo_backend/service/image_service.py#L12), [`image_service.py:117-148`](../projojo_backend/service/image_service.py#L117)

#### C-FILE-05 — Project Image Is Required on Creation

- **Purpose:** Every project must have a visual representation to enhance the browsing experience for students.
- **Stakeholder Benefit:**
  - *Students:* Can visually identify and differentiate projects.
- **Rule Description:** In [`project_router.py → create_project()`](../projojo_backend/routes/project_router.py#L90), if `image` is falsy or `image.filename` is empty, a `400` is returned: "Een projectafbeelding is verplicht."
- **Code References:**
  - Backend: [`project_router.py:90-94`](../projojo_backend/routes/project_router.py#L90)

---

### C-INVITE: Invitation Constraints

#### C-INVITE-01 — Invite Key Must Be Unused

- **Purpose:** Each invite key is single-use, ensuring controlled, traceable supervisor onboarding.
- **Stakeholder Benefit:**
  - *Organizations:* Each invite corresponds to exactly one new supervisor.
  - *Administrators:* Prevents invite key reuse and uncontrolled access.
- **Rule Description:** [`InviteRepository.validate_invite_key()`](../projojo_backend/domain/repositories/invite_repository.py#L50) includes `not { $inviteKey has usedAt $usedAt; }` in the TypeQL query, filtering out keys that already have a `usedAt` timestamp.
- **Code References:**
  - Backend: [`invite_repository.py:59`](../projojo_backend/domain/repositories/invite_repository.py#L59)

#### C-INVITE-02 — Invite Key Must Not Be Expired

- **Purpose:** Limits the time window for invitation acceptance, maintaining security of the onboarding flow.
- **Stakeholder Benefit:**
  - *Administrators:* Stale invitations automatically become invalid.
- **Rule Description:** Invite keys expire after 1 week (set via `timedelta(weeks=1)` in [`save_invite_key()`](../projojo_backend/domain/repositories/invite_repository.py#L22)). During validation, [`validate_invite_key()`](../projojo_backend/domain/repositories/invite_repository.py#L86) checks `expires_at < datetime.now()`.
- **Code References:**
  - Backend: [`invite_repository.py:22`](../projojo_backend/domain/repositories/invite_repository.py#L22), [`invite_repository.py:86-87`](../projojo_backend/domain/repositories/invite_repository.py#L86)

#### C-INVITE-03 — Frontend Invite Token Length Validation

- **Purpose:** Provides early client-side validation before making an API call.
- **Stakeholder Benefit:**
  - *Users:* Immediate feedback for obviously invalid invite URLs.
- **Rule Description:** In [`InvitePage.jsx`](../projojo_frontend/src/pages/InvitePage.jsx#L13), the token is validated for length: `token.trim().length < 16 || token.trim().length > 64` results in a redirect to `/` with an error notification.
- **Code References:**
  - Frontend: [`InvitePage.jsx:13`](../projojo_frontend/src/pages/InvitePage.jsx#L13)

---

### C-REG: Task Registration Constraints

#### C-REG-01 — Task Must Have Available Spots

- **Purpose:** Prevents over-registration, ensuring the task does not accept more students than needed.
- **Stakeholder Benefit:**
  - *Supervisors:* Won't receive more registrations than they can handle.
  - *Students:* Know when a task is full.
- **Rule Description:** In [`task_router.py → create_registration()`](../projojo_backend/routes/task_router.py#L150), the system checks `task.total_accepted >= task.total_needed`. If true, a `400` is returned: "Deze taak heeft geen beschikbare plekken meer"
- **Code References:**
  - Backend: [`task_router.py:150-151`](../projojo_backend/routes/task_router.py#L150)

#### C-REG-02 — Student Cannot Register Twice for Same Task

- **Purpose:** Prevents duplicate registrations that would waste supervisor review time.
- **Stakeholder Benefit:**
  - *Students:* Clear feedback that they're already registered.
  - *Supervisors:* No duplicate entries in their review queue.
- **Rule Description:** In [`task_router.py → create_registration()`](../projojo_backend/routes/task_router.py#L154), the student's existing registrations are fetched via [`user_repo.get_student_registrations()`](../projojo_backend/domain/repositories/user_repository.py#L404). If the `task_id` is already in the list, a `400` is returned: "Je bent al geregistreerd voor deze taak"
- **Code References:**
  - Backend: [`task_router.py:154-156`](../projojo_backend/routes/task_router.py#L154)
  - Repository: [`user_repository.py:404-423`](../projojo_backend/domain/repositories/user_repository.py#L404)

#### C-REG-03 — Cannot Accept Registration When Task Is Full

- **Purpose:** Even when reviewing existing registrations, a supervisor/teacher cannot accept beyond capacity.
- **Stakeholder Benefit:**
  - *Supervisors:* Prevented from accidentally over-committing.
- **Rule Description:** In [`task_router.py → update_registration()`](../projojo_backend/routes/task_router.py#L181), if `registration.accepted` is `True` and `task.total_accepted >= task.total_needed`, a `400` is returned.
- **Code References:**
  - Backend: [`task_router.py:181-182`](../projojo_backend/routes/task_router.py#L181)

#### C-REG-04 — Total Needed Cannot Be Less Than Already Accepted

- **Purpose:** Prevents reducing task capacity below the count of already-accepted students.
- **Stakeholder Benefit:**
  - *Supervisors:* Cannot accidentally invalidate existing acceptances.
  - *Students:* Already-accepted positions are protected.
- **Rule Description:** In [`TaskRepository.update()`](../projojo_backend/domain/repositories/task_repository.py#L307), the current `total_accepted` count is fetched. If `total_needed < current_accepted`, a `ValueError` is raised.
- **Code References:**
  - Backend: [`task_repository.py:307-324`](../projojo_backend/domain/repositories/task_repository.py#L307)

---

### C-ENV: Environment-Gated Constraints

#### C-ENV-01 — Test Login Only in Development

- **Purpose:** The test login endpoint allows bypassing OAuth for testing; it must never be available in production.
- **Stakeholder Benefit:**
  - *Administrators:* Prevents unauthorized access in production environments.
- **Rule Description:** [`POST /auth/test/login/{user_id}`](../projojo_backend/routes/auth_router.py#L108) checks [`IS_DEVELOPMENT`](../projojo_backend/config/settings.py#L14). If `False`, a `403` is returned.
- **Code References:**
  - Backend: [`auth_router.py:116-117`](../projojo_backend/routes/auth_router.py#L116)
  - Config: [`settings.py:14`](../projojo_backend/config/settings.py#L14)

#### C-ENV-02 — User Listing Only in Development

- **Purpose:** Listing all users is a debug endpoint that must not be available in production.
- **Stakeholder Benefit:**
  - *Administrators:* User data is not bulk-accessible in production.
- **Rule Description:** [`GET /users/`](../projojo_backend/routes/user_router.py#L10) checks `IS_DEVELOPMENT`. If `False`, a `403` is returned. Additionally, this endpoint is decorated with `@auth(role="unauthenticated")` and its path `/users/` is listed in [`EXCLUDED_ENDPOINTS`](../projojo_backend/auth/jwt_middleware.py#L22) so JWT validation is skipped entirely — meaning only non-authenticated users can access it (and only in development).
- **Code References:**
  - Backend: [`user_router.py:11-17`](../projojo_backend/routes/user_router.py#L11)
  - JWT exclusion: [`jwt_middleware.py:22`](../projojo_backend/auth/jwt_middleware.py#L22)

#### C-ENV-03 — File Deletion Disabled in Development

- **Purpose:** In development, uploaded files may be seed data; deleting them would break the dev environment.
- **Stakeholder Benefit:**
  - *Developers:* Seed data files persist during development.
- **Rule Description:** In [`delete_image()`](../projojo_backend/service/image_service.py#L359), if `IS_DEVELOPMENT` is `True`, the function returns `True` without performing any deletion.
- **Code References:**
  - Backend: [`image_service.py:370-371`](../projojo_backend/service/image_service.py#L370)

---

## 3. Derivations and Inferences

### D-01 — Total Registered (Pending) Count

- **Purpose:** Shows supervisors how many students have applied for a task and are awaiting review.
- **Stakeholder Benefit:**
  - *Supervisors:* See the demand for each task at a glance.
  - *Students:* Indirectly benefit as supervisors can prioritize tasks with many applicants.
- **Rule Description:** The `total_registered` field on `Task` is computed via a TypeDB aggregate sub-query: it counts `registersForTask` relations where `isAccepted` has NOT been set (neither `true` nor `false`). This means `total_registered` counts only *pending* registrations.
- **Code References:**
  - Backend: [`task_repository.py:27-30`](../projojo_backend/domain/repositories/task_repository.py#L27) (used in `get_by_id`, `get_all`, `get_tasks_by_project`)
  - Model: [`task.py:15-16`](../projojo_backend/domain/models/task.py#L15) — `total_registered: int | None`

### D-02 — Total Accepted Count

- **Purpose:** Shows how many students have been accepted for a task, enabling capacity calculations.
- **Stakeholder Benefit:**
  - *Supervisors:* Know how many spots remain.
  - *Students:* Know if a task still has openings based on `total_needed - total_accepted`.
- **Rule Description:** The `total_accepted` field on `Task` is computed via a TypeDB aggregate sub-query: it counts `registersForTask` relations where `isAccepted == true`.
- **Code References:**
  - Backend: [`task_repository.py:33-38`](../projojo_backend/domain/repositories/task_repository.py#L33)
  - Model: [`task.py:16`](../projojo_backend/domain/models/task.py#L16) — `total_accepted: int | None`

### D-03 — Registration Status Derivation (Pending / Accepted / Rejected)

- **Purpose:** Determines the status of a student's task application based on the `isAccepted` attribute.
- **Stakeholder Benefit:**
  - *Students:* Can see their application status.
  - *Supervisors:* Can filter students by status for email communication.
- **Rule Description:** A `registersForTask` relation has three possible states:
  - **Pending:** `isAccepted` has NOT been set (no value exists on the relation)
  - **Accepted:** `isAccepted == true`
  - **Rejected:** `isAccepted == false`
  
  The status is determined by TypeQL pattern matching in [`UserRepository.get_students_by_task_status()`](../projojo_backend/domain/repositories/user_repository.py#L349):
  - `"registered"` (pending): `not { $registration has isAccepted true; }; not { $registration has isAccepted false; };`
  - `"accepted"`: `$registration has isAccepted true;`
  - `"rejected"`: `$registration has isAccepted false;`
- **Code References:**
  - Backend: [`user_repository.py:349-401`](../projojo_backend/domain/repositories/user_repository.py#L349)
  - Router: [`task_router.py:36-56`](../projojo_backend/routes/task_router.py#L36)

### D-04 — User Type Derivation from Class Name

- **Purpose:** Automatically populates the `type` field on user objects based on their Python class.
- **Stakeholder Benefit:**
  - *Frontend:* Can reliably use `user.type` to determine which UI to render.
- **Rule Description:** In [`User.__init__()`](../projojo_backend/domain/models/user.py#L16), if the concrete class is not `User` and `type` is not already set, `self.type` is set to `self.__class__.__name__.lower()` (e.g., `"student"`, `"supervisor"`, `"teacher"`).
- **Code References:**
  - Backend model: [`user.py:16-19`](../projojo_backend/domain/models/user.py#L16)
  - Frontend usage: [`AuthProvider.jsx:17-28`](../projojo_frontend/src/auth/AuthProvider.jsx#L17)

### D-05 — Colleagues Derivation (Supervisor Email List)

- **Purpose:** Computes the list of fellow supervisors at the same business for a given task, supporting collaboration.
- **Stakeholder Benefit:**
  - *Supervisors:* Can easily email colleagues about a task.
- **Rule Description:** [`UserRepository.get_colleagues()`](../projojo_backend/domain/repositories/user_repository.py#L425) traverses `containsTask → hasProjects → manages` to find all supervisors linked to the same business as the task, excluding the requesting supervisor.
- **Code References:**
  - Backend: [`user_repository.py:425-453`](../projojo_backend/domain/repositories/user_repository.py#L425)
  - Router: [`task_router.py:27-33`](../projojo_backend/routes/task_router.py#L27)

### D-06 — Business Creation Defaults

- **Purpose:** When a teacher creates a business, sensible defaults are applied so the business entity is immediately valid.
- **Stakeholder Benefit:**
  - *Teachers:* Can quickly create businesses with just a name.
- **Rule Description:** In [`BusinessRepository.create()`](../projojo_backend/domain/repositories/business_repository.py#L174), new businesses are created with: `description = ""`, `imagePath = "default.png"`, `location = ""`.
- **Code References:**
  - Backend: [`business_repository.py:174-189`](../projojo_backend/domain/repositories/business_repository.py#L174)

### D-07 — Supervisor Location Inherited from Business

- **Purpose:** When a supervisor is created via invite, their `manages` relation location is set to the business's location.
- **Stakeholder Benefit:**
  - *Supervisors:* Location context is automatically propagated.
- **Rule Description:** In [`UserRepository.create_user()`](../projojo_backend/domain/repositories/user_repository.py#L578), when creating a supervisor, the business's location is fetched and used as the `location` attribute on the `manages` relation.
- **Code References:**
  - Backend: [`user_repository.py:578-598`](../projojo_backend/domain/repositories/user_repository.py#L578)

---

## 4. Operations

### OP-AUTH: Authentication Operations

#### OP-AUTH-01 — OAuth Login Flow

- **Purpose:** Allows users to authenticate using third-party OAuth providers, removing the need for local password management.
- **Stakeholder Benefit:**
  - *All users:* Convenient SSO login with trusted providers.
- **Rule Description:**
  1. User clicks login button on frontend, which navigates to `GET /auth/login/{provider}` (optionally with `?invite_token=...`)
  2. Backend stores `frontend_url` and optional `invite_token` in session, redirects to OAuth provider
  3. After provider authentication, `GET /auth/callback/{provider}` is called
  4. [`AuthService.handle_oauth_callback()`](../projojo_backend/service/auth_service.py#L16) exchanges the authorization code for a token, extracts user info, and calls [`_get_or_create_user()`](../projojo_backend/service/auth_service.py#L174)
  5. A JWT is created and the user is redirected to `{frontend_url}/auth/callback?access_token=...&is_new_user=...`
  6. [`AuthCallback.jsx`](../projojo_frontend/src/auth/AuthCallback.jsx#L5) stores the token in `localStorage` and redirects to `/home`
- **Preconditions:** User must not be authenticated (`@auth(role="unauthenticated")`)
- **Error paths:** OAuth failure redirects to frontend with `?error=auth_failed`
- **Code References:**
  - Backend: [`auth_router.py:39-106`](../projojo_backend/routes/auth_router.py#L39), [`auth_service.py:16-220`](../projojo_backend/service/auth_service.py#L16)
  - Frontend: [`AuthCallback.jsx`](../projojo_frontend/src/auth/AuthCallback.jsx), [`LoginPage.jsx`](../projojo_frontend/src/pages/LoginPage.jsx), [`InvitePage.jsx`](../projojo_frontend/src/pages/InvitePage.jsx)

#### OP-AUTH-02 — Logout

- **Purpose:** Allows users to end their session.
- **Stakeholder Benefit:**
  - *All users:* Can securely end their session.
- **Rule Description:** Logout is client-side only: [`AuthProvider.jsx → handleLogout()`](../projojo_frontend/src/auth/AuthProvider.jsx#L40) removes the token from `localStorage` and resets `authData` to `{ type: "none" }`. There is no server-side token invalidation.
- **Code References:**
  - Frontend: [`AuthProvider.jsx:40-43`](../projojo_frontend/src/auth/AuthProvider.jsx#L40)

---

### OP-BIZ: Business Operations

#### OP-BIZ-01 — Create Business

- **Purpose:** Teachers create new organizations to participate in the platform.
- **Stakeholder Benefit:**
  - *Teachers:* Can onboard new organizations.
  - *Students:* More organizations means more opportunities.
- **Rule Description:**
  - **Preconditions:** User is a teacher. Name is 1-100 characters. Business name must not already exist (key constraint).
  - **State changes:** New `business` entity with generated UUID, `description=""`, `imagePath="default.png"`, `location=""`.
  - **Error paths:** `409` if name already exists, `400` if name too long.
- **Code References:**
  - Backend: [`business_router.py:75-100`](../projojo_backend/routes/business_router.py#L75), [`business_repository.py:174-189`](../projojo_backend/domain/repositories/business_repository.py#L174)
  - Frontend: [`services.js → createNewBusiness()`](../projojo_frontend/src/services.js#L454)

#### OP-BIZ-02 — Update Business

- **Purpose:** Supervisors (or teachers) update their organization's profile to attract students.
- **Stakeholder Benefit:**
  - *Supervisors:* Can keep business information current and attractive.
  - *Students:* See accurate, up-to-date information about organizations.
- **Rule Description:**
  - **Preconditions:** User is supervisor (owner of the business) or teacher. Business must exist. Name (1-100), location (1-255), description (1-4000 after md strip).
  - **State changes:** Updated `name`, `description`, `location`, and optionally `imagePath` on the `business` entity.
  - **Cascading effects:** Old image is NOT deleted (no cascade logic for business images).
- **Code References:**
  - Backend: [`business_router.py:102-157`](../projojo_backend/routes/business_router.py#L102), [`business_repository.py:191-216`](../projojo_backend/domain/repositories/business_repository.py#L191)
  - Frontend: [`services.js → updateBusiness()`](../projojo_frontend/src/services.js#L392)

---

### OP-PROJ: Project Operations

#### OP-PROJ-01 — Create Project

- **Purpose:** Supervisors create projects within their business to organize tasks for students.
- **Stakeholder Benefit:**
  - *Supervisors:* Can define projects with descriptions, images, and locations.
  - *Students:* Can browse and discover meaningful work opportunities.
- **Rule Description:**
  - **Preconditions:** User is supervisor (owner of the business) or teacher. Name (1-100), description (1-4000), image required, project name unique within business.
  - **State changes:** New `project` entity, `hasProjects` relation linking it to the business, `creates` relation linking the supervisor to the project with `createdAt` timestamp.
  - **Error paths:** `400` for validation failures, `400` for duplicate name.
- **Code References:**
  - Backend: [`project_router.py:58-119`](../projojo_backend/routes/project_router.py#L58), [`project_repository.py:185-240`](../projojo_backend/domain/repositories/project_repository.py#L185)
  - Frontend: [`services.js → createProject()`](../projojo_frontend/src/services.js#L311)

#### OP-PROJ-02 — Update Project

- **Purpose:** Modify project details after creation.
- **Stakeholder Benefit:**
  - *Supervisors:* Can refine project information as it evolves.
- **Rule Description:**
  - **Preconditions:** User is supervisor (owner of project) or teacher. Name (1-100), description (1-4000), location (1-255 if provided).
  - **State changes:** Updated `name`, `description`, `location`, and optionally `imagePath`.
- **Code References:**
  - Backend: [`project_router.py:121-170`](../projojo_backend/routes/project_router.py#L121), [`project_repository.py:241-266`](../projojo_backend/domain/repositories/project_repository.py#L241)
  - Frontend: [`services.js → updateProject()`](../projojo_frontend/src/services.js#L416)

---

### OP-TASK: Task Operations

#### OP-TASK-01 — Create Task

- **Purpose:** Supervisors define specific work items within a project that students can apply for.
- **Stakeholder Benefit:**
  - *Supervisors:* Can break projects into concrete, manageable tasks.
  - *Students:* Can find specific, well-defined tasks matching their skills.
- **Rule Description:**
  - **Preconditions:** User is supervisor (owner of project) or teacher. Name (1-100), description (1-4000), `total_needed` (integer). Parent project must exist. Task name must be unique within the project.
  - **State changes:** New `task` entity, `containsTask` relation linking it to the project.
- **Code References:**
  - Backend: [`task_router.py:193-230`](../projojo_backend/routes/task_router.py#L193), [`task_repository.py:134-193`](../projojo_backend/domain/repositories/task_repository.py#L134)
  - Frontend: [`services.js → createTask()`](../projojo_frontend/src/services.js#L336)

#### OP-TASK-02 — Update Task

- **Purpose:** Modify task details (name, description, capacity) after creation.
- **Stakeholder Benefit:**
  - *Supervisors:* Can adjust task requirements and capacity as needs change.
- **Rule Description:**
  - **Preconditions:** User is supervisor (owner) or teacher. Task must exist. Name (1-100), description (1-4000). `total_needed` cannot be reduced below `total_accepted` (see [C-REG-04](#c-reg-04--total-needed-cannot-be-less-than-already-accepted)). Task name must be unique within project (see [C-UNIQ-03](#c-uniq-03--task-name-uniqueness-within-a-project)).
  - **State changes:** Updated `name`, `description`, `totalNeeded` on the `task` entity.
- **Code References:**
  - Backend: [`task_router.py:232-265`](../projojo_backend/routes/task_router.py#L232), [`task_repository.py:272-347`](../projojo_backend/domain/repositories/task_repository.py#L272)
  - Frontend: [`services.js → updateTask()`](../projojo_frontend/src/services.js#L404)

#### OP-TASK-03 — Update Task Skills

- **Purpose:** Supervisors define which skills a task requires, helping students find matching opportunities.
- **Stakeholder Benefit:**
  - *Supervisors:* Can specify required competencies.
  - *Students:* Can match their skills to task requirements.
- **Rule Description:**
  - **Preconditions:** User is supervisor (owner) or teacher. Task must exist. All skill IDs must exist.
  - **State changes:** Set-based update: new `requiresSkill` relations are added, removed `requiresSkill` relations are deleted, unchanged ones persist.
- **Code References:**
  - Backend: [`task_router.py:83-122`](../projojo_backend/routes/task_router.py#L83), [`skill_repository.py:234-266`](../projojo_backend/domain/repositories/skill_repository.py#L234)
  - Frontend: [`services.js → updateTaskSkills()`](../projojo_frontend/src/services.js#L380)

---

### OP-REG: Registration Operations

#### OP-REG-01 — Register for Task

- **Purpose:** Students apply for a task by providing a motivation.
- **Stakeholder Benefit:**
  - *Students:* Can express interest and provide their motivation.
  - *Supervisors:* Receive applications with context to make informed selection decisions.
- **Rule Description:**
  - **Preconditions:** User is a student. Task must exist. Task must have available spots (`total_accepted < total_needed`). Student must not already be registered for this task.
  - **State changes:** New `registersForTask` relation linking the student to the task with `description` (motivation) and `createdAt`. `isAccepted` is NOT set (tri-state: pending).
- **Code References:**
  - Backend: [`task_router.py:134-165`](../projojo_backend/routes/task_router.py#L134), [`task_repository.py:228-249`](../projojo_backend/domain/repositories/task_repository.py#L228)
  - Frontend: [`services.js → createRegistration()`](../projojo_frontend/src/services.js#L354)

#### OP-REG-02 — Accept/Reject Registration

- **Purpose:** Supervisors evaluate student applications and decide to accept or reject them.
- **Stakeholder Benefit:**
  - *Supervisors:* Can select the most suitable students.
  - *Students:* Receive a clear decision on their application and optional feedback.
- **Rule Description:**
  - **Preconditions:** User is supervisor (owner of task) or teacher. Task must exist. If accepting, task must have available spots.
  - **State changes:** `isAccepted` is set to `true` or `false` on the `registersForTask` relation. `response` is set (may be empty string).
  - **Note:** Once a registration is decided (accepted or rejected), it can be changed by updating again, since the TypeDB `update` command replaces the current value.
- **Code References:**
  - Backend: [`task_router.py:167-191`](../projojo_backend/routes/task_router.py#L167), [`task_repository.py:251-270`](../projojo_backend/domain/repositories/task_repository.py#L251)
  - Frontend: [`services.js → updateRegistration()`](../projojo_frontend/src/services.js#L369)

#### OP-REG-03 — View Open Registrations

- **Purpose:** Supervisors review pending (undecided) applications for a task.
- **Stakeholder Benefit:**
  - *Supervisors:* Can see all pending applications with student details and skills.
- **Rule Description:** The query in [`TaskRepository.get_registrations()`](../projojo_backend/domain/repositories/task_repository.py#L195) filters for registrations where `isAccepted` has NOT been set (`not { $registration has isAccepted $any_value; }`). Each result includes the student's `full_name`, `id`, and associated `skills` (with descriptions).
- **Code References:**
  - Backend: [`task_repository.py:195-226`](../projojo_backend/domain/repositories/task_repository.py#L195)
  - Router: [`task_router.py:125-132`](../projojo_backend/routes/task_router.py#L125)
  - Frontend: [`services.js → getRegistrations()`](../projojo_frontend/src/services.js#L282)

---

### OP-SKILL: Skill Operations

#### OP-SKILL-01 — Create Skill (Supervisor Proposes)

- **Purpose:** Supervisors can propose new skills when the existing taxonomy doesn't cover a task's requirements.
- **Stakeholder Benefit:**
  - *Supervisors:* Can define domain-specific skills relevant to their industry.
  - *Teachers:* Receive proposals for review to maintain taxonomy quality.
- **Rule Description:**
  - **Preconditions:** User is supervisor or teacher. Name must be non-empty. Case-insensitive duplicate check against existing skills.
  - **State changes:** New `skill` entity with `isPending` set based on the request body (presumably `true` for supervisor-created skills). Generated UUID and `createdAt` timestamp.
  - **Error paths:** `400` if name empty, `409` if duplicate (with different message for pending vs. approved duplicates).
- **Code References:**
  - Backend: [`skill_router.py:31-52`](../projojo_backend/routes/skill_router.py#L31), [`skill_repository.py:143-169`](../projojo_backend/domain/repositories/skill_repository.py#L143)
  - Frontend: [`services.js → createSkill()`](../projojo_frontend/src/services.js#L299)

#### OP-SKILL-02 — Accept/Decline Pending Skill (Teacher)

- **Purpose:** Teachers curate the skill taxonomy by approving or rejecting supervisor-proposed skills.
- **Stakeholder Benefit:**
  - *Teachers:* Maintain quality and consistency of the skill catalog.
  - *All users:* Benefit from a curated, standardized skill taxonomy.
- **Rule Description:**
  - **Preconditions:** User is teacher. Skill must exist.
  - **If accepted:** `isPending` is set to `false` via [`skill_repository.update_is_pending()`](../projojo_backend/domain/repositories/skill_repository.py#L268).
  - **If declined:** The skill is deleted via [`skill_repository.delete_with_cascade()`](../projojo_backend/domain/repositories/skill_repository.py#L304), which first removes all `requiresSkill` and `hasSkill` relations referencing the skill, then deletes the skill entity itself.
  - **Guard:** If attempting to decline a non-pending skill, a `409` is returned: "Deze skill is al verwerkt en kan niet worden verwijderd."
- **Code References:**
  - Backend: [`skill_router.py:54-91`](../projojo_backend/routes/skill_router.py#L54), [`skill_repository.py:268-336`](../projojo_backend/domain/repositories/skill_repository.py#L268)
  - Frontend: [`services.js → updateSkillAcceptance()`](../projojo_frontend/src/services.js#L560)

#### OP-SKILL-03 — Rename Skill (Teacher)

- **Purpose:** Teachers can correct typos or standardize skill names.
- **Stakeholder Benefit:**
  - *Teachers:* Can fix naming issues without deleting and recreating.
- **Rule Description:**
  - **Preconditions:** User is teacher. Skill must exist. New name must be non-empty.
  - **State changes:** `name` attribute is updated on the `skill` entity.
  - **Error paths:** `409` if new name conflicts with existing skill (unique constraint enforced by TypeDB schema `@unique` annotation).
  - ⚠️ **Note:** Unlike skill creation (which explicitly performs a case-insensitive duplicate check via `get_by_name_case_insensitive()`), skill renaming relies solely on the TypeDB schema `@unique` constraint. This means the database enforces exact uniqueness but the case-insensitive pre-check is absent — a rename to a name that differs only in casing from an existing skill may be accepted or rejected depending on TypeDB's `@unique` behavior.
- **Code References:**
  - Backend: [`skill_router.py:93-122`](../projojo_backend/routes/skill_router.py#L93), [`skill_repository.py:280-290`](../projojo_backend/domain/repositories/skill_repository.py#L280)
  - Frontend: [`services.js → updateSkillName()`](../projojo_frontend/src/services.js#L573)

---

### OP-STUDENT: Student Profile Operations

#### OP-STUDENT-01 — Update Student Profile

- **Purpose:** Students can maintain their profile (description, photo, CV) to present themselves to potential supervisors.
- **Stakeholder Benefit:**
  - *Students:* Full control over their professional presentation.
  - *Supervisors:* Can review student profiles with up-to-date information when evaluating applications.
- **Rule Description:**
  - **Preconditions:** User is student and is the owner of the profile (`owner_id_key="student_id"`). Student must exist.
  - **State changes:** Optional updates to `description`, `imagePath`, and `cvPath`. If a new profile picture is uploaded, the old one is deleted (in non-development environments). If CV is uploaded, old CV is deleted. If `cv_deleted == "true"`, `cvPath` is removed via a TypeDB `delete` query.
  - **Error paths:** `404` if student not found, `500` for general errors.
- **Code References:**
  - Backend: [`student_router.py:94-155`](../projojo_backend/routes/student_router.py#L94), [`user_repository.py:455-495`](../projojo_backend/domain/repositories/user_repository.py#L455)
  - Frontend: [`services.js → updateStudent()`](../projojo_frontend/src/services.js#L271)

#### OP-STUDENT-02 — Update Student Skills

- **Purpose:** Students declare their competencies by selecting from the global skill catalog.
- **Stakeholder Benefit:**
  - *Students:* Can showcase their abilities.
  - *Supervisors:* Can match students to tasks based on skill overlap.
- **Rule Description:**
  - **Preconditions:** User is student and owns the profile.
  - **State changes:** Set-based update: new `hasSkill` relations are created (with empty `description`), removed ones are deleted, unchanged persist.
- **Code References:**
  - Backend: [`student_router.py:37-53`](../projojo_backend/routes/student_router.py#L37), [`skill_repository.py:99-126`](../projojo_backend/domain/repositories/skill_repository.py#L99)
  - Frontend: [`services.js → updateStudentSkills()`](../projojo_frontend/src/services.js#L251)

#### OP-STUDENT-03 — Update Skill Description

- **Purpose:** Students can write a description for each of their skills, explaining their experience level.
- **Stakeholder Benefit:**
  - *Students:* Can provide context beyond just a skill tag.
  - *Supervisors:* Get richer information when reviewing student skill profiles during registration review.
- **Rule Description:**
  - **Preconditions:** User is student and owns the profile. Skill must be in the student's profile (checked via `user_repo.get_student_by_id()` → `Skills` list).
  - **State changes:** `description` attribute on the `hasSkill` relation is updated.
  - **Error paths:** `404` if student not found or skill not in their profile.
- **Code References:**
  - Backend: [`student_router.py:56-81`](../projojo_backend/routes/student_router.py#L56), [`skill_repository.py:128-141`](../projojo_backend/domain/repositories/skill_repository.py#L128)
  - Frontend: [`services.js → updateStudentSkillDescription()`](../projojo_frontend/src/services.js#L258)

---

### OP-INVITE: Invitation Operations

#### OP-INVITE-01 — Create Supervisor Invite Key

- **Purpose:** Existing supervisors (or teachers) create invite links to onboard new supervisors to their business.
- **Stakeholder Benefit:**
  - *Supervisors:* Can grow their team by inviting colleagues.
  - *Organizations:* Maintain control over who becomes a supervisor.
- **Rule Description:**
  - **Preconditions:** User is supervisor (owner of the business) or teacher. Business must exist.
  - **State changes:** New `inviteKey` entity with a cryptographically secure 32-character key (190 bits entropy), `expiresAt` set to 1 week from now, `createdAt` timestamp. `businessInvite` relation links the key to the business.
- **Code References:**
  - Backend: [`invite_router.py:21-31`](../projojo_backend/routes/invite_router.py#L21), [`invite_repository.py:10-48`](../projojo_backend/domain/repositories/invite_repository.py#L10)
  - Frontend: [`services.js → createSupervisorInviteKey()`](../projojo_frontend/src/services.js#L465)

#### OP-INVITE-02 — Validate Invite Key

- **Purpose:** Verifies that an invite link is still valid before the user proceeds with registration.
- **Stakeholder Benefit:**
  - *New supervisors:* Get clear feedback whether their invite is valid.
- **Rule Description:**
  - **Preconditions:** Endpoint is for unauthenticated users. Key must exist, must not be used, must not be expired.
  - **Returns:** Business details (id, name, image) if valid; `404` otherwise.
- **Code References:**
  - Backend: [`invite_router.py:10-19`](../projojo_backend/routes/invite_router.py#L10), [`invite_repository.py:50-96`](../projojo_backend/domain/repositories/invite_repository.py#L50)
  - Frontend: [`services.js → validateInvite()`](../projojo_frontend/src/services.js#L476), [`InvitePage.jsx`](../projojo_frontend/src/pages/InvitePage.jsx)

#### OP-INVITE-03 — Mark Invite as Used

- **Purpose:** After a new supervisor successfully creates an account via an invite, the key is marked as used to prevent reuse.
- **Stakeholder Benefit:**
  - *Administrators:* Single-use invites ensure controlled onboarding.
- **Rule Description:** After successful user creation in [`AuthService._get_or_create_user()`](../projojo_backend/service/auth_service.py#L210), [`invite_repo.mark_invite_as_used()`](../projojo_backend/domain/repositories/invite_repository.py#L98) sets `usedAt` to the current timestamp on the `inviteKey` entity.
- **Code References:**
  - Backend: [`auth_service.py:210`](../projojo_backend/service/auth_service.py#L210), [`invite_repository.py:98-116`](../projojo_backend/domain/repositories/invite_repository.py#L98)

---

## 5. Actions and Integrations

### A-01 — Email Service (SMTP Integration)

- **Purpose:** Provides the infrastructure for sending notification and invitation emails to users.
- **Stakeholder Benefit:**
  - *All users:* Can receive important communications about projects, registrations, and invitations.
  - *Supervisors:* Can notify students and colleagues about task-related updates.
- **Rule Description:** The [`email_service.py`](../projojo_backend/service/email_service.py) module provides `send_email()` and `send_templated_email()` functions that send emails via SMTP. Configuration is environment-driven:
  - `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_SMTP_USERNAME`, `EMAIL_SMTP_PASSWORD`, `EMAIL_DEFAULT_SENDER`
  - TLS/STARTTLS is auto-negotiated by `aiosmtplib`
  - Authentication is skipped when username/password are empty (for MailHog in development)
  - Three email templates exist: `base.html`, `invitation.html`, `notification.html`
- **Integration Status:** The email service module is fully implemented but currently only used by the test endpoint. No business-triggered emails are dispatched yet (no emails on registration, acceptance, rejection, or invitation). See [Risk R-05](#r-05--email-notifications-not-triggered-by-business-events).
- **Code References:**
  - Backend: [`email_service.py`](../projojo_backend/service/email_service.py) (entire file)
  - Templates: [`templates/email/base.html`](../projojo_backend/templates/email/base.html), [`templates/email/invitation.html`](../projojo_backend/templates/email/invitation.html), [`templates/email/notification.html`](../projojo_backend/templates/email/notification.html)
  - Test endpoint: [`main.py:154-190`](../projojo_backend/main.py#L154) — **flagged for removal**

### A-02 — Student Email Address Retrieval for External Communication

- **Purpose:** Enables supervisors to gather student email addresses by status (registered/accepted/rejected) for out-of-band communication.
- **Stakeholder Benefit:**
  - *Supervisors:* Can email selected groups of students about task updates.
- **Rule Description:** `GET /tasks/{task_id}/student-emails?selection=registered,accepted,rejected` returns deduplicated email addresses of students matching the given statuses. `GET /tasks/{task_id}/emails/colleagues` returns colleague supervisor email addresses.
- **Code References:**
  - Backend: [`task_router.py:36-56`](../projojo_backend/routes/task_router.py#L36), [`task_router.py:27-33`](../projojo_backend/routes/task_router.py#L27)
  - Frontend: [`services.js → getStudentEmailAddresses()`](../projojo_frontend/src/services.js#L541), [`services.js → getColleaguesEmailAddresses()`](../projojo_frontend/src/services.js#L550)

### A-03 — Static File Serving with Fallback

- **Purpose:** Serves uploaded images and PDFs via HTTP, with a fallback default image.
- **Stakeholder Benefit:**
  - *All users:* Can view profile pictures, project images, and CVs.
- **Rule Description:** The backend mounts two static file directories:
  - `/image/*` → `static/images/` with fallback to `static/default.svg` (via [`FallbackStaticFiles`](../projojo_backend/service/custom_static_files.py))
  - `/pdf/*` → `static/pdf/`
  
  These paths are in [`EXCLUDED_ENDPOINTS`](../projojo_backend/auth/jwt_middleware.py#L16) so they don't require authentication.
- **Code References:**
  - Backend: [`main.py:119-120`](../projojo_backend/main.py#L119), [`jwt_middleware.py:16-17`](../projojo_backend/auth/jwt_middleware.py#L16)

### A-04 — OAuth Profile Picture Download

- **Purpose:** Automatically saves new users' profile pictures from their OAuth provider during registration.
- **Stakeholder Benefit:**
  - *All users:* Have a profile picture immediately without manual upload.
- **Rule Description:** During user creation flow:
  - **Google:** Profile picture URL (`picture` field) is saved via [`save_image_from_url()`](../projojo_backend/service/image_service.py#L202) when [`create_user()`](../projojo_backend/domain/repositories/user_repository.py#L558) processes the URL.
  - **GitHub:** Avatar URL (`avatar_url` field) is similarly saved.
  - **Microsoft:** Profile picture bytes are downloaded via the Microsoft Graph API (`me/photo/$value`) in [`_download_microsoft_picture()`](../projojo_backend/service/auth_service.py#L149) and saved via [`save_image_from_bytes()`](../projojo_backend/service/image_service.py#L291). Only downloaded for new users.
- **Code References:**
  - Backend: [`auth_service.py:139-172`](../projojo_backend/service/auth_service.py#L139), [`user_repository.py:558-567`](../projojo_backend/domain/repositories/user_repository.py#L558), [`image_service.py:202-289`](../projojo_backend/service/image_service.py#L202)

### A-05 — Database Reset on Startup (Optional)

- **Purpose:** Allows complete database reset for development and testing environments.
- **Stakeholder Benefit:**
  - *Developers:* Can reset to a clean state quickly.
- **Rule Description:** When `RESET_DB=true` is set in environment variables, [`create_database_if_needed()`](../projojo_backend/db/initDatabase.py#L364) deletes the existing database and recreates it with the schema and seed data. After the reset, the in-memory flag `Db.reset` is set to `False` at [`initDatabase.py:387`](../projojo_backend/db/initDatabase.py#L387) to prevent repeated resets within the same process. However, the environment variable itself is not modified — a process restart with `RESET_DB=true` still set will trigger another database reset.
- **Code References:**
  - Backend: [`initDatabase.py:364-387`](../projojo_backend/db/initDatabase.py#L364), [`settings.py:41`](../projojo_backend/config/settings.py#L41)

---

## 6. Risks, Technical Debt & Observations

### R-01 — Commented-Out TypeDB Rule for Access Permissions

- **Severity:** Medium — Missing Feature
- **Description:** The TypeDB schema at [`schema.tql:116-123`](../projojo_backend/db/schema.tql#L116) contains a commented-out `rule access` that was intended to automatically create permission relations when a supervisor creates a project. The comment says "Werkt helaas nog niet :(" (Unfortunately doesn't work yet). This implies the original design envisioned automatic permission propagation that was never implemented.
- **Impact:** Permission checks rely entirely on the `manages` relation chain rather than explicit permission relations.
- **Recommendation:** Either implement the TypeDB rule or document the current approach as intentional, and remove the commented code.

### R-02 — Student Registration Path Is Unreachable

- **Severity:** High — Blocking Feature
- **Description:** In [`auth_service.py:214-216`](../projojo_backend/service/auth_service.py#L214), the code checks if `oauth_provider.provider_name in ['google', 'microsoft', 'github']` for new users without an invite token. Since these are the *only three registered OAuth providers* (see [`seed.tql:38-46`](../projojo_backend/db/seed.tql#L38)), this condition always evaluates to `True`, meaning *no new user can ever register as a student* through the application's OAuth flow. The error message says "Studenten moeten inloggen met hun HAN-account," suggesting a HAN-specific provider (likely Microsoft with specific tenant) was intended but not yet distinguished.
- **Impact:** The core mission of connecting students with organizations is blocked for new student sign-ups.
- **Recommendation:** Implement HAN-specific Microsoft OAuth tenant detection or a separate student registration provider to distinguish students from supervisors.

### R-03 — No Frontend Validation Mirroring Backend

- **Severity:** Low — UX Improvement
- **Description:** All data validation (field lengths, file types, duplicate checks) is only enforced on the backend. The frontend components do not validate inputs before submission, leading to a round-trip to the server and back for every validation error.
- **Impact:** Degraded user experience; unnecessary network requests.
- **Recommendation:** Add client-side validation in form components that mirrors the backend constraints (name: 100 chars, description: 4000 chars, location: 255 chars, file types/size).

### R-04 — No Server-Side Token Revocation

- **Severity:** Medium — Security Concern
- **Description:** Logout is implemented purely client-side (removing token from `localStorage` in [`AuthProvider.jsx:41`](../projojo_frontend/src/auth/AuthProvider.jsx#L41)). There is no server-side token blacklist or revocation mechanism. A stolen token remains valid until its 8-hour expiry.
- **Impact:** If a JWT is compromised, it cannot be invalidated before expiry.
- **Recommendation:** Consider implementing a short-lived token + refresh token pattern, or a server-side token blacklist for critical operations.

### R-05 — Email Notifications Not Triggered by Business Events

- **Severity:** Medium — Incomplete Feature
- **Description:** The email service ([`email_service.py`](../projojo_backend/service/email_service.py)) is fully implemented with templates for invitations and notifications, but no business operation actually sends an email. Key trigger points that should send emails include: new registration received, registration accepted/rejected, new invite created. Currently only a test endpoint (`POST /test/email`) uses the service.
- **Impact:** Users do not receive timely notifications about important events.
- **Recommendation:** Wire up email dispatch at key business operation points (registration creation, acceptance/rejection, invite generation). Remove the test endpoint as flagged in [`main.py:147-193`](../projojo_backend/main.py#L147).

### R-06 — Test Endpoint Left in Production Code

- **Severity:** Low — Code Hygiene
- **Description:** [`main.py:147-193`](../projojo_backend/main.py#L147) contains a test email endpoint with clear "REMOVE AFTER TESTING" comments. It checks `IS_PRODUCTION` to block production use and is additionally decorated with `@auth(role="unauthenticated")` (only non-authenticated users can use it). It should be removed from the codebase.
- **Impact:** Code clutter; slightly expanded attack surface in non-production environments.
- **Recommendation:** Remove the test endpoint and its associated imports.

### R-07 — CORS Configuration Allows All Origins

- **Severity:** Medium — Security Concern
- **Description:** In [`main.py:66-72`](../projojo_backend/main.py#L66), CORS is configured with `allow_origins=["*"]` and `allow_credentials=False`. While `allow_credentials=False` mitigates the worst risks of wildcard origins, this is more permissive than necessary.
- **Impact:** Any website can make API calls to the backend (though without credentials).
- **Recommendation:** Restrict `allow_origins` to known frontend URLs for production environments.

### R-08 — Teacher Creation via OAuth Not Supported

- **Severity:** Low — Design Gap
- **Description:** In [`user_repository.py:569-572`](../projojo_backend/domain/repositories/user_repository.py#L569), creating a teacher via OAuth raises a `501 Not Implemented` error. The TODO comment mentions needing to determine user type (student vs. teacher) based on email domain.
- **Impact:** Teachers must be pre-seeded in the database; they cannot self-register.
- **Recommendation:** Implement email-domain-based role detection (e.g., `@han.nl` → teacher, `@student.han.nl` → student) or create a separate teacher onboarding flow.

### R-09 — Inconsistent Return Types in Student Repository

- **Severity:** Low — Code Quality
- **Description:** [`UserRepository.get_student_by_id()`](../projojo_backend/domain/repositories/user_repository.py#L100) returns a raw `dict` (TypeDB query result directly), while other `get_*_by_id()` methods return Pydantic model instances. This inconsistency forces callers to handle both `dict` and model instances.
- **Impact:** Increased code complexity and potential for bugs when handling student data.
- **Recommendation:** Map student results to a `Student` Pydantic model consistently.

### R-10 — Debug Logging of Credentials in Database Initialization

- **Severity:** High — Security Risk
- **Description:** In [`initDatabase.py:46-55`](../projojo_backend/db/initDatabase.py#L46), when database connection fails with new credentials, the code dumps all environment variables (including secrets) to the console. A TODO comment acknowledges this should be restricted.
- **Impact:** Credential leakage in logs.
- **Recommendation:** Remove environment variable dumping or restrict to sanitized debug mode.

### R-11 — Registrations Cannot Be Withdrawn

- **Severity:** Medium — Missing Feature
- **Description:** Once a student registers for a task (`POST /tasks/{task_id}/registrations`), there is no endpoint to withdraw or delete the registration. The only status transitions are supervised (accept/reject by supervisor).
- **Impact:** Students who change their mind cannot unregister, potentially blocking spots in the pending queue.
- **Recommendation:** Add a `DELETE /tasks/{task_id}/registrations` endpoint for students to withdraw their pending (non-decided) registrations.

### R-12 — No Deletion Endpoints for Projects, Tasks, or Businesses

- **Severity:** Low — Design Decision / Future Need
- **Description:** The `BaseRepository` declares `delete()` as `NotImplementedError`, and no router implements delete endpoints for any major entity. Entities can only be created and updated.
- **Impact:** Incorrectly created entities cannot be removed via the application.
- **Recommendation:** Implement deletion endpoints with appropriate cascade behavior, at minimum for teacher-level users.

### R-13 — Skill `isPending` Flag Controlled by Request Body on Create

- **Severity:** Low — Potential Abuse
- **Description:** When a supervisor creates a skill via `POST /skills/`, the `is_pending` value in the request body is used directly (from the `Skill` Pydantic model). A supervisor could potentially set `is_pending=false` to bypass teacher review.
- **Impact:** Supervisor could add approved skills without teacher oversight.
- **Recommendation:** Server-side should always set `is_pending=true` when a non-teacher creates a skill, ignoring the client-provided value.

### R-14 — Undocumented Endpoints in the Codebase

- **Severity:** Low — Documentation Gap
- **Description:** Several implemented endpoints are not documented in any operation or constraint section of this document:
  - `GET /businesses/complete` — Returns all businesses with fully nested projects, tasks, and skills ([`business_router.py:48-54`](../projojo_backend/routes/business_router.py#L48))
  - `GET /businesses/basic` — Returns all businesses without projects ([`business_router.py:39-45`](../projojo_backend/routes/business_router.py#L39))
  - `GET /students/registrations` — Returns task IDs a student is registered for ([`student_router.py:83-91`](../projojo_backend/routes/student_router.py#L83))
  - `GET /typedb/status` — Dev-only TypeDB connection status check ([`main.py:126-144`](../projojo_backend/main.py#L126))
  - Supervisor and teacher routers exist as separate files ([`supervisor_router.py`](../projojo_backend/routes/supervisor_router.py), [`teacher_router.py`](../projojo_backend/routes/teacher_router.py)) but their endpoints are not documented here.
- **Impact:** Undocumented endpoints may drift from conventions or be missed in security reviews.
- **Recommendation:** Document all endpoints or explicitly mark them as internal/debug-only in the codebase.

---

## 7. Summary Statistics

| Category | Count |
|----------|-------|
| **Constraints** | 28 |
| — Authentication & Session | 6 |
| — Role-Based Access Control | 5 |
| — Ownership & Resource Scoping | 4 |
| — Data Validation | 4 |
| — Uniqueness | 4 |
| — Cardinality (schema-level) | 1 (covers multiple sub-rules) |
| — File Upload | 5 |
| — Invitation | 3 |
| — Task Registration | 4 |
| — Environment-Gated | 3 |
| **Derivations & Inferences** | 7 |
| **Operations** | 17 |
| — Authentication | 2 |
| — Business | 2 |
| — Project | 2 |
| — Task | 3 |
| — Registration | 3 |
| — Skill | 3 |
| — Student Profile | 3 |
| — Invitation | 3 |
| **Actions & Integrations** | 5 |
| **Risks / Technical Debt** | 14 |
| — High severity | 2 |
| — Medium severity | 4 |
| — Low severity | 8 |
| **Total Business Rules** | **58** |

### Entity Coverage

| TypeDB Entity | Rules Referencing It |
|--------------|---------------------|
| `user` (abstract) | C-AUTH-01, C-AUTH-02, C-RBAC-01, C-CARD-01, D-04 |
| `student` | C-RBAC-04, C-RBAC-05, C-OWN-01, C-REG-01/02, OP-REG-01/02/03, OP-STUDENT-01/02/03 |
| `supervisor` | C-AUTH-03, C-RBAC-01, C-OWN-02, OP-BIZ-02, OP-PROJ-01/02, OP-TASK-01/02/03, OP-INVITE-01 |
| `teacher` | C-RBAC-02, C-RBAC-03, C-OWN-03, R-08 |
| `business` | C-UNIQ-02, C-OWN-02, D-06, D-07, OP-BIZ-01/02 |
| `project` | C-UNIQ-02/03, C-FILE-05, OP-PROJ-01/02 |
| `task` | C-UNIQ-03, C-REG-01/03/04, D-01, D-02, OP-TASK-01/02/03, OP-REG-01/02/03 |
| `skill` | C-UNIQ-01, C-OWN-04, C-VAL-04, OP-SKILL-01/02/03, R-13 |
| `inviteKey` | C-INVITE-01/02/03, OP-INVITE-01/02/03 |
| `oauthProvider` | C-AUTH-05/06, OP-AUTH-01 |
| `registersForTask` | C-REG-01/02/03/04, D-01/02/03, OP-REG-01/02/03, R-11 |
| `manages` | C-OWN-02, D-05/07 |
| `hasSkill` | OP-STUDENT-02/03 |
| `requiresSkill` | OP-TASK-03, OP-SKILL-02 |
| `creates` | OP-PROJ-01 |
| `hasProjects` | C-UNIQ-02, OP-PROJ-01 |
| `containsTask` | C-UNIQ-03, OP-TASK-01 |
| `businessInvite` | OP-INVITE-01 |