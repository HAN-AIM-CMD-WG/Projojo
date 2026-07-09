Feature: TS-task-006 narrow JWT middleware exclusion for theme routes

  As a platform administrator
  I want JWT middleware to skip authentication only for public theme GET requests
  So that theme write operations remain protected by middleware and route-level auth

  @api @theme @security @TS-task-006
  Scenario: Theme collection remains public without a JWT
    Given I do not send a JWT token to the theme API
    When I request the public theme collection
    Then the latest theme API response status should be 200
    And the latest theme API response should be a list

  @api @theme @security @TS-task-006
  Scenario: Existing theme detail remains public without a JWT
    Given I am authenticated as the E2E teacher
    And theme "Duurzaamheid" exists
    And I do not send a JWT token to the theme API
    When I request public theme "Duurzaamheid" by id
    Then the latest theme API response status should be 200
    And the latest theme response name should equal "Duurzaamheid"

  @api @theme @security @TS-task-006
  Scenario: Unknown theme detail is handled by the public route without a JWT
    Given I do not send a JWT token to the theme API
    When I request public theme id "theme-does-not-exist"
    Then the latest theme API response status should be 404
    And the latest API error detail should equal "Theme niet gevonden"

  @api @theme @security @TS-task-006
  Scenario: Project theme lookup remains public without a JWT
    Given I do not send a JWT token to the theme API
    When I request the public themes for the E2E proof project
    Then the latest theme API response status should be 200
    And the latest theme API response should be a list

  @api @theme @security @TS-task-006
  Scenario Outline: Theme write routes reject requests without a JWT
    Given I do not send a JWT token to the theme API
    When I call the theme API with method "<method>" and path "<path>"
    Then the latest theme API response status should be 401
    And the latest API error detail should equal "Er is iets fout gegaan met je sessie. Log opnieuw in."

    Examples:
      | method | path                       |
      | POST   | /themes/                   |
      | PUT    | /themes/theme-duurzaamheid |
      | DELETE | /themes/theme-duurzaamheid |

  @api @theme @security @TS-task-006
  Scenario: Project theme write route is protected without a JWT
    Given I do not send a JWT token to the theme API
    When I call the theme API with method "PUT" and path "/themes/project/40000000-0000-4000-8000-000000000001"
    Then the latest theme API response status should be 401
    And the latest API error detail should equal "Er is iets fout gegaan met je sessie. Log opnieuw in."

  @api @theme @security @TS-task-006
  Scenario Outline: Route-level auth rejects authenticated students for teacher-only theme CRUD routes
    Given I am authenticated as the E2E teacher
    And theme "Duurzaamheid" exists
    And I am authenticated as the E2E student
    When I call the teacher-only theme API with method "<method>" and path "<path>" using theme "Duurzaamheid"
    Then the latest theme API response status should be 403
    And the latest API error detail should equal "Deze actie kan je alleen uitvoeren als je een leraar bent."

    Examples:
      | method | path               |
      | POST   | /themes/           |
      | PUT    | /themes/{theme_id} |
      | DELETE | /themes/{theme_id} |

  @api @theme @security @TS-task-006
  Scenario: Route-level auth still rejects authenticated students linking project themes
    Given I am authenticated as the E2E student
    When I replace the E2E proof project's theme links with no themes
    Then the latest theme API response status should be 403
    And the latest API error detail should equal "Studenten kunnen geen thema's koppelen"