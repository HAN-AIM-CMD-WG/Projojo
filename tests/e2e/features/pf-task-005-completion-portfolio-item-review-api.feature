Feature: PF-task-005 completion creates canonical portfolio item and initial review

  Background:
    Given the PF-task-005 completion fixtures are reset

  @api @portfolio @pf-task-005
  Scenario: Teacher completion without review creates a canonical portfolio item only
    Given I am authenticated as the PF-task-005 portfolio teacher
    And I remember the PF-task-005 completion side effects for "startedForCompletion"
    When I complete the PF-task-005 registration "startedForCompletion" without review text
    Then the latest PF-task-005 API response status should be 200
    And the PF-task-005 response should include a new portfolio item id for "startedForCompletion"
    And the PF-task-005 canonical item for "startedForCompletion" should copy source display fields
    And the PF-task-005 canonical item for "startedForCompletion" should have no initial review

  @api @portfolio @pf-task-005
  Scenario Outline: Supervisor completion requires non-empty review text
    Given I am authenticated as the PF-task-005 related portfolio supervisor
    And I remember the PF-task-005 completion side effects for "supervisorCompletionAllowed"
    When I complete the PF-task-005 registration "supervisorCompletionAllowed" with review text state "<review_text_state>"
    Then the latest PF-task-005 API response status should be 400
    And the PF-task-005 completion side effects for "supervisorCompletionAllowed" should be unchanged

    Examples:
      | review_text_state |
      | missing           |
      | whitespace        |

  @api @portfolio @pf-task-005
  Scenario: Supervisor completion with review text and omitted rating creates a visible unrated review
    Given I am authenticated as the PF-task-005 related portfolio supervisor
    And I remember unique PF-task-005 review text for "unrated supervisor completion"
    And I remember the PF-task-005 completion side effects for "supervisorCompletionAllowed"
    When I complete the PF-task-005 registration "supervisorCompletionAllowed" with review text, accepted notice, and no rating
    Then the latest PF-task-005 API response status should be 200
    And the PF-task-005 response should include a new portfolio item id for "supervisorCompletionAllowed"
    And the PF-task-005 canonical item for "supervisorCompletionAllowed" should copy source display fields
    And the PF-task-005 canonical item for "supervisorCompletionAllowed" should have one initial review with no rating
    And the PF-task-005 new portfolio item should be visible in the authenticated portfolio

  @api @portfolio @pf-task-005
  Scenario Outline: Invalid completion ratings are rejected without side effects
    Given I am authenticated as the PF-task-005 related portfolio supervisor
    And I remember unique PF-task-005 review text for "invalid rating"
    And I remember the PF-task-005 completion side effects for "supervisorCompletionAllowed"
    When I complete the PF-task-005 registration "supervisorCompletionAllowed" with raw rating <rating>
    Then the latest PF-task-005 API response status should be 422
    And the PF-task-005 completion side effects for "supervisorCompletionAllowed" should be unchanged

    Examples:
      | rating |
      | 0      |
      | 6      |
      | 2.5    |
      | "five" |

  @api @portfolio @pf-task-005
  Scenario: Completion persistence failure leaves no partial side effects
    Given I remember the PF-task-005 completion side effects for "startedForCompletion"
    When a PF-task-005 completion persistence failure is simulated for "startedForCompletion"
    Then the PF-task-005 simulated persistence failure should be reported
    And the PF-task-005 completion side effects for "startedForCompletion" should be unchanged

  @api @portfolio @pf-task-005
  Scenario Outline: Review text requires accepted public-use notice
    Given I am authenticated as the PF-task-005 portfolio teacher
    And I remember unique PF-task-005 review text for "notice rejection"
    And I remember the PF-task-005 completion side effects for "startedForCompletion"
    When I complete the PF-task-005 registration "startedForCompletion" with review text and notice "<notice>"
    Then the latest PF-task-005 API response status should be 400
    And the PF-task-005 completion side effects for "startedForCompletion" should be unchanged

    Examples:
      | notice  |
      | missing |
      | false   |

  @api @portfolio @pf-task-005
  Scenario: Teacher completion with review text creates the initial review
    Given I am authenticated as the PF-task-005 portfolio teacher
    And I remember unique PF-task-005 review text for "teacher completion review"
    And I remember the PF-task-005 completion side effects for "startedForCompletion"
    When I complete the PF-task-005 registration "startedForCompletion" with review text, accepted notice, and rating 5
    Then the latest PF-task-005 API response status should be 200
    And the PF-task-005 response should include a new portfolio item id for "startedForCompletion"
    And the PF-task-005 canonical item for "startedForCompletion" should copy source display fields
    And the PF-task-005 canonical item for "startedForCompletion" should have one initial review with rating 5
