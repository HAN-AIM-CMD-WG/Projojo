# TS-task-002 — Fix Project Deletion Cascade for hasTheme Relations

**Phase**: 1 — Backend & Data Integrity  
**Priority**: 🔴 High  
**Type**: Technical Task (Bug Fix)  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §3A](../../THEME_SDG_SYSTEM_AUDIT.md), [§8 Confirmed Problems](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §1.2](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: None  

---

## Task Story

As a **docent** (teacher),  
I want project hard deletion to succeed even when the project has theme links,  
so that I can fully remove projects without encountering database errors.

---

## Acceptance Criteria

### AC-1: hasTheme relations deleted before project deletion

**Given** a project with 3 linked themes  
**When** a teacher triggers hard deletion of that project  
**Then** all 3 `hasTheme` relations for that project are deleted before the project entity itself  
**And** the project deletion completes successfully

### AC-2: Deletion succeeds for projects without themes

**Given** a project with no linked themes  
**When** a teacher triggers hard deletion of that project  
**Then** the hasTheme cleanup step executes without error (no-op)  
**And** the remaining 7 deletion steps proceed normally

### AC-3: No orphaned hasTheme relations remain

**Given** a project "SmartFarm Sensor Network" linked to themes "Duurzaamheid" and "Innovatie & Technologie"  
**When** the project is hard-deleted  
**Then** querying `hasTheme` relations for that project ID returns zero results  
**And** both themes "Duurzaamheid" and "Innovatie & Technologie" still exist in the theme catalog

### AC-4: Existing cascade steps unaffected

**Given** the project deletion cascade with existing steps (registrations → requiresSkill → containsTask → tasks → creates → hasProjects → project)  
**When** the hasTheme cleanup step is added  
**Then** all existing deletion steps continue to function identically  
**And** the hasTheme step executes between step 6 (hasProjects) and step 7 (project entity)

---

## Technical Notes

- **File**: [`projojo_backend/domain/repositories/project_repository.py:677`](../../../projojo_backend/domain/repositories/project_repository.py:677) — the 7-step `delete_project()` method
- **Insert new step 6.5** — add hasTheme relation deletion query:
  ```python
  delete_themes = """
      match
          $project isa project, has id ~project_id;
          $hasTheme isa hasTheme(project: $project);
      delete
          $hasTheme isa hasTheme;
  """
  ```
- **Root cause**: TypeDB prevents deleting an entity that is still a role player in a relation with `@card(1)` constraint — [`hasTheme`](../../../projojo_backend/db/schema.tql:158) has `relates project @card(1)`
- The existing [`ThemeRepository.delete()`](../../../projojo_backend/domain/repositories/theme_repository.py:141) already handles the reverse case (theme deletion cascading to hasTheme), confirming the pattern works
