Feature: TS-task-012 theme edit modal for teachers

  As a docent (teacher)
  I want to edit existing themes
  So that I can update theme information, fix errors, or refine the catalog over time

  # Like the TS-task-011 create suite, this runs entirely against the real backend.
  # Each scenario first resets the catalog to a small TS-012 baseline so the shared,
  # mutable catalog cannot make it order-dependent. Nothing is stubbed: the pre-fill
  # is read from the row the real GET /themes returned, the partial-update and
  # self-rename outcomes are asserted on what the backend actually persisted, and the
  # AC-6 duplicate error is the real 400 the backend returns for a name that already
  # exists on a different theme. That exercises the real PUT /themes/{id} contract
  # end to end, which a stubbed request could never prove.

  @ui @theme @TS-task-012
  Scenario: AC-1 the edit modal opens pre-filled with the theme's current values
    Given I am authenticated in the browser as the TS-task-012 teacher
    And the theme catalog contains the TS-012 baseline themes
    When I open the TeacherPage
    And I open the edit modal for the theme "Duurzaamheid"
    Then the theme edit modal should be visible
    And the edit form should be pre-filled with name "Duurzaamheid", description "Duurzame praktijken.", icon "eco" and colour "#4CAF50"

  @ui @theme @TS-task-012
  Scenario: AC-2 the SDG multi-select pre-selects the theme's existing codes
    Given I am authenticated in the browser as the TS-task-012 teacher
    And the theme catalog contains the TS-012 baseline themes
    When I open the TeacherPage
    And I open the edit modal for the theme "Duurzaamheid"
    Then the SDG options "SDG2" and "SDG12" should be pre-selected
    And no other SDG option should be selected

  @ui @theme @TS-task-012
  Scenario: AC-3 a successful rename updates the list, closes the modal and confirms
    Given I am authenticated in the browser as the TS-task-012 teacher
    And the theme catalog contains the TS-012 baseline themes
    When I open the TeacherPage
    And I open the edit modal for the theme "Duurzaamheid"
    And I change the theme name to "Duurzame Ontwikkeling"
    And I save the theme changes
    Then the theme edit modal should be closed
    And a "Thema bijgewerkt" success message should be shown
    And a theme row named "Duurzame Ontwikkeling" should be listed
    And no theme named "Duurzaamheid" should exist

  @ui @theme @TS-task-012
  Scenario: AC-4 changing only the colour leaves every other field unchanged
    Given I am authenticated in the browser as the TS-task-012 teacher
    And the theme catalog contains the TS-012 baseline themes
    When I open the TeacherPage
    And I open the edit modal for the theme "Duurzaamheid"
    And I recolour the theme to "#123456"
    And I save the theme changes
    Then the theme edit modal should be closed
    And the persisted theme "Duurzaamheid" should have colour "#123456"
    And the persisted theme "Duurzaamheid" should still have sdg_code "SDG2,SDG12", icon "eco" and description "Duurzame praktijken."

  @ui @theme @TS-task-012
  Scenario: AC-5 clearing the name keeps the modal open with an inline validation error
    Given I am authenticated in the browser as the TS-task-012 teacher
    And the theme catalog contains the TS-012 baseline themes
    When I open the TeacherPage
    And I open the edit modal for the theme "Duurzaamheid"
    # Whitespace passes the native `required` check but fails the client-side trim guard,
    # the same empty-name guard the create modal uses (TS-task-011 AC-5).
    And I change the theme name to "   "
    And I save the theme changes
    Then the inline edit error "Naam is verplicht" should be shown
    And the theme edit modal should stay open
    And the persisted theme "Duurzaamheid" should still be named "Duurzaamheid"

  @ui @theme @TS-task-012
  Scenario: AC-6 renaming to an existing theme name is blocked with an inline error
    Given I am authenticated in the browser as the TS-task-012 teacher
    And the theme catalog contains the TS-012 baseline themes
    When I open the TeacherPage
    And I open the edit modal for the theme "Klimaat & Milieu"
    And I change the theme name to "Duurzaamheid"
    And I save the theme changes
    Then the inline edit error "Er bestaat al een thema met deze naam" should be shown
    And the theme edit modal should stay open
    And the persisted theme "Klimaat & Milieu" should still be named "Klimaat & Milieu"

  @ui @theme @TS-task-012
  Scenario: AC-7 saving with the name unchanged succeeds without a uniqueness error
    Given I am authenticated in the browser as the TS-task-012 teacher
    And the theme catalog contains the TS-012 baseline themes
    When I open the TeacherPage
    And I open the edit modal for the theme "Duurzaamheid"
    And I change the theme description to "Bijgewerkte beschrijving"
    And I save the theme changes
    Then the theme edit modal should be closed
    And a "Thema bijgewerkt" success message should be shown
    And the persisted theme "Duurzaamheid" should have description "Bijgewerkte beschrijving"
    And the persisted theme "Duurzaamheid" should still be named "Duurzaamheid"

  @ui @theme @TS-task-012
  Scenario: SDG codes are optional and can be cleared on edit
    Given I am authenticated in the browser as the TS-task-012 teacher
    And the theme catalog contains the TS-012 baseline themes
    When I open the TeacherPage
    And I open the edit modal for the theme "Duurzaamheid"
    And I clear all selected SDG codes
    And I save the theme changes
    Then the theme edit modal should be closed
    And a "Thema bijgewerkt" success message should be shown
    And the persisted theme "Duurzaamheid" should have no SDG codes
    And the theme row "Duurzaamheid" should show no SDG code

  @ui @theme @TS-task-012
  Scenario: Closing the edit modal returns focus to the row's edit button
    Given I am authenticated in the browser as the TS-task-012 teacher
    And the theme catalog contains the TS-012 baseline themes
    When I open the TeacherPage
    And I open the edit modal for the theme "Duurzaamheid"
    And I cancel the theme edit modal
    Then the theme edit modal should be closed
    And the "Bewerken" button for "Duurzaamheid" should be focused

  @ui @theme @TS-task-012
  Scenario: AC-8 cancelling discards the changes and reopening shows the original values
    Given I am authenticated in the browser as the TS-task-012 teacher
    And the theme catalog contains the TS-012 baseline themes
    When I open the TeacherPage
    And I open the edit modal for the theme "Duurzaamheid"
    And I change the theme name to "Iets Anders"
    And I cancel the theme edit modal
    Then the theme edit modal should be closed
    And a theme row named "Duurzaamheid" should be listed
    And no theme named "Iets Anders" should exist
    When I open the edit modal for the theme "Duurzaamheid"
    Then the edit form name field should show "Duurzaamheid"
