Feature: TS-task-011 theme create modal for teachers

  As a docent (teacher)
  I want to create new themes via a form on my teacher page
  So that I can expand the theme catalog beyond the initial seed data

  # The isolated E2E seed holds no themes and the sibling theme scenarios mutate
  # the shared catalog without cleanup, so both the GET /themes/ list and the
  # POST /themes create call are stubbed at the network boundary. This keeps the
  # create-modal behaviour deterministic and lets us assert on the exact request
  # payload the teacher form sends (display_order auto-assignment, comma-joined
  # SDG codes) as well as on backend error handling.

  @ui @theme @TS-task-011
  Scenario: AC-1 the create modal opens with empty fields from the Nieuw thema button
    Given I am authenticated in the browser as the TS-task-011 teacher
    And the themes endpoint returns the TS-task-011 sample catalog
    When I open the TeacherPage
    And I open the theme create modal
    Then the theme create modal should be visible
    And all theme create fields should be empty

  @ui @theme @TS-task-011
  Scenario: AC-2 the create form exposes every required field
    Given I am authenticated in the browser as the TS-task-011 teacher
    And the themes endpoint returns the TS-task-011 sample catalog
    When I open the TeacherPage
    And I open the theme create modal
    Then the create form should show a required "Naam" text field
    And the create form should show a "Beschrijving" textarea with a "0/500" character counter
    And the create form should offer SDG1 through SDG17 as labelled multi-select options
    And the create form should offer an icon dropdown of at least 80 predefined icons
    And the create form should show a native color picker with its hex value

  @ui @theme @TS-task-011
  Scenario: AC-3 the display order is auto-assigned and never shown to the teacher
    Given I am authenticated in the browser as the TS-task-011 teacher
    And the themes endpoint returns the TS-task-011 sample catalog
    And the theme create endpoint will succeed
    When I open the TeacherPage
    And I open the theme create modal
    Then the create form should not show a display order field
    When I fill in the theme name "Nieuw Duurzaam Thema"
    And I save the new theme
    Then the create request display_order should equal the highest sample display order plus one

  @ui @theme @TS-task-011
  Scenario: AC-4 a valid theme is created, listed and confirmed
    Given I am authenticated in the browser as the TS-task-011 teacher
    And the themes endpoint returns the TS-task-011 sample catalog
    And the theme create endpoint will succeed
    When I open the TeacherPage
    And I open the theme create modal
    And I fill in the theme name "Circulaire Economie"
    And I save the new theme
    Then the theme create modal should be closed
    And a "Thema aangemaakt" success message should be shown
    And a theme row named "Circulaire Economie" should be listed

  @ui @theme @TS-task-011
  Scenario: AC-5 a backend validation error keeps the modal open with an inline message
    Given I am authenticated in the browser as the TS-task-011 teacher
    And the themes endpoint returns the TS-task-011 sample catalog
    And the theme create endpoint will fail with status 400 and message "Naam is verplicht en mag maximaal 100 tekens zijn"
    When I open the TeacherPage
    And I open the theme create modal
    And I save the new theme
    Then the theme create modal should stay open
    And the inline create error "Naam is verplicht en mag maximaal 100 tekens zijn" should be shown

  @ui @theme @TS-task-011
  Scenario: AC-6 a duplicate name error is shown inline
    Given I am authenticated in the browser as the TS-task-011 teacher
    And the themes endpoint returns the TS-task-011 sample catalog
    And the theme create endpoint will fail with status 400 and message "Er bestaat al een thema met deze naam"
    When I open the TeacherPage
    And I open the theme create modal
    And I fill in the theme name "Duurzaamheid"
    And I save the new theme
    Then the theme create modal should stay open
    And the inline create error "Er bestaat al een thema met deze naam" should be shown

  @ui @theme @TS-task-011
  Scenario: AC-7 cancelling discards the input without creating a theme
    Given I am authenticated in the browser as the TS-task-011 teacher
    And the themes endpoint returns the TS-task-011 sample catalog
    And the theme create endpoint will succeed
    When I open the TeacherPage
    And I open the theme create modal
    And I fill in the theme name "Concept dat verdwijnt"
    And I cancel the theme create modal
    Then the theme create modal should be closed
    And no theme create request should have been sent
    When I open the theme create modal
    Then all theme create fields should be empty

  @ui @theme @TS-task-011
  Scenario: AC-8 selected SDGs are submitted as a comma-separated code
    Given I am authenticated in the browser as the TS-task-011 teacher
    And the themes endpoint returns the TS-task-011 sample catalog
    And the theme create endpoint will succeed
    When I open the TeacherPage
    And I open the theme create modal
    And I fill in the theme name "Water en Voedsel"
    And I select the SDG options "SDG2" and "SDG12"
    And I save the new theme
    Then the create request sdg_code should equal "SDG2,SDG12"

  @ui @theme @TS-task-011
  Scenario: AC-9 the icon dropdown renders each icon glyph alongside its name
    Given I am authenticated in the browser as the TS-task-011 teacher
    And the themes endpoint returns the TS-task-011 sample catalog
    When I open the TeacherPage
    And I open the theme create modal
    And I open the icon dropdown
    Then every icon option should render its Material Symbols glyph next to its name

  @ui @theme @TS-task-011
  Scenario: AC-10 the color picker uses a native color input and displays the chosen hex
    Given I am authenticated in the browser as the TS-task-011 teacher
    And the themes endpoint returns the TS-task-011 sample catalog
    When I open the TeacherPage
    And I open the theme create modal
    Then the color field should be a native color input
    When I pick the color "#123456"
    Then the color hex value "#123456" should be displayed next to the picker
