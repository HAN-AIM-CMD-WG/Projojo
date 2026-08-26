Feature: TS-task-024 student interest schema and backend endpoints

  A student records which themes they are interested in, so the platform can later
  recommend matching projects. Interests are stored as their own relation and are
  managed through GET/PUT /students/{student_id}/interests.

  Rule: The schema models a student's interests as a hasInterest relation (AC-1)

    @api @theme @schema @ts-task-024
    Scenario: The declared schema relates exactly one student to exactly one theme per interest
      When I inspect the TypeDB schema for student theme interests
      Then the schema should declare a "hasInterest" relation relating "student" and "theme" with cardinality one
      And the schema should let the "student" entity play "hasInterest:student" any number of times
      And the schema should let the "theme" entity play "hasInterest:theme" any number of times

    @api @theme @schema @ts-task-024
    Scenario: The applied database stores saved interests as hasInterest relations
      Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu"
      And the E2E interest student has interests "Duurzaamheid"
      When I probe the live database for the E2E interest student's hasInterest relations
      Then the probe should report interest themes "Duurzaamheid"

  Rule: Any authenticated user can read a student's interests (AC-2, AC-3, AC-8)

    @api @theme @ts-task-024
    Scenario: Saved interests are returned with their theme details
      Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu"
      And the E2E interest student has interests "Duurzaamheid,Klimaat & Milieu"
      And I call the interest API as the E2E interest student
      When I request the interests of the E2E interest student
      Then the latest interest API response status should be 200
      And the latest interest API response should list themes "Duurzaamheid,Klimaat & Milieu"
      And every listed interest should match the theme catalog on id, name, icon, color and sdg_code

    @api @theme @ts-task-024
    Scenario: A student without interests gets an empty list
      Given the E2E theme catalog contains themes "Duurzaamheid"
      And the E2E interest student has no interests
      And I call the interest API as the E2E interest student
      When I request the interests of the E2E interest student
      Then the latest interest API response status should be 200
      And the latest interest API response should be an empty list

    @api @theme @ts-task-024
    Scenario Outline: Reading interests is open to every authenticated role
      Given the E2E theme catalog contains themes "Duurzaamheid"
      And the E2E interest student has interests "Duurzaamheid"
      And I call the interest API as the E2E <role>
      When I request the interests of the E2E interest student
      Then the latest interest API response status should be 200
      And the latest interest API response should list themes "Duurzaamheid"

      Examples:
        | role          |
        | teacher       |
        | supervisor    |
        | other student |

    @api @theme @ts-task-024
    Scenario: Reading interests without a token is rejected
      Given I call the interest API without a JWT token
      When I request the interests of the E2E interest student
      Then the latest interest API response status should be 401

    @api @theme @ts-task-024
    Scenario: Reading the interests of an unknown student reports not found
      Given I call the interest API as the E2E interest student
      When I request the interests of student "ts-task-024-unknown-student"
      Then the latest interest API response status should be 404
      And the latest interest API error detail should equal "Student niet gevonden"

  Rule: A student replaces their whole interest selection in one call (AC-4, AC-5, AC-10)

    @api @theme @ts-task-024
    Scenario: Saving a new selection replaces the previous one
      Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu,Innovatie & Technologie,Water & Biodiversiteit"
      And the E2E interest student has interests "Duurzaamheid,Klimaat & Milieu"
      And I call the interest API as the E2E interest student
      When I replace the E2E interest student's interests with themes "Innovatie & Technologie,Water & Biodiversiteit"
      Then the latest interest API response status should be 200
      And the latest interest API response should list themes "Innovatie & Technologie,Water & Biodiversiteit"
      And the persisted interests of the E2E interest student should be exactly "Innovatie & Technologie,Water & Biodiversiteit"

    @api @theme @ts-task-024
    Scenario: Saving an empty selection clears every interest
      Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu"
      And the E2E interest student has interests "Duurzaamheid,Klimaat & Milieu"
      And I call the interest API as the E2E interest student
      When I replace the E2E interest student's interests with no themes
      Then the latest interest API response status should be 200
      And the latest interest API response should be an empty list
      And the persisted interests of the E2E interest student should be empty

    @api @theme @ts-task-024
    Scenario: A selection of seven themes is saved in full
      Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu,Innovatie & Technologie,Water & Biodiversiteit,Voedselzekerheid,Kennisdeling,Onderwijs"
      And I call the interest API as the E2E interest student
      When I replace the E2E interest student's interests with themes "Duurzaamheid,Klimaat & Milieu,Innovatie & Technologie,Water & Biodiversiteit,Voedselzekerheid,Kennisdeling,Onderwijs"
      Then the latest interest API response status should be 200
      And the persisted interests of the E2E interest student should be exactly "Duurzaamheid,Klimaat & Milieu,Innovatie & Technologie,Water & Biodiversiteit,Voedselzekerheid,Kennisdeling,Onderwijs"

    @api @theme @ts-task-024
    Scenario: A theme sent twice is saved once
      Given the E2E theme catalog contains themes "Duurzaamheid"
      And I call the interest API as the E2E interest student
      When I replace the E2E interest student's interests with theme "Duurzaamheid" sent twice
      Then the latest interest API response status should be 200
      And the persisted interests of the E2E interest student should contain "Duurzaamheid" exactly once

    @api @theme @ts-task-024
    Scenario: A non-list theme_ids value is rejected as unprocessable
      Given I call the interest API as the E2E interest student
      When I replace the E2E interest student's interests with a non-list theme_ids value
      Then the latest interest API response status should be 422

  Rule: Unknown theme ids are rejected without changing anything (AC-6, AC-9)

    @api @theme @integrity @ts-task-024
    Scenario: An unknown theme id is reported and the saved selection is kept
      Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu,Innovatie & Technologie"
      And the E2E interest student has interests "Duurzaamheid,Klimaat & Milieu"
      And I call the interest API as the E2E interest student
      When I replace the E2E interest student's interests with themes "Innovatie & Technologie" and invalid theme ids "ts-task-024-missing-theme"
      Then the latest interest API response status should be 400
      And the latest interest API error detail should contain "ts-task-024-missing-theme"
      And the persisted interests of the E2E interest student should be exactly "Duurzaamheid,Klimaat & Milieu"
      And the persisted interests of the E2E interest student should not contain "Innovatie & Technologie"

    @api @theme @integrity @ts-task-024
    Scenario: Every unknown theme id is listed in the error
      Given the E2E theme catalog contains themes "Duurzaamheid"
      And the E2E interest student has interests "Duurzaamheid"
      And I call the interest API as the E2E interest student
      When I replace the E2E interest student's interests with invalid theme ids "ts-task-024-missing-a,ts-task-024-missing-b"
      Then the latest interest API response status should be 400
      And the latest interest API error detail should contain "ts-task-024-missing-a"
      And the latest interest API error detail should contain "ts-task-024-missing-b"
      And the persisted interests of the E2E interest student should be exactly "Duurzaamheid"

  Rule: Only the student themselves may change their interests (AC-7)

    @api @theme @security @ts-task-024
    Scenario Outline: Other users cannot change a student's interests
      Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu"
      And the E2E interest student has interests "Duurzaamheid"
      And I call the interest API as the E2E <role>
      When I replace the E2E interest student's interests with themes "Klimaat & Milieu"
      Then the latest interest API response status should be 403
      And the persisted interests of the E2E interest student should be exactly "Duurzaamheid"

      Examples:
        | role          |
        | other student |
        | supervisor    |
        | teacher       |

    @api @theme @security @ts-task-024
    Scenario: Changing interests without a token is rejected
      Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu"
      And the E2E interest student has interests "Duurzaamheid"
      And I call the interest API without a JWT token
      When I replace the E2E interest student's interests with themes "Klimaat & Milieu"
      Then the latest interest API response status should be 401
      And the persisted interests of the E2E interest student should be exactly "Duurzaamheid"

    @api @theme @security @ts-task-024
    Scenario: A student cannot write interests under an unknown student id
      Given the E2E theme catalog contains themes "Duurzaamheid"
      And I call the interest API as the E2E interest student
      When I replace the interests of student "ts-task-024-unknown-student" with themes "Duurzaamheid"
      Then the latest interest API response status should be 403

  Rule: Removing a theme keeps saved interests consistent

    @api @theme @integrity @ts-task-024
    Scenario: Deleting a theme removes it from the students who saved it
      Given the E2E theme catalog contains themes "Duurzaamheid,Klimaat & Milieu"
      And the E2E interest student has interests "Duurzaamheid,Klimaat & Milieu"
      When the E2E teacher deletes theme "Klimaat & Milieu"
      Then the theme deletion should have succeeded
      And the persisted interests of the E2E interest student should be exactly "Duurzaamheid"
