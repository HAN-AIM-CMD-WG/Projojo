# Email Service Audit — Product, Architecture & Implementation Review

**Date**: 23 March 2026
**Branch**: `next-ui`
**Scope**: Full-stack audit of the Email Service across backend SMTP infrastructure, notification service, email templates, router integration, Docker infrastructure, frontend email UX, and schema support
**Method**: Code-backed analysis starting from [`BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md`](BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md) and [`NEXT-UI-BRANCH-ANALYSIS.md`](NEXT-UI-BRANCH-ANALYSIS.md), then validating against actual implementation across all layers

---

## Overall Verdict

**The Email Service is a high-quality but almost entirely disconnected piece of infrastructure. The SMTP sending module itself is production-grade — well-structured, async, properly error-handled, template-capable, and backed by real Docker infrastructure (MailHog). But it sits in near-total isolation from the application it was built for. Only one consumer exists: a test endpoint on the login page explicitly marked "REMOVE AFTER TESTING." No business event in the entire application triggers an email. Meanwhile, a second, parallel "notification" module was built alongside it with no awareness of its existence, and that module is also dead code.**

The codebase contains **three distinct, unconnected email-adjacent systems**:

1. **[`email_service.py`](../projojo_backend/service/email_service.py:1)** — a production-quality 402-line async SMTP module using `aiosmtplib` + Jinja2 templates, with proper error handling, TLS auto-negotiation, attachment support, CC/BCC, and three ready-to-use email templates. Its only real consumer is a dev test endpoint at [`main.py:136`](../projojo_backend/main.py:136).

2. **[`notification_service.py`](../projojo_backend/service/notification_service.py:13)** — a 276-line synchronous class with its own primitive [`_send_email()`](../projojo_backend/service/notification_service.py:239) stub, a hardcoded `email_enabled = False` flag at [line 19](../projojo_backend/service/notification_service.py:19), and method scaffolding for project archive/delete notifications. It does not import, reference, or in any way use the `email_service` module. It is **never imported by any router** — confirmed by a full codebase search that found zero imports of `notification_service` outside its own package [`__init__.py`](../projojo_backend/service/__init__.py:4).

3. **Email retrieval endpoints** — [`GET /tasks/{task_id}/student-emails`](../projojo_backend/routes/task_router.py:46) and [`GET /tasks/{task_id}/emails/colleagues`](../projojo_backend/routes/task_router.py:37) — that fetch email addresses for supervisors to construct `mailto:` links in their local email client via [`CreateBusinessEmail.jsx`](../projojo_frontend/src/components/CreateBusinessEmail.jsx:7). This is the **only email-related feature that actually works from a user's perspective**, and it operates entirely outside the platform's email infrastructure.

The net result: the platform has a fully functional SMTP pipeline to MailHog, three styled HTML email templates, an async sending engine — and sends zero emails during any business operation. The UI makes at least three explicit promises that notifications will be sent to users, and none are honored.

### Quality Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Product quality | 2/10 | The only working email feature is `mailto:` link generation (good), but that uses user's own email client, not the platform's email service. Zero platform-sent emails reach any user during any business workflow. Three UI locations explicitly lie about notification delivery. |
| Architecture quality | 5/10 | The `email_service.py` module itself is well-designed. But two parallel, unconnected email systems in the same `service/` package is an architecture failure. No event system, no message queue, no notification domain model. The infrastructure (MailHog, Docker, env-config) is solid. |
| Implementation quality | 6/10 | `email_service.py` is genuinely well-implemented: async, proper error types, Jinja2 templates, lazy loading, clean Pydantic models. `notification_service.py` is poorly implemented: sync, `print()` instead of logging, hardcoded disabled flag, own email stub ignoring the real service. The test endpoint works as designed. |
| Business-rule coherence | 2/10 | The intended rules (A-001 SMTP sending, A-002 notification integration) are reasonable but enforcement is zero. `notified_count` in API responses is fabricated. UI confirmation dialogs reference notification delivery that does not happen. Email retrieval for `mailto:` links is the sole coherent email-adjacent feature. |

---

## Table of Contents

