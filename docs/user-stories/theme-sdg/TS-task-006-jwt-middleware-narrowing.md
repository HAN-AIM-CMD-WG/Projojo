# TS-task-006 — Narrow JWT Middleware Exclusion for Theme Routes

**Phase**: 1 — Backend & Data Integrity  
**Priority**: 🟡 Medium  
**Type**: Non-functional Task (Security)  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §4.5](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §1.6](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: None  

---

## Task Story

As a **platform administrator**,  
I want the JWT middleware to only skip authentication for public GET requests on theme endpoints,  
so that write operations (POST, PUT, DELETE) are consistently protected by both middleware and route-level auth.

---

## Acceptance Criteria

### AC-1: GET /themes/ remains public

**Given** a request without a JWT token  
**When** `GET /themes/` is called  
**Then** the response returns the list of themes (HTTP 200)  
**And** the JWT middleware does not block the request

### AC-2: GET /themes/{id} remains public

**Given** a request without a JWT token  
**When** `GET /themes/{theme_id}` is called  
**Then** the response returns the theme (HTTP 200) or 404 for unknown IDs

### AC-3: GET /themes/project/{id} remains public

**Given** a request without a JWT token  
**When** `GET /themes/project/{project_id}` is called  
**Then** the response returns the project's themes (HTTP 200)

### AC-4: POST /themes/ requires authentication at middleware level

**Given** a request without a JWT token  
**When** `POST /themes/` is called  
**Then** the JWT middleware sets `request.state.user_role = None`  
**And** the `@auth(role="teacher")` decorator rejects the request

### AC-5: PUT /themes/{id} requires authentication at middleware level

**Given** a request without a JWT token  
**When** `PUT /themes/{theme_id}` is called  
**Then** the middleware processes the JWT (finds none)  
**And** the route-level auth rejects the request

### AC-6: DELETE /themes/{id} requires authentication at middleware level

**Given** a request without a JWT token  
**When** `DELETE /themes/{theme_id}` is called  
**Then** the request is rejected before reaching the route handler

### AC-7: PUT /themes/project/{id} requires authentication at middleware level

**Given** a request without a JWT token  
**When** `PUT /themes/project/{project_id}` is called  
**Then** the middleware processes the JWT  
**And** route-level `Depends(get_token_payload)` rejects the request

---

## Technical Notes

- **File**: [`projojo_backend/auth/jwt_middleware.py:22-23`](../../../projojo_backend/auth/jwt_middleware.py:22)
- **Current exclusion** (overly broad):
  ```python
  "/themes",  # List all themes (public)
  "/themes/*",  # Get specific theme (public for GET)
  ```
- **Options for fix**:
  1. Add method check in the middleware dispatch: if path matches `/themes*` AND `request.method != "GET"`, do NOT skip JWT validation
  2. Replace wildcard with specific public GET paths only
- The `@auth(role="teacher")` decorator on CRUD routes already does its own JWT validation as a safety net, but relying on two independent validation paths is fragile
- **Mitigating factor**: Route-level auth catches unauthenticated requests regardless, so this is a defense-in-depth improvement
