@portfolio-visibility @authenticated-public-retraction
Feature: PF-task-007c student authenticated-public retraction API

  A student owner controls whether otherwise-eligible completed work is shown to
  relationship-gated supervisors. Retraction is a backend-enforced curation control:
  when the owner retracts an item, related supervisors stop seeing it while the owner
  and teachers keep their private view. Restoring the retraction returns the item to
  supervisor visibility only when the other authenticated-public rules (not hidden,
  not retired, rating gate) still pass. Only the owner may change this state, and the
  authenticated-public retraction is independent from world-public selection.

  # AC-1 — Student can retract authenticated-public visibility.

  @api @portfolio @pf-task-007c
  Scenario: AC-1 Retracting an eligible item removes it from the related supervisor view only
    Given PF-task-007c the owner student sets the "retractable" item authenticated-public retraction to "off"
    When PF-task-007c the owner student sets the "retractable" item authenticated-public retraction to "on"
    Then the PF-task-007c mutation response should report the "retractable" item as authenticated-public retracted
    And the PF-task-007c "related supervisor" view should exclude the "retractable" item
    And the PF-task-007c "owner student" view should include the "retractable" item
    And the PF-task-007c "teacher" view should include the "retractable" item

  # AC-2 — Student can restore authenticated-public visibility.

  @api @portfolio @pf-task-007c
  Scenario: AC-2 Restoring a retracted item returns it to the related supervisor view
    Given PF-task-007c the owner student sets the "restorable" item authenticated-public retraction to "on"
    And the PF-task-007c "related supervisor" view should exclude the "restorable" item
    When PF-task-007c the owner student sets the "restorable" item authenticated-public retraction to "off"
    Then the PF-task-007c mutation response should report the "restorable" item as not authenticated-public retracted
    And the PF-task-007c "related supervisor" view should include the "restorable" item

  # AC-2 — Restoration only re-exposes the item when the rating rules also pass.

  @api @portfolio @pf-task-007c
  Scenario: AC-2 Restoring a low-rated item keeps it hidden from the supervisor because rating rules still fail
    Given PF-task-007c the owner student sets the "restorable-low-rated" item authenticated-public retraction to "on"
    When PF-task-007c the owner student sets the "restorable-low-rated" item authenticated-public retraction to "off"
    Then the PF-task-007c mutation response should report the "restorable-low-rated" item as not authenticated-public retracted
    And the PF-task-007c "related supervisor" view should exclude the "restorable-low-rated" item
    And the PF-task-007c "owner student" view should include the "restorable-low-rated" item
    And the PF-task-007c "teacher" view should include the "restorable-low-rated" item

  # AC-3 — Unauthorized retraction changes are denied and leave the item unchanged.

  @api @portfolio @pf-task-007c
  Scenario: AC-3 A teacher cannot change a student's authenticated-public retraction state
    When PF-task-007c a "teacher" attempts to set the "guard" item authenticated-public retraction to "on"
    Then the PF-task-007c mutation attempt should be denied with status 403
    And the PF-task-007c "guard" item authenticated-public retraction should still be "off"

  @api @portfolio @pf-task-007c
  Scenario: AC-3 A related supervisor cannot change a student's authenticated-public retraction state
    When PF-task-007c a "related supervisor" attempts to set the "guard" item authenticated-public retraction to "on"
    Then the PF-task-007c mutation attempt should be denied with status 403
    And the PF-task-007c "guard" item authenticated-public retraction should still be "off"

  @api @portfolio @pf-task-007c
  Scenario: AC-3 Another student cannot change someone else's authenticated-public retraction state
    When PF-task-007c a "other student" attempts to set the "guard" item authenticated-public retraction to "on"
    Then the PF-task-007c mutation attempt should be denied with status 404
    And the PF-task-007c "guard" item authenticated-public retraction should still be "off"

  @api @portfolio @pf-task-007c
  Scenario: AC-3 An unauthenticated caller cannot change authenticated-public retraction state
    When PF-task-007c an unauthenticated caller attempts to set the "guard" item authenticated-public retraction to "on"
    Then the PF-task-007c mutation attempt should be denied with status 401
    And the PF-task-007c "guard" item authenticated-public retraction should still be "off"

  # AC-4 — Retraction is independent from world-public selection.

  @api @portfolio @pf-task-007c
  Scenario: AC-4 Retracting a world-visible item leaves its world-public state and output unchanged
    Given PF-task-007c the owner student sets the "retractable" item authenticated-public retraction to "off"
    When PF-task-007c the owner student sets the "retractable" item authenticated-public retraction to "on"
    Then the PF-task-007c mutation response should report the "retractable" item as authenticated-public retracted
    And the PF-task-007c mutation response should report the "retractable" item as world-visible
    And the PF-task-007c "owner student" view should show the "retractable" item as world-visible
    And the PF-task-007c public portfolio page should include the "retractable" item
