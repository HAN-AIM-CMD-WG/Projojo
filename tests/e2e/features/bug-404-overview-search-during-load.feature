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
      And the held back data is released
      Then the overview page shows the proof project
      And the overview page does not show the cross-business project

    # AC-1 + AC-2, ordering 2: the projects arrive first, so the debounced callback
    # fires afterwards and is the last writer. Here the data is released immediately
    # after the keystroke and the assertion is only made once the debounce window
    # has passed, so a result that appears and is then wiped still fails.
    #
    # It holds the per-project theme reads rather than the project list, because
    # those are the last thing /ontdek awaits before publishing the list: releasing
    # them puts the data on screen within one local round trip, comfortably inside
    # the 300ms debounce, which holding the list itself would not reliably do.
    # TS-task-020 (#303) removes that theme read from this page - when it lands,
    # this scenario has to be repointed at whatever /ontdek then awaits last. It
    # will say so rather than quietly pass: the step that opens the page fails if
    # nothing was held back.
    @ui @overview @BUG-404
    Scenario: AC-1 a search typed just before the projects arrive is not wiped by the debounce
      Given the overview page's project themes are held back
      When I reopen the overview page with no projects loaded yet
      And I search for the proof project while no projects are shown
      And the held back data is released
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
    @ui @overview @BUG-404
    Scenario: AC-3 the search is still debounced
      When I search for "E2E I"
      Then the overview page still shows the cross-business project right after typing
      And the overview page drops the cross-business project once the debounce elapses