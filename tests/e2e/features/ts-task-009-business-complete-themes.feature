Feature: TS-task-009 themes in the authenticated complete business overview

  As a developer consuming GET /businesses/complete
  I want every nested project to carry its linked themes
  So that authenticated views render theme badges without an extra API call per project

  Background:
    Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu,Innovatie & Technologie"

  @api @theme @TS-task-009
  Scenario: A linked project exposes its themes with id, name, icon and color
    Given the E2E proof project is linked to themes "Duurzaamheid,Innovatie & Technologie"
    And I am authenticated as the E2E supervisor for the business API
    When I request the complete business overview
    Then the complete business overview response status should be 200
    And the "E2E proof project" in the complete business overview should have themes "Duurzaamheid,Innovatie & Technologie"
    And every theme of the E2E proof project in the complete business overview should expose a populated id and name and a nullable icon and color
    And the nested themes "Duurzaamheid,Innovatie & Technologie" of the E2E proof project should have a populated icon and color

  @api @theme @TS-task-009
  Scenario: A project without theme links exposes an empty themes array
    Given the E2E proof project is linked to no themes
    And I am authenticated as the E2E supervisor for the business API
    When I request the complete business overview
    Then the E2E proof project in the complete business overview should have an empty themes array
    And the E2E proof project in the complete business overview should still nest its seeded task and skill

  @api @theme @TS-task-009
  Scenario: Nested theme data is identical to the per-project theme endpoint
    Given the E2E proof project is linked to themes "Duurzaamheid,Klimaat & Milieu"
    And I am authenticated as the E2E supervisor for the business API
    When I request the complete business overview
    Then the nested themes of the E2E proof project should equal GET /themes/project on id, name, icon and color, with every field populated

  @api @theme @TS-task-009 @ts009-nullable-theme
  Scenario: A theme without an icon or color is nested as null rather than omitted
    Given a theme "TS009 Thema Zonder Iconen" exists without an icon or color
    And the E2E proof project is linked to themes "TS009 Thema Zonder Iconen"
    And I am authenticated as the E2E supervisor for the business API
    When I request the complete business overview
    Then the nested theme "TS009 Thema Zonder Iconen" of the E2E proof project should have a null icon and color
    And the nested theme "TS009 Thema Zonder Iconen" of the E2E proof project should equal its GET /themes/project entry

  @api @theme @TS-task-009
  Scenario: Exactly three linked themes are nested once each
    Given the E2E proof project is linked to themes "Duurzaamheid,Klimaat & Milieu,Innovatie & Technologie"
    And I am authenticated as the E2E supervisor for the business API
    When I request the complete business overview
    Then the E2E proof project in the complete business overview should have exactly 3 distinct themes
    And the "E2E proof project" in the complete business overview should have themes "Duurzaamheid,Klimaat & Milieu,Innovatie & Technologie"

  @api @theme @TS-task-009
  Scenario: Themes stay scoped to the project they are linked to
    Given the E2E proof project is linked to themes "Duurzaamheid"
    And the cross-business E2E project is linked to themes "Klimaat & Milieu,Innovatie & Technologie"
    And I am authenticated as the E2E supervisor for the business API
    When I request the complete business overview
    Then the "E2E proof project" in the complete business overview should have themes "Duurzaamheid"
    And the "cross-business E2E project" in the complete business overview should have themes "Klimaat & Milieu,Innovatie & Technologie"

  @api @theme @TS-task-009
  Scenario: Unlinking a theme removes it from the nested response
    Given the E2E proof project is linked to themes "Duurzaamheid,Klimaat & Milieu"
    And I am authenticated as the E2E teacher
    When I replace the E2E proof project's theme links with themes "Klimaat & Milieu"
    And I am authenticated as the E2E supervisor for the business API
    And I request the complete business overview
    Then the "E2E proof project" in the complete business overview should have themes "Klimaat & Milieu"

  @api @theme @TS-task-009
  Scenario: The pre-existing response shape is unchanged apart from the added themes array
    Given the E2E proof project is linked to themes "Duurzaamheid"
    And I am authenticated as the E2E supervisor for the business API
    When I request the complete business overview
    Then every business in the complete business overview should expose exactly its pre-existing fields
    And every project in the complete business overview should expose exactly its pre-existing fields plus themes
    And every task in the complete business overview should expose exactly its pre-existing fields
    And the complete business overview should include businesses "E2E Infrastructure Business,E2E Cross-Business Organization,Portfolio Unrelated Business"
    And the complete business overview should not include business "Portfolio Archived Source Business"

  @api @theme @security @TS-task-009
  Scenario: The enriched endpoint still requires authentication
    Given I send no JWT token to the business API
    When I request the complete business overview
    Then the complete business overview response status should be 401 or 403
