# Notification Service Audit — Product, Architecture & Implementation Review

**Date**: 23 March 2026
**Branch**: `next-ui`
**Scope**: Full-stack audit of the Notification Service across backend service layer, email infrastructure, router integration, database schema, and frontend notification UX
**Method**: Code-backed analysis starting from [`BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md`](BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md) and [`NEXT-UI-BRANCH-ANALYSIS.md`](NEXT-UI-BRANCH-ANALYSIS.md), then validating against actual implementation across all layers

---

## Overall Verdict

**The Notification Service is dead code. It is a class that exists in a file, is exported from its package, is never imported by any consumer, never called by any route, never wired into any workflow, and has its only delivery mechanism permanently disabled by a hardcoded `False` flag. Meanwhile, the UI makes three distinct promises to users that notifications will be sent — promises the backend cannot honor. The email infrastructure that *could* deliver notifications is a fully separate, production-quality async SMTP module that the Notification Service does not use. These two systems were built in parallel with no integration between them.**

The codebase contains **two independent, unconnected notification/email systems**:

1. **[`NotificationService`](../projojo_backend/service/notification_service.py:13)** — a synchronous, self-contained class with its own primitive `_send_email()` stub method, hardcoded `email_enabled = False`, and method scaffolding for project archive/delete notifications. It is a singleton exported from [`__init__.py`](../projojo_backend/service/__init__.py:4) but **never imported by any router, middleware, or other module**.

2. **[`email_service.py`](../projojo_backend/service/email_service.py:1)** — a production-quality async SMTP module using `aiosmtplib` + Jinja2 templates, with proper error handling, attachment support, TLS auto-negotiation, and three ready-to-use email templates. It is imported in [`main.py`](../projojo_backend/main.py:17) only for a test endpoint.

Neither system sends any notification triggered by a business event. The project archive and delete endpoints in [`project_router.py`](../projojo_backend/routes/project_router.py:272) have explicit `# TODO` comments where notification calls should go, and they return a `notified_count` field that is **a lie** — it reports the number of affected students as if they were notified, when no notification was sent.

### Quality Scores

| Dimension | Score | Notes |
|-----------|-------|-------|
| Product quality | 1/10 | No notification reaches any user. Three UI locations promise notifications that never arrive. The feature does not exist from a user's perspective. |
| Architecture quality | 3/10 | Two parallel email/notification systems with no integration. The NotificationService ignores the production email service. No schema support for notification state. No event system. |
| Implementation quality | 2/10 | The NotificationService is syntactically valid Python but functionally inert. The email_service is well-built but disconnected from all business logic. The bridge between them was never constructed. |
| Business-rule coherence | 2/10 | The intended rules (notify students on archive/delete, notify on registration decisions) are reasonable but zero are enforced. UI copy actively misleads users about notification delivery. |

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

### A. NotificationService class (dead code)

[`NotificationService`](../projojo_backend/service/notification_service.py:13) is a 276-line Python class providing:

- [`notify_project_archived()`](../projojo_backend/service/notification_service.py:21) — accepts project name, affected students list, supervisor email, optional teacher email and reason. Iterates students and calls `_send_student_archive_notification()` for each, then optionally calls `_send_teacher_notification()`.
- [`notify_project_deleted()`](../projojo_backend/service/notification_service.py:76) — same pattern but for deletion, including a `has_portfolio_snapshot` flag per student and a `snapshots_created` count.
- [`_send_student_archive_notification()`](../projojo_backend/service/notification_service.py:123) — builds a plain-text Dutch email body for archive notifications. Returns `True` immediately when `email_enabled` is `False` (always).
- [`_send_student_delete_notification()`](../projojo_backend/service/notification_service.py:161) — same for deletion, with portfolio snapshot messaging.
- [`_send_teacher_notification()`](../projojo_backend/service/notification_service.py:208) — notifies a teacher about the action and affected student count.
- [`_send_email()`](../projojo_backend/service/notification_service.py:239) — stub method with commented-out SMTP example code. Returns `True` without sending when `email_enabled` is `False`.

A singleton instance is created at module level: [`notification_service = NotificationService()`](../projojo_backend/service/notification_service.py:276).

**Critical fact: This singleton is exported in [`__init__.py`](../projojo_backend/service/__init__.py:4) but is never imported by any file in the `routes/`, `domain/`, `auth/`, or `db/` packages.** Zero consumers exist.

