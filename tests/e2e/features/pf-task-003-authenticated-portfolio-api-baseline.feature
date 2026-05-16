Feature: PF-task-003 authenticated portfolio API baseline and public slug guard

  @api @portfolio @pf-task-003
  Scenario: Student owner can read their canonical portfolio baseline
    Given I am authenticated as the PF-task-003 portfolio owner student
    When I request the PF-task-003 authenticated portfolio for the seeded portfolio student
    Then the latest PF-task-003 API response status should be 200
    And the PF-task-003 portfolio response should describe viewer role "student"
    And the PF-task-003 portfolio response should include the seeded student identity
    And the PF-task-003 portfolio response should include canonical portfolio fields
    And the PF-task-003 portfolio response should include non-hidden canonical items
    And the PF-task-003 portfolio response should not use the stale student portfolio shape

  @api @portfolio @pf-task-003
  Scenario: Teacher can read any student's canonical portfolio baseline
    Given I am authenticated as the PF-task-003 portfolio teacher
    When I request the PF-task-003 authenticated portfolio for the seeded portfolio student
    Then the latest PF-task-003 API response status should be 200
    And the PF-task-003 portfolio response should describe viewer role "teacher"
    And the PF-task-003 portfolio response should include canonical portfolio fields
    And the PF-task-003 portfolio response should include non-hidden canonical items
    And the PF-task-003 portfolio response should not use the stale student portfolio shape

  @api @portfolio @pf-task-003
  Scenario: Teacher access does not depend on project or business ownership
    Given I am authenticated as the PF-task-003 portfolio teacher
    When I request the PF-task-003 authenticated portfolio for the private slug student fixture
    Then the latest PF-task-003 API response status should be 200
    And the PF-task-003 portfolio response should describe viewer role "teacher"
    And the PF-task-003 portfolio response should include canonical portfolio fields
    And the PF-task-003 portfolio response should not use the stale student portfolio shape

  @api @portfolio @pf-task-003
  Scenario: Related supervisor is authorized at portfolio level
    Given I am authenticated as the PF-task-003 related portfolio supervisor
    When I request the PF-task-003 authenticated portfolio for the seeded portfolio student
    Then the latest PF-task-003 API response status should be 200
    And the PF-task-003 portfolio response should describe viewer role "supervisor"
    And the PF-task-003 portfolio response should include canonical portfolio fields
    And the PF-task-003 supervisor response should not expose hidden or retracted authenticated-public items
    And the PF-task-003 supervisor response should only include authenticated-public items
    And the PF-task-003 portfolio response should not use the stale student portfolio shape

  @api @portfolio @pf-task-003
  Scenario: Unrelated supervisor is denied without portfolio data disclosure
    Given I am authenticated as the PF-task-003 unrelated portfolio supervisor
    When I request the PF-task-003 authenticated portfolio for the seeded portfolio student
    Then the latest PF-task-003 API response status should be 403
    And the PF-task-003 denial response should not expose portfolio item or review data

  @api @portfolio @pf-task-003
  Scenario: Unauthenticated callers cannot use the authenticated portfolio endpoint
    When I request the PF-task-003 authenticated portfolio for the seeded portfolio student without authentication
    Then the latest PF-task-003 API response status should be 401
    And the PF-task-003 denial response should not expose portfolio item or review data

  @api @portfolio @pf-task-003
  Scenario: Public slug route is private by default and leaks no data
    When I request the PF-task-003 private public portfolio slug fixture
    Then the latest PF-task-003 API response status should be 404
    And the PF-task-003 denial response should not expose portfolio item or review data

  @api @portfolio @pf-task-003
  Scenario: Portfolio baseline contract examples are documented in OpenAPI
    When I request the PF-task-003 OpenAPI contract
    Then the latest PF-task-003 API response status should be 200
    And the PF-task-003 OpenAPI contract should document authenticated portfolio examples
    And the PF-task-003 OpenAPI contract should document public not-public examples
