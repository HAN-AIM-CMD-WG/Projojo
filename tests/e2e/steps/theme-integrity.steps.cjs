const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

const { Before, Given, Then, When } = require('@qavajs/core');

const {
  BACKEND_URL,
  CROSS_BUSINESS_PROJECT_ID,
  PROOF_PROJECT_ID,
  PROOF_TEACHER_USER_ID,
  PROOF_STUDENT_USER_ID,
  PROOF_SUPERVISOR_USER_ID,
} = require('../support/test-data.cjs');

const REPO_ROOT = path.resolve(__dirname, '../../..');

const EXPECTED_SEED_THEME_NAMES = [
  'Duurzaamheid',
  'Klimaat & Milieu',
  'Innovatie & Technologie',
  'Voedselzekerheid',
  'Water & Biodiversiteit',
  'Kennisdeling',
];

const themeFixtures = {
  Duurzaamheid: {
    sdg_code: 'SDG12',
    icon: 'eco',
    description: 'Duurzame projecten en circulaire oplossingen.',
    color: '#4CAF50',
    display_order: 1,
  },
  'Klimaat & Milieu': {
    sdg_code: 'SDG13',
    icon: 'public',
    description: 'Klimaatactie en milieubescherming.',
    color: '#2196F3',
    display_order: 2,
  },
};

function createThemeIntegrityState() {
  return {
    authToken: null,
    lastThemeApiStatus: null,
    lastThemeApiPayload: null,
    inspectedText: '',
    themesByName: new Map(),
    rememberedProjectThemeNames: new Map(),
    validationCounter: 0,
    latestValidationOperation: null,
    latestValidationThemeId: null,
    latestValidationSentName: null,
    latestValidationOriginalTheme: null,
    latestValidationThemeCountBefore: null,
  };
}

function themeState(world) {
  if (!world.themeIntegrity) {
    world.themeIntegrity = createThemeIntegrityState();
  }
  return world.themeIntegrity;
}

Before(function () {
  this.themeIntegrity = createThemeIntegrityState();
});

