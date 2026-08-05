Feature: TS-task-014 reusable ThemePicker component

  As a begeleider (supervisor)
  I want a visual theme picker where I can select themes for my project
  So that I can tag projects with relevant themes in an intuitive way

  # The ThemePicker is a standalone, reusable component. It is exercised here
  # through a dedicated harness route (/dev/theme-picker) that mounts one
  # URL-configurable instance (readonly + pre-selected via query params) plus a
  # visible onChange read-out, so every prop can be driven in isolation.
  # Its production consumers - project create (TS-task-015), project edit
  # (TS-task-016) and the inline editor on the details page (TS-task-017) - each
  # have their own suite and all mount it as an editable picker, so read-only
  # mode is covered here and nowhere else.
  #
  # GET /themes/ is stubbed (support/theme-stub.cjs). The component's only backend
  # dependency is that theme list, so stubbing it deterministically drives the
  # exact catalog, the loading delay and the empty catalog these ACs require -
  # states a healthy backend cannot produce on demand.

  @ui @theme @TS-task-014
  Scenario: AC-1 all themes render as pills with a color dot and name
    Given the theme picker demo has 6 themes available
    When I open the theme picker demo
    Then 6 theme pills are shown
    And each theme pill shows a color dot and its theme name

  @ui @theme @TS-task-014
  Scenario: AC-2 an unselected pill has a neutral outline with a visible color dot
    Given the theme picker demo has 6 themes available
    When I open the theme picker demo
    Then the "Duurzaamheid" pill is not selected
    And the "Duurzaamheid" pill has a neutral outlined appearance
    And the "Duurzaamheid" pill shows a color dot matching its theme color

  @ui @theme @TS-task-014
  Scenario: AC-3 a selected pill is filled with its theme color and keeps legible text
    Given the theme picker demo has 6 themes available
    When I open the theme picker demo
    And I click the "Duurzaamheid" theme pill
    And I click the "Innovatie" theme pill
    Then the "Duurzaamheid" pill is filled with its theme color
    And the "Duurzaamheid" pill text stays legible against its background
    And the "Innovatie" pill is filled with its theme color
    And the "Innovatie" pill text stays legible against its background

  # Coverage guard for AC-3: legibility must hold for the component's whole
  # catalog, not the two comfortable colors above.
  @ui @theme @TS-task-014
  Scenario: AC-3 every theme keeps AA-legible text when selected
    Given the theme picker demo has 6 themes available
    When I open the theme picker demo
    And I select every theme pill
    Then every selected pill keeps legible text against its background

  @ui @theme @TS-task-014
  Scenario: AC-4 clicking a pill toggles it selected then unselected
    Given the theme picker demo has 6 themes available
    When I open the theme picker demo
    Then the "Water" pill is not selected
    When I click the "Water" theme pill
    Then the "Water" pill is selected
    When I click the "Water" theme pill
    Then the "Water" pill is not selected

  @ui @theme @TS-task-014
  Scenario: AC-5 all themes can be selected with no limit
    Given the theme picker demo has 6 themes available
    When I open the theme picker demo
    And I select every theme pill
    Then all 6 theme pills are selected
    And no selection limit warning is shown

  @ui @theme @TS-task-014
  Scenario: AC-6 pre-selected themes render in their selected state
    Given the theme picker demo has 6 themes available
    When I open the theme picker demo with "Duurzaamheid" and "Onderwijs" pre-selected
    Then the "Duurzaamheid" pill is selected
    And the "Onderwijs" pill is selected
    And the "Water" pill is not selected

  @ui @theme @TS-task-014
  Scenario: AC-7 read-only mode shows selected themes that cannot be toggled
    Given the theme picker demo has 6 themes available
    When I open the read-only theme picker demo showing "Duurzaamheid" and "Onderwijs"
    Then only the "Duurzaamheid" and "Onderwijs" pills are shown
    And the "Duurzaamheid" pill does not use a pointer cursor
    When I try to click the read-only "Duurzaamheid" pill
    Then the "Duurzaamheid" pill is still shown
    And the selection change callback reports no selection

  # Controlled-contract guard: the picker renders the current `selected` prop, so
  # a selection the parent supplies after mount (e.g. from an async fetch) is
  # reflected rather than cached from mount time. Read-only here, so there is no
  # in-progress edit to reconcile - once selection is the parent's to own, the
  # "don't overwrite my edits" case is the parent's decision, not the picker's.
  @ui @theme @TS-task-014
  Scenario: Read-only selection arriving after mount is reflected once it loads
    Given the theme picker demo has 6 themes available
    When I open the read-only theme picker demo with delayed selection of "Duurzaamheid" and "Onderwijs"
    Then no theme pills are shown
    When the delayed selection arrives
    Then the "Duurzaamheid" and "Onderwijs" pills appear once the selection loads

  @ui @theme @TS-task-014
  Scenario: AC-8 toggling reports the current selected ids through onChange
    Given the theme picker demo has 6 themes available
    When I open the theme picker demo
    Then the selection change callback reports no selection
    When I click the "Duurzaamheid" theme pill
    Then the selection change callback reports "Duurzaamheid"
    When I click the "Onderwijs" theme pill
    Then the selection change callback reports "Duurzaamheid" and "Onderwijs"
    When I click the "Duurzaamheid" theme pill
    Then the selection change callback reports "Onderwijs"

  @ui @theme @TS-task-014
  Scenario: AC-9 a loading state shows skeleton pills while themes are fetched
    Given the theme picker demo is slow to return 6 themes
    When I open the theme picker demo
    Then a loading state with skeleton pills is shown
    And the loading state is replaced by 6 theme pills once loaded

  @ui @theme @TS-task-014
  Scenario: AC-10 an empty catalog shows the empty-state message
    Given the theme picker demo has no themes available
    When I open the theme picker demo
    Then the empty state message "Geen thema's beschikbaar" is shown
    And no theme pills are shown

  @ui @theme @TS-task-014
  Scenario: AC-11 pills are keyboard focusable and toggle with Enter and Space
    Given the theme picker demo has 6 themes available
    When I open the theme picker demo
    And I focus the "Klimaat & Milieu" theme pill
    Then the "Klimaat & Milieu" pill is keyboard focusable
    And the focused pill shows a 3px primary color focus ring
    When I press "Space" on the focused pill
    Then the "Klimaat & Milieu" pill is selected
    When I press "Enter" on the focused pill
    Then the "Klimaat & Milieu" pill is not selected
