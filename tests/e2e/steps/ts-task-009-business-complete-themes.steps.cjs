// TS-task-009 — themes nested in GET /businesses/complete.
//
// API-level suite: the acceptance criteria are entirely about the shape of one
// authenticated backend response, so driving a browser would add nothing but
// flakiness. Setup (theme catalog, project theme links) reuses the shared
// theme-integrity Given steps, which link themes through the real API.

const assert = require('node:assert/strict');

const { Before, Given, Then, When } = require('@qavajs/core');

const {
  CROSS_BUSINESS_PROJECT_ID,
  PROOF_PROJECT_ID,
  PROOF_SUPERVISOR_USER_ID,
  PROOF_TEACHER_USER_ID,
} = require('../support/test-data.cjs');
const { loginToken } = require('../support/e2e-session.cjs');
const { themeApi, getThemeByName } = require('../support/theme-catalog.cjs');

// The response fields GET /businesses/complete returned before this task, read
// off the live endpoint on the pre-change code. Written out literally so the
// backward-compatibility scenario (AC-4) fails loudly if the theme sub-query
// drops, renames, or duplicates any pre-existing field instead of only adding
// `themes`.
//
// MAINTAINERS: a deliberate field addition to /businesses/complete must be added
// here by hand. That is the point — the edit forces you to confirm the change is
// intended. A mis-transcription fails on the first run, so it cannot pass silently.
const PRE_EXISTING_BUSINESS_FIELDS = [
  'company_size', 'country', 'description', 'id', 'image_path',
  'is_archived', 'location', 'name', 'projects', 'sector', 'website',
];
const PRE_EXISTING_PROJECT_FIELDS = [
  'created_at', 'description', 'end_date', 'id', 'image_path',
  'location', 'name', 'start_date', 'tasks',
];
const PRE_EXISTING_TASK_FIELDS = [
  'created_at', 'description', 'end_date', 'id', 'name', 'project_id', 'skills',
  'start_date', 'total_accepted', 'total_completed', 'total_needed',
  'total_registered', 'total_started',
];

const SEEDED_PROOF_TASK_NAME = 'Infrastructure Proof Task';
const SEEDED_PROOF_SKILL_NAME = 'Deterministisch Testen';

const PROJECT_IDS_BY_LABEL = {
  'E2E proof project': PROOF_PROJECT_ID,
  'cross-business E2E project': CROSS_BUSINESS_PROJECT_ID,
};

function createState() {
  return { authToken: null, status: null, body: null };
}

function state(world) {
  if (!world.businessComplete) world.businessComplete = createState();
  return world.businessComplete;
}

Before(function () {
  this.businessComplete = createState();
});

function sortedNames(themes) {
  return themes.map((theme) => theme?.name).sort();
}

function parseNames(names) {
  return names.split(',').map((name) => name.trim()).filter(Boolean).sort();
}

/** The businesses payload of the last request, asserted to be a 200 array. */
function overview(world) {
  const current = state(world);
  assert.equal(
    current.status,
    200,
    `Expected GET /businesses/complete to return 200, received ${current.status}: ${JSON.stringify(current.body)}`,
  );
  assert.ok(Array.isArray(current.body), `Expected GET /businesses/complete to return an array, received ${JSON.stringify(current.body)}`);
  return current.body;
}

/** Locate one nested project by id across every business in the response. */
function projectByLabel(world, label) {
  const projectId = PROJECT_IDS_BY_LABEL[label];
  assert.ok(projectId, `Unknown project label '${label}'`);

  const matches = overview(world)
    .flatMap((business) => business?.projects ?? [])
    .filter((project) => project?.id === projectId);
  assert.equal(matches.length, 1, `Expected exactly one nested project with id ${projectId}, found ${matches.length}`);
  return matches[0];
}

/** The `themes` array of a nested project, asserted to be present and an array. */
function projectThemes(world, label) {
  const project = projectByLabel(world, label);
  assert.ok(
    Object.hasOwn(project, 'themes'),
    `Expected the nested project '${label}' to expose a themes field, received keys: ${Object.keys(project).join(', ')}`,
  );
  assert.ok(Array.isArray(project.themes), `Expected the themes field of '${label}' to be an array, received ${JSON.stringify(project.themes)}`);
  return project.themes;
}

