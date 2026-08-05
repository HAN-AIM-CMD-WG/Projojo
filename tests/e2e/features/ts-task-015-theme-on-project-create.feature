Feature: TS-task-015 theme selection on project creation

  As a begeleider (supervisor)
  I want to assign themes when creating a new project
  So that the project is discoverable by theme from the moment it is published

  # Runs against the real stack end to end: the real theme catalog (reset to the
  # shared baseline), the real POST /projects call and the real
  # PUT /themes/project/{id} link call, verified through the public
  # GET /themes/project/{id} endpoint rather than through the UI that wrote it.
  # Nothing on the happy path is stubbed, so these scenarios prove the create
  # page, both service calls and the backend actually agree.
  #
  # Only the two states a healthy backend cannot produce on demand are staged
  # with a Playwright route: a failing link call (AC-4) and a slow link call.
  # The slow one is delayed and then passed through to the real backend, so the
  # project still ends up genuinely linked.
  #
  # Projects created here get a run-unique name rather than a fixed one that is
  # reset per run: DELETE /projects/{id} is broken (TypeDB 2.x syntax in
  # delete_project), so a created project cannot be cleaned up again. That also
  # makes reruns independent. `task test:e2e:reset` clears the leftovers.

  Background:
    Given the theme catalog contains the TS-015 baseline themes
    And I am authenticated in the browser as the TS-task-015 supervisor

  @ui @theme @TS-task-015
  Scenario: AC-1 the create form shows a theme section with nothing pre-selected
    When I open the project create page
    Then a "Thema's" section containing the theme picker is shown on the create form
    And the create form theme picker offers the whole theme catalog
    And no theme is selected on the create form

  @ui @theme @TS-task-015
  Scenario: AC-5 the theme section sits after the project fields and before the submit button
    When I open the project create page
    Then the theme section appears after the project detail fields
    And the theme section appears before the "Project aanmaken" button

  @ui @theme @TS-task-015
  Scenario: AC-2 a project is created without theme links when no theme is selected
    When I open the project create page
    And I fill in the create form for a new project "TS015 Project Zonder Thema"
    And I submit the create form
    Then the project "TS015 Project Zonder Thema" exists
    And I am taken to the page of project "TS015 Project Zonder Thema"
    And the project "TS015 Project Zonder Thema" has no linked themes
    And no theme link request was sent
    And no error message is shown

  @ui @theme @TS-task-015
  Scenario: AC-3 the selected themes are linked to the project after it is created
    When I open the project create page
    And I fill in the create form for a new project "TS015 Project Met Thema"
    And I select the themes "Duurzaamheid, Klimaat & Milieu" on the create form
    And I submit the create form
    Then the project "TS015 Project Met Thema" exists
    And the project "TS015 Project Met Thema" is linked to exactly the themes "Duurzaamheid, Klimaat & Milieu"
    And the themes of project "TS015 Project Met Thema" were linked in one request after the project was created
    And I am taken to the page of project "TS015 Project Met Thema"
    And no error message is shown

  # The other half of AC-3: "a single success flow (not two separate
  # operations)". The supervisor must never be told the work is done, or be
  # moved on, between the create call and the link call. Staged by delaying the
  # real link request so that in-between moment can be observed at all.
  @ui @theme @TS-task-015
  Scenario: AC-3 the submit stays in progress until the themes are linked
    Given the project theme link request is slow
    When I open the project create page
    And I fill in the create form for a new project "TS015 Project Trage Koppeling"
    And I select the themes "Duurzaamheid" on the create form
    And I submit the create form
    Then the create form is still submitting while the themes are being linked
    And I am still on the project create page while the themes are being linked
    And no success message is shown while the themes are being linked
    When the theme link request completes
    Then I am taken to the page of project "TS015 Project Trage Koppeling"
    And the project "TS015 Project Trage Koppeling" is linked to exactly the themes "Duurzaamheid"

  @ui @theme @TS-task-015
  Scenario: AC-4 a failed theme link keeps the created project and explains the failure
    Given the project theme link request fails
    When I open the project create page
    And I fill in the create form for a new project "TS015 Project Koppeling Mislukt"
    And I select the themes "Duurzaamheid" on the create form
    And I submit the create form
    Then the project "TS015 Project Koppeling Mislukt" exists
    And an error message explains that the themes could not be linked
    And I am taken to the page of project "TS015 Project Koppeling Mislukt"
    And the project "TS015 Project Koppeling Mislukt" has no linked themes

  # Edge of AC-2: "no themes selected" has to include themes that were selected
  # and then unselected again, not just a picker the supervisor never touched.
  @ui @theme @TS-task-015
  Scenario: Themes unselected again before submitting are not linked
    When I open the project create page
    And I fill in the create form for a new project "TS015 Project Thema Teruggedraaid"
    And I select the themes "Duurzaamheid" on the create form
    And I unselect the themes "Duurzaamheid" on the create form
    And I submit the create form
    Then the project "TS015 Project Thema Teruggedraaid" exists
    And I am taken to the page of project "TS015 Project Thema Teruggedraaid"
    And the project "TS015 Project Thema Teruggedraaid" has no linked themes
    And no theme link request was sent

  # The link call can only run with the id of a project that was really created,
  # so a failed create must not produce one. Staged with the real backend's
  # duplicate-name rejection instead of a stub: "E2E Infrastructure Proof
  # Project" already exists in this supervisor's business.
  @ui @theme @TS-task-015
  Scenario: No themes are linked when the project itself cannot be created
    When I open the project create page
    And I fill in the create form with the existing project name "E2E Infrastructure Proof Project"
    And I select the themes "Duurzaamheid" on the create form
    And I submit the create form
    Then an error message explains that the project name already exists
    And no theme link request was sent
    And I am still on the project create page
