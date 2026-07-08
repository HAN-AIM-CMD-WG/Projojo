Feature: TS-task-005 make project-theme linking atomic

  As a begeleider (supervisor)
  I want theme linking to either fully succeed or fully fail
  So that my project never ends up in a partially linked state with missing themes

  @api @theme @integrity @TS-task-005
  Scenario: Replacing theme links applies all new links at once
    Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu,Innovatie & Technologie,Voedselzekerheid,Water & Biodiversiteit"
    And the E2E proof project is linked to themes "Duurzaamheid,Klimaat & Milieu"
    And I am authenticated as the E2E supervisor
    When I replace the E2E proof project's theme links with themes "Innovatie & Technologie,Voedselzekerheid,Water & Biodiversiteit"
    Then the latest theme API response status should be 200
    And the latest theme API response message should equal "Project gekoppeld aan 3 thema's"
    And the E2E proof project should be linked to themes "Innovatie & Technologie,Voedselzekerheid,Water & Biodiversiteit"

  @api @theme @integrity @TS-task-005
  Scenario: Failure during insert rolls back the delete
    Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu,Innovatie & Technologie"
    And the E2E proof project is linked to themes "Duurzaamheid,Klimaat & Milieu"
    And I remember the E2E proof project's theme links
    And I am authenticated as the E2E supervisor
    When I replace the E2E proof project's theme links with themes "Innovatie & Technologie" and invalid theme id "nonexistent"
    Then the latest theme API response status should be 400
    And the E2E proof project should keep its remembered theme links

  @api @theme @integrity @TS-task-005
  Scenario: Empty theme list clears all links atomically
    Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu"
    And the E2E proof project is linked to themes "Duurzaamheid,Klimaat & Milieu"
    And I am authenticated as the E2E supervisor
    When I replace the E2E proof project's theme links with no themes
    Then the latest theme API response status should be 200
    And the latest theme API response message should equal "Project gekoppeld aan 0 thema's"
    And the E2E proof project should be linked to themes ""

  @api @theme @integrity @TS-task-005
  Scenario: Single theme link succeeds atomically on a project without links
    Given the E2E theme catalog contains themes "Duurzaamheid"
    And the E2E proof project is linked to themes ""
    And I am authenticated as the E2E supervisor
    When I replace the E2E proof project's theme links with themes "Duurzaamheid"
    Then the latest theme API response status should be 200
    And the latest theme API response message should equal "Project gekoppeld aan 1 thema's"
    And the E2E proof project should be linked to themes "Duurzaamheid"

  @api @theme @integrity @TS-task-005
  Scenario: Duplicate theme ids in one request create a single link
    Given the E2E theme catalog contains themes "Duurzaamheid"
    And the E2E proof project is linked to themes ""
    And I am authenticated as the E2E supervisor
    When I replace the E2E proof project's theme links with theme "Duurzaamheid" sent twice
    Then the latest theme API response status should be 200
    And the latest theme API response message should equal "Project gekoppeld aan 1 thema's"
    And the E2E proof project's theme list should contain "Duurzaamheid" exactly once
