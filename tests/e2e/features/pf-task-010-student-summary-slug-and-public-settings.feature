Feature: PF-task-010 student portfolio summary, slug, and world-public page settings

  As a student I control how my portfolio is introduced (summary), the vanity slug
  that addresses my public page, and whether that page is visible on the open web.

  # Slug rules defined for this task: lowercase a-z/0-9 with single hyphens between
  # segments, length 3-50 (^[a-z0-9]+(?:-[a-z0-9]+)*$). Input is trimmed before validation and
  # must already be lowercase (uppercase is rejected, not silently rewritten). Summary limit:
  # 2000 characters. A unique slug is assigned once, at student account creation, so every
  # student already has a stable public URL key and the settings read is side-effect free. The
  # "no-slug student" fixture name below is historical: it starts world-private with only a
  # seeded slug and no summary, so the settings read can be exercised from a clean slate.
  #
  # Read-only fixtures used by other suites (portfolio-owner-student, portfolio-private-student)
  # are never mutated here. Mutating scenarios use dedicated PF-task-010 fixture students and
  # re-establish a known baseline first, so they stay order-independent under serial execution.

  @api @portfolio @pf-task-010
  Scenario: AC-1/AC-2 the settings read exposes the world-private default and a stable slug
    When the PF-task-010 no-slug student reads their portfolio settings
    Then the latest PF-task-010 API response status should be 200
    And the PF-task-010 settings world-public flag should be false
    And the PF-task-010 settings slug should be a valid non-empty slug
    And reading the PF-task-010 no-slug student settings again should return the same slug

  @api @portfolio @pf-task-010
  Scenario: AC-1 unauthenticated slug access to a world-private portfolio returns no data
    When an unauthenticated visitor requests the PF-task-010 world-private public slug
    Then the latest PF-task-010 API response status should be 404
    And the PF-task-010 response should expose no portfolio item or review data

  @api @portfolio @pf-task-010
  Scenario: AC-3 student can update the summary and it is used by later reads
    Given the PF-task-010 settings student has baseline portfolio settings
    When the PF-task-010 settings student updates the summary to "Ik bouw dashboards en leer door praktijk."
    Then the latest PF-task-010 API response status should be 200
    And the PF-task-010 settings summary should be "Ik bouw dashboards en leer door praktijk."
    And reading the PF-task-010 settings student settings should return summary "Ik bouw dashboards en leer door praktijk."
    And the PF-task-010 authenticated portfolio read for the settings student should show summary "Ik bouw dashboards en leer door praktijk."

  @api @portfolio @pf-task-010
  Scenario: AC-4 student can update the slug to an unused valid value used by world-public reads
    Given the PF-task-010 settings student has baseline portfolio settings
    When the PF-task-010 settings student publishes with summary "Publiek profiel." and slug "pf-task-010-new-slug"
    Then the latest PF-task-010 API response status should be 200
    And the PF-task-010 world-public page at slug "pf-task-010-new-slug" should be served
    And the PF-task-010 world-public page at slug "pf-task-010-baseline" should not be served

  @api @portfolio @pf-task-010
  Scenario: AC-5 a slug already owned by another student is rejected and the previous slug is unchanged
    Given the PF-task-010 settings student has baseline portfolio settings
    When the PF-task-010 settings student updates the slug to "portfolio-seed-world-public"
    Then the latest PF-task-010 API response status should be 409
    And the PF-task-010 settings student slug should still be "pf-task-010-baseline"

  @api @portfolio @pf-task-010
  Scenario Outline: slug validation rejects malformed slugs and keeps the previous slug
    Given the PF-task-010 settings student has baseline portfolio settings
    When the PF-task-010 settings student updates the slug to "<slug>"
    Then the latest PF-task-010 API response status should be 400
    And the PF-task-010 settings student slug should still be "pf-task-010-baseline"

    Examples:
      | slug                |
      | ab                  |
      | UPPERCASE           |
      | has spaces          |
      | trailing-hyphen-    |
      | double--hyphen      |
      | punctuation!        |

  @api @portfolio @pf-task-010
  Scenario: summary validation rejects a summary over the length limit and keeps the previous summary
    Given the PF-task-010 settings student has baseline portfolio settings
    When the PF-task-010 settings student updates the summary to a string of 2001 characters
    Then the latest PF-task-010 API response status should be 400
    And reading the PF-task-010 settings student settings should return summary "PF-task-010 baseline summary."

  @api @portfolio @pf-task-010
  Scenario: AC-6 student can publish a summary-only world-public page with no world-visible items
    Given the PF-task-010 settings student has baseline portfolio settings
    When the PF-task-010 settings student publishes with summary "Alleen een samenvatting." and slug "pf-task-010-baseline"
    Then the latest PF-task-010 API response status should be 200
    And the PF-task-010 world-public page at slug "pf-task-010-baseline" should be served
    And the PF-task-010 world-public page at slug "pf-task-010-baseline" should show summary "Alleen een samenvatting."
    And the PF-task-010 world-public page at slug "pf-task-010-baseline" should have no items

  @api @portfolio @pf-task-010
  Scenario Outline: AC-7 authenticated non-owner roles cannot update portfolio settings
    Given the PF-task-010 settings student has baseline portfolio settings
    When a PF-task-010 "<role>" attempts to update the portfolio settings summary
    Then the latest PF-task-010 API response status should be 403
    And reading the PF-task-010 settings student settings should return summary "PF-task-010 baseline summary."

    Examples:
      | role       |
      | teacher    |
      | supervisor |

  @api @portfolio @pf-task-010
  Scenario: AC-7 unauthenticated callers cannot update portfolio settings
    Given the PF-task-010 settings student has baseline portfolio settings
    When an unauthenticated caller attempts to update the PF-task-010 portfolio settings summary
    Then the latest PF-task-010 API response status should be 401
    And reading the PF-task-010 settings student settings should return summary "PF-task-010 baseline summary."

  @api @portfolio @pf-task-010
  Scenario: AC-7 another student's update cannot change a different student's settings
    Given the PF-task-010 settings student has baseline portfolio settings
    When another PF-task-010 student updates their own summary to "Ander student profiel."
    Then the latest PF-task-010 API response status should be 200
    And reading the PF-task-010 settings student settings should return summary "PF-task-010 baseline summary."