### B. Email service (production-ready, disconnected)

[`email_service.py`](../projojo_backend/service/email_service.py:1) is a 402-line async SMTP email module providing:

- [`send_email()`](../projojo_backend/service/email_service.py:186) — full-featured async email sending via `aiosmtplib` with support for HTML/text bodies, CC/BCC, reply-to, attachments, and comprehensive error handling.
- [`send_templated_email()`](../projojo_backend/service/email_service.py:318) — Jinja2 template rendering + email sending.
- Configuration via environment variables: `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_SMTP_USERNAME`, `EMAIL_SMTP_PASSWORD`, `EMAIL_DEFAULT_SENDER`.
- Auth auto-skip when credentials are empty (for MailHog in dev).

### C. Email templates (ready, unused for notifications)

Three Jinja2 templates exist in [`projojo_backend/templates/email/`](../projojo_backend/templates/email/):

- [`base.html`](../projojo_backend/templates/email/base.html:1) — responsive email layout with Projojo branding, styled info/warning boxes, primary/secondary buttons, and a footer.
- [`notification.html`](../projojo_backend/templates/email/notification.html:1) — extends base.html, provides `notification_title`, `notification_body`, optional `details` dict, optional action buttons, and a note field. **This template is never used anywhere in the codebase.**
- [`invitation.html`](../projojo_backend/templates/email/invitation.html:1) — extends base.html, used only by the test email endpoint at [`main.py:136`](../projojo_backend/main.py:136).

### D. Test email endpoint (dev-only, should be removed)

[`POST /test/email`](../projojo_backend/main.py:136) sends a test email using the invitation template. Protected by environment check (`development` only). Has `REMOVE AFTER TESTING` comments. It uses `send_templated_email()` from the email service — confirming the email service works — but is unrelated to business notifications.

### E. Frontend toast notification system (local-only, unrelated)

The frontend has a complete local notification system in [`NotifySystem.jsx`](../projojo_frontend/src/components/notifications/NotifySystem.jsx:82) and [`Notification.jsx`](../projojo_frontend/src/components/notifications/Notification.jsx:33). This is a **browser-only toast/snackbar system** used for immediate UI feedback (success/error messages after API calls). It has no connection to backend-driven notifications, email delivery, or persistent notification state.

---

## 2. Business Rules vs Implementation

### Rule: Students should be notified when a project is archived (A-002, I-004)

**Status:** 🔴 Not implemented

**Evidence:**
- [`project_router.py:272`](../projojo_backend/routes/project_router.py:272): `# TODO: Send notifications to affected students and teacher`
- The `notification_service` singleton is never imported in [`project_router.py`](../projojo_backend/routes/project_router.py:1) — zero references to `notification` in any import statement across all route files (confirmed by search).
- [`ProjectActionResponse`](../projojo_backend/routes/project_router.py:23) returns `notified_count` that is set to `len(affected_students)` at [line 273](../projojo_backend/routes/project_router.py:273) without any notification having been sent.

**User-facing impact:** Students whose project is archived receive no communication whatsoever. They will only discover the change the next time they log in and look at their dashboard.

---

### Rule: Students should be notified when a project is deleted (A-002, C-009)

**Status:** 🔴 Not implemented

**Evidence:**
- [`project_router.py:447`](../projojo_backend/routes/project_router.py:447): `# TODO: Send notifications to affected students and teacher`
- The delete endpoint returns `"notified_count": len(affected_students)` at [line 455](../projojo_backend/routes/project_router.py:455) — again reporting notification success for notifications that were never sent.
- The router docstring at [line 390](../projojo_backend/routes/project_router.py:390) claims: "Sends notifications to affected students."

**User-facing impact:** Students whose project is permanently deleted — potentially including active work in progress — receive no communication. Portfolio snapshots are silently created, but the student has no way to know this happened.

---

### Rule: Students should be notified when their registration is accepted or rejected

**Status:** 🔴 Not implemented — not even scaffolded

