Feature: TS-task-028 duplicate SDG codes are rejected on theme CRUD

  As a teacher
  I want the platform to reject a theme whose SDG list names the same goal twice
  So that a theme's SDG links stay a set and a stored code means exactly one thing

  # TS-task-004 (#287) introduced the SDG-code format pattern
  # SDG<n>(,SDG<n>)*, which accepts a repeated goal: "SDG12,SDG12" was created
  # with 201 before this task. "No repeated group" is not expressible in that
  # regex without enumerating every pair, so format and uniqueness are two
  # separate rules with two separate messages - which is what the precedence
  # scenario below pins down.
  #
  # Every step here already exists for the TS-task-004 suite
  # (theme-input-validation.feature); this feature adds scenarios, not step code.

  # AC-1 (create) and AC-2 (update). Both an adjacent repeat and a repeat
  # separated by another goal are covered on both verbs on purpose: a
  # regex-shaped fix would plausibly catch "SDG12,SDG12" while letting
  # "SDG2,SDG12,SDG2" through, and validate_theme() is shared by both routes.
  # On update, the persistence step re-reads every field, so AC-2's "the stored
  # theme is unchanged" is genuinely verified rather than assumed from the 400.
  @api @theme @TS-task-028
  Scenario Outline: A repeated SDG code is rejected and nothing is stored
    Given I am authenticated as the E2E teacher
    When I submit a theme "<operation>" request with validation field "sdg_code" set to "<value>"
    Then the latest theme API response status should be 400
    And the latest API error detail should equal "SDG-codes mogen niet dubbel voorkomen"
    And no invalid theme data should be persisted from the latest validation request

    Examples: repeat adjacent, separated, and repeated three times
      | operation | value            |
      | create    | SDG12,SDG12      |
      | create    | SDG3,SDG7,SDG3   |
      | create    | SDG1,SDG1,SDG1   |
      | update    | SDG2,SDG12,SDG2  |
      | update    | SDG5,SDG5        |
      | update    | SDG17,SDG4,SDG17 |

  # AC-3, and the negative control for the rule above: rejecting a repeat must
  # not turn into rejecting every compound code. Without this, an implementation
  # that refused all commas would satisfy every rejection scenario here.
  @api @theme @TS-task-028
  Scenario Outline: Distinct SDG codes are still accepted and stored
    Given I am authenticated as the E2E teacher
    When I create a theme with validation field "sdg_code" set to "<value>"
    Then the latest theme API response status should be 201
    And the persisted latest theme field "sdg_code" should equal "<value>"

    Examples: a single code and a distinct compound code
      | value      |
      | SDG9       |
      | SDG2,SDG12 |

  # AC-5. The malformed-AND-repeated values are the interesting half: they
  # satisfy neither rule, so they prove the format check still runs first and
  # the new duplicate message does not swallow the format message. The three
  # plain malformed values keep AC-5's own examples traceable to this task.
  @api @theme @TS-task-028
  Scenario Outline: Malformed SDG codes keep the existing format message
    Given I am authenticated as the E2E teacher
    When I submit a theme "<operation>" request with validation field "sdg_code" set to "<value>"
    Then the latest theme API response status should be 400
    And the latest API error detail should equal "Ongeldig SDG-code formaat. Gebruik bijv. 'SDG1' of 'SDG12,SDG4'"
    And no invalid theme data should be persisted from the latest validation request

    Examples: malformed only
      | operation | value  |
      | create    | BANANA |
      | create    | SDG0   |
      | create    | SDG18  |

    Examples: malformed and repeated - format is reported, not duplication
      | operation | value         |
      | create    | BANANA,BANANA |
      | create    | SDG18,SDG18   |
      | create    | SDG0,SDG0     |
      | update    | SDG18,SDG18   |

  # Guards the falsy branch the uniqueness check must not reach: an empty
  # sdg_code clears the field (theme_repository.update deletes the attribute) and
  # must not be read as a one-element list, or as a duplicate of anything.
  @api @theme @TS-task-028
  Scenario: An empty SDG code still clears the field
    Given I am authenticated as the E2E teacher
    When I update a theme with validation field "sdg_code" set to "empty"
    Then the latest theme API response status should be 200
    And the persisted latest theme field "sdg_code" should equal "null"
