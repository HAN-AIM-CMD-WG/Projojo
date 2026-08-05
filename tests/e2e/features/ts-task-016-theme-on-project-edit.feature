Feature: TS-task-016 theme selection on project edit

  As a begeleider (supervisor)
  I want to add or remove themes on an existing project via the edit form
  So that I can keep the project's theme tags up to date as the project evolves

  # Runs against the real stack end to end: the real theme catalog (reset to the
  # shared baseline), the project's real theme links (re-established per scenario
  # through the real PUT /themes/project/{id}), the real project update call and
  # the real link call. What was saved is verified through the backend
  # (GET /projects/{id}/complete and GET /themes/project/{id}) rather than through
  # the UI that wrote it.
  #
  # Only the two states a healthy backend cannot produce on demand are staged with
  # a Playwright route: a failing link call and a slow one. The slow one is delayed
  # and then passed through to the real backend, so the themes still end up
  # genuinely linked.
  #
  # Unlike the create suite this works on the seeded proof project rather than a
  # run-unique one: an edit is repeatable and every scenario re-establishes the
  # theme links it needs. The project name is never changed, because other suites
  # key their fixtures off it; the description is, which nothing else asserts on.
  #
  # Two behaviours here are not spelled out in the issue and were confirmed before
  # the tests were written: the empty-selection confirmation only appears when
  # themes would really be removed, and a save whose theme selection is unchanged
  # sends no link request at all.

  Background:
    Given the theme catalog contains the TS-016 baseline themes
    And I am authenticated in the browser as the TS-task-016 supervisor

  @ui @theme @TS-task-016
  Scenario: AC-1 the edit form pre-selects the themes the project is linked to
    Given the project is linked to the themes "Duurzaamheid, Klimaat & Milieu"
    When I open the edit page of the project
    Then a "Thema's" section containing the theme picker is shown on the edit form
    And the edit form theme picker offers the whole theme catalog
    And exactly the themes "Duurzaamheid, Klimaat & Milieu" are selected on the edit form

  # Edge of AC-1: the pre-selection must reflect what is linked, including nothing.
  @ui @theme @TS-task-016
  Scenario: AC-1 a project without themes opens with an empty selection
    Given the project is linked to no themes
    When I open the edit page of the project
    Then the edit form theme picker offers the whole theme catalog
    And no theme is selected on the edit form

  @ui @theme @TS-task-016
  Scenario: AC-2 a theme added on the edit form is linked on save
    Given the project is linked to the themes "Duurzaamheid, Klimaat & Milieu"
    When I open the edit page of the project
    And I select the themes "Onderwijs" on the edit form
    Then exactly the themes "Duurzaamheid, Klimaat & Milieu, Onderwijs" are selected on the edit form
    When I save the edit form
    Then the save completes without asking for confirmation
    And the project is linked to exactly the themes "Duurzaamheid, Klimaat & Milieu, Onderwijs"
    And no error message is shown to the supervisor

  @ui @theme @TS-task-016
  Scenario: AC-3 a theme removed on the edit form is unlinked on save, leaving the others
    Given the project is linked to the themes "Duurzaamheid, Klimaat & Milieu, Onderwijs"
    When I open the edit page of the project
    And I unselect the themes "Klimaat & Milieu" on the edit form
    Then exactly the themes "Duurzaamheid, Onderwijs" are selected on the edit form
    When I save the edit form
    Then the save completes without asking for confirmation
    And the project is linked to exactly the themes "Duurzaamheid, Onderwijs"

  @ui @theme @TS-task-016
  Scenario: AC-4 emptying the theme selection asks for confirmation on save
    Given the project is linked to the themes "Duurzaamheid"
    When I open the edit page of the project
    And I unselect the themes "Duurzaamheid" on the edit form
    Then no theme removal confirmation is shown
    When I save the edit form
    Then a confirmation asks "Alle thema's worden verwijderd van dit project. Weet je het zeker?"
    And the confirmation offers "Ja, verwijderen" and "Annuleren"
    And I am still on the edit page
    And no project update request was sent
    And no theme link request was sent during the save

  @ui @theme @TS-task-016
  Scenario: AC-5 confirming the removal unlinks every theme and completes the save
    Given the project is linked to the themes "Duurzaamheid, Klimaat & Milieu"
    When I open the edit page of the project
    And I unselect the themes "Duurzaamheid, Klimaat & Milieu" on the edit form
    And I save the edit form
    And I confirm the theme removal
    Then I am taken to the project page
    And the project has no linked themes
    And no error message is shown to the supervisor

  @ui @theme @TS-task-016
  Scenario: AC-6 cancelling the removal saves nothing and restores the selection
    Given the project is linked to the themes "Duurzaamheid, Klimaat & Milieu"
    When I open the edit page of the project
    And I change the description on the edit form
    And I unselect the themes "Duurzaamheid, Klimaat & Milieu" on the edit form
    And I save the edit form
    And I cancel the theme removal
    Then exactly the themes "Duurzaamheid, Klimaat & Milieu" are selected on the edit form
    And I am still on the edit page
    And no project update request was sent
    And no theme link request was sent during the save
    And the saved description is unchanged
    And the project is linked to exactly the themes "Duurzaamheid, Klimaat & Milieu"

  @ui @theme @TS-task-016
  Scenario: AC-7 a description edit and a theme change are saved in one action
    Given the project is linked to the themes "Duurzaamheid"
    When I open the edit page of the project
    And I change the description on the edit form
    And I select the themes "Water" on the edit form
    And I save the edit form
    Then I am taken to the project page
    And the saved description is the new description
    And the project is linked to exactly the themes "Duurzaamheid, Water"
    And the project was updated once and its themes were linked once, in that order

  # The other half of AC-7: "a single save action". The supervisor must never be
  # moved on, or be told the work is done, between the update call and the link
  # call. Staged by delaying the real link request so that in-between moment can
  # be observed at all.
  @ui @theme @TS-task-016
  Scenario: AC-7 the save stays in progress until the themes are linked
    Given the project is linked to the themes "Duurzaamheid"
    And the theme link request is slow while saving
    When I open the edit page of the project
    And I select the themes "Water" on the edit form
    And I save the edit form
    Then the edit form is still saving while the themes are being linked
    And I am still on the edit page while the themes are being linked
    When the slow theme link request completes
    Then I am taken to the project page
    And the project is linked to exactly the themes "Duurzaamheid, Water"

  # Confirmed with the issue owner: the confirmation warns that all themes are
  # removed, so it must not appear when there is nothing to remove.
  @ui @theme @TS-task-016
  Scenario: A project without themes saves straight through
    Given the project is linked to no themes
    When I open the edit page of the project
    And I change the description on the edit form
    And I save the edit form
    Then the save completes without asking for confirmation
    And the saved description is the new description
    And no theme link request was sent during the save
    And the project has no linked themes

  # Confirmed with the issue owner: the link call replaces every link, so an
  # untouched selection must not trigger a pointless rewrite.
  @ui @theme @TS-task-016
  Scenario: Saving without touching the themes leaves the links alone
    Given the project is linked to the themes "Duurzaamheid, Klimaat & Milieu"
    When I open the edit page of the project
    And I change the description on the edit form
    And I save the edit form
    Then I am taken to the project page
    And the saved description is the new description
    And no theme link request was sent during the save
    And the project is linked to exactly the themes "Duurzaamheid, Klimaat & Milieu"

  # Edge of the same rule: "unchanged" is about the resulting set, not about
  # whether the supervisor touched a pill.
  @ui @theme @TS-task-016
  Scenario: A theme toggled off and on again counts as unchanged
    Given the project is linked to the themes "Duurzaamheid"
    When I open the edit page of the project
    And I unselect the themes "Duurzaamheid" on the edit form
    And I select the themes "Duurzaamheid" on the edit form
    And I save the edit form
    Then the save completes without asking for confirmation
    And no theme link request was sent during the save
    And the project is linked to exactly the themes "Duurzaamheid"

  # Confirmed with the issue owner: the project data is already saved at that
  # point, so the supervisor stays on the form and can retry the theme part.
  @ui @theme @TS-task-016
  Scenario: A failed theme link keeps the saved project data and explains the failure
    Given the project is linked to the themes "Duurzaamheid"
    And the theme link request fails while saving
    When I open the edit page of the project
    And I change the description on the edit form
    And I select the themes "Water" on the edit form
    And I save the edit form
    Then an error message explains that the themes could not be saved
    And I am still on the edit page
    And the saved description is the new description
    And the project is linked to exactly the themes "Duurzaamheid"
