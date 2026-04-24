Feature: Development login browser proof

  Scenario: Demo login creates a usable authenticated supervisor browser session
    Given I open browser url 'http://localhost:10121/login'
    Then 'Supervisor Role Tab' should be visible
    When I click named element 'Supervisor Role Tab'
    Then 'Proof Supervisor User Button' should be visible
    When I click named element 'Proof Supervisor User Button'
    Then 'Main Heading' text should equal 'Organisatiedashboard'
    And 'Proof Project Link' should be visible
    And 'Page Body' should contain text 'E2E Infrastructure Proof Project'
