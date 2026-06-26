Feature: TS-task-004 theme input validation

  As a teacher
  I want theme data validated before saving
  So that invalid data cannot corrupt the theme catalog or break the UI

  @api @theme @TS-task-004
  Scenario Outline: Invalid theme fields are rejected on create and update
    Given I am authenticated as the E2E teacher
    When I submit a theme "<operation>" request with validation field "<field>" set to "<value>"
    Then the latest theme API response status should be 400
    And the latest API error detail should equal "<message>"
    And no invalid theme data should be persisted from the latest validation request

    Examples:
      | operation | field         | value           | message                                                            |
      | create    | name          | empty           | Naam is verplicht en mag maximaal 100 tekens zijn                  |
      | create    | name          | whitespace only | Naam is verplicht en mag maximaal 100 tekens zijn                  |
      | create    | name          | 101 characters  | Naam is verplicht en mag maximaal 100 tekens zijn                  |
      | create    | name          | omitted         | Naam is verplicht en mag maximaal 100 tekens zijn                  |
      | create    | name          | null            | Naam is verplicht en mag maximaal 100 tekens zijn                  |
      | create    | sdg_code      | BANANA          | Ongeldig SDG-code formaat. Gebruik bijv. 'SDG1' of 'SDG12,SDG4'   |
      | create    | sdg_code      | SDG0            | Ongeldig SDG-code formaat. Gebruik bijv. 'SDG1' of 'SDG12,SDG4'   |
      | create    | sdg_code      | SDG18           | Ongeldig SDG-code formaat. Gebruik bijv. 'SDG1' of 'SDG12,SDG4'   |
      | create    | color         | notacolor       | Ongeldige kleurcode. Gebruik hex-formaat zoals '#4CAF50'          |
      | create    | color         | #GGG            | Ongeldige kleurcode. Gebruik hex-formaat zoals '#4CAF50'          |
      | create    | color         | 4CAF50          | Ongeldige kleurcode. Gebruik hex-formaat zoals '#4CAF50'          |
      | create    | icon          | 51 characters   | Icoon naam mag maximaal 50 tekens zijn                            |
      | create    | description   | 501 characters  | Beschrijving mag maximaal 500 tekens zijn                         |
      | create    | display_order | -1              | Sorteervolgorde moet een positief geheel getal zijn                |
      | create    | display_order | non-integer     | Sorteervolgorde moet een positief geheel getal zijn                |
      | update    | name          | empty           | Naam is verplicht en mag maximaal 100 tekens zijn                  |
      | update    | name          | whitespace only | Naam is verplicht en mag maximaal 100 tekens zijn                  |
      | update    | name          | 101 characters  | Naam is verplicht en mag maximaal 100 tekens zijn                  |
      | update    | name          | null            | Naam is verplicht en mag maximaal 100 tekens zijn                  |
      | update    | sdg_code      | BANANA          | Ongeldig SDG-code formaat. Gebruik bijv. 'SDG1' of 'SDG12,SDG4'   |
      | update    | sdg_code      | SDG0            | Ongeldig SDG-code formaat. Gebruik bijv. 'SDG1' of 'SDG12,SDG4'   |
      | update    | sdg_code      | SDG18           | Ongeldig SDG-code formaat. Gebruik bijv. 'SDG1' of 'SDG12,SDG4'   |
      | update    | color         | notacolor       | Ongeldige kleurcode. Gebruik hex-formaat zoals '#4CAF50'          |
      | update    | color         | #GGG            | Ongeldige kleurcode. Gebruik hex-formaat zoals '#4CAF50'          |
      | update    | color         | 4CAF50          | Ongeldige kleurcode. Gebruik hex-formaat zoals '#4CAF50'          |
      | update    | icon          | 51 characters   | Icoon naam mag maximaal 50 tekens zijn                            |
      | update    | description   | 501 characters  | Beschrijving mag maximaal 500 tekens zijn                         |
      | update    | display_order | -1              | Sorteervolgorde moet een positief geheel getal zijn                |
      | update    | display_order | non-integer     | Sorteervolgorde moet een positief geheel getal zijn                |

  @api @theme @TS-task-004
  Scenario Outline: Valid theme field values are accepted and stored on create
    Given I am authenticated as the E2E teacher
    When I create a theme with validation field "<field>" set to "<value>"
    Then the latest theme API response status should be 201
    And the persisted latest theme field "<field>" should equal "<expected>"

    Examples:
      | field         | value     | expected  |
      | sdg_code      | SDG12     | SDG12     |
      | sdg_code      | SDG1,SDG7 | SDG1,SDG7 |
      | sdg_code      | omitted   | null      |
      | sdg_code      | null      | null      |
      | color         | #4CAF50   | #4CAF50   |
      | display_order | 0         | 0         |

  @api @theme @TS-task-004
  Scenario Outline: Valid theme field values are accepted and stored on update
    Given I am authenticated as the E2E teacher
    When I update a theme with validation field "<field>" set to "<value>"
    Then the latest theme API response status should be 200
    And the persisted latest theme field "<field>" should equal "<expected>"

    Examples:
      | field         | value     | expected  |
      | sdg_code      | SDG12     | SDG12     |
      | sdg_code      | SDG1,SDG7 | SDG1,SDG7 |
      | color         | #1976D2   | #1976D2   |
      | display_order | 0         | 0         |

  @api @theme @TS-task-004
  Scenario Outline: Null optional theme fields on update leave existing values unchanged
    Given I am authenticated as the E2E teacher
    When I update a theme with validation field "<field>" set to "null"
    Then the latest theme API response status should be 200
    And the persisted latest theme field "<field>" should equal "<original>"

    Examples:
      | field         | original                      |
      | sdg_code      | SDG1                          |
      | color         | #4CAF50                       |
      | icon          | label                         |
      | description   | E2E theme validation fixture. |
      | display_order | 99                            |
