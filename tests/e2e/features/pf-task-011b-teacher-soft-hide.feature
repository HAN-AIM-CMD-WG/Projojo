@portfolio-curation @teacher-soft-hide
Feature: PF-task-011b teacher portfolio item soft-hide and precedence

  A teacher moderates portfolio evidence through the teacher soft-hide endpoint
  PATCH /portfolios/students/{student_id}/items/{item_id}/hide. Soft-hiding an item flips the
  teacher moderation channel (isHidden) and records who hid it and when, removing the item from
  every normal view (owner, teacher, supervisor, world-public) without deleting the completed-work
  evidence. Teacher hide takes precedence: a student's own show never clears a teacher hide. Only a
  teacher may soft-hide; students, supervisors, and unauthenticated callers are rejected and the
  item is left unchanged.

  # AC-1 — A teacher can soft-hide an item, and the hidden state records who hid it and when.

  @api @portfolio @pf-task-011b
  Scenario: AC-1 Teacher soft-hide hides the item and records moderation metadata
    When PF-task-011b the teacher soft-hides the "hide" item
    Then PF-task-011b the hide response should report the "hide" item as hidden by a teacher
    And PF-task-011b the hide response should record which teacher hid it and when

  @api @portfolio @pf-task-011b
  Scenario: AC-1 A teacher can soft-hide an already-retired item without deleting the evidence
    When PF-task-011b the teacher soft-hides the "retired" item
    Then PF-task-011b the hide response should report the "retired" item as hidden by a teacher
    And PF-task-011b the "retired" item should still be stored after the hide

  @api @portfolio @pf-task-011b
  Scenario: AC-1 A second teacher re-hiding overwrites the recorded moderator
    Given PF-task-011b the teacher soft-hides the "rehide" item
    When PF-task-011b the second teacher soft-hides the "rehide" item
    Then PF-task-011b the hide response should report the "rehide" item as hidden by a teacher
    And PF-task-011b the hide response should record the second teacher as the moderator who hid it

  # AC-2 — A teacher-hidden item is excluded from every normal view.

  @api @portfolio @pf-task-011b
  Scenario: AC-2 A teacher-hidden item is excluded from owner, teacher, supervisor, and world views
    Given PF-task-011b the "owner" view should include the "excluded" item
    And PF-task-011b the "related supervisor" view should include the "excluded" item
    And PF-task-011b the world-public page should include the "excluded" item
    When PF-task-011b the teacher soft-hides the "excluded" item
    Then PF-task-011b the "owner" view should exclude the "excluded" item
    And PF-task-011b the "teacher" view should exclude the "excluded" item
    And PF-task-011b the "related supervisor" view should exclude the "excluded" item
    And PF-task-011b the world-public page should exclude the "excluded" item

  # AC-3 — A student cannot unhide a teacher-hidden item; teacher-hide precedence is preserved.

  @api @portfolio @pf-task-011b
  Scenario: AC-3 A student show cannot override a teacher hide
    Given PF-task-011b the teacher soft-hides the "precedence" item
    When PF-task-011b the owner attempts to show the "precedence" item
    Then PF-task-011b the show attempt should return status 200
    And PF-task-011b the show response should report the "precedence" item as still hidden by a teacher
    And PF-task-011b the "owner" view should exclude the "precedence" item

  # AC-4 — Only a teacher may soft-hide; every other caller is denied and the item is unchanged.

  @api @portfolio @pf-task-011b
  Scenario: AC-4 A student cannot soft-hide an item
    When PF-task-011b a "student" attempts to soft-hide the "guard" item
    Then PF-task-011b the soft-hide attempt should be denied with status 403
    And PF-task-011b the "guard" item should still be shown to the owner

  @api @portfolio @pf-task-011b
  Scenario: AC-4 A supervisor cannot soft-hide an item
    When PF-task-011b a "related supervisor" attempts to soft-hide the "guard" item
    Then PF-task-011b the soft-hide attempt should be denied with status 403
    And PF-task-011b the "guard" item should still be shown to the owner

  @api @portfolio @pf-task-011b
  Scenario: AC-4 An unauthenticated caller cannot soft-hide an item
    When PF-task-011b an unauthenticated caller attempts to soft-hide the "guard" item
    Then PF-task-011b the soft-hide attempt should be denied with status 401
    And PF-task-011b the "guard" item should still be shown to the owner

  @api @portfolio @pf-task-011b
  Scenario: AC-4 A teacher cannot soft-hide an item that does not belong to the named student
    When PF-task-011b the teacher attempts to soft-hide the "guard" item under a different student
    Then PF-task-011b the soft-hide attempt should be denied with status 404
    And PF-task-011b the "guard" item should still be shown to the owner

  # AC-5 — A soft-hide never hard-deletes the evidence; the item stays stored, just excluded.

  @api @portfolio @pf-task-011b
  Scenario: AC-5 Soft-hide keeps the item stored rather than deleting it
    When PF-task-011b the teacher soft-hides the "persist" item
    Then PF-task-011b the hide response should report the "persist" item as hidden by a teacher
    And PF-task-011b the "persist" item should still be stored after the hide

  @api @portfolio @pf-task-011b
  Scenario: AC-5 Teacher moderation exposes no item delete endpoint
    Then PF-task-011b a DELETE request to the "persist" hide endpoint should be rejected with status 405