Given('I am authenticated as the E2E supervisor for the business API', async function () {
  state(this).authToken = await loginToken(PROOF_SUPERVISOR_USER_ID);
});

Given('I send no JWT token to the business API', function () {
  state(this).authToken = null;
});

Given('the E2E proof project is linked to no themes', async function () {
  const token = await loginToken(PROOF_TEACHER_USER_ID);
  const result = await themeApi(`/themes/project/${PROOF_PROJECT_ID}`, token, {
    method: 'PUT',
    body: JSON.stringify({ theme_ids: [] }),
  });
  assert.equal(result.status, 200, `Expected clearing the proof project's theme links to return 200, received ${result.status}`);
});

Given('a theme {string} exists without an icon or color', async function (name) {
  // icon and color are @card(0..1) in schema.tql and `str | None` on ThemeCreate,
  // so a theme without them is legal. Created here rather than through the shared
  // theme fixtures, which always populate both.
  const alreadyThere = await getThemeByName(name);
  if (alreadyThere) {
    assert.equal(alreadyThere.icon, null, `Expected the existing theme '${name}' to have no icon`);
    assert.equal(alreadyThere.color, null, `Expected the existing theme '${name}' to have no color`);
    return;
  }

  const token = await loginToken(PROOF_TEACHER_USER_ID);
  const created = await themeApi('/themes/', token, {
    method: 'POST',
    body: JSON.stringify({ name, description: 'TS-task-009 theme without icon or color' }),
  });
  assert.equal(created.status, 201, `Expected creating '${name}' to return 201, received ${created.status}: ${JSON.stringify(created.body)}`);
  assert.equal(created.body?.icon, null, `Expected the created theme '${name}' to have a null icon, received ${JSON.stringify(created.body?.icon)}`);
  assert.equal(created.body?.color, null, `Expected the created theme '${name}' to have a null color, received ${JSON.stringify(created.body?.color)}`);
});

When('I request the complete business overview', async function () {
  const current = state(this);
  const result = await themeApi('/businesses/complete', current.authToken);
  current.status = result.status;
  current.body = result.body;
});

Then('the complete business overview response status should be {int}', function (expected) {
  assert.equal(state(this).status, expected, `Expected status ${expected}, received ${state(this).status}`);
});

Then('the complete business overview response status should be {int} or {int}', function (first, second) {
  const { status } = state(this);
  assert.ok([first, second].includes(status), `Expected status ${first} or ${second}, received ${status}`);
});

Then('the {string} in the complete business overview should have themes {string}', function (label, names) {
  assert.deepEqual(sortedNames(projectThemes(this, label)), parseNames(names));
});

Then('the E2E proof project in the complete business overview should have an empty themes array', function () {
  assert.deepEqual(projectThemes(this, 'E2E proof project'), []);
});

Then('the E2E proof project in the complete business overview should have exactly {int} distinct themes', function (expected) {
  const themes = projectThemes(this, 'E2E proof project');
  assert.equal(themes.length, expected, `Expected ${expected} nested themes, received ${JSON.stringify(sortedNames(themes))}`);
  assert.equal(new Set(themes.map((theme) => theme.id)).size, expected, `Expected ${expected} distinct theme ids, received ${JSON.stringify(themes.map((theme) => theme.id))}`);
});

