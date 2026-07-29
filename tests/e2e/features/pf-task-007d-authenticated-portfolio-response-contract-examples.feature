@portfolio-visibility @portfolio-response-contract
Feature: PF-task-007d authenticated portfolio response contract examples

  The authenticated portfolio endpoint must publish an explicit response
  contract so UI components and BDD tests share one documented shape instead of
  inferring visibility state. The documented examples must cover the student
  owner, a teacher, and a relationship-gated supervisor, must stay aligned with
  what the live seeded API actually returns, must present denials as safe
  error-only shapes that never disclose whether portfolio items exist, and must
  record the endpoint-name divergence from the legacy student portfolio service.

  Background:
    Given the documented authenticated portfolio response contract is loaded from the API schema

  # AC-1 / AC-2 — Owner and teacher examples are documented with the full private
  # shape (portfolio settings, item fields, curation/moderation fields,
  # archived-source metadata, visibility reasons, and reviews) and their field
  # names match the live response so frontend services and BDD steps can rely on them.

  @api @portfolio @pf-task-007d
  Scenario Outline: Owner and teacher response examples are documented and match the live contract
    Then the "<example>" 200 response example is documented
    And the "<example>" example describes viewer role "<role>"
    And the "<example>" example exposes portfolio settings, item, curation, archived-source, visibility, and review fields
    And the documented schema lists the curation moderation fields "is_hidden, hidden_at, hidden_by_role, hidden_by_user_id, is_retired, retired_at"
    When I capture the live authenticated portfolio response as the "<example>" viewer
    Then the "<example>" example field names match the live "<example>" response

    Examples:
      | example       | role    |
      | student_owner | student |
      | teacher       | teacher |

  # AC-3 — The related-supervisor example documents the filtered view: it uses the
  # same per-item field shape as the owner (there is no per-field redaction), yet
  # it and the live supervisor response omit hidden, retired, authenticated-public
  # retracted, and low-rated items, and never expose a review rating below three.

  @api @portfolio @pf-task-007d
  Scenario: Related supervisor example documents the filtered, redaction-aware view
    Then the "related_supervisor" 200 response example is documented
    And the "related_supervisor" example describes viewer role "supervisor"
    When I capture the live authenticated portfolio response as the "related_supervisor" viewer
    Then the "related_supervisor" example field names match the live "related_supervisor" response
    And the "related_supervisor" example omits the "low-rating, retracted, hidden, retired, mixed-ratings" items
    And the live "related_supervisor" response omits the "low-rating, retracted, hidden, retired, mixed-ratings" items
    And no review in the "related_supervisor" example has a rating below three
    And no review in the live "related_supervisor" response has a rating below three
    And the "related_supervisor" example item shape is identical to the "student_owner" example item shape

  # AC-4 — Denials for an unrelated supervisor, another student, and an
  # unauthenticated caller are documented and returned as safe error-only shapes
  # that never disclose whether the student has portfolio items.

  @api @portfolio @pf-task-007d
  Scenario Outline: Denial responses are documented as safe error-only shapes
    Then the "<code>" denial response documents an example exposing only an error detail
    When I request the authenticated portfolio as the "<denial>" caller
    Then the live denial response status is <code>
    And the live denial response exposes only an error detail

    Examples:
      | denial               | code |
      | other student        | 403  |
      | unrelated supervisor | 403  |
      | unauthenticated      | 401  |

  # AC-5 — The documented contract records the endpoint-name divergence between the
  # canonical authenticated path and the legacy student portfolio service the
  # frontend still calls, so the stable field names are not silently attached to
  # the wrong route.

  @api @portfolio @pf-task-007d
  Scenario: The contract documents the endpoint-name divergence from the legacy portfolio service
    Then the documented contract notes the endpoint-name divergence from the legacy student portfolio service
