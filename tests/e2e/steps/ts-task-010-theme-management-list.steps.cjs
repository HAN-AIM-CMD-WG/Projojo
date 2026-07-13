const assert = require('node:assert/strict');

const { Given, Then, When } = require('@qavajs/core');

const {
  BACKEND_URL,
  FRONTEND_URL,
  E2E_TEACHER_ID,
  E2E_STUDENT_ID,
  PROOF_SUPERVISOR_USER_ID,
} = require('../support/test-data.cjs');
const { stubThemesEndpoint } = require('../support/theme-stub.cjs');

const TEACHER_PAGE_URL = `${FRONTEND_URL}/teacher`;

const THEME_ERROR_MESSAGE = "Er is iets misgegaan bij het ophalen van de thema's.";

const ROLE_USER_IDS = {
  teacher: E2E_TEACHER_ID,
  student: E2E_STUDENT_ID,
  supervisor: PROOF_SUPERVISOR_USER_ID,
};

// Deliberately supplied to the stub in an unsorted order, with a display_order
// tie (3) whose names are NOT alphabetical, so AC-2 truly proves the list is
// rendered sorted by display_order then name rather than in received order.
const LONG_DESCRIPTION =
  'Dit is een opzettelijk zeer lange themabeschrijving die ruim voorbij de afkapgrens loopt zodat de weergave de tekst zichtbaar moet inkorten in de lijst.';

const SAMPLE_THEMES = [
  { id: 'ts010-onderwijs', name: 'Onderwijs', sdg_code: 'SDG4', icon: 'school', color: '#E91E63', display_order: 6, description: 'Educatie en kennisoverdracht.' },
  { id: 'ts010-bravo', name: 'Bravo Thema', sdg_code: 'SDG9', icon: 'lightbulb', color: '#9C27B0', display_order: 3, description: 'Beschrijving bravo.' },
  { id: 'ts010-duurzaamheid', name: 'Duurzaamheid', sdg_code: 'SDG12', icon: 'eco', color: '#4CAF50', display_order: 1, description: 'Duurzame praktijken.' },
  { id: 'ts010-water', name: 'Water', sdg_code: 'SDG14', icon: 'water_drop', color: '#00BCD4', display_order: 5, description: 'Waterbeheer en biodiversiteit.' },
  { id: 'ts010-alpha', name: 'Alpha Thema', sdg_code: 'SDG2', icon: 'restaurant', color: '#FF9800', display_order: 3, description: 'Beschrijving alpha.' },
  { id: 'ts010-klimaat', name: 'Klimaat & Milieu', sdg_code: 'SDG13', icon: 'public', color: '#2196F3', display_order: 2, description: LONG_DESCRIPTION },
];

// Same comparator the component must apply: display_order asc, then name.
const EXPECTED_SORTED_NAMES = [...SAMPLE_THEMES]
  .sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999) || a.name.localeCompare(b.name))
  .map((theme) => theme.name);

function page(world) {
  const current = world?.playwright?.page;
  assert.ok(current, 'Expected the qavajs world to expose playwright.page');
  return current;
}