- [1. Implemented Feature Set](#1-implemented-feature-set)
- [2. Business Rules vs Implementation](#2-business-rules-vs-implementation)
- [3. Feature Completeness — Expected but Missing](#3-feature-completeness--expected-but-missing)
- [4. Interactions with Existing App Functionality](#4-interactions-with-existing-app-functionality)
- [5. Implementation Correctness](#5-implementation-correctness)
- [6. Implementation Robustness](#6-implementation-robustness)
- [7. Database and Schema Integration](#7-database-and-schema-integration)
- [8. Documentation vs Implementation Mismatches](#8-documentation-vs-implementation-mismatches)
- [9. Confirmed, Likely, and Open Questions](#9-confirmed-likely-and-open-questions)
- [10. Recommendations](#10-recommendations)

---

## 1. Implemented Feature Set

### A. Async SMTP email service (production-quality, near-zero consumers)

[`email_service.py`](../projojo_backend/service/email_service.py:1) provides:

- [`send_email()`](../projojo_backend/service/email_service.py:186) — full-featured async email sending via `aiosmtplib` with support for:
  - Multiple recipients (To, CC, BCC)
  - HTML and/or plain text bodies
  - Reply-to header
  - File attachments via [`EmailAttachment`](../projojo_backend/service/email_service.py:62) model
  - [`EmailResult`](../projojo_backend/service/email_service.py:78) return type with success/error fields
  - Differentiated error handling: [`SMTPAuthenticationError`](../projojo_backend/service/email_service.py:293), [`SMTPRecipientsRefused`](../projojo_backend/service/email_service.py:296), [`SMTPSenderRefused`](../projojo_backend/service/email_service.py:299), [`SMTPException`](../projojo_backend/service/email_service.py:302), [`OSError`](../projojo_backend/service/email_service.py:305), and a generic catch-all at [line 312](../projojo_backend/service/email_service.py:312)
  - 30-second timeout on SMTP connection

- [`send_templated_email()`](../projojo_backend/service/email_service.py:318) — Jinja2 template rendering + email sending:
  - Lazy-loaded template environment via [`_get_template_env()`](../projojo_backend/service/email_service.py:101) pointing to `projojo_backend/templates/email/`
  - Graceful handling of missing templates ([`TemplateNotFound`](../projojo_backend/service/email_service.py:369))
  - Optional text template fallback at [line 383](../projojo_backend/service/email_service.py:383)

- Configuration via [`_get_smtp_config()`](../projojo_backend/service/email_service.py:145):
  - `EMAIL_SMTP_HOST` (default: `localhost`)
  - `EMAIL_SMTP_PORT` (default: `1025`, with safe parsing at [line 163](../projojo_backend/service/email_service.py:163))
  - `EMAIL_SMTP_USERNAME` / `EMAIL_SMTP_PASSWORD` — converted to `None` when empty at [line 170](../projojo_backend/service/email_service.py:170), causing `aiosmtplib` to skip auth (MailHog compatibility)
  - `EMAIL_DEFAULT_SENDER` (default: `noreply@projojo.nl`)

- Proper `logging` module usage via [`logger = logging.getLogger(__name__)`](../projojo_backend/service/email_service.py:54)

### B. NotificationService class (dead code, synchronous, disabled)

[`notification_service.py`](../projojo_backend/service/notification_service.py:1) provides:

- [`NotificationService`](../projojo_backend/service/notification_service.py:13) class with [`email_enabled = False`](../projojo_backend/service/notification_service.py:19) hardcoded
- [`notify_project_archived()`](../projojo_backend/service/notification_service.py:21) — iterates students, calls `_send_student_archive_notification()`, optionally notifies teacher
- [`notify_project_deleted()`](../projojo_backend/service/notification_service.py:76) — same pattern with portfolio snapshot messaging
- [`_send_student_archive_notification()`](../projojo_backend/service/notification_service.py:123) — builds plain-text Dutch email body inline; returns `True` immediately when disabled
- [`_send_student_delete_notification()`](../projojo_backend/service/notification_service.py:161) — same pattern for deletion
- [`_send_teacher_notification()`](../projojo_backend/service/notification_service.py:208) — notifies teacher about action
- [`_send_email()`](../projojo_backend/service/notification_service.py:239) — stub with commented-out `smtplib` example; returns `True` without sending when disabled
- Singleton: [`notification_service = NotificationService()`](../projojo_backend/service/notification_service.py:276)
- Exported in [`__init__.py:4`](../projojo_backend/service/__init__.py:4) but **never imported by any router, middleware, or other module**

### C. Email templates (styled, ready, mostly unused)

Three Jinja2 templates in [`projojo_backend/templates/email/`](../projojo_backend/templates/email/):

- [`base.html`](../projojo_backend/templates/email/base.html:1) — responsive email layout with Projojo branding (#4F46E5 primary), styled `.info-box`, `.warning-box`, `.button`, `.button-secondary`, footer with copyright, and responsive breakpoints at 600px
- [`invitation.html`](../projojo_backend/templates/email/invitation.html:1) — extends base. Accepts `user_name`, `project_name`, `inviter_name`, `message`, `project_description`, `invite_link`, `expire_days`. **Only used by the test endpoint** at [`main.py:147`](../projojo_backend/main.py:147). Never used for actual invite key dispatch.
- [`notification.html`](../projojo_backend/templates/email/notification.html:1) — extends base. Accepts `notification_title`, `notification_body`, `notification_type`, `details` dict, `action_url`/`action_text`, `secondary_action_url`/`secondary_action_text`, `note`. **Never rendered anywhere in the entire codebase.** Zero calls to `send_templated_email("notification.html", ...)` exist.

### D. MailHog infrastructure (functional, well-configured)

[`docker-compose.yml:42-53`](../docker-compose.yml:42) configures MailHog:

- SMTP on port `1025:1025`, Web UI on port `8025:8025`
- Backend [`depends_on: mailhog`](../docker-compose.yml:20)
- Comment at [line 38](../docker-compose.yml:38) notes env-based config can switch between MailHog and SMTP2GO
- [`LoginPage.jsx:144`](../projojo_frontend/src/pages/LoginPage.jsx:144) links directly to `localhost:8025` for viewing test emails

### E. Test email endpoint (dev-only, should be removed)

[`POST /test/email`](../projojo_backend/main.py:136) in [`main.py`](../projojo_backend/main.py:1):

- Accepts [`TestEmailRequest`](../projojo_backend/main.py:132) with `recipient_email` field
- Sends via [`send_templated_email()`](../projojo_backend/main.py:147) using `invitation.html` template
- Guarded by environment check: only works when `ENVIRONMENT=development` at [line 144](../projojo_backend/main.py:144)
- Has explicit `REMOVE AFTER TESTING` comments at lines [15-21](../projojo_backend/main.py:15), [129-131](../projojo_backend/main.py:129), [171-173](../projojo_backend/main.py:171)
- Frontend imports and test UI also marked for removal at [`services.js:758-776`](../projojo_frontend/src/services.js:758), [`LoginPage.jsx:7-28`](../projojo_frontend/src/pages/LoginPage.jsx:7), [`LoginPage.jsx:110-149`](../projojo_frontend/src/pages/LoginPage.jsx:110)

### F. Email retrieval endpoints (working, for mailto: links)

Two endpoints in [`task_router.py`](../projojo_backend/routes/task_router.py:37):

- [`GET /tasks/{task_id}/student-emails`](../projojo_backend/routes/task_router.py:46) — returns deduplicated email addresses of students by status selection (`registered`, `accepted`, `rejected`). Protected with [`@auth(role="supervisor", owner_id_key="task_id")`](../projojo_backend/routes/task_router.py:47).
- [`GET /tasks/{task_id}/emails/colleagues`](../projojo_backend/routes/task_router.py:37) — returns supervisor colleagues' emails for the task's business. Same auth protection at [line 38](../projojo_backend/routes/task_router.py:38).

Consumed by [`CreateBusinessEmail.jsx`](../projojo_frontend/src/components/CreateBusinessEmail.jsx:7), which constructs `mailto:` links with BCC (students) and optional CC (colleagues) via [`document.location`](../projojo_frontend/src/components/CreateBusinessEmail.jsx:53) at lines 53-61.

### G. Frontend toast notification system (local-only, unrelated to email)

[`NotifySystem.jsx`](../projojo_frontend/src/components/notifications/NotifySystem.jsx:82) and [`Notification.jsx`](../projojo_frontend/src/components/notifications/Notification.jsx:33) provide:

- Browser-only toast/snackbar system for immediate UI feedback
- 7-second auto-dismiss at [line 83](../projojo_frontend/src/components/notifications/NotifySystem.jsx:83)
- Types: success, error, info, warning
- Zero connection to backend-driven notifications or email delivery

---

## 2. Business Rules vs Implementation

### Rule A-001: SMTP + templated email sending

**Documented in:** [`BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md`](BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md) A-001
**Audit verdict in docs:** "Fully consistent: SMTP + templates fully implemented in `send_email()` and `send_templated_email()`"

**Status:** ✅ The infrastructure is genuinely implemented. ⚠️ But it has near-zero consumers.

**Assessment:** The audit verdict "Fully consistent" is technically correct — the SMTP module and templates exist and are functional. But this verdict is misleading in context. "Fully consistent" suggests the feature works. From a user and product perspective, it does not work because it is never called by any business logic. The infrastructure is ready; the integration is absent.

---

### Rule A-002: Notification service integration

**Documented in:** [`BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md`](BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md) A-002
**Audit verdict in docs:** "Partially consistent: notification scaffold exists in `NotificationService`, but sending is disabled by `email_enabled = False` and routes still have TODO hooks"

**Status:** 🔴 Not implemented in any meaningful sense

**Evidence:**
- [`notification_service.py:19`](../projojo_backend/service/notification_service.py:19): `self.email_enabled = False` — hardcoded, no env var, no feature flag
- The singleton is **never imported** by any file outside [`__init__.py`](../projojo_backend/service/__init__.py:4) — confirmed by search yielding exactly one result
- [`project_router.py:272`](../projojo_backend/routes/project_router.py:272): `# TODO: Send notifications to affected students and teacher`
- [`project_router.py:447`](../projojo_backend/routes/project_router.py:447): `# TODO: Send notifications to affected students and teacher`
- The `NotificationService` does not use `email_service` — it has its own primitive `_send_email()` stub

**Assessment:** "Partially consistent" significantly understates the problem. "Partially implemented" implies some partial functionality exists. None does. The class is dead code with zero consumers.

---

### Rule: Students notified when registration accepted/rejected

**Status:** 🔴 Not implemented — not even scaffolded

**Evidence:**
- [`Task.jsx:88`](../projojo_frontend/src/components/Task.jsx:88): `notification.success("Je aanmelding is verstuurd! Je ontvangt bericht zodra de organisatie reageert.");`
- [`task_router.py`](../projojo_backend/routes/task_router.py) — zero TODO markers, zero notification references for registration lifecycle events
- [`NotificationService`](../projojo_backend/service/notification_service.py:13) has no methods for registration notifications — only archive and delete

**User-facing impact:** 🔴 Critical. Students are explicitly told they will be notified when the organization responds. They never are. This is the most frequent, highest-value notification trigger in the app — and it does not exist at all.

---

### Rule: Students notified when project archived/deleted

**Status:** 🔴 Not implemented

**Evidence:**
- [`project_router.py:272`](../projojo_backend/routes/project_router.py:272): TODO comment only
- [`project_router.py:447`](../projojo_backend/routes/project_router.py:447): TODO comment only
- [`ProjectActionResponse`](../projojo_backend/routes/project_router.py:26) returns `notified_count` set to `len(affected_students)` without any notification sent
- [`ProjectActionModal.jsx:90`](../projojo_frontend/src/components/ProjectActionModal.jsx:90): "Deze studenten krijgen een notificatie en hun voltooide werk wordt opgeslagen in hun portfolio." — half-true (portfolio yes, notification no)

---

### Rule: Invite emails should be sent to new supervisors

**Status:** 🔴 Not implemented

**Evidence:**
- [`invitation.html`](../projojo_backend/templates/email/invitation.html:1) template exists with `invite_link`, `project_name`, `user_name`, `expire_days` context variables
- The template is **only used by the test endpoint** at [`main.py:150`](../projojo_backend/main.py:150)
- [`invite_router.py`](../projojo_backend/routes/invite_router.py) creates invite keys and returns them to the frontend
- [`TeacherPage.jsx`](../projojo_frontend/src/pages/TeacherPage.jsx) uses clipboard copy for invite links — no email is sent
- The invite flow relies entirely on the supervisor manually sharing the invite URL

**User-facing impact:** 🟠 Medium. Teachers must manually copy and paste invite links. An automated email with the styled invitation template would be a significant workflow improvement.

---

## 3. Feature Completeness — Expected but Missing

### What a reasonable user would expect from an Email Service in this app

An educational project management platform connecting students, supervisors, and teachers should, at minimum: (1) email students when their registration status changes, (2) email supervisors when students register for their tasks, (3) email all affected parties when projects are archived or deleted, (4) email invite links to new supervisors, and (5) provide an opt-out mechanism.

### Expected-but-missing subfeatures

| # | Missing Feature | Severity | Evidence / Reasoning |
|---|----------------|----------|---------------------|
| A | **Registration lifecycle emails (accept, reject, start, complete)** | 🔴 Critical | Zero code exists for this in any form. Not in `NotificationService`, not in `task_router.py`, not even as TODO comments in `task_router.py`. This is the single highest-value email trigger in the app. UI explicitly promises it at [`Task.jsx:88`](../projojo_frontend/src/components/Task.jsx:88). |
| B | **Any business-triggered email delivery** | 🔴 Critical | `email_enabled = False` at [`notification_service.py:19`](../projojo_backend/service/notification_service.py:19). `notification_service` never imported by any router. `send_email()` / `send_templated_email()` never called from any business logic. |
| C | **Integration between NotificationService and email_service** | 🔴 Critical | [`NotificationService._send_email()`](../projojo_backend/service/notification_service.py:239) is a synchronous stub with commented-out `smtplib` code. It has no import of, reference to, or delegation to [`email_service.send_email()`](../projojo_backend/service/email_service.py:186). Two email systems in the same package with no awareness of each other. |
| D | **Invite email dispatch** | 🟠 Medium-High | [`invitation.html`](../projojo_backend/templates/email/invitation.html:1) template built but only used by test endpoint. Invite key creation at [`invite_router.py`](../projojo_backend/routes/invite_router.py) does not trigger any email. Teachers copy-paste links manually. |
| E | **New registration notification to supervisor** | 🟠 Medium-High | When a student registers for a task, the supervisor has no way to know except by checking the dashboard. No email, no push notification, no in-app notification. |
| F | **In-app notification inbox** | 🟠 Medium | No notification entity in schema. No notification list endpoint. No notification UI component beyond ephemeral 7-second browser toasts. No unread count badge. |
| G | **Notification preferences / opt-out** | 🟡 Medium | No schema field for email preferences. No settings UI. No backend handling. |
| H | **Task deadline reminders** | 🟡 Medium | [`Task.jsx:63-73`](../projojo_frontend/src/components/Task.jsx:63) calculates countdown text but no backend scheduler or cron exists for reminders. |
| I | **Skill-match notifications** | 🟡 Medium | [`ROADMAP.md`](ROADMAP.md) lists "Notificaties: nieuwe match, aanmelding geaccepteerd, etc." as Fase 2. Nothing exists. |
| J | **`notification.html` template ever being rendered** | 🟡 Medium | The template is built, styled, and supports rich context (`details` dict, action buttons, notes). It has never been rendered. All email-body construction in `NotificationService` uses inline plain-text strings that ignore this template entirely. |

---

## 4. Interactions with Existing App Functionality

### Working interactions

| Interaction | Assessment |
|-------------|------------|
| **Email retrieval → `mailto:` link construction** | ✅ The only email-adjacent feature that works end-to-end. [`CreateBusinessEmail.jsx`](../projojo_frontend/src/components/CreateBusinessEmail.jsx:7) fetches student/colleague emails from the backend and constructs `mailto:` links. This correctly uses the supervisor's own email client and requires no platform SMTP infrastructure. |
| **Test endpoint → MailHog** | ✅ Works as designed for development testing. [`LoginPage.jsx:144`](../projojo_frontend/src/pages/LoginPage.jsx:144) even links to `localhost:8025` for viewing emails in MailHog UI. |
| **MailHog Docker container** | ✅ Properly configured in [`docker-compose.yml:42`](../docker-compose.yml:42). Backend depends_on it. Ports mapped. Auth-skip in `email_service` works with MailHog (no username/password). |

### The NotificationService has zero interactions with any existing app functionality

This is confirmed by search: the `notification_service` singleton is never imported by any file in `routes/`, `domain/`, `auth/`, or `db/`. The only references are:
1. Its own module definition at [`notification_service.py:276`](../projojo_backend/service/notification_service.py:276)
2. Its re-export in [`__init__.py:4`](../projojo_backend/service/__init__.py:4)

### Interactions that *should* exist but don't

| Expected Interaction | Status | Evidence |
|---------------------|--------|----------|
| Project archive → email affected students | 🔴 Missing | [`project_router.py:272`](../projojo_backend/routes/project_router.py:272) — TODO comment |
| Project delete → email affected students | 🔴 Missing | [`project_router.py:447`](../projojo_backend/routes/project_router.py:447) — TODO comment |
| Registration accept/reject → email student | 🔴 Missing | No TODO, no scaffolding, not mentioned in `task_router.py` |
| Registration create → email supervisor | 🔴 Missing | No TODO, no scaffolding |
| Task start/complete → email counterparty | 🔴 Missing | No TODO, no scaffolding |
| Invite key creation → email with invite link | 🔴 Missing | `invitation.html` exists but only used by test endpoint |
| Business archive → email supervisors | 🔴 Missing | Not mentioned anywhere |

### Conflicting interactions

#### A. 🔴 `notified_count` response field creates a false audit trail

Both [`ProjectActionResponse`](../projojo_backend/routes/project_router.py:26) (archive) and the delete response return `notified_count` populated with the count of affected students, as if notifications were successfully sent.

**Evidence:**
- Archive: [`project_router.py:273`](../projojo_backend/routes/project_router.py:273) — `notified_count = len(affected_students) if affected_students else 0`
- Delete: [`project_router.py:455`](../projojo_backend/routes/project_router.py:455) — `"notified_count": len(affected_students) if affected_students else 0`

**Why it matters:** Any API consumer, frontend display, monitoring dashboard, or audit log consuming this field will conclude notifications were sent. They were not.

#### B. 🔴 Frontend confirmation modal requires user to affirm false statement

[`ProjectActionModal.jsx:198`](../projojo_frontend/src/components/ProjectActionModal.jsx:198) requires the user to check a box:

> "Ik begrijp dat N studenten een notificatie ontvangen [en het project permanent verwijderd wordt]"

This makes the acting teacher/supervisor believe they are triggering responsible user communication. In an educational context, deleting a project with active student work is consequential. The confirmation checkbox suggests the platform handles the human-communication side — which it does not. The teacher may not independently contact students because they trust the platform to do it.

#### C. 🟠 Docstring claims in project_router contradict reality

- [`project_router.py:240`](../projojo_backend/routes/project_router.py:240): "With confirm=True: sends notifications and archives the project." — **false**, no notifications sent
- [`project_router.py:390`](../projojo_backend/routes/project_router.py:390): "Sends notifications to affected students" — **false**

---

## 5. Implementation Correctness

### 5.1 ✅ Good — `email_service.py` is well-implemented

**Evidence:**
- Async throughout using `aiosmtplib` at [`send_email():283`](../projojo_backend/service/email_service.py:283), compatible with FastAPI's async route handlers
- Differentiated SMTP error handling with 6 distinct exception catches at [lines 293-315](../projojo_backend/service/email_service.py:293)
- Clean Pydantic models: [`EmailAttachment`](../projojo_backend/service/email_service.py:62) and [`EmailResult`](../projojo_backend/service/email_service.py:78) with proper typing
- SMTP config parsed safely with fallback defaults at [`_get_smtp_config()`](../projojo_backend/service/email_service.py:145)
- Empty credentials convert to `None` at [line 170](../projojo_backend/service/email_service.py:170) for MailHog no-auth mode
- Jinja2 environment lazily initialized at [`_get_template_env()`](../projojo_backend/service/email_service.py:101) with HTML autoescape
- Template rendering errors caught and returned as `EmailResult` failures at [lines 369-380](../projojo_backend/service/email_service.py:369)
- Consistent `logging` usage throughout

**Assessment:** This module is production-ready. No serious implementation issues.

---

### 5.2 🔴 Critical — NotificationService does not use the email service

**Evidence:**
- [`NotificationService._send_email()`](../projojo_backend/service/notification_service.py:239) is a plain synchronous method with commented-out `smtplib` code
- [`email_service.send_email()`](../projojo_backend/service/email_service.py:186) is `async def` and uses `aiosmtplib`
- `NotificationService` contains zero imports from `email_service`
- Both modules live in the same `service/` package and are both exported from [`__init__.py`](../projojo_backend/service/__init__.py:3)

**Why it matters:** Even if `email_enabled` were flipped to `True`, the [`_send_email()`](../projojo_backend/service/notification_service.py:254) method executes a `try` block that does nothing (the actual SMTP code is commented out), then returns `True`. The notification methods would report all emails as "sent" while nothing was delivered. Additionally, the notification service builds plain-text email bodies at [lines 144-157](../projojo_backend/service/notification_service.py:144) and [190-205](../projojo_backend/service/notification_service.py:190), completely ignoring the styled [`notification.html`](../projojo_backend/templates/email/notification.html:1) template that was built for exactly this purpose.

---

### 5.3 🔴 Critical — NotificationService is synchronous in an async application

**Evidence:**
- All `NotificationService` methods are synchronous (`def`, not `async def`)
- All route handlers in FastAPI run in the async event loop
- `email_service.send_email()` is correctly `async`

**Why it matters:** If someone were to wire `NotificationService` into a route handler and somehow enable it, the synchronous `smtplib` calls would block the async event loop during SMTP communication, degrading server responsiveness for all concurrent requests.

---

### 5.4 🔴 High — `notified_count` in API responses is fabricated

**Evidence:**
- [`project_router.py:273`](../projojo_backend/routes/project_router.py:273): `notified_count = len(affected_students) if affected_students else 0` — computed from the student list, not from actual notification results
- [`project_router.py:455`](../projojo_backend/routes/project_router.py:455): same pattern for delete
- [`ProjectActionResponse`](../projojo_backend/routes/project_router.py:26) includes `notified_count: int = 0` as a typed response field

**Why it matters:** The response schema declares a notification count; the implementation populates it with a number unrelated to actual notification delivery. Any consumer of this API field reaches false conclusions.

---

### 5.5 🟡 Medium — NotificationService uses `print()` instead of `logging`

**Evidence:** [`notification_service.py:134`](../projojo_backend/service/notification_service.py:134), [173](../projojo_backend/service/notification_service.py:173), [218](../projojo_backend/service/notification_service.py:218), [271](../projojo_backend/service/notification_service.py:271) — all use `print()`. Compare with [`email_service.py:54`](../projojo_backend/service/email_service.py:54) which uses `logging.getLogger(__name__)`.

---

### 5.6 🟡 Medium — Test endpoint and test UI not removed

**Evidence:**
- [`main.py:15-21`](../projojo_backend/main.py:15): `# EMAIL TEST IMPORTS - REMOVE AFTER TESTING`
- [`main.py:129-173`](../projojo_backend/main.py:129): Test endpoint with `REMOVE AFTER TESTING` comments
- [`services.js:758-776`](../projojo_frontend/src/services.js:758): `sendTestEmail` function with `REMOVE THIS FUNCTION AFTER TESTING`
- [`LoginPage.jsx:7-28`](../projojo_frontend/src/pages/LoginPage.jsx:7): Test email state with `REMOVE AFTER TESTING`
- [`LoginPage.jsx:110-149`](../projojo_frontend/src/pages/LoginPage.jsx:110): Test email UI section in production login page

**Why it matters:** The test endpoint is protected by environment check (`development` only) so it's not a direct security risk. But it adds code clutter, expanded surface area, and debug UI on the login page that is visible to development users.

---

### 5.7 ✅ Good — Email retrieval endpoints are correctly implemented

**Evidence:**
- [`task_router.py:46-67`](../projojo_backend/routes/task_router.py:46): Student email endpoint validates status values, deduplicates, and is properly auth-gated with `@auth(role="supervisor", owner_id_key="task_id")`
- [`task_router.py:37-44`](../projojo_backend/routes/task_router.py:37): Colleague email endpoint properly traverses business relationships and excludes the requesting supervisor
- [`CreateBusinessEmail.jsx`](../projojo_frontend/src/components/CreateBusinessEmail.jsx:7): Clean form UI with status checkboxes, subject input, loading state, error handling, and CC-to-colleagues option

**Assessment:** This is the one well-functioning email-adjacent feature in the app.

---

### 5.8 🟡 Medium — `base.html` template year is hardcoded

**Evidence:** [`base.html:180`](../projojo_backend/templates/email/base.html:180): `© {{ year|default(2024) }} Projojo` — no code passes `year` to any template context. Emails will display "© 2024" permanently.

---

## 6. Implementation Robustness

### What works well

| Aspect | Assessment |
|--------|------------|
| `email_service` error handling | ✅ Thorough. 6 differentiated exception catches. Returns `EmailResult` instead of raising. |
| `email_service` config parsing | ✅ Safe port parsing with fallback. Empty credentials handled. |
| `email_service` template loading | ✅ Lazy initialization, template-not-found caught and returned as error. |
| `CreateBusinessEmail` empty states | ✅ Handles no-addresses case at [line 43](../projojo_frontend/src/components/CreateBusinessEmail.jsx:43). |
| MailHog infrastructure | ✅ Properly containerized, ports exposed, backend depends_on. |

### Robustness issues

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| A | **No retry logic in email_service** | 🟡 Medium | A single SMTP failure produces a permanent `EmailResult(success=False)`. No retry for transient errors. For batch sends (multiple students on project archive/delete), each failure is final. |
| B | **No rate limiting** | 🟡 Medium | If many students are affected by a project archive/delete, all emails would be sent in rapid succession. Production SMTP providers may throttle or reject burst sends. |
| C | **No dead-letter queue or failure persistence** | 🟡 Medium | Failed notifications would be returned in-memory but never persisted. If the response is not processed (server crash, network error), the failure information is permanently lost. |
| D | **Hardcoded `email_enabled = False` with no configuration path** | 🔴 High | [`notification_service.py:19`](../projojo_backend/service/notification_service.py:19) has no environment variable, config file, admin toggle, or feature flag to enable it. A code change + redeployment required. |
| E | **`_send_email()` silently succeeds when disabled** | 🟠 Medium | When disabled (always), `_send_email()` at [line 245](../projojo_backend/service/notification_service.py:245) returns `True`. The outer methods therefore populate `notified` lists with email addresses for notifications that were never sent. If anyone uses NotificationService's return values, they will be wrong. |
| F | **No `test/email` route registration protection** | 🟢 Low | [`POST /test/email`](../projojo_backend/main.py:136) is not in `EXCLUDED_ENDPOINTS` but is also not decorated with `@auth()`. However, it checks `ENVIRONMENT` directly. The JWT middleware will attempt to validate the token but the endpoint is marked `@auth(role="unauthenticated")` — wait, it is NOT decorated with `@auth` at all. Since `/test/email` is not in `EXCLUDED_ENDPOINTS`, the JWT middleware will require a valid token. This means the test endpoint requires authentication in practice, even though it does not use `@auth()`. This is accidental security by middleware. |

---

## 7. Database and Schema Integration

### No email-specific entities exist in the schema

[`schema.tql`](../projojo_backend/db/schema.tql) contains:
- `email` as a string attribute on `user` at [line 5](../projojo_backend/db/schema.tql:5): `owns email @card(1)` — every user has exactly one email
- No `notification` entity, no `hasNotification` relation, no `notificationPreference` attribute, no `readAt` or `deliveredAt` timestamp

**What this means:**
- Email addresses are available for all users (students, supervisors, teachers) from the user entity
- There is no persistent notification inbox
- There is no read/unread tracking
- There is no notification history
- There is no way to query "show me all notifications for user X"
- There is no email preference or opt-out mechanism

### Schema support needed for a real notification system

| Entity / Attribute | Purpose | Current State |
|-------------------|---------|---------------|
| `notification` entity | Persistent notification record | 🔴 Does not exist |
| `notification.type` attribute | Classify notification type | 🔴 Does not exist |
| `notification.readAt` attribute | Track read state | 🔴 Does not exist |
| `notification.deliveredAt` attribute | Track email delivery | 🔴 Does not exist |
| `hasNotification` relation | Link notifications to users | 🔴 Does not exist |
| `notificationPreference` on user | Email/in-app/off per type | 🔴 Does not exist |
| `emailDeliveryLog` entity | Audit trail of sent emails | 🔴 Does not exist |

### Migration risk

Since no email-specific entities exist beyond `email` on `user`, introducing notification entities is purely additive and carries zero migration risk for existing data. Database reset is not required.

---

## 8. Documentation vs Implementation Mismatches

| # | Mismatch | Docs say | Code does |
|---|----------|----------|-----------|
| A | **A-001 audit verdict calls SMTP "Fully consistent"** | [`BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md`](BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md) A-001: "Fully consistent: SMTP + templates fully implemented in `send_email()` and `send_templated_email()`" | Technically true for the infrastructure module, but misleading. The module has one consumer (test endpoint marked for removal). No business event triggers an email. "Fully consistent" in context implies the feature works; functionally it does not. |
| B | **A-002 calls notification service "partially consistent"** | [`BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md`](BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md) A-002: "notification scaffold exists in `NotificationService`, but sending is disabled by `email_enabled = False`" | "Scaffold" and "partially" overstate what exists. The class has zero consumers. It is exported but never imported by any router. There are no integration points beyond `# TODO` comments. "Dead code" is more accurate than "scaffold." |
| C | **NEXT-UI-BRANCH-ANALYSIS lists email as "New feature"** | [`NEXT-UI-BRANCH-ANALYSIS.md:151`](NEXT-UI-BRANCH-ANALYSIS.md) lists `email_service.py (NEW)` as "Email sending capability" with impact "🔴 New feature" | The module exists and is well-built. Calling it a "feature" overstates what it delivers to users: zero emails from any business event. It is infrastructure, not a feature. |
| D | **Project router docstrings claim notification sending** | [`project_router.py:240`](../projojo_backend/routes/project_router.py:240): "With confirm=True: sends notifications and archives the project" | No notifications are sent. The docstring describes intended behavior that was never built. |
| E | **ROADMAP mentions notifications as future** | [`ROADMAP.md`](ROADMAP.md): "Notificaties (nieuwe match, aanmelding geaccepteerd, etc.)" under Fase 2 with 📝 status (described, no user story) | Correctly identifies notifications as not-yet-implemented. But does not mention the existing UI already promises them, creating an urgency mismatch. Also does not mention the existing email infrastructure that could deliver them. |
| F | **I-004 correctly identifies the issue** | [`BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md`](BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md) I-004: "Notification pipeline is partially implemented [...] Risk: stakeholders assume notifications while nothing is delivered" | This is the most accurate documentation statement about the notification system. It correctly identifies the core risk. |
| G | **Notification audit exists but misses email service strengths** | [`NOTIFICATION_SERVICE_AUDIT.md`](NOTIFICATION_SERVICE_AUDIT.md) gives product quality 1/10 | The earlier audit correctly identifies the notification system as dead code but undervalues the working email infrastructure (email_service, templates, MailHog) and the working email retrieval endpoints. The components *exist* to build a working system. |

---

## 9. Confirmed, Likely, and Open Questions

### Confirmed problems

| Severity | Problem | Evidence |
|----------|---------|----------|
| 🔴 Critical | No business event in the entire application triggers any email | Full search for `send_email` / `send_templated_email` calls across all routes: zero results outside of the test endpoint |
| 🔴 Critical | NotificationService is never called by any route or business logic | Zero imports of `notification_service` across all route files — search yields one result: `__init__.py` |
| 🔴 Critical | NotificationService does not use the production email service | [`_send_email()`](../projojo_backend/service/notification_service.py:239) is an independent synchronous stub; [`email_service.send_email()`](../projojo_backend/service/email_service.py:186) is never referenced |
| 🔴 Critical | `email_enabled = False` with no configuration mechanism | [`notification_service.py:19`](../projojo_backend/service/notification_service.py:19) — hardcoded, no env var, no feature flag |
| 🔴 Critical | Three UI locations promise notifications that are never delivered | [`Task.jsx:88`](../projojo_frontend/src/components/Task.jsx:88), [`ProjectActionModal.jsx:90-91`](../projojo_frontend/src/components/ProjectActionModal.jsx:90), [`ProjectActionModal.jsx:198`](../projojo_frontend/src/components/ProjectActionModal.jsx:198) |
| 🔴 High | `notified_count` in API responses is fabricated | [`project_router.py:273`](../projojo_backend/routes/project_router.py:273) and [line 455](../projojo_backend/routes/project_router.py:455) |
| 🔴 High | Registration accept/reject has no notification scaffolding at all | Zero references in `task_router.py`; not even a TODO comment |
| 🔴 High | `notification.html` template built but never rendered | Zero calls to `send_templated_email("notification.html", ...)` anywhere |
| 🔴 High | `invitation.html` template never used for actual invites | Only consumer is the test endpoint at [`main.py:150`](../projojo_backend/main.py:150) |
| 🟠 Medium | NotificationService is synchronous; would block event loop | [`_send_email()`](../projojo_backend/service/notification_service.py:239) is sync; FastAPI routes run async |
| 🟡 Medium | Test endpoint and UI not removed after testing | [`main.py:129-173`](../projojo_backend/main.py:129), [`LoginPage.jsx:110-149`](../projojo_frontend/src/pages/LoginPage.jsx:110), [`services.js:758-776`](../projojo_frontend/src/services.js:758) |
| 🟡 Medium | Debug output uses `print()` instead of `logging` in notification service | [`notification_service.py:134`](../projojo_backend/service/notification_service.py:134) etc. |
| 🟡 Medium | No retry, dead-letter, or failure persistence | Both systems are fire-and-forget |
| 🟡 Medium | `base.html` footer year hardcoded to 2024 default | [`base.html:180`](../projojo_backend/templates/email/base.html:180) |

### Likely problems

- If a developer enables `email_enabled = True` without rewriting `_send_email()`, the empty try block at [line 254](../projojo_backend/service/notification_service.py:254) will succeed silently — all notifications report "sent" with nothing delivered
- The `notification.html` template has never been rendered and may contain template errors not caught at load time
- Any future attempt to wire notifications into archive/delete routes will face the sync/async mismatch between `NotificationService` and the async route handlers
- `invitation.html` template context expects `expire_days` variable at [line 37](../projojo_backend/templates/email/invitation.html:37) but invite keys in the backend use absolute `expiresAt` timestamps, not relative day counts — a conversion would be needed

### Open questions

- Whether the two parallel email systems were built by different developers unaware of each other's work, or represent an intentional layered architecture that was never connected
- Whether `notification.html` template context variables (`notification_title`, `notification_body`, `details`, `action_url`) align with the data available at the archive/delete callsites — they appear compatible but have never been tested
- Whether the project intends in-app notifications (persistent notification inbox) in addition to email, or whether email is the sole intended channel
- Whether the `reason` field collected by [`ProjectActionModal.jsx:169`](../projojo_frontend/src/components/ProjectActionModal.jsx:169) is actually forwarded to the backend archive/delete endpoints — it appears to be collected but may be discarded since there is no notification to include it in
- Whether the MailHog container is intentionally kept in production docker-compose or should be environment-conditional

---

## 10. Recommendations

### Highest priority: fix user trust (stop lying)

1. **Remove or fix false notification promises in the UI**
   - [`Task.jsx:88`](../projojo_frontend/src/components/Task.jsx:88): Change "Je ontvangt bericht zodra de organisatie reageert" to "Controleer regelmatig je dashboard voor updates" or remove entirely
   - [`ProjectActionModal.jsx:90-91`](../projojo_frontend/src/components/ProjectActionModal.jsx:90): Change "Deze studenten krijgen een notificatie" to "Studenten worden niet automatisch op de hoogte gesteld. Neem zelf contact op." or implement the notifications
   - [`ProjectActionModal.jsx:198`](../projojo_frontend/src/components/ProjectActionModal.jsx:198): Change "een notificatie ontvangen" to "worden beïnvloed door deze actie"

2. **Fix `notified_count` in API responses**
   - Rename to `affected_count` in [`ProjectActionResponse`](../projojo_backend/routes/project_router.py:26) and the delete response
   - Update docstrings at [lines 240](../projojo_backend/routes/project_router.py:240) and [390](../projojo_backend/routes/project_router.py:390) to remove "sends notifications" claims

### High priority: build a working email pipeline

3. **Delete `NotificationService` and build notification logic using `email_service`**
   - The `NotificationService` class provides no usable value. Its method signatures document the intent, but the implementation is wrong (sync, `print()`, inline plain-text, hardcoded disabled, own email stub ignoring templates).
   - Build new async notification functions that call `send_templated_email()` using the existing `notification.html` template.
   - Place these in a new `notification_service.py` that imports from `email_service`.

4. **Wire up project archive/delete notifications**
   - Replace the `# TODO` at [`project_router.py:272`](../projojo_backend/routes/project_router.py:272) and [`project_router.py:447`](../projojo_backend/routes/project_router.py:447) with actual `await` calls to the new notification functions.
   - Make notification failure non-blocking: log errors but do not fail the archive/delete operation.
   - Populate `notified_count` from actual send results.

5. **Add registration lifecycle emails**
   - On accept/reject in [`task_router.py`](../projojo_backend/routes/task_router.py), send an email to the student using `notification.html`.
   - On new registration, optionally notify the supervisor.
   - These are the highest-value email triggers in the app.

6. **Wire up invite email dispatch**
   - When an invite key is created in [`invite_router.py`](../projojo_backend/routes/invite_router.py), send the `invitation.html` template to a specified email address.
   - This connects the existing template to its intended workflow.

### Medium priority: make email a real feature

7. **Add a feature flag via environment variable**
   - Replace `email_enabled = False` with an `EMAIL_NOTIFICATIONS_ENABLED` environment variable, defaulting to `False`.
   - This allows enabling notifications per deployment without code changes.

8. **Remove test endpoint and test UI code**
   - Delete [`main.py:15-21`](../projojo_backend/main.py:15) (test imports), [`main.py:129-173`](../projojo_backend/main.py:129) (test endpoint + model)
   - Delete [`services.js:758-776`](../projojo_frontend/src/services.js:758) (sendTestEmail function)
   - Delete [`LoginPage.jsx:7-28`](../projojo_frontend/src/pages/LoginPage.jsx:7) (test state) and [`LoginPage.jsx:110-149`](../projojo_frontend/src/pages/LoginPage.jsx:110) (test UI section)

9. **Fix `base.html` year**
   - Pass `year=datetime.now().year` in all template contexts, or use a Jinja2 extension to auto-inject.

10. **Add notification schema entities for in-app notifications**
    - Add a `notification` entity with `type`, `message`, `createdAt`, `readAt` attributes.
    - Add a `hasNotification` relation connecting users to notifications.
    - Build `GET /users/{user_id}/notifications` and `PATCH /notifications/{id}/read` endpoints.
    - Add a notification bell/badge to the frontend navbar.

### Lower priority: robustness and polish

11. **Add email delivery retry**
    - Implement exponential backoff retry (2-3 attempts) for transient SMTP failures in `send_email()`.

12. **Add email delivery logging**
    - Log all email send attempts (recipient, subject, success/failure, timestamp) for audit and debugging.

13. **Add notification preferences**
    - Allow users to opt out of email notifications or configure which events trigger emails.
    - Add a `notificationPreference` attribute to the user entity.

14. **Consider background job processing**
    - For batch sends (many affected students), consider a lightweight task queue (e.g., FastAPI `BackgroundTasks` built-in) rather than inline `await` in route handlers.

15. **Make MailHog conditional on environment**
    - Use a separate `docker-compose.dev.yml` or profile for MailHog to prevent it from running in production.

---

*This audit is based on direct code evidence from the `next-ui` branch and the referenced documentation. Every finding is grounded in cited source files with line numbers.*
