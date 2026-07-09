Feature: PF-task-012b reviewer public-use notice enforcement

  Background:
    Given the PF-task-012b review notice fixtures are reset

  @api @portfolio @pf-task-012b
  Scenario Outline: Completion review text is rejected without accepted public-use notice
    Given I am authenticated as the PF-task-012b <reviewer>
    And I remember unique PF-task-012b review text for "completion rejection"
    When I submit a PF-task-012b completion review for "startedForCompletion" with notice "<notice>"
    Then the latest PF-task-012b API response status should be 400
    And the PF-task-012b completion state for "startedForCompletion" should not have a completed timestamp
    And no PF-task-012b review should be persisted for the remembered text

    Examples:
      | reviewer                     | notice  |
      | portfolio teacher            | missing |
      | portfolio teacher            | false   |
      | related portfolio supervisor | missing |
      | related portfolio supervisor | false   |

  @api @portfolio @pf-task-012b
  Scenario Outline: Accepted completion review stores the public-use notice timestamp
    Given I am authenticated as the PF-task-012b <reviewer>
    And I remember unique PF-task-012b review text for "accepted completion"
    When I submit a PF-task-012b completion review for "startedForCompletion" with notice "accepted"
    Then the latest PF-task-012b API response status should be 200
    And the PF-task-012b completion state for "startedForCompletion" should have a completed timestamp
    And the persisted PF-task-012b review should store a public notice accepted timestamp

    Examples:
      | reviewer                     |
      | portfolio teacher            |
      | related portfolio supervisor |

  @api @portfolio @pf-task-012b
  Scenario Outline: Completion review rating is rejected outside the portfolio rating bounds
    Given I am authenticated as the PF-task-012b portfolio teacher
    And I remember unique PF-task-012b review text for "invalid completion rating"
    When I submit a PF-task-012b completion review for "startedForCompletion" with notice "accepted" and rating <rating>
    Then the latest PF-task-012b API response status should be 422
    And the PF-task-012b completion state for "startedForCompletion" should not have a completed timestamp
    And no PF-task-012b review should be persisted for the remembered text

    Examples:
      | rating |
      | 0      |
      | 6      |

  @api @portfolio @pf-task-012b
  Scenario: Completion rating is rejected without review text
    Given I am authenticated as the PF-task-012b portfolio teacher
    When I submit a PF-task-012b completion rating without review text for "startedForCompletion"
    Then the latest PF-task-012b API response status should be 400
    And the PF-task-012b completion state for "startedForCompletion" should not have a completed timestamp

  @api @portfolio @pf-task-012b
  Scenario: Reverting reviewed completion retires generated portfolio evidence
    Given I am authenticated as the PF-task-012b portfolio teacher
    And I remember unique PF-task-012b review text for "reverted completion"
    When I submit a PF-task-012b completion review for "startedForCompletion" with notice "accepted"
    Then the latest PF-task-012b API response status should be 200
    When I revert the PF-task-012b completion for "startedForCompletion"
    Then the latest PF-task-012b API response status should be 200
    And the PF-task-012b completion state for "startedForCompletion" should not have a completed timestamp
    And no PF-task-012b visible portfolio review should be returned for the remembered text

  @api @portfolio @pf-task-012b
  Scenario: Additional reviews cannot be added to retired completion evidence
    Given I am authenticated as the PF-task-012b portfolio teacher
    And I remember unique PF-task-012b review text for "retired completion source"
    When I submit a PF-task-012b completion review for "startedForCompletion" with notice "accepted"
    Then the latest PF-task-012b API response status should be 200
    When I revert the PF-task-012b completion for "startedForCompletion"
    Then the latest PF-task-012b API response status should be 200
    Given I remember unique PF-task-012b review text for "retired additional rejection"
    When I submit a PF-task-012b additional review for the remembered retired completion item with notice "accepted"
    Then the latest PF-task-012b API response status should be 400
    And no PF-task-012b review should be persisted for the remembered text
    Given I remember unique PF-task-012b review text for "retired race rejection"
    When PF-task-012b review creation races with retirement for the remembered completion item
    Then the PF-task-012b race-safe review creation should fail without persisting a review

  @api @portfolio @pf-task-012b
  Scenario Outline: Additional review creation is rejected without accepted public-use notice
    Given I am authenticated as the PF-task-012b <reviewer>
    And I remember unique PF-task-012b review text for "additional rejection"
    When I submit a PF-task-012b additional review for "noRatings" with notice "<notice>"
    Then the latest PF-task-012b API response status should be 400
    And no PF-task-012b review should be persisted for the remembered text

    Examples:
      | reviewer                     | notice  |
      | portfolio teacher            | missing |
      | portfolio teacher            | false   |
      | related portfolio supervisor | missing |
      | related portfolio supervisor | false   |

  @api @portfolio @pf-task-012b
  Scenario Outline: Accepted additional review stores the public-use notice timestamp
    Given I am authenticated as the PF-task-012b <reviewer>
    And I remember unique PF-task-012b review text for "accepted additional"
    When I submit a PF-task-012b additional review for "noRatings" with notice "accepted"
    Then the latest PF-task-012b API response status should be 201
    And the persisted PF-task-012b review should store a public notice accepted timestamp

    Examples:
      | reviewer                     |
      | portfolio teacher            |
      | related portfolio supervisor |

  @api @portfolio @pf-task-012b
  Scenario Outline: Additional review rating is rejected outside the portfolio rating bounds
    Given I am authenticated as the PF-task-012b related portfolio supervisor
    And I remember unique PF-task-012b review text for "invalid additional rating"
    When I submit a PF-task-012b additional review for "noRatings" with notice "accepted" and rating <rating>
    Then the latest PF-task-012b API response status should be 422
    And no PF-task-012b review should be persisted for the remembered text

    Examples:
      | rating |
      | 0      |
      | 6      |

  @ui @portfolio @pf-task-012b
  Scenario: Reviewer sees and explicitly accepts the public-use notice before completion submission
    Given I am authenticated in the browser as the PF-task-012b related portfolio supervisor
    And I remember unique PF-task-012b review text for "browser completion"
    When I open the PF-task-012b completion dialog for "supervisorCompletionAllowed"
    Then the PF-task-012b public-use notice should be displayed
    And the PF-task-012b completion review submit button should be disabled
    When I enter PF-task-012b completion review text
    Then the PF-task-012b completion review submit button should be disabled
    When I accept the PF-task-012b public-use notice
    Then the PF-task-012b completion review submit button should be enabled
    When I submit the PF-task-012b completion review form
    Then the PF-task-012b completion state for "supervisorCompletionAllowed" should have a completed timestamp
    And the persisted PF-task-012b review should store a public notice accepted timestamp

  @ui @portfolio @pf-task-012b
  Scenario: Supervisor completion without review text is prevented by the completion review rules
    Given I am authenticated in the browser as the PF-task-012b related portfolio supervisor
    When I open the PF-task-012b completion dialog for "supervisorCompletionAllowed"
    Then the PF-task-012b completion without review action should not be available
    And the PF-task-012b completion state for "supervisorCompletionAllowed" should not have a completed timestamp