**Evidence:**
- [`Task.jsx:88`](../projojo_frontend/src/components/Task.jsx:88): `notification.success("Je aanmelding is verstuurd! Je ontvangt bericht zodra de organisatie reageert.");` — This is a frontend toast message that explicitly tells students "You will receive a message when the organization responds."
- [`task_router.py`](../projojo_backend/routes/task_router.py) — zero TODO markers, zero notification references, zero email integration for registration lifecycle events.
- [`NotificationService`](../projojo_backend/service/notification_service.py:13) has no methods for registration notifications — only archive and delete.

**User-facing impact:** This is arguably the most harmful gap. Students are explicitly told they will be notified, and they never are. They must manually check their dashboard to discover whether they were accepted or rejected. This directly undermines the core matching workflow that is the app's primary purpose.

---

### Rule: Notification promises in UI should match delivery capability

**Status:** 🔴 Three confirmed false promises

| # | Location | Promise | Reality |
|---|----------|---------|---------|
| 1 | [`Task.jsx:88`](../projojo_frontend/src/components/Task.jsx:88) | "Je ontvangt bericht zodra de organisatie reageert" | No notification is sent on accept/reject. No mechanism exists for this. |
| 2 | [`ProjectActionModal.jsx:90`](../projojo_frontend/src/components/ProjectActionModal.jsx:90) | "Deze studenten krijgen een notificatie en hun voltooide werk wordt opgeslagen in hun portfolio" | Portfolio snapshots are created. Notifications are not sent. The sentence is half-true. |
| 3 | [`ProjectActionModal.jsx:91`](../projojo_frontend/src/components/ProjectActionModal.jsx:91) | "Deze studenten krijgen een notificatie dat het project niet meer actief is" | No notification is sent. The sentence is entirely false. |

Additionally, the confirmation checkbox at [`ProjectActionModal.jsx:198`](../projojo_frontend/src/components/ProjectActionModal.jsx:198) requires the supervisor/teacher to affirm: "Ik begrijp dat N studenten een notificatie ontvangen" — making the user explicitly confirm notification delivery that does not happen.

---

## 3. Feature Completeness — Expected but Missing

### What a reasonable user would expect from a Notification Service

A notification service in an educational project management platform should, at minimum: (1) notify students when their registration status changes, (2) notify students when projects/tasks they work on are modified, (3) notify supervisors when students register for their tasks, (4) allow users to see a history of notifications, and (5) support both in-app and email delivery channels.

### Expected-but-missing subfeatures

| # | Missing Feature | Severity | Evidence / Reasoning |
|---|----------------|----------|---------------------|
| A | **Registration lifecycle notifications** | 🔴 Critical | Students get no notification on accept, reject, start, or complete. Supervisors get no notification on new registrations. These are the most frequent, highest-value notification triggers in the app. Not even scaffolded in `NotificationService`. |
| B | **Any actual email delivery** | 🔴 Critical | `email_enabled = False` in [`notification_service.py:19`](../projojo_backend/service/notification_service.py:19). The `_send_email()` stub at [line 239](../projojo_backend/service/notification_service.py:239) is never used. The production SMTP service at [`email_service.py:186`](../projojo_backend/service/email_service.py:186) is never called by any business logic. |
| C | **Integration between NotificationService and email_service** | 🔴 Critical | `NotificationService._send_email()` is a synchronous stub with commented-out `smtplib` code. It completely ignores the async `aiosmtplib`-based [`send_email()`](../projojo_backend/service/email_service.py:186) that exists in the same package. Two email systems exist in the same `service/` directory with no awareness of each other. |
| D | **In-app notification inbox or bell icon** | 🟠 Medium-High | No notification entity in schema, no notification list endpoint, no notification UI component, no unread-count badge. The only "notifications" are ephemeral browser toasts that disappear after 7 seconds ([`NotifySystem.jsx:83`](../projojo_frontend/src/components/notifications/NotifySystem.jsx:83)). |
| E | **Notification preferences / opt-out** | 🟡 Medium | No user preference for notification channels, frequency, or types. No schema field, no settings UI, no backend handling. |
| F | **Push notifications or real-time updates** | 🟡 Medium | No WebSocket, SSE, or push notification infrastructure. The app is purely request/response. |
| G | **Task deadline reminder notifications** | 🟡 Medium | [`Task.jsx:63-73`](../projojo_frontend/src/components/Task.jsx:63) calculates countdown text, but no backend scheduler or cron job exists to send deadline reminders. |
| H | **Skill-match notifications** | 🟡 Medium | [`ROADMAP.md`](ROADMAP.md) lists "Notificaties: nieuwe match, aanmelding geaccepteerd, etc." as a Fase 2 feature. The [`GEBRUIKERSSCENARIOS_V1.md`](GEBRUIKERSSCENARIOS_V1.md) explicitly mentions "Nieuw project dat bij jouw skills past." Nothing exists. |

