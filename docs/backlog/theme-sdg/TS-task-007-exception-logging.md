# TS-task-007 — Replace Silent Exception Swallowing with Logging

**Phase**: 1 — Backend & Data Integrity  
**Priority**: 🟡 Medium  
**Type**: Technical Task (Observability)  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §4.6](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §1.7](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: None  

---

## Task Story

As a **developer**,  
I want theme operation failures to be logged instead of silently swallowed,  
so that I can diagnose issues in the theme system without adding debugging code.

---

## Acceptance Criteria

### AC-1: Theme delete cascade logs warnings

**Given** the [`ThemeRepository.delete()`](../../../projojo_backend/domain/repositories/theme_repository.py:141) method  
**When** deleting hasTheme relations before the theme entity fails unexpectedly  
**Then** a warning is logged with the exception details  
**And** the delete operation continues (attempting to delete the theme entity)

### AC-2: No-relations-to-delete is not a warning

**Given** a theme with no linked projects  
**When** the hasTheme deletion step executes (returns no results)  
**Then** no warning is logged (this is expected behavior)  
**And** the theme entity deletion proceeds normally

### AC-3: Link operation delete-phase logs warnings

**Given** the [`link_project_to_themes()`](../../../projojo_backend/domain/repositories/theme_repository.py:183) method  
**When** deleting existing theme links fails unexpectedly  
**Then** a warning is logged with the exception details  
**And** the operation behavior follows the atomic linking pattern (see [TS-task-005](TS-task-005-atomic-theme-linking.md))

### AC-4: Log format includes context

**Given** any logged warning in theme operations  
**When** the log entry is written  
**Then** it includes the operation name, the relevant entity ID (theme_id or project_id), and the exception message  
**Example**: `"Theme delete warning (theme_id=theme-duurzaamheid): [exception details]"`

---

## Technical Notes

- **Files to change**:
  - [`theme_repository.py:150-153`](../../../projojo_backend/domain/repositories/theme_repository.py:150) — `delete()` method: `except Exception: pass`
  - [`theme_repository.py:193-196`](../../../projojo_backend/domain/repositories/theme_repository.py:193) — `link_project_to_themes()`: `except Exception: pass`
- **Replace with**: `except Exception as e: logger.warning(f"Theme operation warning: {e}")`
- Distinguish between "no relations to delete" (expected, can be debug-level or silent) and actual database/connection failures (warning-level)
- Use Python's standard `logging` module, consistent with the rest of the backend
