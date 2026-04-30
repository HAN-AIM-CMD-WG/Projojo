Feature: PF-task-001 legacy portfolio backend is decommissioned

  @api @portfolio @pf-task-001
  Scenario: Legacy student portfolio read endpoint is explicitly gone
    Given I am authenticated as the seeded teacher
    When I call the legacy student portfolio endpoint
    Then the latest legacy portfolio API response status should be 410
    And the latest API response detail should contain 'gedecommissioned'

  @api @portfolio @pf-task-001
  Scenario: Legacy student portfolio delete endpoint is explicitly gone
    Given I am authenticated as the seeded teacher
    When I call the legacy student portfolio delete endpoint for portfolio id 'snapshot-does-not-matter'
    Then the latest legacy portfolio API response status should be 410
    And the latest API response detail should contain 'gedecommissioned'