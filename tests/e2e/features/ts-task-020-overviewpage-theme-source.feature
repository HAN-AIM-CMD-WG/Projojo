Feature: TS-task-020 the overview page sources project themes from the business query

  As an authenticated user (student, supervisor or teacher)
  I want the overview page's theme badges and theme filter to cover every project I
  can see
  So that non-public projects with themes are not excluded from theme-based browsing

  # Runs against the real stack end to end. The theme catalog is reset to the shared
  # deterministic baseline per scenario, which also drops every project's theme
  # links, so each scenario stages exactly the links it asserts on and the theme
  # counts are exact rather than "at least". Project visibility is flipped through
  # the real PATCH /projects/{id}/visibility and verified against the real public
  # feed, so "not publicly visible" is a proven precondition and not an assumption -
  # which matters here, because the whole issue is about non-public projects.
  #
  # The two seeded projects this suite leans on:
  #
  # - the proof project (E2E Infrastructure Proof Project), of the E2E
  #   Infrastructure Business, flipped to non-public where the scenario needs it.
  # - the cross-business project (E2E Cross-Business Project), of a different
  #   organisation, kept public. Two organisations rather than two projects of one:
  #   the overview collapses a business to its first three cards, and a theme filter
  #   narrowing to different organisations is the case that exercises the whole
  #   filter chain. Every scenario's opening step waits for that card, so an
  #   assertion that a filter dropped it can never pass because it was never there.
  #
  # Honest note on what turns red before the fix. Exactly one scenario does: "AC-3
  # the theme badge is rendered without any per-project theme request". By the time
  # this task was picked up, /ontdek had already stopped mapping themes from
  # getPublicProjects() (commit c04874d) and was reading them per project via
  # GET /themes/project/{id} instead - so non-public projects already carried their
  # themes, at the cost of one request per project, which is what that scenario
  # forbids. Every other scenario here passes both before and after: they are the
  # regression guard that moving the data source onto GET /businesses/complete does
  # not re-introduce the public-only limitation the issue is named after. Worth
  # stating plainly rather than presenting the whole suite as proof of the fix.

  Background:
    Given the theme catalog is reset to the shared baseline themes
    And I am authenticated in the browser as a student

  Rule: Themes are read from the enriched business query (AC-3)

    # The core of the issue. The badge on screen plus the absence of any per-project
    # theme request together mean the theme data came from the business query: there
    # is no other request left that could have carried it. Asserting the business
    # query itself was seen keeps that from passing vacuously if the recording ever
    # missed the page's load.
    @ui @theme @overview @TS-task-020
    Scenario: AC-3 the theme badge is rendered without any per-project theme request
      Given the proof project is not publicly visible
      And the project's linked themes are "Duurzaamheid"
      When I open the overview page with its network traffic recorded
      And I filter on the theme "Duurzaamheid"
      Then the proof project card shows the theme badge "Duurzaamheid"
      And the overview page requested the enriched business query
      And the overview page requested no per-project theme endpoint

    # The other half of AC-3: the public project feed was the original theme source
    # and is what made the page public-only. It must not come back, and the page has
    # no other use for it.
    @ui @theme @overview @TS-task-020
    Scenario: AC-3 the overview page no longer reads the public project feed
      Given the project's linked themes are "Duurzaamheid"
      When I open the overview page with its network traffic recorded
      Then the overview page requested the enriched business query
      And the overview page requested no public project feed

    # Sharpens AC-3 beyond counting requests: with the theme catalog broken, the
    # filter pills are gone, and a badge that still renders can only have come from
    # the business query. A page that sourced badges from a theme endpoint would
    # lose them here.
    @ui @theme @overview @TS-task-020
    Scenario: AC-3 the theme badges survive a failed theme catalog load
      Given the project's linked themes are "Duurzaamheid"
      And the overview page's theme catalog fails to load
      When I open the overview page with its network traffic recorded
      And I search for the proof project
      And the search debounce elapses
      Then the proof project card shows the theme badge "Duurzaamheid"
      And the overview page offers no theme filter pills at all

  Rule: Non-public projects are no longer excluded from themes (AC-1, AC-2)

    @ui @theme @overview @TS-task-020
    Scenario: AC-1 a non-public project shows its theme badge
      Given the proof project is not publicly visible
      And the project's linked themes are "Duurzaamheid"
      When I open the overview page with its network traffic recorded
      And I search for the proof project
      And the search debounce elapses
      Then the proof project card shows the theme badge "Duurzaamheid"

    @ui @theme @overview @TS-task-020
    Scenario: AC-1 a non-public project is found by its theme filter
      Given the proof project is not publicly visible
      And the project's linked themes are "Duurzaamheid"
      When I open the overview page with its network traffic recorded
      And I filter on the theme "Duurzaamheid"
      Then the overview page shows the proof project

    # AC-2 in its smallest honest form: the issue's 6-public/4-non-public example
    # cannot be seeded here, but one project from each visibility set matching the
    # same theme proves the same thing - the filter is not partitioned by isPublic.
    @ui @theme @overview @TS-task-020
    Scenario: AC-2 the theme filter shows public and non-public matches together
      Given the proof project is not publicly visible
      And the project's linked themes are "Duurzaamheid"
      And the cross-business project is publicly visible
      And the cross-business project's linked themes are "Duurzaamheid"
      When I open the overview page with its network traffic recorded
      And I filter on the theme "Duurzaamheid"
      Then the overview page shows exactly the proof project and the cross-business project
      And the proof project card shows the theme badge "Duurzaamheid"
      And the cross-business project card shows the theme badge "Duurzaamheid"

    # The unhappy path AC-2 needs to stay meaningful: "both sets are shown" must not
    # be satisfiable by showing everything. A public project carrying a different
    # theme is still dropped.
    @ui @theme @overview @TS-task-020
    Scenario: AC-2 a project carrying a different theme is still excluded
      Given the proof project is not publicly visible
      And the project's linked themes are "Duurzaamheid"
      And the cross-business project is publicly visible
      And the cross-business project's linked themes are "Water"
      When I open the overview page with its network traffic recorded
      And I filter on the theme "Duurzaamheid"
      Then the overview page shows the proof project
      And the overview page does not show the cross-business project

    @ui @theme @overview @TS-task-020
    Scenario: A project without themes shows no badge
      Given the project's linked themes are cleared
      When I open the overview page with its network traffic recorded
      And I search for the proof project
      And the search debounce elapses
      Then the proof project card shows no theme badge

  Rule: The theme filter pills describe every accessible project (AC-4, AC-5)

    # AC-4's defect in miniature: a count sourced from the public feed would read 1
    # here, because only one of the two matching projects is public.
    @ui @theme @overview @TS-task-020
    Scenario: AC-4 the pill count includes non-public projects
      Given the proof project is not publicly visible
      And the project's linked themes are "Duurzaamheid"
      And the cross-business project is publicly visible
      And the cross-business project's linked themes are "Duurzaamheid"
      When I open the overview page with its network traffic recorded
      Then the theme filter pill "Duurzaamheid" shows the count "2"

    # The boundary case of the same count: a theme carried by nothing public at all
    # must read 1, not disappear.
    @ui @theme @overview @TS-task-020
    Scenario: AC-4 a theme carried only by a non-public project still counts it
      Given the proof project is not publicly visible
      And the project's linked themes are "Duurzaamheid"
      And the cross-business project's linked themes are cleared
      When I open the overview page with its network traffic recorded
      Then the theme filter pill "Duurzaamheid" shows the count "1"

    @ui @theme @overview @TS-task-020
    Scenario: AC-5 a theme no accessible project carries is not offered
      Given the project's linked themes are "Duurzaamheid"
      And the cross-business project's linked themes are cleared
      When I open the overview page with its network traffic recorded
      Then the theme filter pill "Duurzaamheid" shows the count "1"
      And the overview page offers no theme filter pill "Water"

    # AC-5's literal wording - "a theme that only applies to projects the user cannot
    # see". The archived organisation's project is exactly that: it is linked to the
    # theme, but its business is filtered out of the business query, so the theme has
    # zero visible projects and its pill must stay hidden.
    @ui @theme @overview @TS-task-020
    Scenario: AC-5 a theme carried only by a project outside the user's view is hidden
      Given the project's linked themes are "Duurzaamheid"
      And the cross-business project's linked themes are cleared
      And the archived organisation's project is linked to the theme "Water"
      When I open the overview page with its network traffic recorded
      Then the theme filter pill "Duurzaamheid" shows the count "1"
      And the overview page offers no theme filter pill "Water"

  Rule: The other filters are unchanged (AC-6)

    # Plain search, status and post-load theme filtering are already covered by the
    # BUG-404 suite, which runs in this same suite and against this same page; they
    # are not copied here. What is not covered anywhere is the skill filter that AC-6
    # names first, and the interaction between the theme filter and another filter -
    # the two things this change could plausibly disturb.
    #
    # What this scenario proves, and what it cannot. It proves the skill filter still
    # runs and still narrows: the exact set leaves no room for an organisation whose
    # projects carry no matching task to survive, and the open step above has already
    # established that the cross-business card was on the unfiltered page. It cannot
    # prove the matching semantics - the seed defines exactly one skill and every
    # seeded task requires it, so "all selected skills" and "any selected skill" are
    # the same predicate against this fixture. Telling those apart would mean adding
    # a second skill to a seed every suite shares, for a filter this task does not
    # touch; the limitation is recorded here rather than hidden behind a title that
    # claims more.
    @ui @theme @overview @TS-task-020
    Scenario: AC-6 the skill filter still narrows the list
      When I open the overview page with its network traffic recorded
      And I filter on the skill "Deterministisch Testen"
      Then the overview page shows exactly the proof project

    @ui @theme @overview @TS-task-020
    Scenario: AC-6 a search narrows the theme-filtered list further
      Given the project's linked themes are "Duurzaamheid"
      And the cross-business project is publicly visible
      And the cross-business project's linked themes are "Duurzaamheid"
      When I open the overview page with its network traffic recorded
      And I filter on the theme "Duurzaamheid"
      And I search for the proof project
      And the search debounce elapses
      Then the overview page shows the proof project
      And the overview page does not show the cross-business project

    # Both directions, because either half alone is vacuous: a filter that quietly
    # did nothing would leave the same page behind as a filter that was correctly
    # cleared, so the drop is asserted before the restore.
    #
    # The restore is asserted on the cross-business project rather than the proof
    # project - it is the card the filter actually removed, and the only one whose
    # presence on an UNFILTERED page is stable. The proof project's organisation
    # collects the projects TS-task-015 creates and cannot delete, and a business
    # renders only its first three, so asserting that card here would eventually fail
    # on fixture accumulation and read like a regression in this page.
    @ui @theme @overview @TS-task-020
    Scenario: AC-6 clearing the theme filter brings the other projects back
      Given the project's linked themes are "Duurzaamheid"
      And the cross-business project is publicly visible
      And the cross-business project's linked themes are cleared
      When I open the overview page with its network traffic recorded
      And I filter on the theme "Duurzaamheid"
      Then the overview page shows exactly the proof project
      When I clear the theme filter "Duurzaamheid"
      Then the overview page shows the cross-business project