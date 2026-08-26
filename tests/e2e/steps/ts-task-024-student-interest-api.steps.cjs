// TS-task-024 - student theme interest schema and backend endpoints.
//
// Level: API. Every acceptance criterion of the issue is a schema or HTTP
// contract, so no browser is involved.
//
// Two deliberate choices:
//   * Theme fixtures are staged through the shared theme-integrity step
//     "the E2E theme catalog contains themes ..." (the E2E seed holds no themes),
//     so this suite adds no second theme-creation path.
//   * Assertions about *persisted* interests always read through a fresh teacher
//     token instead of the scenario's own token. That keeps "what is stored"
//     verifiable in the scenarios where the caller is unauthenticated or
//     forbidden, and AC-8 explicitly allows any authenticated user to read.

const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const { Before, Given, Then, When } = require('@qavajs/core');

const {
  BACKEND_URL,
  E2E_STUDENT_ID,
  E2E_TEACHER_ID,
  PROOF_SUPERVISOR_USER_ID,
  PORTFOLIO_SEED_ALIASES,
} = require('../support/test-data.cjs');
const { fetchThemes, teacherApi } = require('../support/theme-catalog.cjs');

const execFileAsync = promisify(execFile);

const REPO_ROOT = path.resolve(__dirname, '../../..');
const DOCKER_COMPOSE_ARGS = [
  'compose',
  '--env-file',
  '.env.test',
  '-p',
  'projojo-e2e',
  '-f',
  'docker-compose.base.yml',
  '-f',
  'docker-compose.test.yml',
];

// The student whose interests this suite reads and writes, plus the other actors
// AC-7 and AC-8 need. "other student" is a second seeded student account; only
// its id matters here.
const INTEREST_STUDENT_ID = E2E_STUDENT_ID;
const ROLE_ACTORS = Object.freeze({
  'interest student': Object.freeze({ id: INTEREST_STUDENT_ID, type: 'student' }),
  'other student': Object.freeze({ id: PORTFOLIO_SEED_ALIASES.actors.privateStudent.id, type: 'student' }),
  teacher: Object.freeze({ id: E2E_TEACHER_ID, type: 'teacher' }),
  supervisor: Object.freeze({ id: PROOF_SUPERVISOR_USER_ID, type: 'supervisor' }),
});

Before(function () {
  this.tsTask024 = { token: null, status: null, payload: null, schemaText: '', probe: null, themeDeletion: null };
});

function interestState(world) {
  assert.ok(world.tsTask024, 'Expected TS-task-024 scenario state to be initialised');
  return world.tsTask024;
}