---

## 4. Interactions with Existing App Functionality

### The NotificationService has zero interactions with any existing app functionality

This is not an exaggeration. The `notification_service` singleton:
- Is never imported by any router
- Is never called by any endpoint
- Is never referenced in any repository
- Is never used in any middleware
- Is never injected as a dependency

The only references are:
1. Its own module definition at [`notification_service.py:276`](../projojo_backend/service/notification_service.py:276)
2. Its re-export in [`__init__.py:4`](../projojo_backend/service/__init__.py:4)

### Interactions that *should* exist but don't

| Expected Interaction | Status | Evidence |
|---------------------|--------|----------|
| Project archive → notify affected students | 🔴 Missing | [`project_router.py:272`](../projojo_backend/routes/project_router.py:272) has TODO comment |
| Project delete → notify affected students | 🔴 Missing | [`project_router.py:447`](../projojo_backend/routes/project_router.py:447) has TODO comment |
| Registration accept/reject → notify student | 🔴 Missing | No TODO, no scaffolding, not even mentioned in `task_router.py` |
| Registration create → notify supervisor | 🔴 Missing | No TODO, no scaffolding |
| Task start/complete → notify counterparty | 🔴 Missing | No TODO, no scaffolding |
| Business archive → notify supervisors | 🔴 Missing | Not mentioned anywhere |
| Invite key creation → email with invite link | 🔴 Missing | [`invitation.html`](../projojo_backend/templates/email/invitation.html:1) template exists but is only used by the test endpoint |

### Conflicting interactions

#### A. 🔴 `notified_count` response field creates a false audit trail

Both [`ProjectActionResponse`](../projojo_backend/routes/project_router.py:23) and the delete endpoint response return `notified_count` populated with the count of affected students. Any logging, monitoring, or admin dashboard consuming this field would conclude that notifications were sent successfully. This is a data integrity issue: the API response lies about what happened.

**Evidence:**
- Archive: [`project_router.py:273-277`](../projojo_backend/routes/project_router.py:273) — `notified_count = len(affected_students)` then returned in response
- Delete: [`project_router.py:455`](../projojo_backend/routes/project_router.py:455) — `"notified_count": len(affected_students)`

#### B. 🟠 Frontend confirmation modal requires user to affirm false statement

[`ProjectActionModal.jsx:198`](../projojo_frontend/src/components/ProjectActionModal.jsx:198) requires the user to check a box saying "Ik begrijp dat N studenten een notificatie ontvangen." This makes the acting user believe they are triggering a responsible workflow with user communication, when in reality nothing is communicated.

**Why it matters beyond UX:** In an educational context, a teacher deleting a project with active student work is a consequential action. The confirmation checkbox is designed to create an explicit acknowledgment of impact. By including notification delivery as part of that acknowledgment, the UI suggests that the platform handles the human-communication side — which it does not. The teacher may not take independent action to inform students because they trust the platform to do it.

---

## 5. Implementation Correctness

### 5.1 🔴 Critical — NotificationService does not use the email service

**Evidence:**
- [`NotificationService._send_email()`](../projojo_backend/service/notification_service.py:239) contains commented-out `smtplib` code as an example implementation. It is a completely independent email-sending concept.
- [`email_service.send_email()`](../projojo_backend/service/email_service.py:186) is an async function using `aiosmtplib` with proper error handling, TLS, and templates.
- The `NotificationService` class does not import, reference, or delegate to `email_service` anywhere.
- Both modules are in the same `service/` package and are both exported from [`__init__.py`](../projojo_backend/service/__init__.py:3).

**Why it matters:** Even if `email_enabled` were set to `True`, the `_send_email()` method would execute the `try` block at [line 254](../projojo_backend/service/notification_service.py:254) which does nothing (no actual SMTP code, just `return True`). The email templates ([`notification.html`](../projojo_backend/templates/email/notification.html:1)) were built for the `email_service` template engine, not for `NotificationService`'s plain-text string formatting.

