Feature: PF-task-002b portfolio review schema and author relations

  @api @portfolio @schema @pf-task-002b
  Scenario: Portfolio reviews store schema-required fields with bounded optional ratings
    When I probe the portfolio review schema contract
    Then the portfolio review schema probe should confirm review fields round-trip
    And the portfolio review schema probe should enforce required review timestamps
    And the portfolio review schema probe should confirm optional ratings support values from 1 through 5
    And the portfolio review schema probe should reject ratings outside 1 through 5

  @api @portfolio @schema @pf-task-002b
  Scenario: Portfolio reviews are related to items and excluded when their item is retired
    When I probe the portfolio review schema contract
    Then the portfolio review schema probe should confirm reviews belong to one portfolio item
    And the portfolio review schema probe should confirm portfolio items can have multiple reviews
    And the portfolio review schema probe should reject attaching a review to a second item
    And the portfolio review schema probe should confirm reviews on retired items can be excluded from normal reads

  @api @portfolio @schema @pf-task-002b
  Scenario: Portfolio review authors are queryable by caller identity
    When I probe the portfolio review schema contract
    Then the portfolio review schema probe should confirm teacher and supervisor authors resolve by user id
    And the portfolio review schema should document author identity rules for later review permissions
