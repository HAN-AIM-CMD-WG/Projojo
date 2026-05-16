Feature: PF-task-002d portfolio seed fixtures and reset contract

  @api @portfolio @seed @pf-task-002d
  Scenario: Required portfolio seed aliases resolve to deterministic fixtures
    Given the deterministic portfolio seed fixtures are loaded
    Then the portfolio seed should expose stable aliases for required actors and source records
    And the portfolio seed should expose stable aliases for required items and reviews

  @api @portfolio @seed @pf-task-002d
  Scenario: Rating, visibility, public sharing, and archive states are available
    Given the deterministic portfolio seed fixtures are loaded
    Then the portfolio seed should include no-rating, good-rating, and low-rating item states
    And the portfolio seed should include hidden and retracted authenticated-public item states
    And the portfolio seed should include a world-public page with a selected item and selected review
    And the portfolio seed should include an archived-source item state

  @api @portfolio @seed @pf-task-002d
  Scenario: Reset contract supports later portfolio API baseline tests
    Given the deterministic portfolio seed fixtures are loaded
    Then the portfolio seed should support baseline lookup by aliases without generated IDs
    And the portfolio seed should include existing and unused public slug fixtures
    And the portfolio reset and verification commands should be documented near the seed contract