**Recommendation:** `NotificationService` should be rewritten to delegate to `email_service.send_templated_email()` using the existing `notification.html` template, or be deleted entirely and replaced with direct calls to the email service from the routers.

---

### 5.2 🔴 Critical — NotificationService is synchronous; email_service is async

**Evidence:**
- [`NotificationService._send_email()`](../projojo_backend/service/notification_service.py:239) is a regular synchronous method.
- [`email_service.send_email()`](../projojo_backend/service/email_service.py:186) is `async def`.
- All route handlers in FastAPI that would call notification methods run in the async event loop.

**Why it matters:** If someone were to wire up `NotificationService` into a route handler and switch `email_enabled` to `True` using the commented-out `smtplib` code, it would block the event loop during SMTP communication (synchronous I/O in an async context). This would degrade server responsiveness for all concurrent requests during email delivery.

**Recommendation:** Any notification delivery must be async. Either rewrite `NotificationService` as async, or delegate to the already-async `email_service`.

---

### 5.3 🔴 High — `notified_count` in API responses is a fabricated metric

**Evidence:**
- [`project_router.py:273`](../projojo_backend/routes/project_router.py:273): `notified_count = len(affected_students) if affected_students else 0` — computed from the student list, not from actual notification results
- [`project_router.py:455`](../projojo_backend/routes/project_router.py:455): same pattern for delete
- [`ProjectActionResponse`](../projojo_backend/routes/project_router.py:23) includes `notified_count: int = 0` as a typed response field

**Why it matters:** The response schema declares that a notification count will be returned; the implementation populates it with a number that has no relationship to notifications actually sent. Any API consumer, frontend display, or audit log consuming this field will reach false conclusions.

**Recommendation:** Either actually send notifications and report the real count, or remove `notified_count` from the response model and replace with something honest like `affected_count` that documents how many students were affected (without implying notification delivery).

---

### 5.4 🟡 Medium — NotificationService uses `print()` instead of `logging`

**Evidence:** [`notification_service.py:134`](../projojo_backend/service/notification_service.py:134), [`173`](../projojo_backend/service/notification_service.py:173), [`218`](../projojo_backend/service/notification_service.py:218) — all use `print()` for debug output. Compare with [`email_service.py:54`](../projojo_backend/service/email_service.py:54) which uses `logging.getLogger(__name__)`.

**Why it matters:** `print()` output goes to stdout; in containerized deployment, it may not be captured by structured logging. The existing email service correctly uses the `logging` module, so this is an inconsistency within the same package.

---

### 5.5 🟡 Medium — notification.html template is never rendered

**Evidence:** [`notification.html`](../projojo_backend/templates/email/notification.html:1) accepts context variables `notification_title`, `notification_body`, `details`, `action_url`, `action_text`, `secondary_action_url`, `secondary_action_text`, and `note`. No code in the entire codebase calls `send_templated_email()` with `template_name="notification.html"`. The `NotificationService` builds its own inline plain-text email bodies at [lines 144-157](../projojo_backend/service/notification_service.py:144) and [lines 190-205](../projojo_backend/service/notification_service.py:190), completely ignoring the template.

**Why it matters:** Effort was spent building a styled, responsive HTML email template for notifications that is completely unused. The `NotificationService` DIYs plain-text emails that would look unprofessional if actually delivered.

---

## 6. Implementation Robustness

### What works despite the non-functionality

| Aspect | Assessment |
|--------|------------|
| NotificationService method signatures | Reasonable. Accept the right parameters for archive/delete use cases. |
| Return value structure | Reasonable. Returns `notified/failed` lists and counts. |
| Template infrastructure | Production-quality. Jinja2 + responsive HTML + inheritance. |
| Email service error handling | Thorough. Handles SMTP auth failures, recipient refusal, connection errors, timeouts. |
| Frontend toast system | Works correctly for its local-only purpose. |

### Robustness issues

