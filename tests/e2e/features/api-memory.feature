Feature: API and memory proof

  @api @memory
  Scenario: API values can be remembered and reused in a browser assertion
    Given I request the public projects API
    When I remember the proof project id as 'proofProjectId'
    And I remember the proof project name as 'proofProjectName'
    And I remember the proof business name as 'proofBusinessName'
    Then memory key 'proofProjectId' should not be empty
    When I open browser url 'http://localhost:10121/publiek'
    Then 'Main Heading' text should equal 'Ontdek Projecten'
    And 'Page Body' should contain remembered value 'proofProjectName'
    And 'Page Body' should contain remembered value 'proofBusinessName'
