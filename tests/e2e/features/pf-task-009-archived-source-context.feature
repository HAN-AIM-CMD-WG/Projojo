Feature: PF-task-009 archived-source portfolio context and disabled navigation

  When a portfolio item's source project, task, or business is archived, the
  completed evidence must stay visible under the normal visibility rules. The
  authenticated read model states which source level is archived and whether the
  source is still navigable, and it supplies user-facing copy that explains the
  source is archived while the completed work remains visible. Archiving is a
  reversible operational state: restoring a source keeps the same portfolio item
  and only changes the archived-source context and navigation availability.

  # AC-1 — An archived source never hides or retires the portfolio item; normal
  # portfolio visibility rules still apply for every permitted viewer.

  @api @portfolio @pf-task-009
  Scenario: AC-1 The owner student keeps the archived-source item as live evidence
    Given I am authenticated as the PF-task-009 portfolio owner student
    When I request the PF-task-009 authenticated portfolio for the seeded portfolio student
    Then the latest PF-task-009 API response status should be 200
    And the PF-task-009 portfolio should include the "archived-source" item
    And the PF-task-009 "archived-source" item should not be retired

  @api @portfolio @pf-task-009
  Scenario: AC-1 An archived source does not remove the item from the related supervisor view
    Given I am authenticated as the PF-task-009 portfolio related supervisor
    When I request the PF-task-009 authenticated portfolio for the seeded portfolio student
    Then the latest PF-task-009 API response status should be 200
    And the PF-task-009 portfolio should include the "archived-source" item

  # AC-2 — The response names which source level is archived so the frontend never
  # has to infer archive state from live project queries.

  @api @portfolio @pf-task-009
  Scenario: AC-2 The API labels which source levels are archived
    Given the PF-task-009 archived-source project starts archived
    And I am authenticated as the PF-task-009 portfolio teacher
    When I request the PF-task-009 authenticated portfolio for the seeded portfolio student
    Then the latest PF-task-009 API response status should be 200
    And the PF-task-009 "archived-source" item should report archived source "project" as true
    And the PF-task-009 "archived-source" item should report archived source "business" as true
    And the PF-task-009 "archived-source" item should report archived source "task" as false
    And the PF-task-009 "active-source" item should report archived source "project" as false
    And the PF-task-009 "active-source" item should report archived source "business" as false

  # AC-3 — Source navigation availability is explicit for both archived and active sources.

  @api @portfolio @pf-task-009
  Scenario: AC-3 Source navigation availability is explicit per item
    Given the PF-task-009 archived-source project starts archived
    And I am authenticated as the PF-task-009 portfolio teacher
    When I request the PF-task-009 authenticated portfolio for the seeded portfolio student
    Then the latest PF-task-009 API response status should be 200
    And the PF-task-009 "archived-source" item source navigation state should be "disabled"
    And the PF-task-009 "archived-source" item should carry a non-empty source navigation reason
    And the PF-task-009 "active-source" item source navigation state should be "enabled"

  # AC-4 — Explanatory copy uses archived semantics, never deletion or snapshot wording.

  @api @portfolio @pf-task-009
  Scenario: AC-4 Archived-source navigation copy avoids deleted and snapshot wording
    Given the PF-task-009 archived-source project starts archived
    And I am authenticated as the PF-task-009 portfolio teacher
    When I request the PF-task-009 authenticated portfolio for the seeded portfolio student
    Then the latest PF-task-009 API response status should be 200
    And the PF-task-009 "archived-source" item source navigation reason should mention that the source is archived
    And the PF-task-009 "archived-source" item source navigation reason should state that completed work stays visible
    And the PF-task-009 "archived-source" item source navigation reason should not use deletion or snapshot wording

  # AC-5 — Restoring a source keeps the same portfolio item; only archived-source
  # context and navigation availability change.

  @api @portfolio @pf-task-009
  Scenario: AC-5 Restoring the archived source keeps the same item and only changes its context
    Given the PF-task-009 archived-source project starts archived
    And I am authenticated as the PF-task-009 portfolio teacher
    When I restore the PF-task-009 archived-source project
    And I request the PF-task-009 authenticated portfolio for the seeded portfolio student
    Then the latest PF-task-009 API response status should be 200
    And the PF-task-009 portfolio should include the "archived-source" item
    And the PF-task-009 "archived-source" item should report archived source "project" as false
    And the PF-task-009 "archived-source" item source navigation state should be "enabled"
    When I archive the PF-task-009 archived-source project again
    And I request the PF-task-009 authenticated portfolio for the seeded portfolio student
    Then the latest PF-task-009 API response status should be 200
    And the PF-task-009 portfolio should include the "archived-source" item
    And the PF-task-009 "archived-source" item should report archived source "project" as true
    And the PF-task-009 "archived-source" item source navigation state should be "disabled"
