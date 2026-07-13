Feature: TS-task-010 theme management list on the teacher page

  As a docent (teacher)
  I want to see all themes in a manageable list on my teacher page
  So that I can oversee the theme catalog and reach the management actions

  # Theme data is stubbed at the network boundary. The shared E2E TypeDB seed
  # holds no themes and the other theme scenarios mutate the catalog without
  # cleanup, so a real-stack list assertion here would be order-dependent and
  # could never produce a loading/error state on demand.

  @ui @theme @TS-task-010
  Scenario: AC-1 the themes management section is visible on the teacher page
    Given I am authenticated in the browser as the TS-task-010 teacher
    And the themes endpoint returns the TS-task-010 sample catalog
    When I open the TeacherPage
    Then the themes management section should be visible

  @ui @theme @TS-task-010
  Scenario: AC-2 all themes are listed sorted by display order then name
    Given I am authenticated in the browser as the TS-task-010 teacher
    And the themes endpoint returns the TS-task-010 sample catalog
    When I open the TeacherPage
    Then the theme list should show every sample theme sorted by display order then name
    And every theme row should show its color swatch, icon, name, SDG code and description
    And the long theme description should be truncated while keeping the full text accessible

  @ui @theme @TS-task-010
  Scenario: AC-3 every theme row exposes edit and delete actions
    Given I am authenticated in the browser as the TS-task-010 teacher
    And the themes endpoint returns the TS-task-010 sample catalog
    When I open the TeacherPage
    Then every theme row should have a "Bewerken" and a "Verwijderen" action

  @ui @theme @TS-task-010
  Scenario: AC-4 a new theme button is available above the list
    Given I am authenticated in the browser as the TS-task-010 teacher
    And the themes endpoint returns the TS-task-010 sample catalog
    When I open the TeacherPage
    Then a "Nieuw thema" button should be visible and clickable

  @ui @theme @TS-task-010
  Scenario: AC-5 a loading indicator is shown while themes are being fetched
    Given I am authenticated in the browser as the TS-task-010 teacher
    And the themes endpoint returns the TS-task-010 sample catalog after a delay
    When I open the TeacherPage
    Then the theme loading indicator should be visible
    And the theme list should eventually show every sample theme

  @ui @theme @TS-task-010
  Scenario: AC-6 an error message is shown when the theme fetch fails
    Given I am authenticated in the browser as the TS-task-010 teacher
    And the themes endpoint fails
    When I open the TeacherPage
    Then the theme error message "Er is iets misgegaan bij het ophalen van de thema's." should be visible

  @ui @theme @TS-task-010
  Scenario: AC-7 an empty state is shown when there are no themes
    Given I am authenticated in the browser as the TS-task-010 teacher
    And the themes endpoint returns no themes
    When I open the TeacherPage
    Then the theme empty message "Nog geen thema's aangemaakt" should be visible
    And a "Nieuw thema" button should be visible and clickable

  @ui @theme @TS-task-010
  Scenario Outline: AC-8 non-teachers are redirected away from the teacher page
    Given I am authenticated in the browser as the TS-task-010 <role>
    When I open the TeacherPage
    Then I should be redirected to the not-found page
    And the themes management section should not be visible

    Examples:
      | role       |
      | student    |
      | supervisor |
