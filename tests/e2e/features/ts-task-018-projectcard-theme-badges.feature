Feature: TS-task-018 theme badges on the authenticated project card

  As an authenticated user (student, supervisor or teacher)
  I want to see theme badges on project cards in the authenticated views
  So that I can visually identify project themes while browsing

  # Runs against the real stack end to end. The theme catalog is reset to the
  # shared deterministic baseline and the proof project's theme links are
  # re-established per scenario through the real PUT /themes/project/{id}, so the
  # badges are proven against real data rather than a stub. The baseline carries
  # the exact icon/color the issue's AC-1 example asserts on
  # (Duurzaamheid -> icon "eco", color #4CAF50).
  #
  # The authenticated card (ProjectCard) is rendered on two surfaces AC-1 names:
  # the overview page (/ontdek, data from GET /businesses/complete) and the
  # organisation page (/business/{id}, data from GET /businesses/{id}/projects).
  # Both are covered; the organisation page carries most scenarios because it
  # renders every project of the business, while the overview page collapses a
  # business to its first three cards until expanded.
  #
  # AC-1 and AC-2 speak of "the first theme". The backend does not guarantee an
  # order for a project's themes, so the single-theme scenarios assert the exact
  # icon, name and color, while the multi-theme scenarios assert that exactly one
  # badge is rendered, that it names one of the linked themes, and that the
  # remainder is summarised as "+N". Asserting a specific theme out of several
  # would be asserting an ordering the backend never promised.

  Background:
    Given the theme catalog is reset to the shared baseline themes

  @ui @theme @TS-task-018
  Scenario: AC-1 the linked theme is shown as a colored badge on the overview page
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as a student
    When I open the overview page filtered to the proof project
    Then the project card shows exactly one theme badge
    And the project card theme badge is labelled "Duurzaamheid"
    And the project card theme badge shows the Material Symbols icon "eco"
    And the project card theme badge uses the color "#4CAF50" as its background

  @ui @theme @TS-task-018
  Scenario: AC-1 the same badge is shown on the organisation page
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as a student
    When I open the organisation page of the project's business
    Then the project card shows exactly one theme badge
    And the project card theme badge is labelled "Duurzaamheid"
    And the project card theme badge shows the Material Symbols icon "eco"
    And the project card theme badge uses the color "#4CAF50" as its background

  @ui @theme @TS-task-018
  Scenario: AC-2 two extra themes are summarised as a +2 count
    Given the project's linked themes are "Duurzaamheid, Klimaat & Milieu, Onderwijs"
    And I am authenticated in the browser as a student
    When I open the organisation page of the project's business
    Then the project card shows exactly one theme badge
    And the project card theme badge names one of the project's linked themes
    And the project card theme badge shows the overflow count "+2"

  # Boundary between "one extra" and "several extra": the count must be the number
  # of themes NOT shown, not the total, and it must stay singular-correct at 1.
  @ui @theme @TS-task-018
  Scenario: AC-2 a single extra theme is summarised as a +1 count
    Given the project's linked themes are "Duurzaamheid, Klimaat & Milieu"
    And I am authenticated in the browser as a student
    When I open the organisation page of the project's business
    Then the project card shows exactly one theme badge
    And the project card theme badge names one of the project's linked themes
    And the project card theme badge shows the overflow count "+1"

  # The other half of AC-3: a single theme must never render a "+0".
  @ui @theme @TS-task-018
  Scenario: AC-2 a project with exactly one theme shows no overflow count
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as a student
    When I open the organisation page of the project's business
    Then the project card shows exactly one theme badge
    And the project card theme badge shows no overflow count

  @ui @theme @TS-task-018
  Scenario: AC-3 a project without themes shows no badge and keeps its layout
    Given the project's linked themes are cleared
    And I am authenticated in the browser as a student
    When I open the organisation page of the project's business
    Then the project card shows no theme badge
    And the project card shows no overflow count
    And the project card still shows its title, its open positions and its call to action

  @ui @theme @TS-task-018
  Scenario: AC-3 a project without themes shows no badge on the overview page either
    Given the project's linked themes are cleared
    And I am authenticated in the browser as a student
    When I open the overview page filtered to the proof project
    Then the project card shows no theme badge
    And the project card shows no overflow count

  # AC-4 compares the authenticated badge against the public card's badge for the
  # same project and the same theme, so "matches the public card pattern" is
  # proven against the live public card rather than against a copy of its classes.
  @ui @theme @TS-task-018
  Scenario: AC-4 the badge is styled exactly like the public project card badge
    Given the project's linked themes are "Duurzaamheid"
    And the project is publicly visible
    And I am authenticated in the browser as a student
    When I open the organisation page of the project's business
    And I record the styling of the project card theme badge
    And I open the public discovery page
    Then the public project card theme badge is styled identically to the recorded one

  # AC-5: the card renders badges from the project data it is handed. The
  # organisation page proves it, because nothing in that page's tree reads a theme
  # endpoint - so a badge on screen and zero theme requests together mean the data
  # came from the project object.
  @ui @theme @TS-task-018
  Scenario: AC-5 the badge is rendered without any extra theme request
    Given the project's linked themes are "Duurzaamheid"
    And I am authenticated in the browser as a student
    When I open the organisation page of the project's business
    Then the project card theme badge is labelled "Duurzaamheid"
    And no theme endpoint was requested while the page loaded

  # Not spelled out in the issue but real: icon and color are optional on a theme
  # (TS-task-009 AC-4 nests both as null). A themed project must still get a
  # readable badge instead of an empty or invisible one.
  @ui @theme @TS-task-018
  Scenario: A theme without an icon or color still renders a readable badge
    Given a theme "TS018 Thema Zonder Iconen" exists without an icon or color
    And the project's linked themes are "TS018 Thema Zonder Iconen"
    And I am authenticated in the browser as a student
    When I open the organisation page of the project's business
    Then the project card shows exactly one theme badge
    And the project card theme badge is labelled "TS018 Thema Zonder Iconen"
    And the project card theme badge shows no icon
    And the project card theme badge falls back to a visible neutral background

  # The card already carries an "Actief" badge in its top-left corner for a student
  # who works on the project. The theme badge shares that corner, so the two must
  # stack instead of covering each other, with the student's own work status kept
  # in the more prominent top position.
  @ui @theme @TS-task-018
  Scenario: The theme badge and the active-work badge are both readable
    Given the project's linked themes are "Duurzaamheid"
    And the student actively works on the project
    And I am authenticated in the browser as a student
    When I open the organisation page of the project's business
    Then the project card shows the active work badge
    And the theme badge and the active work badge do not overlap
    And the active work badge sits above the theme badge
