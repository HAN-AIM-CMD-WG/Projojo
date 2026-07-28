Feature: TS-task-017 inline theme editing on ProjectDetailsPage

  As a begeleider (supervisor) viewing my project details
  I want to edit theme assignments directly on the project details page
  So that I can quickly update themes without navigating to the full edit form

  # Runs against the real stack end to end, on top of the read-only theme section
  # TS-task-019 put on this page: the real theme catalog (reset to the shared
  # deterministic baseline), the project's real theme links (re-established per
  # scenario through the real PUT /themes/project/{id}), and the real link call the
  # inline editor sends. What was saved is verified through the backend
  # (GET /themes/project/{id}) rather than through the UI that wrote it.
  #
  # Only the two states a healthy backend cannot produce on demand are staged with
  # a Playwright route: a failing link call (AC-8) and a slow one. The slow one is
  # delayed and then passed through to the real backend, so the themes still end up
  # genuinely linked.
  #
  # Setup, read-only assertions and the removal confirmation deliberately reuse the
  # steps the TS-019 display suite and the TS-016 edit-form suite already own -
  # Cucumber matches step text globally, so re-declaring them here would be both a
  # duplicate definition and a second copy of the same verification.
  #
  # Four behaviours are not spelled out in the issue and were confirmed with the
  # issue owner before these tests were written:
  #   - cancelling the removal confirmation cancels the whole save and restores the
  #     saved selection, exactly as the edit form does (TS-016 AC-6);
  #   - a save whose selection is unchanged sends no link request and claims no
  #     success, because nothing was written;
  #   - the success message lives inside the theme section;
  #   - the edit control is withheld while the current themes are unknown (the
  #     read failed), so an empty selection can never be saved over real links.

  Background:
    Given the theme catalog is reset to the shared baseline themes

  # --- AC-1 / AC-2 / AC-3: who is offered the edit control ------------------------

  @ui @theme @TS-task-017
  Scenario: AC-1 the supervisor owning the project is offered an edit control by the themes heading
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as the project's supervisor
    When I open the project details page
    Then a theme edit control is offered next to the "Thema's" heading
    And the theme pills are not interactive controls

  @ui @theme @TS-task-017
  Scenario: AC-2 a teacher is offered the edit control on a project outside their own business
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as a teacher
    When I open the project details page
    Then a theme edit control is offered next to the "Thema's" heading

  # The other half of AC-2: "teachers can edit any project's themes" is only true if
  # the save really goes through for a teacher who owns neither the project nor its
  # business - which is a backend authorisation question, not a button-visibility one.
  @ui @theme @TS-task-017
  Scenario: AC-2 a teacher can save theme changes on a project outside their own business
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as a teacher
    When I open the project details page
    And I start editing the themes
    And I toggle the theme "Water" in the theme section
    And I save the inline theme edit
    Then the theme section is back in read-only mode
    And exactly the theme pills "Duurzaamheid, Water" are shown
    And the project is linked to exactly the themes "Duurzaamheid, Water"

  @ui @theme @TS-task-017
  Scenario: AC-3 a student is not offered any way to edit the themes
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as a student
    When I open the project details page
    Then the theme section offers no theme editing control
    And the theme pills are not interactive controls

  @ui @theme @TS-task-017
  Scenario: AC-3 a supervisor from another business is not offered any way to edit the themes
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as a supervisor from another business
    When I open the project details page
    Then the theme section offers no theme editing control
    And the theme pills are not interactive controls

  # --- AC-4: entering edit mode ----------------------------------------------------

  @ui @theme @TS-task-017
  Scenario: AC-4 starting an edit replaces the read-only pills with the interactive picker
    Given the project's linked themes are "Duurzaamheid, Klimaat & Milieu"
    And I am authenticated in the browser as the project's supervisor
    When I open the project details page
    And I start editing the themes
    Then the theme section shows the interactive theme picker instead of the read-only pills
    And the theme picker in the theme section offers the whole theme catalog

  @ui @theme @TS-task-017
  Scenario: AC-4 the editor opens pre-selected with the themes the project is linked to
    Given the project's linked themes are "Duurzaamheid, Klimaat & Milieu"
    And I am authenticated in the browser as the project's supervisor
    When I open the project details page
    And I start editing the themes
    Then exactly the themes "Duurzaamheid, Klimaat & Milieu" are selected in the theme section
    And the theme section offers a "Opslaan" and a "Annuleren" button

  # Edge of AC-4: the pre-selection must reflect what is linked, including nothing.
  @ui @theme @TS-task-017
  Scenario: AC-4 a project without themes opens the editor with an empty selection
    Given the project's linked themes are cleared
    And I am authenticated in the browser as the project's supervisor
    When I open the project details page
    And I start editing the themes
    Then no theme is selected in the theme section
    And the theme picker in the theme section offers the whole theme catalog

  # --- AC-5: saving ----------------------------------------------------------------

  @ui @theme @TS-task-017
  Scenario: AC-5 saving an added theme links it and returns the section to read-only
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as the project's supervisor
    When I open the project details page
    And I start editing the themes
    And I toggle the theme "Water" in the theme section
    And I save the inline theme edit
    Then the theme section is back in read-only mode
    And a success message is shown in the theme section
    And exactly the theme pills "Duurzaamheid, Water" are shown
    And the project is linked to exactly the themes "Duurzaamheid, Water"

  @ui @theme @TS-task-017
  Scenario: AC-5 deselecting one of several themes unlinks only that theme
    Given the project's linked themes are "Duurzaamheid, Klimaat & Milieu"
    And I am authenticated in the browser as the project's supervisor
    When I open the project details page
    And I start editing the themes
    And I toggle the theme "Klimaat & Milieu" in the theme section
    And I save the inline theme edit
    Then no theme removal confirmation is shown
    And exactly the theme pills "Duurzaamheid" are shown
    And the project is linked to exactly the themes "Duurzaamheid"

  # The other half of AC-5: "returns to read-only mode with updated themes" must not
  # happen before the link call succeeded. Staged by delaying the real link request
  # so that in-between moment can be observed at all.
  @ui @theme @TS-task-017
  Scenario: AC-5 the section stays in edit mode until the link call completes
    Given the project's linked themes are "Duurzaamheid"
    And the inline theme save is slow
    And I am authenticated in the browser as the project's supervisor
    When I open the project details page
    And I start editing the themes
    And I toggle the theme "Water" in the theme section
    And I save the inline theme edit
    Then the inline theme save is still in progress
    When the slow inline theme save completes
    Then the theme section is back in read-only mode
    And the project is linked to exactly the themes "Duurzaamheid, Water"

  # --- AC-6: cancelling ------------------------------------------------------------

  @ui @theme @TS-task-017
  Scenario: AC-6 cancelling discards the changes and sends no link request
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as the project's supervisor
    When I open the project details page
    And I start editing the themes
    And I toggle the theme "Water" in the theme section
    And I cancel the inline theme edit
    Then the theme section is back in read-only mode
    And exactly the theme pills "Duurzaamheid" are shown
    And no theme link request was sent from the details page
    And the project is linked to exactly the themes "Duurzaamheid"

  # Edge of AC-6: the discarded edit must really be gone, not merely hidden - so
  # re-opening the editor has to show the saved themes again, not the abandoned ones.
  @ui @theme @TS-task-017
  Scenario: AC-6 re-opening the editor after a cancel shows the saved themes again
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as the project's supervisor
    When I open the project details page
    And I start editing the themes
    And I toggle the theme "Water" in the theme section
    And I cancel the inline theme edit
    And I start editing the themes
    Then exactly the themes "Duurzaamheid" are selected in the theme section

  # --- AC-7: emptying the selection ------------------------------------------------

  @ui @theme @TS-task-017
  Scenario: AC-7 emptying the selection asks for confirmation instead of saving
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as the project's supervisor
    When I open the project details page
    And I start editing the themes
    And I toggle the theme "Duurzaamheid" in the theme section
    And I save the inline theme edit
    Then a confirmation asks "Alle thema's worden verwijderd van dit project. Weet je het zeker?"
    And the confirmation offers "Ja, verwijderen" and "Annuleren"
    And no theme link request was sent from the details page
    And the project is linked to exactly the themes "Duurzaamheid"

  @ui @theme @TS-task-017
  Scenario: AC-7 confirming the removal unlinks every theme
    Given the project's linked themes are "Duurzaamheid, Klimaat & Milieu"
    And I am authenticated in the browser as the project's supervisor
    When I open the project details page
    And I start editing the themes
    And I toggle the theme "Duurzaamheid" in the theme section
    And I toggle the theme "Klimaat & Milieu" in the theme section
    And I save the inline theme edit
    And I confirm the theme removal
    Then the theme section is back in read-only mode
    And the theme section shows the message "Geen thema's gekoppeld"
    And the project has no linked themes

  # Confirmed with the issue owner: cancelling the confirmation cancels the whole
  # save and restores the saved selection, exactly as the edit form does.
  @ui @theme @TS-task-017
  Scenario: AC-7 cancelling the confirmation saves nothing and restores the selection
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as the project's supervisor
    When I open the project details page
    And I start editing the themes
    And I toggle the theme "Duurzaamheid" in the theme section
    And I save the inline theme edit
    And I cancel the theme removal
    Then the theme section is still in edit mode
    And exactly the themes "Duurzaamheid" are selected in the theme section
    And no theme link request was sent from the details page
    And the project is linked to exactly the themes "Duurzaamheid"

  # Edge of AC-7: the confirmation warns that all themes are removed, so it must not
  # appear when the project had none to begin with.
  @ui @theme @TS-task-017
  Scenario: AC-7 a project without themes needs no removal confirmation
    Given the project's linked themes are cleared
    And I am authenticated in the browser as the project's supervisor
    When I open the project details page
    And I start editing the themes
    And I toggle the theme "Water" in the theme section
    And I save the inline theme edit
    Then no theme removal confirmation is shown
    And exactly the theme pills "Water" are shown
    And the project is linked to exactly the themes "Water"

  # --- AC-8: a failing save ---------------------------------------------------------

  @ui @theme @TS-task-017
  Scenario: AC-8 a failed save shows the error and keeps the editor open for a retry
    Given the project's linked themes are "Duurzaamheid"
    And the inline theme save fails
    And I am authenticated in the browser as the project's supervisor
    When I open the project details page
    And I start editing the themes
    And I toggle the theme "Water" in the theme section
    And I save the inline theme edit
    Then an error message is shown in the theme section
    And the theme section is still in edit mode
    And exactly the themes "Duurzaamheid, Water" are selected in the theme section
    And no success message is shown in the theme section
    And the project is linked to exactly the themes "Duurzaamheid"

  # --- Beyond the issue: states the acceptance criteria do not name -----------------

  # Confirmed with the issue owner: the link call replaces every link, so a save that
  # changed nothing must not rewrite them - and must not claim a success it did not have.
  @ui @theme @TS-task-017
  Scenario: Saving without touching the selection writes nothing and claims nothing
    Given the project's linked themes are "Duurzaamheid, Klimaat & Milieu"
    And I am authenticated in the browser as the project's supervisor
    When I open the project details page
    And I start editing the themes
    And I save the inline theme edit
    Then the theme section is back in read-only mode
    And no theme link request was sent from the details page
    And no success message is shown in the theme section
    And the project is linked to exactly the themes "Duurzaamheid, Klimaat & Milieu"

  # Same rule, keyed on the resulting set rather than on whether a pill was touched.
  @ui @theme @TS-task-017
  Scenario: A theme toggled off and on again counts as unchanged
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as the project's supervisor
    When I open the project details page
    And I start editing the themes
    And I toggle the theme "Duurzaamheid" in the theme section
    And I toggle the theme "Duurzaamheid" in the theme section
    And I save the inline theme edit
    Then no theme removal confirmation is shown
    And no theme link request was sent from the details page
    And the project is linked to exactly the themes "Duurzaamheid"

  # Confirmed with the issue owner: editing from an unknown baseline could save an
  # empty selection over real links, so the editor is withheld until the current
  # themes are actually known.
  @ui @theme @TS-task-017
  Scenario: The edit control is withheld while the current themes could not be loaded
    Given the project's linked themes are "Duurzaamheid"
    And the project theme fetch fails
    And I am authenticated in the browser as the project's supervisor
    When I open the project details page
    Then the theme section shows a load-error distinct from the empty state
    And the theme section offers no theme editing control