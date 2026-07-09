Feature: PF-task-007b supervisor authenticated-public item filtering

  Once the PF-task-007a relationship gate authorises a supervisor at portfolio
  level, item-level authenticated-public rules decide which items and reviews
  that supervisor may see. The owner student and any teacher keep a full private
  view where ratings and authenticated-public retraction never filter anything.
  A related supervisor instead sees only items that are not retired, not hidden,
  not authenticated-public retracted, and not low-rated. Low-rating exclusion is
  enforced by the API, its details are never revealed, and visibility is
  recomputed on every read so rating changes take effect immediately.

  # AC-1 — Student and teacher private views include all non-retired, non-hidden
  # items and reviews; ratings and authenticated-public retraction do not filter them.

  @api @portfolio @pf-task-007b
  Scenario: AC-1 Student owner privately keeps low-rated and retracted items with their reviews
    When I capture the PF-task-007b "owner student" view of the portfolio owner student
    Then the PF-task-007b "owner student" view should respond with status 200
    And the PF-task-007b "owner student" view should describe viewer role "student"
    And the PF-task-007b "owner student" view should include the "no-ratings, all-good-ratings, low-rating, retracted" items
    And the PF-task-007b "owner student" view should include the reviews of the "low-rating, retracted" items

  @api @portfolio @pf-task-007b
  Scenario: AC-1 Teacher privately keeps low-rated and retracted items with their reviews
    When I capture the PF-task-007b "teacher" view of the portfolio owner student
    Then the PF-task-007b "teacher" view should respond with status 200
    And the PF-task-007b "teacher" view should describe viewer role "teacher"
    And the PF-task-007b "teacher" view should include the "no-ratings, all-good-ratings, low-rating, retracted" items
    And the PF-task-007b "teacher" view should include the reviews of the "low-rating, retracted" items

  # AC-2 — Related supervisor sees eligible items only, with reviews only for visible items.

  @api @portfolio @pf-task-007b
  Scenario: AC-2 Related supervisor sees only authenticated-public eligible items and their reviews
    When I capture the PF-task-007b "related supervisor" view of the portfolio owner student
    Then the PF-task-007b "related supervisor" view should respond with status 200
    And the PF-task-007b "related supervisor" view should describe viewer role "supervisor"
    And the PF-task-007b "related supervisor" view should include the "no-ratings, all-good-ratings, world-public, archived-source" items
    And the PF-task-007b "related supervisor" view should exclude the "low-rating, retracted, hidden, retired" items
    And every review in the PF-task-007b "related supervisor" view should belong to a returned item

  # AC-3 — Item with no ratings remains supervisor-visible.

  @api @portfolio @pf-task-007b
  Scenario: AC-3 An item with no ratings stays visible to the related supervisor
    When I capture the PF-task-007b "related supervisor" view of the portfolio owner student
    Then the PF-task-007b "related supervisor" view should respond with status 200
    And the PF-task-007b "related supervisor" view should include the "no-ratings" item
    And the PF-task-007b "related supervisor" view should carry no numeric rating for the "no-ratings" item

  # AC-4 — Any rating below three removes supervisor visibility and is never revealed.

  @api @portfolio @pf-task-007b
  Scenario: AC-4 A rating below three hides the item from the supervisor without leaking the low rating
    When I capture the PF-task-007b "related supervisor" view of the portfolio owner student
    Then the PF-task-007b "related supervisor" view should respond with status 200
    And the PF-task-007b "related supervisor" view should return at least one review
    And the PF-task-007b "related supervisor" view should exclude the "low-rating" item
    And no review in the PF-task-007b "related supervisor" view should reference the "low-rating" item
    And no review in the PF-task-007b "related supervisor" view should have a rating below three

  # AC-4 — The gate excludes on ANY rating below three (not an average): a [2, 5] item is
  # excluded for the supervisor even though its mean is above three, but stays in the private view.

  @api @portfolio @pf-task-007b
  Scenario: AC-4 A single rating below three among higher ratings still hides the item from the supervisor
    When I capture the PF-task-007b "teacher" view of the portfolio owner student
    And I capture the PF-task-007b "related supervisor" view of the portfolio owner student
    Then the PF-task-007b "teacher" view should include the "mixed-ratings" item
    And the PF-task-007b "teacher" view should include the reviews of the "mixed-ratings" items
    And the PF-task-007b "related supervisor" view should return at least one review
    And the PF-task-007b "related supervisor" view should exclude the "mixed-ratings" item
    And no review in the PF-task-007b "related supervisor" view should reference the "mixed-ratings" item
    And no review in the PF-task-007b "related supervisor" view should have a rating below three

  # AC-5 — Visibility is a stateless rating gate recomputed on every read: an item is
  # authenticated-public visible once every rating is at least three and stays excluded while
  # retracted. Rating-edit mutations that trigger restoration are owned by PF-task-008; these
  # scenarios assert the stateless end-states (no in-test edit) and per-viewer recomputation
  # from the same stored data.

  @api @portfolio @pf-task-007b
  Scenario: AC-5 An item whose every rating is at least three is visible to the supervisor
    When I capture the PF-task-007b "related supervisor" view of the portfolio owner student
    Then the PF-task-007b "related supervisor" view should respond with status 200
    And the PF-task-007b "related supervisor" view should include the "all-good-ratings" item

  @api @portfolio @pf-task-007b
  Scenario: AC-5 A retracted item stays hidden from the supervisor even though its ratings are all at least three
    When I capture the PF-task-007b "related supervisor" view of the portfolio owner student
    Then the PF-task-007b "related supervisor" view should respond with status 200
    And the PF-task-007b "related supervisor" view should exclude the "retracted" item

  @api @portfolio @pf-task-007b
  Scenario: AC-5 The same stored item is recomputed per viewer, so teacher and supervisor results differ
    When I capture the PF-task-007b "teacher" view of the portfolio owner student
    And I capture the PF-task-007b "related supervisor" view of the portfolio owner student
    Then the PF-task-007b "teacher" view should include the "low-rating" item
    And the PF-task-007b "related supervisor" view should exclude the "low-rating" item

  # AC-6 — Hidden and retired items are excluded from every normal authenticated view.

  @api @portfolio @pf-task-007b
  Scenario: AC-6 Hidden items stay out of the student, teacher, and supervisor views
    When I capture the PF-task-007b "owner student" view of the portfolio owner student
    Then the PF-task-007b "owner student" view should include the "no-ratings" item
    And the PF-task-007b "owner student" view should exclude the "hidden" item
    And no review in the PF-task-007b "owner student" view should reference the "hidden" item
    When I capture the PF-task-007b "teacher" view of the portfolio owner student
    Then the PF-task-007b "teacher" view should exclude the "hidden" item
    And no review in the PF-task-007b "teacher" view should reference the "hidden" item
    When I capture the PF-task-007b "related supervisor" view of the portfolio owner student
    Then the PF-task-007b "related supervisor" view should exclude the "hidden" item
    And no review in the PF-task-007b "related supervisor" view should reference the "hidden" item

  @api @portfolio @pf-task-007b
  Scenario: AC-6 Retired evidence exists yet is excluded from the student, teacher, and supervisor views
    Given the PF-task-007b retired item exists in the seed as retired portfolio evidence
    When I capture the PF-task-007b "owner student" view of the portfolio owner student
    Then the PF-task-007b "owner student" view should include the "no-ratings" item
    And the PF-task-007b "owner student" view should exclude the "retired" item
    And no review in the PF-task-007b "owner student" view should reference the "retired" item
    When I capture the PF-task-007b "teacher" view of the portfolio owner student
    Then the PF-task-007b "teacher" view should exclude the "retired" item
    And no review in the PF-task-007b "teacher" view should reference the "retired" item
    When I capture the PF-task-007b "related supervisor" view of the portfolio owner student
    Then the PF-task-007b "related supervisor" view should exclude the "retired" item
    And no review in the PF-task-007b "related supervisor" view should reference the "retired" item
