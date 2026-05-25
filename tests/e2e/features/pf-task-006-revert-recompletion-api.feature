Feature: PF-task-006 revert completion, revert start, and re-completion behavior

  Background:
    Given the PF-task-006 lifecycle fixtures are reset

  @api @portfolio @pf-task-006
  Scenario: Revert completion returns the registration to started and hides retired evidence
    Given I am authenticated as the PF-task-006 portfolio teacher
    And I remember unique PF-task-006 review text as "first review"
    When I complete the PF-task-006 registration "startedForCompletion" with remembered review text "first review", accepted notice, and rating 5
    Then the latest PF-task-006 API response status should be 200
    And the PF-task-006 response should include a new portfolio item id as "first item"
    And the PF-task-006 portfolio item "first item" should be visible to the portfolio owner student
    And the PF-task-006 portfolio item "first item" should be visible to the portfolio teacher
    And the PF-task-006 portfolio item "first item" should be visible to the related portfolio supervisor
    And I make the PF-task-006 portfolio item "first item" visible in the public portfolio read model
    And the PF-task-006 public portfolio view should expose portfolio item "first item"
    When I request PF-task-006 lifecycle action "revert-completion" for "startedForCompletion"
    Then the latest PF-task-006 API response status should be 200
    And the PF-task-006 lifecycle state for "startedForCompletion" should be started but not completed
    And the PF-task-006 portfolio item "first item" should be retired
    And remembered PF-task-006 review text "first review" with rating 5 should remain persisted on retired portfolio item "first item"
    And the PF-task-006 portfolio item "first item" should be absent from normal views for the portfolio owner student
    And the PF-task-006 portfolio item "first item" should be absent from normal views for the portfolio teacher
    And the PF-task-006 portfolio item "first item" should be absent from normal views for the related portfolio supervisor
    And remembered PF-task-006 review text "first review" should be absent from normal portfolio views
    And the PF-task-006 public portfolio view should not expose portfolio item "first item"

  @api @portfolio @pf-task-006
  Scenario Outline: Revert completion is rejected before completion and does not change evidence
    Given I am authenticated as the PF-task-006 portfolio teacher
    And I remember the PF-task-006 side effects for "<fixture>"
    When I request PF-task-006 lifecycle action "revert-completion" for "<fixture>"
    Then the latest PF-task-006 API response status should be 400
    And the PF-task-006 side effects for "<fixture>" should be unchanged

    Examples:
      | fixture              |
      | pendingStartRejected |
      | acceptedForStart     |
      | startedForRevert     |

  @api @portfolio @pf-task-006
  Scenario: Revert start returns a started registration to accepted and rejects completed registrations
    Given I am authenticated as the PF-task-006 portfolio teacher
    When I request PF-task-006 lifecycle action "revert-start" for "startedForRevert"
    Then the latest PF-task-006 API response status should be 200
    And the PF-task-006 lifecycle state for "startedForRevert" should be accepted but not started or completed
    And no PF-task-006 portfolio evidence should exist for "startedForRevert"
    Given I remember the PF-task-006 side effects for "completedStartRejected"
    When I request PF-task-006 lifecycle action "revert-start" for "completedStartRejected"
    Then the latest PF-task-006 API response status should be 400
    And the PF-task-006 side effects for "completedStartRejected" should be unchanged

  @api @portfolio @pf-task-006
  Scenario: Re-completion creates a new item while retired evidence remains excluded
    Given I am authenticated as the PF-task-006 portfolio teacher
    And I remember unique PF-task-006 review text as "first review"
    When I complete the PF-task-006 registration "startedForCompletion" with remembered review text "first review", accepted notice, and rating 5
    Then the latest PF-task-006 API response status should be 200
    And the PF-task-006 response should include a new portfolio item id as "first item"
    And I make the PF-task-006 portfolio item "first item" visible in the public portfolio read model
    And the PF-task-006 public portfolio view should expose portfolio item "first item"
    When I request PF-task-006 lifecycle action "revert-completion" for "startedForCompletion"
    Then the latest PF-task-006 API response status should be 200
    And I remember unique PF-task-006 review text as "second review"
    When I complete the PF-task-006 registration "startedForCompletion" with remembered review text "second review", accepted notice, and rating 4
    Then the latest PF-task-006 API response status should be 200
    And the PF-task-006 response should include a new portfolio item id as "second item"
    And PF-task-006 portfolio item "second item" should be different from "first item"
    And the PF-task-006 portfolio item "first item" should be retired
    And the PF-task-006 portfolio item "second item" should be active
    And remembered PF-task-006 review text "first review" with rating 5 should remain persisted on retired portfolio item "first item"
    And the PF-task-006 portfolio item "first item" should be absent from normal views for the portfolio owner student
    And the PF-task-006 portfolio item "first item" should be absent from normal views for the portfolio teacher
    And the PF-task-006 portfolio item "first item" should be absent from normal views for the related portfolio supervisor
    And the PF-task-006 portfolio item "second item" should be visible to the portfolio teacher
    And remembered PF-task-006 review text "second review" should be visible on portfolio item "second item"
    And remembered PF-task-006 review text "first review" should be absent from normal portfolio views
    And the PF-task-006 public portfolio view should not expose portfolio item "first item"

  @api @portfolio @pf-task-006
  Scenario: Supervisor re-completion requires explicit new review text instead of implicit reuse
    Given I am authenticated as the PF-task-006 related portfolio supervisor
    And I remember unique PF-task-006 review text as "supervisor original review"
    When I complete the PF-task-006 registration "supervisorCompletionAllowed" with remembered review text "supervisor original review", accepted notice, and rating 5
    Then the latest PF-task-006 API response status should be 200
    And the PF-task-006 response should include a new portfolio item id as "supervisor first item"
    When I request PF-task-006 lifecycle action "revert-completion" for "supervisorCompletionAllowed"
    Then the latest PF-task-006 API response status should be 200
    When I complete the PF-task-006 registration "supervisorCompletionAllowed" without review text
    Then the latest PF-task-006 API response status should be 400
    And the PF-task-006 lifecycle state for "supervisorCompletionAllowed" should be started but not completed
    And no active PF-task-006 portfolio item should exist for "supervisorCompletionAllowed"
    And the PF-task-006 portfolio item "supervisor first item" should be retired
    And remembered PF-task-006 review text "supervisor original review" with rating 5 should remain persisted on retired portfolio item "supervisor first item"
    And remembered PF-task-006 review text "supervisor original review" should be absent from normal portfolio views

  @api @portfolio @pf-task-006
  Scenario: Reverting a re-completed registration preserves earlier retirement audit data
    Given I am authenticated as the PF-task-006 portfolio teacher
    And I remember unique PF-task-006 review text as "first review"
    When I complete the PF-task-006 registration "startedForCompletion" with remembered review text "first review", accepted notice, and rating 5
    Then the latest PF-task-006 API response status should be 200
    And the PF-task-006 response should include a new portfolio item id as "first item"
    When I request PF-task-006 lifecycle action "revert-completion" for "startedForCompletion"
    Then the latest PF-task-006 API response status should be 200
    And I remember the PF-task-006 retirement timestamp for portfolio item "first item"
    And I remember unique PF-task-006 review text as "second review"
    When I complete the PF-task-006 registration "startedForCompletion" with remembered review text "second review", accepted notice, and rating 4
    Then the latest PF-task-006 API response status should be 200
    And the PF-task-006 response should include a new portfolio item id as "second item"
    When I request PF-task-006 lifecycle action "revert-completion" for "startedForCompletion"
    Then the latest PF-task-006 API response status should be 200
    And the PF-task-006 portfolio item "first item" should keep its remembered retirement timestamp
    And the PF-task-006 portfolio item "second item" should be retired
    And no active PF-task-006 portfolio item should exist for "startedForCompletion"
