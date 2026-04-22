# TS-005 — Make Project-Theme Linking Atomic

**Phase**: 1 — Backend & Data Integrity  
**Priority**: 🟠 Medium-High  
**Type**: Technical Story  
**Audit reference**: [THEME_SDG_SYSTEM_AUDIT.md §4.4](../../THEME_SDG_SYSTEM_AUDIT.md)  
**Plan reference**: [THEME_SDG_IMPLEMENTATION_PLAN.md §1.5](../../THEME_SDG_IMPLEMENTATION_PLAN.md)  
**Dependencies**: None  

---

## User Story

As a **begeleider** (supervisor),  
I want theme linking to either fully succeed or fully fail,  
so that my project never ends up in a partially linked state with missing themes.

---

## Acceptance Criteria

### AC-1: All-or-nothing linking

**Given** a project linked to themes A and B  
**When** a supervisor replaces the links with themes C, D, and E  
**Then** either all 3 new links are created (and old ones removed) or none of the changes are applied

### AC-2: Failure during insert rolls back delete

**Given** a project linked to themes A and B  
**When** the linking operation is called with themes C and an invalid theme ID "nonexistent"  
**And** the insert for "nonexistent" would fail  
**Then** the original links to A and B remain intact  
**And** no partial links to C exist

### AC-3: Empty array clears all themes atomically

**Given** a project linked to themes A and B  
**When** the linking operation is called with `theme_ids = []`  
**Then** all existing theme links are removed in a single atomic operation  
**And** the response confirms success

### AC-4: Single theme link succeeds atomically

**Given** a project with no theme links  
**When** the linking operation is called with `theme_ids = ["theme-duurzaamheid"]`  
**Then** the single link is created successfully  
**And** the response confirms the linking

---

## Technical Notes

- **File**: [`projojo_backend/domain/repositories/theme_repository.py:183-210`](../../../projojo_backend/domain/repositories/theme_repository.py:183)
- **Current behavior**: Deletes all existing links in one transaction (`Db.write_transact`), then inserts new links one-by-one in **separate** transactions via a `for` loop at [line 199](../../../projojo_backend/domain/repositories/theme_repository.py:199)
- **Fix**: Combine delete-all + insert-all into a single write transaction. Either:
  - Build a single TypeQL query with delete + insert (if TypeDB supports it)
  - Or wrap both operations in a single transaction context: `begin → delete → insert → commit`
- The current non-atomic approach means if the process fails after deleting old links but before all new inserts, the project is left with fewer themes than intended