| # | Issue | Severity | Details |
|---|-------|----------|---------|
| A | **No retry logic** | 🟡 Medium | The `NotificationService` has no retry mechanism. The `email_service` also has no retry — a single SMTP failure produces a permanent `EmailResult(success=False)`. For transient SMTP errors, notifications would be silently lost. |
| B | **No dead-letter queue or failure persistence** | 🟡 Medium | Failed notifications are returned as `failed_emails` lists in memory but never persisted. If the server restarts or the response is not processed, the failure information is lost. There is no mechanism to retry failed sends. |
| C | **No rate limiting** | 🟢 Low | If many students are affected by a project archive/delete, all emails would be sent in rapid succession. SMTP servers may throttle or reject burst sends. No rate limiting or batching exists. |
| D | **Hardcoded `email_enabled = False` with no configuration path** | 🔴 High | [`notification_service.py:19`](../projojo_backend/service/notification_service.py:19) hardcodes `self.email_enabled = False`. There is no environment variable, no configuration file, no admin toggle, and no feature flag mechanism to enable it. To enable notifications, a code change and redeployment would be required. |
| E | **`_send_email()` in NotificationService silently succeeds** | 🟠 Medium | When disabled (always), `_send_email()` returns `True` — meaning the outer methods report notifications as "sent" even though nothing happened. This is why the `notified` list gets populated with email addresses for notifications that were never delivered. |

---

## 7. Database and Schema Integration

### No notification entities exist in the schema

[`schema.tql`](../projojo_backend/db/schema.tql) contains no `notification` entity, no `hasNotification` relation, no `notificationPreference` attribute, and no `readAt` or `deliveredAt` timestamp for any notification concept. Search for "notification" and "notify" across all `.tql` files returns zero results.

**What this means:**
- There is no persistent notification inbox
- There is no read/unread tracking
- There is no notification history
- There is no way to query "show me all notifications for student X"
- There is no notification preference or opt-out mechanism

### Schema support needed for a real notification system

| Entity / Attribute | Purpose | Current State |
|-------------------|---------|---------------|
| `notification` entity | Persistent notification record | 🔴 Does not exist |
| `notification.type` attribute | Classify notification (archive, accept, reject, etc.) | 🔴 Does not exist |
| `notification.readAt` attribute | Track read state | 🔴 Does not exist |
| `notification.deliveredAt` attribute | Track email delivery | 🔴 Does not exist |
| `hasNotification` relation | Link notifications to users | 🔴 Does not exist |
| `notificationPreference` on user | Email/in-app/off per type | 🔴 Does not exist |

### Migration risk

Since no notification entities exist, introducing them is additive and carries no migration risk for existing data. A database reset is not required — new entity types and relations can be added to the schema without affecting existing entities.

---

## 8. Documentation vs Implementation Mismatches

| # | Mismatch | Docs say | Code does |
|---|----------|----------|-----------|
| A | **A-002 calls it "partial"** | [`BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md`](BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md) A-002: "Service has method scaffolding but email sending is effectively disabled (`email_enabled=False`), making this rule partially implemented." | "Partially implemented" is generous. The scaffolding exists but is never called. `notification_service` is not imported by any router. The service has zero consumers. "Partially implemented" implies some partial functionality exists — none does. |
| B | **Audit says "notification scaffold exists"** | [`BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md`](BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md) audit verdict for A-002: "notification scaffold exists in `NotificationService`, but sending is disabled by `email_enabled = False` and routes still have TODO hooks in `project_router.py`" | The word "hooks" implies there are integration points ready to be connected. There are only `# TODO` comment strings. No code structure (function call, dependency injection, event emission) exists at the integration points. |
| C | **NEXT-UI-BRANCH-ANALYSIS says "+276 lines"** | [`NEXT-UI-BRANCH-ANALYSIS.md:150`](NEXT-UI-BRANCH-ANALYSIS.md) lists `notification_service.py (NEW, +276)` as "Notification system" with impact "🔴 New feature" | The 276 lines are a complete, coherent class — but one that is entirely dead code. Calling it a "feature" overstates what exists. It is a specification-as-code that was never wired up. |
| D | **Project router docstrings claim notification sending** | [`project_router.py:240`](../projojo_backend/routes/project_router.py:240): "With confirm=True: sends notifications and archives the project." [`project_router.py:390`](../projojo_backend/routes/project_router.py:390): "Sends notifications to affected students" | No notifications are sent. The docstrings describe intended behavior that was never implemented. |
| E | **ROADMAP mentions notifications as future** | [`ROADMAP.md`](ROADMAP.md) lists "Notificaties (nieuwe match, aanmelding geaccepteerd, etc.)" under Fase 2 Praktische Verbeteringen with 📝 status (described but no user story) | The ROADMAP correctly identifies notifications as not-yet-implemented. But it does not mention that the existing UI already promises them, creating an urgency mismatch. |
| F | **I-004 correctly identifies the issue** | [`BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md`](BUSINESS_RULES_FROM_NEXT_UI_BRANCH.md) I-004: "Notification pipeline is partially implemented [...] Risk: stakeholders assume notifications while nothing is delivered." | This is the most accurate documentation statement about the notification system. It correctly identifies the core risk. |
| G | **Other audits reference notification issues** | [`PORTFOLIO_SYSTEM_AUDIT.md`](PORTFOLIO_SYSTEM_AUDIT.md) §6.E: "Notification promises are misleading" with 🟡 Medium. [`TASK_SYSTEM_AUDIT.md`](TASK_SYSTEM_AUDIT.md) §3.C: "No notifications on registration state changes" with 🔴 High. | Both audits correctly flag the issue but scope it to their own feature domain. The notification problem is system-wide. |

