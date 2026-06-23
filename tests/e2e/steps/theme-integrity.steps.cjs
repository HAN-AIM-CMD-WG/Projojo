const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

const { Given, Then, When } = require('@qavajs/core');

const { BACKEND_URL } = require('../support/test-data.cjs');

const TEACHER_USER_ID = '20000000-0000-4000-8000-000000000001';
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
  if (existingTheme) return existingTheme;

  const payload = await createTheme(name);
  assert.equal(
    lastThemeApiStatus,
    201,
    `Expected setup create for '${name}' to return 201, received ${lastThemeApiStatus}: ${JSON.stringify(payload)}`,
  );
  return payload;
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

Then('the seed file should declare exactly the expected six theme names once', function () {
  for (const expectedName of EXPECTED_SEED_THEME_NAMES) {
    const occurrences = inspectedText.split(`has name "${expectedName}"`).length - 1;
    assert.equal(occurrences, 1, `Expected seed theme '${expectedName}' once, found ${occurrences}`);
  }
});

Given('I am authenticated as the E2E teacher', async function () {
  const response = await fetch(`${BACKEND_URL}/auth/test/login/${TEACHER_USER_ID}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  assert.equal(response.status, 200, `Expected E2E teacher login to return 200, received ${response.status}`);

  const payload = await response.json();
  assert.equal(payload?.user?.type, 'teacher', 'Expected test login to authenticate a teacher');
  assert.ok(payload?.access_token, 'Expected test login to return an access token');
  authToken = payload.access_token;
});

Given('theme {string} exists', async function (name) {
  assert.ok(authToken, 'Expected an authenticated teacher before creating setup themes');
  await ensureTheme(name);
});

When('I create a theme named {string}', async function (name) {
  assert.ok(authToken, 'Expected an authenticated teacher before creating a theme');
  await createTheme(name);
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