/** Call the backend with an explicit token and return {status, body}. */
async function backendApi(pathname, token, options = {}) {
  const response = await fetch(`${BACKEND_URL}${pathname}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      // Keep raw text so an unexpected non-JSON body fails on the status
      // assertion with a readable message instead of a JSON.parse crash.
      body = text;
    }
  }
  return { status: response.status, body };
}

/** Call the interest API as the scenario's current caller and record the result. */
async function interestApi(world, pathname, options = {}) {
  const state = interestState(world);
  const result = await backendApi(pathname, state.token, options);
  state.status = result.status;
  state.payload = result.body;
  return result;
}

async function loginAs(role) {
  const actor = ROLE_ACTORS[role];
  assert.ok(actor, `Unknown E2E interest actor '${role}'`);

  const response = await fetch(`${BACKEND_URL}/auth/test/login/${actor.id}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  assert.equal(response.status, 200, `Expected test login for the E2E ${role} to return 200, received ${response.status}`);

  const payload = await response.json();
  assert.equal(payload?.user?.type, actor.type, `Expected the E2E ${role} fixture to be a ${actor.type}, received ${payload?.user?.type}`);
  assert.ok(payload?.access_token, `Expected test login for the E2E ${role} to return an access token`);
  return payload.access_token;
}

function parseNames(names) {
  return names.split(',').map((name) => name.trim()).filter(Boolean);
}

/** Resolve theme names to catalog ids, failing loudly on a name that is absent. */
async function themeIdsForNames(names) {
  const catalog = await fetchThemes();
  return parseNames(names).map((name) => {
    const theme = catalog.find((candidate) => candidate?.name === name);
    assert.ok(theme?.id, `Expected theme '${name}' in the catalog, found ${JSON.stringify(catalog.map((entry) => entry?.name))}`);
    return theme.id;
  });
}

/**
 * The interest theme names the backend currently has stored for the interest student.
 *
 * Deliberately NOT de-duplicated: the duplicate-id scenario asserts a theme is
 * returned exactly once, which only means something on the raw response.
 */
async function persistedInterestNames() {
  const result = await teacherApi(`/students/${INTEREST_STUDENT_ID}/interests`);
  assert.equal(
    result.status,
    200,
    `Expected GET /students/${INTEREST_STUDENT_ID}/interests to return 200, received ${result.status}: ${JSON.stringify(result.body)}`,
  );
  assert.ok(Array.isArray(result.body), `Expected stored interests to be a list, received ${JSON.stringify(result.body)}`);
  return result.body.map((theme) => theme?.name);
}

/** Save `names` as the interest student's interests through the real endpoint, as that student. */
async function stageInterests(names) {
  const token = await loginAs('interest student');
  const result = await backendApi(`/students/${INTEREST_STUDENT_ID}/interests`, token, {
    method: 'PUT',
    body: JSON.stringify({ theme_ids: await themeIdsForNames(names) }),
  });
  assert.equal(
    result.status,
    200,
    `Expected interest staging to return 200, received ${result.status}: ${JSON.stringify(result.body)}`,
  );

  // Staging must not silently under-deliver: read back what the backend stored.
  assert.deepEqual(
    [...await persistedInterestNames()].sort(),
    parseNames(names).sort(),
    `Expected interest staging to store exactly '${names}'`,
  );
}

// --- AC-1: schema ------------------------------------------------------------

When('I inspect the TypeDB schema for student theme interests', async function () {
  interestState(this).schemaText = await fs.readFile(path.join(REPO_ROOT, 'projojo_backend/db/schema.tql'), 'utf8');
});

Then(
  'the schema should declare a {string} relation relating {string} and {string} with cardinality one',
  function (relationName, firstRole, secondRole) {
    const relationBlock = interestState(this).schemaText.match(new RegExp(`relation\\s+${relationName}\\s*,[\\s\\S]*?;`))?.[0] ?? '';

    assert.ok(relationBlock, `Expected schema.tql to declare a '${relationName}' relation`);
    for (const role of [firstRole, secondRole]) {
      assert.match(
        relationBlock,
        new RegExp(`relates\\s+${role}\\s+@card\\(1\\)`),
        `Expected '${relationName}' to declare \`relates ${role} @card(1)\`, got: ${relationBlock}`,
      );
    }
  },
);

Then('the schema should let the {string} entity play {string} any number of times', function (entityName, roleReference) {
  // One `entity <name> ... ;` declaration, up to its terminating semicolon, so a
  // plays clause from a neighbouring entity cannot satisfy this assertion.
  const entityBlock = interestState(this).schemaText.match(new RegExp(`entity\\s+${entityName}(?:\\s+sub\\s+\\w+)?\\s*,[\\s\\S]*?;`))?.[0] ?? '';

  assert.ok(entityBlock, `Expected schema.tql to declare the '${entityName}' entity`);
  assert.match(
    entityBlock,
    new RegExp(`plays\\s+${roleReference.replace(':', '\\s*:\\s*')}\\s+@card\\(0\\.\\.\\)`),
    `Expected '${entityName}' to declare \`plays ${roleReference} @card(0..)\`, got: ${entityBlock}`,
  );
});

/**
 * Read the student's interest links straight out of the running TypeDB, matching
 * the relation and its roles by name. This is what makes AC-1 an assertion about
 * the *applied* schema rather than about the schema file.
 */
function hasInterestProbeSource(studentId) {
  return String.raw`
import json

from db.initDatabase import Db


def main() -> None:
    try:
        rows = Db.read_transact("""
match
  $student isa student, has id "${studentId}";
  $interest isa hasInterest (student: $student, theme: $theme);
  $theme has name $name;
fetch {
  'name': $name
};
""", sort_fields=False)
        result = {'names': sorted(row['name'] for row in rows)}
    except Exception as error:
        result = {'probe_error': str(error)}
    finally:
        Db.close()

    print(json.dumps(result))


main()
`;
}

When("I probe the live database for the E2E interest student's hasInterest relations", async function () {
  const { stdout, stderr } = await execFileAsync(
    'docker',
    [...DOCKER_COMPOSE_ARGS, 'exec', '-T', 'backend', 'uv', 'run', 'python', '-c', hasInterestProbeSource(INTEREST_STUDENT_ID)],
    { cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 10 },
  );

  const jsonLine = stdout.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean).at(-1);
  assert.ok(jsonLine, `Expected the hasInterest probe to print JSON. stderr: ${stderr}`);
  interestState(this).probe = JSON.parse(jsonLine);
});