Then('every theme of the E2E proof project in the complete business overview should expose a populated id and name and a nullable icon and color', function () {
  const themes = projectThemes(this, 'E2E proof project');
  assert.ok(themes.length > 0, 'Expected at least one nested theme to inspect');
  for (const theme of themes) {
    for (const field of ['id', 'name']) {
      assert.equal(typeof theme[field], 'string', `Expected nested theme field '${field}' to be a string, received ${JSON.stringify(theme[field])}`);
      assert.ok(theme[field].length > 0, `Expected nested theme field '${field}' to be non-empty, received an empty string`);
    }
    // icon and color are @card(0..1) in schema.tql and `str | None` on the Theme
    // model, so null is a legitimate value. Asserting "non-empty string" here
    // would document a contract the backend does not offer, and would mislead the
    // frontend tasks that render these fields into skipping their null guards.
    for (const field of ['icon', 'color']) {
      assert.ok(Object.hasOwn(theme, field), `Expected nested theme '${theme.name}' to expose a '${field}' key`);
      assert.ok(
        theme[field] === null || (typeof theme[field] === 'string' && theme[field].length > 0),
        `Expected nested theme field '${field}' to be a non-empty string or null, received ${JSON.stringify(theme[field])}`,
      );
    }
  }
});

Then('the nested themes {string} of the E2E proof project should have a populated icon and color', function (names) {
  // The nullable shape check above deliberately tolerates null, which is correct as a
  // general contract but stops proving that a populated icon/color actually survives
  // the query. These themes are created by the shared fixtures WITH an icon and a
  // colour, so for them a null is a regression, not a legal value. Without this, a
  // per-theme null-out is invisible to the whole suite.
  const themes = projectThemes(this, 'E2E proof project');
  for (const name of parseNames(names)) {
    const theme = themes.find((candidate) => candidate?.name === name);
    assert.ok(theme, `Expected the nested themes to include '${name}', received ${JSON.stringify(sortedNames(themes))}`);
    for (const field of ['icon', 'color']) {
      assert.equal(
        typeof theme[field], 'string',
        `Expected nested theme '${name}' to carry a populated '${field}' (its fixture sets one), received ${JSON.stringify(theme[field])}`,
      );
      assert.ok(theme[field].length > 0, `Expected nested theme '${name}' to carry a non-empty '${field}'`);
    }
  }
});