---

## 9. Confirmed, Likely, and Open Questions

### Confirmed problems

| Severity | Problem | Evidence |
|----------|---------|----------|
| 🔴 Critical | NotificationService is never called by any route or business logic | Zero imports of `notification_service` across all route files (confirmed by search) |
| 🔴 Critical | NotificationService does not use the production email service | [`_send_email()`](../projojo_backend/service/notification_service.py:239) is an independent stub; [`email_service.send_email()`](../projojo_backend/service/email_service.py:186) is never referenced by NotificationService |
| 🔴 Critical | `email_enabled = False` with no configuration mechanism to change it | [`notification_service.py:19`](../projojo_backend/service/notification_service.py:19) — hardcoded, no env var, no config |
| 🔴 Critical | Three UI locations promise notifications that are never delivered | [`Task.jsx:88`](../projojo_frontend/src/components/Task.jsx:88), [`ProjectActionModal.jsx:90-91`](../projojo_frontend/src/components/ProjectActionModal.jsx:90), [`ProjectActionModal.jsx:198`](../projojo_frontend/src/components/ProjectActionModal.jsx:198) |
| 🔴 High | `notified_count` in API responses is fabricated | [`project_router.py:273`](../projojo_backend/routes/project_router.py:273) and [`project_router.py:455`](../projojo_backend/routes/project_router.py:455) |
| 🔴 High | Registration accept/reject has no notification scaffolding at all | Zero references in `task_router.py`; not even a TODO comment |
| 🔴 High | `notification.html` template is built but never rendered | No call to `send_templated_email("notification.html", ...)` exists anywhere |
| 🟠 Medium | NotificationService is synchronous; would block event loop if naively enabled | [`_send_email()`](../projojo_backend/service/notification_service.py:239) is sync; routes run async |
| 🟡 Medium | Debug output uses `print()` instead of `logging` | [`notification_service.py:134`](../projojo_backend/service/notification_service.py:134) etc. |
| 🟡 Medium | No retry, dead-letter, or failure persistence for notifications | Both `NotificationService` and `email_service` are fire-and-forget |

### Likely problems

- If a developer enables `email_enabled = True` without rewriting `_send_email()`, notifications will silently "succeed" (`_send_email` returns `True` from the `try` block which does nothing) — the print statements won't fire but the empty try block will succeed
- The `invitation.html` template is tested but `notification.html` has never been rendered, so it may contain template errors that are not caught
- Any future attempt to integrate notification sending into the archive/delete flow will face the sync/async mismatch between `NotificationService` and route handlers

### Open questions

- Whether the two parallel email systems (NotificationService with inline text vs email_service with templates) were built by different developers unaware of each other's work, or whether they represent an intentional layered architecture that was never connected
- Whether the `notification.html` template's context variables (`notification_title`, `notification_body`, `details`, `action_url`, etc.) align with the data available at the archive/delete notification callsites — they appear compatible but this has never been tested
- Whether the project intends in-app notifications (persistent notification inbox) in addition to email, or whether email is the sole intended channel
- Whether the `reason` field collected by [`ProjectActionModal.jsx:169`](../projojo_frontend/src/components/ProjectActionModal.jsx:169) is passed to the backend — it appears to be collected in the modal but the `onConfirm` handler at [line 36](../projojo_frontend/src/components/ProjectActionModal.jsx:36) returns `{ reason }`, and the `handleConfirmAction` in [`ProjectDetails.jsx`](../projojo_frontend/src/components/ProjectDetails.jsx) would need to forward it to the API. This reason was intended for notification messages but since notifications are not sent, the data may be collected and discarded.

