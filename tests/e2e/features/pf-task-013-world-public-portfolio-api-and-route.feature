@portfolio @public-portfolio
Feature: PF-task-013 world-public portfolio API and minimal frontend route shell

  An unauthenticated public visitor views a student's published portfolio by vanity slug. The
  world-public API at GET /portfolio/{slug} returns only the work and reviews the student
  intentionally made public, exposes a student-safe response shape (no authenticated-only fields),
  and safely hides private and unknown slugs. A minimal, chrome-less frontend route at
  /portfolio/{slug} renders the public page without authentication.

  # AC-1 — A private (not world-public) slug returns no data.

  @api @pf-task-013
  Scenario: AC-1 A private portfolio slug returns not-found and leaks no data
    When PF-task-013 the public portfolio is requested for the "private" slug
    Then PF-task-013 the public response status should be 404
    And PF-task-013 the public response should expose only an error detail

  # AC-5 — An unknown slug returns no data and leaks no student existence or suggestions.

  @api @pf-task-013
  Scenario: AC-5 An unknown portfolio slug returns not-found and leaks no data
    When PF-task-013 the public portfolio is requested for the "unknown" slug
    Then PF-task-013 the public response status should be 404
    And PF-task-013 the public response should expose only an error detail

  # AC-2 — A world-public page with no world-visible items returns identity + summary only.

  @api @pf-task-013
  Scenario: AC-2 A world-public summary-only page returns identity and summary without items
    When PF-task-013 the public portfolio is requested for the "summary-only" slug
    Then PF-task-013 the public response status should be 200
    And PF-task-013 the public response should expose the student display name and summary
    And PF-task-013 the public response should carry no items and no reviews
    And PF-task-013 the public response should not expose any authenticated-only fields
    And PF-task-013 the public response should expose only student-safe fields

  # AC-3 — Only selected, non-hidden, non-retired items are returned; rating rules do not remove them.

  @api @pf-task-013
  Scenario: AC-3 The world-public page returns only selected non-hidden non-retired items
    When PF-task-013 the public portfolio is requested for the "world-public" slug
    Then PF-task-013 the public response status should be 200
    And PF-task-013 the public response should include the "world-public-selected" item
    And PF-task-013 the public response should exclude the "hidden,retired,retracted,low-rating,no-ratings,archived-source" items
    And PF-task-013 the public response should not expose any authenticated-only fields
    And PF-task-013 the public response should expose only student-safe fields

  @api @pf-task-013
  Scenario: AC-3 A world-visible item stays public despite authenticated-public rating rules
    When PF-task-013 the public portfolio is requested for the "content" slug
    Then PF-task-013 the public response status should be 200
    And PF-task-013 the public response should include the "content-included" item
    And PF-task-013 the public response should exclude the "content-nonpublic" items

  # AC-4 — Only selected reviews are returned; reviews on non-public items never appear.

  @api @pf-task-013
  Scenario: AC-4 The world-public page returns only world-visible reviews on public items
    When PF-task-013 the public portfolio is requested for the "world-public" slug
    Then PF-task-013 the public response status should be 200
    And PF-task-013 the public response should include the "world-public-selected" review
    And PF-task-013 the public response should exclude the "good-teacher,good-supervisor,low-rating,hidden,retracted,no-rating" reviews
    And PF-task-013 every returned public review should carry a persisted public notice acceptance timestamp
    And PF-task-013 no returned public review should expose a reviewer author id

  @api @pf-task-013
  Scenario: AC-4 A world-visible review on a non-public item never reaches the public page
    When PF-task-013 the public portfolio is requested for the "content" slug
    Then PF-task-013 the public response status should be 200
    And PF-task-013 the public response should include the "content-included" review
    And PF-task-013 the public response should exclude the "content-leak" reviews
    And PF-task-013 the public response should expose only student-safe fields

  # AC-7 — The public response contract is documented by example and identifies authenticated-only fields.

  @api @pf-task-013
  Scenario: AC-7 The OpenAPI schema documents the public response contract by example
    Given PF-task-013 the public portfolio contract is loaded from the API schema
    Then PF-task-013 the public contract documents the "summary_only" 200 example
    And PF-task-013 the public contract documents the "selected_items" 200 example
    And PF-task-013 the public contract documents the "selected_reviews" 200 example
    And PF-task-013 the public contract documents a private-or-unknown slug 404 example exposing only an error detail
    And PF-task-013 no documented public example exposes any authenticated-only fields
    And PF-task-013 the public contract description identifies the authenticated-only fields excluded from public responses

  @api @pf-task-013
  Scenario: AC-7 The documented public example field shape matches the live public response
    Given PF-task-013 the public portfolio contract is loaded from the API schema
    When PF-task-013 the public portfolio is requested for the "content" slug
    Then PF-task-013 the "selected_items" example field shape matches the live public response

  # AC-6 — The frontend route is public chrome: no authentication, no authenticated navbar/footer.

  @ui @pf-task-013
  Scenario: AC-6 The public portfolio route renders without authentication or authenticated chrome
    When PF-task-013 I open the public portfolio route for the "world-public" slug without authentication
    Then PF-task-013 the public portfolio shell should render as a chrome-less unauthenticated page
    And PF-task-013 the public portfolio shell should display the seeded student summary

  @ui @pf-task-013
  Scenario: AC-6 The public portfolio route renders a not-found shell for a private slug without authentication
    When PF-task-013 I open the public portfolio route for the "private" slug without authentication
    Then PF-task-013 the public portfolio shell should render as a chrome-less unauthenticated page
    And PF-task-013 the public portfolio shell should show a not-found state
