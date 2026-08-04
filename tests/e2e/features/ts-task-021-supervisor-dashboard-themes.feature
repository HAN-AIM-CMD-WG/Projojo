Feature: TS-task-021 theme display on the supervisor dashboard

  As a begeleider (supervisor)
  I want to see theme pills on my projects in the Organisatiedashboard
  So that I have thematic context while managing my active projects and tasks

  # Runs against the real stack end to end. The theme catalog is reset to the shared
  # deterministic baseline per scenario, which also drops every project's theme
  # links, so each scenario stages exactly the links it asserts on and the pill
  # counts are exact rather than "at least". Links are staged through the real
  # PUT /themes/project/{id} (reusing the TS-task-019 Given steps), so the pills are
  # proven against real data rather than a stub. Nothing here is stubbed: every
  # state under test is one the real backend can produce.
  #
  # The page under test is the supervisor's HOME dashboard (SupervisorDashboard.jsx,
  # headed "Organisatiedashboard"), not the organisation page at /business/{id}.
  # Those are two different pages with two different cards: /business/{id} renders
  # the shared components/ProjectCard.jsx, whose theme badge TS-task-018 already
  # covers, while the dashboard renders its own compact card - a 96px row with a
  # small thumbnail, a title and a task count - defined locally in SupervisorDashboard.jsx.
  # Step text is therefore prefixed with "the dashboard", because Cucumber matches
  # step text globally and the TS-task-018 ("the project card theme badge ...") and
  # TS-task-019 ("the {string} theme pill ...") suites own similarly shaped steps.
  #
  # Three readings of the issue had to be settled before these scenarios could be
  # written; all three were confirmed with the issue owner and are recorded here
  # rather than left implicit:
  #
  # 1. AC-2 asks for "the theme color dot and name". Every other theme surface in
  #    this app (ProjectThemeBadge on both project cards, ProjectThemeSection on the
  #    details page, ThemePicker) renders a theme as a colour-FILLED pill carrying
  #    its Material Symbols icon and name, and THEME_SDG_IMPLEMENTATION_PLAN.md
  #    §2.3D asks for "theme pills" with no mention of a dot. The app pattern wins:
  #    these scenarios assert a colour-filled pill with icon and name.
  # 2. AC-4 says "at most 2-3 theme pills". Fixed at 2, so the count is testable.
  # 3. AC-1 speaks of "the project entry". Scoped to the "Mijn Projecten" cards -
  #    the only dashboard entries whose data carries a themes array at all. The
  #    last Rule below guards that scope.
  #
  # AC-1's example names "Duurzaamheid" and "Innovatie & Technologie". The shared
  # baseline catalog has no "Innovatie & Technologie", so "Klimaat & Milieu" stands
  # in for the second theme; the shape of the assertion is unchanged.
  #
  # The backend does not promise an order for a project's themes. Scenarios that
  # link more themes than fit therefore assert how MANY pills are shown and that
  # each names one of the linked themes, never which specific ones - asserting a
  # particular pair would be asserting an ordering nothing guarantees. Scenarios
  # that link one or two themes assert the exact names, icon and colour, because at
  # or below the limit every linked theme must be shown regardless of order.

  Background:
    Given the theme catalog is reset to the shared baseline themes
    And I am authenticated in the browser as the project's supervisor

  Rule: A supervisor's project card carries its linked themes (AC-1, AC-2)

    @ui @theme @dashboard @TS-task-021
    Scenario: AC-1 both linked themes are shown as pills on the project card
      Given the project's linked themes are "Duurzaamheid, Klimaat & Milieu"
      When I open the organisation dashboard
      Then the dashboard project card shows exactly 2 theme pills
      And the dashboard theme pills are exactly "Duurzaamheid, Klimaat & Milieu"

    @ui @theme @dashboard @TS-task-021
    Scenario: AC-2 a pill shows the theme's colour, icon and name
      Given the project's linked themes are "Duurzaamheid"
      When I open the organisation dashboard
      Then the dashboard project card shows exactly 1 theme pill
      And the dashboard theme pill is labelled "Duurzaamheid"
      And the dashboard theme pill shows the Material Symbols icon "eco"
      And the dashboard theme pill uses the color "#4CAF50" as its background

    # AC-2's "compact (small size, matching skill badge sizing)" needs a referent, and
    # the dashboard's own SkillBadge is the wrong one: that component renders at
    # px-4/py-2/text-xs, which is the full-size badge and anything but "small" on a
    # card row this dense. The referent taken here is the compact skill pill this app
    # puts ON project cards (PublicProjectCard), measured live rather than as
    # hardcoded pixel values.
    #
    # The bound is "no larger than" rather than "identical", because the two differ on
    # one axis and match on the other. The font size is the referent's exactly. The
    # horizontal padding is one step tighter: the dashboard gives its pills a ~200px
    # lane shared with the arrow and the overflow count, and at the referent's padding
    # the two theme names of the AC-1 example overran it by 9px and had their last
    # half-character clipped. Trading 2px of padding per side for whole words is worth
    # it on a card this dense.
    #
    # An upper bound is all this scenario claims. The lower bound - that the pills have
    # not been shrunk into illegibility - is held by the contrast scenarios further
    # down, which read the rendered colours off a pill that has to be visible first.
    @ui @theme @dashboard @TS-task-021
    Scenario: AC-2 the pills are no larger than the compact skill pill project cards use
      Given the project's linked themes are "Duurzaamheid"
      And the project is publicly visible
      When I open the organisation dashboard
      And I record the sizing of the dashboard theme pill
      And I open the public discovery page
      Then the recorded pill is no larger than the public project card skill pill

  Rule: A project without themes keeps its layout (AC-3)

    # "No pills or empty placeholder" is asserted as three separate absences, because
    # the obvious wrong implementations differ: an always-rendered wrapper, a "+0"
    # left over from the truncation branch, and a "Geen thema's" placeholder copied
    # from the details page. The last step is what makes this more than an absence
    # check - the row must still carry everything it carried before.
    @ui @theme @dashboard @TS-task-021
    Scenario: AC-3 a project without themes shows no pills and no placeholder
      Given the project's linked themes are cleared
      When I open the organisation dashboard
      Then the dashboard project card shows no theme pills
      And the dashboard project card shows no theme overflow count
      And the dashboard project card shows no empty theme placeholder
      And the dashboard project card still shows its title, its task count and its link to the project

  Rule: More themes than fit are truncated with a "+N" (AC-4)

    @ui @theme @dashboard @TS-task-021
    Scenario: AC-4 five linked themes are truncated to two pills and a "+3"
      Given the project's linked themes are "Duurzaamheid, Klimaat & Milieu, Onderwijs, Water, Alpha Thema"
      When I open the organisation dashboard
      Then the dashboard project card shows exactly 2 theme pills
      And every dashboard theme pill names one of the project's linked themes
      And the dashboard project card shows the theme overflow count "+3"

    # The boundary between "several hidden" and "one hidden": the count must be the
    # number of themes NOT shown, not the total, and must stay correct at 1.
    @ui @theme @dashboard @TS-task-021
    Scenario: AC-4 a single hidden theme is summarised as "+1"
      Given the project's linked themes are "Duurzaamheid, Klimaat & Milieu, Onderwijs"
      When I open the organisation dashboard
      Then the dashboard project card shows exactly 2 theme pills
      And every dashboard theme pill names one of the project's linked themes
      And the dashboard project card shows the theme overflow count "+1"

    # The other side of that boundary: exactly at the limit nothing is hidden, so a
    # "+0" must never appear.
    @ui @theme @dashboard @TS-task-021
    Scenario: AC-4 exactly two themes show no overflow count
      Given the project's linked themes are "Duurzaamheid, Klimaat & Milieu"
      When I open the organisation dashboard
      Then the dashboard project card shows exactly 2 theme pills
      And the dashboard project card shows no theme overflow count

    @ui @theme @dashboard @TS-task-021
    Scenario: AC-4 a single theme shows one pill and no overflow count
      Given the project's linked themes are "Duurzaamheid"
      When I open the organisation dashboard
      Then the dashboard project card shows exactly 1 theme pill
      And the dashboard project card shows no theme overflow count

  Rule: Themes never disturb the card's geometry (AC-3)

    # AC-3's "the layout adjusts cleanly" read narrowly is about the empty state, but
    # the defect it describes shows up on the way in: the first implementation put the
    # pills on a row of their own, which took a themed card from 96px to 151px while
    # its themeless neighbours stayed at 96px. Cards of differing heights in one grid
    # row leave a bare strip of card background under the shorter card's photo. The
    # pills therefore share the arrow's line, and this scenario is what holds them
    # there. Measured on the same project in both states so nothing but the themes
    # differs between the two readings.
    @ui @theme @dashboard @TS-task-021
    Scenario: Linking themes does not change the card's height
      Given the project's linked themes are cleared
      When I open the organisation dashboard
      And I record the height of the dashboard project card
      And the project's linked themes are "Duurzaamheid, Klimaat & Milieu, Onderwijs"
      And I open the organisation dashboard
      Then the dashboard project card shows exactly 2 theme pills
      And the dashboard project card has the recorded height

    # What keeps the scenario above true: a row that wrapped would add a line, and the
    # card would grow again. The pills shrink and truncate their names instead, so the
    # row holds whatever it is given.
    @ui @theme @dashboard @TS-task-021
    Scenario: The theme row never wraps onto a second line
      Given the project's linked themes are "Duurzaamheid, Klimaat & Milieu, Onderwijs"
      When I open the organisation dashboard
      Then the dashboard project card shows exactly 2 theme pills
      And the theme pills, the overflow count and the arrow sit on one line

    # The other half of the geometry: the thumbnail column has to run the full height
    # of the card. The first step keeps the second honest - if the card were only as
    # tall as its 96px thumbnail floor, a fixed-height image would satisfy "fills the
    # card" without proving it stretches at all.
    @ui @theme @dashboard @TS-task-021
    Scenario: The project image fills the full height of the card
      Given the project's linked themes are "Duurzaamheid, Klimaat & Milieu"
      When I open the organisation dashboard
      Then the dashboard project card is taller than its thumbnail minimum
      And the project image fills the height of the dashboard project card

  Rule: The themes come from the dashboard's own payload (AC-5)

    # The pills on screen plus the absence of any theme request together mean the
    # theme data came from the dashboard response: there is no other request left
    # that could have carried it. Asserting the dashboard call itself was recorded
    # keeps this from passing vacuously if the recording ever missed the page load.
    @ui @theme @dashboard @TS-task-021
    Scenario: AC-5 the pills are rendered without any extra theme request
      Given the project's linked themes are "Duurzaamheid"
      When I open the organisation dashboard
      Then the dashboard theme pill is labelled "Duurzaamheid"
      And the dashboard requested its own project data
      And no theme endpoint was requested while the dashboard loaded

  Rule: Every pill stays readable and is named for assistive technology

    # Not spelled out in the ACs but real: icon and colour are both optional on a
    # theme (TS-task-009 AC-4 nests both as null). A themed project must still get a
    # readable pill instead of an empty or invisible one. The colourless fallback is
    # the same coral the theme pills elsewhere in the app use.
    @ui @theme @dashboard @TS-task-021
    Scenario: A theme without an icon or colour still renders a readable pill
      Given a theme "TS021 Thema Zonder Iconen" exists without an icon or color
      And the project's linked themes are "TS021 Thema Zonder Iconen"
      When I open the organisation dashboard
      Then the dashboard project card shows exactly 1 theme pill
      And the dashboard theme pill is labelled "TS021 Thema Zonder Iconen"
      And the dashboard theme pill shows no icon
      And the dashboard theme pill falls back to the colorless theme fill
      And the dashboard theme pill text is legible against its background

    # The technical notes require WCAG AA contrast on the pill background. A light
    # theme colour is the case that breaks a hardcoded white label: white on
    # near-white is invisible. The text colour must follow the theme colour.
    @ui @theme @dashboard @TS-task-021
    Scenario: A light theme colour gets dark text instead of unreadable white
      Given a theme "TS021 Wit Thema" exists with the color "#FFFFFF"
      And the project's linked themes are "TS021 Wit Thema"
      When I open the organisation dashboard
      Then the dashboard theme pill uses the color "#FFFFFF" as its background
      And the dashboard theme pill uses dark text
      And the dashboard theme pill text is legible against its background

    # The counterpart, so the previous scenario cannot be satisfied by flipping the
    # constant from white to black: a dark theme colour must still get white text.
    @ui @theme @dashboard @TS-task-021
    Scenario: A dark theme colour keeps white text
      Given a theme "TS021 Donker Thema" exists with the color "#1B2A4A"
      And the project's linked themes are "TS021 Donker Thema"
      When I open the organisation dashboard
      Then the dashboard theme pill uses the color "#1B2A4A" as its background
      And the dashboard theme pill uses white text
      And the dashboard theme pill text is legible against its background

    # The technical notes ask for an aria-label carrying the theme name. It is not
    # decorative here: the whole card is one link, so each pill's label folds into
    # the link's accessible name and tells a screen-reader user that the word is a
    # theme rather than a skill or a status.
    @ui @theme @dashboard @TS-task-021
    Scenario: Each theme pill is labelled for assistive technology with its theme name
      Given the project's linked themes are "Duurzaamheid, Klimaat & Milieu"
      When I open the organisation dashboard
      Then every dashboard theme pill carries an aria-label naming its own theme
      And the pill icons are hidden from assistive technology

  Rule: Only the project cards carry theme pills

    # The scope guard, and not a vacuous one: the seeded dashboard also shows a
    # pending registration and active students that all reference this same themed
    # project by name. If the pills were rendered from a project name rather than
    # from the project object, or sprayed across every dashboard entry, this fails.
    @ui @theme @dashboard @TS-task-021
    Scenario: The registration and active-student entries carry no theme pills
      Given the project's linked themes are "Duurzaamheid"
      When I open the organisation dashboard
      Then the dashboard project card shows exactly 1 theme pill
      And the dashboard shows a pending registration and an active student for that project
      And no theme pill is shown outside the project cards
