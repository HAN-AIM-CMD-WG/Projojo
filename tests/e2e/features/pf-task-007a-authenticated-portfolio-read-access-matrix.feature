Feature: PF-task-007a authenticated portfolio read access matrix

  The authenticated portfolio endpoint must enforce an explicit role and
  relationship access matrix at portfolio level: the owner student and any
  teacher read privately, a supervisor is authorized only through a
  relationship gate (a currently open application OR an ever-accepted
  application at their business), and unrelated supervisors, other students,
  and unauthenticated callers are denied without disclosing portfolio data.

  @api @portfolio @pf-task-007a
  Scenario: AC-1 Student owner reads their own canonical portfolio
    Given I am authenticated for PF-task-007a as the portfolio owner student
    When I request the PF-task-007a authenticated portfolio for the portfolio owner student
    Then the latest PF-task-007a API response status should be 200
    And the PF-task-007a portfolio response should describe viewer role "student"
    And the PF-task-007a portfolio response should expose canonical portfolio items rather than stale portfolio data

  @api @portfolio @pf-task-007a
  Scenario: AC-2 Another student is denied without disclosing portfolio data
    Given I am authenticated for PF-task-007a as an unrelated other student
    When I request the PF-task-007a authenticated portfolio for the portfolio owner student
    Then the latest PF-task-007a API response status should be 403
    And the PF-task-007a denial response should not disclose whether the student has portfolio items

  @api @portfolio @pf-task-007a
  Scenario: AC-3 Teacher reads any student portfolio without ownership dependency
    Given I am authenticated for PF-task-007a as the portfolio teacher
    When I request the PF-task-007a authenticated portfolio for the portfolio owner student
    Then the latest PF-task-007a API response status should be 200
    And the PF-task-007a portfolio response should describe viewer role "teacher"
    When I request the PF-task-007a authenticated portfolio for the private student who shares no project or business with the teacher
    Then the latest PF-task-007a API response status should be 200
    And the PF-task-007a portfolio response should describe viewer role "teacher"

  @api @portfolio @pf-task-007a
  Scenario: AC-4 Supervisor with an ever-accepted application passes the portfolio gate
    Given I am authenticated for PF-task-007a as the supervisor whose business ever accepted the student
    When I request the PF-task-007a authenticated portfolio for the portfolio owner student
    Then the latest PF-task-007a API response status should be 200
    And the PF-task-007a portfolio response should describe viewer role "supervisor"

  @api @portfolio @pf-task-007a
  Scenario: AC-4 Supervisor with only a currently open application passes the portfolio gate
    Given I am authenticated for PF-task-007a as the supervisor whose business has only an open application from the student
    When I request the PF-task-007a authenticated portfolio for the portfolio owner student
    Then the latest PF-task-007a API response status should be 200
    And the PF-task-007a portfolio response should describe viewer role "supervisor"

  @api @portfolio @pf-task-007a
  Scenario: AC-5 Unrelated supervisor is denied without disclosing portfolio data
    Given I am authenticated for PF-task-007a as a supervisor with no relationship to the student
    When I request the PF-task-007a authenticated portfolio for the portfolio owner student
    Then the latest PF-task-007a API response status should be 403
    And the PF-task-007a denial response should not disclose whether the student has portfolio items

  @api @portfolio @pf-task-007a
  Scenario: AC-5 Supervisor whose business only rejected the student is denied at portfolio level
    Given I am authenticated for PF-task-007a as the supervisor whose business only rejected the student
    When I request the PF-task-007a authenticated portfolio for the portfolio owner student
    Then the latest PF-task-007a API response status should be 403
    And the PF-task-007a denial response should not disclose whether the student has portfolio items

  @api @portfolio @pf-task-007a
  Scenario: AC-6 Unauthenticated caller is denied on the authenticated endpoint
    When I request the PF-task-007a authenticated portfolio for the portfolio owner student without authentication
    Then the latest PF-task-007a API response status should be 401
    And the PF-task-007a denial response should not disclose whether the student has portfolio items