async function themeApi(world, pathname, options = {}) {
  const state = themeState(world);
  const headers = {
    Accept: 'application/json',
    ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    ...(state.authToken ? { Authorization: `Bearer ${state.authToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BACKEND_URL}${pathname}`, { ...options, headers });
  const text = await response.text();
  state.lastThemeApiStatus = response.status;
  state.lastThemeApiPayload = text ? JSON.parse(text) : null;
  return state.lastThemeApiPayload;
}

async function getThemes(world) {
  const state = themeState(world);
  const payload = await themeApi(world, '/themes/');
  assert.equal(state.lastThemeApiStatus, 200, `Expected GET /themes/ to return 200, received ${state.lastThemeApiStatus}`);
  assert.ok(Array.isArray(payload), 'Expected GET /themes/ to return an array');
  return payload;
}

async function findThemeByName(world, name) {
  const themes = await getThemes(world);
  return themes.find((theme) => theme?.name === name) ?? null;
}

async function getThemeById(world, themeId) {
  const payload = await themeApi(world, `/themes/${themeId}`);
  assert.equal(themeState(world).lastThemeApiStatus, 200, `Expected GET /themes/${themeId} to return 200`);
  return payload;
}

async function createTheme(world, name) {
  const fixture = themeFixtures[name] ?? {
    sdg_code: 'SDG1',
    icon: 'label',
    description: `E2E theme fixture for ${name}`,
    color: '#4CAF50',
    display_order: 99,
  };

  return themeApi(world, '/themes/', {
    method: 'POST',
    body: JSON.stringify({ name, ...fixture }),
  });
}

function nextValidationThemeName(world) {
  const state = themeState(world);
  state.validationCounter += 1;
  return `TS004 Validation ${Date.now()}-${state.validationCounter}`;
}

function validationValue(field, value) {
  if (value === 'empty') return '';
  if (value === 'whitespace only') return '   ';
  if (value === '101 characters') return 'N'.repeat(101);
  if (value === '51 characters') return 'i'.repeat(51);
  if (value === '501 characters') return 'd'.repeat(501);
  if (value === 'non-integer') return 'not-a-number';
  if (value === 'null') return null;
  if (field === 'display_order') return Number(value);
  return value;
}

function createThemeValidationPayload(world) {
  return {
    name: nextValidationThemeName(world),
    sdg_code: 'SDG1',
    icon: 'label',
    description: 'E2E theme validation fixture.',
    color: '#4CAF50',
    display_order: 99,
  };
}

function setValidationField(payload, field, value) {
  assert.ok(
    ['name', 'sdg_code', 'icon', 'description', 'color', 'display_order'].includes(field),
    `Unsupported theme validation field '${field}'`,
  );

  if (value === 'omitted') {
    delete payload[field];
    return;
  }

  payload[field] = validationValue(field, value);
}

async function ensureTheme(world, name) {
  const state = themeState(world);
  const existingTheme = await findThemeByName(world, name);
  if (existingTheme) {
    state.themesByName.set(name, existingTheme);
    return existingTheme;
  }

  const payload = await createTheme(world, name);
  assert.equal(
    state.lastThemeApiStatus,
    201,
    `Expected setup create for '${name}' to return 201, received ${state.lastThemeApiStatus}: ${JSON.stringify(payload)}`,
  );
  state.themesByName.set(name, payload);
  return payload;
}

function parseThemeNames(names) {
  return names.split(',').map((name) => name.trim()).filter(Boolean);
}

async function themeIdsForNames(world, names) {
  const state = themeState(world);
  const themeIds = [];
  for (const name of parseThemeNames(names)) {
    const theme = state.themesByName.get(name) ?? await findThemeByName(world, name);
    assert.ok(theme?.id, `Expected theme '${name}' to exist before linking it to a project`);
    state.themesByName.set(name, theme);
    themeIds.push(theme.id);
  }
  return themeIds;
}

async function replaceProjectThemes(world, projectId, names) {
  await themeApi(world, `/themes/project/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify({ theme_ids: await themeIdsForNames(world, names) }),
  });
}

async function getProjectThemeNames(world, projectId) {
  const state = themeState(world);
  const payload = await themeApi(world, `/themes/project/${projectId}`);
  assert.equal(state.lastThemeApiStatus, 200, `Expected project theme lookup to return 200, received ${state.lastThemeApiStatus}`);
  assert.ok(Array.isArray(payload), `Expected project theme lookup to return a list, received ${JSON.stringify(payload)}`);
  // TS-task-003 proves authorization and visible membership, not hasTheme relation cardinality.
  return [...new Set(payload.map((theme) => theme?.name).filter(Boolean))].sort();
}

async function authenticateAs(world, userId, expectedType) {
  const response = await fetch(`${BACKEND_URL}/auth/test/login/${userId}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  assert.equal(response.status, 200, `Expected E2E ${expectedType} login to return 200, received ${response.status}`);

  const payload = await response.json();
  assert.equal(payload?.user?.type, expectedType, `Expected test login to authenticate a ${expectedType}`);
  assert.ok(payload?.access_token, 'Expected test login to return an access token');
  themeState(world).authToken = payload.access_token;
}

function requestBodyFor(method, pathname) {
  if (method === 'POST' && pathname === '/themes/') {
    return JSON.stringify({
      name: 'JWT Middleware Probe',
      sdg_code: 'SDG1',
      icon: 'lock',
      description: 'This request should be rejected before persistence.',
      color: '#4CAF50',
      display_order: 99,
    });
  }

  if (method === 'PUT' && pathname.startsWith('/themes/project/')) {
    return JSON.stringify({ theme_ids: [] });
  }

  if (method === 'PUT') {
    return JSON.stringify({ name: 'JWT Middleware Probe Update' });
  }

  return undefined;
}

When('I inspect the TypeDB schema for the theme entity', async function () {
  themeState(this).inspectedText = await fs.readFile(path.join(REPO_ROOT, 'projojo_backend/db/schema.tql'), 'utf8');
});

Then('the theme name attribute should be required and unique', function () {
  const themeBlock = themeState(this).inspectedText.match(/entity\s+theme,[\s\S]*?plays\s+hasTheme:theme\s+@card\(0\.\.\);/)?.[0] ?? '';

  assert.match(
    themeBlock,
    /owns\s+name\s+@card\(1\)\s+@unique\s*,/,
    'Expected theme entity to declare `owns name @card(1) @unique,`',
  );
});

When('I inspect the TypeDB seed file for theme data', async function () {
  themeState(this).inspectedText = await fs.readFile(path.join(REPO_ROOT, 'projojo_backend/db/seed.tql'), 'utf8');
});

Then('the seed file should declare each expected theme name once and no duplicate theme names', function () {
  const themeEntityBlocks = [...themeState(this).inspectedText.matchAll(/^\s*\$theme\w*\s+isa\s+theme,[\s\S]*?;/gm)].map((match) => match[0]);
  const seedThemeNames = themeEntityBlocks
    .map((block) => block.match(/has name "([^"]+)"/)?.[1])
    .filter(Boolean);

  for (const expectedName of EXPECTED_SEED_THEME_NAMES) {
    const occurrences = seedThemeNames.filter((name) => name === expectedName).length;
    assert.equal(occurrences, 1, `Expected seed theme '${expectedName}' once, found ${occurrences}`);
  }

  assert.equal(
    new Set(seedThemeNames).size,
    seedThemeNames.length,
    `Expected all seed theme names to be unique, found: ${seedThemeNames.join(', ')}`,
  );
});

Given('I am authenticated as the E2E teacher', async function () {
  await authenticateAs(this, PROOF_TEACHER_USER_ID, 'teacher');
});

Given('I am authenticated as the E2E student', async function () {
  await authenticateAs(this, PROOF_STUDENT_USER_ID, 'student');
});

Given('I am authenticated as the E2E supervisor', async function () {
  await authenticateAs(this, PROOF_SUPERVISOR_USER_ID, 'supervisor');
});

Given('I do not send a JWT token to the theme API', function () {
  themeState(this).authToken = null;
});

Given('theme {string} exists', async function (name) {
  assert.ok(themeState(this).authToken, 'Expected an authenticated teacher before creating setup themes');
  await ensureTheme(this, name);
});

Given('the E2E theme catalog contains themes {string}', async function (names) {
  await authenticateAs(this, PROOF_TEACHER_USER_ID, 'teacher');
  for (const name of parseThemeNames(names)) {
    await ensureTheme(this, name);
  }
});

When('I create a theme named {string}', async function (name) {
  await createTheme(this, name);
});

When('I request the public theme collection', async function () {
  await themeApi(this, '/themes/');
});

When('I request public theme {string} by id', async function (name) {
  const state = themeState(this);
  const theme = state.themesByName.get(name) ?? await findThemeByName(this, name);
  assert.ok(theme?.id, `Expected theme '${name}' to exist before requesting it by id`);

  await themeApi(this, `/themes/${theme.id}`);
});

When('I request public theme id {string}', async function (themeId) {
  await themeApi(this, `/themes/${themeId}`);
});

When('I request the public themes for the E2E proof project', async function () {
  await themeApi(this, `/themes/project/${PROOF_PROJECT_ID}`);
});

When('I call the theme API with method {string} and path {string}', async function (method, pathname) {
  await themeApi(this, pathname, {
    method,
    body: requestBodyFor(method, pathname),
  });
});

When('I call the teacher-only theme API with method {string} and path {string} using theme {string}', async function (method, pathTemplate, name) {
  const state = themeState(this);
  let pathname = pathTemplate;
  if (pathTemplate.includes('{theme_id}')) {
    const theme = state.themesByName.get(name) ?? await findThemeByName(this, name);
    assert.ok(theme?.id, `Expected theme '${name}' to exist before calling ${method} ${pathTemplate}`);
    pathname = pathTemplate.replace('{theme_id}', theme.id);
  }

  await themeApi(this, pathname, {
    method,
    body: requestBodyFor(method, pathname),
  });
});

When("I replace the E2E proof project's theme links with no themes", async function () {
  await themeApi(this, `/themes/project/${PROOF_PROJECT_ID}`, {
    method: 'PUT',
    body: JSON.stringify({ theme_ids: [] }),
  });
});

Given('the E2E proof project is linked to themes {string}', async function (names) {
  const state = themeState(this);
  await authenticateAs(this, PROOF_TEACHER_USER_ID, 'teacher');
  await replaceProjectThemes(this, PROOF_PROJECT_ID, names);
  assert.equal(
    state.lastThemeApiStatus,
    200,
    `Expected setup link for E2E proof project to return 200, received ${state.lastThemeApiStatus}: ${JSON.stringify(state.lastThemeApiPayload)}`,
  );
});

Given('the cross-business E2E project is linked to themes {string}', async function (names) {
  const state = themeState(this);
  await authenticateAs(this, PROOF_TEACHER_USER_ID, 'teacher');
  await replaceProjectThemes(this, CROSS_BUSINESS_PROJECT_ID, names);
  assert.equal(
    state.lastThemeApiStatus,
    200,
    `Expected setup link for cross-business E2E project to return 200, received ${state.lastThemeApiStatus}: ${JSON.stringify(state.lastThemeApiPayload)}`,
  );
});

Given("I remember the E2E proof project's theme links", async function () {
  themeState(this).rememberedProjectThemeNames.set(PROOF_PROJECT_ID, await getProjectThemeNames(this, PROOF_PROJECT_ID));
});

Given("I remember the cross-business E2E project's theme links", async function () {
  themeState(this).rememberedProjectThemeNames.set(CROSS_BUSINESS_PROJECT_ID, await getProjectThemeNames(this, CROSS_BUSINESS_PROJECT_ID));
});

When("I replace the E2E proof project's theme links with themes {string}", async function (names) {
  await replaceProjectThemes(this, PROOF_PROJECT_ID, names);
});

When("I replace the cross-business E2E project's theme links with themes {string}", async function (names) {
  await replaceProjectThemes(this, CROSS_BUSINESS_PROJECT_ID, names);
});

When('I rename theme {string} to {string}', async function (currentName, newName) {
  assert.ok(themeState(this).authToken, 'Expected an authenticated teacher before updating a theme');
  const theme = await findThemeByName(this, currentName);
  assert.ok(theme?.id, `Expected theme '${currentName}' to exist before rename`);

  await themeApi(this, `/themes/${theme.id}`, {
    method: 'PUT',
    body: JSON.stringify({ name: newName }),
  });
});

When('I submit a theme {string} request with validation field {string} set to {string}', async function (operation, field, value) {
  const state = themeState(this);
  assert.ok(state.authToken, 'Expected an authenticated teacher before submitting a validation request');
  state.latestValidationOperation = operation;
  state.latestValidationThemeId = null;
  state.latestValidationSentName = null;
  state.latestValidationOriginalTheme = null;
  state.latestValidationThemeCountBefore = null;

  if (operation === 'create') {
    const payload = createThemeValidationPayload(this);
    setValidationField(payload, field, value);
    state.latestValidationSentName = payload.name;
    state.latestValidationThemeCountBefore = (await getThemes(this)).length;
    await themeApi(this, '/themes/', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return;
  }

  if (operation === 'update') {
    const setupPayload = await themeApi(this, '/themes/', {
      method: 'POST',
      body: JSON.stringify(createThemeValidationPayload(this)),
    });
    assert.equal(
      themeState(this).lastThemeApiStatus,
      201,
      `Expected setup theme create to return 201, received ${themeState(this).lastThemeApiStatus}: ${JSON.stringify(setupPayload)}`,
    );
    state.latestValidationThemeId = setupPayload.id;
    state.latestValidationOriginalTheme = await getThemeById(this, setupPayload.id);

    const updatePayload = {};
    setValidationField(updatePayload, field, value);
    await themeApi(this, `/themes/${setupPayload.id}`, {
      method: 'PUT',
      body: JSON.stringify(updatePayload),
    });
    return;
  }

  assert.fail(`Unsupported theme validation operation '${operation}'`);
});

When('I create a theme with validation field {string} set to {string}', async function (field, value) {
  const state = themeState(this);
  assert.ok(state.authToken, 'Expected an authenticated teacher before creating a validation theme');
  state.latestValidationOperation = 'create';
  state.latestValidationThemeId = null;
  const payload = createThemeValidationPayload(this);
  setValidationField(payload, field, value);
  const responsePayload = await themeApi(this, '/themes/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  state.latestValidationThemeId = responsePayload?.id ?? null;
});

When('I update a theme with validation field {string} set to {string}', async function (field, value) {
  const state = themeState(this);
  assert.ok(state.authToken, 'Expected an authenticated teacher before updating a validation theme');
  const setupPayload = await themeApi(this, '/themes/', {
    method: 'POST',
    body: JSON.stringify(createThemeValidationPayload(this)),
  });
  assert.equal(
    state.lastThemeApiStatus,
    201,
    `Expected setup theme create to return 201, received ${state.lastThemeApiStatus}: ${JSON.stringify(setupPayload)}`,
  );

  const updatePayload = {};
  setValidationField(updatePayload, field, value);
  const responsePayload = await themeApi(this, `/themes/${setupPayload.id}`, {
    method: 'PUT',
    body: JSON.stringify(updatePayload),
  });
  state.latestValidationOperation = 'update';
  state.latestValidationThemeId = responsePayload?.id ?? setupPayload.id;
});

Then('the latest theme API response status should be {int}', function (expectedStatus) {
  const state = themeState(this);
  assert.equal(state.lastThemeApiStatus, expectedStatus, `Expected latest theme API status to be ${expectedStatus}, received ${state.lastThemeApiStatus}`);
});

Then('the latest theme API response should be a list', function () {
  const payload = themeState(this).lastThemeApiPayload;
  assert.ok(Array.isArray(payload), `Expected latest theme API response to be a list, received ${JSON.stringify(payload)}`);
});

Then('the latest API error detail should equal {string}', function (expectedDetail) {
  assert.equal(themeState(this).lastThemeApiPayload?.detail, expectedDetail);
});

Then('the latest theme API response status should be 401 or 403', function () {
  const status = themeState(this).lastThemeApiStatus;
  assert.ok(
    [401, 403].includes(status),
    `Expected latest theme API status to be 401 or 403, received ${status}`,
  );
});

Then('the latest theme API response message should equal {string}', function (expectedMessage) {
  assert.equal(themeState(this).lastThemeApiPayload?.message, expectedMessage);
});

Then('the E2E proof project should be linked to themes {string}', async function (names) {
  const actualNames = await getProjectThemeNames(this, PROOF_PROJECT_ID);
  assert.deepEqual(actualNames, parseThemeNames(names).sort());
});

Then('the cross-business E2E project should be linked to themes {string}', async function (names) {
  const actualNames = await getProjectThemeNames(this, CROSS_BUSINESS_PROJECT_ID);
  assert.deepEqual(actualNames, parseThemeNames(names).sort());
});

Then("the E2E proof project should keep its remembered theme links", async function () {
  const expectedNames = themeState(this).rememberedProjectThemeNames.get(PROOF_PROJECT_ID);
  assert.ok(expectedNames, 'Expected E2E proof project theme links to be remembered before this assertion');
  assert.deepEqual(await getProjectThemeNames(this, PROOF_PROJECT_ID), expectedNames);
});

Then("the cross-business E2E project should keep its remembered theme links", async function () {
  const expectedNames = themeState(this).rememberedProjectThemeNames.get(CROSS_BUSINESS_PROJECT_ID);
  assert.ok(expectedNames, 'Expected cross-business E2E project theme links to be remembered before this assertion');
  assert.deepEqual(await getProjectThemeNames(this, CROSS_BUSINESS_PROJECT_ID), expectedNames);
});

Then('exactly one theme named {string} should exist', async function (name) {
  const themes = await getThemes(this);
  const matches = themes.filter((theme) => theme?.name === name);
  assert.equal(matches.length, 1, `Expected exactly one theme named '${name}', found ${matches.length}`);
});

Then('theme {string} should still exist', async function (name) {
  const theme = await findThemeByName(this, name);
  assert.ok(theme, `Expected theme '${name}' to still exist`);
});

Then('the latest theme response name should equal {string}', function (expectedName) {
  assert.equal(themeState(this).lastThemeApiPayload?.name, expectedName);
});

Then('the latest theme response field {string} should equal {string}', function (field, expectedValue) {
  assert.equal(themeState(this).lastThemeApiPayload?.[field], validationValue(field, expectedValue));
});

Then('the persisted latest theme field {string} should equal {string}', async function (field, expectedValue) {
  const themeId = themeState(this).latestValidationThemeId;
  assert.ok(themeId, 'Expected latest validation request to store a theme id');
  const persistedTheme = await getThemeById(this, themeId);
  assert.equal(persistedTheme?.[field], validationValue(field, expectedValue));
});

Then('no invalid theme data should be persisted from the latest validation request', async function () {
  const state = themeState(this);
  if (state.latestValidationOperation === 'create') {
    const themes = await getThemes(this);
    assert.equal(
      themes.length,
      state.latestValidationThemeCountBefore,
      'Expected invalid create to leave the theme catalog size unchanged',
    );
    if (state.latestValidationSentName !== undefined && state.latestValidationSentName !== null) {
      assert.equal(
        themes.filter((theme) => theme?.name === state.latestValidationSentName).length,
        0,
        `Expected invalid create not to persist theme name '${state.latestValidationSentName}'`,
      );
    }
    return;
  }

  if (state.latestValidationOperation === 'update') {
    const persistedTheme = await getThemeById(this, state.latestValidationThemeId);
    for (const field of ['name', 'sdg_code', 'icon', 'description', 'color', 'display_order']) {
      assert.equal(persistedTheme?.[field], state.latestValidationOriginalTheme?.[field], `Expected invalid update to preserve ${field}`);
    }
    return;
  }

  assert.fail(`Unsupported validation operation '${state.latestValidationOperation}'`);
});
