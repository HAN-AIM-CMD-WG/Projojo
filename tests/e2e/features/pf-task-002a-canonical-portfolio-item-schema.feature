Feature: PF-task-002a canonical portfolio item schema

  @api @portfolio @schema @pf-task-002a
  Scenario: Legacy snapshot attributes are rejected on otherwise canonical portfolio items
    When I probe the legacy snapshot attribute portfolio item schema contract
    Then the legacy snapshot attribute portfolio item schema probe should be rejected

  @api @portfolio @schema @pf-task-002a
  Scenario: Student-owned canonical portfolio items can store schema-required state
    When I probe the canonical portfolio item schema contract
    Then the canonical portfolio item probe should confirm the reset schema accepts canonical portfolio items
    And the canonical portfolio item probe should confirm the student ownership relation
    And the canonical portfolio item probe should confirm source identifiers and copied display fields can be stored
    And the canonical portfolio item probe should confirm explicit lifecycle, retirement, and visibility state
    And the canonical portfolio item probe should confirm archived-source metadata support
    And the canonical portfolio item probe should confirm retired items can be excluded by explicit retired state