/** The four compared fields of a theme list, ordered by id so two sources line up. */
function comparableThemes(themes) {
  return themes
    .map((theme) => ({ id: theme.id, name: theme.name, icon: theme.icon, color: theme.color }))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

/** GET /themes/project/{id} — the endpoint the nested themes must agree with. */
async function directProjectThemes(projectId) {
  const result = await themeApi(`/themes/project/${projectId}`, null);
  assert.equal(result.status, 200, `Expected GET /themes/project/${projectId} to return 200, received ${result.status}`);
  assert.ok(Array.isArray(result.body), `Expected GET /themes/project/${projectId} to return an array, received ${JSON.stringify(result.body)}`);
  return result.body;
}

Then('the nested themes of the E2E proof project should equal GET \\/themes\\/project on id, name, icon and color, with every field populated', async function () {
  const nested = projectThemes(this, 'E2E proof project');
  const direct = await directProjectThemes(PROOF_PROJECT_ID);
  assert.ok(direct.length > 0, `Expected GET /themes/project to return a non-empty array, received ${JSON.stringify(direct)}`);

  // Non-null guard so the comparison below cannot pass by comparing null to null.
  // This scenario deliberately links only themes whose icon and color are set; the
  // nullable case is covered by its own scenario.
  for (const theme of comparableThemes(direct)) {
    for (const field of ['id', 'name', 'icon', 'color']) {
      assert.ok(theme[field], `Expected GET /themes/project to return a non-empty '${field}', received ${JSON.stringify(theme[field])}`);
    }
  }

  assert.deepEqual(comparableThemes(nested), comparableThemes(direct));
});

Then('the nested theme {string} of the E2E proof project should have a null icon and color', function (name) {
  const theme = projectThemes(this, 'E2E proof project').find((candidate) => candidate?.name === name);
  assert.ok(theme, `Expected the nested themes to include '${name}'`);
  assert.ok(theme.id, `Expected the nested theme '${name}' to carry a populated id`);
  assert.equal(theme.icon, null, `Expected the nested theme '${name}' to have a null icon, received ${JSON.stringify(theme.icon)}`);
  assert.equal(theme.color, null, `Expected the nested theme '${name}' to have a null color, received ${JSON.stringify(theme.color)}`);
});

Then('the nested theme {string} of the E2E proof project should equal its GET \\/themes\\/project entry', async function (name) {
  const nested = projectThemes(this, 'E2E proof project').find((candidate) => candidate?.name === name);
  assert.ok(nested, `Expected the nested themes to include '${name}'`);
  const direct = (await directProjectThemes(PROOF_PROJECT_ID)).find((candidate) => candidate?.name === name);
  assert.ok(direct, `Expected GET /themes/project to include '${name}'`);

  assert.deepEqual(comparableThemes([nested]), comparableThemes([direct]));
});

Then('the E2E proof project in the complete business overview should still nest its seeded task and skill', function () {
  const project = projectByLabel(this, 'E2E proof project');
  const task = (project.tasks ?? []).find((candidate) => candidate?.name === SEEDED_PROOF_TASK_NAME);
  assert.ok(task, `Expected the proof project to still nest the task '${SEEDED_PROOF_TASK_NAME}'`);
  assert.deepEqual(
    (task.skills ?? []).map((skill) => skill?.name),
    [SEEDED_PROOF_SKILL_NAME],
    `Expected the task '${SEEDED_PROOF_TASK_NAME}' to still nest its seeded skill`,
  );
});

/**
 * A key-set check alone would miss a value-shape change under an unchanged key
 * (e.g. `is_archived` going from `[true]` to `true`), which would break consumers
 * just as hard as a renamed field. Asserting the container fields are still
 * arrays closes that gap cheaply.
 */
function assertArrayFields(record, fields, description) {
  for (const field of fields) {
    assert.ok(Array.isArray(record[field]), `Expected '${field}' on ${description} to still be an array, received ${JSON.stringify(record[field])}`);
  }
}

Then('every business in the complete business overview should expose exactly its pre-existing fields', function () {
  const businesses = overview(this);
  assert.ok(businesses.length > 0, 'Expected at least one business to inspect');
  for (const business of businesses) {
    assert.deepEqual(Object.keys(business).sort(), [...PRE_EXISTING_BUSINESS_FIELDS].sort(), `Unexpected field set on business '${business?.name}'`);
    assertArrayFields(business, ['projects', 'is_archived', 'country', 'sector', 'company_size', 'website'], `business '${business?.name}'`);
  }
});

Then('every project in the complete business overview should expose exactly its pre-existing fields plus themes', function () {
  const projects = overview(this).flatMap((business) => business?.projects ?? []);
  assert.ok(projects.length > 0, 'Expected at least one nested project to inspect');
  const expected = [...PRE_EXISTING_PROJECT_FIELDS, 'themes'].sort();
  for (const project of projects) {
    assert.deepEqual(Object.keys(project).sort(), expected, `Unexpected field set on project '${project?.name}'`);
    assertArrayFields(project, ['tasks', 'themes', 'start_date', 'end_date'], `project '${project?.name}'`);
  }
});

Then('every task in the complete business overview should expose exactly its pre-existing fields', function () {
  const tasks = overview(this)
    .flatMap((business) => business?.projects ?? [])
    .flatMap((project) => project?.tasks ?? []);
  assert.ok(tasks.length > 0, 'Expected at least one nested task to inspect');
  for (const task of tasks) {
    assert.deepEqual(Object.keys(task).sort(), [...PRE_EXISTING_TASK_FIELDS].sort(), `Unexpected field set on task '${task?.name}'`);
    assertArrayFields(task, ['skills', 'start_date', 'end_date'], `task '${task?.name}'`);
  }
});

Then('the complete business overview should include businesses {string}', function (names) {
  const present = overview(this).map((business) => business?.name);
  for (const name of parseNames(names)) {
    assert.ok(present.includes(name), `Expected business '${name}' in the response, received: ${present.join(', ')}`);
  }
});

Then('the complete business overview should not include business {string}', function (name) {
  const present = overview(this).map((business) => business?.name);
  assert.ok(!present.includes(name), `Expected business '${name}' to be excluded from the response`);
});
