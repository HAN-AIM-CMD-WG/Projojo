# ARCH-task-005 — Edit-Locking and Mutation Blocking for Archived Entities

**User Story**: [ARCH-story-001 — Archiving Foundations](ARCH-story-001-archiving-foundations.md)  
**Priority**: 🔴 Critical  
**Type**: Non-functional Task  
**Spec references**: [§3.6](../../ARCHIVING_SPECIFICATION.md)  
**Dependencies**: [ARCH-task-001](ARCH-task-001-schema-migration.md), [ARCH-task-002](ARCH-task-002-domain-models-datetime.md)

---

## Task Story

As a **teacher**,  
I want the system to prevent any edits to archived entities or children of archived entities,  
so that archived data remains immutable and the archive audit trail is trustworthy.

---

## Context: What Must Change and Why

The current codebase has **no mutation blocking based on archive state**. Any entity can be updated regardless of whether it or its parent is archived. The specification (§3.6) requires a complete edit-locking matrix where mutations are blocked when the entity itself is archived or when any ancestor in its hierarchy is archived.

This is not allowed to stay conceptual — the spec explicitly states: "The implementation must audit actual route handlers and repositories against this matrix."

---

## Acceptance Criteria

### AC-1: Cannot update business details when business is archived

**Given** a business is archived  
**When** a request is made to update the business (name, description, location, image)  
**Then** the backend rejects the request with an appropriate error  
**And** the response indicates that the entity is archived and cannot be modified

### AC-2: Cannot create a project under an archived business

**Given** a business is archived  
**When** a request is made to create a new project under that business  
**Then** the backend rejects the request  
**And** the response explains that the parent business is archived

### AC-3: Cannot update project when project is archived

**Given** a project is archived (directly or because its parent business is archived)  
**When** a request is made to update the project details  
**Then** the backend rejects the request

### AC-4: Cannot set project visibility when project or parent business is archived

**Given** a project or its parent business is archived  
**When** a request is made to change the project's visibility setting  
**Then** the backend rejects the request

### AC-5: Cannot set project impact summary when project or parent business is archived

**Given** a project or its parent business is archived  
**When** a request is made to set the project's impact summary  
**Then** the backend rejects the request

### AC-6: Cannot create a task under an archived project

**Given** a project is archived (directly or via parent business)  
**When** a request is made to create a new task under that project  
**Then** the backend rejects the request

### AC-7: Cannot update task details when task or any ancestor is archived

**Given** a task is archived, or its parent project is archived, or its grandparent business is archived  
**When** a request is made to update the task details or skills  
**Then** the backend rejects the request

### AC-8: Cannot create a registration for an archived task or archived ancestor

**Given** a task or any of its ancestors is archived  
**When** a student attempts to register for the task  
**Then** the backend rejects the registration  
**And** the error indicates the task is not available

### AC-9: Cannot cancel a registration when registration or ancestor is archived

**Given** a registration is archived, or the task/project/business above it is archived  
**When** a request is made to cancel the registration  
**Then** the backend rejects the request

### AC-10: Cannot accept or reject a registration when registration or ancestor is archived

**Given** a registration is archived, or the task/project/business above it is archived  
**When** a supervisor or teacher attempts to accept or reject the registration  
**Then** the backend rejects the request

### AC-11: Error responses are consistent and informative

**Given** any mutation is blocked due to archive state
**When** the backend returns an error
**Then** the HTTP status is `409 Conflict` (indicating the request conflicts with the current state of the resource — distinct from `422` which is for body validation errors)
**And** the error message is in Dutch and identifies which entity is archived
**And** the error message distinguishes between "this entity is archived" and "a parent of this entity is archived"

### AC-12: Frontend disables mutation actions for archived entities

**Given** the frontend displays an entity that is part of an archived hierarchy  
**When** the UI renders action buttons (edit, create child, register)  
**Then** the buttons are disabled or hidden for archived entities  
**And** the frontend avoids sending obviously invalid mutation requests

---

## Technical Notes

### Mutation lock matrix (spec §3.6)

| Mutation Surface | Block Condition |
|---|---|
| Update business details | Business archived |
| Create project under business | Business archived |
| Update project details | Project archived OR parent business archived |
| Set project visibility | Project archived OR parent business archived |
| Set project impact summary | Project archived OR parent business archived |
| Create task under project | Project archived OR parent business archived |
| Update task details | Task archived OR any archived ancestor |
| Update task skills | Task archived OR any archived ancestor |
| Create registration | Task archived OR any archived ancestor |
| Cancel registration | Registration archived OR any archived ancestor |
| Accept/reject registration | Registration archived OR any archived ancestor |

### Implementation approach

The most maintainable approach is a **shared guard function** at the repository or service layer:

```python
def check_not_archived(entity_type: str, entity_id: str) -> None:
    """Raises if entity or any ancestor is archived."""
    # Check entity itself
    # Check parent chain up to business
    # Raise HTTPException(409) with Dutch message if archived
```

This guard should be called at the start of every mutation endpoint before any write operation.

### Archive state detection for parents

To check whether a parent chain is archived, the guard function needs TypeQL queries that traverse upward:
- Task → Project → Business
- Registration → Task → Project → Business

These can be efficient single-hop queries since archive state is on each level.

### Risks

- **Risk**: This is a broad audit of every mutation endpoint. It is easy to miss one. The implementation should include a verification step that lists all `POST`, `PUT`, `PATCH` handlers and confirms each one has an archive guard where needed.
- **Risk**: Performance — every mutation now needs an additional read query to check archive state. These should be lightweight single-entity checks.
- **Resolved**: HTTP `409 Conflict` is used for all archive lock violations. `409` means "the request conflicts with the current state of the resource," which precisely describes editing an archived entity. `422` is reserved for body validation errors.

### Files likely affected

- All files in [`projojo_backend/routes/`](../../../projojo_backend/routes/) — each mutation endpoint
- New shared utility (e.g., `projojo_backend/service/archive_guard.py` or integrated into repository layer)
- Frontend components that render edit/create/register actions: [`BusinessCard.jsx`](../../../projojo_frontend/src/components/BusinessCard.jsx), [`ProjectDetails.jsx`](../../../projojo_frontend/src/components/ProjectDetails.jsx), [`Task.jsx`](../../../projojo_frontend/src/components/Task.jsx), registration-related components
