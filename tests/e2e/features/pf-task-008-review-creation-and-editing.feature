@reviews @review-management
Feature: PF-task-008 additional review creation and review editing

  # Additional reviews and review edits follow author, teacher, and same-business
  # supervisor permission rules. Rating edits feed the authenticated-public rating
  # gate immediately, so a related supervisor's view of an item changes as its
  # ratings cross the "every rating three or higher" threshold (Portfolio spec 3.6.2).
  #
  # A dedicated portfolio item (pf-task-008-item) is created for the E2E student before
  # each scenario with two starting reviews: a supervisor-authored review (rating 5) and
  # a teacher-authored review (rating 3). Both starting ratings are three or higher, so
  # the item starts visible to the related supervisor.
  Background:
    Given the PF-task-008 review fixtures are reset

  # --- AC-1 / AC-2: additional review creation permissions -------------------------------
  @api @portfolio @pf-task-008
  Scenario: AC-1 Teacher can add an additional review to a non-retired item
    Given I am authenticated as the PF-task-008 portfolio teacher
    And I remember unique PF-task-008 review text for "teacher additional"
    When I submit a PF-task-008 additional review with an accepted notice and rating 4
    Then the latest PF-task-008 API response status should be 201
    And the persisted PF-task-008 review for the remembered text should be authored by the portfolio teacher

  @api @portfolio @pf-task-008
  Scenario: AC-2 Same-business supervisor can add an additional review
    Given I am authenticated as the PF-task-008 related portfolio supervisor
    And I remember unique PF-task-008 review text for "related supervisor additional"
    When I submit a PF-task-008 additional review with an accepted notice and rating 4
    Then the latest PF-task-008 API response status should be 201
    And the persisted PF-task-008 review for the remembered text should be authored by the related portfolio supervisor

  @api @portfolio @pf-task-008
  Scenario: AC-2 Unrelated supervisor is denied additional review creation
    Given I am authenticated as the PF-task-008 unrelated portfolio supervisor
    And I remember unique PF-task-008 review text for "unrelated supervisor additional"
    When I submit a PF-task-008 additional review with an accepted notice and rating 4
    Then the latest PF-task-008 API response status should be 403
    And no PF-task-008 review should be persisted for the remembered text

  # --- AC-3: review text required ---------------------------------------------------------
  @api @portfolio @pf-task-008
  Scenario: AC-3 Additional review with empty text is rejected
    Given I am authenticated as the PF-task-008 portfolio teacher
    When I submit a PF-task-008 additional review with review text "" and an accepted notice
    Then the latest PF-task-008 API response status should be 400
    And the PF-task-008 item should have 2 reviews

  @api @portfolio @pf-task-008
  Scenario: AC-3 Additional review with whitespace-only text is rejected
    Given I am authenticated as the PF-task-008 portfolio teacher
    When I submit a PF-task-008 additional review with whitespace-only text and an accepted notice
    Then the latest PF-task-008 API response status should be 400
    And the PF-task-008 item should have 2 reviews

  # --- AC-4: rating validation ------------------------------------------------------------
  @api @portfolio @pf-task-008
  Scenario Outline: AC-4 Additional review rating must be an integer 1 through 5
    Given I am authenticated as the PF-task-008 portfolio teacher
    And I remember unique PF-task-008 review text for "creation rating bounds"
    When I submit a PF-task-008 additional review with an accepted notice and rating <rating>
    Then the latest PF-task-008 API response status should be 422
    And no PF-task-008 review should be persisted for the remembered text

    Examples:
      | rating |
      | 0      |
      | 6      |

  # --- AC-5: public-use notice is required and its acceptance timestamp is persisted -------
  @api @portfolio @pf-task-008
  Scenario Outline: AC-5 Additional review is rejected without an accepted public-use notice
    Given I am authenticated as the PF-task-008 portfolio teacher
    And I remember unique PF-task-008 review text for "notice rejection"
    When I submit a PF-task-008 additional review with notice "<notice>" and rating 4
    Then the latest PF-task-008 API response status should be 400
    And no PF-task-008 review should be persisted for the remembered text

    Examples:
      | notice  |
      | missing |
      | false   |

  @api @portfolio @pf-task-008
  Scenario: AC-5 Accepted additional review stores the public-use notice timestamp
    Given I am authenticated as the PF-task-008 portfolio teacher
    And I remember unique PF-task-008 review text for "accepted notice"
    When I submit a PF-task-008 additional review with an accepted notice and rating 4
    Then the latest PF-task-008 API response status should be 201
    And the persisted PF-task-008 review for the remembered text should store a public notice accepted timestamp

  # --- AC-6: review author can edit their own review --------------------------------------
  @api @portfolio @pf-task-008
  Scenario: AC-6 Review author edits their own review text and rating
    Given I am authenticated as the PF-task-008 related portfolio supervisor
    When I edit the PF-task-008 "supervisor" review with text "Bijgewerkte reviewtekst van de auteur." and rating 4
    Then the latest PF-task-008 API response status should be 200
    And the PF-task-008 "supervisor" review text should be "Bijgewerkte reviewtekst van de auteur."
    And the PF-task-008 "supervisor" review rating should be 4
    And the PF-task-008 "supervisor" review updated timestamp should have changed

  # --- AC-7: any teacher can edit any review ----------------------------------------------
  @api @portfolio @pf-task-008
  Scenario: AC-7 Teacher edits a review authored by a supervisor
    Given I am authenticated as the PF-task-008 portfolio teacher
    When I edit the PF-task-008 "supervisor" review with text "Docent corrigeert de review." and rating 3
    Then the latest PF-task-008 API response status should be 200
    And the PF-task-008 "supervisor" review text should be "Docent corrigeert de review."
    And the PF-task-008 "supervisor" review rating should be 3

  @api @portfolio @pf-task-008
  Scenario Outline: AC-7 Review edit rating must be an integer 1 through 5
    Given I am authenticated as the PF-task-008 portfolio teacher
    When I edit the PF-task-008 "supervisor" review with rating <rating>
    Then the latest PF-task-008 API response status should be 422
    And the PF-task-008 "supervisor" review rating should be 5

    Examples:
      | rating |
      | 0      |
      | 6      |

  # --- AC-8: unauthorized review edit is denied and leaves the review unchanged -----------
  @api @portfolio @pf-task-008
  Scenario: AC-8 Supervisor who is not the author and not a teacher cannot edit a review
    Given I am authenticated as the PF-task-008 related portfolio supervisor
    When I edit the PF-task-008 "teacher" review with text "Poging tot ongeautoriseerde wijziging." and rating 1
    Then the latest PF-task-008 API response status should be 403
    And the PF-task-008 "teacher" review text should be unchanged
    And the PF-task-008 "teacher" review rating should be 3

  @api @portfolio @pf-task-008
  Scenario: AC-8 A student cannot edit a review
    Given I am authenticated as the PF-task-008 portfolio owner student
    When I edit the PF-task-008 "supervisor" review with text "Student mag niet wijzigen." and rating 1
    Then the latest PF-task-008 API response status should be 403
    And the PF-task-008 "supervisor" review rating should be 5

  @api @portfolio @pf-task-008
  Scenario: AC-8 An unauthenticated caller cannot edit a review
    When I edit the PF-task-008 "supervisor" review without authentication
    Then the latest PF-task-008 API response status should be 401
    And the PF-task-008 "supervisor" review rating should be 5

  # --- Edit request validation and not-found handling -------------------------------------
  @api @portfolio @pf-task-008
  Scenario: Editing a non-existent review is reported as not found without side effects
    Given I am authenticated as the PF-task-008 portfolio teacher
    When I edit a non-existent PF-task-008 review
    Then the latest PF-task-008 API response status should be 404
    And the PF-task-008 item should have 2 reviews

  @api @portfolio @pf-task-008
  Scenario: Clearing review text to null is rejected on edit and leaves the review unchanged
    Given I am authenticated as the PF-task-008 related portfolio supervisor
    When I edit the PF-task-008 "supervisor" review with a null review text
    Then the latest PF-task-008 API response status should be 400
    And the PF-task-008 "supervisor" review text should be unchanged
    And the PF-task-008 "supervisor" review rating should be 5

  @api @portfolio @pf-task-008
  Scenario: An empty edit body only refreshes the updated timestamp
    Given I am authenticated as the PF-task-008 related portfolio supervisor
    When I edit the PF-task-008 "supervisor" review with an empty body
    Then the latest PF-task-008 API response status should be 200
    And the PF-task-008 "supervisor" review text should be unchanged
    And the PF-task-008 "supervisor" review rating should be 5
    And the PF-task-008 "supervisor" review updated timestamp should have changed

  # --- AC-9: rating edits recalculate authenticated-public visibility immediately ---------
  @api @portfolio @pf-task-008
  Scenario: AC-9 Lowering a rating below three hides the item from a related supervisor, and raising it back restores it
    Given I am authenticated as the PF-task-008 related portfolio supervisor
    Then the PF-task-008 item should be visible to the related supervisor
    When I edit the PF-task-008 "supervisor" review with rating 2
    Then the PF-task-008 item should not be visible to the related supervisor
    When I edit the PF-task-008 "supervisor" review with rating 4
    Then the PF-task-008 item should be visible to the related supervisor

  @api @portfolio @pf-task-008
  Scenario: AC-9 Removing a below-three rating restores the item for a related supervisor
    Given I am authenticated as the PF-task-008 related portfolio supervisor
    When I edit the PF-task-008 "supervisor" review with rating 2
    Then the PF-task-008 item should not be visible to the related supervisor
    When I remove the rating from the PF-task-008 "supervisor" review
    Then the PF-task-008 item should be visible to the related supervisor
