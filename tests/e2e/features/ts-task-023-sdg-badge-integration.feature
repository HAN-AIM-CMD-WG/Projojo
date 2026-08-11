Feature: TS-task-023 SDG badge integration across theme views

  As any user of Projojo
  I want SDG badges shown wherever themes are displayed
  So that the SDG dimension is consistently visible and never hidden in the data

  # TS-task-022 built the SdgBadge and wired it into the teacher theme catalog. This
  # task carries the same badge onto every other surface a theme appears on: the SDG
  # picker inside the create/edit modal (AC-2), the ThemePicker pills (AC-3), the
  # project details theme section (AC-4) and the project cards (AC-5) - while a theme
  # with no SDG code stays badge-free everywhere (AC-6).
  #
  # Runs against the real stack. Expected SDG colours, names, codes and goal URLs
  # come from support/sdg-catalog.cjs, which hardcodes them from the issue rather
  # than importing the component's own table, so these assertions answer to the
  # specification, not to the code under test.
  #
  # Where the badge is a link vs a passive indicator is deliberate, not incidental:
  #   - Teacher catalog, ThemePicker pills and the details pills carry the clickable
  #     link to the goal's UN page (the SdgBadge default) - they are safe places for
  #     it: the picker/details badges sit ADJACENT to their pill, so the link is a
  #     sibling, never nested inside another control.
  #   - The project cards render a NON-interactive badge (colour + hover/focus
  #     tooltip only): the whole card is a single <Link>, and a nested <a> there is
  #     invalid HTML. The issue's AC-5 explicitly allows a tooltip when space is
  #     tight, which is exactly this case.

  # --- AC-1: the teacher theme management list -----------------------------------

  # TS-task-022 owns the badge's deep behaviour on this surface; here we assert only
  # the integration claim of AC-1 - the badge renders in the theme's own row, beside
  # its name - reusing the TS-022 row steps so this cannot drift from that suite.
  @ui @theme @sdg @TS-task-023
  Scenario: AC-1 the theme management list shows a theme's SDG badge in its row
    Given I am authenticated in the browser as the TS-task-022 teacher
    And the theme catalog contains only the TS-022 SDG fixtures
    When I open the TeacherPage
    Then the theme "SDG Enkel" should show exactly 1 SDG badge
    And the SDG badge for "SDG12" on theme "SDG Enkel" should show the number "12"
    And the theme row "SDG Enkel" shows its SDG badge for "SDG12" beside the theme name

  # --- AC-2: the SDG picker inside the create/edit modal --------------------------

  # The create and edit modals render the same shared ThemeForm, so proving the
  # colour preview in the create modal proves it for both.
  @ui @theme @sdg @TS-task-023
  Scenario: AC-2 each SDG picker option shows its official UN colour beside the label
    Given I am authenticated in the browser as the TS-task-022 teacher
    And the theme catalog contains only the TS-022 SDG fixtures
    When I open the TeacherPage
    And I open the theme create modal
    And I open the SDG code dropdown
    Then the SDG option "SDG12" shows a UN colour preview filled with "#BF8B2E"
    And the SDG option "SDG12" still reads "SDG12 — Verantwoorde consumptie en productie"
    And every SDG option shows a UN colour preview in its own official UN colour

  # --- AC-3: the ThemePicker pills -----------------------------------------------

  # Driven through the ThemePicker dev harness (/dev/theme-picker) with a stubbed
  # catalog, the same way TS-task-014 isolates the component. A themed and an
  # unthemed theme together prove both the presence and the absence of the badge.
  @ui @theme @sdg @TS-task-023
  Scenario: AC-3 a ThemePicker pill carries the SDG badge for a theme that has an SDG code
    Given the theme picker lists a theme "Duurzaamheid" with SDG code "SDG12" and a theme "Zonder SDG" with no SDG code
    When I open the SDG-themed theme picker demo
    Then the theme picker pill "Duurzaamheid" shows an adjacent SDG badge for "SDG12"
    And the picker SDG badge for "SDG12" links to the UN goal page for "SDG12"
    And the theme picker pill "Zonder SDG" shows no SDG badge

  # --- AC-4: the project details theme section -----------------------------------

  @ui @theme @sdg @TS-task-023
  Scenario: AC-4 the project details theme pills carry their SDG badge as a UN goal link
    Given the theme catalog contains only the TS-022 SDG fixtures
    And the project's linked themes are "SDG Enkel"
    And I am authenticated in the browser as a student
    When I open the project details page
    Then the project theme pill "SDG Enkel" shows an adjacent SDG badge for "SDG12"
    And the details SDG badge for "SDG12" links to the UN goal page for "SDG12"

  # AC-6 on the details surface. "SDG Enkel" is the positive control, so "no badge"
  # on "SDG Geen" cannot pass for a section that simply renders no badges at all.
  @ui @theme @sdg @TS-task-023
  Scenario: AC-6 a details theme pill without an SDG code shows no badge and renders normally
    Given the theme catalog contains only the TS-022 SDG fixtures
    And the project's linked themes are "SDG Enkel, SDG Geen"
    And I am authenticated in the browser as a student
    When I open the project details page
    Then the project theme pill "SDG Enkel" shows an adjacent SDG badge for "SDG12"
    And the project theme pill "SDG Geen" shows no SDG badge
    And the "SDG Geen" theme pill is labelled "SDG Geen"

  # --- AC-5: the project cards ----------------------------------------------------

  @ui @theme @sdg @TS-task-023
  Scenario: AC-5 the organisation project card shows the primary theme's SDG badge
    Given the theme catalog contains only the TS-022 SDG fixtures
    And the project's linked themes are "SDG Enkel"
    And I am authenticated in the browser as a student
    When I open the organisation page of the project's business
    Then the project card shows exactly one theme badge
    And the project card theme badge shows an SDG badge for "SDG12"
    And the project card SDG badge is a passive indicator, not a link

  # A theme can carry several SDG codes. The card draws up to two goal badges; two
  # codes fit exactly, so both show and no "+N" appears.
  @ui @theme @sdg @TS-task-023
  Scenario: AC-5 a project card whose primary theme has two SDG codes shows both badges
    Given the theme catalog contains only the TS-022 SDG fixtures
    And the project's linked themes are "SDG Samengesteld"
    And I am authenticated in the browser as a student
    When I open the organisation page of the project's business
    Then the project card shows exactly one theme badge
    And the project card theme badge shows an SDG badge for "SDG2"
    And the project card theme badge shows an SDG badge for "SDG12"
    And the project card shows exactly 2 SDG badges
    And the project card SDG badges show no overflow count

  # Beyond two goals the card caps at the first two badges and collapses the rest into
  # a "+N" count, the same way several themes collapse into the theme badge's own "+N" -
  # so the badges never run across the status badge in the opposite corner.
  @ui @theme @sdg @TS-task-023
  Scenario: AC-5 a project card whose primary theme has many SDG codes caps at two badges with a +N count
    Given the theme catalog contains only the TS-022 SDG fixtures
    And the project's linked themes are "SDG Alle"
    And I am authenticated in the browser as a student
    When I open the organisation page of the project's business
    Then the project card shows exactly one theme badge
    And the project card theme badge shows an SDG badge for "SDG1"
    And the project card theme badge shows an SDG badge for "SDG2"
    And the project card shows exactly 2 SDG badges
    And the project card SDG badge shows an overflow count of "+15"

  @ui @theme @sdg @TS-task-023
  Scenario: AC-5 the public project card shows the primary theme's SDG badge
    Given the theme catalog contains only the TS-022 SDG fixtures
    And the project's linked themes are "SDG Enkel"
    And the project is publicly visible
    When I open the public discovery page
    Then the public project card theme badge shows an SDG badge for "SDG12"

  # AC-6 on the card surface: a project whose primary theme has no SDG code keeps its
  # single theme badge but shows no SDG badge.
  @ui @theme @sdg @TS-task-023
  Scenario: AC-6 a project card whose primary theme has no SDG code shows no SDG badge
    Given the theme catalog contains only the TS-022 SDG fixtures
    And the project's linked themes are "SDG Geen"
    And I am authenticated in the browser as a student
    When I open the organisation page of the project's business
    Then the project card shows exactly one theme badge
    And the project card theme badge shows no SDG badge
