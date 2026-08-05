Feature: TS-task-019 theme display on ProjectDetailsPage

  As any user (student, supervisor, teacher or public visitor)
  I want to see which themes a project belongs to on its detail page
  So that I understand the project's thematic context and SDG alignment

  # Runs against the real stack end to end: the real theme catalog (reset to the
  # shared deterministic baseline) and the project's real theme links
  # (re-established per scenario through the real PUT /themes/project/{id}). The
  # display is verified through the details page's own read of
  # GET /themes/project/{id}, which is the endpoint AC-5 mandates - the same read
  # the production page performs.
  #
  # Only the two states a healthy backend cannot produce on demand are staged with
  # a Playwright route: a slow theme fetch (loading state, AC-5) and a failing one
  # (graceful degradation). The baseline catalog carries the exact icon/color the
  # AC-2 example asserts on (Duurzaamheid -> icon "eco", color #4CAF50), so those
  # values are proven against the real catalog rather than a copy.
  #
  # The display is read-only for every role by design. Inline editing is a separate
  # task (TS-task-017) which since its implementation adds an edit control to this
  # section for the project's supervisor and for teachers; that control, and what it
  # opens, belong to that suite. What this suite still owns for every role is that
  # the displayed pills themselves are never interactive, and that a user who may
  # not edit is offered no editing control at all.

  Background:
    Given the theme catalog is reset to the shared baseline themes

  @ui @theme @TS-task-019
  Scenario: AC-1 the project's linked themes appear as a Thema's section of pills
    Given the project's linked themes are "Duurzaamheid, Klimaat & Milieu"
    And I am authenticated in the browser as a student
    When I open the project details page
    Then a "Thema's" section is shown on the project details
    And exactly the theme pills "Duurzaamheid, Klimaat & Milieu" are shown

  @ui @theme @TS-task-019
  Scenario: AC-2 a theme pill shows its Material Symbols icon, name and theme color
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as a student
    When I open the project details page
    Then the "Duurzaamheid" theme pill shows the Material Symbols icon "eco"
    And the "Duurzaamheid" theme pill is labelled "Duurzaamheid"
    And the "Duurzaamheid" theme pill uses the color "#4CAF50" as its background

  @ui @theme @TS-task-019
  Scenario: AC-3 every linked theme is shown as its own pill
    Given the project's linked themes are "Duurzaamheid, Klimaat & Milieu, Onderwijs, Water"
    And I am authenticated in the browser as a student
    When I open the project details page
    Then exactly the theme pills "Duurzaamheid, Klimaat & Milieu, Onderwijs, Water" are shown

  @ui @theme @TS-task-019
  Scenario: AC-4 a project without themes shows the empty-state message
    Given the project's linked themes are cleared
    And I am authenticated in the browser as a student
    When I open the project details page
    Then a "Thema's" section is shown on the project details
    And the theme section shows the message "Geen thema's gekoppeld"
    And no theme pills are shown on the project details

  @ui @theme @TS-task-019
  Scenario: AC-5 the themes are fetched from the per-project endpoint
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as a student
    When I open the project details page
    Then the project details page requested the themes via "GET /themes/project/{id}"

  @ui @theme @TS-task-019
  Scenario: AC-5 a loading state is shown while the themes are fetched
    Given the project's linked themes are "Duurzaamheid, Klimaat & Milieu"
    And I am authenticated in the browser as a student
    And the project theme fetch is slow
    When I open the project details page
    Then a loading state is shown in the theme section
    And the loading state is replaced by the theme pills once the fetch completes

  @ui @theme @TS-task-019
  Scenario: AC-6 the theme section sits with the project metadata without breaking the page
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as a student
    When I open the project details page
    Then the theme section appears above the project's task list
    And the project's name and task list are still shown

  @ui @theme @TS-task-019
  Scenario: AC-7 the theme pills are read-only and not interactive
    Given the project's linked themes are "Duurzaamheid, Klimaat & Milieu"
    And I am authenticated in the browser as a student
    When I open the project details page
    Then the theme pills are not interactive controls
    And the theme section offers no theme editing control
    And the theme pills do not use a pointer cursor
    When I click the project theme pill "Duurzaamheid"
    Then I stay on the project details page
    And exactly the theme pills "Duurzaamheid, Klimaat & Milieu" are shown

  # The other half of AC-7: the pills themselves are read-only for the owner too.
  # The section does carry an edit control for them since TS-task-017, but nothing
  # is editable until that control is used - the display this task owns stays
  # read-only. Who is offered that control, and what it opens, is TS-task-017's.
  @ui @theme @TS-task-019
  Scenario: AC-7 the owning supervisor also sees read-only pills until they start editing
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as the project's supervisor
    When I open the project details page
    Then the theme pills are not interactive controls
    And the theme pills do not use a pointer cursor

  # Not spelled out in the issue but a real state: the per-project fetch can fail.
  # A project that HAS themes must not silently look empty on a backend hiccup, so
  # the failure is shown as its own message, distinct from the "no themes" state,
  # and the rest of the page keeps working.
  @ui @theme @TS-task-019
  Scenario: A failed theme fetch shows a load-error, never a false empty state
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as a student
    And the project theme fetch fails
    When I open the project details page
    Then the theme section shows a load-error distinct from the empty state
    And no theme pills are shown on the project details
    And the project's name and task list are still shown
