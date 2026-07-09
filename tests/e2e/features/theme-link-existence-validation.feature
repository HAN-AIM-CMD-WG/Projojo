Feature: TS-task-008 validate theme and project existence in link endpoint

  As a begeleider (supervisor)
  I want clear error feedback when I try to link invalid theme or project ids
  So that I know why the operation failed instead of getting a silent false success

  @api @theme @integrity @TS-task-008
  Scenario: AC-1 linking themes to a nonexistent project returns 404
    Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu"
    And the E2E proof project is linked to themes "Duurzaamheid"
    And I remember the E2E proof project's theme links
    And I am authenticated as the E2E supervisor
    When I replace the theme links of nonexistent project "00000000-0000-4000-8000-999999999999" with themes "Duurzaamheid"
    Then the latest theme API response status should be 404
    And the latest API error detail should equal "Project niet gevonden"
    And the E2E proof project should keep its remembered theme links

  @api @theme @integrity @TS-task-008
  Scenario: AC-2 a single invalid theme id returns 400 and modifies nothing
    Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu"
    And the E2E proof project is linked to themes "Duurzaamheid"
    And I remember the E2E proof project's theme links
    And I am authenticated as the E2E supervisor
    When I replace the E2E proof project's theme links with themes "Klimaat & Milieu" and invalid theme ids "nonexistent-theme"
    Then the latest theme API response status should be 400
    And the latest API error detail should contain "nonexistent-theme"
    And the E2E proof project should keep its remembered theme links

  @api @theme @integrity @TS-task-008
  Scenario: AC-3 multiple invalid theme ids are all listed in the error
    Given the E2E theme catalog contains themes "Duurzaamheid"
    And the E2E proof project is linked to themes "Duurzaamheid"
    And I remember the E2E proof project's theme links
    And I am authenticated as the E2E supervisor
    When I replace the E2E proof project's theme links with themes "Duurzaamheid" and invalid theme ids "nonexistent-1,nonexistent-2"
    Then the latest theme API response status should be 400
    And the latest API error detail should contain "nonexistent-1"
    And the latest API error detail should contain "nonexistent-2"
    And the E2E proof project should keep its remembered theme links

  @api @theme @integrity @TS-task-008
  Scenario: AC-4 all valid theme ids succeed with an accurate count
    Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu"
    And the E2E proof project is linked to themes ""
    And I am authenticated as the E2E supervisor
    When I replace the E2E proof project's theme links with themes "Duurzaamheid,Klimaat & Milieu"
    Then the latest theme API response status should be 200
    And the latest theme API response message should equal "Project gekoppeld aan 2 thema's"
    And the E2E proof project should be linked to themes "Duurzaamheid,Klimaat & Milieu"
    And the E2E proof project's theme list should contain "Duurzaamheid" exactly once
    And the E2E proof project's theme list should contain "Klimaat & Milieu" exactly once

  @api @theme @integrity @TS-task-008
  Scenario: AC-5 an empty theme_ids array clears all links and succeeds
    Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu"
    And the E2E proof project is linked to themes "Duurzaamheid,Klimaat & Milieu"
    And I am authenticated as the E2E supervisor
    When I replace the E2E proof project's theme links with no themes
    Then the latest theme API response status should be 200
    And the latest theme API response message should equal "Project gekoppeld aan 0 thema's"
    And the E2E proof project should be linked to themes ""

  @api @theme @integrity @TS-task-008
  Scenario: Only invalid theme ids on a project with links returns 400 and keeps links
    Given the E2E theme catalog contains themes "Duurzaamheid"
    And the E2E proof project is linked to themes "Duurzaamheid"
    And I remember the E2E proof project's theme links
    And I am authenticated as the E2E supervisor
    When I replace the E2E proof project's theme links with themes "" and invalid theme ids "only-invalid-id"
    Then the latest theme API response status should be 400
    And the latest API error detail should contain "only-invalid-id"
    And the E2E proof project should keep its remembered theme links
