Feature: PF-task-004 registration lifecycle API authorization and state machine

  Background:
    Given the PF-task-004 lifecycle fixtures are reset

  @api @portfolio @pf-task-004
  Scenario: Teacher starts an accepted registration exactly once
    Given I am authenticated as the PF-task-004 portfolio teacher
    And I remember the PF-task-004 lifecycle state for "acceptedForStart"
    When I request PF-task-004 lifecycle action "start" for "acceptedForStart"
    Then the latest PF-task-004 API response status should be 200
    And the PF-task-004 lifecycle state for "acceptedForStart" should have a started timestamp
    And the PF-task-004 lifecycle state for "acceptedForStart" should not have a completed timestamp
    And I remember the PF-task-004 lifecycle state for "acceptedForStart"
    When I request PF-task-004 lifecycle action "start" for "acceptedForStart"
    Then the latest PF-task-004 API response status should be 400
    And the PF-task-004 lifecycle state for "acceptedForStart" should keep its remembered timestamps

  @api @portfolio @pf-task-004
  Scenario Outline: Start is rejected outside the accepted-not-started state
    Given I am authenticated as the PF-task-004 portfolio teacher
    And I remember the PF-task-004 lifecycle state for "<fixture>"
    When I request PF-task-004 lifecycle action "start" for "<fixture>"
    Then the latest PF-task-004 API response status should be 400
    And the PF-task-004 lifecycle state for "<fixture>" should keep its remembered timestamps

    Examples:
      | fixture                |
      | pendingStartRejected   |
      | rejectedStartRejected  |
      | startedStartRejected   |
      | completedStartRejected |

  @api @portfolio @pf-task-004
  Scenario: Completion before start is rejected without portfolio side effects
    Given I am authenticated as the PF-task-004 portfolio teacher
    And I remember the PF-task-004 lifecycle state for "acceptedCompletionRejected"
    When I request PF-task-004 lifecycle action "complete" for "acceptedCompletionRejected"
    Then the latest PF-task-004 API response status should be 400
    And the PF-task-004 lifecycle state for "acceptedCompletionRejected" should keep its remembered timestamps
    And no PF-task-004 portfolio evidence should exist for "acceptedCompletionRejected"

  @api @portfolio @pf-task-004
  Scenario: Teacher completes a started registration without business ownership
    Given I am authenticated as the PF-task-004 portfolio teacher
    When I request PF-task-004 lifecycle action "complete" for "startedForCompletion"
    Then the latest PF-task-004 API response status should be 200
    And the PF-task-004 lifecycle state for "startedForCompletion" should have a completed timestamp

  @api @portfolio @pf-task-004
  Scenario: Related supervisor can mutate lifecycle state for their business
    Given I am authenticated as the PF-task-004 related portfolio supervisor
    When I request PF-task-004 lifecycle action "start" for "supervisorStartAllowed"
    Then the latest PF-task-004 API response status should be 200
    And the PF-task-004 lifecycle state for "supervisorStartAllowed" should have a started timestamp
    When I request PF-task-004 lifecycle action "complete" for "supervisorCompletionAllowed"
    Then the latest PF-task-004 API response status should be 200
    And the PF-task-004 lifecycle state for "supervisorCompletionAllowed" should have a completed timestamp

  @api @portfolio @pf-task-004
  Scenario: Related supervisor can revert valid lifecycle states for their business
    Given I am authenticated as the PF-task-004 related portfolio supervisor
    When I request PF-task-004 lifecycle action "revert-start" for "startedForRevert"
    Then the latest PF-task-004 API response status should be 200
    And the PF-task-004 lifecycle state for "startedForRevert" should not have a started timestamp
    When I request PF-task-004 lifecycle action "revert-completion" for "completedForRevert"
    Then the latest PF-task-004 API response status should be 200
    And the PF-task-004 lifecycle state for "completedForRevert" should have a started timestamp
    And the PF-task-004 lifecycle state for "completedForRevert" should not have a completed timestamp

  @api @portfolio @pf-task-004
  Scenario Outline: Progressed registrations cannot be re-decided
    Given I am authenticated as the PF-task-004 portfolio teacher
    And I remember the PF-task-004 lifecycle state for "<fixture>"
    When I request PF-task-004 registration decision "rejected" for "<fixture>"
    Then the latest PF-task-004 API response status should be 400
    And the PF-task-004 lifecycle state for "<fixture>" should keep its remembered timestamps

    Examples:
      | fixture               |
      | startedStartRejected  |
      | completedStartRejected |

  @api @portfolio @pf-task-004
  Scenario Outline: Students cannot mutate lifecycle state but can view their own timeline
    Given I am authenticated as the PF-task-004 portfolio owner student
    And I remember the PF-task-004 lifecycle state for "studentDenied"
    When I request PF-task-004 lifecycle action "<action>" for "studentDenied"
    Then the latest PF-task-004 API response status should be 403
    And the PF-task-004 lifecycle state for "studentDenied" should keep its remembered timestamps
    When I request the PF-task-004 timeline for "studentDenied"
    Then the latest PF-task-004 API response status should be 200
    And the PF-task-004 timeline response should include the registration lifecycle fields

    Examples:
      | action            |
      | start             |
      | complete          |
      | revert-start      |
      | revert-completion |

  @api @portfolio @pf-task-004
  Scenario Outline: Unrelated supervisors cannot mutate lifecycle state
    Given I am authenticated as the PF-task-004 unrelated portfolio supervisor
    And I remember the PF-task-004 lifecycle state for "supervisorDenied"
    When I request PF-task-004 lifecycle action "<action>" for "supervisorDenied"
    Then the latest PF-task-004 API response status should be 403
    And the PF-task-004 lifecycle state for "supervisorDenied" should keep its remembered timestamps
    And no PF-task-004 portfolio evidence should exist for "supervisorDenied"

    Examples:
      | action            |
      | start             |
      | complete          |
      | revert-start      |
      | revert-completion |

  @api @portfolio @pf-task-004
  Scenario Outline: Timeline access is limited to related users
    Given I am authenticated as the PF-task-004 <actor>
    When I request the PF-task-004 timeline for "timelineAccess"
    Then the latest PF-task-004 API response status should be <status>

    Examples:
      | actor                        | status |
      | portfolio owner student      | 200    |
      | portfolio teacher            | 200    |
      | related portfolio supervisor | 200    |
      | unrelated portfolio supervisor | 403  |

  @api @portfolio @pf-task-004
  Scenario: Unauthenticated callers cannot view registration timelines
    When I request the PF-task-004 timeline for "timelineAccess" without authentication
    Then the latest PF-task-004 API response status should be 401

  @api @portfolio @pf-task-004
  Scenario Outline: Unauthenticated callers cannot mutate lifecycle state
    Given I remember the PF-task-004 lifecycle state for "studentDenied"
    When I request PF-task-004 lifecycle action "<action>" for "studentDenied" without authentication
    Then the latest PF-task-004 API response status should be 401
    And the PF-task-004 lifecycle state for "studentDenied" should keep its remembered timestamps

    Examples:
      | action            |
      | start             |
      | complete          |
      | revert-start      |
      | revert-completion |

  @api @portfolio @pf-task-004
  Scenario: Teacher can revert valid lifecycle states
    Given I am authenticated as the PF-task-004 portfolio teacher
    When I request PF-task-004 lifecycle action "revert-start" for "startedForRevert"
    Then the latest PF-task-004 API response status should be 200
    And the PF-task-004 lifecycle state for "startedForRevert" should not have a started timestamp
    When I request PF-task-004 lifecycle action "revert-completion" for "completedForRevert"
    Then the latest PF-task-004 API response status should be 200
    And the PF-task-004 lifecycle state for "completedForRevert" should have a started timestamp
    And the PF-task-004 lifecycle state for "completedForRevert" should not have a completed timestamp
