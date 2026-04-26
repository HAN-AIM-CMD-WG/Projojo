# ARCH-task-017 — Supervisor Login Block for Fully Archived Accounts

**User Story**: [ARCH-story-005 — Role-Specific Archive Experience](ARCH-story-005-role-specific-archive-experience.md)  
**Priority**: 🟡 High  
**Type**: Functional Task  
**Spec references**: [§6.6](../../ARCHIVING_SPECIFICATION.md), [§4.5](../../ARCHIVING_SPECIFICATION.md)  
**Dependencies**: [ARCH-task-001](ARCH-task-001-schema-migration.md), [ARCH-task-006](ARCH-task-006-business-archive.md)

---

## Task Story

As a **supervisor whose businesses have all been archived**,  
I want to be blocked from logging in with a clear Dutch error message and offered guest access to the public discovery page,  
so that I do not access a dashboard with no content and understand my account status.

---

## Context: What Must Change and Why

The current codebase has a supervisor login block ([`auth_service.py:32`](../../../projojo_backend/service/auth_service.py:32)) that checks `is_supervisor_archived()` — a binary check on whether the supervisor entity itself has an `archivedAt` attribute. The frontend auth callback ([`AuthCallback.jsx:16`](../../../projojo_frontend/src/auth/AuthCallback.jsx:16)) displays the error and redirects to `/`.

The specification changes this in two ways:

1. **Multi-business model** (§4.5): A supervisor is not "fully blocked" if they still have at least one active business. The check must become "does this supervisor have any active (non-archived) businesses?" rather than "is the supervisor entity archived?"
2. **Guest continuation** (§6.6): The frontend must offer navigation to the public discovery page, not just redirect to login.

---

## Acceptance Criteria

### AC-1: Login succeeds when supervisor has at least one active business

**Given** a supervisor manages two businesses, one archived and one active  
**When** the supervisor authenticates  
**Then** login succeeds normally  
**And** the supervisor can access the active business dashboard

### AC-2: Login blocked when all businesses are archived

**Given** a supervisor manages only businesses that are all archived  
**When** the supervisor authenticates  
**Then** the login is blocked before a session is created  
**And** the error message is in Dutch: "Je account is gearchiveerd. Neem contact op met een docent."

### AC-3: Login blocked when supervisor has no businesses at all

**Given** a supervisor entity exists but has no `manages` relations to any business  
**When** the supervisor authenticates  
**Then** the login is blocked (edge case — supervisor orphaned)

### AC-4: Frontend shows error with discovery page option

**Given** the supervisor's login is blocked  
**When** the frontend auth callback receives the error  
**Then** the Dutch error message is displayed  
**And** the user is offered a link/button to continue as guest to the public discovery page  
**And** the user is **not** redirected to a blank dashboard

### AC-5: Session not created for blocked supervisors

**Given** a supervisor's login is blocked  
**When** the auth flow completes  
**Then** no session cookie or token is set  
**And** the supervisor is not counted as an authenticated user

### AC-6: Blocking check is efficient

**Given** the login check runs during OAuth callback  
**When** the check queries TypeDB  
**Then** the query is efficient (single read transaction, not multiple queries)

---

## Technical Notes

### Reusable code from Archive_Feature branch

[`ARCHIVING_REUSABLE_CODE.md` §7.1](../../ARCHIVING_REUSABLE_CODE.md) provides the auth service pattern (🟡 tier):

```python
# Current check — MUST BE REPLACED
if self.user_repo.is_supervisor_archived(user_id):
    raise ValueError("Supervisor account is archived")
```

[`ARCHIVING_REUSABLE_CODE.md` §7.2](../../ARCHIVING_REUSABLE_CODE.md) provides the replacement query pattern (🟡 tier):

```tql
-- New check: does supervisor have any active business?
match
    $s isa supervisor, has id ~id;
    $m isa manages (supervisor: $s, business: $b);
not { $b has archivedAt $x; };
fetch { 'has_active_business': true };
```

If this returns **no results**, the supervisor has no active businesses and should be blocked.

[`ARCHIVING_REUSABLE_CODE.md` §7.3](../../ARCHIVING_REUSABLE_CODE.md) provides the auth error redirect pattern (🟢 tier — directly reusable):

```python
except ValueError as e:
    request.session.clear()
    return RedirectResponse(
        url=f"{frontend_url}/auth/callback?error=auth_failed&message=" + URL_safe(str(e))
    )
```

[`ARCHIVING_REUSABLE_CODE.md` §7.4](../../ARCHIVING_REUSABLE_CODE.md) provides the frontend auth callback pattern (🟢 tier with modification):

```jsx
// Current — redirects to /
navigate('/', { replace: true });

// NEW — offer discovery page option
// Show error message and link to /discover or equivalent public page
```

### Risks

- **Risk**: The multi-business check query may have slight latency during login. This should be acceptable for an auth flow but should be monitored.
- **Edge case**: What if a supervisor's only business is archived while they have an active session? The spec does not explicitly require session termination. The supervisor would see an empty dashboard until their session expires. **Flag for team discussion.**

### Files likely affected

- [`projojo_backend/service/auth_service.py`](../../../projojo_backend/service/auth_service.py) — replace single-entity check with active-business query
- [`projojo_backend/domain/repositories/user_repository.py`](../../../projojo_backend/domain/repositories/user_repository.py) — replace `is_supervisor_archived` with `has_active_business`
- [`projojo_frontend/src/auth/AuthCallback.jsx`](../../../projojo_frontend/src/auth/AuthCallback.jsx) — add discovery page link option
