Feature: TS-task-013 theme delete with confirmation dialog

  As a docent (teacher)
  I want to delete themes with a clear warning about the impact
  So that I don't accidentally unlink themes from projects without understanding the consequences

  # Like the TS-011 create and TS-012 edit suites, this runs against the real backend.
  # Each scenario resets the catalog to a small TS-013 baseline and, where the impact
  # warning matters, links seeded projects to a theme through the real
  # PUT /themes/project/{id} endpoint. Nothing is stubbed except the one state a
  # healthy backend will not produce on demand: a failing DELETE (AC-6).
  #
  # Scope note on AC-7: these scenarios assert the cascade through the public API -
  # the theme is gone, each linked project still exists, no project still lists the
  # deleted theme, and a project's OTHER theme links survive. That covers deleting
  # too much. Deleting too little is covered by the schema rather than by an
  # assertion here: hasTheme declares `relates theme @card(1)` (schema.tql:214-216),
  # so TypeDB refuses to delete a theme entity while any of its relations survive.
  # An under-scoped cascade therefore cannot orphan silently - it fails the delete,
  # and "no theme named ... should exist" below catches it.
  #
  # AC-2 specifies a theme linked to 4 projects. The deterministic E2E seed contains
  # 3 projects, so the linked-count scenarios use 3 and 1 instead. Two different
  # non-zero counts prove the number is read from the data rather than hardcoded.

  @ui @theme @TS-task-013
  Scenario: AC-1 clicking Verwijderen asks for confirmation instead of deleting
    Given I am authenticated in the browser as the TS-task-013 teacher
    And the theme catalog contains the TS-013 baseline themes
    When I open the TeacherPage
    And I request deletion of the theme "Duurzaamheid"
    Then the theme delete confirmation should be visible
    And a theme row named "Duurzaamheid" should be listed
    And the theme "Duurzaamheid" should still exist

  @ui @theme @TS-task-013
  Scenario: AC-2 the confirmation names the theme and its linked project count
    Given I am authenticated in the browser as the TS-task-013 teacher
    And the theme catalog contains the TS-013 baseline themes
    And the theme "Duurzaamheid" is linked to 3 projects
    When I open the TeacherPage
    And I request deletion of the theme "Duurzaamheid"
    Then the delete confirmation message should read "Weet je zeker dat je het thema 'Duurzaamheid' wilt verwijderen? Dit thema is gekoppeld aan 3 project(en). Deze koppelingen worden ook verwijderd."

  @ui @theme @TS-task-013
  Scenario: AC-2 the linked project count reflects the actual number of links
    Given I am authenticated in the browser as the TS-task-013 teacher
    And the theme catalog contains the TS-013 baseline themes
    And the theme "Duurzaamheid" is linked to 1 project
    When I open the TeacherPage
    And I request deletion of the theme "Duurzaamheid"
    Then the delete confirmation message should read "Weet je zeker dat je het thema 'Duurzaamheid' wilt verwijderen? Dit thema is gekoppeld aan 1 project(en). Deze koppelingen worden ook verwijderd."

  @ui @theme @TS-task-013
  Scenario: AC-3 a theme without linked projects gets the no-projects warning
    Given I am authenticated in the browser as the TS-task-013 teacher
    And the theme catalog contains the TS-013 baseline themes
    When I open the TeacherPage
    And I request deletion of the theme "Nieuw Thema"
    Then the delete confirmation message should read "Weet je zeker dat je het thema 'Nieuw Thema' wilt verwijderen? Dit thema is aan geen projecten gekoppeld."

  @ui @theme @TS-task-013
  Scenario: AC-4 confirming deletes the theme, closes the dialog and reports success
    Given I am authenticated in the browser as the TS-task-013 teacher
    And the theme catalog contains the TS-013 baseline themes
    When I open the TeacherPage
    And I request deletion of the theme "Duurzaamheid"
    And I confirm the theme deletion
    Then the theme delete confirmation should be closed
    And a "Thema verwijderd" success message should be shown
    And no theme row named "Duurzaamheid" should be listed
    And no theme named "Duurzaamheid" should exist

  @ui @theme @TS-task-013
  Scenario: AC-5 cancelling preserves the theme
    Given I am authenticated in the browser as the TS-task-013 teacher
    And the theme catalog contains the TS-013 baseline themes
    When I open the TeacherPage
    And I request deletion of the theme "Duurzaamheid"
    And I cancel the theme deletion
    Then the theme delete confirmation should be closed
    And a theme row named "Duurzaamheid" should be listed
    And the theme "Duurzaamheid" should still exist

  @ui @theme @TS-task-013
  Scenario: AC-6 a failing delete shows the error and keeps the theme
    Given I am authenticated in the browser as the TS-task-013 teacher
    And the theme catalog contains the TS-013 baseline themes
    And deleting a theme fails with "Verwijderen is mislukt"
    When I open the TeacherPage
    And I request deletion of the theme "Duurzaamheid"
    And I confirm the theme deletion
    Then the delete error "Verwijderen is mislukt" should be shown
    And the theme delete confirmation should stay open
    And a theme row named "Duurzaamheid" should be listed
    And the theme "Duurzaamheid" should still exist

  @ui @theme @TS-task-013
  Scenario: AC-7 deleting a linked theme removes only its own links
    Given I am authenticated in the browser as the TS-task-013 teacher
    And the theme catalog contains the TS-013 baseline themes
    And the theme "Duurzaamheid" is linked to 3 projects
    And the first of those projects is also linked to the theme "Klimaat & Milieu"
    When I open the TeacherPage
    And I request deletion of the theme "Duurzaamheid"
    And I confirm the theme deletion
    Then no theme named "Duurzaamheid" should exist
    And every linked project should still exist
    And no linked project should still be linked to "Duurzaamheid"
    And the first linked project should still be linked to "Klimaat & Milieu"

  # Not an acceptance criterion, and deliberately so: a 404 is the one error a healthy
  # backend produces on demand, and it means the theme this teacher wanted gone IS
  # gone. Completing the flow beats trapping them in a dialog with an error about work
  # that is already done. Running against the real backend is what makes this worth
  # keeping next to the stubbed AC-6 failure above.
  @ui @theme @TS-task-013
  Scenario: Deleting a theme that was already removed elsewhere completes without an error
    Given I am authenticated in the browser as the TS-task-013 teacher
    And the theme catalog contains the TS-013 baseline themes
    When I open the TeacherPage
    And I request deletion of the theme "Duurzaamheid"
    And the theme "Duurzaamheid" is deleted outside the browser
    And I confirm the theme deletion
    Then the theme delete confirmation should be closed
    And a "Thema was al verwijderd" success message should be shown
    And no theme row named "Duurzaamheid" should be listed

  @ui @theme @TS-task-013
  Scenario: Cancelling returns focus to the row's Verwijderen button
    Given I am authenticated in the browser as the TS-task-013 teacher
    And the theme catalog contains the TS-013 baseline themes
    When I open the TeacherPage
    And I request deletion of the theme "Duurzaamheid"
    And I cancel the theme deletion
    Then the theme delete confirmation should be closed
    And the "Verwijderen" button for "Duurzaamheid" should be focused

  # Guards a specific trap in the impact warning: the list replaces an edited row with
  # whatever PUT /themes/{id} returned, so if that response omits the linked-project
  # count, the delete dialog would understate the impact of exactly the themes a
  # teacher just worked on. Reuses the TS-012 edit steps deliberately rather than
  # duplicating them; all step files are loaded by one qavajs config.
  @ui @theme @TS-task-013
  Scenario: The linked project count stays correct after the theme was just edited
    Given I am authenticated in the browser as the TS-task-013 teacher
    And the theme catalog contains the TS-013 baseline themes
    And the theme "Duurzaamheid" is linked to 3 projects
    When I open the TeacherPage
    And I open the edit modal for the theme "Duurzaamheid"
    And I change the theme description to "Bijgewerkt vlak voor verwijderen"
    And I save the theme changes
    And I request deletion of the theme "Duurzaamheid"
    Then the delete confirmation message should read "Weet je zeker dat je het thema 'Duurzaamheid' wilt verwijderen? Dit thema is gekoppeld aan 3 project(en). Deze koppelingen worden ook verwijderd."
