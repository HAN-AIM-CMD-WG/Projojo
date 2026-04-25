# Business Rules: Archiving Projects, Tasks, and Businesses

> **Generated:** 2026-04-22  
> **Scope:** All archiving-related business rules across frontend, backend, database layer, middleware, and domain models.  
> **Authoritative Domain Model:** TypeDB schema at [`schema.tql`](../projojo_backend/db/schema.tql)

---

## Table of Contents

1. [Domain Model Foundation](#1-domain-model-foundation)
   1. [Archivable Entity Types](#11-archivable-entity-types)
   2. [Archive Attribute Types](#12-archive-attribute-types)
2. [Constraints](#2-constraints)
   1. [CON-01: Archive Attributes Are Optional Singletons](#con-01-archive-attributes-are-optional-singletons)
   2. [CON-02: Idempotent Archive Guard](#con-02-idempotent-archive-guard)
   3. [CON-03: Archived Entities Are Excluded from Active Queries](#con-03-archived-entities-are-excluded-from-active-queries)
   4. [CON-04: Archived Business Hides Nested Projects in Active Queries](#con-04-archived-business-hides-nested-projects-in-active-queries)
   5. [CON-05: Archived Supervisors Cannot Log In](#con-05-archived-supervisors-cannot-log-in)
   6. [CON-06: Archive Action Requires Supervisor Ownership or Teacher Role](#con-06-archive-action-requires-supervisor-ownership-or-teacher-role)
   7. [CON-07: Unarchive Action Is Teacher-Only](#con-07-unarchive-action-is-teacher-only)
   8. [CON-08: Viewing Archived Entities Is Teacher-Only](#con-08-viewing-archived-entities-is-teacher-only)
   9. [CON-09: Archived Registrations Are Excluded from Counts](#con-09-archived-registrations-are-excluded-from-counts)
   10. [CON-10: Archive Button Hidden for Already-Archived Businesses](#con-10-archive-button-hidden-for-already-archived-businesses)
   11. [CON-11: Update Button Hidden for Archived Businesses](#con-11-update-button-hidden-for-archived-businesses)
3. [Derivations and Inferences](#3-derivations-and-inferences)
   1. [DER-01: Archive Timestamp Derivation](#der-01-archive-timestamp-derivation)
   2. [DER-02: Archived Status as Filter Predicate](#der-02-archived-status-as-filter-predicate)
   3. [DER-03: Registration Counts Exclude Archived Registrations](#der-03-registration-counts-exclude-archived-registrations)
   4. [DER-04: Archived Entities Collapsible Section Counts](#der-04-archived-entities-collapsible-section-counts)
4. [Operations](#4-operations)
   1. [OPS-01: Archive a Business (Cascade)](#ops-01-archive-a-business-cascade)
   2. [OPS-02: Archive a Project (Cascade)](#ops-02-archive-a-project-cascade)
   3. [OPS-03: Archive a Task (Cascade)](#ops-03-archive-a-task-cascade)
   4. [OPS-04: Unarchive a Business (Cascade)](#ops-04-unarchive-a-business-cascade)
   5. [OPS-05: Unarchive a Project (Cascade)](#ops-05-unarchive-a-project-cascade)
   6. [OPS-06: Unarchive a Task (Cascade)](#ops-06-unarchive-a-task-cascade)
5. [Actions and Integrations](#5-actions-and-integrations)
   1. [ACT-01: Archived Supervisor Login Block with User-Facing Error](#act-01-archived-supervisor-login-block-with-user-facing-error)
   2. [ACT-02: Frontend Confirmation Modal Before Archive](#act-02-frontend-confirmation-modal-before-archive)
   3. [ACT-03: Automatic UI Refresh After Archive/Unarchive](#act-03-automatic-ui-refresh-after-archiveunarchive)
6. [Risks, Technical Debt, and Observations](#6-risks-technical-debt-and-observations)
7. [Summary Statistics](#7-summary-statistics)

---

## 1. Domain Model Foundation

### 1.1 Archivable Entity Types

The following TypeDB entity and relation types own the `archivedAt` and `archivedBy` attributes, making them archivable:

| TypeDB Type | Kind | Schema Lines | Owns `archivedAt` | Owns `archivedBy` |
|---|---|---|---|---|
| `supervisor` | entity (sub `user`) | [`schema.tql:10-14`](../projojo_backend/db/schema.tql:10) | `@card(0..1)` | `@card(0..1)` |
| `business` | entity | [`schema.tql:28-38`](../projojo_backend/db/schema.tql:28) | `@card(0..1)` | `@card(0..1)` |
| `project` | entity | [`schema.tql:40-51`](../projojo_backend/db/schema.tql:40) | `@card(0..1)` | `@card(0..1)` |
| `task` | entity | [`schema.tql:53-63`](../projojo_backend/db/schema.tql:53) | `@card(0..1)` | `@card(0..1)` |
| `registersForTask` | relation | [`schema.tql:112-120`](../projojo_backend/db/schema.tql:112) | `@card(0..1)` | `@card(0..1)` |

**Not archivable:** `student`, `teacher`, `skill`, `inviteKey`, `oauthProvider`, `oauthAuthentication`, `creates`, `manages`, `hasProjects`, `containsTask`, `requiresSkill`, `hasSkill`, `businessInvite`.

### 1.2 Archive Attribute Types

| Attribute | Value Type | Schema Line | Purpose |
|---|---|---|---|
| `archivedAt` | `datetime-tz` | [`schema.tql:153`](../projojo_backend/db/schema.tql:153) | Timestamp recording when the entity was archived |
| `archivedBy` | `string` | [`schema.tql:154`](../projojo_backend/db/schema.tql:154) | User ID of the person who triggered the archive |
| `archivedReason` | `string` | [`schema.tql:155`](../projojo_backend/db/schema.tql:155) | Textual reason for archiving (**declared but never used**) |

---

## 2. Constraints

### CON-01: Archive Attributes Are Optional Singletons

**Purpose:** Ensures that each archivable entity can be archived at most once, and that archival state is either present (archived) or absent (active). This supports the core mission by ensuring projects and tasks have a clear, unambiguous lifecycle state.

**Stakeholder Benefit:**
- **Students:** See only active, relevant tasks when browsing.
- **Supervisors:** Cannot accidentally double-archive their own entities.
- **Teachers:** Can trust that archived items have exactly one archive timestamp.
- **Administrators:** Data model integrity prevents inconsistent archive states.

**Rule Description:** In the TypeDB schema, every archivable entity owns `archivedAt @card(0..1)` and `archivedBy @card(0..1)`. This cardinality constraint ensures an entity either has zero archive attributes (active) or exactly one of each (archived). Attempting to add a second `archivedAt` to an already-archived entity would violate the cardinality constraint at the database level.

**Code References:**
- Schema: [`schema.tql:11-12`](../projojo_backend/db/schema.tql:11) (supervisor), [`schema.tql:34-35`](../projojo_backend/db/schema.tql:34) (business), [`schema.tql:46-47`](../projojo_backend/db/schema.tql:46) (project), [`schema.tql:59-60`](../projojo_backend/db/schema.tql:59) (task), [`schema.tql:119-120`](../projojo_backend/db/schema.tql:119) (registersForTask)

---

### CON-02: Idempotent Archive Guard

**Purpose:** Prevents re-archiving an entity that is already archived. This ensures that cascading archive operations do not corrupt timestamps of entities archived in previous, independent operations.

**Stakeholder Benefit:**
- **Students:** If a task was independently archived before its parent project, their registration archive timestamp reflects the original archiver, not a later cascading action.
- **Supervisors:** Archive operations are safe to invoke even if a child entity was previously archived.
- **Teachers:** Audit trail integrity is maintained.
- **Administrators:** Database consistency is upheld without requiring pre-checks.

**Rule Description:** Every archive write query includes `not { $entity has archivedAt $x; }` as a guard clause. This means the `UPDATE` statement only matches entities that do **not** already have an `archivedAt` attribute. Entities already archived are silently skipped. This is applied consistently across all cascade levels (business → projects → tasks → supervisors → registrations).

**Code References:**
- Backend: [`business_repository.py:256`](../projojo_backend/domain/repositories/business_repository.py:256), [`business_repository.py:269`](../projojo_backend/domain/repositories/business_repository.py:269), [`business_repository.py:283`](../projojo_backend/domain/repositories/business_repository.py:283), [`business_repository.py:296`](../projojo_backend/domain/repositories/business_repository.py:296), [`business_repository.py:310`](../projojo_backend/domain/repositories/business_repository.py:310)
- Backend: [`project_repository.py:285`](../projojo_backend/domain/repositories/project_repository.py:285), [`project_repository.py:298`](../projojo_backend/domain/repositories/project_repository.py:298), [`project_repository.py:311`](../projojo_backend/domain/repositories/project_repository.py:311)
- Backend: [`task_repository.py:392`](../projojo_backend/domain/repositories/task_repository.py:392), [`task_repository.py:404`](../projojo_backend/domain/repositories/task_repository.py:404)

---

### CON-03: Archived Entities Are Excluded from Active Queries

**Purpose:** Active listings (used by students to discover projects/tasks) must not show archived content. This directly supports the application's goal of connecting students with meaningful, available work.

**Stakeholder Benefit:**
- **Students:** Only see active, available projects and tasks. No confusion from stale or withdrawn opportunities.
- **Supervisors:** Their published view is clean; only active content they manage is shown.
- **Teachers:** Active overviews are trustworthy for monitoring ongoing engagement.
- **Administrators:** System operational correctness by design.

**Rule Description:** All "get active" queries (`get_by_id`, `get_all`, `get_projects_by_business`, `get_tasks_by_project`, `get_business_by_project`, `get_all_with_full_nesting`) include `not { $entity has archivedAt $var; }` filter clauses. This applies to:
- **Business queries:** `not { $business has archivedAt $archivedAt; }`
- **Project queries:** `not { $project has archivedAt $archivedAt; }` AND `not { $business has archivedAt $bArchived; }`
- **Task queries:** `not { $task has archivedAt $archivedAt; }` (and sometimes also `not { $project has archivedAt $pArchived; }`)
- **Nested business queries:** Three-level filtering: business, projects within business, and tasks within those projects.

**Code References:**
- Backend – Business: [`business_repository.py:23`](../projojo_backend/domain/repositories/business_repository.py:23), [`business_repository.py:46`](../projojo_backend/domain/repositories/business_repository.py:46), [`business_repository.py:117`](../projojo_backend/domain/repositories/business_repository.py:117), [`business_repository.py:128`](../projojo_backend/domain/repositories/business_repository.py:128), [`business_repository.py:140`](../projojo_backend/domain/repositories/business_repository.py:140)
- Backend – Project: [`project_repository.py:26-27`](../projojo_backend/domain/repositories/project_repository.py:26), [`project_repository.py:54-55`](../projojo_backend/domain/repositories/project_repository.py:54), [`project_repository.py:82-83`](../projojo_backend/domain/repositories/project_repository.py:82), [`project_repository.py:110-111`](../projojo_backend/domain/repositories/project_repository.py:110)
- Backend – Task: [`task_repository.py:21`](../projojo_backend/domain/repositories/task_repository.py:21), [`task_repository.py:60`](../projojo_backend/domain/repositories/task_repository.py:60), [`task_repository.py:99-100`](../projojo_backend/domain/repositories/task_repository.py:99)

---

### CON-04: Archived Business Hides Nested Projects in Active Queries

**Purpose:** When a business is archived, all its projects are also hidden from active views, even if the project itself was not individually archived. This ensures organizational-level archival has a complete blanket effect.

**Stakeholder Benefit:**
- **Students:** Will not see orphaned projects from a business that is no longer participating.
- **Supervisors:** N/A (their own business is archived, so they cannot log in).
- **Teachers:** Can trust that archiving a business fully removes it and all dependents from active views.
- **Administrators:** Referential integrity in active data views.

**Rule Description:** In `get_all()`, `get_by_id()`, `get_projects_by_business()`, and `get_business_by_project()` within [`ProjectRepository`](../projojo_backend/domain/repositories/project_repository.py), the query includes **both** `not { $project has archivedAt ... }` **and** `not { $business has archivedAt ... }`. This double filter means a project belonging to an archived business is hidden even if the project itself has no `archivedAt` attribute.

**Code References:**
- Backend: [`project_repository.py:26-27`](../projojo_backend/domain/repositories/project_repository.py:26), [`project_repository.py:54-55`](../projojo_backend/domain/repositories/project_repository.py:54), [`project_repository.py:82-83`](../projojo_backend/domain/repositories/project_repository.py:82), [`project_repository.py:110-111`](../projojo_backend/domain/repositories/project_repository.py:110)

---

### CON-05: Archived Supervisors Cannot Log In

**Purpose:** When a business is archived, its supervisors are also archived. This rule prevents archived supervisors from authenticating, ensuring they cannot manage resources belonging to an archived organization.

**Stakeholder Benefit:**
- **Students:** Protected from receiving communications or decisions from supervisors at inactive organizations.
- **Supervisors:** Receives a clear error message explaining why they cannot log in and whom to contact.
- **Teachers:** Full control over organizational access lifecycle; archiving a business immediately locks out its supervisors.
- **Administrators:** Security enforcement — no stale credentials can access the system.

**Rule Description:** During the OAuth callback flow, after successfully identifying the user, the system checks if the user type is `supervisor`. If so, it calls [`UserRepository.is_supervisor_archived()`](../projojo_backend/domain/repositories/user_repository.py:705) which queries TypeDB for the presence of `archivedAt` on the supervisor entity. If the attribute exists, a `ValueError` is raised with the message "Je account is gearchiveerd. Neem contact op met een docent." This error propagates through the OAuth callback handler and results in a redirect to the frontend with an error parameter.

**Code References:**
- Backend – Auth Service: [`auth_service.py:32-43`](../projojo_backend/service/auth_service.py:32) — login block logic
- Backend – User Repository: [`user_repository.py:705-716`](../projojo_backend/domain/repositories/user_repository.py:705) — `is_supervisor_archived()` query
- Backend – Auth Router: [`auth_router.py:95-100`](../projojo_backend/routes/auth_router.py:95) — error redirect with message

---

### CON-06: Archive Action Requires Supervisor Ownership or Teacher Role

**Purpose:** Only the responsible parties — a supervisor who owns the resource or a teacher with full privileges — may trigger an archive. This prevents unauthorized users from archiving content they do not manage.

**Stakeholder Benefit:**
- **Students:** Cannot accidentally or maliciously archive tasks or projects.
- **Supervisors:** Can only archive entities within their own business, preventing cross-organization interference.
- **Teachers:** Have unrestricted archive capability as system overseers.
- **Administrators:** Role-based access control is enforced at the API level.

**Rule Description:** All archive endpoints use the decorator `@auth(role="supervisor", owner_id_key="<resource_id>")`. The `auth` decorator enforces:
1. The user must be a supervisor or teacher (role hierarchy: teacher satisfies supervisor requirement).
2. If the user is a supervisor, the `owner_id_key` triggers ownership validation via [`_check_supervisor_ownership()`](../projojo_backend/auth/permissions.py:212), which verifies the resource belongs to the supervisor's company.
3. If the user is a teacher, ownership checks are bypassed entirely (line 74: `if owner_id_key and user_role != "teacher"`).

**Code References:**
- Backend – Business: [`business_router.py:168`](../projojo_backend/routes/business_router.py:168) — `@auth(role="supervisor", owner_id_key="business_id")`
- Backend – Project: [`project_router.py:131`](../projojo_backend/routes/project_router.py:131) — `@auth(role="supervisor", owner_id_key="project_id")`
- Backend – Task: [`task_router.py:34`](../projojo_backend/routes/task_router.py:34) — `@auth(role="supervisor", owner_id_key="task_id")`
- Backend – Permissions: [`permissions.py:17-104`](../projojo_backend/auth/permissions.py:17) — `auth()` decorator, [`permissions.py:167-209`](../projojo_backend/auth/permissions.py:167) — `_validate_ownership()`, [`permissions.py:212-267`](../projojo_backend/auth/permissions.py:212) — `_check_supervisor_ownership()`
- Frontend – BusinessCard: [`BusinessCard.jsx:142`](../projojo_frontend/src/components/BusinessCard.jsx:142) — UI shows archive button when `authData.type === "teacher" || authData.businessId === businessId`
- Frontend – ProjectDetails: [`ProjectDetails.jsx:162`](../projojo_frontend/src/components/ProjectDetails.jsx:162) — archive button visible when `isOwner`
- Frontend – Task: [`Task.jsx:196`](../projojo_frontend/src/components/Task.jsx:196) — archive button visible when `isOwner`

---

### CON-07: Unarchive Action Is Teacher-Only

**Purpose:** Restoring archived entities is a privileged operation restricted to teachers. This prevents supervisors from unilaterally restoring content that may have been archived for compliance or quality reasons.

**Stakeholder Benefit:**
- **Students:** N/A directly.
- **Supervisors:** Cannot self-restore after a teacher has made an archival decision.
- **Teachers:** Maintain exclusive control over which content re-enters the active system.
- **Administrators:** Governance over content lifecycle.

**Rule Description:** All unarchive endpoints use `@auth(role="teacher")`, which permits only users with the `teacher` role. Supervisors and students receive a 403 error.

**Code References:**
- Backend – Business: [`business_router.py:188`](../projojo_backend/routes/business_router.py:188) — `@auth(role="teacher")`
- Backend – Project: [`project_router.py:151`](../projojo_backend/routes/project_router.py:151) — `@auth(role="teacher")`
- Backend – Task: [`task_router.py:50`](../projojo_backend/routes/task_router.py:50) — `@auth(role="teacher")`
- Frontend – BusinessCard: [`BusinessCard.jsx:160`](../projojo_frontend/src/components/BusinessCard.jsx:160) — Unarchive button shown only when `isArchived && authData.type === "teacher"`
- Frontend – TeacherPage: [`TeacherPage.jsx:179`](../projojo_frontend/src/pages/TeacherPage.jsx:179) — Unarchive buttons for projects, [`TeacherPage.jsx:209`](../projojo_frontend/src/pages/TeacherPage.jsx:209) — Unarchive buttons for tasks

---

### CON-08: Viewing Archived Entities Is Teacher-Only

**Purpose:** Only teachers can view lists of archived businesses, projects, and tasks. This prevents students and supervisors from seeing content that has been intentionally removed from active circulation.

**Stakeholder Benefit:**
- **Students:** Not confused by stale or withdrawn data.
- **Supervisors:** Cannot see archived entities from other organizations.
- **Teachers:** Have a dedicated management view for all archived content.
- **Administrators:** Data visibility is role-consistent.

**Rule Description:** The GET endpoints for archived entities are all decorated with `@auth(role="teacher")`:
- `GET /businesses/archived/basic`
- `GET /projects/archived`
- `GET /tasks/archived`

**Code References:**
- Backend: [`business_router.py:159-160`](../projojo_backend/routes/business_router.py:159), [`project_router.py:25-26`](../projojo_backend/routes/project_router.py:25), [`task_router.py:25-26`](../projojo_backend/routes/task_router.py:25)
- Frontend: [`TeacherPage.jsx:56-58`](../projojo_frontend/src/pages/TeacherPage.jsx:56) — fetches all three archived lists on page load
- Frontend: [`services.js:215-217`](../projojo_frontend/src/services.js:215) — `getArchivedBusinessesBasic()`, [`services.js:174-176`](../projojo_frontend/src/services.js:174) — `getArchivedProjects()`, [`services.js:253-255`](../projojo_frontend/src/services.js:253) — `getArchivedTasks()`

---

### CON-09: Archived Registrations Are Excluded from Counts

**Purpose:** When computing `total_registered` and `total_accepted` for a task, archived `registersForTask` relations are excluded. This ensures slot availability calculations reflect only active registrations.

**Stakeholder Benefit:**
- **Students:** See accurate slot availability. An archived registration no longer blocks a spot.
- **Supervisors:** Management dashboards show correct counts of active registrations.
- **Teachers:** Reporting data is accurate.
- **Administrators:** Data integrity in derived counts.

**Rule Description:** In task queries that compute aggregate counts, the subqueries for `total_registered` and `total_accepted` include `not { $registration has archivedAt $regArchived; }`. This means archived registrations are not counted toward spots taken or pending applications.

**Code References:**
- Backend: [`task_repository.py:31`](../projojo_backend/domain/repositories/task_repository.py:31), [`task_repository.py:39`](../projojo_backend/domain/repositories/task_repository.py:39), [`task_repository.py:70`](../projojo_backend/domain/repositories/task_repository.py:70), [`task_repository.py:78`](../projojo_backend/domain/repositories/task_repository.py:78), [`task_repository.py:111`](../projojo_backend/domain/repositories/task_repository.py:111), [`task_repository.py:119`](../projojo_backend/domain/repositories/task_repository.py:119)

---

### CON-10: Archive Button Hidden for Already-Archived Businesses

**Purpose:** Prevents the UI from showing an archive action for a business that is already archived (displayed in the "archived" section of the teacher page).

**Stakeholder Benefit:**
- **Teachers:** No confusion from seeing an archive button on already-archived items.

**Rule Description:** In [`BusinessCard.jsx`](../projojo_frontend/src/components/BusinessCard.jsx:150), the archive button is wrapped in `{!isArchived && (...)}`, so it is only rendered when `isArchived` is `false`. The `isArchived` prop is passed from the parent component based on which list the business belongs to.

**Code References:**
- Frontend: [`BusinessCard.jsx:150`](../projojo_frontend/src/components/BusinessCard.jsx:150)
- Frontend: [`BusinessesOverview.jsx:11`](../projojo_frontend/src/components/BusinessesOverview.jsx:11) — passes `isArchived` prop
- Frontend: [`TeacherPage.jsx:131`](../projojo_frontend/src/pages/TeacherPage.jsx:131) — `isArchived={false}` for active, [`TeacherPage.jsx:153`](../projojo_frontend/src/pages/TeacherPage.jsx:153) — `isArchived={true}` for archived

---

### CON-11: Update Button Hidden for Archived Businesses

**Purpose:** Archived businesses should not be editable. The UI enforces this by hiding the update button.

**Stakeholder Benefit:**
- **Teachers:** Clear separation between active (editable) and archived (read-only) entities in the management view.

**Rule Description:** When the [`TeacherPage`](../projojo_frontend/src/pages/TeacherPage.jsx) renders the archived businesses section, it passes `showUpdateButton={false}` to [`BusinessesOverview`](../projojo_frontend/src/components/BusinessesOverview.jsx:3), which propagates to [`BusinessCard`](../projojo_frontend/src/components/BusinessCard.jsx:126). The update link is conditionally rendered only when `showUpdateButton && authData.businessId === businessId`.

**Code References:**
- Frontend: [`TeacherPage.jsx:154`](../projojo_frontend/src/pages/TeacherPage.jsx:154) — `showUpdateButton={false}` for archived businesses
- Frontend: [`BusinessCard.jsx:126`](../projojo_frontend/src/components/BusinessCard.jsx:126) — conditional rendering of "Bedrijf aanpassen"

---

## 3. Derivations and Inferences

### DER-01: Archive Timestamp Derivation

**Purpose:** The archive timestamp is automatically set to the current server time at the moment of archival. This provides an audit trail of when content was removed from active use.

**Stakeholder Benefit:**
- **Teachers:** Can see when an entity was archived (attribute persisted in TypeDB).
- **Administrators:** Audit compliance — precise timestamps for data lifecycle events.

**Rule Description:** In all archive methods (`BusinessRepository.archive()`, `ProjectRepository.archive()`, `TaskRepository.archive()`), the archive timestamp is computed as `datetime.now()` at the start of the method. This same timestamp is then applied to all entities in the cascade, ensuring all archive operations within a single cascade share the same `archivedAt` value.

**Code References:**
- Backend: [`business_repository.py:249-250`](../projojo_backend/domain/repositories/business_repository.py:249) — `ts = datetime.now()`
- Backend: [`project_repository.py:278-279`](../projojo_backend/domain/repositories/project_repository.py:278) — `ts = datetime.now()`
- Backend: [`task_repository.py:385-386`](../projojo_backend/domain/repositories/task_repository.py:385) — `ts = datetime.now()`

---

### DER-02: Archived Status as Filter Predicate

**Purpose:** The presence or absence of `archivedAt` on an entity implicitly determines its "active" or "archived" status. There is no explicit `isArchived` boolean; the status is derived from attribute existence.

**Stakeholder Benefit:**
- **All users:** There is no inconsistency between a boolean flag and a timestamp; the timestamp IS the status indicator.

**Rule Description:** Every active query uses `not { $entity has archivedAt $var; }` to filter out archived entities, and every archived-list query uses `$entity has archivedAt $var;` to include only archived ones. There is no separate `status` attribute. The derived boolean "is this entity archived?" is computed by checking `archivedAt` existence.

**Code References:**
- Backend: All repository `get_all()`, `get_by_id()` queries (see [CON-03](#con-03-archived-entities-are-excluded-from-active-queries))
- Backend: All `get_archived()` methods — [`business_repository.py:223-242`](../projojo_backend/domain/repositories/business_repository.py:223), [`project_repository.py:125-147`](../projojo_backend/domain/repositories/project_repository.py:125), [`task_repository.py:129-151`](../projojo_backend/domain/repositories/task_repository.py:129)

---

### DER-03: Registration Counts Exclude Archived Registrations

**Purpose:** Task slot availability is derived from the count of non-archived registrations. This ensures that archiving a registration frees up a slot.

**Stakeholder Benefit:**
- **Students:** Archived registrations do not block them from available spots on tasks.
- **Supervisors:** See accurate availability counts.

**Rule Description:** The `total_registered` count uses: `not { $registration has archivedAt $regArchived; }; not { $registration has isAccepted $any_value; };` — i.e., only non-archived, non-decided registrations. The `total_accepted` count uses: `has isAccepted true; not { $registration has archivedAt $regArchived2; };` — i.e., only non-archived, accepted registrations.

**Code References:**
- Backend: [`task_repository.py:28-41`](../projojo_backend/domain/repositories/task_repository.py:28) (get_by_id), [`task_repository.py:67-80`](../projojo_backend/domain/repositories/task_repository.py:67) (get_all), [`task_repository.py:108-121`](../projojo_backend/domain/repositories/task_repository.py:108) (get_tasks_by_project)

---

### DER-04: Archived Entities Collapsible Section Counts

**Purpose:** The teacher page displays the number of archived businesses, projects, and tasks in collapsible section headers, so teachers can gauge the volume of archived content at a glance.

**Stakeholder Benefit:**
- **Teachers:** Quick situational awareness of how much content is archived.

**Rule Description:** The frontend renders collapsible sections for each archived entity type. The section header includes a dynamic count from the array length: e.g., `Gearchiveerde bedrijven ({archivedBusinesses.length})`.

**Code References:**
- Frontend: [`TeacherPage.jsx:145`](../projojo_frontend/src/pages/TeacherPage.jsx:145) — archived businesses count
- Frontend: [`TeacherPage.jsx:166`](../projojo_frontend/src/pages/TeacherPage.jsx:166) — archived projects count
- Frontend: [`TeacherPage.jsx:196`](../projojo_frontend/src/pages/TeacherPage.jsx:196) — archived tasks count

---

## 4. Operations

### OPS-01: Archive a Business (Cascade)

**Purpose:** Allows removing an entire organization from the active platform. This is the most impactful archive operation, hiding the business and all its related entities in a single action.

**Stakeholder Benefit:**
- **Students:** An organization that has left the platform is cleanly removed from all browsing views.
- **Supervisors:** Their accounts within this business are automatically archived, preventing lingering access.
- **Teachers:** One action retires an entire organization and all its related content.
- **Administrators:** Full cascade ensures no orphaned active entities remain.

**Rule Description:**

**Trigger:** `POST /businesses/{business_id}/archive`

**Preconditions:**
- User must be a supervisor belonging to this business, or a teacher.
- The business must not already be archived (idempotent guard: `not { $b has archivedAt $x; }`).

**Cascade sequence** (5 write transactions, all sharing the same `archivedAt` timestamp):

| Step | Entity Type | TypeDB traversal | Code Reference |
|------|-----------|-----------------|---------------|
| 1 | `business` | Direct match on business ID | [`business_repository.py:252-261`](../projojo_backend/domain/repositories/business_repository.py:252) |
| 2 | `project` (all projects of the business) | `($b, $p) isa hasProjects` | [`business_repository.py:263-274`](../projojo_backend/domain/repositories/business_repository.py:263) |
| 3 | `task` (all tasks of all projects) | `($b, $p) isa hasProjects; ($p, $t) isa containsTask` | [`business_repository.py:276-288`](../projojo_backend/domain/repositories/business_repository.py:276) |
| 4 | `supervisor` (all supervisors managing this business) | `$m isa manages (supervisor: $s, business: $b)` | [`business_repository.py:290-301`](../projojo_backend/domain/repositories/business_repository.py:290) |
| 5 | `registersForTask` (all student registrations for tasks of projects of the business) | `($b, $p) isa hasProjects; ($p, $t) isa containsTask; $r isa registersForTask (task: $t, student: $stu)` | [`business_repository.py:303-315`](../projojo_backend/domain/repositories/business_repository.py:303) |

**State changes:** Each entity gains `archivedAt` (datetime) and `archivedBy` (user ID string).

**Happy path response:** `{"message": "Bedrijf succesvol gearchiveerd"}` (HTTP 200)

**Error path:** HTTP 500 with `"Er is een fout opgetreden bij het archiveren van het bedrijf."`

**Frontend flow:**
1. User clicks "Archiveer bedrijf" button → [`BusinessCard.jsx:151`](../projojo_frontend/src/components/BusinessCard.jsx:151)
2. Confirmation modal opens → [`BusinessCard.jsx:231-253`](../projojo_frontend/src/components/BusinessCard.jsx:231)
3. Modal text warns: "Dit verbergt het bedrijf, alle projecten, taken en supervisor-accounts. Supervisoren kunnen dan niet meer inloggen." → [`BusinessCard.jsx:245`](../projojo_frontend/src/components/BusinessCard.jsx:245)
4. "Bevestig archiveren" button calls [`archiveBusiness()`](../projojo_frontend/src/services.js:527) → `POST businesses/{id}/archive`
5. On success, modal closes and `onChanged()` triggers page reload → [`BusinessCard.jsx:77-79`](../projojo_frontend/src/components/BusinessCard.jsx:77)

**Code References:**
- Route: [`business_router.py:167-185`](../projojo_backend/routes/business_router.py:167)
- Repository: [`business_repository.py:244-315`](../projojo_backend/domain/repositories/business_repository.py:244)
- Frontend Service: [`services.js:527-531`](../projojo_frontend/src/services.js:527)
- Frontend Component: [`BusinessCard.jsx:68-98`](../projojo_frontend/src/components/BusinessCard.jsx:68)

---

### OPS-02: Archive a Project (Cascade)

**Purpose:** Allows removing a specific project and all its tasks from active listings without affecting the parent business or other projects.

**Stakeholder Benefit:**
- **Students:** A completed or withdrawn project disappears from browsing.
- **Supervisors:** Can retire projects they no longer want to advertise.
- **Teachers:** Can force-archive a project if needed (no ownership check for teachers).
- **Administrators:** Granular control below business level.

**Rule Description:**

**Trigger:** `POST /projects/{project_id}/archive`

**Preconditions:**
- User must be a supervisor whose business owns this project, or a teacher.
- The project must not already be archived.

**Cascade sequence** (3 write transactions):

| Step | Entity Type | TypeDB traversal | Code Reference |
|------|-----------|-----------------|---------------|
| 1 | `project` | Direct match | [`project_repository.py:282-290`](../projojo_backend/domain/repositories/project_repository.py:282) |
| 2 | `task` (all tasks of the project) | `($p, $t) isa containsTask` | [`project_repository.py:293-303`](../projojo_backend/domain/repositories/project_repository.py:293) |
| 3 | `registersForTask` (all registrations for tasks of the project) | `($p, $t) isa containsTask; $r isa registersForTask (task: $t, student: $stu)` | [`project_repository.py:306-316`](../projojo_backend/domain/repositories/project_repository.py:306) |

**Note:** Unlike business archive, project archive does **not** archive supervisors.

**Happy path response:** `{"message": "Project succesvol gearchiveerd"}` (HTTP 200)

**Error path:** HTTP 500 with `"Er is een fout opgetreden bij het archiveren van het project."`

**Frontend flow:**
1. User clicks "Project archiveren" button on the project details page → [`ProjectDetails.jsx:171-176`](../projojo_frontend/src/components/ProjectDetails.jsx:171)
2. Confirmation modal warns: "Alle taken (en aanmeldingen) van dit project worden ook gearchiveerd. Het project verdwijnt uit overzichten en zoekresultaten." → [`ProjectDetails.jsx:238`](../projojo_frontend/src/components/ProjectDetails.jsx:238)
3. Confirmed via [`archiveProject()`](../projojo_frontend/src/services.js:182) → `POST projects/{id}/archive`
4. On success, `refreshData()` is called → [`ProjectDetails.jsx:52`](../projojo_frontend/src/components/ProjectDetails.jsx:52)

**Code References:**
- Route: [`project_router.py:130-148`](../projojo_backend/routes/project_router.py:130)
- Repository: [`project_repository.py:274-316`](../projojo_backend/domain/repositories/project_repository.py:274)
- Frontend Service: [`services.js:182-186`](../projojo_frontend/src/services.js:182)
- Frontend Component: [`ProjectDetails.jsx:46-56`](../projojo_frontend/src/components/ProjectDetails.jsx:46)

---

### OPS-03: Archive a Task (Cascade)

**Purpose:** Allows removing a single task from active use. This is the most granular archive operation.

**Stakeholder Benefit:**
- **Students:** A task they registered for that is no longer available will disappear from search.
- **Supervisors:** Can retire individual tasks within an otherwise active project.
- **Teachers:** Can force-archive any task.

**Rule Description:**

**Trigger:** `POST /tasks/{task_id}/archive`

**Preconditions:**
- User must be a supervisor whose business owns the project containing this task, or a teacher.
- The task must not already be archived.

**Cascade sequence** (2 write transactions):

| Step | Entity Type | TypeDB traversal | Code Reference |
|------|-----------|-----------------|---------------|
| 1 | `task` | Direct match | [`task_repository.py:388-397`](../projojo_backend/domain/repositories/task_repository.py:388) |
| 2 | `registersForTask` (all registrations for this task) | `$r isa registersForTask (task: $t, student: $stu)` | [`task_repository.py:399-409`](../projojo_backend/domain/repositories/task_repository.py:399) |

**Happy path response:** `{"message": "Taak succesvol gearchiveerd"}` (HTTP 200)

**Error path:** HTTP 500 with `"Er is een fout opgetreden bij het archiveren van de taak."`

**Frontend flow:**
1. User clicks "Archiveer taak" button → [`Task.jsx:201-203`](../projojo_frontend/src/components/Task.jsx:201)
2. Modal warns: "Aanmeldingen worden ook gearchiveerd. Deze taak verdwijnt uit overzichten en zoekresultaten." → [`Task.jsx:251`](../projojo_frontend/src/components/Task.jsx:251)
3. Confirmed via [`archiveTask()`](../projojo_frontend/src/services.js:261) → `POST tasks/{id}/archive`
4. On success, fetching amount incremented to trigger reload → [`Task.jsx:135`](../projojo_frontend/src/components/Task.jsx:135)

**Code References:**
- Route: [`task_router.py:33-47`](../projojo_backend/routes/task_router.py:33)
- Repository: [`task_repository.py:381-409`](../projojo_backend/domain/repositories/task_repository.py:381)
- Frontend Service: [`services.js:261-265`](../projojo_frontend/src/services.js:261)
- Frontend Component: [`Task.jsx:129-139`](../projojo_frontend/src/components/Task.jsx:129)

---

### OPS-04: Unarchive a Business (Cascade)

**Purpose:** Teachers can restore a previously archived business and all its nested entities, returning them to active use.

**Stakeholder Benefit:**
- **Students:** Previously archived opportunities become available again.
- **Supervisors:** Their accounts are reactivated; they can log in again.
- **Teachers:** Can reverse an archive decision.

**Rule Description:**

**Trigger:** `POST /businesses/{business_id}/unarchive`

**Preconditions:** User must be a teacher.

**Cascade sequence** (10 delete transactions — 2 per entity level, one for `archivedAt` and one for `archivedBy`):

| Step | Entity Level | Attributes Removed | Code Reference |
|------|------------|-------------------|---------------|
| 1-2 | `business` | `archivedAt`, `archivedBy` | [`business_repository.py:322-336`](../projojo_backend/domain/repositories/business_repository.py:322) |
| 3-4 | `project` (all in business) | `archivedAt`, `archivedBy` | [`business_repository.py:338-356`](../projojo_backend/domain/repositories/business_repository.py:338) |
| 5-6 | `task` (all in business's projects) | `archivedAt`, `archivedBy` | [`business_repository.py:358-378`](../projojo_backend/domain/repositories/business_repository.py:358) |
| 7-8 | `supervisor` (all managing the business) | `archivedAt`, `archivedBy` | [`business_repository.py:380-398`](../projojo_backend/domain/repositories/business_repository.py:380) |
| 9-10 | `registersForTask` | `archivedAt`, `archivedBy` | [`business_repository.py:400-420`](../projojo_backend/domain/repositories/business_repository.py:400) |

**Happy path response:** `{"message": "Bedrijf succesvol hersteld"}` (HTTP 200)

**Frontend flow:**
1. Teacher sees "Herstel bedrijf" button next to archived businesses → [`BusinessCard.jsx:161-167`](../projojo_frontend/src/components/BusinessCard.jsx:161)
2. Clicking calls [`unarchiveBusiness()`](../projojo_frontend/src/services.js:538) → `POST businesses/{id}/unarchive`
3. On success, `onChanged()` triggers page reload → [`BusinessCard.jsx:92`](../projojo_frontend/src/components/BusinessCard.jsx:92)

**Code References:**
- Route: [`business_router.py:187-204`](../projojo_backend/routes/business_router.py:187)
- Repository: [`business_repository.py:317-420`](../projojo_backend/domain/repositories/business_repository.py:317)
- Frontend Service: [`services.js:538-541`](../projojo_frontend/src/services.js:538)
- Frontend Component: [`BusinessCard.jsx:87-98`](../projojo_frontend/src/components/BusinessCard.jsx:87)

---

### OPS-05: Unarchive a Project (Cascade)

**Purpose:** Teachers can restore a single archived project and its nested tasks and registrations.

**Stakeholder Benefit:**
- **Students:** Restored project and tasks become available again.
- **Teachers:** Granular restoration below business level.

**Rule Description:**

**Trigger:** `POST /projects/{project_id}/unarchive`

**Preconditions:** User must be a teacher.

**Cascade sequence** (6 delete transactions — 2 per entity level):

| Step | Entity Level | Code Reference |
|------|------------|---------------|
| 1-2 | `project` | [`project_repository.py:323-336`](../projojo_backend/domain/repositories/project_repository.py:323) |
| 3-4 | `task` (in project) | [`project_repository.py:339-356`](../projojo_backend/domain/repositories/project_repository.py:339) |
| 5-6 | `registersForTask` | [`project_repository.py:358-376`](../projojo_backend/domain/repositories/project_repository.py:358) |

**Happy path response:** `{"message": "Project succesvol hersteld"}` (HTTP 200)

**Frontend flow:** Teacher clicks "Herstel" next to an archived project on the teacher page → [`TeacherPage.jsx:179`](../projojo_frontend/src/pages/TeacherPage.jsx:179) calls [`unarchiveProject()`](../projojo_frontend/src/services.js:192).

**Code References:**
- Route: [`project_router.py:150-167`](../projojo_backend/routes/project_router.py:150)
- Repository: [`project_repository.py:318-376`](../projojo_backend/domain/repositories/project_repository.py:318)
- Frontend Service: [`services.js:192-196`](../projojo_frontend/src/services.js:192)
- Frontend Component: [`TeacherPage.jsx:177-183`](../projojo_frontend/src/pages/TeacherPage.jsx:177)

---

### OPS-06: Unarchive a Task (Cascade)

**Purpose:** Teachers can restore a single archived task and its registrations.

**Stakeholder Benefit:**
- **Students:** Their archived registrations become active again.
- **Teachers:** Most granular restoration.

**Rule Description:**

**Trigger:** `POST /tasks/{task_id}/unarchive`

**Preconditions:** User must be a teacher.

**Cascade sequence** (4 delete transactions):

| Step | Entity Level | Code Reference |
|------|------------|---------------|
| 1-2 | `task` | [`task_repository.py:416-429`](../projojo_backend/domain/repositories/task_repository.py:416) |
| 3-4 | `registersForTask` | [`task_repository.py:431-447`](../projojo_backend/domain/repositories/task_repository.py:431) |

**Happy path response:** `{"message": "Taak succesvol hersteld"}` (HTTP 200)

**Frontend flow:** Teacher clicks "Herstel" next to an archived task on the teacher page → [`TeacherPage.jsx:209`](../projojo_frontend/src/pages/TeacherPage.jsx:209) calls [`unarchiveTask()`](../projojo_frontend/src/services.js:271).

**Code References:**
- Route: [`task_router.py:49-62`](../projojo_backend/routes/task_router.py:49)
- Repository: [`task_repository.py:411-447`](../projojo_backend/domain/repositories/task_repository.py:411)
- Frontend Service: [`services.js:271-275`](../projojo_frontend/src/services.js:271)
- Frontend Component: [`TeacherPage.jsx:207-213`](../projojo_frontend/src/pages/TeacherPage.jsx:207)

---

## 5. Actions and Integrations

### ACT-01: Archived Supervisor Login Block with User-Facing Error

**Purpose:** Archived supervisors are shown a clear, localized error message and redirected to the frontend with diagnostic information when they attempt to log in.

**Stakeholder Benefit:**
- **Supervisors:** Receive a clear explanation ("Je account is gearchiveerd. Neem contact op met een docent.") instead of a generic error.
- **Teachers:** Trust that archived supervisors are properly locked out.

**Rule Description:** During OAuth callback, if the authenticated user is a supervisor, [`AuthService.handle_oauth_callback()`](../projojo_backend/service/auth_service.py:16) calls [`UserRepository.is_supervisor_archived()`](../projojo_backend/domain/repositories/user_repository.py:705). If archived, a `ValueError` is raised. The exception is caught by the auth router and converted to a redirect: `{frontend_url}/auth/callback?error=auth_failed&message=Je%20account%20is%20gearchiveerd.%20Neem%20contact%20op%20met%20een%20docent.`

**Code References:**
- Backend: [`auth_service.py:32-43`](../projojo_backend/service/auth_service.py:32)
- Backend: [`auth_router.py:95-100`](../projojo_backend/routes/auth_router.py:95)

---

### ACT-02: Frontend Confirmation Modal Before Archive

**Purpose:** All archive actions require explicit user confirmation via a modal dialog. This prevents accidental archiving.

**Stakeholder Benefit:**
- **All users who can archive:** Protection against mis-clicks, with a clear description of consequences.

**Rule Description:** Each archivable entity type has a dedicated confirmation modal in its frontend component:

| Entity | Modal Header | Warning Text | Component |
|--------|-------------|-------------|-----------|
| Business | "Bedrijf archiveren" | "Dit verbergt het bedrijf, alle projecten, taken en supervisor-accounts. Supervisoren kunnen dan niet meer inloggen." | [`BusinessCard.jsx:231-253`](../projojo_frontend/src/components/BusinessCard.jsx:231) |
| Project | "Project archiveren" | "Alle taken (en aanmeldingen) van dit project worden ook gearchiveerd. Het project verdwijnt uit overzichten en zoekresultaten." | [`ProjectDetails.jsx:221-248`](../projojo_frontend/src/components/ProjectDetails.jsx:221) |
| Task | "Taak archiveren" | "Aanmeldingen worden ook gearchiveerd. Deze taak verdwijnt uit overzichten en zoekresultaten." | [`Task.jsx:235-259`](../projojo_frontend/src/components/Task.jsx:235) |

Each modal includes:
- A loading spinner state during the archive API call
- Error display if the archive fails
- "Annuleren" (cancel) and "Bevestig archiveren" (confirm) buttons

**Code References:** See table above.

---

### ACT-03: Automatic UI Refresh After Archive/Unarchive

**Purpose:** After a successful archive or unarchive operation, the UI automatically refreshes affected data to reflect the new state.

**Stakeholder Benefit:**
- **All users:** Immediate feedback — archived entities disappear from active lists and appear in archived lists (or vice versa) without requiring a manual page reload.

**Rule Description:** Each archive/unarchive handler in the frontend calls a parent-provided callback (`onChanged`, `refreshData`, or `setFetchAmount`) upon success. This triggers a re-fetch of the relevant data.

**Code References:**
- [`BusinessCard.jsx:79`](../projojo_frontend/src/components/BusinessCard.jsx:79) — `if (onChanged) onChanged()`
- [`BusinessCard.jsx:92`](../projojo_frontend/src/components/BusinessCard.jsx:92) — `if (onChanged) onChanged()`
- [`ProjectDetails.jsx:52`](../projojo_frontend/src/components/ProjectDetails.jsx:52) — `if (refreshData) refreshData()`
- [`Task.jsx:135`](../projojo_frontend/src/components/Task.jsx:135) — `if (setFetchAmount) setFetchAmount((v) => v + 1)`
- [`TeacherPage.jsx:179`](../projojo_frontend/src/pages/TeacherPage.jsx:179) — `.then(() => setNumberToReloadBusinesses(...))`

---

## 6. Risks, Technical Debt, and Observations

### RISK-01: `archivedReason` Attribute Declared But Never Used

**Severity:** Low (dead schema)

**Observation:** The TypeDB schema declares `attribute archivedReason value string;` at [`schema.tql:155`](../projojo_backend/db/schema.tql:155), but no entity or relation type owns it, no repository code reads or writes it, and no frontend collects it. The business model classes in Python (`Business`, `Project`, `Task`) do not include an `archived_reason` field.

**Recommendation:** Either remove `archivedReason` from the schema to reduce confusion, or implement it by adding an optional reason text field to archive confirmation modals and passing it through the API to the repository.

---

### RISK-02: `check_project_exists()` Does Not Filter Archived Projects

**Severity:** Medium (functional bug)

**Observation:** The method [`ProjectRepository.check_project_exists()`](../projojo_backend/domain/repositories/project_repository.py:174) at line 174 checks for duplicate project names within a business but does **not** include `not { $project has archivedAt ... }`. This means if a project was archived, a new project with the same name **cannot** be created for the same business, because the archived project still matches the name check.

**Recommendation:** Add `not { $project has archivedAt $archived; };` to the duplicate-check query so that archived projects do not block creation of identically-named new projects.

---

### RISK-03: Student Registration Query in `get_student_registrations()` Does Not Filter Archived Registrations

**Severity:** Medium (functional inconsistency)

**Observation:** The method [`UserRepository.get_student_registrations()`](../projojo_backend/domain/repositories/user_repository.py:404) returns all task IDs that a student has registrations for, without filtering out archived registrations. This is used in `create_registration()` endpoint ([`task_router.py:193-194`](../projojo_backend/routes/task_router.py:193)) to prevent duplicate registrations. If a student's registration was archived (e.g., via business archive), they cannot re-register for that task because the check still sees the archived registration as existing.

**Recommendation:** Add `not { $registration has archivedAt $ts; };` to the query in `get_student_registrations()`.

---

### RISK-04: `get_registrations()` in Task Repository Does Not Filter Archived Registrations

**Severity:** Medium (functional bug)

**Observation:** The method [`TaskRepository.get_registrations()`](../projojo_backend/domain/repositories/task_repository.py:228) fetches registrations for a supervisor's review modal but only filters out registrations with `isAccepted` set. It does **not** filter out registrations where `archivedAt` is present. If a registration is archived individually, it could still appear in the supervisor's pending registrations list.

**Recommendation:** Add `not { $registration has archivedAt $regArchived; };` to the query.

---

### RISK-05: `get_students_by_task_status()` Does Not Filter Archived Registrations

**Severity:** Low-Medium (email leak)

**Observation:** The method [`UserRepository.get_students_by_task_status()`](../projojo_backend/domain/repositories/user_repository.py:350) retrieves student emails for email-sending features. It does not filter out archived registrations. This could cause emails to be sent to students whose registrations were archived.

**Recommendation:** Add `not { $registration has archivedAt $regArchived; };` to the query.

---

### RISK-06: Unarchive Does Not Verify Parent Entity Is Active

**Severity:** Medium (logical inconsistency)

**Observation:** When unarchiving a project via [`project_repository.py:318`](../projojo_backend/domain/repositories/project_repository.py:318) or a task via [`task_repository.py:411`](../projojo_backend/domain/repositories/task_repository.py:411), there is no check that the parent entity (business or project, respectively) is itself active. A teacher could unarchive a task whose parent project—or even grandparent business—is still archived. The task would regain active attributes but remain invisible in active queries because the parent filters still exclude it.

**Recommendation:** Either (a) validate that all ancestor entities are active before allowing unarchive, or (b) cascade unarchive upward to parents, or (c) at minimum display a warning to the teacher in the UI.

---

### RISK-07: Non-Atomic Cascade Operations

**Severity:** Medium (data consistency)

**Observation:** Each archive/unarchive cascade consists of multiple sequential `Db.write_transact()` calls. If one transaction in the middle fails (e.g., due to a network error or database timeout), previous transactions in the cascade have already committed. This leaves the system in a partially archived/unarchived state. For example, archiving a business might archive the business and its projects but fail before archiving tasks.

**Recommendation:** Wrap all cascade steps in a single database transaction if TypeDB supports multi-statement transactions, or implement compensating logic to detect and repair partial cascades.

---

### RISK-08: `get_all_students()` Does Not Filter Archived Registrations from `registered_task_ids`

**Severity:** Low

**Observation:** The method [`UserRepository.get_all_students()`](../projojo_backend/domain/repositories/user_repository.py:229) fetches all students with their `registered_task_ids`, but the subquery does not exclude archived registrations. This means a student's profile may show they are registered for tasks that have been archived.

**Recommendation:** Add archive filtering to the registration subquery.

---

### RISK-09: Update Accepted Count Query in `TaskRepository.update()` Does Not Filter Archived

**Severity:** Low

**Observation:** The `accepted_count_query` in [`task_repository.py:341-354`](../projojo_backend/domain/repositories/task_repository.py:341) counts accepted registrations to enforce the `total_needed` constraint but does **not** exclude archived registrations. This could theoretically prevent reducing `total_needed` if archived-but-accepted registrations are counted.

**Recommendation:** Add `not { $registration has archivedAt $ts; };` to the accepted count query.

---

### RISK-10: Frontend Has Duplicate Import in TeacherPage

**Severity:** Low (build issue)

**Observation:** [`TeacherPage.jsx:10-11`](../projojo_frontend/src/pages/TeacherPage.jsx:10) has a duplicate import: `import { createNewBusiness, getBusinessesBasic } from "../services";` appears twice (the first import on line 10 includes additional functions). This could cause build warnings or errors depending on the bundler configuration.

**Recommendation:** Remove the duplicate import on line 11.

---

### RISK-11: Business Archive Allows Supervisor to Lock Themselves Out

**Severity:** Low (by design, but worth noting)

**Observation:** A supervisor can archive their own business via [`business_router.py:168`](../projojo_backend/routes/business_router.py:168). The cascade archives the supervisor's own account (step 4 of OPS-01), meaning they immediately lose the ability to log in. The supervisor receives a success response, but upon their next authentication attempt they will be blocked. The frontend warning text at [`BusinessCard.jsx:245`](../projojo_frontend/src/components/BusinessCard.jsx:245) does warn about this: "Supervisoren kunnen dan niet meer inloggen."

**Recommendation:** This appears intentional. Consider adding an additional confirmation step or a more prominent warning specifically targeting self-archival.

---

### RISK-12: No Audit Log for Archive/Unarchive Actions

**Severity:** Low-Medium

**Observation:** While `archivedBy` records WHO archived an entity, there is no corresponding log for unarchive operations. After unarchiving, both `archivedAt` and `archivedBy` are deleted, so the information about who originally archived the entity and when is permanently lost. There is also no log entry for who performed the unarchive.

**Recommendation:** Consider writing an audit log (to a separate table or event store) before removing archive attributes during unarchive operations.

---

## 7. Summary Statistics

| Metric | Count |
|--------|-------|
| **Total business rules documented** | 24 |
| Constraints (CON-*) | 11 |
| Derivations (DER-*) | 4 |
| Operations (OPS-*) | 6 |
| Actions/Integrations (ACT-*) | 3 |
| **Risks/Tech debt items** | 12 |
| Severity: Medium | 5 (RISK-02, RISK-03, RISK-04, RISK-06, RISK-07) |
| Severity: Low-Medium | 2 (RISK-05, RISK-12) |
| Severity: Low | 5 (RISK-01, RISK-08, RISK-09, RISK-10, RISK-11) |
| **Archivable entity types** | 5 (business, project, task, supervisor, registersForTask) |
| **API endpoints for archiving** | 6 (3 archive + 3 unarchive) |
| **Frontend components involved** | 5 (BusinessCard, ProjectDetails, Task, TeacherPage, BusinessesOverview) |
| **Backend repository files involved** | 4 (business_repository, project_repository, task_repository, user_repository) |
| **TypeDB queries with archive filtering** | 25+ (across all repositories) |
| **Unused schema declarations** | 1 (`archivedReason`) |

---

### Cross-Reference Index

| Rule ID | Related Rules |
|---------|---------------|
| CON-01 | CON-02 (idempotent guard relies on cardinality), DER-01 |
| CON-02 | CON-01, OPS-01 through OPS-03 |
| CON-03 | CON-04, DER-02, CON-09 |
| CON-04 | CON-03 |
| CON-05 | OPS-01 (step 4), ACT-01, CON-06 |
| CON-06 | CON-07, OPS-01 through OPS-03 |
| CON-07 | CON-06, OPS-04 through OPS-06 |
| CON-08 | DER-04 |
| CON-09 | DER-03, OPS-03 (registration cascade) |
| CON-10 | ACT-02, CON-11 |
| CON-11 | CON-10, CON-08 |
| DER-01 | CON-01, all OPS-* |
| DER-02 | CON-03, all repository `get_all`/`get_archived` methods |
| DER-03 | CON-09 |
| DER-04 | CON-08 |
| OPS-01 | CON-02, CON-05, CON-06, DER-01, ACT-02 |
| OPS-02 | CON-02, CON-06, DER-01, ACT-02 |
