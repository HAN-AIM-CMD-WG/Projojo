Feature: TS-task-003 enforce ownership on project-theme linking

  As a platform administrator
  I want only authorized users to modify theme links on a project
  So that supervisors from one organization cannot tamper with another organization's project themes

  @api @theme @security @TS-task-003
  Scenario: Supervisor links themes to a project owned by their business
    Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu"
    And I am authenticated as the E2E supervisor
    When I replace the E2E proof project's theme links with themes "Duurzaamheid,Klimaat & Milieu"
    Then the latest theme API response status should be 200
    And the latest theme API response message should equal "Project gekoppeld aan 2 thema's"
    And the E2E proof project should be linked to themes "Duurzaamheid,Klimaat & Milieu"

  @api @theme @security @TS-task-003
  Scenario: Supervisor cannot link themes to another business's project
    Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu"
    And the cross-business E2E project is linked to themes "Duurzaamheid"
    And I remember the cross-business E2E project's theme links
    And I am authenticated as the E2E supervisor
    When I replace the cross-business E2E project's theme links with themes "Klimaat & Milieu"
    Then the latest theme API response status should be 403
    And the latest API error detail should equal "Onvoldoende rechten"
    And the cross-business E2E project should keep its remembered theme links

  @api @theme @security @TS-task-003
  Scenario: Teacher links themes to any project
    Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu"
    And I am authenticated as the E2E teacher
    When I replace the cross-business E2E project's theme links with themes "Duurzaamheid,Klimaat & Milieu"
    Then the latest theme API response status should be 200
    And the latest theme API response message should equal "Project gekoppeld aan 2 thema's"
    And the cross-business E2E project should be linked to themes "Duurzaamheid,Klimaat & Milieu"

  @api @theme @security @TS-task-003
  Scenario: Student remains blocked from linking project themes
    Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu,Innovatie & Technologie"
    And the E2E proof project is linked to themes "Duurzaamheid"
    And I remember the E2E proof project's theme links
    And I am authenticated as the E2E student
    When I replace the E2E proof project's theme links with themes "Innovatie & Technologie"
    Then the latest theme API response status should be 403
    And the latest API error detail should equal "Studenten kunnen geen thema's koppelen"
    And the E2E proof project should keep its remembered theme links

  @api @theme @security @TS-task-003
  Scenario: Unauthenticated user cannot link project themes
    Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu,Innovatie & Technologie"
    And the E2E proof project is linked to themes "Duurzaamheid"
    And I remember the E2E proof project's theme links
    And I do not send a JWT token to the theme API
    When I replace the E2E proof project's theme links with themes "Innovatie & Technologie"
    Then the latest theme API response status should be 401 or 403
    And the E2E proof project should keep its remembered theme links
