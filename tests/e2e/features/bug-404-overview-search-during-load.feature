Feature: BUG-404 the overview page filter survives the initial load

  As an authenticated user browsing the overview page
  I want the search box to filter the projects that eventually load
  So that typing quickly after opening /ontdek does not leave me on a permanently
  empty page

  # Runs against the real stack end to end. Nothing is stubbed: the race scenarios
  # hold a real backend response inside a Playwright route and release it later, so
  # the response the page finally receives is still the one the backend produced.
  # Holding it is what makes the race deterministic - on the local stack
  # /businesses/complete answers in ~50ms, which is far too fast to type into
  # reliably, and the issue measured 0 project cards on 3 out of 3 such runs.
  #
  # The defect has two halves, and which one fires depends on the ordering:
  #
  #   - the debounce fires BEFORE the data arrives: the filter runs against the
  #     still-empty list, and the page's own load then overwrites that result with
  #     the UNFILTERED list.
  #   - the data arrives BEFORE the debounce fires: the debounced callback still
  #     holds the render the keystroke landed in, so it filters an empty list and
  #     the page ends up EMPTY for good.
  #
  # Each ordering gets its own scenario and both assert the same pair: the matching
  # project is shown AND the non-matching one is not. Asserting only the first would
  # pass on the unfiltered list - which is exactly why the issue's 1500ms
  # measurement showed 2 cards and looked healthy while the page was in fact broken.
  #
  # "The proof project" is the seeded E2E Infrastructure Proof Project. "The
  # cross-business project" is the seeded E2E Cross-Business Project: a project of a
  # different organisation whose project name, project location, organisation name
  # and organisation location all fail to match the search term, so a correctly
  # filtered list must not contain it. The Background asserts both are on the
  # unfiltered page, so "does not show the cross-business project" can never pass
  # for the trivial reason that it was never there.

  Background:
    Given I am authenticated in the browser as a student
    And the overview page has loaded showing both seeded projects

  Rule: A filter set during the initial load is applied to the data that arrives

    # AC-1 + AC-2, ordering 1: the debounce fires against the empty list first. The
    # "while no projects are shown" steps are what pins the ordering down - they
    # fail loudly if the data sneaked in early, rather than letting the scenario
    # quietly prove the other ordering.
    @ui @overview @BUG-404
    Scenario: AC-1 a search typed before the projects arrive is applied once they do
      Given the overview page's project list is held back
      When I reopen the overview page with no projects loaded yet
      And I search for the proof project while no projects are shown
      And the search debounce elapses while no projects are shown
      And the overview page has not called the still-loading list empty
      And the held back data is released
      Then the overview page shows the proof project
      And the overview page does not show the cross-business project

    # AC-1 + AC-2, ordering 2: the projects arrive first, so the debounced callback
    # fires afterwards and is the last writer. Here the data is released immediately
    # after the keystroke and the assertion is only made once the debounce window
    # has passed, so a result that appears and is then wiped still fails.
    #
    # It holds the theme catalog rather than the project list, because /ontdek
    # publishes its list only once both of those have settled: releasing the catalog
    # puts the already-fetched projects on screen within one local round trip,
    # comfortably inside the 300ms debounce, which holding the list itself would not
    # reliably do. "Already-fetched" is not free here - unlike the reads this used to
    # hold, the catalog is requested alongside the project list rather than after it -
    # so the reopen step waits for the project response to reach the browser before
    # the search below is typed.
    #
    # The ordering is asserted, not assumed. On a slow enough runner the release
    # stops beating the debounce, and without the guard this scenario would silently
    # become a second copy of the one above and stop testing the half of the defect
    # the issue actually measured.
    #
    # That guard does fire in practice, and when it does it is reporting the runner,
    # not the page. Observed: three consecutive isolated runs tripped it while the same
    # suite passed six consecutive times in the same session, and what tracked was the
    # run's own duration - 51s, 53s and 42s when it fired against 29s to 32s when it
    # did not - not anything about the stack's state. Rerun on an unloaded machine.
    #
    # Warming the stack does not help, and the Background is why: it renders /ontdek
    # with both cards before every scenario, so the module graph, the business query
    # and the theme catalog are already warm by the time this scenario stages anything.
    # There is no first-run cost left for a preflight warm-up to lift off the measured
    # path - that was tried, and reverted, for exactly this reason.
    @ui @overview @BUG-404
    Scenario: AC-1 a search typed just before the projects arrive is not wiped by the debounce
      Given the overview page's theme catalog is held back
      When I reopen the overview page with no projects loaded yet
      And I search for the proof project while no projects are shown
      And the held back data is released
      And the projects arrive before the debounce fires
      And the search debounce elapses
      Then the overview page shows the proof project
      And the overview page does not show the cross-business project

    # AC-2 names seven filters, but only the ones whose control renders before the
    # list can be set during the load: the search box, the status segment, the
    # skills panel and "Mijn werk". The sector, location, company-size and theme
    # controls are built from the project list itself and are simply absent until it
    # arrives. "Mijn werk" is covered here because it is the other kind of filter -
    # it calls the page back immediately instead of through the 300ms debounce, so
    # it exercises the missing re-application on its own, with no stale timer
    # involved.
    @ui @overview @BUG-404
    Scenario: AC-2 an undebounced filter set during the load is applied to the arriving projects
      Given the overview page's project list is held back
      When I reopen the overview page with no projects loaded yet
      And I filter on my own work while no projects are shown
      And the held back data is released
      Then the overview page shows the proof project
      And the overview page does not show the cross-business project

  Rule: The existing filter behaviour is unchanged (AC-3)

    @ui @overview @BUG-404
    Scenario: AC-3 searching after the projects have loaded still filters the list
      When I search for the proof project
      And the search debounce elapses
      Then the overview page shows the proof project
      And the overview page does not show the cross-business project

    @ui @overview @BUG-404
    Scenario: AC-3 clearing the search restores the full list
      Given I have searched for the proof project
      When I clear the search
      Then the overview page shows the proof project
      And the overview page shows the cross-business project

    @ui @overview @BUG-404
    Scenario: AC-3 a search that matches nothing reports it and shows no projects
      When I search for "geen-enkel-project-heet-zo"
      And the search debounce elapses
      Then the overview page shows no projects
      And the overview page reports no results for "geen-enkel-project-heet-zo"

    # The debounce is the reason the defect exists, so a fix that simply removed it
    # would satisfy every scenario above. "E2E I" is the shortest term that tells the
    # two apart: it matches the proof organisation's name and no part of the
    # cross-business organisation or its project, so an undebounced filter would drop
    # that card during the same tick the keystroke was handled.
    # AC-3 names seven filters. The search covers the debounced path; these two cover
    # the other two shapes the filter chain is built from - a whole-organisation drop
    # (status) and a per-project narrowing that then drops emptied organisations
    # (theme). Sector, location and company size are the same shape as one of these
    # two and are left uncovered on purpose: the seed gives every organisation the
    # same sector and size, so those scenarios could only assert that nothing
    # changed, and their controls live behind the map panel.
    #
    # Both seeded projects run to 2030, so "Archief" must empty the list. If the
    # status branch stopped narrowing, both cards would simply stay on screen.
    @ui @overview @BUG-404
    Scenario: AC-3 the status filter still narrows the list after loading
      When I filter on archived projects
      Then the overview page shows no projects
      And the overview page reports no results mentioning "status: completed"

    # The theme filter reads project.themes, and TS-task-020 (#303) changes where
    # /ontdek sources exactly that. This is the branch that change can break silently.
    @ui @overview @BUG-404
    Scenario: AC-3 the theme filter still narrows the list after loading
      Given the theme catalog is reset to the shared baseline themes
      And the project's linked themes are "Duurzaamheid"
      When I reopen the overview page with its projects loaded
      And I filter on the theme "Duurzaamheid"
      Then the overview page shows the proof project
      And the overview page does not show the cross-business project

    # Not an acceptance criterion but a deliberate change made by this fix: filtering
    # used to clear the page error first, so a user who typed after a failed load was
    # told "Geen resultaten gevonden voor …" and never learned the projects had not
    # loaded at all.
    @ui @overview @BUG-404
    Scenario: A failed project load keeps saying so when the user searches
      Given the overview page's project list fails to load
      When I open the overview page and it reports the load failure
      And I search for the proof project
      And the search debounce elapses
      Then the overview page still reports the same load failure

    @ui @overview @BUG-404
    Scenario: AC-3 the search is still debounced
      When I search for "E2E I"
      Then the overview page still shows the cross-business project right after typing
      And the overview page drops the cross-business project once the debounce elapses