Then('the probe should report interest themes {string}', function (names) {
  const probe = interestState(this).probe;
  assert.ok(probe, 'Expected the hasInterest probe to have run');
  assert.equal(probe.probe_error, undefined, `Expected the hasInterest probe to succeed, received: ${probe.probe_error}`);
  assert.deepEqual(probe.names, parseNames(names).sort());
});

// --- Callers -----------------------------------------------------------------

Given('I call the interest API as the E2E {}', async function (role) {
  interestState(this).token = await loginAs(role);
});

Given('I call the interest API without a JWT token', function () {
  interestState(this).token = null;
});

// --- Staging -----------------------------------------------------------------

Given('the E2E interest student has interests {string}', async function (names) {
  await stageInterests(names);
});

Given('the E2E interest student has no interests', async function () {
  await stageInterests('');
});

// --- Requests ----------------------------------------------------------------

When('I request the interests of the E2E interest student', async function () {
  await interestApi(this, `/students/${INTEREST_STUDENT_ID}/interests`);
});

When('I request the interests of student {string}', async function (studentId) {
  await interestApi(this, `/students/${studentId}/interests`);
});

async function putInterests(world, studentId, themeIds) {
  await interestApi(world, `/students/${studentId}/interests`, {
    method: 'PUT',
    body: JSON.stringify({ theme_ids: themeIds }),
  });
}

When("I replace the E2E interest student's interests with themes {string}", async function (names) {
  await putInterests(this, INTEREST_STUDENT_ID, await themeIdsForNames(names));
});

When("I replace the E2E interest student's interests with no themes", async function () {
  await putInterests(this, INTEREST_STUDENT_ID, []);
});

When("I replace the E2E interest student's interests with theme {string} sent twice", async function (name) {
  const [themeId] = await themeIdsForNames(name);
  await putInterests(this, INTEREST_STUDENT_ID, [themeId, themeId]);
});

When(
  "I replace the E2E interest student's interests with themes {string} and invalid theme ids {string}",
  async function (names, invalidThemeIds) {
    await putInterests(this, INTEREST_STUDENT_ID, [...await themeIdsForNames(names), ...parseNames(invalidThemeIds)]);
  },
);

When("I replace the E2E interest student's interests with invalid theme ids {string}", async function (invalidThemeIds) {
  await putInterests(this, INTEREST_STUDENT_ID, parseNames(invalidThemeIds));
});

When("I replace the E2E interest student's interests with a non-list theme_ids value", async function () {
  await interestApi(this, `/students/${INTEREST_STUDENT_ID}/interests`, {
    method: 'PUT',
    body: JSON.stringify({ theme_ids: 'Duurzaamheid' }),
  });
});

When('I replace the interests of student {string} with themes {string}', async function (studentId, names) {
  await putInterests(this, studentId, await themeIdsForNames(names));
});