---

## 10. Recommendations

### Highest priority (user trust and correctness)

1. **Remove or fix false notification promises in the UI**
   - Update [`Task.jsx:88`](../projojo_frontend/src/components/Task.jsx:88) — remove "Je ontvangt bericht zodra de organisatie reageert" or replace with "Controleer regelmatig je dashboard voor updates."
   - Update [`ProjectActionModal.jsx:90-91`](../projojo_frontend/src/components/ProjectActionModal.jsx:90) — remove "Deze studenten krijgen een notificatie" or replace with "Studenten worden niet automatisch op de hoogte gesteld. Neem zelf contact op."
   - Update [`ProjectActionModal.jsx:198`](../projojo_frontend/src/components/ProjectActionModal.jsx:198) — remove "een notificatie ontvangen" from the confirmation text, or replace with "worden beïnvloed door deze actie."

2. **Fix `notified_count` in API responses**
   - Rename to `affected_count` in [`ProjectActionResponse`](../projojo_backend/routes/project_router.py:23) and the delete response at [`project_router.py:455`](../projojo_backend/routes/project_router.py:455).
   - Update [`project_router.py:240`](../projojo_backend/routes/project_router.py:240) and [`project_router.py:390`](../projojo_backend/routes/project_router.py:390) docstrings to remove "sends notifications" claims.

### High priority (build a working notification pipeline)

3. **Delete `NotificationService` and build notification logic using `email_service`**
   - The `NotificationService` class provides no value. Its method signatures are useful as documentation, but the implementation is wrong (sync, uses `print`, builds plain-text instead of using templates, has hardcoded disabled flag).
   - Build notification functions as async wrappers around `send_templated_email()` using the existing `notification.html` template.
   - Place these in a new `notification_service.py` that imports from `email_service`.

4. **Wire up project archive/delete notifications**
   - Replace the `# TODO` at [`project_router.py:272`](../projojo_backend/routes/project_router.py:272) and [`project_router.py:447`](../projojo_backend/routes/project_router.py:447) with actual calls to the new notification functions.
   - Use `await` since the route handlers are async and the email service is async.
   - Make notification failure non-blocking: log errors but don't fail the archive/delete operation.

5. **Add registration lifecycle notifications**
   - On accept/reject in [`task_router.py`](../projojo_backend/routes/task_router.py:182), send an email to the student using `notification.html`.
   - On new registration, optionally notify the supervisor.
   - This is the highest-value notification trigger — the one users are explicitly promised and most need.

### Medium priority (make notifications a real feature)

6. **Add a feature flag via environment variable**
   - Replace the hardcoded `email_enabled = False` with an `EMAIL_NOTIFICATIONS_ENABLED` environment variable, defaulting to `False`.
   - This allows enabling notifications per deployment without code changes.

7. **Add notification schema entities for in-app notifications**
   - Add a `notification` entity with `type`, `message`, `createdAt`, `readAt` attributes.
   - Add a `hasNotification` relation connecting users to notifications.
   - Build a `GET /users/{user_id}/notifications` endpoint and a `PATCH /notifications/{id}/read` endpoint.
   - Add a notification bell/badge to the frontend navbar.

8. **Remove the test email endpoint**
   - [`main.py:136`](../projojo_backend/main.py:136) has explicit `REMOVE AFTER TESTING` comments. The email service has been validated. Remove the endpoint.

### Lower priority (robustness and polish)

9. **Add email delivery retry**
   - Implement exponential backoff retry for transient SMTP failures in the email service.

10. **Add notification preferences**
    - Allow users to opt out of email notifications or configure which events trigger emails.

11. **Consider background job processing**
    - For large batches (many affected students), send notifications via a background task queue rather than inline in the route handler to avoid slow API responses.

---

*This audit is based on direct code evidence from the `next-ui` branch and the referenced documentation. Every finding is grounded in cited source files with line numbers.*
