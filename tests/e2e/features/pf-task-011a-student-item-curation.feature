@portfolio-curation @student-item-curation
Feature: PF-task-011a student item ordering, hide/show, and world-visible selection

  A student owner curates their own portfolio items through the item curation endpoint
  PATCH /portfolios/me/items/{item_id}: they set a display order, hide or show their own
  items with a student-owned hidden flag, and select items for world-public output. Hiding
  removes an item from every normal view (owner, teacher, supervisor, world-public). A
  student "show" only clears the student's own hidden flag and never overrides a teacher
  hide, so the student's choice persists independently of teacher moderation. World-visible
  makes an item eligible for the world-public page, but it is exposed publicly only when the
  portfolio page itself is world-public. Only the owner may curate their items.

  # AC-1 — Student can update display order and it drives portfolio ordering.

  @api @portfolio @pf-task-011a
  Scenario: AC-1 Display order is saved and orders the authenticated portfolio
    When PF-task-011a the owner sets the "order-first" item display order to 210
    Then PF-task-011a the mutation response should report the "order-first" item display order as 210
    When PF-task-011a the owner sets the "order-second" item display order to 205
    Then PF-task-011a the "order-second" item should appear before the "order-first" item in the owner view
    And PF-task-011a a fresh owner read should report the "order-second" item display order as 205

  @api @portfolio @pf-task-011a
  Scenario: AC-1 Reversing the display order reverses the authenticated portfolio ordering
    When PF-task-011a the owner sets the "order-first" item display order to 205
    And PF-task-011a the owner sets the "order-second" item display order to 210
    Then PF-task-011a the "order-first" item should appear before the "order-second" item in the owner view

  # AC-2 — Student can hide an item, removing it from every normal view; no delete endpoint.

  @api @portfolio @pf-task-011a
  Scenario: AC-2 Hiding an item removes it from every normal portfolio view
    Given PF-task-011a the owner sets the "hideable" item hidden state to "off"
    When PF-task-011a the owner sets the "hideable" item hidden state to "on"
    Then PF-task-011a the mutation response should report the "hideable" item as student-hidden
    And PF-task-011a the "owner" view should exclude the "hideable" item
    And PF-task-011a the "teacher" view should exclude the "hideable" item
    And PF-task-011a the "related supervisor" view should exclude the "hideable" item
    And PF-task-011a the world-public page should exclude the "hideable" item

  @api @portfolio @pf-task-011a
  Scenario: AC-2 Normal curation exposes no item delete endpoint
    Then PF-task-011a a DELETE request to the "hideable" curation endpoint should be rejected with status 405

  # AC-3 — Student can show a student-hidden item, but cannot override a teacher hide.

  @api @portfolio @pf-task-011a
  Scenario: AC-3 Showing a student-hidden item restores it to normal views
    Given PF-task-011a the owner sets the "hideable" item hidden state to "on"
    And PF-task-011a the "teacher" view should exclude the "hideable" item
    When PF-task-011a the owner sets the "hideable" item hidden state to "off"
    Then PF-task-011a the mutation response should report the "hideable" item as not student-hidden
    And PF-task-011a the "owner" view should include the "hideable" item
    And PF-task-011a the "teacher" view should include the "hideable" item
    And PF-task-011a the "related supervisor" view should include the "hideable" item

  @api @portfolio @pf-task-011a
  Scenario: AC-3 Showing does not override a teacher-hidden item
    When PF-task-011a the owner sets the "teacher-hidden" item hidden state to "off"
    Then PF-task-011a the mutation response should report the "teacher-hidden" item as not student-hidden
    And PF-task-011a the mutation response should report the "teacher-hidden" item as hidden by a teacher
    And PF-task-011a the "owner" view should exclude the "teacher-hidden" item
    And PF-task-011a the "teacher" view should exclude the "teacher-hidden" item

  # AC-4 — Student can select an item for world-public output, gated by the page setting.

  @api @portfolio @pf-task-011a
  Scenario: AC-4 Marking an item world-visible publishes it to the world-public page
    Given PF-task-011a the owner sets the "worldable" item world-visible state to "off"
    When PF-task-011a the owner sets the "worldable" item world-visible state to "on"
    Then PF-task-011a the mutation response should report the "worldable" item as world-visible
    And PF-task-011a the world-public page should include the "worldable" item
    And PF-task-011a the "owner" view should include the "worldable" item

  @api @portfolio @pf-task-011a
  Scenario: AC-4 Clearing world-visible removes it from the world-public page but keeps it in authenticated views
    Given PF-task-011a the owner sets the "worldable" item world-visible state to "on"
    When PF-task-011a the owner sets the "worldable" item world-visible state to "off"
    Then PF-task-011a the world-public page should exclude the "worldable" item
    And PF-task-011a the "owner" view should include the "worldable" item

  @api @portfolio @pf-task-011a
  Scenario: AC-4 A world-visible item stays private while the portfolio page is not world-public
    When PF-task-011a the private-page owner marks their "private-worldable" item world-visible
    Then PF-task-011a the mutation response should report the "private-worldable" item as world-visible
    And PF-task-011a the private portfolio page should not be reachable as a world-public page

  # AC-5 — Only the owner may curate; everyone else is denied and the item is unchanged.

  @api @portfolio @pf-task-011a
  Scenario: AC-5 A teacher cannot curate a student-owned item
    Given PF-task-011a the owner sets the "guard" item hidden state to "off"
    When PF-task-011a a "teacher" attempts to set the "guard" item hidden state to "on"
    Then PF-task-011a the curation attempt should be denied with status 403
    And PF-task-011a the "guard" item should still be shown to the owner

  @api @portfolio @pf-task-011a
  Scenario: AC-5 A related supervisor cannot curate a student-owned item
    Given PF-task-011a the owner sets the "guard" item hidden state to "off"
    When PF-task-011a a "related supervisor" attempts to set the "guard" item hidden state to "on"
    Then PF-task-011a the curation attempt should be denied with status 403
    And PF-task-011a the "guard" item should still be shown to the owner

  @api @portfolio @pf-task-011a
  Scenario: AC-5 An unrelated student cannot curate someone else's item
    Given PF-task-011a the owner sets the "guard" item hidden state to "off"
    When PF-task-011a a "other student" attempts to set the "guard" item hidden state to "on"
    Then PF-task-011a the curation attempt should be denied with status 404
    And PF-task-011a the "guard" item should still be shown to the owner

  @api @portfolio @pf-task-011a
  Scenario: AC-5 An unauthenticated caller cannot curate an item
    Given PF-task-011a the owner sets the "guard" item hidden state to "off"
    When PF-task-011a an unauthenticated caller attempts to set the "guard" item hidden state to "on"
    Then PF-task-011a the curation attempt should be denied with status 401
    And PF-task-011a the "guard" item should still be shown to the owner
