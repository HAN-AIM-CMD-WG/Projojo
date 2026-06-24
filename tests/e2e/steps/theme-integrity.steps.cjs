const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

const { Given, Then, When } = require('@qavajs/core');

const { BACKEND_URL, PROOF_PROJECT_ID } = require('../support/test-data.cjs');

const TEACHER_USER_ID = '20000000-0000-4000-8000-000000000001';
const STUDENT_USER_ID = '20000000-0000-4000-8000-000000000002';
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

let authToken = null;
let lastThemeApiStatus = null;
let lastThemeApiPayload = null;
let inspectedText = '';
const themesByName = new Map();

async function themeApi(pathname, options = {}) {
  const headers = {
    Accept: 'application/json',
    ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BACKEND_URL}${pathname}`, { ...options, headers });
  const text = await response.text();
  lastThemeApiStatus = response.status;
  lastThemeApiPayload = text ? JSON.parse(text) : null;
  return lastThemeApiPayload;
}

async function getThemes() {
  const payload = await themeApi('/themes/');
  assert.equal(lastThemeApiStatus, 200, `Expected GET /themes/ to return 200, received ${lastThemeApiStatus}`);
  assert.ok(Array.isArray(payload), 'Expected GET /themes/ to return an array');
  return payload;
}

async function findThemeByName(name) {
  const themes = await getThemes();
  return themes.find((theme) => theme?.name === name) ?? null;
}

async function createTheme(name) {
  const fixture = themeFixtures[name] ?? {
    sdg_code: 'SDG1',
    icon: 'label',
    description: `E2E theme fixture for ${name}`,
    color: '#4CAF50',
    display_order: 99,
  };

  return themeApi('/themes/', {
    method: 'POST',
    body: JSON.stringify({ name, ...fixture }),
  });
}

async function ensureTheme(name) {
  const existingTheme = await findThemeByName(name);
  if (existingTheme) {
    themesByName.set(name, existingTheme);
    return existingTheme;
  }

  const payload = await createTheme(name);
  assert.equal(
    lastThemeApiStatus,
    201,
    `Expected setup create for '${name}' to return 201, received ${lastThemeApiStatus}: ${JSON.stringify(payload)}`,
  );
  themesByName.set(name, payload);
  return payload;
}

async function authenticateAs(userId, expectedType) {
  const response = await fetch(`${BACKEND_URL}/auth/test/login/${userId}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  assert.equal(response.status, 200, `Expected E2E ${expectedType} login to return 200, received ${response.status}`);

  const payload = await response.json();
  assert.equal(payload?.user?.type, expectedType, `Expected test login to authenticate a ${expectedType}`);
  assert.ok(payload?.access_token, 'Expected test login to return an access token');
  authToken = payload.access_token;
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
  inspectedText = await fs.readFile(path.join(REPO_ROOT, 'projojo_backend/db/schema.tql'), 'utf8');
});

Then('the theme name attribute should be required and unique', function () {
  const themeBlock = inspectedText.match(/entity\s+theme,[\s\S]*?plays\s+hasTheme:theme\s+@card\(0\.\.\);/)?.[0] ?? '';

  assert.match(
    themeBlock,
    /owns\s+name\s+@card\(1\)\s+@unique\s*,/,
    'Expected theme entity to declare `owns name @card(1) @unique,`',
  );
});

When('I inspect the TypeDB seed file for theme data', async function () {
  inspectedText = await fs.readFile(path.join(REPO_ROOT, 'projojo_backend/db/seed.tql'), 'utf8');
});

Then('the seed file should declare each expected theme name once and no duplicate theme names', function () {
  const themeEntityBlocks = [...inspectedText.matchAll(/^\s*\$theme\w*\s+isa\s+theme,[\s\S]*?;/gm)].map((match) => match[0]);
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
  await authenticateAs(TEACHER_USER_ID, 'teacher');
});

Given('I am authenticated as the E2E student', async function () {
  await authenticateAs(STUDENT_USER_ID, 'student');
});

Given('I do not send a JWT token to the theme API', function () {
  authToken = null;
});

Given('theme {string} exists', async function (name) {
  assert.ok(authToken, 'Expected an authenticated teacher before creating setup themes');
  await ensureTheme(name);
});

When('I create a theme named {string}', async function (name) {
  await createTheme(name);
});

When('I request the public theme collection', async function () {
  await themeApi('/themes/');
});

When('I request public theme {string} by id', async function (name) {
  const theme = themesByName.get(name) ?? await findThemeByName(name);
  assert.ok(theme?.id, `Expected theme '${name}' to exist before requesting it by id`);

  await themeApi(`/themes/${theme.id}`);
});

When('I request public theme id {string}', async function (themeId) {
  await themeApi(`/themes/${themeId}`);
});

When('I request the public themes for the E2E proof project', async function () {
  await themeApi(`/themes/project/${PROOF_PROJECT_ID}`);
});

When('I call the theme API with method {string} and path {string}', async function (method, pathname) {
  await themeApi(pathname, {
    method,
    body: requestBodyFor(method, pathname),
  });
});

When('I call the teacher-only theme API with method {string} and path {string} using theme {string}', async function (method, pathTemplate, name) {
  let pathname = pathTemplate;
  if (pathTemplate.includes('{theme_id}')) {
    const theme = themesByName.get(name) ?? await findThemeByName(name);
    assert.ok(theme?.id, `Expected theme '${name}' to exist before calling ${method} ${pathTemplate}`);
    pathname = pathTemplate.replace('{theme_id}', theme.id);
  }

  await themeApi(pathname, {
    method,
    body: requestBodyFor(method, pathname),
  });
});

When("I replace the E2E proof project's theme links with no themes", async function () {
  await themeApi(`/themes/project/${PROOF_PROJECT_ID}`, {
    method: 'PUT',
    body: JSON.stringify({ theme_ids: [] }),
  });
});

When('I rename theme {string} to {string}', async function (currentName, newName) {
  assert.ok(authToken, 'Expected an authenticated teacher before updating a theme');
  const theme = await findThemeByName(currentName);
  assert.ok(theme?.id, `Expected theme '${currentName}' to exist before rename`);

  await themeApi(`/themes/${theme.id}`, {
    method: 'PUT',
    body: JSON.stringify({ name: newName }),
  });
});

Then('the latest theme API response status should be {int}', function (expectedStatus) {
  assert.equal(lastThemeApiStatus, expectedStatus, `Expected latest theme API status to be ${expectedStatus}, received ${lastThemeApiStatus}`);
});

Then('the latest theme API response should be a list', function () {
  assert.ok(Array.isArray(lastThemeApiPayload), `Expected latest theme API response to be a list, received ${JSON.stringify(lastThemeApiPayload)}`);
});

Then('the latest API error detail should equal {string}', function (expectedDetail) {
  assert.equal(lastThemeApiPayload?.detail, expectedDetail);
});

Then('exactly one theme named {string} should exist', async function (name) {
  const themes = await getThemes();
  const matches = themes.filter((theme) => theme?.name === name);
  assert.equal(matches.length, 1, `Expected exactly one theme named '${name}', found ${matches.length}`);
});

Then('theme {string} should still exist', async function (name) {
  const theme = await findThemeByName(name);
  assert.ok(theme, `Expected theme '${name}' to still exist`);
});

Then('the latest theme response name should equal {string}', function (expectedName) {
  assert.equal(lastThemeApiPayload?.name, expectedName);
});