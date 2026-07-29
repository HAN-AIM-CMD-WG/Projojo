@portfolio-curation @student-review-curation
Feature: PF-task-012a student review world-public selection

  A student owner selects which submitted reviews on their own portfolio items are visible on
  their world-public portfolio through the review selection endpoint
  PATCH /portfolios/me/items/{item_id}/reviews/{review_id}. Marking a review world-visible makes
  it eligible for world-public output, but it is exposed publicly only when the associated item
  and the portfolio page are also world-public. Clearing the flag retracts it from world-public
  responses without affecting authenticated views. Only the review owner may change the flag, and
  a review is only ever exposed publicly under the persisted reviewer public-use notice contract.

  # AC-1 — Owner can mark a review world-visible; it then appears on the world-public page.

  @api @portfolio @pf-task-012a
  Scenario: AC-1 Marking a review world-visible publishes it on the world-public page
    Given PF-task-012a the owner sets the "markable" review world-visible state to "off"
    When PF-task-012a the owner sets the "markable" review world-visible state to "on"
    Then PF-task-012a the mutation response should report the "markable" review as world-visible
    And PF-task-012a the world-public page should include the "markable" review
    And PF-task-012a the owner authenticated view should include the "markable" review

  # AC-2 — Owner can retract a review; it leaves the world-public page but not authenticated views.

  @api @portfolio @pf-task-012a
  Scenario: AC-2 Clearing a review world-visible flag retracts it from the world-public page only
    Given PF-task-012a the owner sets the "retractable" review world-visible state to "on"
    And PF-task-012a the world-public page should include the "retractable" review
    When PF-task-012a the owner sets the "retractable" review world-visible state to "off"
    Then PF-task-012a the mutation response should report the "retractable" review as not world-visible
    And PF-task-012a the world-public page should exclude the "retractable" review
    And PF-task-012a the owner authenticated view should include the "retractable" review

  # AC-3 — A world-visible review is never public without a world-public, non-hidden, non-retired item.

  @api @portfolio @pf-task-012a
  Scenario: AC-3 A world-visible review stays private while its item is not world-visible
    When PF-task-012a the owner sets the "nonpublic" review world-visible state to "on"
    Then PF-task-012a the mutation response should report the "nonpublic" review as world-visible
    And PF-task-012a the world-public page should exclude the "nonpublic" review
    And PF-task-012a the world-public page should exclude the "nonpublic-item" item

  @api @portfolio @pf-task-012a
  Scenario: AC-3 A world-visible review stays private while its item is retired
    When PF-task-012a the owner sets the "retired" review world-visible state to "on"
    Then PF-task-012a the mutation response should report the "retired" review as world-visible
    And PF-task-012a the world-public page should exclude the "retired" review
    And PF-task-012a the world-public page should exclude the "retired-item" item

  @api @portfolio @pf-task-012a
  Scenario: AC-3 A world-visible review stays private while its item is teacher-hidden
    When PF-task-012a the owner sets the "hidden" review world-visible state to "on"
    Then PF-task-012a the mutation response should report the "hidden" review as world-visible
    And PF-task-012a the world-public page should exclude the "hidden" review
    And PF-task-012a the world-public page should exclude the "hidden-item" item

  # AC-4 — Only the owner may change a review's world-visible flag; everyone else is denied and it is unchanged.

  @api @portfolio @pf-task-012a
  Scenario Outline: AC-4 A non-owner cannot change a review world-visible flag
    Given PF-task-012a the owner sets the "guard" review world-visible state to "on"
    When PF-task-012a a "<actor>" attempts to set the "guard" review world-visible state to "off"
    Then PF-task-012a the selection attempt should be denied with status <status>
    And PF-task-012a the "guard" review should still be world-visible in the owner view

    Examples:
      | actor              | status |
      | teacher            | 403    |
      | related supervisor | 403    |
      | other student      | 404    |

  @api @portfolio @pf-task-012a
  Scenario: AC-4 An unauthenticated caller cannot change a review world-visible flag
    Given PF-task-012a the owner sets the "guard" review world-visible state to "on"
    When PF-task-012a an unauthenticated caller attempts to set the "guard" review world-visible state to "off"
    Then PF-task-012a the selection attempt should be denied with status 401
    And PF-task-012a the "guard" review should still be world-visible in the owner view

  # AC-5 — A world-public review is only ever exposed under the persisted reviewer notice contract.

  @api @portfolio @pf-task-012a
  Scenario: AC-5 Every world-public review carries a persisted public-use notice acceptance
    Given PF-task-012a the owner sets the "markable" review world-visible state to "on"
    When PF-task-012a the world-public page is read
    Then PF-task-012a every returned world-public review should carry a persisted public notice acceptance timestamp
    And PF-task-012a the world-public page should include the "markable" review