function hexToRgb(hex) {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

async function loginToken(userId) {
  const response = await fetch(`${BACKEND_URL}/auth/test/login/${userId}`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  assert.equal(response.status, 200, `Expected test login for ${userId} to return 200, received ${response.status}`);
  const payload = await response.json();
  assert.ok(payload?.access_token, `Expected test login for ${userId} to return an access_token`);
  return payload.access_token;
}

async function authenticateInBrowser(world, role) {
  const userId = ROLE_USER_IDS[role];
  assert.ok(userId, `Unknown TS-task-010 role '${role}'`);
  const token = await loginToken(userId);
  await page(world).goto(FRONTEND_URL);
  await page(world).evaluate((authToken) => localStorage.setItem('token', authToken), token);
}

async function readThemeRowsByName(world) {
  const rows = await page(world).getByTestId('theme-row').all();
  const byName = {};
  for (const row of rows) {
    const name = (await row.getByTestId('theme-name').innerText()).trim();
    byName[name] = row;
  }
  return { rows, byName };
}

Given('I am authenticated in the browser as the TS-task-010 {word}', async function (role) {
  await authenticateInBrowser(this, role);
});

Given('the themes endpoint returns the TS-task-010 sample catalog', async function () {
  await stubThemesEndpoint(page(this), { status: 200, body: SAMPLE_THEMES });
});

Given('the themes endpoint returns the TS-task-010 sample catalog after a delay', async function () {
  await stubThemesEndpoint(page(this), { status: 200, body: SAMPLE_THEMES, delayMs: 2000 });
});

Given('the themes endpoint returns no themes', async function () {
  await stubThemesEndpoint(page(this), { status: 200, body: [] });
});

Given('the themes endpoint fails', async function () {
  await stubThemesEndpoint(page(this), { status: 500, body: { detail: 'boom' } });
});

When('I open the TeacherPage', async function () {
  await page(this).goto(TEACHER_PAGE_URL);
});

Then('the themes management section should be visible', async function () {
  const section = page(this).getByTestId('theme-management');
  await section.waitFor({ state: 'visible' });
  assert.equal(await section.isVisible(), true, 'Expected the themes management section to be visible');
  await assert.doesNotReject(
    page(this).getByRole('heading', { name: "Thema's" }).waitFor({ state: 'visible' }),
    'Expected a "Thema\'s" heading in the themes section',
  );
});

Then('the themes management section should not be visible', async function () {
  const section = page(this).getByTestId('theme-management');
  // After the redirect React unmounts TeacherPage (and its theme section); wait
  // for that to settle rather than sampling the DOM mid-transition.
  await section.waitFor({ state: 'detached', timeout: 10_000 });
  assert.equal(
    await section.count(),
    0,
    'Expected no themes management section to be rendered',
  );
});

Then('the theme list should show every sample theme sorted by display order then name', async function () {
  await page(this).getByTestId('theme-row').first().waitFor({ state: 'visible' });
  const renderedNames = (await page(this).getByTestId('theme-name').allInnerTexts()).map((name) => name.trim());
  assert.deepEqual(
    renderedNames,
    EXPECTED_SORTED_NAMES,
    `Expected themes rendered sorted by display_order then name.\n  expected: ${JSON.stringify(EXPECTED_SORTED_NAMES)}\n  actual:   ${JSON.stringify(renderedNames)}`,
  );
});

Then('every theme row should show its color swatch, icon, name, SDG code and description', async function () {
  await page(this).getByTestId('theme-row').first().waitFor({ state: 'visible' });
  const { rows, byName } = await readThemeRowsByName(this);
  assert.equal(rows.length, SAMPLE_THEMES.length, `Expected ${SAMPLE_THEMES.length} theme rows, found ${rows.length}`);

  for (const theme of SAMPLE_THEMES) {
    const row = byName[theme.name];
    assert.ok(row, `Expected a rendered row for theme '${theme.name}'`);

    const swatch = row.getByTestId('theme-swatch');
    assert.equal(await swatch.isVisible(), true, `Expected a color swatch for '${theme.name}'`);
    const backgroundColor = await swatch.evaluate((el) => getComputedStyle(el).backgroundColor);
    assert.equal(backgroundColor, hexToRgb(theme.color), `Expected swatch for '${theme.name}' to use color ${theme.color}`);

    assert.equal((await row.getByTestId('theme-icon').innerText()).trim(), theme.icon, `Expected icon '${theme.icon}' for '${theme.name}'`);
    assert.equal((await row.getByTestId('theme-sdg').innerText()).trim(), theme.sdg_code, `Expected SDG '${theme.sdg_code}' for '${theme.name}'`);

    const description = (await row.getByTestId('theme-description').innerText()).trim();
    assert.ok(description.length > 0, `Expected a visible description for '${theme.name}'`);
  }
});

Then('the long theme description should be truncated while keeping the full text accessible', async function () {
  const { byName } = await readThemeRowsByName(this);
  const row = byName['Klimaat & Milieu'];
  assert.ok(row, 'Expected the long-description theme row to be rendered');

  const cell = row.getByTestId('theme-description');
  const shown = (await cell.innerText()).trim();
  const fullText = await cell.getAttribute('title');

  assert.equal(fullText, LONG_DESCRIPTION, 'Expected the full description to remain available via the title attribute');
  assert.ok(shown.length < LONG_DESCRIPTION.length, `Expected the shown description (${shown.length}) to be shorter than the full text (${LONG_DESCRIPTION.length})`);
  assert.ok(shown.endsWith('…'), `Expected the truncated description to end with an ellipsis, got '${shown}'`);
});

Then('every theme row should have a {string} and a {string} action', async function (editLabel, deleteLabel) {
  await page(this).getByTestId('theme-row').first().waitFor({ state: 'visible' });
  const rows = await page(this).getByTestId('theme-row').all();
  assert.equal(rows.length, SAMPLE_THEMES.length, `Expected ${SAMPLE_THEMES.length} theme rows, found ${rows.length}`);

  for (const row of rows) {
    const name = (await row.getByTestId('theme-name').innerText()).trim();
    assert.equal(await row.getByRole('button', { name: editLabel }).count(), 1, `Expected a '${editLabel}' action on row '${name}'`);
    assert.equal(await row.getByRole('button', { name: deleteLabel }).count(), 1, `Expected a '${deleteLabel}' action on row '${name}'`);
  }
});

Then('a {string} button should be visible and clickable', async function (label) {
  const button = page(this).getByRole('button', { name: label });
  await button.waitFor({ state: 'visible' });
  assert.equal(await button.isVisible(), true, `Expected the '${label}' button to be visible`);
  assert.equal(await button.isEnabled(), true, `Expected the '${label}' button to be enabled`);
  // Proves it is actually clickable (no overlay/disabled state); the create flow
  // itself is TS-task-011, so we only require the action to be reachable here.
  await button.click();
});

Then('the theme loading indicator should be visible', async function () {
  const loading = page(this).getByTestId('theme-loading');
  await loading.waitFor({ state: 'visible' });
  assert.equal(await loading.isVisible(), true, 'Expected a loading indicator while themes are being fetched');
});

Then('the theme list should eventually show every sample theme', async function () {
  await page(this).getByTestId('theme-row').first().waitFor({ state: 'visible', timeout: 15_000 });
  const renderedNames = (await page(this).getByTestId('theme-name').allInnerTexts()).map((name) => name.trim());
  assert.equal(renderedNames.length, SAMPLE_THEMES.length, `Expected ${SAMPLE_THEMES.length} themes after loading, found ${renderedNames.length}`);
  assert.equal(await page(this).getByTestId('theme-loading').count(), 0, 'Expected the loading indicator to disappear once themes are loaded');
});

Then('the theme error message {string} should be visible', async function (message) {
  assert.equal(message, THEME_ERROR_MESSAGE, 'Scenario error message does not match the specified copy');
  const errorText = page(this).getByText(message, { exact: false });
  await errorText.waitFor({ state: 'visible' });
  assert.equal(await errorText.isVisible(), true, `Expected the error message '${message}' to be visible`);
  assert.equal(await page(this).getByTestId('theme-row').count(), 0, 'Expected no theme rows to be rendered in the error state');
});

Then('the theme empty message {string} should be visible', async function (message) {
  const empty = page(this).getByTestId('theme-empty');
  await empty.waitFor({ state: 'visible' });
  assert.ok((await empty.innerText()).includes(message), `Expected the empty state to show '${message}'`);
  assert.equal(await page(this).getByTestId('theme-row').count(), 0, 'Expected no theme rows in the empty state');
});

Then('I should be redirected to the not-found page', async function () {
  await page(this).waitForURL('**/not-found', { timeout: 15_000 });
  assert.ok(page(this).url().endsWith('/not-found'), `Expected to land on /not-found, current URL is ${page(this).url()}`);
});