When('the E2E teacher deletes theme {string}', async function (name) {
  const [themeId] = await themeIdsForNames(name);
  interestState(this).themeDeletion = await teacherApi(`/themes/${themeId}`, { method: 'DELETE' });
});

// --- Response assertions -----------------------------------------------------

Then('the latest interest API response status should be {int}', function (expectedStatus) {
  const state = interestState(this);
  assert.equal(
    state.status,
    expectedStatus,
    `Expected the latest interest API status to be ${expectedStatus}, received ${state.status}: ${JSON.stringify(state.payload)}`,
  );
});

Then('the latest interest API error detail should equal {string}', function (expectedDetail) {
  assert.equal(interestState(this).payload?.detail, expectedDetail);
});

Then('the latest interest API error detail should contain {string}', function (expectedFragment) {
  const detail = interestState(this).payload?.detail;
  assert.ok(
    typeof detail === 'string' && detail.includes(expectedFragment),
    `Expected the error detail to contain '${expectedFragment}', received ${JSON.stringify(detail)}`,
  );
});

Then('the latest interest API response should list themes {string}', function (names) {
  const payload = interestState(this).payload;
  assert.ok(Array.isArray(payload), `Expected the latest interest API response to be a list, received ${JSON.stringify(payload)}`);
  assert.deepEqual(payload.map((theme) => theme?.name).sort(), parseNames(names).sort());
});

Then('the latest interest API response should be an empty list', function () {
  assert.deepEqual(interestState(this).payload, []);
});

Then('every listed interest should match the theme catalog on id, name, icon, color and sdg_code', async function () {
  const payload = interestState(this).payload;
  assert.ok(Array.isArray(payload) && payload.length > 0, `Expected a non-empty interest list, received ${JSON.stringify(payload)}`);

  const catalog = await fetchThemes();
  for (const interest of payload) {
    const catalogTheme = catalog.find((theme) => theme?.id === interest?.id);
    assert.ok(catalogTheme, `Expected interest id '${interest?.id}' to exist in the theme catalog`);

    for (const field of ['id', 'name', 'icon', 'color', 'sdg_code']) {
      // Non-empty first: an interest whose icon/color/sdg_code came back null
      // would otherwise pass the comparison without proving anything.
      assert.ok(
        typeof interest[field] === 'string' && interest[field].length > 0,
        `Expected interest '${interest?.name}' to expose a non-empty ${field}, received ${JSON.stringify(interest[field])}`,
      );
      assert.equal(
        interest[field],
        catalogTheme[field],
        `Expected interest '${interest.name}' field ${field} to match the catalog value ${JSON.stringify(catalogTheme[field])}`,
      );
    }
  }
});

Then('the theme deletion should have succeeded', function () {
  const result = interestState(this).themeDeletion;
  assert.ok(result, 'Expected a theme deletion to have been attempted');
  assert.equal(
    result.status,
    200,
    `Expected the theme deletion to return 200, received ${result.status}: ${JSON.stringify(result.body)}`,
  );
});

// --- Persisted-state assertions ---------------------------------------------

Then('the persisted interests of the E2E interest student should be exactly {string}', async function (names) {
  assert.deepEqual([...await persistedInterestNames()].sort(), parseNames(names).sort());
});

Then('the persisted interests of the E2E interest student should be empty', async function () {
  assert.deepEqual(await persistedInterestNames(), []);
});

Then('the persisted interests of the E2E interest student should contain {string} exactly once', async function (name) {
  const storedNames = await persistedInterestNames();
  const occurrences = storedNames.filter((stored) => stored === name).length;
  assert.equal(occurrences, 1, `Expected '${name}' to be stored exactly once, found ${occurrences} in ${JSON.stringify(storedNames)}`);
});

Then('the persisted interests of the E2E interest student should not contain {string}', async function (name) {
  const storedNames = await persistedInterestNames();
  assert.ok(!storedNames.includes(name), `Expected '${name}' not to be stored, found ${JSON.stringify(storedNames)}`);
});
