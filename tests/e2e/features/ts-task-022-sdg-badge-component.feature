Feature: TS-task-022 SDG badge component with official UN colours

  As any user of Projojo
  I want themes to show their SDG as a badge in the official UN colour
  So that I understand which UN Sustainable Development Goal a theme supports

  # The SdgBadge component is exercised through the teacher theme catalog, the one
  # surface that renders a theme's sdg_code today. Every scenario resets the live
  # catalog to the TS-022 fixtures first, so the shared, mutable catalog cannot make
  # these assertions order-dependent (same contract as TS-task-010).
  #
  # Wiring the badge into the remaining theme surfaces is TS-task-023 and is out of
  # scope here; this suite only proves the component's own behaviour.

  Background:
    Given I am authenticated in the browser as the TS-task-022 teacher
    And the theme catalog contains only the TS-022 SDG fixtures

  @ui @theme @sdg @TS-task-022
  Scenario: AC-1 a single SDG code renders one badge in its official UN colour
    When I open the TeacherPage
    Then the theme "SDG Enkel" should show exactly 1 SDG badge
    And the SDG badge for "SDG12" on theme "SDG Enkel" should show the number "12"
    And the SDG badge for "SDG12" on theme "SDG Enkel" should be filled with "#BF8B2E"

  @ui @theme @sdg @TS-task-022
  Scenario: AC-2 all seventeen SDGs render in their official UN colours
    When I open the TeacherPage
    Then the theme "SDG Alle" should show exactly 17 SDG badges
    And every SDG badge on theme "SDG Alle" should be filled with its official UN colour

  @ui @theme @sdg @TS-task-022
  Scenario: AC-3 hovering a badge reveals the Dutch SDG name
    When I open the TeacherPage
    Then the tooltip of the SDG badge for "SDG12" on theme "SDG Enkel" should be hidden
    When I hover the SDG badge for "SDG12" on theme "SDG Enkel"
    Then the tooltip "Verantwoorde consumptie en productie" should become visible

  @ui @theme @sdg @TS-task-022
  Scenario: AC-4 clicking a badge opens the UN goal page in a new tab
    When I open the TeacherPage
    And I click the SDG badge for "SDG12" on theme "SDG Enkel"
    Then a new browser tab should have opened at "https://sdgs.un.org/goals/goal12"

  @ui @theme @sdg @TS-task-022
  Scenario: AC-5 a compound SDG code renders one badge per goal
    When I open the TeacherPage
    Then the theme "SDG Samengesteld" should show exactly 2 SDG badges
    And the SDG badges on theme "SDG Samengesteld" should be "SDG2" and "SDG12" in that order
    And each SDG badge on theme "SDG Samengesteld" should carry its own colour, tooltip and goal link

  @ui @theme @sdg @TS-task-022
  Scenario: AC-6 a theme without an SDG code renders no badge and no error
    Given I am recording browser errors
    When I open the TeacherPage
    Then the theme "SDG Geen" should show no SDG badge
    And the theme "SDG Geen" should still render its name and description
    And no browser error should have been recorded

  @ui @theme @sdg @TS-task-022
  Scenario Outline: AC-7 badge text is legible on both dark and light SDG fills
    When I open the TeacherPage
    Then the SDG badge for "<code>" on theme "<theme>" should have text colour "<textColour>"

    Examples:
      | theme      | code  | textColour |
      | SDG Donker | SDG17 | #FFFFFF    |
      | SDG Licht  | SDG7  | #000000    |

  @ui @theme @sdg @TS-task-022
  Scenario: AC-7 every SDG badge clears the WCAG AA contrast threshold
    When I open the TeacherPage
    Then every SDG badge on theme "SDG Alle" should meet WCAG AA contrast

  @ui @theme @sdg @TS-task-022
  Scenario: AC-8 a badge is announced with its full SDG name and exposed as a link
    When I open the TeacherPage
    Then the SDG badge for "SDG12" on theme "SDG Enkel" should be a link announced as "SDG 12: Verantwoorde consumptie en productie"
    And the number inside that badge should be hidden from assistive technology

  @ui @theme @sdg @TS-task-022
  Scenario: AC-8 a badge is reachable by keyboard and shows a visible focus indicator
    When I open the TeacherPage
    And I tab forwards until the SDG badge for "SDG12" on theme "SDG Enkel" has focus
    Then that SDG badge should show a focus indicator it does not show when unfocused
