# Business Rules Audit Report

> **Generated:** 2026-02-12  
> **Scope:** Full-stack code audit cross-referenced against [`docs/BUSINESS_RULES.md`](./BUSINESS_RULES.md)  
> **Method:** Every backend router, service, auth module, repository, model, configuration file, and key frontend file was examined line-by-line.

---

## Table of Contents

1. [Authentication & OAuth](#1-authentication--oauth)
2. [User Management](#2-user-management)
3. [Business](#3-business)
4. [Project](#4-project)
5. [Task](#5-task)
6. [Skill](#6-skill)
7. [Student Profile](#7-student-profile)
8. [Registration](#8-registration)
9. [Invitation](#9-invitation)
10. [File Upload & Image Handling](#10-file-upload--image-handling)
11. [Infrastructure & Environment](#11-infrastructure--environment)
12. [Frontend Behaviors](#12-frontend-behaviors)
13. [Read Operation Coverage Gap](#13-read-operation-coverage-gap)
14. [Summary Statistics](#14-summary-statistics)

---

## 1. Authentication & OAuth

### FINDING-AUTH-01 — HTTPS Forced for OAuth Redirect URI in Non-Development

- **File:** [`auth_router.py:50-51`](../projojo_backend/routes/auth_router.py:50)
- **Function:** `auth_login()`
- **Behavior:** When `IS_DEVELOPMENT` is `False`, the OAuth redirect URI is forcibly rewritten from `http://` to `https://` before sending to the OAuth provider. This prevents insecure callback URLs in production.
- **Suggested addition to BUSINESS_RULES.md:**

> #### C-AUTH-07 — HTTPS Redirect URI Enforcement
>
> - **Rule Description:** In non-development environments, the OAuth callback redirect URI is forced to HTTPS at [`auth_router.py:50-51`](../projojo_backend/routes/auth_router.py#L50) by replacing `http://` with `https://`. This ensures OAuth providers never redirect tokens over unencrypted connections.
> - **Code References:** [`auth_router.py:50-51`](../projojo_backend/routes/auth_router.py#L50)

---

### FINDING-AUTH-02 — Unsupported OAuth Provider Handling

- **File:** [`auth_router.py:62-66`](../projojo_backend/routes/auth_router.py:62)
- **Function:** `auth_login()`
- **Behavior:** If the `{provider}` path parameter does not match a registered OAuth client, the user is redirected to the frontend with `?error=unsupported_provider` instead of receiving an API error. Additionally, [`auth_service.py:20-21`](../projojo_backend/service/auth_service.py:20) raises a `ValueError` in the callback if the provider is unsupported.
- **Suggested addition to BUSINESS_RULES.md:**

> #### C-AUTH-08 — Unsupported OAuth Provider Rejection
>
> - **Rule Description:** If a user attempts to log in with an OAuth provider that is not registered (i.e., not `google`, `microsoft`, or `github`), the login endpoint at [`auth_router.py:62-66`](../projojo_backend/routes/auth_router.py#L62) redirects to the frontend with `?error=unsupported_provider`. The callback endpoint at [`auth_service.py:20-21`](../projojo_backend/service/auth_service.py#L20) raises a `ValueError` with "We ondersteunen '{provider}' nog niet."
> - **Code References:** [`auth_router.py:62-66`](../projojo_backend/routes/auth_router.py#L62), [`auth_service.py:20-21`](../projojo_backend/service/auth_service.py#L20), [`auth_service.py:57`](../projojo_backend/service/auth_service.py#L57)

---

### FINDING-AUTH-03 — Session Cleared After OAuth Flow Completion

- **File:** [`auth_router.py:88-89`](../projojo_backend/routes/auth_router.py:88), [`auth_router.py:97`](../projojo_backend/routes/auth_router.py:97)
- **Function:** `auth_callback()`
- **Behavior:** The server-side session (which stores `frontend_url` and `invite_token` during the OAuth flow) is explicitly cleared after both successful and failed OAuth callbacks. This is a security measure to prevent session data leakage.
- **Suggested addition to BUSINESS_RULES.md:**

> #### C-AUTH-09 — Session Cleared After OAuth Completion
>
> - **Rule Description:** After the OAuth callback completes (whether successfully or with an error), `request.session.clear()` is called at [`auth_router.py:89`](../projojo_backend/routes/auth_router.py#L89) and [`auth_router.py:97`](../projojo_backend/routes/auth_router.py#L97) to destroy all session data (frontend URL, invite token). This prevents stale session data from persisting across authentication attempts.
> - **Code References:** [`auth_router.py:88-89`](../projojo_backend/routes/auth_router.py#L88), [`auth_router.py:97`](../projojo_backend/routes/auth_router.py#L97)

---

### FINDING-AUTH-04 — OAuth User Info Extraction Varies by Provider

- **File:** [`auth_service.py:48-147`](../projojo_backend/service/auth_service.py:48)
- **Functions:** `_extract_google_user()`, `_extract_github_user()`, `_extract_microsoft_user()`
- **Behavior:** Each provider uses a different data extraction strategy that is not documented:
  - **Google:** Reads `userinfo` from the token directly; uses `sub`, `email`, `name`, `picture`.
  - **GitHub:** Makes two parallel API calls (`user` and `user/emails`); finds the primary email from the emails list (falls back to first email); uses `login` as fallback for missing name; converts `id` to string for `oauth_sub`.
  - **Microsoft:** Reads `userinfo` from token; only downloads the profile picture for **new users** (line 139-140), not for returning users.
- **Suggested addition to BUSINESS_RULES.md:**

> #### D-08 — Provider-Specific User Info Extraction
>
> - **Rule Description:** Each OAuth provider uses a different method to extract user information in [`auth_service.py:48-147`](../projojo_backend/service/auth_service.py#L48):
>   - **Google:** `userinfo` decoded from token; fields: `sub`, `email`, `name`, `picture`.
>   - **GitHub:** Two parallel API calls to `user` and `user/emails`; primary email selected via [`_find_primary_email()`](../projojo_backend/service/auth_service.py#L107) (falls back to first email); `login` name used if `name` is empty; `id` is stringified for `oauth_sub`.
>   - **Microsoft:** `userinfo` decoded from token; profile picture downloaded via Graph API (`me/photo/$value`) only for **new users** (existing users skip download).
> - **Code References:** [`auth_service.py:48-147`](../projojo_backend/service/auth_service.py#L48)

---

### FINDING-AUTH-05 — OAuth Providers Must Have No More Than One Provider at Account Creation

- **File:** [`user_repository.py:533-537`](../projojo_backend/domain/repositories/user_repository.py:533)
- **Function:** `create_user()`
- **Behavior:** When creating a new user via OAuth, two guards are enforced that are not documented:
  1. `oauth_providers` must be non-empty (400: "OAuth-providerinformatie ontbreekt")
  2. Only exactly one provider is allowed (400: "Je kan maar met één provider een account aanmaken")
- **Suggested addition to BUSINESS_RULES.md:**

> #### C-AUTH-10 — Single OAuth Provider at Account Creation
>
> - **Rule Description:** When creating a new user, [`UserRepository.create_user()`](../projojo_backend/domain/repositories/user_repository.py#L530) enforces that exactly one OAuth provider is present. Zero providers results in a `400` ("OAuth-providerinformatie ontbreekt") and more than one provider results in a `400` ("Je kan maar met één provider een account aanmaken").
> - **Code References:** [`user_repository.py:533-537`](../projojo_backend/domain/repositories/user_repository.py#L533)

---

### FINDING-AUTH-06 — OAuth Provider Existence Validated Against Database

- **File:** [`user_repository.py:542-554`](../projojo_backend/domain/repositories/user_repository.py:542)
- **Function:** `create_user()`
- **Behavior:** Before creating a user, the code queries TypeDB for the OAuth provider entity using a case-insensitive `like` pattern. If the provider does not exist in the database, a `400` is raised: "We ondersteunen '{name}' nog niet."
- **Suggested addition to BUSINESS_RULES.md:**

> #### C-AUTH-11 — OAuth Provider Must Exist in Database
>
> - **Rule Description:** During user creation, [`UserRepository.create_user()`](../projojo_backend/domain/repositories/user_repository.py#L542) validates that the OAuth provider entity exists in TypeDB using a case-insensitive name match. If not found, a `400` is returned. This ensures only providers seeded in [`seed.tql`](../projojo_backend/db/seed.tql) (Google, Microsoft, GitHub) can be used.
> - **Code References:** [`user_repository.py:542-554`](../projojo_backend/domain/repositories/user_repository.py#L542)

---

### FINDING-AUTH-07 — Frontend URL Extraction from Request Headers

- **File:** [`auth_router.py:19-36`](../projojo_backend/routes/auth_router.py:19)
- **Function:** `get_frontend_url_from_login()`
- **Behavior:** The frontend URL for OAuth redirects is dynamically determined from the request's `Referer` header (first), then `Origin` header (fallback), then the configured `FRONTEND_URL` (final fallback). This enables multi-frontend deployments without configuration changes.
- **Suggested addition to BUSINESS_RULES.md:**

> #### C-AUTH-12 — Dynamic Frontend URL Detection for OAuth Redirects
>
> - **Rule Description:** The frontend URL for post-OAuth redirects is determined dynamically by [`get_frontend_url_from_login()`](../projojo_backend/routes/auth_router.py#L19): first from the `Referer` header, then the `Origin` header, and finally falling back to the configured `FRONTEND_URL` environment variable. The resolved URL is stored in the session for use in the callback.
> - **Code References:** [`auth_router.py:19-36`](../projojo_backend/routes/auth_router.py#L19), [`auth_router.py:54-55`](../projojo_backend/routes/auth_router.py#L54)

---

### FINDING-AUTH-08 — JWT Contains `iss` (Issuer) Claim

- **File:** [`jwt_utils.py:31`](../projojo_backend/auth/jwt_utils.py:31)
- **Function:** `create_jwt_token()`
- **Behavior:** Every JWT includes `"iss": "projojo"` as the issuer claim, but this is never validated on token verification (no `issuer` parameter passed to `jwt.decode()`).
- **Suggested addition to BUSINESS_RULES.md:**

> #### C-AUTH-13 — JWT Issuer Claim
>
> - **Rule Description:** All JWTs include an `iss` (issuer) claim set to `"projojo"` at [`jwt_utils.py:31`](../projojo_backend/auth/jwt_utils.py#L31). Note: this claim is currently **not validated** during token verification at [`jwt_utils.py:53`](../projojo_backend/auth/jwt_utils.py#L53).
> - **Code References:** [`jwt_utils.py:31`](../projojo_backend/auth/jwt_utils.py#L31)

---

## 2. User Management

### FINDING-USER-01 — Supervisor Business ID Required for Account Creation

- **File:** [`user_repository.py:574-576`](../projojo_backend/domain/repositories/user_repository.py:574)
- **Function:** `create_user()`
- **Behavior:** When creating a supervisor account, `business_id` is a required parameter. If absent, a `400` is raised: "Business ID is vereist voor het aanmaken van een supervisor."
- **Suggested addition to BUSINESS_RULES.md:**

> #### C-AUTH-14 — Supervisor Creation Requires Business ID
>
> - **Rule Description:** When creating a new supervisor via [`UserRepository.create_user()`](../projojo_backend/domain/repositories/user_repository.py#L574), a `business_id` must be provided. Without it, a `400` error is returned: "Business ID is vereist voor het aanmaken van een supervisor." This ID is sourced from the validated invite token.
> - **Code References:** [`user_repository.py:574-576`](../projojo_backend/domain/repositories/user_repository.py#L574)

---

### FINDING-USER-02 — Business Must Exist and Have Location for Supervisor Creation

- **File:** [`user_repository.py:578-584`](../projojo_backend/domain/repositories/user_repository.py:578)
- **Function:** `create_user()`
- **Behavior:** When creating a supervisor, the business's location is fetched to populate the `manages` relation. If the business is not found or has no location, a `404` is raised: "Business niet gevonden of heeft geen locatie." This guard is not documented.
- **Suggested addition to BUSINESS_RULES.md:**

> #### C-REF-01 — Business Must Exist for Supervisor Creation
>
> - **Rule Description:** During supervisor account creation at [`user_repository.py:578-582`](../projojo_backend/domain/repositories/user_repository.py#L578), the referenced business must exist in the database and have a location attribute. If not, a `404` is returned.
> - **Code References:** [`user_repository.py:578-584`](../projojo_backend/domain/repositories/user_repository.py#L578)

---

### FINDING-USER-03 — `GET /users/{user_id}` Endpoint Not Documented

- **File:** [`user_router.py:22-29`](../projojo_backend/routes/user_router.py:22)
- **Function:** `get_user()`
- **Behavior:** Any authenticated user can retrieve any user's profile by ID. The endpoint is decorated with `@auth(role="authenticated")`, meaning no ownership check is performed. A student can view supervisor details and vice versa.
- **Suggested addition to BUSINESS_RULES.md:**

> #### OP-USER-01 — Read User by ID
>
> - **Preconditions:** User must be authenticated (any role).
> - **Rule Description:** `GET /users/{user_id}` returns user details for any user ID. No ownership restriction is enforced — any authenticated user can view any other user's profile. Internally, the repository tries supervisor, student, then teacher lookup in sequence.
> - **Code References:** [`user_router.py:22-29`](../projojo_backend/routes/user_router.py#L22), [`user_repository.py:17-35`](../projojo_backend/domain/repositories/user_repository.py#L17)

---

### FINDING-USER-04 — User Lookup Cascades Through All User Types

- **File:** [`user_repository.py:17-35`](../projojo_backend/domain/repositories/user_repository.py:17)
- **Function:** `get_by_id()`
- **Behavior:** `get_by_id()` tries supervisor, then student, then teacher lookup sequentially. This waterfall approach means three database queries in the worst case.
- **Suggested addition to BUSINESS_RULES.md:**

> #### D-09 — User Type Resolution by Sequential Lookup
>
> - **Rule Description:** [`UserRepository.get_by_id()`](../projojo_backend/domain/repositories/user_repository.py#L17) resolves user type by attempting lookups in order: supervisor → student → teacher. The first match is returned. If none match, an `ItemRetrievalException` is raised.
> - **Code References:** [`user_repository.py:17-35`](../projojo_backend/domain/repositories/user_repository.py#L17)

---

## 3. Business

### FINDING-BIZ-01 — Business Existence Check on Update (Undocumented Precondition)

- **File:** [`business_router.py:114-117`](../projojo_backend/routes/business_router.py:114)
- **Function:** `update_business()`
- **Behavior:** Before updating a business, the code verifies the business exists by ID. If not found, a `404` is returned: "Bedrijf niet gevonden." This precondition is not listed in OP-BIZ-02.
- **Suggested addition to OP-BIZ-02:**

> - **Additional Precondition:** Business must exist (404: "Bedrijf niet gevonden").
> - **Code Reference:** [`business_router.py:114-117`](../projojo_backend/routes/business_router.py#L114)

---

### FINDING-BIZ-02 — Business Name Key Constraint Violation Handling on Create

- **File:** [`business_router.py:90-95`](../projojo_backend/routes/business_router.py:90)
- **Function:** `create_business()`
- **Behavior:** On business creation, if the TypeDB write transaction raises an error containing "has a key constraint violation", a `409` is returned: "Er bestaat al een bedrijf met de naam '{name}'." The document mentions "key constraint" at OP-BIZ-01 but not the specific detection mechanism.
- **Suggested addition to OP-BIZ-01:**

> - **Error Detection:** Duplicate business names are detected by catching TypeDB key constraint violations (checking if the exception message contains "has a key constraint violation") at [`business_router.py:91`](../projojo_backend/routes/business_router.py#L91).

---

## 4. Project

### FINDING-PROJ-01 — Optional Location Validated Only When Provided on Create

- **File:** [`project_router.py:77-81`](../projojo_backend/routes/project_router.py:77)
- **Function:** `create_project()`
- **Behavior:** During project creation, `location` is optional (`str | None = Form(None)`). The 255-character validation at line 77 is only applied `if location` — meaning `None` location bypasses validation entirely. This conditional validation is not documented.
- **Suggested addition to C-VAL-03:**

> - **Note:** For projects, location is optional on creation. The 255-character limit is only enforced when a location value is provided (`if location`). A `None` location is stored as-is without validation. See [`project_router.py:77`](../projojo_backend/routes/project_router.py#L77).

---

### FINDING-PROJ-02 — Project Creation Requires supervisor_id from Request Body

- **File:** [`project_router.py:63`](../projojo_backend/routes/project_router.py:63)
- **Function:** `create_project()`
- **Behavior:** The `supervisor_id` is taken from the form body (not from `request.state.user_id`). The frontend must supply it. This means a supervisor could potentially supply a different supervisor's ID. This is not documented and differs from how `student_id` is extracted for registrations (from JWT).
- **Suggested addition to OP-PROJ-01:**

> - **Note:** The `supervisor_id` for the `creates` relation is taken from the request body's `supervisor_id` form field ([`project_router.py:63`](../projojo_backend/routes/project_router.py#L63)), not from the JWT. This means the caller specifies which supervisor is recorded as the project creator. This differs from task registration, where `student_id` is extracted from the JWT.

---

### FINDING-PROJ-03 — Project Creation is Two Separate Transactions

- **File:** [`project_repository.py:185-229`](../projojo_backend/domain/repositories/project_repository.py:185)
- **Function:** `ProjectRepository.create()`
- **Behavior:** Project creation executes two separate database write transactions: first to insert the project and `hasProjects` relation, then to insert the `creates` (supervisor↔project) relation. If the second transaction fails, the project exists without a `creates` link.
- **Suggested addition to OP-PROJ-01:**

> - **Implementation Detail:** Project creation at [`project_repository.py:185-229`](../projojo_backend/domain/repositories/project_repository.py#L185) consists of two separate write transactions: (1) insert the `project` entity and `hasProjects` relation, (2) insert the `creates` relation linking the supervisor. These are not atomic — a failure in the second transaction leaves a project without a recorded creator.

---

## 5. Task

### FINDING-TASK-01 — No Minimum Validation on `total_needed`

- **File:** [`task_router.py:238`](../projojo_backend/routes/task_router.py:238), [`domain/models/task.py:12`](../projojo_backend/domain/models/task.py:12)
- **Function:** `create_task()`, `update_task()`
- **Behavior:** `total_needed` is typed as `int` with no minimum value constraint. A task could be created with `total_needed = 0` or even a negative number, which would make registration checks meaningless (`total_accepted >= total_needed` would always be true for 0).
- **Suggested addition to BUSINESS_RULES.md:**

> #### C-VAL-05 — Task `total_needed` Has No Minimum Constraint (Gap)
>
> - **Rule Description:** The `totalNeeded` attribute on tasks is a plain integer with no backend validation of a minimum value. Values of 0 or negative are technically accepted by [`task_router.py:238`](../projojo_backend/routes/task_router.py#L238) and [`TaskCreate`](../projojo_backend/domain/models/task.py#L38). A `totalNeeded` of 0 would make the task permanently full.
> - **Code References:** [`task_router.py:238`](../projojo_backend/routes/task_router.py#L238), [`task.py:12`](../projojo_backend/domain/models/task.py#L12)

---

### FINDING-TASK-02 — Task Existence Check on Update (Undocumented Precondition)

- **File:** [`task_router.py:256-258`](../projojo_backend/routes/task_router.py:256)
- **Function:** `update_task()`
- **Behavior:** Before updating a task, the code verifies the task exists. If not found, a `404` is returned: "Taak niet gevonden." This precondition is not listed in OP-TASK-02.
- **Suggested addition to OP-TASK-02:**

> - **Additional Precondition:** Task must exist (404: "Taak niet gevonden.").
> - **Code Reference:** [`task_router.py:256-258`](../projojo_backend/routes/task_router.py#L256)

---

### FINDING-TASK-03 — Task Skills Update Deduplication and Validation

- **File:** [`task_router.py:98-116`](../projojo_backend/routes/task_router.py:98)
- **Function:** `update_task_skills_endpoint()`
- **Behavior:** Multiple undocumented validations occur: (1) body must be a non-null list, (2) skill IDs are deduplicated preserving order via `dict.fromkeys()`, (3) each skill ID is individually verified to exist, (4) an empty list is allowed to clear all skills. Missing skill IDs result in a `404` listing all unknown IDs.
- **Suggested addition to OP-TASK-03:**

> - **Additional Validations:** The skill ID array is deduplicated before processing. Each skill ID is individually verified to exist; if any are missing, a `404` is returned listing all unknown IDs (e.g., "Onbekende skill IDs: abc, def"). An empty array is explicitly supported to remove all skills from a task. See [`task_router.py:98-116`](../projojo_backend/routes/task_router.py#L98).

---

### FINDING-TASK-04 — Task `project_id` Validation on Create

- **File:** [`task_repository.py:135-136`](../projojo_backend/domain/repositories/task_repository.py:135)
- **Function:** `TaskRepository.create()`
- **Behavior:** Task creation validates that `project_id` is non-empty with a `ValueError`: "De taak moet bij een bestaand project horen." Then separately validates the project exists (lines 156-162) with an `ItemRetrievalException`.
- **Suggested addition to OP-TASK-01:**

> - **Additional Precondition:** `project_id` must be non-empty (`ValueError`) and the referenced project must exist in the database (`ItemRetrievalException`).
> - **Code Reference:** [`task_repository.py:135-136`](../projojo_backend/domain/repositories/task_repository.py#L135), [`task_repository.py:160-162`](../projojo_backend/domain/repositories/task_repository.py#L160)

---

## 6. Skill

### FINDING-SKILL-01 — Skill Name Normalized (Stripped) Before Creation

- **File:** [`skill_router.py:49-50`](../projojo_backend/routes/skill_router.py:49)
- **Function:** `create_skill()`
- **Behavior:** After validation, `skill.name = name` assigns the stripped name back to the skill object before persisting. This means leading/trailing whitespace is silently removed. Not documented.
- **Suggested addition to OP-SKILL-01:**

> - **Normalization:** Before persisting, the skill name is stripped of leading/trailing whitespace at [`skill_router.py:49-50`](../projojo_backend/routes/skill_router.py#L49). The normalized name is what gets stored.

---

### FINDING-SKILL-02 — Skill Acceptance Requires `accepted` Field in Body

- **File:** [`skill_router.py:64-66`](../projojo_backend/routes/skill_router.py:64)
- **Function:** `update_skill_acceptance()`
- **Behavior:** The request body must contain an `accepted` field (boolean). If missing, a `400` is returned: "Veld 'accepted' is verplicht." This required field is not documented.
- **Suggested addition to OP-SKILL-02:**

> - **Request Format:** The request body must contain `{"accepted": true|false}`. If the `accepted` field is missing, a `400` is returned. See [`skill_router.py:64-66`](../projojo_backend/routes/skill_router.py#L64).

---

### FINDING-SKILL-03 — `delete_by_id()` Exists Without Cascade (Unused)

- **File:** [`skill_repository.py:292-302`](../projojo_backend/domain/repositories/skill_repository.py:292)
- **Function:** `SkillRepository.delete_by_id()`
- **Behavior:** A simple skill deletion method exists that does NOT cascade-remove `requiresSkill` and `hasSkill` relations. It is currently unused (only `delete_with_cascade()` is called by the router). If called, it would leave orphaned relations or fail on constraint violations.
- **Suggested addition to BUSINESS_RULES.md (Risks section):**

> #### R-15 — Unused Non-Cascading Skill Deletion Method
>
> - **Description:** [`SkillRepository.delete_by_id()`](../projojo_backend/domain/repositories/skill_repository.py#L292) deletes a skill without removing its `requiresSkill` and `hasSkill` relations. This method is currently unused but could cause data integrity issues if invoked.

---

### FINDING-SKILL-04 — Task Skills `created_at` Set to `datetime.now()` as Placeholder

- **File:** [`skill_repository.py:229`](../projojo_backend/domain/repositories/skill_repository.py:229)
- **Function:** `get_task_skills()`
- **Behavior:** When fetching skills associated with a task, the `created_at` field is set to `datetime.now()` (the current time at query time) rather than the actual creation date of the skill. The query does not fetch `createdAt` for this code path.
- **Suggested addition to BUSINESS_RULES.md (Risks section):**

> #### R-16 — Task Skills Return Incorrect `created_at`
>
> - **Description:** [`SkillRepository.get_task_skills()`](../projojo_backend/domain/repositories/skill_repository.py#L204) does not fetch the `createdAt` attribute from the database. Instead, it sets `created_at=datetime.now()` as a placeholder, meaning the returned timestamp is the query time, not the actual skill creation time.

---

## 7. Student Profile

### FINDING-STUDENT-01 — CV Deletion Mechanism: Empty String Triggers DB Delete

- **File:** [`user_repository.py:472-482`](../projojo_backend/domain/repositories/user_repository.py:472)
- **Function:** `update_student()`
- **Behavior:** When `cv_path` is an empty string `""`, a TypeDB `delete` query removes the `cvPath` attribute entirely from the student. This is triggered by the frontend sending `cv_deleted: "true"` at [`student_router.py:126-128`](../projojo_backend/routes/student_router.py:126). The mechanics of this empty-string-triggers-delete convention are not documented.
- **Suggested addition to OP-STUDENT-01:**

> - **CV Deletion Mechanism:** When the frontend sends `cv_deleted=true`, the router sets `cv_filename = ""` ([`student_router.py:128`](../projojo_backend/routes/student_router.py#L128)). In the repository, an empty string `cv_path` triggers a TypeDB `delete` query that removes the `cvPath` attribute entirely ([`user_repository.py:472-482`](../projojo_backend/domain/repositories/user_repository.py#L472)), rather than setting it to an empty string.

---

### FINDING-STUDENT-02 — Old File Deletion Ordered After DB Update

- **File:** [`student_router.py:139-144`](../projojo_backend/routes/student_router.py:139)
- **Function:** `update_student()`
- **Behavior:** Old profile pictures and CVs are deleted from disk **only after** the database update succeeds. If the DB update fails, old files are preserved. If the file deletion fails, the DB update has already committed — leaving orphaned files. This ordering is deliberate but not documented.
- **Suggested addition to OP-STUDENT-01:**

> - **File Deletion Ordering:** Old profile pictures and CVs are deleted **after** successful database update ([`student_router.py:139-144`](../projojo_backend/routes/student_router.py#L139)). If the DB update fails, old files are preserved. If file deletion fails after a successful DB update, the new data is committed but old files may remain on disk.

---

## 8. Registration

### FINDING-REG-01 — Registration `response` Field Defaults to Empty String

- **File:** [`domain/models/task.py:36`](../projojo_backend/domain/models/task.py:36)
- **Model:** `RegistrationUpdate`
- **Behavior:** The `response` field on `RegistrationUpdate` defaults to `""` (empty string), not `None`. This means every accept/reject operation writes a `response` attribute to the relation, even if the supervisor provides no feedback. The frontend also defaults to `""` at [`services.js:374`](../projojo_frontend/src/services.js:374).
- **Suggested addition to OP-REG-02:**

> - **Default:** If no response text is provided, `response` defaults to an empty string `""` (not absent). This means every decided registration always has a `response` attribute, even if blank.
> - **Code Reference:** [`task.py:36`](../projojo_backend/domain/models/task.py#L36), [`services.js:374`](../projojo_frontend/src/services.js#L374)

---

## 9. Invitation

### FINDING-INVITE-01 — `mark_invite_as_used()` Uses Insert, Not Update

- **File:** [`invite_repository.py:98-116`](../projojo_backend/domain/repositories/invite_repository.py:98)
- **Function:** `mark_invite_as_used()`
- **Behavior:** The `usedAt` timestamp is added via a TypeDB `insert` statement (adding a new attribute), not an `update` (replacing an existing one). This works because `usedAt` has cardinality `@card(0..1)` — transitioning from 0 to 1. If called twice, it would attempt to add a second `usedAt`, which the cardinality constraint should reject.
- **Suggested addition to OP-INVITE-03:**

> - **Implementation Detail:** `usedAt` is set via a TypeDB `insert` statement ([`invite_repository.py:106`](../projojo_backend/domain/repositories/invite_repository.py#L106)), adding a new attribute to the `inviteKey` entity. The schema cardinality `@card(0..1)` prevents a second `usedAt` from being set.

---

### FINDING-INVITE-02 — Invite Marking Failure Does Not Roll Back User Creation

- **File:** [`auth_service.py:207-210`](../projojo_backend/service/auth_service.py:207)
- **Function:** `_get_or_create_user()`
- **Behavior:** User creation (line 207) happens before invite marking (line 210). If `mark_invite_as_used()` fails (returns `False` or raises), the supervisor account is already created but the invite key remains available for reuse.
- **Suggested addition to OP-INVITE-03:**

> - **Ordering Risk:** User creation executes before the invite is marked as used ([`auth_service.py:207-210`](../projojo_backend/service/auth_service.py#L207)). If marking fails, the new supervisor account exists but the invite key can be reused.

---

## 10. File Upload & Image Handling

### FINDING-FILE-01 — File Extension vs MIME Type Cross-Validation

- **File:** [`image_service.py:69-114`](../projojo_backend/service/image_service.py:69)
- **Function:** `validate_file_type()`
- **Behavior:** Beyond checking the MIME type allowlist, this function also verifies that the file extension matches the MIME type. For JPEG types, it supports variant extensions: `.jpg`, `.jpeg`, `.jfif`, `.pjpeg`, `.pjp`. The directory path determines whether image or PDF rules apply (by checking if the path contains "images" or "pdf"). This cross-validation is not documented.
- **Suggested addition to C-FILE-02:**

> - **Extension-MIME Cross Validation:** [`validate_file_type()`](../projojo_backend/service/image_service.py#L69) ensures the file extension matches the declared MIME type. For JPEG, the extensions `.jpg`, `.jpeg`, `.jfif`, `.pjpeg`, `.pjp` are all accepted. The target directory name determines whether image or PDF validation rules apply.

---

### FINDING-FILE-02 — URL Image Download Size Validation (Streamed)

- **File:** [`image_service.py:230-268`](../projojo_backend/service/image_service.py:230)
- **Function:** `save_image_from_url()`
- **Behavior:** When downloading profile pictures from OAuth providers, the size limit is enforced in two ways: (1) pre-check via `Content-Length` header, (2) progressive check during streaming download (aborting and cleaning up if cumulative size exceeds `MAX_FILE_SIZE`). Magic bytes are validated on the first chunk. These download-specific safeguards are not documented.
- **Suggested addition to C-FILE-01:**

> - **URL Download Size Enforcement:** When downloading OAuth profile pictures via [`save_image_from_url()`](../projojo_backend/service/image_service.py#L202), the 5 MB limit is enforced both via `Content-Length` header pre-check and progressive byte counting during streaming. If the limit is exceeded mid-download, the partial file is removed from disk.

---

### FINDING-FILE-03 — Download Timeout for External Images

- **File:** [`image_service.py:230`](../projojo_backend/service/image_service.py:230)
- **Function:** `save_image_from_url()`
- **Behavior:** The `requests.get()` call uses a 10-second timeout for downloading external images. This timeout is undocumented.
- **Suggested addition to C-FILE-04:**

> - **Download Timeout:** External image downloads use a 10-second timeout ([`image_service.py:230`](../projojo_backend/service/image_service.py#L230)). If the OAuth provider's image server does not respond within 10 seconds, the download fails silently and the user is created without a profile picture.

---

## 11. Infrastructure & Environment

### FINDING-ENV-01 — `IS_PRODUCTION` Distinct from `IS_DEVELOPMENT`

- **File:** [`config/settings.py:14-15`](../projojo_backend/config/settings.py:14)
- **Behavior:** The codebase has both `IS_DEVELOPMENT` (checks for "development") and `IS_PRODUCTION` (checks for "production"). These are not mutually exclusive — any value other than "development" or "production" makes both `False`. The test email endpoint checks `IS_PRODUCTION` ([`main.py:164`](../projojo_backend/main.py:164)) while other dev-only endpoints check `IS_DEVELOPMENT`. This creates a third implicit "preview/staging" state.
- **Suggested addition to C-ENV section:**

> #### C-ENV-04 — Three-State Environment Detection
>
> - **Rule Description:** The system recognizes three environment states based on the `ENVIRONMENT` variable: `"development"` (`IS_DEVELOPMENT=True`), `"production"` (`IS_PRODUCTION=True`), and anything else (both `False`). The test email endpoint at [`main.py:164`](../projojo_backend/main.py#L164) only blocks production (using `IS_PRODUCTION`), while dev-only endpoints like user listing and test login check `IS_DEVELOPMENT`. This means a preview/staging environment (`ENVIRONMENT=preview`) would block test login but allow test email.
> - **Code References:** [`settings.py:14-15`](../projojo_backend/config/settings.py#L14), [`main.py:164`](../projojo_backend/main.py#L164)

---

### FINDING-ENV-02 — TypeDB Password Auto-Update on First Connection

- **File:** [`initDatabase.py:30-85`](../projojo_backend/db/initDatabase.py:30)
- **Function:** `initialize_connection()`
- **Behavior:** On startup, the system tries `TYPEDB_NEW_PASSWORD` first. If that fails, it tries `TYPEDB_DEFAULT_PASSWORD` and then automatically updates the password to `TYPEDB_NEW_PASSWORD` via the TypeDB user API. This auto-migration is not documented.
- **Suggested addition to BUSINESS_RULES.md:**

> #### A-06 — TypeDB Password Auto-Migration on Startup
>
> - **Rule Description:** On startup, [`initDatabase.py:30-85`](../projojo_backend/db/initDatabase.py#L30) first attempts to connect with `TYPEDB_NEW_PASSWORD`. If that fails, it connects with `TYPEDB_DEFAULT_PASSWORD` and automatically updates the password to `TYPEDB_NEW_PASSWORD`. After the update, it reconnects with the new credentials.
> - **Code References:** [`initDatabase.py:30-85`](../projojo_backend/db/initDatabase.py#L30)

---

### FINDING-ENV-03 — TypeDB Connection Retry with Exponential Backoff

- **File:** [`initDatabase.py:88-100`](../projojo_backend/db/initDatabase.py:88)
- **Function:** `ensure_connection()`
- **Behavior:** Database connection retries up to 10 times with exponential backoff starting at 1 second. Not documented.
- **Suggested addition to BUSINESS_RULES.md:**

> #### A-07 — TypeDB Connection Retry Policy
>
> - **Rule Description:** [`Db.ensure_connection()`](../projojo_backend/db/initDatabase.py#L88) retries TypeDB connections up to 10 times with exponential backoff (initial delay: 1 second). This ensures the backend can wait for TypeDB to become available during container orchestration startup.
> - **Code References:** [`initDatabase.py:88-100`](../projojo_backend/db/initDatabase.py#L88)

---

### FINDING-ENV-04 — Session Middleware Secret Key from Environment

- **File:** [`main.py:78-81`](../projojo_backend/main.py:78)
- **Behavior:** `SessionMiddleware` uses `SESSIONS_SECRET_KEY` from environment variables for signing session cookies. This secret is separate from `JWT_SECRET_KEY`. Neither the existence of sessions nor this secret requirement is documented.
- **Suggested addition to BUSINESS_RULES.md:**

> #### C-AUTH-15 — Session Secret Key Required for OAuth Flow
>
> - **Rule Description:** The OAuth flow uses Starlette's `SessionMiddleware` (configured at [`main.py:78-81`](../projojo_backend/main.py#L78)) signed with `SESSIONS_SECRET_KEY` from environment variables. This secret must be set and is separate from `JWT_SECRET_KEY`. Sessions store the `frontend_url` and `invite_token` during the OAuth redirect flow.
> - **Code References:** [`main.py:78-81`](../projojo_backend/main.py#L78), [`settings.py:22`](../projojo_backend/config/settings.py#L22)

---

### FINDING-ENV-05 — ProxyHeaders Middleware Trusts All Hosts

- **File:** [`main.py:85`](../projojo_backend/main.py:85)
- **Behavior:** `ProxyHeadersMiddleware` is configured with `trusted_hosts=["*"]`, trusting X-Forwarded-Proto and X-Forwarded-For headers from any source. This is relevant for correctly generating HTTPS URLs behind Traefik but trusting all hosts is more permissive than necessary.
- **Suggested addition to Risks section:**

> #### R-17 — ProxyHeaders Middleware Trusts All Hosts
>
> - **Description:** [`main.py:85`](../projojo_backend/main.py#L85) configures `ProxyHeadersMiddleware(trusted_hosts=["*"])`, meaning X-Forwarded-Proto and X-Forwarded-For headers from any source are trusted. An attacker could spoof these headers to manipulate URL generation and IP detection.

---

### FINDING-ENV-06 — `UnauthorizedException` Uses HTTP 402

- **File:** [`exceptions/exceptions.py:7-11`](../projojo_backend/exceptions/exceptions.py:7)
- **Class:** `UnauthorizedException`
- **Behavior:** The `UnauthorizedException` uses HTTP status code `402` (Payment Required), which is unconventional. The standard status for unauthorized is 401, and for forbidden is 403.
- **Suggested addition to Risks section:**

> #### R-18 — `UnauthorizedException` Uses Incorrect HTTP 402 Status
>
> - **Description:** [`UnauthorizedException`](../projojo_backend/exceptions/exceptions.py#L7) returns HTTP `402` (Payment Required) instead of the conventional `401` (Unauthorized) or `403` (Forbidden). This class is registered as a global exception handler at [`main.py:113`](../projojo_backend/main.py#L113).

---

### FINDING-ENV-07 — Environment Variables Sealed After Load

- **File:** [`config/settings.py:53`](../projojo_backend/config/settings.py:53)
- **Behavior:** `env.seal()` is called after all settings are loaded, preventing any further environment variable reads at runtime. Not documented.
- **Suggested addition to BUSINESS_RULES.md:**

> #### C-ENV-05 — Environment Variables Sealed at Startup
>
> - **Rule Description:** [`settings.py:53`](../projojo_backend/config/settings.py#L53) calls `env.seal()` after loading all settings, preventing any additional environment variable reads after startup. All required variables must be present at startup time.

---

## 12. Frontend Behaviors

### FINDING-FE-01 — Auth Error Redirect Preserves Invite Token

- **File:** [`AuthCallback.jsx:31-34`](../projojo_frontend/src/auth/AuthCallback.jsx:31)
- **Function:** `AuthCallback` component
- **Behavior:** When an OAuth error occurs and an `invite_token` is present in the callback query parameters, the user is redirected back to `/invite/{invite_token}` (not to `/`). This allows them to retry registration.
- **Suggested addition to OP-AUTH-01:**

> - **Error Recovery:** If an OAuth error occurs and an invite token is present, the frontend redirects the user back to the invite page (`/invite/{token}`) at [`AuthCallback.jsx:31-34`](../projojo_frontend/src/auth/AuthCallback.jsx#L31) rather than the login page, allowing retry without re-entering the invite URL.

---

### FINDING-FE-02 — Global Unhandled Promise Rejection Handler

- **File:** [`App.jsx:30-41`](../projojo_frontend/src/App.jsx:30)
- **Function:** `App` component
- **Behavior:** The app registers a global handler for `unhandledrejection` events. If the rejected promise contains an `HttpError`, the error message is shown as a notification. Other errors show a generic "Er is een onverwachte fout opgetreden."
- **Suggested addition to BUSINESS_RULES.md:**

> #### A-08 — Global Frontend Error Handler
>
> - **Rule Description:** The frontend registers a global `unhandledrejection` handler at [`App.jsx:30-41`](../projojo_frontend/src/App.jsx#L30). API errors (`HttpError` instances) have their server-provided message displayed as a notification. Non-API errors show a generic message and are logged to the console.

---

### FINDING-FE-03 — HTTP Error Message Mapping by Status Code

- **File:** [`services.js:121-147`](../projojo_frontend/src/services.js:121)
- **Function:** `fetchWithError()`
- **Behavior:** When the server returns a non-JSON error body, the frontend maps HTTP status codes to Dutch error messages: 400→"Ongeldig verzoek", 401→"Je moet ingelogd zijn", 403→"Je hebt geen rechten", 404→"Dit konden we niet vinden", 409→"Er is een conflict", 422→"Ongeldige invoer", 429→"Te veel verzoeken". Not documented.
- **Suggested addition to BUSINESS_RULES.md:**

> #### A-09 — Frontend Fallback Error Messages
>
> - **Rule Description:** When the backend returns a non-parseable error response, [`services.js:121-147`](../projojo_frontend/src/services.js#L121) maps HTTP status codes to user-friendly Dutch messages. Status codes with custom messages: 400, 401, 403, 404, 409, 422, 429. All others show "Er is een onverwachte fout opgetreden."

---

### FINDING-FE-04 — Welcome Message Differentiates New vs Returning Users

- **File:** [`AuthCallback.jsx:44-48`](../projojo_frontend/src/auth/AuthCallback.jsx:44)
- **Function:** `AuthCallback` component
- **Behavior:** On successful login, a differentiated notification is shown: "Welkom! Je account is succesvol aangemaakt." for new users, "Welkom terug!" for returning users. The `is_new_user` flag is passed from the backend OAuth callback.
- **Suggested addition to OP-AUTH-01:**

> - **User Feedback:** On successful login, the frontend shows differentiated welcome messages ([`AuthCallback.jsx:44-48`](../projojo_frontend/src/auth/AuthCallback.jsx#L44)): "Welkom! Je account is succesvol aangemaakt." for new users, "Welkom terug!" for returning users, based on the `is_new_user` flag from the backend.

---

### FINDING-FE-05 — Logout Shows Success Notification

- **File:** [`AuthProvider.jsx:43`](../projojo_frontend/src/auth/AuthProvider.jsx:43)
- **Function:** `handleLogout()`
- **Behavior:** On logout, a success notification "Je bent uitgelogd" is displayed. Not documented.
- **Suggested addition to OP-AUTH-02:**

> - **User Feedback:** On logout, a success notification "Je bent uitgelogd" is shown at [`AuthProvider.jsx:43`](../projojo_frontend/src/auth/AuthProvider.jsx#L43).

---

## 13. Read Operation Coverage Gap

The document lacks dedicated operation entries for all read (GET) endpoints. While many reads are simple data retrieval, they enforce access control via `@auth` decorators. Below is the complete inventory of undocumented read operations:

| Endpoint | Role Required | Documented? |
|----------|---------------|-------------|
| `GET /businesses/` | `authenticated` | ❌ |
| `GET /businesses/basic` | `authenticated` | ❌ (mentioned in R-14) |
| `GET /businesses/complete` | `authenticated` | ❌ (mentioned in R-14) |
| `GET /businesses/{id}` | `authenticated` | ❌ |
| `GET /businesses/{id}/projects` | `authenticated` | ❌ |
| `GET /projects/` | `authenticated` | ❌ |
| `GET /projects/{id}` | `authenticated` | ❌ |
| `GET /projects/{id}/complete` | `authenticated` | ❌ |
| `GET /projects/{id}/tasks` | `authenticated` | ❌ |
| `GET /tasks/` | `authenticated` | ❌ |
| `GET /tasks/{id}` | `authenticated` | ❌ |
| `GET /tasks/{id}/skills` | `authenticated` | ❌ |
| `GET /skills/` | `authenticated` | ❌ |
| `GET /skills/{id}` | `authenticated` | ❌ |
| `GET /students/` | `authenticated` | ❌ |
| `GET /students/{id}/skills` | `authenticated` | ❌ |
| `GET /students/registrations` | `student` | ❌ (mentioned in R-14) |
| `GET /supervisors/` | `authenticated` | ❌ (mentioned in R-14) |
| `GET /teachers/` | `authenticated` | ❌ (mentioned in R-14) |
| `GET /users/{id}` | `authenticated` | ❌ |

**Suggested addition:** A new section `OP-READ: Read Operations` cataloging all GET endpoints with their access control requirements.

---

## 14. Summary Statistics

| Category | Count |
|----------|-------|
| **Undocumented Business Rules (Constraints/Guards)** | 16 |
| — Authentication & OAuth | 9 |
| — User Management | 3 |
| — Data Validation | 1 |
| — Environment | 3 |
| **Missing Preconditions/Guards on Documented Rules** | 5 |
| — Business update existence check | 1 |
| — Task update existence check | 1 |
| — Task skills deduplication/validation | 1 |
| — Project supervisor_id from body | 1 |
| — Task total_needed no minimum | 1 |
| **Undocumented Consequences/Side Effects** | 8 |
| — Session clearing | 1 |
| — File deletion ordering | 1 |
| — Invite marking failure risk | 1 |
| — Registration response default | 1 |
| — Frontend notifications/error handling | 4 |
| **Undocumented Read Operations** | 20 |
| **Undocumented Infrastructure/Env Behaviors** | 7 |
| **New Risks Identified** | 4 |
| **Total Findings** | **60** |
