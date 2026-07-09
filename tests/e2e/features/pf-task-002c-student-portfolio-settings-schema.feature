Feature: PF-task-002c student portfolio settings schema

  @api @portfolio @schema @pf-task-002c
  Scenario: Student portfolio settings are optional before curation
    When I probe the student portfolio settings schema contract
    Then the student portfolio settings probe should confirm summary can be omitted or empty
    And the student portfolio settings probe should confirm omitted world-public state is absent for later private-default reads

  @api @portfolio @schema @pf-task-002c
  Scenario: Student portfolio settings round-trip independently from portfolio items
    When I probe the student portfolio settings schema contract
    Then the student portfolio settings probe should confirm summary, slug, and world-public state round-trip
    And the student portfolio settings probe should confirm settings can be read without portfolio items

  @api @portfolio @schema @pf-task-002c
  Scenario: Student portfolio slugs are unique across students
    When I probe the student portfolio settings schema contract
    Then the student portfolio settings probe should reject duplicate portfolio slugs
