const assert = require('node:assert/strict');

const { Given, Then } = require('@qavajs/core');

const {
  E2E_TEACHER_ID,
  E2E_STUDENT_ID,
  PROOF_SUPERVISOR_USER_ID,
} = require('../support/test-data.cjs');
const { stubThemesEndpoint } = require('../support/theme-stub.cjs');
const { hexToRgb } = require('../support/theme-color.cjs');
const { page, authenticateInBrowser } = require('../support/e2e-session.cjs');
const {
  THEME_SEED_BASELINE,
  EXPECTED_SORTED_NAMES,
  LONG_DESCRIPTION,
  resetThemeCatalog,
} = require('../support/theme-catalog.cjs');

const THEME_ERROR_MESSAGE = "Er is iets misgegaan bij het ophalen van de thema's.";

const ROLE_USER_IDS = {
  teacher: E2E_TEACHER_ID,
  student: E2E_STUDENT_ID,
  supervisor: PROOF_SUPERVISOR_USER_ID,
};

// The deterministic baseline catalog, its expected sorted order, and the long
// description live in the shared theme-catalog helper, so the real-backend reset
// (AC-1..AC-4) and the stub-based states (AC-5..AC-7) assert against one source
// of truth. Aliased locally to keep the assertion steps below unchanged.
const SAMPLE_THEMES = THEME_SEED_BASELINE;

// Loading/error/empty states cannot be produced against a healthy backend, so
// those scenarios still stub GET /themes/. The stub body needs stable ids for
// React keys; the real-backend scenarios receive ids from the backend on create.
const STUB_CATALOG = SAMPLE_THEMES.map((theme, index) => ({ id: `ts010-stub-${index}`, ...theme }));

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
  const userId = ROLE_USER_IDS[role];
  assert.ok(userId, `Unknown TS-task-010 role '${role}'`);
  await authenticateInBrowser(this, userId);
});

Given('the theme catalog contains only the TS-010 baseline themes', async function () {
  // Real backend: wipe the live catalog and recreate the deterministic baseline
  // via the teacher-authenticated theme API, so the list assertions run against
  // the real GET /themes/ response rather than a stubbed one.
  await resetThemeCatalog();
});

Given('the themes endpoint returns the TS-task-010 sample catalog after a delay', async function () {
  await stubThemesEndpoint(page(this), { status: 200, body: STUB_CATALOG, delayMs: 2000 });
});

Given('the themes endpoint fails', async function () {
  await stubThemesEndpoint(page(this), { status: 500, body: { detail: 'boom' } });
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

    // Since TS-task-022 the SDG cell renders SdgBadge rather than the raw code, so
    // a code now shows as its goal number inside a badge. Still the same assertion -
    // the row shows this theme's SDG - read off what the teacher actually sees.
    const renderedSdgNumbers = (await row.getByTestId('theme-sdg').getByTestId('sdg-badge-number').allInnerTexts())
      .map((number) => number.trim());
    assert.deepEqual(
      renderedSdgNumbers,
      theme.sdg_code.split(',').map((code) => code.replace('SDG', '')),
      `Expected SDG '${theme.sdg_code}' for '${theme.name}'`,
    );

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
    // Require the per-row accessible name so a screen reader user knows which
    // theme each action belongs to (exact match, not a substring).
    assert.equal(
      await row.getByRole('button', { name: `${editLabel}: ${name}`, exact: true }).count(),
      1,
      `Expected a '${editLabel}' action labelled for row '${name}'`,
    );
    assert.equal(
      await row.getByRole('button', { name: `${deleteLabel}: ${name}`, exact: true }).count(),
      1,
      `Expected a '${deleteLabel}' action labelled for row '${name}'`,
    );
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
