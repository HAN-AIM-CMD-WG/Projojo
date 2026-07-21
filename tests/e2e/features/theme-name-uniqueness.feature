Feature: TS-task-001 theme name uniqueness

  As a teacher
  I want the platform to prevent duplicate theme names
  So that the theme catalog remains clean and filtering is reliable

  @api @theme @TS-task-001
  Scenario: Theme schema declares unique names
    When I inspect the TypeDB schema for the theme entity
    Then the theme name attribute should be required and unique

  @api @theme @TS-task-001
  Scenario: Seed file includes expected theme names without duplicate names
    When I inspect the TypeDB seed file for theme data
    Then the seed file should declare each expected theme name once and no duplicate theme names

  @api @theme @TS-task-001
  Scenario: Duplicate theme name is rejected on create
    Given I am authenticated as the E2E teacher
    And theme "Duurzaamheid" exists
    When I create a theme named "Duurzaamheid"
    Then the latest theme API response status should be 400
    And the latest API error detail should equal "Er bestaat al een thema met deze naam"
    And exactly one theme named "Duurzaamheid" should exist

  @api @theme @TS-task-001
  Scenario Outline: Theme name duplicate detection is case-insensitive
    Given I am authenticated as the E2E teacher
    And theme "Duurzaamheid" exists
    When I create a theme named "<duplicate_name>"
    Then the latest theme API response status should be 400
    And the latest API error detail should equal "Er bestaat al een thema met deze naam"
    And exactly one theme named "Duurzaamheid" should exist

    Examples:
      | duplicate_name |
      | duurzaamheid   |
      | DUURZAAMHEID   |

  @api @theme @TS-task-001
  Scenario: Duplicate theme name is rejected on update and original name is preserved
    Given I am authenticated as the E2E teacher
    And theme "Duurzaamheid" exists
    And theme "Klimaat & Milieu" exists
    When I rename theme "Klimaat & Milieu" to "Duurzaamheid"
    Then the latest theme API response status should be 400
    And the latest API error detail should equal "Er bestaat al een thema met deze naam"
    And theme "Klimaat & Milieu" should still exist
    And exactly one theme named "Duurzaamheid" should exist

  @api @theme @TS-task-001
  Scenario: Updating a theme while keeping its own name succeeds
    Given I am authenticated as the E2E teacher
    And theme "Duurzaamheid" exists
    When I rename theme "Duurzaamheid" to "Duurzaamheid"
    Then the latest theme API response status should be 200
    And the latest theme response name should equal "Duurzaamheid"