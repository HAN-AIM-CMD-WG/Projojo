Feature: Local stack reachability proof

  Scenario: Local Docker endpoints and deterministic seed are reachable
    Given the backend root endpoint is reachable
    And the TypeDB status endpoint reports a connected database
    And the frontend login shell is reachable
    When I request the public projects API
    Then the latest API response status should be 200
    And the latest public projects response should include project 'E2E Infrastructure Proof Project'
    And the latest public projects response should include business 'E2E Infrastructure Business'
    And the latest public projects response should include seed marker 'PROJOJO_E2E_INFRASTRUCTURE_V1'
